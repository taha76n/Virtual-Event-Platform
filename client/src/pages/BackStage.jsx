import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { MonitorPlay, Camera, Mic, LogOut, ShieldAlert } from 'lucide-react';

const Backstage = () => {
  const { sessionId } = useParams();
  const { socket, isConnected } = useSocket();

  // Local UI status tracking states
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Initializing backstage feeds...');

  // Media & WebRTC Refs (Preserved across render cycles without firing UI updates)
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({}); // Stores pc instances indexed by Viewer Socket ID: { [socketId]: RTCPeerConnection }

  // STUN Servers (Used to discover our public IP address for firewalls)
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (!socket) return;

    // Start local camera feed immediately on mount
    const startLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setStatusMessage('Camera feed active. Ready to go live!');
      } catch (err) {
        console.error('Camera capture failed:', err);
        setStatusMessage('Error: Access to camera or microphone denied.');
      }
    };

    startLocalMedia();

    // Cleanup: Stop all tracks when leaving backstage to release the hardware camera light!
    return () => {
      stopLocalStream();
    };
  }, [socket]);

  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    // Clean up all active P2P connections
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};
  };

  // 1. Establish Signaling Connection Loops
  const goLive = () => {
    if (!socket || !localStreamRef.current) return;

    setIsStreaming(true);
    setStatusMessage('Broadcasting Live Stream...');

    // Join the streaming room
    socket.emit('join_stream', { sessionId });

    // Listener: A new viewer has joined the room. We must initiate a connection.
    socket.on('peer_joined', async ({ peerId }) => {
      console.log('Viewer joined backstage room. Initiating handshake for peer:', peerId);
      await createPeerConnection(peerId);
    });

    // Listener: Handshake step 3 - Viewer returned an Answer SDP
    socket.on('webrtc_answer', async ({ senderPeerId, sdp }) => {
      const pc = peerConnectionsRef.current[senderPeerId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    });

    // Listener: Asynchronous ICE candidate negotiation
    socket.on('webrtc_ice_candidate', async ({ senderPeerId, candidate }) => {
      const pc = peerConnectionsRef.current[senderPeerId];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // Listener: Viewer disconnected or closed tab
    socket.on('peer_left', ({ peerId }) => {
      if (peerConnectionsRef.current[peerId]) {
        peerConnectionsRef.current[peerId].close();
        delete peerConnectionsRef.current[peerId];
        console.log('Cleaned up closed connection for viewer:', peerId);
      }
    });
  };

  // 2. Initialize a secure Peer Connection for a specific Viewer
  const createPeerConnection = async (targetPeerId) => {
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionsRef.current[targetPeerId] = pc;

    // Add local tracks (audio/video) to this connection so they get streamed to the viewer
    localStreamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current);
    });

    // ICE Candidate Gathering: Send candidates to our viewer via the signaling server
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_ice_candidate', {
          targetPeerId,
          candidate: event.candidate
        });
      }
    };

    // Create the SDP Offer, apply it locally, and send it to the viewer
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socket.emit('webrtc_offer', {
        targetPeerId,
        sdp: offer
      });
    } catch (err) {
      console.error('Failed to create SDP Offer:', err);
    }
  };

  // Hardware controls
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setCameraActive(videoTrack.enabled);
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setMicActive(audioTrack.enabled);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 p-8 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
        
        {/* Backstage Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse"></div>
            <h2 className="text-xl font-bold text-white tracking-wide">NexusLive Backstage Studio</h2>
          </div>
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 font-semibold">
            Room Code: {sessionId}
          </span>
        </div>

        {/* Video Canvas Stage */}
        <div className="relative aspect-video w-full bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover transform -scale-x-100"
          />
          
          {/* Overlay state indicator badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase ${isStreaming ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-800 text-zinc-400'}`}>
              {isStreaming ? '• LIVE' : 'PREP ROOM'}
            </span>
          </div>

          {/* Status Message overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-lg border border-white/5 text-xs font-semibold text-zinc-200">
            {statusMessage}
          </div>
        </div>

        {/* Dynamic Studio Hardware Control Tray */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-3">
            <button 
              onClick={toggleCamera} 
              className={`p-3 rounded-xl border transition-all ${cameraActive ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'}`}
            >
              <Camera size={18} />
            </button>
            <button 
              onClick={toggleMic} 
              className={`p-3 rounded-xl border transition-all ${micActive ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'}`}
            >
              <Mic size={18} />
            </button>
          </div>

          <div className="flex gap-4">
            <Link 
              to="/dashboard" 
              onClick={stopLocalStream}
              className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white px-4 py-3 rounded-xl border border-transparent hover:border-zinc-800 transition-all"
            >
              <LogOut size={16}/> Exit Studio
            </Link>
            
            {!isStreaming ? (
              <button 
                onClick={goLive}
                disabled={!isConnected}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg shadow-violet-500/20 transition-all flex items-center gap-2"
              >
                <MonitorPlay size={16}/> Go Live on Stage
              </button>
            ) : (
              <button 
                onClick={() => {
                  stopLocalStream();
                  setIsStreaming(false);
                  setStatusMessage('Broadcast stopped. Resetting feeds...');
                }}
                className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg transition-all"
              >
                End Stream
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Backstage;