import { createContext, useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { io } from 'socket.io-client'

export const ComponentContext = createContext();

export function ComponentContextProvider({children}) {
    const [notifications, setNotifications] = useState(0);
    const [notificationsList, setNotificationsList] = useState([]);
    const [roomsRunning, setRoomsRunning] = useState([]);
    const [roomIamIn, setRoomIamIn] = useState('');

    const {token, user} = useContext(AuthContext)
    const socketRef = useRef(null);

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

            socketRef.current.on("startConnection", (data) => {
                console.log("On start Connection data.roomImIn:", data.roomImIn)
                setRoomIamIn(data.roomImIn);
            })

            socketRef.current.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            socketRef.current.on('error', (error) => {
                console.error('Socket error:', error);
            });

            socketRef.current.on("sendFriendRequest", (data) => {
                setNotifications(notifications => notifications + 1)
                setNotificationsList(prevList => [...prevList, {
                    id: Date.now(),
                    user: data.from, 
                    msg: "has send you a friend request", 
                    time: Date.now(), 
                    type: 'friendRequest', 
                    status: true
                }])
            })

            socketRef.current.on("lobbyUpdate", (roomsRunningLobby) => {
                setRoomsRunning(roomsRunningLobby);
            })

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

    // Separate useEffect for gameEnded listener with roomIamIn dependency
    useEffect(() => {
        if (!socketRef.current || !roomIamIn) return;

        const handleGameEnded = (roomId) => {
            console.log("🏁 Game ended in room:", roomId);
            console.log("📍 Current roomIamIn:", roomIamIn);
            
            if (roomId === roomIamIn) {
                console.log("✅ Leaving room:", roomIamIn);
                setRoomIamIn('');
            }
        };

        socketRef.current.on("gameEnded", handleGameEnded);

        return () => {
            if (socketRef.current) {
                socketRef.current.off("gameEnded", handleGameEnded);
                console.log("🧹 Cleaned up gameEnded listener");
            }
        };
    }, [roomIamIn]);


    return (
        <ComponentContext.Provider value={{
            notifications, 
            setNotifications,
            socket: socketRef.current,
            notificationsList,
            setNotificationsList,
            roomsRunning,
            setRoomsRunning,
            roomIamIn,
            setRoomIamIn
        }}>
            {children}
        </ComponentContext.Provider>
    )
}
