import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';

const AuthCallback = () => {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const initOAuth = async () => {
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          await refreshUser();
          showToast('Successfully logged in with Google!', 'success');
          navigate('/', { replace: true });
          return;
        } catch (err) {
          console.error(`[OAuth] refreshUser attempt ${attempt} failed:`, err);
          if (attempt < maxAttempts) {
            // Backend may be cold-starting on Render free tier — brief backoff before retry
            await new Promise((resolve) => setTimeout(resolve, 1200 * attempt));
          } else {
            showToast('Failed to complete Google sign-in. Please try again.', 'error');
            navigate('/login?error=session_failed', { replace: true });
          }
        }
      }
    };

    initOAuth();
  }, [refreshUser, navigate, showToast]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-sm font-semibold text-slate-400">Completing Google sign-in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
