import { ComponentContext } from "./ComponentsContext";
import { AuthContext } from "./AuthContext";
import {useState, useEffect, useRef, createContext, useContext} from 'react'

export const TournamentContext = createContext(null);

export function TournamentContextProvider({children}) {
    const {socket} = useContext(ComponentContext)
    const {user} = useContext(AuthContext);
    
    // ✅ Properly parse localStorage
    const [currentTournament, setCurrentTournament] = useState(() => {
        const stored = localStorage.getItem("currentTournament");
        return stored ? JSON.parse(stored) : null;
    });
    
    const [tournamentReady, setTournamentReady] = useState(() => {
        return localStorage.getItem("tournamentReady") === "true";
    });
    
    const [tournamentJustStarted, setTournamentJustStarted] = useState(() => {
        return localStorage.getItem("tournamentJustStarted") === "true";
    });
    
    const [tournamentGame, setTournamentGame] = useState(null);

    useEffect(() => {
        if (!socket || !user) return;

        const handleStartTournament = (tournamentInfoObject) => {
            setTournamentReady(tournamentInfoObject.started);
        }

        const handleCurrentTournament = (tournament) => {
            console.log("Received tournament:", tournament);
            setCurrentTournament(tournament);
            
            // Check if tournament is ready (full)
            if (tournament && tournament.players) {
                const isFull = tournament.players.length === Number(tournament.numberOfPlayers);
                if (isFull) {
                    localStorage.setItem("tournamentReady", "true");
                    localStorage.setItem("currentTournament", JSON.stringify(tournament)); // ✅ Use tournament, not currentTournament
                    setTournamentReady(true);
                    socket.emit("startTournamentNow", tournament.id); // ✅ Use tournament, not currentTournament
                }
            } else if (tournament === null) {
                // Player left tournament or tournament doesn't exist
                localStorage.removeItem("tournamentReady"); // ✅ Clean up
                localStorage.removeItem("currentTournament"); // ✅ Clean up
                setTournamentReady(false);
            }
        }

        const handleTournamentJustStarted = (tournament) => {
            localStorage.setItem("tournamentJustStarted", "true");
            setTournamentJustStarted(true);
        }

        const handletournamentGameUpdate = (tournamentGameRoom) => {
            setTournamentGame(tournamentGameRoom);
        }

        const handletournamentGameFinish = () => {
            setTournamentGame(null);
        }

        socket.on("startTournament", handleStartTournament)
        socket.on("getCurrentTournament", handleCurrentTournament);
        socket.on("tournamentJustStarted", handleTournamentJustStarted)
        socket.on("tournamentGameUpdate", handletournamentGameUpdate)
        socket.on("tournamentGameFinish", handletournamentGameFinish)

        return () => {
            socket.off("startTournament", handleStartTournament)
            socket.off("getCurrentTournament", handleCurrentTournament)
            socket.off("tournamentJustStarted", handleTournamentJustStarted)
            socket.off("tournamentGameUpdate", handletournamentGameUpdate)
            socket.off("tournamentGameFinish", handletournamentGameFinish)
        }
    }, [socket, user])

    useEffect(() => {
        if (currentTournament && currentTournament.players) {
            if (currentTournament.players.length === Number(currentTournament.numberOfPlayers)) {
                setTournamentReady(true);
            }
        }
    }, [currentTournament])


    return (
        <TournamentContext.Provider value={{tournamentReady, setTournamentReady, currentTournament, tournamentJustStarted, tournamentGame}}>
            {children}
        </TournamentContext.Provider>
    )
}