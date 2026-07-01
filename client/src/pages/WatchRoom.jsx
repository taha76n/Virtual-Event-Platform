import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { MonitorPlay, Users } from 'lucide-react';
import LivePolls from '../Components/LivePolls';
import LiveChat from '../Components/LiveChat';

const WatchRoom = () => {
  const { eventId, sessionId } = useParams();
  const { socket, isConnected } = useSocket();

  const [streamActive, setStreamActive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  // WebRTC Refs
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (!socket || !sessionId) return;

    // 1. Join stream room as a viewer
    socket.emit('join_stream', { sessionId });

    // 2. Listener: Recieve SDP Offer from Broadcaster
    socket.on('webrtc_offer', async ({ senderPeerId, sdp }) => {
      console.log('Received live feed offer from broadcaster. Generating Answer...');
      
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      // Handle incoming media tracks (Video/Audio streams from broadcaster)
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setStreamActive(true);
        }
      };

      // Gather ICE coordinates and send back to broadcaster
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc_ice_candidate', {
            targetPeerId: senderPeerId,
            candidate: event.candidate
          });
        }
      };

      // Set Remote Description (Broadcaster's SDP)
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));

      // Generate local SDP Answer, set it as Local Description, and send to broadcaster
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('webrtc_answer', {
        targetPeerId: senderPeerId,
        sdp: answer
      });
    });

    // 3. Listener: Recieve ICE candidate updates from Broadcaster
    socket.on('webrtc_ice_candidate', async ({ candidate }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // 4. Listener: Broadcaster closes connection
    socket.on('peer_left', () => {
      cleanupConnection();
    });

    return () => {
      cleanupConnection();
    };
  }, [socket, sessionId]);

  const cleanupConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  return (
    <div className="h-screen w-full bg-[#000] text-zinc-300 flex flex-col overflow-hidden font-sans">
      
      {/* Immersive Room Header */}
      <nav className="h-14 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <MonitorPlay className="text-violet-500" size={24} />
          <div className="h-4 w-px bg-zinc-850"></div>
          <span className="font-bold text-zinc-100 flex items-center gap-2 text-sm tracking-wide">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
            Stage Masterclass Room
          </span>
        </div>
      </nav>

      {/* Main Structural Grid */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Video Stream & Interactive Overlays */}
        <div className="flex-1 bg-[#000000] p-6 flex flex-col overflow-y-auto custom-scrollbar space-y-6">
          
          {/* Main Streaming video player frame */}
          <div className="aspect-video w-full max-w-4xl mx-auto bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-center relative overflow-hidden group">
            
            {/* Native Video Feed */}
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className={`w-full h-full object-cover transition-opacity duration-500 ${streamActive ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}
            />

            {/* Offline Slate overlay */}
            {!streamActive && (
              <div className="text-center">
                <MonitorPlay size={40} className="mx-auto mb-4 text-zinc-800 animate-pulse" />
                <p className="text-zinc-600 font-bold text-xs tracking-[0.2em] uppercase">Waiting for Broadcaster to Go Live...</p>
              </div>
            )}
          </div>

          {/* Interactive Polling Panel below the streaming target */}
          <div className="w-full max-w-4xl mx-auto">
            <LivePolls eventId={eventId} />
          </div>
        </div>

        {/* Right Side: Integrated Live Chat Interface */}
        <LiveChat eventId={eventId} />

      </div>
    </div>
  );
};

export default WatchRoom;