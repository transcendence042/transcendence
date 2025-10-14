import { ComponentContext } from "../Context/ComponentsContext"
import { AuthContext } from "../Context/AuthContext";
import {useState, useContext} from 'react'
import { useNavigate } from "react-router-dom";

const Matches = () => {
    const {roomsRunning, setRoomIamIn, roomIamIn, socket} = useContext(ComponentContext);
    const {user} = useContext(AuthContext)
    const navigate = useNavigate();

    const joinRoom = (room, roomId) => {
        //check if player is already in this room
        if (roomIamIn === roomId) {
            console.log("Returnnon in join 'cause roomIamIn is the same as roomId")
            navigate('index/game')
        };

        //check if player is allow in this room
        if (room) {
            const isPlayerInRoom = room.players.some(player => player.userId === user.id)
            if (!isPlayerInRoom && (room.players.length === 2 || room.aiEnabled)) return;
        }

        socket.emit("joinRoomGame", roomId)
        //setRoomIamIn to triger socket.emit("roomImIn", roomIamIn) so the server knows which room should update
        setRoomIamIn(roomId);
        navigate('/index/game')
    }      

    return (
        <div className="text-white">
            {roomsRunning.length === 0 ? (
                    <div className="flex flex-col gap-6">
                        <p>No games yet</p>
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
    )
}

export default Matches