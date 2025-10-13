import { useContext, useEffect, useRef, useState } from "react"
import { ComponentContext } from "../Context/ComponentsContext"
import { AuthContext } from "../Context/AuthContext"

const Game = () => {

    const {user} = useContext(AuthContext)
    const [gameName, setGameName] = useState('23');
    const {socket, roomsRunning, roomIamIn, setRoomIamIn} = useContext(ComponentContext);
    const [gameState, setGameState] = useState(null);

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
}, [gameState])

    const createGame = () => {
        if (!socket) return;
        socket.emit("createRoom", gameName, {mode: 'AI'})
        setGameName('');
    }


    useEffect(() => {
        if (!socket || !roomIamIn) return;
        console.log("📤 Emitting roomImIn:", roomIamIn);
        socket.emit("roomImIn", roomIamIn);
    }, [roomIamIn, socket])

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

    return (
        <>
            <h1 className="text-4xl font-bold text-white mb-8 text-center">Pong Game</h1>
            
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
                <input 
                    className="px-4 py-2 rounded-lg border-2 border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                    value={gameName} 
                    onChange={(e) => { if (e.target.value != '') setGameName(e.target.value)}}
                    placeholder="Enter room name..."
                />
                
                {roomsRunning.length === 0 ? (
                    <button 
                        onClick={() => {createGame()}}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                        Create Game
                    </button>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {roomsRunning.map((rooms, index) => (
                            <button 
                                key={index} 
                                onClick={() => setRoomIamIn(rooms.roomId)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                {rooms.roomId}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {roomIamIn &&
                <div className="overflow-x-auto mb-6">
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
            }
        </>
    )
}

export default Game