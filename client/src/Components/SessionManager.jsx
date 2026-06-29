import React, { useState } from 'react';
import { useSessions } from '../hooks/useSessions';
import { Video, Clock } from 'lucide-react';

const SessionManager = ({ eventId }) => {
  const { sessions, isLoading, error, createSession } = useSessions(eventId);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    startsAt: '',
    endsAt: '',
    streamProvider: 'webrtc',
    capacity: 0
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    const result = await createSession(formData);
    
    if (result.success) {
      // Clear the form on success
      setFormData({ title: '', abstract: '', startsAt: '', endsAt: '', streamProvider: 'webrtc', capacity: 0 });
    } else {
      setFormError(result.message);
    }
    setIsSubmitting(false);
  };

  if (isLoading) return <div className="text-zinc-400">Loading schedule...</div>;
  if (error) return <div className="text-red-400">Error loading sessions.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT COLUMN: The Schedule */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-lg font-bold text-white mb-4">Event Schedule</h3>
        
        {sessions.length === 0 ? (
          <div className="p-8 border border-dashed border-zinc-700 rounded-xl text-center text-zinc-500">
            No sessions scheduled yet. Create your first one!
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session._id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex items-start justify-between group hover:border-zinc-700 transition-colors">
                <div>
                  <h4 className="font-bold text-white text-base mb-1">{session.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-zinc-400 font-medium">
                    <span className="flex items-center gap-1.5"><Clock size={14}/> {new Date(session.startsAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(session.endsAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className="flex items-center gap-1.5 uppercase"><Video size={14}/> {session.streamProvider}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: The Creation Form */}
      <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 h-fit">
        <h3 className="text-md font-bold text-white mb-4">Add New Session</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-2 bg-red-500/10 text-red-400 text-xs rounded border border-red-500/20">{formError}</div>}
          
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Session Title</label>
            <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Start Time</label>
              <input type="datetime-local" name="startsAt" required value={formData.startsAt} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">End Time</label>
              <input type="datetime-local" name="endsAt" required value={formData.endsAt} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Stream Engine</label>
            <select name="streamProvider" value={formData.streamProvider} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-violet-500">
              <option value="webrtc">Native WebRTC (Ultra Low Latency)</option>
              <option value="youtube">YouTube Live (Embedded)</option>
              <option value="mux">Mux (HLS Streaming)</option>
            </select>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold py-2 rounded-lg mt-2 transition-colors">
            {isSubmitting ? 'Saving...' : 'Add to Schedule'}
          </button>
        </form>
      </div>

    </div>
  );
};

export default SessionManager;