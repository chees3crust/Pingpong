// Check which page we're on
const currentPage = window.location.pathname.split('/').pop();

// Authentication functions
function registerUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const message = document.getElementById('message');
    
    if (!username || !password) {
        message.textContent = 'Please enter both username and password';
        return;
    }
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('pingPongUsers') || '{}');
    
    if (users[username]) {
        message.textContent = 'Username already exists';
        return;
    }
    
    // Store new user
    users[username] = { password, scores: [] };
    localStorage.setItem('pingPongUsers', JSON.stringify(users));
    
    message.textContent = 'Registration successful! You can now login.';
    message.style.color = '#4CAF50';
}

function loginUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const message = document.getElementById('message');
    
    if (!username || !password) {
        message.textContent = 'Please enter both username and password';
        return;
    }
    
    // Check credentials
    const users = JSON.parse(localStorage.getItem('pingPongUsers') || '{}');
    
    if (!users[username] || users[username].password !== password) {
        message.textContent = 'Invalid username or password';
        return;
    }
    
    // Set current user
    localStorage.setItem('currentPingPongUser', username);
    
    // Redirect to game page
    window.location.href = 'game.html';
}

function logoutUser() {
    localStorage.removeItem('currentPingPongUser');
    window.location.href = 'index.html';
}

function checkAuth() {
    const currentUser = localStorage.getItem('currentPingPongUser');
    
    if (!currentUser && currentPage !== 'index.html') {
        window.location.href = 'index.html';
    }
    
    if (currentUser && currentPage === 'index.html') {
        window.location.href = 'game.html';
    }
    
    if (currentUser && (currentPage === 'game.html' || currentPage === 'scores.html')) {
        const userDisplay = document.getElementById('user-display');
        if (userDisplay) {
            userDisplay.textContent = `Player: ${currentUser}`;
        }
    }
}

// Game variables and functions
let canvas, ctx;
let playerPaddle, computerPaddle, ball;
let playerScore, computerScore;
let gameInterval;
let gameRunning = false;

function initGame() {
    canvas = document.getElementById('pong-canvas');
    if (!canvas) return;
    
    canvas.width = 600;
    canvas.height = 400;
    ctx = canvas.getContext('2d');
    
    playerPaddle = {
        x: 10,
        y: canvas.height / 2 - 40,
        width: 10,
        height: 80,
        speed: 8,
        color: '#fff'
    };
    
    computerPaddle = {
        x: canvas.width - 20,
        y: canvas.height / 2 - 40,
        width: 10,
        height: 80,
        speed: 5,
        color: '#fff'
    };
    
    ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 8,
        speedX: 5,
        speedY: 5,
        color: '#fff'
    };
    
    playerScore = 0;
    computerScore = 0;
    
    updateScoreDisplay();
    
    // Add mouse movement for player paddle
    canvas.addEventListener('mousemove', (e) => {
        if (!gameRunning) return;
        
        const canvasRect = canvas.getBoundingClientRect();
        const mouseY = e.clientY - canvasRect.top;
        
        // Update paddle position based on mouse, keeping it within canvas bounds
        playerPaddle.y = Math.max(0, Math.min(canvas.height - playerPaddle.height, mouseY - playerPaddle.height / 2));
    });
}

function startGame() {
    if (gameRunning) return;
    
    resetBall();
    gameRunning = true;
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('restart-btn').style.display = 'none';
    document.getElementById('game-message').textContent = '';
    
    gameInterval = setInterval(updateGame, 1000 / 60); // 60 FPS
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    
    // Randomize ball direction
    ball.speedX = (Math.random() > 0.5 ? 1 : -1) * 5;
    ball.speedY = (Math.random() * 2 - 1) * 5;
}

function updateGame() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Move ball
    ball.x += ball.speedX;
    ball.y += ball.speedY;
    
    // Ball collision with top and bottom walls
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.speedY = -ball.speedY;
    }
    
    // Ball collision with paddles
    if (
        ball.x - ball.radius < playerPaddle.x + playerPaddle.width &&
        ball.y > playerPaddle.y &&
        ball.y < playerPaddle.y + playerPaddle.height &&
        ball.speedX < 0
    ) {
        ball.speedX = -ball.speedX;
        // Add some angle based on where the ball hits the paddle
        const hitPosition = (ball.y - (playerPaddle.y + playerPaddle.height / 2)) / (playerPaddle.height / 2);
        ball.speedY = hitPosition * 5;
    }
    
    if (
        ball.x + ball.radius > computerPaddle.x &&
        ball.y > computerPaddle.y &&
        ball.y < computerPaddle.y + computerPaddle.height &&
        ball.speedX > 0
    ) {
        ball.speedX = -ball.speedX;
        // Add some angle based on where the ball hits the paddle
        const hitPosition = (ball.y - (computerPaddle.y + computerPaddle.height / 2)) / (computerPaddle.height / 2);
        ball.speedY = hitPosition * 5;
    }
    
    // Computer paddle AI
    const computerPaddleCenter = computerPaddle.y + computerPaddle.height / 2;
    if (ball.speedX > 0) { // Only move if ball is coming towards computer
        if (computerPaddleCenter < ball.y - 15) {
            computerPaddle.y += computerPaddle.speed;
        } else if (computerPaddleCenter > ball.y + 15) {
            computerPaddle.y -= computerPaddle.speed;
        }
    }
    
    // Keep computer paddle within canvas
    computerPaddle.y = Math.max(0, Math.min(canvas.height - computerPaddle.height, computerPaddle.y));
    
    // Ball out of bounds - scoring
    if (ball.x < 0) {
        computerScore++;
        updateScoreDisplay();
        checkGameEnd();
        resetBall();
    } else if (ball.x > canvas.width) {
        playerScore++;
        updateScoreDisplay();
        checkGameEnd();
        resetBall();
    }
    
    // Draw paddles and ball
    drawRect(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height, playerPaddle.color);
    drawRect(computerPaddle.x, computerPaddle.y, computerPaddle.width, computerPaddle.height, computerPaddle.color);
    drawCircle(ball.x, ball.y, ball.radius, ball.color);
}

function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawCircle(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
}

function updateScoreDisplay() {
    const playerScoreElement = document.getElementById('player-score');
    const computerScoreElement = document.getElementById('computer-score');
    
    if (playerScoreElement && computerScoreElement) {
        playerScoreElement.textContent = playerScore;
        computerScoreElement.textContent = computerScore;
    }
}

function checkGameEnd() {
    if (playerScore >= 5 || computerScore >= 5) {
        gameRunning = false;
        clearInterval(gameInterval);
        
        const gameMessage = document.getElementById('game-message');
        if (playerScore >= 5) {
            gameMessage.textContent = 'You win!';
            gameMessage.style.color = '#4CAF50';
        } else {
            gameMessage.textContent = 'Computer wins!';
            gameMessage.style.color = '#f44336';
        }
        
        document.getElementById('restart-btn').style.display = 'inline-block';
        
        // Save game result
        saveGameResult();
    }
}

function saveGameResult() {
    const currentUser = localStorage.getItem('currentPingPongUser');
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('pingPongUsers') || '{}');
    if (!users[currentUser]) return;
    
    const gameResult = {
        date: new Date().toISOString(),
        playerScore: playerScore,
        computerScore: computerScore,
        result: playerScore > computerScore ? 'Win' : 'Loss'
    };
    
    users[currentUser].scores.push(gameResult);
    localStorage.setItem('pingPongUsers', JSON.stringify(users));
}

function displayScoreHistory() {
    const currentUser = localStorage.getItem('currentPingPongUser');
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('pingPongUsers') || '{}');
    if (!users[currentUser]) return;
    
    const scores = users[currentUser].scores;
    const scoresBody = document.getElementById('scores-body');
    const noScores = document.getElementById('no-scores');
    
    if (scores.length === 0) {
        if (noScores) noScores.style.display = 'block';
        return;
    }
    
    if (noScores) noScores.style.display = 'none';
    
    scores.forEach(score => {
        const row = document.createElement('tr');
        
        const dateCell = document.createElement('td');
        dateCell.textContent = new Date(score.date).toLocaleString();
        
        const playerScoreCell = document.createElement('td');
        playerScoreCell.textContent = score.playerScore;
        
        const computerScoreCell = document.createElement('td');
        computerScoreCell.textContent = score.computerScore;
        
        const resultCell = document.createElement('td');
        resultCell.textContent = score.result;
        resultCell.style.color = score.result === 'Win' ? '#4CAF50' : '#f44336';
        
        row.appendChild(dateCell);
        row.appendChild(playerScoreCell);
        row.appendChild(computerScoreCell);
        row.appendChild(resultCell);
        
        scoresBody.appendChild(row);
    });
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    if (currentPage === 'index.html') {
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        
        if (loginBtn) loginBtn.addEventListener('click', loginUser);
        if (registerBtn) registerBtn.addEventListener('click', registerUser);
    }
    
    if (currentPage === 'game.html') {
        initGame();
        
        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (startBtn) startBtn.addEventListener('click', startGame);
        if (restartBtn) restartBtn.addEventListener('click', startGame);
        if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
    }
    
    if (currentPage === 'scores.html') {
        displayScoreHistory();
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
    }
}); 