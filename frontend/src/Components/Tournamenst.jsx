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
        <div className="text-white">
        {
            currentTournament &&
            <div className="">
                <button onClick={() => handleGetOutOfTournament()}>GetOut</button>
                <div>{currentTournament.name}</div>
                {
                    Array.from({ length: currentTournament.numberOfPlayers }).map((_, index) => {
                        const player = currentTournament.players[index];
                        return player ? (
                        <div key={index}>
                            <div>{player.username}</div>
                        </div>
                        ) : (
                        <div key={index}>available seat</div>
                        );
                    })
                }
            </div>
        }
        {
            (!currentTournament && lobbyState.length > 0) ?
                <div>
                {   lobbyState.map((lobby, index) => 
                    <button onClick={() => showTournamentInfo(lobby)} key={index}>
                        <div>
                            tournament Name: {lobby.name}
                        </div>
                        <div>
                            players N: {lobby.players.length}/{lobby.numberOfPlayers}
                        </div>
                    </button>)
                }
                    <div>
                        <h1>Create Tournament titlte</h1>
                        <button onClick={() => createNewTournament()}>createNewTournament</button>
                        <span>{lobbyState.length}</span>
                    </div>
                </div>

                : (!currentTournament) &&
                <div>
                    <h1>Create Tournament titlte</h1>
                    <button onClick={() => createNewTournament()}>createNewTournament</button>
                    <span>{lobbyState.length}</span>
                </div>
        }
        </div>
    )
}