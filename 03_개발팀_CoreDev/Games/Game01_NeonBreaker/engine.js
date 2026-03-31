const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("scoreValue");
const livesEl = document.getElementById("livesValue");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDesc");
const startBtn = document.getElementById("startBtn");
const closeBtn = document.getElementById("closeBtn");
const pauseOverlay = document.getElementById("pauseOverlay");
const resumeBtn = document.getElementById("resumeBtn");
const hudPauseBtn = document.getElementById("hudPauseBtn");
const gameContainer = document.getElementById("game-container");

// Game Variables
let rafId;
let isPlaying = false;
let isPaused = false;
let score = 0;
let lives = 3;

// Paddles & Balls
const paddle = { w: 120, h: 15, x: canvas.width/2 - 60, y: canvas.height - 40, color: "#3b82f6", speed: 8, dx: 0 };
const ball = { x: canvas.width/2, y: canvas.height - 60, r: 8, speed: 6, dx: 4, dy: -4, color: "#ffffff" };

// Bricks
const brickRowCount = 5;
const brickColumnCount = 8;
const brickPadding = 15;
const brickOffsetTop = 70;
const brickOffsetLeft = 35;
const brickWidth = 75;
const brickHeight = 25;
const colors = ["#ec4899", "#facc15", "#22c55e", "#a855f7", "#3b82f6"];
let bricks = [];

// Particles Array
let particles = [];

// Controls
let rightPressed = false;
let leftPressed = false;

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
// Mouse touch control for pragmatic smooth feel
canvas.addEventListener("mousemove", mouseMoveHandler);

function keyDownHandler(e) { 
    if (e.key === "Escape" || e.key === "Esc" || e.code === "Escape" || e.key.toLowerCase() === "p") {
        e.preventDefault();
        togglePause();
        return;
    }
    if(e.key === "Right" || e.key === "ArrowRight") rightPressed = true; 
    else if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = true; 
}
function keyUpHandler(e) { if(e.key === "Right" || e.key === "ArrowRight") rightPressed = false; else if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = false; }
function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.getBoundingClientRect().left;
    if(relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.w/2;
    }
}

// Particle System
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 3;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * -6 - 2;
        this.gravity = 0.4;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
    }
    update() {
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }
}
function createExplosion(x, y, color) {
    for(let i=0; i<15; i++) particles.push(new Particle(x, y, color));
    screenShake();
}
function screenShake() {
    gameContainer.classList.add('shake');
    setTimeout(() => { gameContainer.classList.remove('shake'); }, 200);
}

// Initialization
function initBricks() {
    bricks = [];
    for(let c=0; c<brickColumnCount; c++) {
        bricks[c] = [];
        for(let r=0; r<brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1, color: colors[r] };
        }
    }
}

function resetBall() {
    ball.x = paddle.x + paddle.w/2;
    ball.y = paddle.y - ball.r - 2;
    // Launch random angle up
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 2 + 3);
    ball.dy = -ball.speed;
}

// Drawing Functions
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
    ctx.fillStyle = ball.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ffffff";
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0; // reset
}
function drawPaddle() {
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 5);
    ctx.fillStyle = paddle.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = paddle.color;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}
function drawBricks() {
    for(let c=0; c<brickColumnCount; c++) {
        for(let r=0; r<brickRowCount; r++) {
            let b = bricks[c][r];
            if(b.status === 1) {
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                b.x = brickX; b.y = brickY;
                ctx.beginPath();
                ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 3);
                ctx.fillStyle = b.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = b.color;
                ctx.fill();
                ctx.strokeStyle = "rgba(255,255,255,0.3)";
                ctx.stroke();
                ctx.closePath();
                ctx.shadowBlur = 0;
            }
        }
    }
}
function drawParticles() {
    for(let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        if(particles[i].life <= 0) particles.splice(i, 1);
    }
}

// Logic
function collisionDetection() {
    let winCount = 0;
    for(let c=0; c<brickColumnCount; c++) {
        for(let r=0; r<brickRowCount; r++) {
            let b = bricks[c][r];
            if(b.status === 1) {
                if(ball.x > b.x && ball.x < b.x + brickWidth && ball.y > b.y && ball.y < b.y + brickHeight) {
                    ball.dy = -ball.dy;
                    b.status = 0; // Break
                    score += 100;
                    scoreEl.innerText = score;
                    createExplosion(b.x + brickWidth/2, b.y + brickHeight/2, b.color);
                    
                    // Increase Speed Subtly
                    ball.speed += 0.05;
                    ball.dx = ball.dx > 0 ? ball.speed : -ball.speed;
                    ball.dy = ball.dy > 0 ? ball.speed : -ball.speed;
                }
                winCount++;
            }
        }
    }
    // Win Condition
    if(winCount === 0) endGame(true);
}

function update() {
    if(!isPlaying) return;

    // Move Paddle
    if(rightPressed && paddle.x < canvas.width - paddle.w) paddle.x += paddle.speed;
    else if(leftPressed && paddle.x > 0) paddle.x -= paddle.speed;

    // Move Ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall Collision (Left/Right)
    if(ball.x + ball.dx > canvas.width - ball.r || ball.x + ball.dx < ball.r) ball.dx = -ball.dx;
    // Ceiling Collision
    if(ball.y + ball.dy < ball.r) ball.dy = -ball.dy;
    // Floor Collision (Paddle or Death)
    else if(ball.y + ball.dy > canvas.height - ball.r - paddle.h) {
        if(ball.x > paddle.x && ball.x < paddle.x + paddle.w) {
            // Hit Paddle
            let hitPoint = ball.x - (paddle.x + paddle.w/2);
            ball.dx = hitPoint * 0.15; // Angle variation based on where it hit
            ball.dy = -Math.abs(ball.speed);
            screenShake();
        } else if (ball.y > canvas.height) {
            // Missed!
            lives--;
            livesEl.innerText = lives;
            if(lives <= 0) endGame(false);
            else resetBall();
        }
    }
}

function draw() {
    // Clear trail effect (Opacity Clear to create blur)
    ctx.fillStyle = "rgba(11, 14, 17, 0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawBricks();
    drawPaddle();
    drawBall();
    drawParticles();
    
    collisionDetection();
    update();

    if(isPlaying && !isPaused) rafId = requestAnimationFrame(draw);
}

// State Management
function startGame() {
    isPlaying = true;
    isPaused = false;
    pauseOverlay.classList.remove('active');
    score = 0; lives = 3;
    scoreEl.innerText = score; livesEl.innerText = lives;
    ball.speed = 6;
    initBricks();
    resetBall();
    modalOverlay.classList.remove('active');
    draw();
}

function endGame(isWin) {
    isPlaying = false;
    cancelAnimationFrame(rafId);
    if(isWin) {
        modalTitle.innerText = "BIG WIN!";
        modalTitle.style.textShadow = "0 0 20px #facc15, 0 0 30px #facc15";
        modalDesc.innerText = `모든 네온 블록을 파괴했습니다. 획득 점수: ${score}`;
        startBtn.innerText = "다음 레벨 (재시작)";
        createExplosion(canvas.width/2, canvas.height/2, "#facc15");
        setTimeout(()=>createExplosion(canvas.width/2 - 100, canvas.height/2 + 50, "#ec4899"), 200);
        setTimeout(()=>createExplosion(canvas.width/2 + 100, canvas.height/2 + 50, "#3b82f6"), 400);
    } else {
        modalTitle.innerText = "GAME OVER";
        modalTitle.style.textShadow = "0 0 20px #ef4444, 0 0 30px #ef4444";
        modalDesc.innerText = `아쉽네요. 획득 점수: ${score}`;
        startBtn.innerText = "다시 시도하기";
    }
    draw(); // Draw last frame with explosions
    setTimeout(() => { modalOverlay.classList.add('active'); }, 1000);
}

// Event Listeners
startBtn.addEventListener('click', startGame);

function togglePause() {
    if (!isPlaying) return;
    isPaused = !isPaused;
    if (isPaused) {
        pauseOverlay.classList.add('active');
    } else {
        pauseOverlay.classList.remove('active');
        requestAnimationFrame(draw);
    }
}

resumeBtn.addEventListener('click', togglePause);
hudPauseBtn.addEventListener('click', togglePause);

closeBtn.addEventListener('click', () => {
    // Iframe일 경우 부모(Lobby)에 닫기 메시지를 전송합니다.
    window.parent.postMessage('backToLobby', '*');
});

// Initial Render (Background only)
ctx.fillStyle = "#0b0e11";
ctx.fillRect(0,0,parseInt(canvas.width),parseInt(canvas.height));
initBricks();
drawBricks();
