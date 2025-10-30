import { createContext, useContext, useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { AuthContextType, ComponentContextType, GameRoom, NotificationItem, LanguageContent } from "../types";
import { io, Socket } from 'socket.io-client';

export const ComponentContext = createContext<ComponentContextType | undefined>(undefined);

interface ComponentContextProviderProps {
    children: ReactNode;
}

interface SocketEventData {
    roomImIn?: string;
    isPlayerInRoom?: boolean;
    aiEnabled?: boolean;
    from?: string;
}

export function ComponentContextProvider({ children }: ComponentContextProviderProps): React.ReactElement {
    const [notifications, setNotifications] = useState<number>(0);
    const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
    const [roomsRunning, setRoomsRunning] = useState<GameRoom[]>([]);
    const [roomIamIn, setRoomIamIn] = useState<string>('');
    const [isAiEnabled, setIsAiEnabled] = useState<boolean>(false);
    const [waitingForOpponent, setWaitingForOpponent] = useState<boolean>(true);
    
    const authContext = useContext(AuthContext) as AuthContextType | undefined;
    
    if (!authContext) {
        throw new Error('ComponentContextProvider must be used within AuthContextProvider');
    }
    
    const { token, user, language, lan } = authContext;
    const socketRef = useRef<Socket | null>(null);

    // 🔧 FUNCIÓN HELPER CORREGIDA PARA ACCESO SEGURO A LANGUAGE
    const getLanguageText = (key: keyof LanguageContent): string => {
        // Verificar que language existe y es un objeto
        if (!language || typeof language !== 'object') {
            return 'has sent you a friend request'; // fallback en inglés
        }
        
        // Verificar que lan existe y es una clave válida en language
        if (!lan || !(lan in language)) {
            return 'has sent you a friend request'; // fallback en inglés
        }
        
        // Acceso seguro a la propiedad
        const languageContent = language[lan];
        if (!languageContent || typeof languageContent !== 'object') {
            return 'has sent you a friend request'; // fallback en inglés
        }
        
        // Retornar el valor o fallback
        return languageContent[key] || 'has sent you a friend request';
    };

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
                console.log('Socket connected:', socketRef.current?.id);
            });

            socketRef.current.on("startConnection", (data: SocketEventData) => {
                console.log("On start Connection data.roomImIn:", data.roomImIn);
                if (!data.isPlayerInRoom) {
                    setRoomIamIn('');
                    setIsAiEnabled(false);
                }
                if (data.roomImIn) {
                    setRoomIamIn(data.roomImIn);
                }
                setIsAiEnabled(data.aiEnabled || false);
            });

            socketRef.current.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            socketRef.current.on('error', (error: Error) => {
                console.error('Socket error:', error);
            });

            socketRef.current.on("lobbyUpdate", (roomsRunningLobby: GameRoom[]) => {
                setRoomsRunning(roomsRunningLobby);
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

    // Separate useEffect for friend request listener with dependencies
    useEffect(() => {
        if (!socketRef.current) return;

        const handleSendFriendRequest = (data: SocketEventData) => {
            setNotifications(notifications => notifications + 1);
            setNotificationsList(prevList => [...prevList, {
                id: Date.now(),
                user: data.from || 'Unknown', 
                msg: getLanguageText('NotyHasSendYouAFriendRequest'), // 🔧 ACCESO SEGURO CORREGIDO
                time: Date.now(), 
                type: 'friendRequest', 
                status: true
            }]);
        };

        socketRef.current.on("sendFriendRequest", handleSendFriendRequest);

        return () => {
            if (socketRef.current) {
                socketRef.current.off("sendFriendRequest", handleSendFriendRequest);
            }
        };
    }, [token, user, lan, language]);

    // Update notification messages when language changes
    useEffect(() => {
        if (!language || !lan) return;
        
        setNotificationsList(prevList => 
            prevList.map(notify => {
                if (notify.type === 'friendRequest') {
                    return { 
                        ...notify, 
                        msg: getLanguageText('NotyHasSendYouAFriendRequest') // 🔧 ACCESO SEGURO CORREGIDO
                    };
                }
                return notify;
            })
        );
    }, [lan, language]);

    // Game ended listener with roomIamIn dependency
    useEffect(() => {
        if (!socketRef.current || !roomIamIn) return;

        const handleGameEnded = (roomId: string) => {
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

    const contextValue: ComponentContextType = {
        notifications, 
        setNotifications,
        socket: socketRef.current,
        notificationsList,
        setNotificationsList,
        roomsRunning,
        setRoomsRunning,
        roomIamIn,
        setRoomIamIn,
        isAiEnabled,
        setIsAiEnabled,
        waitingForOpponent,
        setWaitingForOpponent,
    };

    return (
        <ComponentContext.Provider value={contextValue}>
            {children}
        </ComponentContext.Provider>
    );
}