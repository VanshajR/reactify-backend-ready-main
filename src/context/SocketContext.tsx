import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
 socket: Socket | null;
 isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
 const [socket, setSocket] = useState<Socket | null>(null);
 const [isConnected, setIsConnected] = useState(false);

 useEffect(() => {
 const socketInstance = io(SOCKET_URL, {
 transports: ['websocket'],
 autoConnect: true,
 });

 socketInstance.on('connect', () => {
 console.log('Socket connected:', socketInstance.id);
 setIsConnected(true);
 });

 socketInstance.on('disconnect', () => {
 console.log('Socket disconnected');
 setIsConnected(false);
 });

 setSocket(socketInstance);

 return () => {
 socketInstance.disconnect();
 };
 }, []);

 return (
 <SocketContext.Provider value={{ socket, isConnected }}>
 {children}
 </SocketContext.Provider>
 );
};

export const useSocket = () => {
 const context = useContext(SocketContext);
 if (context === undefined) {
 throw new Error('useSocket must be used within a SocketProvider');
 }
 return context;
};