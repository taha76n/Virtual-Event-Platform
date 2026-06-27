import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { MonitorPlay } from 'lucide-react';

const Login = () => {
  const { user, loginWithGoogle } = useAuth();
  const [error, setError] = useState('');

  // If already logged in, redirect away
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    // Google returns a JWT in the 'credential' property
    const result = await loginWithGoogle(credentialResponse.credential);
    
    if (!result.success) {
      setError(result.message);
    }
  };

  const handleGoogleFailure = () => {
    setError("Google sign-in popup closed or failed.");
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-[#0f0f11] w-full max-w-md p-8 rounded-xl shadow-2xl border border-zinc-800 relative z-10">
        
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <MonitorPlay className="text-violet-500" size={28} />
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Nexus<span className="text-violet-500">Live</span>
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-zinc-400 text-sm text-center">Sign in securely with your Google account to access the creator studio.</p>
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex justify-center pt-2">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleFailure}
              theme="filled_black"
              shape="rectangular"
              size="large"
              text="continue_with"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;