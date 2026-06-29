import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../hooks/useCatalog';
import { useDebounce } from '../hooks/useDebounce';
import { Calendar, MonitorPlay, Users, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Catalog = () => {
  const { user, logout } = useAuth();
  
  // 1. Fast State: Updates instantly on every keystroke (for the input UI)
  const [searchInput, setSearchInput] = useState('');
  
  // 2. Slow State: Only updates when the user stops typing for 500ms
  const debouncedSearch = useDebounce(searchInput, 500);

  // 3. API Hook: We pass the SLOW state to the API so we don't spam the server!
  const { events, isLoading, error } = useCatalog(debouncedSearch);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-300 font-sans flex flex-col">
      
      {/* PUBLIC NAVBAR */}
      <nav className="h-16 border-b border-zinc-900 bg-[#0a0a0c]/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-2">
          <MonitorPlay className="text-violet-500" size={28} />
          <h1 className="text-xl font-bold tracking-tight text-white">
            Nexus<span className="text-violet-500">Live</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-semibold text-zinc-300 hover:text-white transition-colors">Dashboard</Link>
              <button onClick={logout} className="text-sm font-semibold text-zinc-500 hover:text-red-400 transition-colors">Sign Out</button>
            </>
          ) : (
            <Link to="/login" className="bg-white text-black hover:bg-zinc-200 text-sm font-bold py-2 px-5 rounded-full transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* HERO SECTION WITH SEARCH BAR */}
      <div className="pt-20 pb-12 px-8 text-center max-w-3xl mx-auto w-full shrink-0">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
          Discover Premium <br/> Virtual Experiences
        </h2>
        <p className="text-lg text-zinc-400 mb-8">
          Join industry-leading masterclasses, developer conferences, and interactive live streams from around the globe.
        </p>

        {/* SEARCH BAR */}
        <div className="relative max-w-xl mx-auto group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-violet-500 transition-colors" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search events by title..."
            className="block w-full pl-11 pr-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all shadow-xl shadow-black/20"
          />
        </div>
      </div>

      {/* CATALOG GRID */}
      <main className="max-w-7xl w-full mx-auto px-8 pb-24 flex-1">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
             <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p>Searching catalog...</p>
          </div>
        )}
        
        {error && <div className="text-center py-12 text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">{error}</div>}
        
        {!isLoading && !error && events.length === 0 && (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
            <h3 className="text-xl font-bold text-white mb-2">No events found</h3>
            <p className="text-zinc-500">
              {searchInput ? `No results matching "${searchInput}"` : "Check back later for upcoming live streams."}
            </p>
          </div>
        )}

        {!isLoading && !error && events.length > 0 && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event._id} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-zinc-700 transition-all hover:shadow-xl hover:shadow-black/40 flex flex-col">
                
                {/* Event Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-zinc-900 to-zinc-800 relative">
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <Calendar size={14} className="text-violet-400" />
                    {new Date(event.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{event.title}</h3>
                  <p className="text-sm text-zinc-400 mb-6 line-clamp-2 flex-1">{event.description}</p>
                  
                  <div className="flex items-center justify-between border-t border-zinc-900 pt-4 mt-auto">
                    <div className="flex items-center gap-1.5 text-sm text-zinc-500 font-medium">
                      <Users size={16} /> 
                      {event.capacity === 0 ? 'Unlimited' : `${event.capacity} seats`}
                    </div>
                    
                    <Link 
                      to={`/catalog/${event._id}`} 
                      className="bg-zinc-900 hover:bg-violet-600 hover:border-violet-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors border border-zinc-800"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Catalog;