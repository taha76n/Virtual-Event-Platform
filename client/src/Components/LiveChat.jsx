import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Send, MessageSquare, ShieldAlert } from 'lucide-react';

const LiveChat = ({ eventId }) => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  
  // Ref to track the scroll container so we can snap-scroll on new messages
  const chatEndRef = useRef(null);

  // 1. Manage socket room registration and incoming message stream subscriptions
  useEffect(() => {
    if (!socket || !eventId) return;

    // Join the dedicated WebSocket room for this specific event
    socket.emit('join_event_room', { eventId });

    // Handler for incoming real-time broadcasts
    const handleNewMessage = (message) => {
      // Functional state update: guarantees we merge with the absolute latest state
      setMessages((prev) => [...prev, message]);
    };

    // Bind listener
    socket.on('new_chat_message', handleNewMessage);

    // CLEANUP: Tear down listeners on component unmount or room transitions.
    // Extremely important to prevent multiple active listeners on the same event.
    return () => {
      socket.off('new_chat_message', handleNewMessage);
    };
  }, [socket, eventId]);

  // 2. Auto-scroll effect: triggers whenever the message array length increases
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !socket) return;

    // Dispatch message payload to the backend socket gateway
    socket.emit('send_chat_message', {
      eventId,
      text: messageText,
      senderName: user?.name || 'Anonymous Developer',
      senderAvatar: user?.avatarUrl || ''
    });

    setMessageText('');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-900 w-[340px] shrink-0">
      
      {/* Chat Header */}
      <div className="h-12 border-b border-zinc-900 flex items-center justify-between px-4 shrink-0 bg-zinc-950">
        <h3 className="font-semibold text-zinc-100 text-xs uppercase tracking-wider flex items-center gap-2">
          <MessageSquare size={14} className="text-violet-500" /> Live Event Chat
        </h3>
        
        {/* Status indicator ring */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
          <span className="text-[10px] text-zinc-500 font-bold uppercase">{isConnected ? 'Sync' : 'Offline'}</span>
        </div>
      </div>

      {/* Chat Stream Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center px-4">
            <MessageSquare size={24} className="mb-2 text-zinc-800" />
            <p className="text-xs">Stream chat initialized.</p>
            <p className="text-[10px] text-zinc-700 mt-1">Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className="text-xs leading-relaxed break-words">
              {/* Render User Avatar if present, fallback to styled initial block */}
              <div className="flex items-start gap-2">
                {msg.senderAvatar ? (
                  <img src={msg.senderAvatar} alt="" className="w-5 h-5 rounded-full mt-0.5" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 mt-0.5 shrink-0">
                    {msg.senderName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <span className="font-bold text-zinc-300 hover:underline cursor-pointer mr-1.5">
                    {msg.senderName}
                  </span>
                  <span className="text-zinc-400">{msg.text}</span>
                </div>
              </div>
            </div>
          ))
        )}
        {/* Empty anchor element targeted for auto-scroll mechanics */}
        <div ref={chatEndRef} />
      </div>

      {/* Input Tray */}
      <form onSubmit={handleSendMessage} className="p-4 bg-zinc-950 border-t border-zinc-900 shrink-0">
        <div className="relative">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={isConnected ? "Send a message..." : "Connecting to chat..."}
            disabled={!isConnected}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder-zinc-500 disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!isConnected || !messageText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-violet-400 p-1 disabled:opacity-30 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </form>

    </div>
  );
};

export default LiveChat;



