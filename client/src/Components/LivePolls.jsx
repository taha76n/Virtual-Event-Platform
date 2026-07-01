import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Plus, Vote, CheckCircle2 } from 'lucide-react';

const LivePolls = ({ eventId }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  
  const [activePoll, setActivePoll] = useState(null);
  const [userVotedOptionId, setUserVotedOptionId] = useState(null);
  
  // Organizer Panel Form State
  const [showCreator, setShowCreator] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';

  useEffect(() => {
    if (!socket) return;

    // Listen for new polls initialized in this event room
    const handleNewPoll = (poll) => {
      setActivePoll(poll);
      setUserVotedOptionId(null); // Reset local vote trace for the new poll
    };

    // Listen for real-time aggregation changes pushed by the DB transactions
    const handlePollUpdated = (updatedData) => {
      setActivePoll((prev) => {
        if (!prev || prev._id !== updatedData._id) return prev;
        return { ...prev, options: updatedData.options };
      });
    };

    socket.on('new_poll', handleNewPoll);
    socket.on('poll_updated', handlePollUpdated);

    return () => {
      socket.off('new_poll', handleNewPoll);
      socket.off('poll_updated', handlePollUpdated);
    };
  }, [socket]);

  // Submit Vote to the Event loop
  const handleVote = (optionId) => {
    if (!socket || !activePoll || userVotedOptionId) return;

    setUserVotedOptionId(optionId);
    
    // Fire real-time atomic update transaction on the backend
    socket.emit('submit_vote', {
      eventId,
      pollId: activePoll._id,
      optionId
    });
  };

  // Dispatch brand new poll (Organizer feature)
  const handleCreatePoll = (e) => {
    e.preventDefault();
    if (!socket || !question.trim()) return;

    const filteredOptions = options.filter(opt => opt.trim() !== '');
    if (filteredOptions.length < 2) {
      alert("You must provide at least two valid options.");
      return;
    }

    socket.emit('create_poll', {
      eventId,
      question,
      options: filteredOptions
    });

    // Reset creator state
    setQuestion('');
    setOptions(['', '']);
    setShowCreator(false);
  };

  // Calculate totals for dynamic percentage charts
  const totalVotes = activePoll?.options.reduce((acc, curr) => acc + curr.votes, 0) || 0;

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-white flex items-center gap-2 uppercase tracking-wider">
          <BarChart3 size={16} className="text-violet-500" /> Interactive Polling
        </h3>
        
        {/* Toggle Panel option for authenticated Organizers */}
        {isOrganizer && (
          <button
            onClick={() => setShowCreator(!showCreator)}
            className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-800 transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} /> {showCreator ? 'View Active Poll' : 'New Poll'}
          </button>
        )}
      </div>

      {/* RENDER POLL CREATOR WORKSPACE */}
      {showCreator && isOrganizer ? (
        <form onSubmit={handleCreatePoll} className="space-y-3 pt-2">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What is your primary language?"
              required
              className="w-full bg-zinc-900 border border-zinc-850 text-white rounded px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase">Answer Options</label>
            {options.map((opt, idx) => (
              <input
                key={idx}
                type="text"
                value={opt}
                onChange={(e) => {
                  const copy = [...options];
                  copy[idx] = e.target.value;
                  setOptions(copy);
                }}
                placeholder={`Option ${idx + 1}`}
                required={idx < 2}
                className="w-full bg-zinc-900 border border-zinc-850 text-white rounded px-3 py-1.5 text-xs focus:outline-none focus:border-violet-500"
              />
            ))}
            
            <button
              type="button"
              onClick={() => setOptions([...options, ''])}
              className="text-[10px] text-violet-400 font-bold hover:underline"
            >
              + Add another option
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-2 rounded-lg transition-colors mt-2"
          >
            Broadcast Live Poll
          </button>
        </form>
      ) : (
        /* RENDER LIVE POLL INTERACTIVE MODULE */
        <div className="pt-2">
          {!activePoll ? (
            <div className="py-8 border border-dashed border-zinc-900 rounded-lg text-center text-zinc-600 text-xs">
              Waiting for the organizer to launch a poll...
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="font-bold text-zinc-200 text-xs leading-relaxed">{activePoll.question}</h4>
              
              <div className="space-y-2">
                {activePoll.options.map((option) => {
                  const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 105) / 1.05 : 0;
                  const hasVoted = userVotedOptionId !== null;
                  const isUserSelection = userVotedOptionId === option._id;

                  return (
                    <button
                      key={option._id}
                      disabled={hasVoted}
                      onClick={() => handleVote(option._id)}
                      className="w-full text-left relative overflow-hidden bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900 rounded-lg p-3 group transition-all"
                    >
                      {/* Interactive Visual Bar Background */}
                      <div 
                        style={{ width: `${percentage}%` }}
                        className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                          isUserSelection ? 'bg-violet-600/15' : 'bg-zinc-800/20'
                        }`}
                      />

                      {/* Foreground Option Labels */}
                      <div className="relative flex items-center justify-between text-xs font-medium z-10">
                        <span className="flex items-center gap-2 text-zinc-300">
                          {isUserSelection && <CheckCircle2 size={14} className="text-violet-400 shrink-0" />}
                          {option.text}
                        </span>
                        
                        {hasVoted && (
                          <span className="text-zinc-500 font-mono text-[10px] font-bold">
                            {option.votes} ({Math.round(percentage)}%)
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {userVotedOptionId && (
                <p className="text-[10px] text-zinc-500 font-semibold tracking-wide uppercase text-right">
                  Vote registered anonymously • {totalVotes} total votes
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LivePolls;
