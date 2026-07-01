Enterprise Virtual Event Platform

A high-performance, modular monolithic web application engineered to host premium virtual events, manage transactional ticketing inventory under concurrent load, and facilitate real-time attendee interactions through secure WebSockets and near-zero latency WebRTC streaming.

1. System Architecture: The Modular Monolith

Rushing into a distributed microservices setup early in a product's lifecycle introduces complex distributed tracing, network latency overhead, and massive deployment complexity. The Virtual Event Platform addresses these hurdles by utilizing a Modular Monolith pattern.

graph TD
    subgraph Express_App [Express.js Monolithic Server]
        API_Router[API Gateway Router]
        Auth_M[Auth Module]
        Catalog_M[Catalog Module]
        Ticketing_M[Ticketing Module]
        Realtime_M[Realtime Module]
        
        API_Router --> Auth_M
        API_Router --> Catalog_M
        API_Router --> Ticketing_M
        API_Router --> Realtime_M
    end

    subgraph Database [MongoDB Cluster]
        Users_Col[(Users & Tokens)]
        Events_Col[(Events & Sessions)]
        Orders_Col[(Orders & Tickets)]
        Chats_Col[(Chats & Polls)]
    end

    Auth_M === Users_Col
    Catalog_M === Events_Col
    Ticketing_M === Orders_Col
    Realtime_M === Chats_Col

    %% Custom Styling
    classDef express fill:#1c1c24,stroke:#3f3f46,stroke-width:1px,color:#d4d4d8;
    classDef module fill:#27272a,stroke:#6366f1,stroke-width:2px,color:#fff;
    classDef database fill:#09090b,stroke:#22c55e,stroke-width:1.5px,color:#d4d4d8;
    
    class Express_App,API_Router express;
    class Auth_M,Catalog_M,Ticketing_M,Realtime_M module;
    class Users_Col,Events_Col,Orders_Col,Chats_Col database;


Architectural Rules of Isolation

To mimic a microservices architecture while maintaining the deployment simplicity of a single Node.js runtime, we enforce strict domain boundaries:

Directory-Level Boundaries: All core business domains live within isolated directories (auth, catalog, ticketing, realtime).

No Cross-Database Joins: Mongoose references (ref) across different module schemas are strictly forbidden. For example, Order.js in the Ticketing module references the attendee as a standard ObjectId string, but never defines ref: 'User'.

API Composition for Cross-Module Queries: When the Catalog controller (eventController.js) needs to show the organizer's details for an event, it does not query the User schema directly. Instead, it queries the Auth module's public interface (server/src/modules/auth/index.js):

import * as authModule from '../../auth/index.js';
const organizerDetails = await authModule.getUserById(event.createdBy);


2. Core Feature Workflows & Lifecycles

Flow A: Secured Identity & Token Rotation Lifecycle (Auth Module)

To protect against both Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF) attack vectors, our authentication system implements double-layered token security via cryptographically rotated JWTs stored in HTTP-Only cookies.

sequenceDiagram
    autonumber
    actor Client as Browser Client
    participant Router as API Gateway Router
    participant Controller as Auth Controller
    participant DB as MongoDB Database

    Client->>Router: POST /api/auth/google<br/>(Payload: { tokenId })
    Router->>Controller: Route Request
    Note over Controller: Verifies ID Token using Google Client Library
    Controller->>DB: Find user by oauthId (sub)
    DB-->>Controller: User Record (Exists / Not Found)
    
    alt User Not Found
        Controller->>DB: Create User Document (role: 'attendee')
        DB-->>Controller: Confirm Saved
    end

    Note over Controller: Generates Access Token (15m)<br/>& Refresh Token (7d)
    Controller->>DB: Save Refresh Token document (TTL-indexed)
    DB-->>Controller: Confirm Saved
    
    Controller-->>Client: 200 OK (User Profile)<br/>Set-Cookie: accessToken (HttpOnly, SameSite=Strict)<br/>Set-Cookie: refreshToken (HttpOnly, SameSite=Strict)


OAuth Verification: The React frontend authenticates the user via the Google Identity Services SDK, obtaining a secure token. This credential is sent to the backend at POST /api/auth/google.

Backend Authentication: The googleLogin controller verifies the token with Google's public key certificate using the google-auth-library.

Session Provisioning & Cookies:

Access Token: Generated with a $15\text{ minutes}$ expiration window.

Refresh Token: Saved in the RefreshTokens MongoDB collection and set for a $7\text{ days}$ expiration window.

Injected Cookies: Both tokens are injected into HTTP-Only, Secure, SameSite=Strict cookies. The browser protects these tokens from being read by client-side JavaScript, mitigating XSS security vulnerabilities.

Flow B: Case-Insensitive Debounced Event Search (Catalog Module)

Querying the event directory with high-frequency keystrokes is a common performance bottleneck. The platform handles searching with client-side debouncing and optimized case-insensitive database queries.

sequenceDiagram
    autonumber
    actor User as Search Input UI
    participant Debounce as useDebounce Hook
    participant Catalog as useCatalog Hook
    participant Controller as Event Controller
    participant DB as MongoDB Database

    User->>Debounce: Types "R" (starts 500ms timer)
    User->>Debounce: Types "e" at 200ms (cancels Timer 1, starts Timer 2)
    Note over Debounce: User pauses typing for 500ms
    Debounce-->>Catalog: Propagates debouncedSearch ("Re")
    Catalog->>Controller: GET /api/events?keyword=Re
    Controller->>DB: Event.find({ title: /Re/i, status: 'published' })
    Note over DB: Evaluates search against B-Tree indexed 'title' field
    DB-->>Controller: Matched Document Array (lean JSON)
    Controller-->>Catalog: JSON Payload (200 OK)
    Catalog-->>User: Re-renders Event Grid


Debounce Buffer: When an attendee types into the search bar, the useDebounce hook intercepts the state update. If another key is pressed before the $500\text{ ms}$ threshold is met, the active setTimeout timer is canceled:

return () => clearTimeout(timer); // Triggers clean closure inside useEffect


Execution: Once the user stops typing for $500\text{ ms}$, the hook updates its returned value, which triggers the useCatalog hook to dispatch an HTTP GET request containing ?keyword=React.

Database Performance: The backend controller (eventController.js) performs a case-insensitive regex query against MongoDB. Because the title field inside Event.js is mapped with index: true, MongoDB resolves the query in $O(\log N)$ time using its index tree, avoiding a full table scan.

Flow C: Double-Booking Protection & SQS Release Loop (Ticketing Module)

When high-demand tickets go on sale, concurrent requests can cause double-booking. We mitigate this using a Pessimistic Atomic Lock on MongoDB and an asynchronous, delayed AWS SQS Expiration Queue.

sequenceDiagram
    autonumber
    actor Attendee as Attendee Browser
    participant Controller as Checkout Controller
    participant DB as MongoDB Database
    participant SQS as AWS SQS (LocalStack)
    participant Worker as SQS Expiration Worker

    Attendee->>Controller: POST /api/ticketing/checkout<br/>(Payload: { eventId, ticketTypeId })
    
    Note over Controller: Initiate Mongoose Transaction
    Controller->>DB: findOneAndUpdate({ soldCount + lockedCount < capacity }, { $inc: { lockedCount: 1 } })
    
    alt Capacity Available
        DB-->>Controller: Confirm Lock Acquired & Return Updated TicketType
        Controller->>DB: Create pending Order (expiresAt: now + 10m)
        DB-->>Controller: Save Order Document
        Controller->>SQS: SendMessageCommand (DelaySeconds: 600)<br/>Payload: { orderId }
        SQS-->>Controller: Message Queued
        Controller-->>Attendee: Return pending Order Details (10m countdown starts)
    else Capacity Sold Out
        DB-->>Controller: Return null
        Note over Controller: Abort Transaction
        Controller-->>Attendee: Return 409 Conflict (Sold Out)
    end

    Note over SQS: 10 Minutes Elapse (Message becomes visible)
    SQS->>Worker: Poll & Consume Message { orderId }
    Worker->>DB: Find Order by ID
    DB-->>Worker: Order Record
    
    alt Order Status is still 'pending'
        Worker->>DB: Transition status to 'expired'
        Worker->>DB: Decrement lockedCount by 1 ($inc: { lockedCount: -1 })
        DB-->>Worker: Document Updated
        Note over Worker: Delete message from SQS queue
    else Order is 'paid'
        Note over Worker: No action needed. Delete message.
    end


Atomic Lock Gate: When a user initiates a checkout, the ticketing system must verify that remaining capacity exists. To prevent double-booking, the check and reservation step are performed atomically in MongoDB using findOneAndUpdate:

const updatedType = await TicketType.findOneAndUpdate(
  {
    _id: ticketTypeId,
    $expr: { $lt: [{ $add: ["$soldCount", "$lockedCount"] }, "$capacity"] }
  },
  { $inc: { lockedCount: 1 } },
  { new: true }
);


SQS Expiration Queue: If the inventory update succeeds, a pending Order is generated, and a delayed message is published to AWS SQS with a $600\text{ seconds}$ ($10\text{ minutes}$) delay.

Asynchronous Release Worker:

At exactly $10\text{ minutes}$, the message becomes visible to our ticketExpirationWorker.js process.

If the order status is still 'pending', the worker automatically transitions the order to 'expired' and decrements the lockedCount of the TicketType document, returning the seat to the open market.

Flow D: Real-Time State Synced Interactivity (WebSockets)

Persistent real-time components (such as live chats and interactive polls) are powered by a secure, room-scoped Socket.io gateway.

sequenceDiagram
    autonumber
    actor Client as React View Layer
    participant Provider as SocketProvider
    participant WS as Socket.io Gateway
    participant Handler as Poll Handler
    participant DB as MongoDB Database

    Client->>Provider: Mount WatchRoom
    Note over Provider: Extract active user from context
    Provider->>WS: Establish secure WebSockets connection
    Note over WS: Connection Handshake<br/>HTTP-Only cookies sent automatically
    WS->>Provider: Handshake Verified (accessToken verified)<br/>Upgrade to ws:// established
    
    Provider->>WS: Join Stage Room (eventId: 'event_777')
    WS->>WS: Add socket to room "event_777"
    
    Client->>WS: submit_vote (pollId, optionId)
    WS->>Handler: Intercept vote packet
    Handler->>DB: findOneWithDuplicatesCheck & Atomic $inc votes + push votedUsers
    DB-->>Handler: Updated Poll Document
    Handler->>WS: Emit 'poll_updated' to room "event_777"
    WS-->>Client: Receive live poll ratios (Dynamic CSS animated sliding bars redraw)


Secure Handshake Connection: On mounting the WatchRoom page, the SocketProvider establishes a socket channel. It sets withCredentials: true so the browser automatically appends the HTTP-Only JWT cookies to the initial HTTP handshake headers.

Token Authentication: The Socket.io backend middleware extracts the cookie headers, decodes the user profile, and registers the connection context securely:

socket.user = decodedUser;


Atomic Real-Time Actions:

When an attendee submits a vote, the client emits submit_vote containing the pollId and optionId.

The backend handler (pollHandler.js) performs an atomic update to increment the vote count and add the user's ID to votedUsers to block double-voting:

const updatedPoll = await Poll.findOneAndUpdate(
  { _id: pollId, "options._id": optionId },
  { $inc: { "options.$.votes": 1 }, $push: { votedUsers: userId } },
  { new: true }
);


The updated state is then broadcast to everyone in the room:

io.to(`event_${eventId}`).emit('poll_updated', { _id: updatedPoll._id, options: updatedPoll.options });


Flow E: Near-Zero Latency WebRTC Video Streaming

For ultra-low latency broadcasting, the platform coordinates raw peer-to-peer browser connections using WebSockets as the signaling intermediary.

sequenceDiagram
    autonumber
    actor Broadcaster as Backstage (Broadcaster)
    participant WS as Socket.io Signaling
    actor Viewer as WatchRoom (Viewer)

    Broadcaster->>Broadcaster: Acquire local video/audio (getUserMedia)
    Broadcaster->>WS: join_stream (sessionId)
    Viewer->>WS: join_stream (sessionId)
    WS-->>Broadcaster: peer_joined (handshake coordinate: peerId)
    
    Broadcaster->>Broadcaster: Instantiate local RTCPeerConnection
    Broadcaster->>Broadcaster: Create SDP Offer
    Broadcaster->>WS: webrtc_offer (targetPeerId, sdp)
    WS-->>Viewer: webrtc_offer (senderPeerId, sdp)
    
    Viewer->>Viewer: Instantiate local RTCPeerConnection
    Viewer->>Viewer: Set remote description (SDP Offer)
    Viewer->>Viewer: Create SDP Answer
    Viewer->>WS: webrtc_answer (targetPeerId, sdp)
    WS-->>Broadcaster: webrtc_answer (senderPeerId, sdp)
    Broadcaster->>Broadcaster: Set remote description (SDP Answer)
    
    Par: Asynchronous ICE Traversal
        Broadcaster->>WS: webrtc_ice_candidate
        WS-->>Viewer: webrtc_ice_candidate
    and
        Viewer->>WS: webrtc_ice_candidate
        WS-->>Broadcaster: webrtc_ice_candidate
    end
    
    Note over Broadcaster, Viewer: STUN traversal resolved. Direct P2P Media established!
    Broadcaster-->>Viewer: Direct Peer-to-Peer Encrypted Live HD Stream (<200ms latency)


Device Access: The broadcaster accesses their local hardware camera using getUserMedia and binds it to a local monitoring layout.

SDP Handshake Negotiation:

The broadcaster emits 'join_stream'. When a viewer joins, they emit 'join_stream', which triggers 'peer_joined' on the broadcaster's side.

The broadcaster creates a new RTCPeerConnection for that specific viewer. It generates a Session Description Protocol (SDP) Offer containing their local media codecs and relays it through our Socket.io server to the viewer.

The viewer instantiates their own connection, loads the offer, generates an SDP Answer, and sends it back to the broadcaster.

NAT Traversal (STUN): Asynchronously, both clients query our STUN servers to locate their public IP address and port mapping. They exchange these coordinates (ICE Candidates) over WebSockets.

P2P Streaming: Once a network path is matched, the browsers connect directly to stream HD video and audio, bypassing our application servers completely.

3. Environment Variables Guide

The system configuration is driven by the environment variables loaded from the .env file at server startup. Below is a streamlined roadmap outlining the variables found in your .env.example.

Category

Key

Description / Routing Resolution

Orchestration

COMPOSE_PROJECT_NAME

Project identifier used to prefix active Docker services and volumes.

Host Ports

PORT / HOST_PORT_*

Port mappings matching the physical interface access keys (Backend: 5000, MongoDB: 27018).

Databases

MONGO_URI

mongodb://mongo:27017/... (inside container) or mongodb://127.0.0.1:27018/... (running bare-metal).

Encryption

JWT_ACCESS_SECRET  JWT_REFRESH_SECRET

Cryptographic salts used to sign rotating JSON Web Tokens securely.

OAuth

GOOGLE_* / GITHUB_*

Production API keys registered within developer identity consoles.

Queues (AWS)

AWS_*  SQS_ENDPOINT  SQS_TICKET_EXPIRATION_QUEUE_URL

Configures client routing keys. Endpoint resolves to LocalStack service boundary container http://aws:4566 in Docker or http://127.0.0.1:4566 locally.

Gateway (Payments)

SAFEPAY_*

Webhook verification signing secrets and API keys running in sandbox mock modes.

4. Setup & Installation Guide

Follow these steps to set up and run the entire development environment locally.

Prerequisites

Node.js: v18.x or higher

Docker & Docker Compose: Installed and running

Step 1: Clone and Configure Environment Variables

Clone the repository and navigate to the backend folder:

cd server


Copy .env.example to a new file named .env:

cp .env.example .env


Open .env and fill in your custom configurations. If you are running Node on your host machine rather than inside Docker, update your hostnames to match your local ports:

Change MONGO_URI to mongodb://127.0.0.1:27018/virtual-events

Change SQS_ENDPOINT to http://127.0.0.1:4566

Change SQS_TICKET_EXPIRATION_QUEUE_URL to http://127.0.0.1:4566/000000000000/TicketReleaseQueue

Step 2: Spin Up Docker Services (MongoDB & LocalStack)

Start the background database and AWS LocalStack services in detached mode:

docker compose up -d


Step 3: Initialize the LocalStack SQS Queue

Because LocalStack is an ephemeral test environment, its SQS instance starts empty. Create your ticket expiration queue by running this command:

docker exec virtual-events-aws awslocal sqs create-queue --queue-name TicketReleaseQueue


Step 4: Install Dependencies and Start the Node.js Server

Install the backend node modules:

npm install


Run the application in development mode:

npm run dev


Step 5: Verify the Connection Status

Open your console output. A healthy server startup should log these events:

[2026-07-01 14:15:00] INFO: MongoDB Connected: 127.0.0.1
[2026-07-01 14:15:01] INFO: LocalStack SQS Queue verified/created successfully
[2026-07-01 14:15:01] INFO: Safepay initialized in [SANDBOX] mode
[2026-07-01 14:15:01] INFO: Ticket Expiration SQS Worker started successfully
[2026-07-01 14:15:01] INFO: Server successfully initialized on port: 5000


5. Architectural Health Checks

The Virtual Event Platform includes built-in configurations to maintain clean code and prevent performance issues as the application scales.

Memory Leak Protections: Persistent real-time event handlers use useEffect cleanup blocks to tear down listeners (socket.off) and stop local hardware capture loops (track.stop()) on component unmount.

Database Optimizations: We use MongoDB indexes and Mongoose's .lean() option to resolve queries in $O(\log N)$ time, bypassing full table scans.

Thread Safety: Atomic database operators like $inc and Mongoose's findOneAndUpdate ensure thread-safe transactions and prevent race conditions.

XSS Defenses: Storing JWT credentials inside HTTP-Only session cookies prevents client-side scripts from reading tokens, securing your authentication pipeline against common injection attacks.
