import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/apiInterceptor';

const CreateEvent = () => {
  const navigate = useNavigate();
  
  // Manage all form inputs in one state object!
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
    capacity: 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // Auto-detect user timezone
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // A reusable handler for all inputs
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Send the POST request to our backend
      await api.post('/api/catalog/events', formData);
      
      // If successful, redirect back to the dashboard to see the new event!
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 p-8 rounded-xl">
      <h2 className="text-2xl font-bold text-white mb-6">Create New Event</h2>
      
      {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-zinc-400 mb-1">Event Title</label>
          <input 
            type="text" name="title" required
            value={formData.title} onChange={handleChange}
            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 focus:border-violet-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-400 mb-1">Description</label>
          <textarea 
            name="description" rows="3" required
            value={formData.description} onChange={handleChange}
            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 focus:border-violet-500 outline-none"
          ></textarea>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-1">Starts At</label>
            <input 
              type="datetime-local" name="startsAt" required
              value={formData.startsAt} onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 focus:border-violet-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-1">Ends At</label>
            <input 
              type="datetime-local" name="endsAt" required
              value={formData.endsAt} onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 focus:border-violet-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-400 mb-1">Capacity (0 for unlimited)</label>
          <input 
            type="number" name="capacity" min="0" required
            value={formData.capacity} onChange={handleChange}
            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 focus:border-violet-500 outline-none"
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/dashboard')} className="px-4 py-2 text-zinc-400 hover:text-white">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg">
            {isLoading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;