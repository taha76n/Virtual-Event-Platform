import { Link } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';


const DashboardEvents = () => {
  // Consuming custom hook!
  const { events, isLoading, error } = useEvents();

  if (isLoading) {
    return <div className="p-8 text-zinc-400">Loading events catalog...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-400">Error: {error}</div>;
  }

  if (events.length === 0) {
    return (
      <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-xl">
        <h3 className="text-xl font-bold text-white mb-2">No events found</h3>
        <p className="text-zinc-400 mb-6">You haven't created any events yet.</p>
        <Link to="/dashboard/events/new" className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-6 rounded-lg inline-block">
          Create Your First Event
        </Link>
      </div>
    );
  }

  // Render the grid of events
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.map((event) => (
        <div 
          key={event._id} 
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-zinc-800 rounded text-zinc-400">
              {event.status}
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-1">{event.title}</h3>
          
          <p className="text-xs text-zinc-500 font-medium mb-5">
            {new Date(event.startsAt).toLocaleDateString()}
          </p>

          {/* Action Buttons Area */}
          <div className="flex gap-2 pt-4 border-t border-zinc-800/50 mt-auto">
            {/* The new Manage Link from Lesson 7 */}
            <Link 
              to={`/dashboard/events/${event._id}/manage`} 
              className="flex-1 text-center text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold px-3 py-2 rounded-lg transition-colors border border-zinc-800"
            >
              Manage
            </Link>
            
            <button className="flex-1 text-xs bg-violet-600 hover:bg-violet-500 text-white font-semibold px-3 py-2 rounded-lg transition-colors shadow-lg shadow-violet-900/20">
              View Page
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};


export default DashboardEvents;