import { ComponentContext } from "../Context/ComponentsContext"
import { AuthContext } from "../Context/AuthContext"
import { useContext, useEffect, useState } from "react"


export const Tournaments = () => {
    const {socket} = useContext(ComponentContext);
    const {user} = useContext(AuthContext);
    const [lobbyState, setLobbyState] = useState([]);
    const [currentTournament, setCurrentTournament] = useState(null);


    useEffect( () => {

        if (!socket) return;
        const handleTournamentsLobbies = (tournamentLobbies) => {
            setLobbyState(tournamentLobbies);
            console.log(`tournamentLobbies is: ${lobbyState.length}`)
        }

        const handleCurrentTournament = (tournament) => {
            //alert("sombody has seennnnnnn");
            setCurrentTournament(currentTournament => tournament);
        }

        socket.emit("CheckTournamentLobbies");
        socket.on("tournamentLobbyInfo", handleTournamentsLobbies)
        socket.on("getCurrentTournament", handleCurrentTournament);
        return () => {
            socket.off("tournamentLobbyInfo", handleTournamentsLobbies)
            socket.off("getCurrentTournament", handleCurrentTournament);
        }
    }, [socket])


    const createNewTournament = () => {
        const name = "2323232"
        const numberOfPlayers = 4;
        const type = "elimination"
        socket.emit("createTournament", name, numberOfPlayers, type)
    }

    const handleGetOutOfTournament = () => {
        socket.emit("removePlayerFromTournament", user.id, currentTournament.id)
    }

    const showTournamentInfo = (tournament) => {
        const name = tournament.name
        const playersIn = lobbyState.find(lobby => lobby.id === tournament.id)?.players.length;
        alert(`this is the anme: ${name} this is how many players in: ${playersIn}`)
        socket.emit("joinTournament", tournament.id, tournament.name, user.id)
    }


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center py-12 px-4">
            <div className="w-full max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-10 text-center tracking-tight drop-shadow-lg">Tournaments</h1>

                {currentTournament ? (
                    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-emerald-500/20 rounded-xl p-8 shadow-2xl mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-emerald-400">{currentTournament.name}</h2>
                            <button onClick={handleGetOutOfTournament} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow transition-all">Leave Tournament</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Array.from({ length: currentTournament.numberOfPlayers }).map((_, index) => {
                                const player = currentTournament.players[index];
                                return player ? (
                                    <div key={index} className="bg-slate-900 border border-emerald-500/30 rounded-lg p-4 flex flex-col items-center shadow hover:shadow-emerald-500/20 transition-all">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-xl font-bold text-white mb-2">{player.username[0]?.toUpperCase()}</div>
                                        <div className="font-semibold text-white">{player.username}</div>
                                    </div>
                                ) : (
                                    <div key={index} className="bg-slate-800 border border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center text-gray-400 shadow">
                                        <span className="text-2xl">🪑</span>
                                        <span className="mt-2">Available Seat</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <>
                        {lobbyState.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                {lobbyState.map((lobby, index) => (
                                    <button onClick={() => showTournamentInfo(lobby)} key={index} className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-cyan-500/20 rounded-xl p-6 shadow-xl flex flex-col items-start hover:border-emerald-400 hover:shadow-emerald-500/20 transition-all">
                                        <div className="text-lg font-bold text-cyan-400 mb-2">{lobby.name}</div>
                                        <div className="text-sm text-gray-300">Players: <span className="font-semibold text-white">{lobby.players.length}</span> / {lobby.numberOfPlayers}</div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <p className="text-gray-400 text-lg mb-4">No tournaments available. Create one!</p>
                            </div>
                        )}
                        <div className="flex flex-col items-center mt-8">
                            <h2 className="text-2xl font-bold text-emerald-400 mb-4">Create Tournament</h2>
                            <button onClick={createNewTournament} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold rounded-lg shadow-lg transition-all">Create New Tournament</button>
                            <span className="mt-2 text-gray-400">Total lobbies: {lobbyState.length}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}