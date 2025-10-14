import { useContext, useEffect, useRef, useState } from "react"
import { ComponentContext } from "../Context/ComponentsContext"
import { AuthContext } from "../Context/AuthContext"

const Game = () => {

    const {user} = useContext(AuthContext)
    const [gameName, setGameName] = useState(user.username);
    const {socket, roomsRunning, roomIamIn, setRoomIamIn, isAiEnabled, setIsAiEnabled} = useContext(ComponentContext);
    const [gameState, setGameState] = useState(null);
    const [playersScores, setPlayersScores] = useState({});
    const [chooseOponent, setChooseOponent] = useState(false);
    const [oponent, setOponent] = useState('robocot')


    const canvasRef = useRef(null);

    useEffect ( () => {
    if (!gameState) {console.log("returning before rendering!!!"); return;}
    const canvas = canvasRef.current;
    if (!canvas) {console.log("Returning in !canvas"); return};
    const ctx = canvas.getContext("2d");

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

    const isPlayer1 = gameState.players.find(player=> player.userId === user.id)?.isPlayer1
	if (isPlayer1) {
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 3;
        ctx.strokeRect(gameState.player1.x - 1, gameState.player1.y - 1, gameState.player1.width + 2, gameState.player1.height + 2);
    } else {
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 3;
        ctx.strokeRect(gameState.player2.x - 1, gameState.player2.y - 1, gameState.player2.width + 2, gameState.player2.height + 2);
    }
    setPlayersScores({player1Score: gameState.player1.score, player2Score: gameState.player2.score})
}, [gameState])

    const createGame = () => {
        if (gameName === '') {alert("game Name cannot be empty");return};
        if (!socket) return;
        const mode = oponent === 'robocot' ? 'AI' : 'Human'
        //alert(`CreateGame! Oponent: ${mode} roomName: ${gameName}`);
        //return;
        socket.emit("createRoom", gameName, {mode})
        setGameName('');
        joinRoom(null, gameName);
    }


    // Emit roomImIn when room changes
    useEffect(() => {
        if (!socket || !roomIamIn) return;
        console.log("📤 Emitting roomImIn:", roomIamIn);
        socket.emit("roomImIn", roomIamIn);
    }, [roomIamIn, socket])

    // Listen for roomJoinedInfo once
    useEffect(() => {
        if (!socket) return;
        
        const handleRoomJoinedInfo = (data) => {
            console.log("🎮 Room joined info received:", data);
            setIsAiEnabled(data.aiEnabled);
        };
        
        socket.on("roomJoinedInfo", handleRoomJoinedInfo);
        
        return () => {
            socket.off("roomJoinedInfo", handleRoomJoinedInfo);
        };
    }, [socket])

    useEffect(() => {
        if (!socket) {
            console.log("❌ No socket for gameUpdate listener");
            return;
        }
        
        console.log("✅ Setting up gameUpdate listener");
        
        const handleGameUpdate = (data, roomTorender) => {
            console.log("🎮 GAME UPDATE RECEIVED! Room:", roomTorender);
            setGameState(data);
        }
        
        socket.on("gameUpdate", handleGameUpdate);
        
        return () => {
            console.log("🧹 Removing gameUpdate listener");
            socket.off("gameUpdate", handleGameUpdate);
        }
    }, [socket])

    const handleMouseMove = (e) => {
        if (!socket) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        socket.emit("paddleMove", { y: mouseY, room: roomIamIn });
    }

    const setDifficulty = (level) => {
        socket.emit('setDifficulty', {level}, roomIamIn);
    }

    const joinRoom = (room, roomId) => {
        //check if player is already in this room
        if (roomIamIn === roomId) {console.log("Returnnon in join 'cause roomIamIn is the same as roomId");return};

        //check if player is allow in this room
        if (room) {
            const isPlayerInRoom = room.players.some(player => player.userId === user.id)
            if (!isPlayerInRoom && (room.players.length === 2 || room.aiEnabled)) return;
        }
        socket.emit("joinRoomGame", roomId)
        //setRoomIamIn to triger socket.emit("roomImIn", roomIamIn) so the server knows which room should update
        setRoomIamIn(roomId);
    }       

    return (
        <div>
            <h1 className="text-4xl font-bold text-white mb-8 text-center">Pong Game</h1>
            
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
                
                {roomsRunning.length === 0 ? (
                    <div className="flex flex-col gap-6">
                        <div className="relative mt-14 px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white text-2xl font-semibold rounded-lg shadow-lg flex justify-center">
                            <button onClick={() => setChooseOponent(!chooseOponent)} className="w-full">Oponent { oponent === 'robocot' ? '🤖' : '👤'}</button>
                            {chooseOponent &&
                            <div className="absolute w-full flex flex-col -bottom-36 bg-gray-800 rounded-lg gap-1 z-50">
                                <button onClick={() => {setChooseOponent(false); setOponent('robocot')}} className={`bg-gray-700 py-3 rounded-lg hover:bg-gray-600 border-4 ${oponent === 'robocot' ? 'border-pong-green/80' : 'border-gray-600'}`}>🤖</button>
                                <button onClick={() => {setChooseOponent(false); setOponent('human')}} className={`bg-gray-700 py-3 rounded-lg hover:bg-gray-600 border-4 ${oponent === 'human' ? 'border-pong-green/80' : 'border-gray-600'}`}>👤</button>
                            </div>
                            }
                        </div>
                        <button 
                            onClick={() => createGame()}
                            className="mt-2 px-8 py-4 bg-pong-green/70 hover:bg-pong-green/90 text-white text-2xl font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            Start Game
                        </button>
                        <div className="flex bg-gray-800 justify-center items-center rounded-md p-2">
                            <span className="text-white/80 px-4">Room Name </span>
                            <input 
                                className="px-4 py-2 rounded-lg border-2 border-gray-600 bg-white/70 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                                value={gameName} 
                                onChange={(e) => setGameName(e.target.value)}
                                placeholder="Enter room name..."
                            />
                        </div>
                        <div>

                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {roomsRunning.map((rooms, index) => (
                            <button 
                                key={index} 
                                onClick={() => joinRoom(rooms, rooms.roomId)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                {rooms.roomId}  {" "}
                                {rooms.players.find(p => p.isPlayer1)?.username} vs {rooms.aiEnabled ? '🤖'  : rooms.players.find(p => !p.isPlayer1)?.username} 
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {roomIamIn &&
                <div className="mb-6">
                    { isAiEnabled &&
                    <div className="flex flex-col items-center gap-4 mb-6">
                        <h2 className="text-white text-2xl font-bold tracking-wide">Select Difficulty</h2>
                        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 px-4">
                            <button 
                                onClick={() => setDifficulty('easy')} 
                                className="group relative px-8 sm:px-12 py-3 bg-gradient-to-br from-green-400 to-green-600 text-white text-lg sm:text-xl font-bold rounded-lg shadow-lg hover:shadow-green-500/50 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-green-300/50 hover:border-green-300"
                            >
                                <span className="relative z-10">🌱 Easy</span>
                                <div className="absolute inset-0 bg-gradient-to-br from-green-300 to-green-500 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                            </button>
                            
                            <button 
                                onClick={() => setDifficulty('medium')} 
                                className="group relative px-8 sm:px-12 py-3 bg-gradient-to-br from-orange-400 to-orange-600 text-white text-lg sm:text-xl font-bold rounded-lg shadow-lg hover:shadow-orange-500/50 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-orange-300/50 hover:border-orange-300"
                            >
                                <span className="relative z-10">⚡ Medium</span>
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-300 to-orange-500 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                            </button>
                            
                            <button 
                                onClick={() => setDifficulty('hard')} 
                                className="group relative px-8 sm:px-12 py-3 bg-gradient-to-br from-red-600 to-red-800 text-white text-lg sm:text-xl font-bold rounded-lg shadow-lg hover:shadow-red-500/50 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-red-400/50 hover:border-red-400"
                            >
                                <span className="relative z-10">🔥 Hard</span>
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                            </button>
                        </div>
                    </div>
                    }
                    <div>
                        <span className="text-white">
                            player1: {playersScores.player1Score} player2: {playersScores.player2Score}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
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