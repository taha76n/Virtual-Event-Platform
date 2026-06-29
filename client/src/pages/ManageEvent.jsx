import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEventDetails } from '../hooks/useEventDetails';
import { Calendar, Users, Settings, ArrowLeft } from 'lucide-react';
import SessionManager from '../Components/SessionManager';

const ManageEvent = () => {
  // 1. Grab the dynamic ID from the URL (e.g., /events/:eventId/manage)
  const { eventId } = useParams();
  
  // 2. Pass that ID into our custom hook to get the data
  const { event, isLoading, error } = useEventDetails(eventId);
  
  // 3. Local UI State for the Tabs
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) return <div className="p-8 text-zinc-400">Loading workspace...</div>;
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;
  if (!event) return <div className="p-8 text-zinc-400">Event not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Area */}
      <div>
        <Link to="/dashboard" className="text-zinc-500 hover:text-violet-400 flex items-center gap-2 text-sm font-medium mb-4 w-fit transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">{event.title}</h1>
          <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md ${
            event.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
          }`}>
            {event.status}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-800 gap-6">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 font-semibold text-sm transition-colors relative ${activeTab === 'overview' ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <div className="flex items-center gap-2"><Settings size={16}/> Overview</div>
          {activeTab === 'overview' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-500 rounded-t-full"></span>}
        </button>
        <button 
          onClick={() => setActiveTab('sessions')}
          className={`pb-3 font-semibold text-sm transition-colors relative ${activeTab === 'sessions' ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <div className="flex items-center gap-2"><Calendar size={16}/> Sessions</div>
          {activeTab === 'sessions' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-500 rounded-t-full"></span>}
        </button>
        <button 
          onClick={() => setActiveTab('speakers')}
          className={`pb-3 font-semibold text-sm transition-colors relative ${activeTab === 'speakers' ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <div className="flex items-center gap-2"><Users size={16}/> Speakers</div>
          {activeTab === 'speakers' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-500 rounded-t-full"></span>}
        </button>
      </div>

      {/* Dynamic Tab Content */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 min-h-[400px]">
        {activeTab === 'overview' && (
          <SessionManager eventId={eventId}/>
        )}

        {activeTab === 'sessions' && (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <Calendar size={48} className="mb-4 text-zinc-700" />
            <p>Session management coming soon...</p>
          </div>
        )}

        {activeTab === 'speakers' && (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <Users size={48} className="mb-4 text-zinc-700" />
            <p>Speaker directory coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEvent;