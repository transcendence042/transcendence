import { createContext, useState, useEffect, useRef } from "react";
import { io } from 'socket.io-client'

export const AuthContext = createContext();

export function AuthContextProvider({children}) {


    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef(null);

    // Check authentication
    useEffect(() => {
        const checkAuth = async () => {
            if (!token) {
                setUser(null);
                setLoading(false);
                console.log("You are not allow!")
                return ;
            }
            try {
                const res = await fetch('/api/auth/me', {
                    headers: {'Authorization': `Bearer ${token}`}
                })
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user)
                } else {
                    console.log("token is invalid");
                }

            } catch {
                console.log("token is invalid");
            } finally {
                setLoading(false)
            }

        }
        checkAuth();
    }, [token])

    // Socket connection management
    useEffect(() => {
        // Connect socket when user is authenticated
        if (user && token) {
            socketRef.current = io('http://localhost:3000', {
                auth: {
                    token: token
                },
                autoConnect: true
            });

            // Socket event listeners
            socketRef.current.on('connect', () => {
                console.log('Socket connected:', socketRef.current.id);
            });

            socketRef.current.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            socketRef.current.on('error', (error) => {
                console.error('Socket error:', error);
            });

            // Cleanup on unmount or when user logs out
            return () => {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                    console.log('Socket cleaned up');
                }
            };
        }
    }, [user, token]);

    return (
        <AuthContext.Provider value={{
            user, 
            setUser, 
            token, 
            setToken, 
            loading, 
            setLoading,
            socket: socketRef.current
        }}>
            {children}
        </AuthContext.Provider>
    )
}
