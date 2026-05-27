'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/stores/auth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '/events')
      : 'http://localhost:3000/events';

    console.log(`Connecting to Socket.io: ${socketUrl}`);

    const socketInstance = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('Socket.io connected successfully:', socketInstance.id);
      setIsConnected(true);
      
      // Join the user-specific room
      socketInstance.emit('join', user.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket.io disconnected');
      setIsConnected(false);
    });

    socketInstance.on('notification', (notification: any) => {
      console.log('Real-time notification received:', notification);
      
      // Invalidate notifications queries to refresh both Doctor/Admin and Patient lists
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['patient-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['patient-dashboard'] });

      // Trigger standard and custom audio alert
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch {}

      // Display premium live notification toast
      toast.custom((t) => (
        <div className="flex w-full max-w-md items-center gap-4 rounded-2xl bg-white p-4 shadow-xl border border-gray-100 dark:bg-slate-900 dark:border-slate-800 animate-fade-in">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{notification.title}</h4>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{notification.message}</p>
          </div>
          <button 
            onClick={() => toast.dismiss(t)} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs font-semibold px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            إغلاق
          </button>
        </div>
      ), { duration: 5000 });
    });

    // Handle real-time updates for appointments, queue, and dashboard
    socketInstance.on('appointmentUpdate', () => {
      console.log('Real-time appointment update received');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-list'] });
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-dashboard'] });
    });

    socketInstance.on('dashboardUpdate', () => {
      console.log('Real-time dashboard update received');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      queryClient.invalidateQueries({ queryKey: ['patient-dashboard'] });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
