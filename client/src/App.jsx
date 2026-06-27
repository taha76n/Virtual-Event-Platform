import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Video, 
  Users, 
  LogOut, 
  Ticket, 
  Search, 
  Bell, 
  UserCircle,
  MessageSquare,
  Send,
  Settings,
  MoreVertical,
  MonitorPlay
} from 'lucide-react';

/**
 * ---------------------------------------------------------
 * 1. PREMIUM AUTH LAYOUT
 * Sleek dark mode card with subtle glows and gradients.
 * ---------------------------------------------------------
 */
const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Clean, solid card without the unnecessary ambient background glows */}
      <div className="bg-[#0f0f11] w-full max-w-md p-8 rounded-xl shadow-2xl border border-zinc-800 relative z-10">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <MonitorPlay className="text-violet-500" size={28} />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Nexus<span className="text-violet-500">Live</span>
            </h1>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

/**
 * ---------------------------------------------------------
 * 2. PREMIUM DASHBOARD LAYOUT
 * Professional creator studio look. Deep blacks, crisp lines,
 * and clear active states.
 * ---------------------------------------------------------
 */
const DashboardLayout = ({ children, navigate }) => {
  return (
    <div className="h-screen w-full bg-[#0a0a0c] text-zinc-300 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] bg-zinc-950 border-r border-zinc-800 flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <MonitorPlay className="text-violet-500 mr-2" size={24} />
          <h1 className="text-xl font-extrabold text-white tracking-tight">Creator Studio</h1>
        </div>
        
        <nav className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 mt-4">Manage</p>
          
          <button className="flex items-center gap-3 px-3 py-2.5 bg-zinc-900 text-white rounded-lg border border-zinc-800/50 shadow-sm transition-colors">
            <LayoutDashboard size={18} className="text-violet-500" /> 
            <span className="font-medium">Events</span>
          </button>
          
          <button className="flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition-colors">
            <Users size={18} /> 
            <span className="font-medium">Speakers</span>
          </button>

          <button className="flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition-colors">
            <Settings size={18} /> 
            <span className="font-medium">Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={() => navigate('login')}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-zinc-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
          >
            <LogOut size={18} /> 
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-zinc-950/50 backdrop-blur-sm border-b border-zinc-800 flex items-center justify-between px-8 z-10">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 w-96">
            <Search size={16} className="text-zinc-500 mr-2" />
            <input 
              type="text" 
              placeholder="Search events, users..." 
              className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-zinc-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="text-zinc-400 hover:text-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full"></span>
            </button>
            {/* Replaced ugly gradient avatar with a clean, professional initial badge */}
            <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:bg-zinc-700 transition-colors">
              T
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Event Dashboard</h2>
              <button 
                onClick={() => navigate('watch')}
                className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-violet-500/20 transition-all flex items-center gap-2"
              >
                <Video size={18} /> Join Live Event Room
              </button>
            </div>
            
            {/* The child component goes here */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm min-h-[400px]">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

/**
 * ---------------------------------------------------------
 * 3. PREMIUM IMMERSIVE LAYOUT
 * The true Twitch/Kick experience. Edge-to-edge player,
 * pinned chat, ultra-dark mode.
 * ---------------------------------------------------------
 */
const ImmersiveLayout = ({ children, navigate }) => {
  return (
    <div className="h-screen w-full bg-[#000000] text-zinc-300 flex flex-col overflow-hidden font-sans">
      
      {/* Top Navbar - Minimal & Transparent */}
      <nav className="h-14 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('dashboard')} className="text-zinc-400 hover:text-white">
            <MonitorPlay className="text-violet-500" size={24} />
          </button>
          <div className="h-4 w-px bg-zinc-800"></div>
          <span className="font-bold text-zinc-100 flex items-center gap-2 text-sm tracking-wide">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
            LIVE: Production Ready Architecture
          </span>
          <span className="bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1.5 ml-2">
            <Users size={12} /> 1,204
          </span>
        </div>
        <div className="flex items-center gap-3">
           <button 
            onClick={() => navigate('dashboard')}
            className="text-xs font-semibold bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded transition-colors"
          >
            Leave Room
          </button>
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold border border-zinc-700">
            T
          </div>
        </div>
      </nav>

      {/* Main Layout Grid */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT STAGE: Video Player Area */}
        <div className="flex-1 bg-[#000000] relative flex flex-col">
          {/* Replaced the 'AI slop' fake video player controls with a clean offline state */}
          <div className="flex-1 flex items-center justify-center group relative">
            
            <div className="text-center">
              <MonitorPlay size={40} className="mx-auto mb-4 text-zinc-800" />
              <p className="text-zinc-600 font-semibold text-xs tracking-[0.2em] uppercase">Stream Offline</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: Live Chat */}
        <div className="w-[340px] bg-zinc-950 border-l border-zinc-900 flex flex-col shrink-0">
          {/* Chat Header */}
          <div className="h-12 border-b border-zinc-900 flex items-center justify-between px-4 shrink-0">
            <h3 className="font-semibold text-zinc-100 text-sm uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={16} className="text-zinc-500" /> Stream Chat
            </h3>
            <MoreVertical size={16} className="text-zinc-500 cursor-pointer hover:text-white" />
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {/* Dummy Message 1 */}
            <div className="text-sm leading-relaxed">
              <span className="font-bold text-violet-400 mr-2 cursor-pointer hover:underline">AliceDev:</span>
              <span className="text-zinc-300">This architecture setup is amazing! Are we using Redis for caching?</span>
            </div>
            {/* Dummy Message 2 */}
            <div className="text-sm leading-relaxed bg-zinc-900/50 p-1.5 -mx-1.5 rounded">
              <span className="font-bold text-emerald-400 mr-2 cursor-pointer hover:underline">TechLeadBob:</span>
              <span className="text-zinc-300">@AliceDev Nope, leaning heavily on MongoDB's in-memory engine and SQS for queues right now.</span>
            </div>
            {/* Dummy Message 3 */}
            <div className="text-sm leading-relaxed">
              <span className="font-bold text-fuchsia-400 mr-2 cursor-pointer hover:underline">FrontendNinja:</span>
              <span className="text-zinc-300">Will the repo be available after the stream? 🔥🔥</span>
            </div>
          </div>

          {/* Chat Input Area */}
          <div className="p-4 bg-zinc-950 border-t border-zinc-900 shrink-0">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Send a message..." 
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder-zinc-500"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-violet-400 p-1">
                <Send size={16} />
              </button>
            </div>
            <div className="flex justify-between items-center mt-3 px-1">
               <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wide">
                 <span className="w-2 h-2 rounded-full bg-zinc-700"></span> 100 Bits
               </div>
               <button className="text-xs bg-violet-600 hover:bg-violet-500 text-white font-semibold px-3 py-1 rounded transition-colors">
                 Chat
               </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

/**
 * ---------------------------------------------------------
 * MAIN APP COMPONENT (Router Simulator)
 * ---------------------------------------------------------
 */
export default function App() {
  const [currentRoute, setCurrentRoute] = useState('login');

  // Injecting the premium 'Inter' font globally to instantly elevate the design
  const appStyle = (
    <style dangerouslySetInnerHTML={{__html: `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      * { font-family: 'Inter', sans-serif; }
    `}} />
  );

  const renderContent = () => {
    switch (currentRoute) {
      case 'login':
        return (
          <AuthLayout>
            {/* Auth Form Payload */}
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm text-center mb-6">Sign in to access your creator dashboard.</p>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">Email Address</label>
                <input type="email" placeholder="you@example.com" className="w-full bg-[#0a0a0c] border border-zinc-800 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-violet-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-[#0a0a0c] border border-zinc-800 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-violet-500 transition-colors" />
              </div>
              <button 
                onClick={() => setCurrentRoute('dashboard')}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 rounded-lg transition-all mt-4"
              >
                Sign In
              </button>
            </div>
          </AuthLayout>
        );
        
      case 'dashboard':
        return (
          <DashboardLayout navigate={setCurrentRoute}>
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
              <LayoutDashboard size={48} className="text-zinc-800" />
              <p className="text-sm font-medium">Your events list will render here.</p>
            </div>
          </DashboardLayout>
        );

      case 'watch':
        return (
          <ImmersiveLayout navigate={setCurrentRoute}>
            {/* WebRTC Video component injected here later */}
          </ImmersiveLayout>
        );

      default:
        return <div>404 Not Found</div>;
    }
  };

  return (
    <>
      {appStyle}
      {renderContent()}
    </>
  );
}