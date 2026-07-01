import { useEffect, useState } from "react";
import { Clock, ShieldCheck, Ticket, X } from "lucide-react";

const CheckoutModal = ({ isOpen, onClose, event, onBookingSuccess }) => {
  if (!isOpen) {
     return null
  };

  // 1. Initial State: 10 minutes converted to seconds (600s)
  const [timeLeft, setTimeLeft] = useState(600);
  const [isProcessing, setIsProcessing] = useState(false);

  // 2. The Countdown Effect
  useEffect(() => {
    // If timer hits zero, trigger timeout logic
    if (timeLeft <= 0) {
      alert("Your ticket reservation has expired. The seat has been released.");
      onClose();
      return;
    }

    // Start the interval ticking down every 1 second
    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    // CLEANUP: If the modal closes or unmounts, destroy this interval instantly!
    return () => clearInterval(timerId);
  }, [timeLeft, onClose]);

  // Helper function to format seconds into MM:SS format
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing delay (Lesson 11 will hook this to the backend gateway)
    setTimeout(() => {
      setIsProcessing(false);
      onBookingSuccess();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-900 bg-zinc-900/20">
          <div className="flex items-center gap-2 text-violet-500 text-sm font-bold uppercase tracking-wider mb-2">
            <Ticket size={16} /> Secure Checkout
          </div>
          <h3 className="text-xl font-bold text-white">{event?.title}</h3>
        </div>

        {/* TIMER BAR */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between text-amber-400 text-sm font-semibold">
          <span className="flex items-center gap-2"><Clock size={16}/> Holding your seat...</span>
          <span className="font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-base">{formatTime(timeLeft)}</span>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
          <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 space-y-2 text-sm text-zinc-400">
            <div className="flex justify-between"><span>Ticket Pass:</span><span className="text-white font-medium">General Admission</span></div>
            <div className="flex justify-between"><span>Price:</span><span className="text-white font-bold text-base">$0.00 <span className="text-xs text-zinc-500 font-normal">(Free Preview)</span></span></div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Cardholder Name</label>
            <input type="text" required placeholder="John Doe" className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Dummy Card Info</label>
            <input type="text" required placeholder="4242 •••• •••• 4242" className="w-full bg-zinc-900 border border-zinc-800 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-violet-500" />
          </div>

          <button type="submit" disabled={isProcessing} className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold py-3 rounded-xl mt-4 transition-colors flex items-center justify-center gap-2">
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Authorizing...
              </>
            ) : (
              <>
                <ShieldCheck size={18}/> Complete Secure Booking
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default CheckoutModal;
