import { ComponentContext } from "./ComponentsContext";
import { AuthContext } from "./AuthContext";
import {useState, useEffect, useRef, createContext, useContext} from 'react'

export const TournamentContext = createContext(null);

export function TournamentContextProvider({children}) {
    const {socket} = useContext(ComponentContext)
    const {user} = useContext(AuthContext);
    const [timer, setTimer] = useState(0);
    const [currentTournament, setCurrentTournament] = useState(localStorage.getItem("currentTournament") || null);
    const timerRef = useRef(null);
    const [tournamentReady, setTournamentReady] = useState(localStorage.getItem("tournamentReady") || false);
    const [tournamentJustStarted, setTournamentJustStarted] = useState(localStorage.getItem("tournamentJustStarted") || false)

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
                    localStorage.setItem("tournamentReady", true);
                    localStorage.setItem("currentTournament", currentTournament);
                    setTournamentReady(true);
                }
            } else if (tournament === null) {
                // Player left tournament or tournament doesn't exist
                setTournamentReady(false);
            }
        }

        const handleTournamentJustStarted = (tournament) => {
            localStorage.setItem("tournamentJustStarted", true);
            setTournamentJustStarted(true);
        }

        socket.on("startTournament", handleStartTournament)
        socket.on("getCurrentTournament", handleCurrentTournament);
        socket.on("tournamentJustStarted", handleTournamentJustStarted)

        return () => {
            socket.off("startTournament", handleStartTournament)
            socket.off("getCurrentTournament", handleCurrentTournament)
            socket.off("tournamentJustStarted", handleTournamentJustStarted)
        }
    }, [socket, user])

    useEffect(() => {
        if (currentTournament && currentTournament.players) {
            if (currentTournament.players.length === Number(currentTournament.numberOfPlayers)) {
                setTournamentReady(true);
            }
        }
    }, [currentTournament])

    useEffect(() => {
        if (tournamentReady && timer <= 5) {
            if (timerRef.current) clearInterval(timerRef.current);
            
            timerRef.current = setInterval(() => {
                setTimer(timer => timer + 1);
            }, 1000)
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, [tournamentReady])

    useEffect(() => {
        if (timer > 30 && currentTournament && currentTournament.players) {
            const checkIfPlayerIsHost = currentTournament.players.find(p => p?.userId === user.id)?.host
            
            if (checkIfPlayerIsHost) {
                socket.emit("startTournamentNow", currentTournament.id);
                console.log("You are the host!!")
            }
        }
    }, [timer])

    return (
        <TournamentContext.Provider value={{tournamentReady, setTournamentReady, timer, currentTournament, tournamentJustStarted}}>
            {children}
        </TournamentContext.Provider>
    )
}