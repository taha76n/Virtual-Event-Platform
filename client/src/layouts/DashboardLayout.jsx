import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const { logout } = useAuth();

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-white">
      {/* 1. THE SIDEBAR */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800 font-bold text-xl">
          NexusLive
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          {/* Link is React Router's version of an <a> tag. It doesn't reload the page! */}
          <Link to="/dashboard" className="p-2 hover:bg-zinc-800 rounded">Events</Link>
          <Link to="/dashboard/speakers" className="p-2 hover:bg-zinc-800 rounded">Speakers</Link>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <button onClick={logout} className="text-red-400 font-semibold w-full text-left">
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. THE MAIN CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-zinc-800 flex items-center px-8 bg-zinc-900/50">
          Top Header Area
        </header>
        
        {/* 3. THE OUTLET (This is where the magic happens) */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;