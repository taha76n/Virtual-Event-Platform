import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.dsconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(import.meta.env.VITE_SERVER_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log(`Connected to real time server with SocketId:`, newSocket.id);
    });

    newSocket.on("disconnect", (reason) => {
      setIsConnected(null);
      console.log(`Disconnected from real time server. Reason`, reason);
    });

    newSocket.on("connect_error", (error) => {
      setIsConnected(null);
      console.log(`Connection handshake failed:`, error.message);
    });

    setSocket(newSocket);

    return () => {
      socket.dsconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
