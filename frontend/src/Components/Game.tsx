import { useContext, useEffect, useRef, useState } from "react"
import { ComponentContext } from "../Context/ComponentsContext"
import { AuthContext } from "../Context/AuthContext"
import type { AuthContextType, ComponentContextType, GameRoom } from '../types'

interface GameState {
    player1: {
        x: number;
        y: number;
        width: number;
        height: number;
        score?: number;
    };
    player2: {
        x: number;
        y: number;
        width: number;
        height: number;
        score?: number;
    };
    ball: {
        x: number;
        y: number;
        radius: number;
    };
    players: Array<{
        userId: number;
        username: string;
        isPlayer1: boolean;
    }>;
    aiDifficulty?: string;
}

// 🔧 CORRECCIÓN: Interface sin optional para evitar undefined
interface PlayersScores {
    player1Score: number;
    player1Name: string;
    player2Score: number;
    player2Name: string;
}

const Game: React.FC = (): React.ReactElement => {
    const authContext = useContext(AuthContext) as AuthContextType;
    const componentContext = useContext(ComponentContext) as ComponentContextType;
    
    const { user, language, lan } = authContext;
    const { socket, roomsRunning, roomIamIn, setRoomIamIn, isAiEnabled, setIsAiEnabled, waitingForOpponent, setWaitingForOpponent } = componentContext;
    
    const [gameName, setGameName] = useState<string>(user?.username || '');
    const [roomsPlayerIsIn, setRoomPlayerIsIn] = useState<GameRoom[]>([]);
    const [gameState, setGameState] = useState<GameState | null>(null);
    // 🔧 CORRECCIÓN: Valores por defecto para evitar undefined
    const [playersScores, setPlayersScores] = useState<PlayersScores>({
        player1Score: 0,
        player1Name: '',
        player2Score: 0,
        player2Name: ''
    });
    const [chooseOponent, setChooseOponent] = useState<boolean>(false);
    const [oponent, setOponent] = useState<string>('robocot');
    const [difficultyLevel, setDifficultyLevel] = useState<string>('');
    const [createNewGame, setCreateNewGame] = useState<boolean>(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const rooms = roomsRunning?.filter((room: GameRoom) =>
            room.players.some(player => player.userId === user?.id)
        ) || [];
        setRoomPlayerIsIn(rooms);
    }, [roomsRunning, user?.id]);

    useEffect(() => {
        if (!gameState) {
            console.log(`Settign to trth the waitingForOpponenet in room: ${roomIamIn}`); 
            if (setWaitingForOpponent) setWaitingForOpponent(true);
            return;
        }
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // center dashed line
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // paddles
        ctx.fillStyle = "white";
        ctx.fillRect(
            gameState.player1.x,
            gameState.player1.y,
            gameState.player1.width,
            gameState.player1.height
        );
        ctx.fillRect(
            gameState.player2.x,
            gameState.player2.y,
            gameState.player2.width,
            gameState.player2.height
        );

        // ball
        ctx.beginPath();
        ctx.arc(
            gameState.ball.x,
            gameState.ball.y,
            gameState.ball.radius,
            0,
            2 * Math.PI
        );
        ctx.fill();

        const isPlayer1 = gameState.players.find(player => player.userId === user?.id)?.isPlayer1;
        if (isPlayer1) {
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 3;
            ctx.strokeRect(gameState.player1.x - 1, gameState.player1.y - 1, gameState.player1.width + 2, gameState.player1.height + 2);
        } else {
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 3;
            ctx.strokeRect(gameState.player2.x - 1, gameState.player2.y - 1, gameState.player2.width + 2, gameState.player2.height + 2);
        }
        const player1Name = gameState.players.find(player => player.isPlayer1)?.username;
        const player2Name = gameState.players.find(player => !player.isPlayer1)?.username;
        
        // 🔧 CORRECCIÓN: Valores por defecto para evitar undefined
        setPlayersScores({ 
            player1Score: gameState.player1?.score || 0, 
            player1Name: player1Name || '', 
            player2Score: gameState.player2?.score || 0, 
            player2Name: player2Name || ''
        });
        
        if (difficultyLevel !== gameState.aiDifficulty && gameState.aiDifficulty)
            setDifficultyLevel(gameState.aiDifficulty);
        if (waitingForOpponent && setWaitingForOpponent) setWaitingForOpponent(false);
    }, [gameState, roomIamIn, difficultyLevel, waitingForOpponent, setWaitingForOpponent, user?.id]);

    const createGame = (): void => {
        if (gameName === '') return;
        if (!socket) return;
        const mode = oponent === 'robocot' ? 'AI' : 'Human';
        //alert(`CreateGame! Oponent: ${mode} roomName: ${gameName}`);
        //return;

        //Is the mode is AI setWaitingForOpponent flase so the user can start playing!!!
        if (mode === 'AI') {/*alert(`In create Game setWaiting for oppoenent to false`), */if (setWaitingForOpponent) setWaitingForOpponent(false)}
        else if (mode === 'Human') {/*alert(`In Create Game setWaiting for oppoenent to true`), */if (setWaitingForOpponent) setWaitingForOpponent(true)}

        socket.emit("createRoom", gameName, { mode });
        setGameName('');
        joinRoom(null, gameName);
    };

    // Emit roomImIn when room changes
    useEffect(() => {
        if (!socket || !roomIamIn) return;
        console.log("📤 Emitting roomImIn:", roomIamIn);
        socket.emit("roomImIn", roomIamIn);
    }, [roomIamIn, socket]);

    // Listen for roomJoinedInfo once
    useEffect(() => {
        if (!socket) return;
        
        const handleRoomJoinedInfo = (data: any): void => {
            console.log("🎮 Room joined info received:", data);
            if (setIsAiEnabled) setIsAiEnabled(data.aiEnabled);
        };
        
        socket.on("roomJoinedInfo", handleRoomJoinedInfo);
        
        return () => {
            socket.off("roomJoinedInfo", handleRoomJoinedInfo);
        };
    }, [socket, setIsAiEnabled]);

    useEffect(() => {
        if (!socket) {
            console.log("❌ No socket for gameUpdate listener");
            return;
        }
        
        console.log("✅ Setting up gameUpdate listener");
        
        const handleGameUpdate = (data: any, roomTorender: any): void => {
            setGameState(data);
        };
        
        socket.on("gameUpdate", handleGameUpdate);
        
        return () => {
            console.log("🧹 Removing gameUpdate listener");
            socket.off("gameUpdate", handleGameUpdate);
        };
    }, [socket]);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>): void => {
        if (!socket) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        socket.emit("paddleMove", { y: mouseY, room: roomIamIn });
    };

    const setDifficulty = (level: string): void => {
        if (!socket) return;
        socket.emit('setDifficulty', { level }, roomIamIn);
    };

    const joinRoom = (room: GameRoom | null, roomId: string): void => {
        //check if player is already in this room
        setCreateNewGame(false);
        if (roomIamIn === roomId) { console.log("Returnnon in join 'cause roomIamIn is the same as roomId"); return; }

        //check if player is allow in this room
        if (room && user) {
            const isPlayerInRoom = room.players.some(player => player.userId === user.id);
            if (!isPlayerInRoom && (room.players.length === 2 || room.aiEnabled)) return;
        }
        if (!socket) return;
        socket.emit("joinRoomGame", roomId);
        //setRoomIamIn to triger socket.emit("roomImIn", roomIamIn) so the server knows which room should update
        if (setRoomIamIn) setRoomIamIn(roomId);

        if (room && setWaitingForOpponent) {
            if ((room.players.length > 1 || room.aiEnabled)) {
                //alert(`Setting waitForOpponent to false in room: ${roomId}`)
                setWaitingForOpponent(false);
            } else {
                //alert(`Setting waitForOpponent to true in room: ${roomId}`)
                setWaitingForOpponent(true);
            }
        }
        if (setWaitingForOpponent) setWaitingForOpponent(true);
    };

    return (
        <div>
            <h1 className="text-4xl font-bold text-white mb-8 text-center">{language?.[lan as string]?.gamePongGame}</h1>
            
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
                
                {roomsPlayerIsIn.length === 0 ? (
                    <div className="flex flex-col gap-6">
                        <div className="relative mt-14 px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white text-2xl font-semibold rounded-lg shadow-lg flex justify-center">
                            <button onClick={() => setChooseOponent(!chooseOponent)} className="w-full">{language?.[lan as string]?.gameOponent} {oponent === 'robocot' ? '🤖' : '👤'}</button>
                            {chooseOponent &&
                                <div className="absolute w-full flex flex-col -bottom-36 bg-gray-800 rounded-lg gap-1 z-50">
                                    <button onClick={() => { setChooseOponent(false); setOponent('robocot') }} className={`bg-gray-700 py-3 rounded-lg hover:bg-gray-600 border-4 ${oponent === 'robocot' ? 'border-pong-green/80' : 'border-gray-600'}`}>🤖</button>
                                    <button onClick={() => { setChooseOponent(false); setOponent('human') }} className={`bg-gray-700 py-3 rounded-lg hover:bg-gray-600 border-4 ${oponent === 'human' ? 'border-pong-green/80' : 'border-gray-600'}`}>👤</button>
                                </div>
                            }
                        </div>
                        <button 
                            onClick={() => createGame()}
                            className="mt-2 px-8 py-4 bg-pong-green/70 hover:bg-pong-green/90 text-white text-2xl font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            {language?.[lan as string]?.gameStartGame}
                        </button>
                        <div className="flex bg-gray-800 justify-center items-center rounded-md p-2">
                            <span className="text-white/80 px-4">{language?.[lan as string]?.gameRoomName} </span>
                            <input 
                                className="px-4 py-2 rounded-lg border-2 border-gray-600 bg-white/70 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                value={gameName} 
                                onChange={(e) => setGameName(e.target.value)}
                                placeholder={`${language?.[lan as string]?.gameEnterRoomName}`}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        {roomsPlayerIsIn.map((rooms, index) => (
                            <button 
                                key={index} 
                                onClick={() => joinRoom(rooms, rooms.roomId)}
                                className={`group relative w-64 h-28 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 hover:from-slate-600 hover:via-slate-700 hover:to-slate-800 border border-emerald-500/30 hover:border-emerald-400/50 text-white rounded-lg shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 overflow-hidden ${roomIamIn === rooms.roomId && 'border-4 border-green-700'}`}
                            >
                                {/* Subtle accent line */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"></div>
                                
                                {/* Status indicator */}
                                <div className="absolute top-3 right-3">
                                    <span className="flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                </div>
                                
                                {/* Content */}
                                <div className="relative h-full flex flex-col justify-center items-start px-4 pt-2">
                                    <h1 className="text-xl font-bold mb-1 truncate w-full text-white">{rooms.roomId}</h1>
                                    <div className="text-sm text-gray-300 truncate w-full">
                                        {rooms.players.find(p => p.isPlayer1)?.username} <span className="text-emerald-400">vs</span> {rooms.aiEnabled ? '🤖' : rooms.players.find(p => !p.isPlayer1)?.username ? rooms.players.find(p => !p.isPlayer1)?.username : <span className="animate-pulse">{language?.[lan as string]?.gameWaiting}</span>}
                                    </div>
                                </div>
                            </button>
                        ))}
                        <button onClick={() => setCreateNewGame(true)} className="group relative w-64 h-28 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 hover:from-slate-600 hover:via-slate-700 hover:to-slate-800 border-2 border-dashed border-amber-500/40 hover:border-amber-400/60 text-white rounded-lg shadow-lg hover:shadow-amber-500/20 transition-all duration-200 overflow-hidden">
                            {/* Accent line */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"></div>
                            
                            {/* Plus icon */}
                            <div className="absolute top-3 right-3">
                                <span className="text-xl text-amber-400/70 group-hover:text-amber-400">+</span>
                            </div>
                            
                            {/* Content */}
                            <div className="relative h-full flex flex-col justify-center items-center px-4 pt-2">
                                <div className="text-3xl mb-2 opacity-70 group-hover:opacity-90 transition-opacity">🎮</div>
                                <h1 className="text-lg font-semibold text-center text-gray-300 group-hover:text-white transition-colors">{language?.[lan as string]?.gameCreateNewRoom}</h1>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {
                (createNewGame && roomsPlayerIsIn.length > 0) && 
                    <div className="mb-6 flex flex-col items-center justify-center">
                        <div className="flex flex-col gap-6">
                            <div className="relative mt-14 px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white text-2xl font-semibold rounded-lg shadow-lg flex justify-center">
                                <button onClick={() => setChooseOponent(!chooseOponent)} className="w-full">{language?.[lan as string]?.gameOponent} {oponent === 'robocot' ? '🤖' : '👤'}</button>
                                {chooseOponent &&
                                    <div className="absolute w-full flex flex-col -bottom-36 bg-gray-800 rounded-lg gap-1 z-50">
                                        <button onClick={() => { setChooseOponent(false); setOponent('robocot') }} className={`bg-gray-700 py-3 rounded-lg hover:bg-gray-600 border-4 ${oponent === 'robocot' ? 'border-pong-green/80' : 'border-gray-600'}`}>🤖</button>
                                        <button onClick={() => { setChooseOponent(false); setOponent('human') }} className={`bg-gray-700 py-3 rounded-lg hover:bg-gray-600 border-4 ${oponent === 'human' ? 'border-pong-green/80' : 'border-gray-600'}`}>👤</button>
                                    </div>
                                }
                            </div>
                            <button 
                                onClick={() => createGame()}
                                className="mt-2 px-8 py-4 bg-pong-green/70 hover:bg-pong-green/90 text-white text-2xl font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                {language?.[lan as string]?.gameStartGame}
                            </button>
                            <div className="flex bg-gray-800 justify-center items-center rounded-md p-2">
                                <span className="text-white/80 px-4">{language?.[lan as string]?.gameRoomName} </span>
                                <input 
                                    className="px-4 py-2 rounded-lg border-2 border-gray-600 bg-white/70 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                    value={gameName} 
                                    onChange={(e) => setGameName(e.target.value)}
                                    placeholder={`${language?.[lan as string]?.gameEnterRoomName}`}
                                />
                            </div>
                        </div>
                    </div>
            }

            {(roomIamIn && !createNewGame) &&
                <div className="mb-6">
                    {isAiEnabled &&
                        <div className="flex flex-col items-center gap-4 mb-6">
                            <h2 className="text-white text-2xl font-bold tracking-wide">{language?.[lan as string]?.gameSelectDifficulty}</h2>
                            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                                <button 
                                    onClick={() => setDifficulty('easy')} 
                                    className={`group relative px-8 sm:px-12 py-3 bg-gradient-to-br from-green-400 to-green-600 text-white text-lg sm:text-xl font-bold rounded-lg shadow-lg hover:shadow-green-500/50 active:scale-95 transition-all duration-200 ${difficultyLevel === 'easy' ? 'border-4 border-green-500' : 'border-2 border-green-300/50 hover:border-green-300'}`}
                                >
                                    <span className="relative z-10 px-1">🌱 {language?.[lan as string]?.gameEasy}</span>
                                    <div className="absolute inset-0 bg-gradient-to-br from-green-300 to-green-500 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                                </button>
                                
                                <button 
                                    onClick={() => setDifficulty('medium')} 
                                    className={`group relative px-8 sm:px-12 py-3 bg-gradient-to-br from-orange-400 to-orange-600 text-white text-lg sm:text-xl font-bold rounded-lg shadow-lg hover:shadow-orange-500/50 active:scale-95 transition-all duration-200 ${difficultyLevel === 'medium' ? 'border-4 border-green-500' : 'border-2 border-orange-300/50 hover:border-orange-300'}`}
                                >
                                    <span className="relative z-10">⚡ {language?.[lan as string]?.gameMedium}</span>
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-300 to-orange-500 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                                </button>
                                
                                <button 
                                    onClick={() => setDifficulty('hard')} 
                                    className={`group relative px-8 sm:px-12 py-3 bg-gradient-to-br from-red-600 to-red-800 text-white text-lg sm:text-xl font-bold rounded-lg shadow-lg hover:shadow-red-500/50 active:scale-95 transition-all duration-200 ${difficultyLevel === 'hard' ? 'border-4 border-green-500' : 'border-2 border-red-400/50 hover:border-red-400'}`}
                                >
                                    <span className="relative z-10 px-1">🔥 {language?.[lan as string]?.gameHard}</span>
                                    <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                                </button>
                            </div>
                        </div>
                    }
                    {
                        waitingForOpponent ? 
                            (
                                <div className="flex flex-col justify-center items-center py-12 gap-4">
                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold text-white">{language?.[lan as string]?.gameWaitingForOpponen}</h2>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-cyan-300 text-sm animate-pulse">{language?.[lan as string]?.gameGetReadyToPlay}</p>
                                    </div>
                                </div>
                            )
                            :
                            (
                                <div>
                                    <div className="mb-4 flex justify-center items center">
                                        <span className="bg-gradient-to-br from-blue-600 to-blue-950 w-6/12 h-16 gap-2 flex justify-evenly items-center rounded-2xl text-xl font-semibold text-white overflow-hidden">
                                            <h1 className="text-2xl font-bold text-white/90">{playersScores.player1Name}</h1>
                                            <div className="gap">
                                                <span className="mr-6 text-2xl font-bold">{playersScores.player1Score}</span> 
                                                : 
                                                <span className="ml-6 text-2xl font-bold">{playersScores.player2Score}</span>
                                            </div>
                                            <h1>{isAiEnabled ? '🤖' : playersScores.player2Name}</h1>
                                        </span>
                                    </div>
                                </div>
                            )
                    }
                    
                    <div className={`overflow-x-auto ${waitingForOpponent && 'hidden'}`}>
                        <div className="flex justify-center min-w-max">
                            <canvas 
                                className="bg-black border-4 border-gray-700 rounded-lg shadow-2xl cursor-none" 
                                ref={canvasRef} 
                                width={800} 
                                height={400} 
                                id="gameCanvas" 
                                onMouseMove={handleMouseMove}
                            />
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}

export default Game