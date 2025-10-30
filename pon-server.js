import fastify from 'fastify';
import { Server } from 'socket.io';
import fastifyStatic from '@fastify/static';
import formBody from '@fastify/formbody';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import path from 'path';
import { fileURLToPath } from 'url';

//Oauth2.0
import oauthPlugin from '@fastify/oauth2';
import 'dotenv/config';//by default loads environment variables from a file named .env

import {
  authGoogleCallback,
  register, 
  login, 
  logout, 
  me, 
  authenticate, 
  updateProfile, 
  getUserProfile, 
  sendFriendRequest, 
  respondToFriendRequest,

  challenge,
  respondChallenge,

  getFriendRequests, 
  getFriends, 
  getMatchHistory, 
  changePassword,
} from './backend/auth.js';
import { initializeDatabase, Match, User } from './backend/db.js';
import { escape } from 'querystring';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = fastify({ logger: true });

// Register plugins
await app.register(cors, { origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
 });
await app.register(formBody);
await app.register(jwt, { secret: 'supersecretkey' }); // TODO: .env

// Serve static files
app.register(fastifyStatic, {
    root: path.join(__dirname, 'public')
});

// Google OAuth2 setup
await app.register(oauthPlugin, {
  name: 'googleOAuth2',
  //The permissions the app requests from Google (basic identity, email, and profile info).
  scope: ['openid', 'email', 'profile'],
  credentials: {
    client: {
      id: process.env.GOOGLE_CLIENT_ID,
      secret: process.env.GOOGLE_CLIENT_SECRET,
    },
    auth: oauthPlugin.GOOGLE_CONFIGURATION,
  },
  //The route where users start the Google login flow. Visiting this path redirects them to Google for authentication.
  startRedirectPath: '/auth/google',
  //The URL where Google will redirect users after they log in.
  callbackUri: process.env.GOOGLE_CALLBACK_URL,
});


// Auth routes
app.get('/auth/google/callback', authGoogleCallback);
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', { preHandler: authenticate }, logout);
app.get('/api/auth/me', { preHandler: authenticate }, me);

// User management routes
app.get('/api/user/profile', { preHandler: authenticate }, me); // Get current user's profile (reuse me endpoint)
app.put('/api/user/profile', { preHandler: authenticate }, updateProfile);
app.put('/api/user/profile/changePassword', { preHandler: authenticate }, changePassword);
app.get('/api/user/profile/:userId', { preHandler: authenticate }, getUserProfile);
app.get('/api/user/friends', { preHandler: authenticate }, getFriends);
app.get('/api/user/friend-getFriendRequests', { preHandler: authenticate }, getFriendRequests);

app.post('/api/user/challenge', { preHandler: authenticate }, challenge);
app.post('/api/user/friends/challengeRespond', { preHandler: authenticate }, respondChallenge);

app.post('/api/user/friend-request', { preHandler: authenticate }, sendFriendRequest);
app.post('/api/user/friend-response', { preHandler: authenticate }, respondToFriendRequest);
app.get('/api/user/match-history', { preHandler: authenticate }, getMatchHistory);

// Create Socket.IO server
const io = new Server(app.server, {
    cors: {
        origin: ['http://localhost:2323', 'http://127.0.0.1:2323'],
        methods: ["GET", "POST"]
    }
});

app.decorate('io', io);

// Game rooms
//gameRooms is an object so it store data as key-value pairs 
var gameRooms = {};
var nextRoomId = 1;
let freeRoomIds = [];
var roomPlayersAreIn = {};

//tournaments
var tournaments = {};

//The shift() method returns and removes the first element in the array
function createRoomId() {
    if (freeRoomIds.length > 0) {
        return `room${freeRoomIds.shift()}`; // reuse smallest available
    }
    return `room${nextRoomId++}`;
}

function releaseRoomId(roomId) {
    const num = parseInt(roomId.replace("room", ""));
    if (!isNaN(num)) {
        freeRoomIds.push(num);
//The main purpose of "(a, b) => a - b" is to sort the array numerically in ascending order.
        freeRoomIds.sort((a, b) => a - b); // keep ascending order
    }
}

function createGameState() {
    return {
        ball: { x: 400, y: 200, vx: 2, vy: 2, radius: 10 },
        player1: { x: 10, y: 150, width: 10, height: 100, score: 0 },
        player2: { x: 780, y: 150, width: 10, height: 100, score: 0, targetY: 150},
        gameEnded: false,
    };
}

//entries is a method of Object that returns an array of [key, value] pairs for all properties in an object.
function getLobbyInfo() {
console.log(Object.entries(gameRooms))
    return Object.entries(gameRooms).map(([id, room]) => ({
        roomId: id,
        players: room.players,
        aiEnabled: room.aiEnabled
    }));
}

function getTournamentLobbyInfo(userId) {

    let flag = false;

    //check if this id alias "userId" is from the tournament
    const tournament = tournaments[userId];
    if (tournament) {console.log("-----------brodcast message-------------");io.to(userId).emit("getCurrentTournament", tournaments[userId])}
    else {
        for (let i in tournaments) {
            const players = tournaments[i].players;
            const checkIfPLayerIsIn = players.some(p => p?.userId === userId);
            if (checkIfPLayerIsIn) {
                flag = true;
                io.to(userId).emit("getCurrentTournament", tournaments[i])
            }
        }
        if (!flag) io.to(userId).emit("getCurrentTournament", null)
        console.log("-----------individual message-------------")
    }
    console.log("Getting Tournament Lobby Info:", tournaments);
    return Object.entries(tournaments).map(([id, tournament]) => ({
        id,
        ...tournament
    }));
}

//Is not neccesary to delete the old gameRooms if any because assigning will overwrite it.
//this fucntion is not used
//function findAvailableRoom() {
//    for (let roomId in gameRooms) {
//        if (gameRooms[roomId].players.length < 2) return roomId;
//    }
//    const newRoomId =  createRoomId();
//    gameRooms[newRoomId] = { 
//        players: [], 
//        gameState: createGameState(),
//        startTime: Date.now()
//    };
//    return newRoomId;
//}

// Game loop
setInterval(async () => {
    for (let roomId in gameRooms) {
        const room = gameRooms[roomId];

        if (room.players.length === 2 || room.aiEnabled === true) {		
			if (room.aiEnabled) {
                updateAIPaddle(room.gameState.player2, room.aiDifficulty);
            }	
            await updateGame(room.gameState, roomId);
            const isPlayerInRoom = checkPlayerIsInRoom(room.players, roomId);
            if (isPlayerInRoom)
            {
                //console.log("Game updatinnnnngngnngng!!!")
                isPlayerInRoom.forEach(p => {
                    io.to(p.userId).emit('gameUpdate', {...room.gameState, players: room.players, aiDifficulty: room.aiDifficulty}, roomId);
                })
            }
        }

        if (room.players.length === 0) {
            // Make all sockets leave the Socket.IO room before deleting
            io.in(roomId).socketsLeave(roomId);
            
            delete gameRooms[roomId];
            releaseRoomId(roomId);
            io.emit("lobbyUpdate", getLobbyInfo());
        }
    }
}, 1000/60);

const checkPlayerIsInRoom = (players, roomId) => {
    return players.map(p => (roomId === roomPlayersAreIn[p.userId] ? p : null)).filter(p => p !== null);
}

// ---------------- AI Logic ----------------

//AI Logic with Difficulty
const DIFFICULTY_SETTINGS = {
    easy:    { paddleSpeed: 3, errorRange: 40, refreshRate: 1500 }, // slow + big errors
    medium:  { paddleSpeed: 5, errorRange: 20, refreshRate: 1000 }, // balanced
    hard:    { paddleSpeed: 8, errorRange: 5,  refreshRate: 500 }   // fast + precise
};

function refreshAILogic(room) {
    const { errorRange } = DIFFICULTY_SETTINGS[room.aiDifficulty];
    const ball = room.gameState.ball;
    const paddle = room.gameState.player2;

    if (ball.vx > 0) { 
        const timeToReach = (paddle.x - ball.x) / ball.vx;
        let predictedY = ball.y + ball.vy * timeToReach;

        predictedY = Math.max(0, Math.min(400 - paddle.height, predictedY));
        const error = Math.random() * errorRange - errorRange / 2;
        paddle.targetY = predictedY + error;
    } else {
        paddle.targetY = 200 - paddle.height / 2;
    }
}

function updateAIPaddle(paddle, difficulty) {
    const { paddleSpeed } = DIFFICULTY_SETTINGS[difficulty];
    if (paddle.y < paddle.targetY) {
        paddle.y += Math.min(paddleSpeed, paddle.targetY - paddle.y);
    } else if (paddle.y > paddle.targetY) {
        paddle.y -= Math.min(paddleSpeed, paddle.y - paddle.targetY);
    }
}

function startAIInterval(roomId) {
    const room = gameRooms[roomId];
    if (!room || !room.aiEnabled) return;

    const { refreshRate } = DIFFICULTY_SETTINGS[room.aiDifficulty];

    // Clear old timer if exists
    if (room.aiTimer) clearInterval(room.aiTimer);

    room.aiTimer = setInterval(() => {
        refreshAILogic(room);
    }, refreshRate);
}

// Protect socket with JWT
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Auth required'));
    
    try {
        const decoded = await app.jwt.verify(token);
        socket.user = decoded;
        next();
    } catch (error) {
        next(new Error('Invalid token'));
    }
});

// Store online users
app.decorate('onlineUsers', new Map()); // userId -> socketId

// Socket.IO connection
io.on("connection", (socket) => {
    console.log("🎮 Player connected:", socket.user.username, socket.user.id);

     const userId = socket.user.id;
     app.onlineUsers.set(userId, socket.id);

    // Join the user’s personal room (based on their ID)
    socket.join(socket.user.id);
    socket.playerRoom = new Map();




    //tournaments
    socket.on("createTournament",  (tournamentName, numberOfPlayers, type) => {

        //checkIf tournament with the same name exists
        let uniqueName = tournamentName;
        let count = 1;
        while (Object.values(tournaments).some(t => t.name === uniqueName)) {
            uniqueName = tournamentName + '#'.repeat(count);
            count++;
        }
        const tournamentId = Date.now().toString(); //simple unique id
        tournaments[tournamentId] = {
            id: tournamentId,
            name: uniqueName,
            numberOfPlayers: numberOfPlayers,
            type: type,
            players: [],
            matches: [],
            status: 'waiting' //waiting, ongoing, finished
        };
        tournaments[tournamentId].players.push({userId: socket.user.id, username: socket.user.username, host: true})
        socket.join(tournamentId);
        console.log(`the ${uniqueName} TOURNAMENT has been created`)
        io.emit("tournamentLobbyInfo", getTournamentLobbyInfo(socket.user.id));
    })

    socket.on("removePlayerFromTournament", (playerId, tournamentId) => {
        const tournament = tournaments[tournamentId];
        if (!tournament) return ;
        const players = tournament.players
        if (players.length <= 0) {delete tournaments[tournamentId]; return}
        tournament.players = players.filter(p => p?.userId !== playerId);
        if (tournament.players.length <= 0) {delete tournaments[tournamentId]}

        //check if there's a host if not make a second first palyer to join to host
        const checkIFAnyHost = tournament.players.some(p => p?.host === true);
        if (!checkIFAnyHost && tournament.players.length > 0) {
            tournament.players[0].host = true;
        }

        socket.leave(tournamentId);
        io.emit("tournamentLobbyInfo", getTournamentLobbyInfo(tournamentId))
        io.to(playerId).emit("getCurrentTournament", null)
        io.to(tournamentId).emit("startTournament", {tournamentId, started: false})
    })

    socket.emit("tournamentLobbyInfo", getTournamentLobbyInfo(socket.user.id));


    socket.on("CheckTournamentLobbies", () => {
        io.emit("tournamentLobbyInfo", getTournamentLobbyInfo(socket.user.id));
    })

    socket.on("joinTournament", (tournamentId, tournamentName, userId) => {
        const tournament = tournaments[tournamentId];
        if (!tournament) {console.log("Returning because the tournament doesn't exits");return;}

        //check if player is already in
        const checkIfPlayerIsIn = tournament.players.some(p => p.userId === socket.user.id);
        if (checkIfPlayerIsIn) {console.log("Returning because player is in");return;}

        //check if tournament is full
        const checkIfFull = tournament.players.length >= tournament.numberOfPlayers;
        if (checkIfFull) {console.log("Returning because the tournament is full");return;}

        socket.join(tournamentId);
        tournament.players.push({userId: socket.user.id, username: socket.user.username, host: false})
        //check is player is ready to start
        io.emit("tournamentLobbyInfo", getTournamentLobbyInfo(tournamentId));
        if (tournament.players.length === Number(tournament.numberOfPlayers)) {
            io.to(tournamentId).emit("startTournament", {tournamentId, started: true})
        }
    })







    const joinRooms = () => {
        for (let roomId in gameRooms) {
            const players = gameRooms[roomId].players;
            const IsPlayerInRoom = players.some(p => p.userId === socket.user.id);
            if (IsPlayerInRoom) {
                socket.join(roomId);
                const isPlayer1 = players.find(p => p.userId === socket.user.id)?.isPlayer1;
                console.log("OnjoiningRooms -> isPlayer1", isPlayer1);
                socket.playerRoom.set(roomId, isPlayer1)
            }
        }
    }

    joinRooms();

    // Send current lobby info
    socket.emit("lobbyUpdate", getLobbyInfo());

    socket.emit("startConnection", {
        isPlyerInRoom: gameRooms[roomPlayersAreIn[socket.user.id]]?.players.some(p => p.userId === socket.user.id),
        roomImIn: roomPlayersAreIn[socket.user.id] || null,
        aiEnabled: gameRooms[roomPlayersAreIn[socket.user.id]]?.aiEnabled || false
    })

    socket.on("createRoom", (roomNameId, {mode}) => {

        const aiEnabled = mode === 'AI';
        
        // If room already exists, append $ until we find unique name
        while (gameRooms[roomNameId]) {
            roomNameId = roomNameId + '$';
        }

        // If roomNameId is a number, add a () to not delete the sockets of the users!
        if (/^\d+$/.test(roomNameId)) {
            roomNameId = `(${roomNameId})`;
        }
    
        console.log(`🎮 Creating room '${roomNameId}' with AI=${aiEnabled}, mode='${mode}'`);
    
        gameRooms[roomNameId] = {
            players: [],
            gameState: createGameState(),
            startTime: Date.now(),
            aiEnabled,
            aiDifficulty: 'medium'
        }
        const room = gameRooms[roomNameId];
        socket.join(roomNameId);
        //set is player is player1 in this room (in this case is true)
        socket.playerRoom.set(roomNameId, true)
        room.players.push({id: socket.id, isPlayer1: true, userId: socket.user.id, username: socket.user.username})
        io.emit("lobbyUpdate", getLobbyInfo());
        if (mode === "AI") {
            startAIInterval(roomNameId);
			io.to(roomNameId).emit("gameReady", { message: `Game ready in ${roomNameId}!` });
		}
    })
    socket.on("roomImIn", (roomId) => {
        //const room = gameRooms[roomId];
        //if (!room) return;
        //const isPlyerInRoom = room.players.some(p => p.userId === socket.user.is)
        //if (isPlyerInRoom)
        roomPlayersAreIn[socket.user.id] = roomId;
    })
    socket.on("joinRoomGame", (roomId) => {
        const room = gameRooms[roomId];
        if (!room) return;
        
        console.log(`🔍 ${socket.user.username} trying to join ${roomId}. AI=${room.aiEnabled}, players=${room.players.length}`);
        
        //check if player is in this room
        const isPlyerInRoom = room.players.some(p => p.userId === socket.user.id)
        if (isPlyerInRoom) {
            //just return because socket.emit("roomImIn", roomIamIn) is gonna let the server know which room to join
            console.log(`${socket.user.username} is re joining the room: ${roomId} like isPlayer1: ${socket.playerRoom.get(roomId)}`)
            //send User if this room is AI enabled 
            io.to(socket.user.id).emit("roomJoinedInfo", {aiEnabled: room.aiEnabled});
            console.log("reJoining game as", socket.user.username);
            return ;
        }
        //check if room is full
        if (room.players.length === 2 || room.aiEnabled) {
            console.log(`❌ ${socket.user.username} BLOCKED from ${roomId} (AI=${room.aiEnabled}, players=${room.players.length})`); 
            return;
        }

        console.log("JoinRoomGame as", socket.user.username);

        //join Room
        room.players.push({id: socket.id, isPlayer1: false, userId: socket.user.id, username: socket.user.username})
        //join socket to receive info from this roomId
        socket.join(roomId)
        //set is player is player1 in this room (in this case is false)
        socket.playerRoom.set(roomId, false)
        //send User if this room is AI enabled 
        io.to(socket.user.id).emit("roomJoinedInfo", {aiEnabled: room.aiEnabled});
        io.emit("lobbyUpdate", getLobbyInfo())
    })

    socket.on("joinRoom", (requestedRoomId, startGame, { mode }, challengeRoom) => {

		// Prevent joining multiple rooms simultaneously
		if (socket.roomId && socket.roomId !== requestedRoomId) {
			socket.emit("alreadyInRoom", {
				message: `You're already in ${socket.roomId}. Leave that room first!`,
				currentRoom: socket.roomId
			});
			return;
		}

		if (challengeRoom) {
			console.log(requestedRoomId);
			gameRooms[requestedRoomId] = {
				players: [],
				gameState: createGameState(),
				startTime: Date.now(),
				aiEnabled: false,
				aiDifficulty: "medium"
				
			}
			const room = gameRooms[requestedRoomId];
			socket.join(requestedRoomId);
			room.players.push({ id: socket.id, isPlayer1: true, userId: challengeRoom.player1 });
			socket.roomId = requestedRoomId;
			room.players.push({ id: 0, isPlayer1: false, userId: challengeRoom.player2 });

			socket.emit("gameUpdate", room.gameState);
			socket.emit("playerAssignment", {
				isPlayer1: false,
				requestedRoomId,
				playersInRoom: room.players.length,
				message: `Room ${requestedRoomId} - You are Player "2"}`,
				aiEnabled: room.aiEnabled
			});

			socket.emit("lobbyUpdate", getLobbyInfo());
			return;
		}
		if (!startGame) {
			socket.emit("chooseOpponent");
			return ;
		}
		const checkRoom = gameRooms[requestedRoomId];
		//here we can stop users from entering a room where AI mode is activated!
		if (checkRoom && (checkRoom.players.length === 2 || checkRoom.aiEnabled === true)) {
			const existingPlayer = checkRoom.players.find(p => p.userId === socket.user.id);
			if (!existingPlayer) {
				socket.emit("checkRoomStatus", {
				roomId: requestedRoomId,
				status: "roomFull",
				message: `The ${requestedRoomId} is full!`,
				isPlayer1: false,
				aiEnabled: false
				 })
				console.log("checking RoomStatus: ->roomFull");
				return ;
			}
		}
		if (checkRoom) {
			const existingPlayer = checkRoom.players.find(p => p.userId === socket.user.id);

			if (existingPlayer) {
				socket.join(requestedRoomId);
				socket.roomId = requestedRoomId;
				socket.isPlayer1 = existingPlayer.isPlayer1;
				socket.emit("checkRoomStatus",  {
					roomId: requestedRoomId,
					status: "updateRoom",
					message: `You are in the ${requestedRoomId}!`,
					isPlayer1: existingPlayer.isPlayer1,
					aiEnabled: checkRoom.aiEnabled
				});
				console.log("checking RoomStatus: ->updateRoom");
				return ;
			}
		}
		
		let roomId = requestedRoomId || createRoomId();

        // Create room if it doesn't exist
		if (mode === "AI") {
			gameRooms[roomId] = {
				players: [],
				gameState: createGameState(),
				startTime: Date.now(),
				aiEnabled: true,
				aiDifficulty: "medium"
				
			}
		}
        if (!gameRooms[roomId]) {
            gameRooms[roomId] = 
            {
                players: [],
                gameState: createGameState(),
                startTime: Date.now(),
				aiEnabled: false,
            };
            console.log(`🆕 Room created: ${roomId}`);
        }

		const room = gameRooms[roomId];

		// 👇 if not reconnecting → normal new player join logic
        //this is handle in the emit("joinRoom") in the fron-end so it can safely be remove
		//if (room.players.length >= 2) {
		//	socket.emit("roomFull", { message: `Room ${roomId} is full.` });
		//	return;
		//}

		socket.join(roomId);
		const isPlayer1 = room.players.length === 0;
		room.players.push({ id: socket.id, isPlayer1, userId: socket.user.id });
		socket.roomId = roomId;
		socket.isPlayer1 = isPlayer1;

		socket.emit("gameUpdate", room.gameState);
		socket.emit("playerAssignment", {
			isPlayer1,
			roomId,
			playersInRoom: room.players.length,
			message: `Room ${roomId} - You are Player ${isPlayer1 ? "1" : "2"}`,
			aiEnabled: room.aiEnabled
		});

		if (mode === "AI") {
            startAIInterval(roomId);
			io.to(roomId).emit("gameReady", { message: `Game ready in ${roomId}!` });
		}
		else if (room.players.length === 2) {
			io.to(roomId).emit("gameReady", { message: `Game ready in ${roomId}!` });
		}
		else {
			socket.emit("waitingForPlayer", {
                message: `Waiting for an opponent to join room ${roomId}...`
            });
		}
		io.emit("lobbyUpdate", getLobbyInfo());

	});

	socket.on('setDifficulty', (data, roomId) => {
        const room = gameRooms[roomId];
        if (room && ["easy", "medium", "hard"].includes(data.level)) {
            room.aiDifficulty = data.level;
            console.log(`🎚️ Difficulty for ${roomId} set to ${data.level}`);
            startAIInterval(roomId); // restart with new refreshRate
        }
    });

	// Leave room
	socket.on("leaveRoom", () => {
		const roomId = socket.roomId;
		if (!roomId) return;
		
		const room = gameRooms[roomId];
		if (room) {
			room.players = room.players.filter(p => p.id !== socket.id);
			socket.leave(roomId);
			console.log(`👋 ${socket.user.username} left ${roomId}`);
			
			// Notify others
			socket.to(roomId).emit("opponentLeft", { 
				message: "Opponent left the game." 
			});
		}
		
		socket.roomId = null;
		socket.isPlayer1 = null;
		
		io.emit("lobbyUpdate", getLobbyInfo());
	});

    // Paddle movement
    socket.on("paddleMove", (data) => {
        const room = gameRooms[data.room];
        if (!room || room.gameState.gameEnded) return;

        const isPlayer1 = socket.playerRoom.get(data.room)
        if (isPlayer1) room.gameState.player1.y = Math.max(0, Math.min(300, data.y));
        else room.gameState.player2.y = Math.max(0, Math.min(300, data.y));
        //if (socket.isPlayer1) room.gameState.player1.y = Math.max(0, Math.min(300, data.y));
        //else room.gameState.player2.y = Math.max(0, Math.min(300, data.y));
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        //onlineUsers.delete(userId);
        console.log("❌ Player disconnected:", socket.user.username, socket.user.id);
        //app.onlineUsers.delete(socket.user.id);
        return;
		const roomId = socket.roomId;
		if (!roomId || !gameRooms[roomId]) return;

		const room = gameRooms[roomId];
		const player = room.players.find(p => p.id === socket.id);

		if (player) {
			console.log(`⚠️ ${player.userId} disconnected from ${roomId}, waiting 10s...`);

			// mark player as disconnected
			player.disconnected = true;

			// notify opponent
			socket.to(roomId).emit("opponentDisconnected", {
				message: "⚠️ Opponent disconnected. Waiting 10s for them to return..."
			});

			if (room.players.length === 0) {
				delete gameRooms[roomId];
				releaseRoomId(roomId);
				console.log(`🗑️ Room ${roomId} deleted`);
			} else {
				io.to(roomId).emit("opponentLeft", { message: "Opponent left the game." });
			}

			io.emit("lobbyUpdate", getLobbyInfo());
		}
	});


});
// Game physics
async function updateGame(gameState, roomId) {
    // Don't update if game has ended
    if (gameState.gameEnded) return;
    
    gameState.ball.x += gameState.ball.vx;
    gameState.ball.y += gameState.ball.vy;
    if (gameState.ball.y <= 0 || gameState.ball.y >= 400) gameState.ball.vy *= -1;

    if (gameState.ball.x === 20 && gameState.ball.y >= gameState.player1.y && gameState.ball.y <= gameState.player1.y + 100)
        gameState.ball.vx *= -1;
    if (gameState.ball.x === 780 && gameState.ball.y >= gameState.player2.y && gameState.ball.y <= gameState.player2.y + 100)
        gameState.ball.vx *= -1;

    let gameEnded = false;
    if (gameState.ball.x < 0) { 
        gameState.player2.score++; 
        resetBall(gameState);
        if (gameState.player2.score >= 20) gameEnded = true;
    }
    else if (gameState.ball.x > 800) { 
        gameState.player1.score++; 
        resetBall(gameState);
        if (gameState.player1.score >= 20) gameEnded = true;
    }

    // Save match when game ends
    if (gameEnded && gameRooms[roomId]) {
        gameState.gameEnded = true; // Mark game as ended to stop updates
        const room = gameRooms[roomId];
        
        // Clean up roomPlayersAreIn - remove players who were viewing this room
        for (const userId in roomPlayersAreIn) {
            if (roomPlayersAreIn[userId] === roomId) {
                delete roomPlayersAreIn[userId];
            }
        }

        if (room.players.length === 2) {
            const player1 = room.players.find(p => p.isPlayer1);
            const player2 = room.players.find(p => !p.isPlayer1);
            
            if (player1 && player2 && player1.userId && player2.userId) {
                const winnerId = gameState.player1.score > gameState.player2.score ? player1.userId : player2.userId;

                // Save match to database
                console.log(`Saving match:player1Id=${player1.userId}, player2Id=${player2.userId}, player1Score=${gameState.player1.score}, player2Score=${gameState.player2.score}, winnerId=${winnerId}`);
                await Match.create({
                    player1Id: player1.userId,
                    player2Id: player2.userId,
                    player1Score: gameState.player1.score,
                    player2Score: gameState.player2.score,
                    winnerId: winnerId,
                    duration: Math.floor((Date.now() - room.startTime) / 1000),
                    startGameTime: new Date(room.startTime).toLocaleString(),
                    gameType: '1v1'
                });

                // Update user stats
                const winnerUser = await User.findByPk(winnerId);
                const loserUser = await User.findByPk(winnerId === player1.userId ? player2.userId : player1.userId);
                
                await winnerUser.update({ wins: winnerUser.wins + 1 });
                await loserUser.update({ losses: loserUser.losses + 1 });
            }
        }
		io.to(roomId).emit("gameEnded", {roomId});
		
		// Make all sockets leave the Socket.IO room before deleting
        // with io.sockets.sockets with access to all sockets created: io -> (chosen) sockets (both fixed)
        room.players.forEach(player => {
            const playerSocket = io.sockets.sockets.get(player.id);
            if (playerSocket) {
                playerSocket.leave(roomId);
                // roomPlayersAreIn already cleaned up above (lines 607-612)
            }
        })
		
		delete gameRooms[roomId];
		//releaseRoomId(roomId);
		console.log(`🗑️ Room ${roomId} deleted`);
		io.emit("lobbyUpdate", getLobbyInfo());
    }
}

function resetBall(gameState) {
    gameState.ball.x = 400;
    gameState.ball.y = 200;
    gameState.ball.vx = gameState.ball.vx > 0 ? -2 : 2;
    gameState.ball.vy = Math.random() > 0.5 ? 2 : -2;
}

// Start server
const start = async () => {
    try {
        // Initialize database first
        await initializeDatabase();
        
        await app.listen({ port: 3000, host: '0.0.0.0' });
        console.log('🚀 Pong server running on http://localhost:3000');
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
