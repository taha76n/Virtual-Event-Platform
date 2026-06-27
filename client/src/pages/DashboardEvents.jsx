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
    return <div className="p-8 text-zinc-400">No events found. Create your first event!</div>;
  }

  // Render the grid of events
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.map((event) => (
        <div 
          key={event._id} 
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-zinc-800 rounded text-zinc-400">
              {event.status}
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-1">{event.title}</h3>
          
          <p className="text-xs text-zinc-500 font-medium">
            {new Date(event.startsAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default DashboardEvents;