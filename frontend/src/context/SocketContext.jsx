import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL
      || (import.meta.env.VITE_API_URL 
          ? import.meta.env.VITE_API_URL.replace('/api', '') 
          : 'http://localhost:5001');

    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
      timeout: 10000,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect_error', (error) => {
      // Silent error handler to degrade gracefully
      console.warn('Socket.IO connection warning:', error.message);
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO connected:', newSocket.id);
      newSocket.emit('join_user', user._id);
    });

    // Listen for live toast events globally
    newSocket.on('invitation_received', (data) => {
      showToast(data.message || 'You received a new collaboration invitation!', 'info');
    });

    newSocket.on('invitation_accepted', (data) => {
      showToast(data.message || 'A collaborator accepted your invitation!', 'success');
    });

    newSocket.on('contribution_submitted', (data) => {
      showToast(data.message || 'A new contribution has been submitted for review!', 'info');
    });

    newSocket.on('contribution_approved', (data) => {
      showToast(data.message || 'Your contribution draft was approved!', 'success');
    });

    newSocket.on('contribution_rejected', (data) => {
      showToast(data.message || 'Your contribution draft was declined.', 'warning');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
