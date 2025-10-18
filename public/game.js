"use strict";
// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// Game state
let gameState = null;
let isPlayer1 = false;
let roomId = null;
socket.on("checkRoomStatus", (roomState) => {
    alert(`${roomState.message}`);
    if (roomState.status === "updateRoom") {
        roomId = roomState.roomId;
        isPlayer1 = roomState.isPlayer1;
        const playerInfoElement = document.getElementById('playerInfo');
        if (playerInfoElement) {
            playerInfoElement.textContent = `You are in the ${roomId}!`;
        }
        if (roomState.aiEnabled === false) {
            const levelDifficulty = document.getElementById("levelDifficulty");
            if (levelDifficulty) {
                levelDifficulty.style.display = "none";
            }
        }
        else if (roomState.aiEnabled === true) {
            const levelDifficulty = document.getElementById("levelDifficulty");
            if (levelDifficulty) {
                levelDifficulty.style.display = "flex";
            }
        }
    }
});
socket.on("chooseOpponent", () => {
    const modal = document.getElementById("continueModal");
    const message = document.getElementById("continueMessage");
    const yesBtn = document.getElementById("continueYes");
    const noBtn = document.getElementById("continueNo");
    if (!modal || !message || !yesBtn || !noBtn)
        return;
    message.textContent = "Who do you want to play against?";
    modal.style.display = "flex";
    yesBtn.onclick = () => {
        const levelDifficulty = document.getElementById("levelDifficulty");
        levelDifficulty.style.display = "flex";
        socket.emit("joinRoom", null, true, { mode: "AI" }), null;
        modal.style.display = "none";
    };
    noBtn.onclick = () => {
        socket.emit("joinRoom", null, true, { mode: "PVP" }, null);
        modal.style.display = "none";
    };
});
function setDifficulty(level) {
    // Example: send difficulty to server or update game settings
    socket.emit('setDifficulty', { level }, roomId);
    // Optionally, update UI or show a message
    console.log('Difficulty set to:', level, ' in the |', roomId, '|');
}
socket.on("waitingForPlayer", (data) => {
    const playerInfoElement = document.getElementById('playerInfo');
    if (playerInfoElement) {
        playerInfoElement.textContent = data.message;
    }
});
socket.on("lobbyUpdate", (rooms) => {
    const lobbyDiv = document.getElementById("lobby");
    if (!lobbyDiv)
        return;
    lobbyDiv.innerHTML = "<h3>Available Rooms:</h3>";
    if (rooms.length === 0) {
        lobbyDiv.innerHTML += "<p>No active rooms. Create one!</p>";
    }
    else {
        rooms.forEach((room) => {
            const btn = document.createElement("button");
            btn.textContent = `${room.roomId} (${room.players}/2)`;
            btn.onclick = () => socket.emit("joinRoom", room.roomId, true, { mode: "NOTHING" }, null);
            lobbyDiv.appendChild(btn);
        });
    }
    const createBtn = document.createElement("button");
    createBtn.textContent = "➕ Create New Room";
    createBtn.onclick = () => socket.emit("joinRoom", null, false, { mode: "NOTHING" }, null);
    lobbyDiv.appendChild(createBtn);
});
socket.on('connect_error', (err) => {
    alert('Authentication required. Please log in.');
    window.location.href = '/login.html';
});
socket.on("gameEnded", (roomIdDeleted) => {
    if (roomId === roomIdDeleted) {
        roomId = null;
        gameState = null;
    }
});
socket.on('playerDisconnected', (data) => {
    const playerInfoElement = document.getElementById('playerInfo');
    if (playerInfoElement) {
        playerInfoElement.textContent = data.message;
    }
});
// extra disconnection/reconnection updates
socket.on("opponentDisconnected", (msg) => {
    const playerInfoElement = document.getElementById('playerInfo');
    if (playerInfoElement) {
        playerInfoElement.textContent = msg.message;
    }
});
socket.on("opponentReconnected", (msg) => {
    const playerInfoElement = document.getElementById('playerInfo');
    if (playerInfoElement) {
        playerInfoElement.textContent = msg.message;
    }
});
// Socket event listeners
socket.on('playerAssignment', (data) => {
    isPlayer1 = data.isPlayer1;
    roomId = data.roomId;
    const playerInfoElement = document.getElementById('playerInfo');
    if (playerInfoElement) {
        playerInfoElement.textContent = data.message;
    }
    if (data.aiEnabled === true) {
        const levelDifficulty = document.getElementById("levelDifficulty");
        if (levelDifficulty) {
            levelDifficulty.style.display = "flex";
        }
    }
    else {
        const levelDifficulty = document.getElementById("levelDifficulty");
        if (levelDifficulty) {
            levelDifficulty.style.display = "none";
        }
    }
});
socket.on('gameReady', (data) => {
    const playerInfoElement = document.getElementById('playerInfo');
    if (playerInfoElement) {
        playerInfoElement.textContent = data.message;
    }
});
socket.on('gameUpdate', (data, roomToRender) => {
    if (roomToRender === roomId) {
        gameState = data;
        updateScore();
        draw();
    }
});
socket.on('playerDisconnected', (data) => {
    const playerInfoElement = document.getElementById('playerInfo');
    if (playerInfoElement) {
        playerInfoElement.textContent = data.message;
    }
});
socket.on('gameReset', (data) => {
    const playerInfoElement = document.getElementById('playerInfo');
    if (playerInfoElement) {
        playerInfoElement.textContent = data.message;
    }
});
// Mouse movement for paddle control
canvas.addEventListener('mousemove', (e) => {
    if (!gameState || gameState.gameEnded)
        return; // Don't allow movement if game ended
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    // Send paddle position to server
    socket.emit('paddleMove', { y: mouseY - 50 }); // Center paddle on mouse
});
// Update score display
function updateScore() {
    if (gameState) {
        const score1Element = document.getElementById('score1');
        const score2Element = document.getElementById('score2');
        if (score1Element) {
            score1Element.textContent = gameState.player1.score.toString();
        }
        if (score2Element) {
            score2Element.textContent = gameState.player2.score.toString();
        }
    }
}
// Draw the game
function draw() {
    if (!gameState || !roomId)
        return;
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw center line
    ctx.strokeStyle = '#fff';
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    // Draw paddles
    ctx.fillStyle = '#fff';
    ctx.fillRect(gameState.player1.x, gameState.player1.y, gameState.player1.width, gameState.player1.height);
    ctx.fillRect(gameState.player2.x, gameState.player2.y, gameState.player2.width, gameState.player2.height);
    // Draw ball
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    // Highlight current player's paddle
    if (isPlayer1) {
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 3;
        ctx.strokeRect(gameState.player1.x - 1, gameState.player1.y - 1, gameState.player1.width + 2, gameState.player1.height + 2);
    }
    else {
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 3;
        ctx.strokeRect(gameState.player2.x - 1, gameState.player2.y - 1, gameState.player2.width + 2, gameState.player2.height + 2);
    }
}
//# sourceMappingURL=game.js.map