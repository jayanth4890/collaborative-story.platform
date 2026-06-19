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
      try {
        await refreshUser();
        showToast('Successfully logged in with Google!', 'success');
        navigate('/');
      } catch (err) {
        console.error('OAuth loading error:', err);
        showToast('Failed to complete Google sign-in.', 'error');
        navigate('/login');
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
