/* ========================================================================
   CASSE-BRIQUES
========================================================================= */
(function () {
    const canvas = document.getElementById("breakoutCanvas");
    const ctx = canvas.getContext("2d");
    const restartButton = document.getElementById("breakoutRestartButton");
    const scoreEl = document.getElementById("breakoutScore");
    const bestEl = document.getElementById("breakoutBestScore");

    if (sessionStorage.getItem("breakoutBestScore") === null) {
        const legacy = localStorage.getItem("breakoutBestScore");
        if (legacy !== null) sessionStorage.setItem("breakoutBestScore", legacy);
    }
    localStorage.removeItem("breakoutBestScore");

    const paddleImg = new Image();
    paddleImg.src = "assets/images/breakout/paddle.png";
    let paddleImgLoaded = false;
    paddleImg.onload = () => paddleImgLoaded = true;

    const rows = 5;
    const cols = 7;
    const brickW = 85;
    const brickH = 28;
    const padding = 5;
    const offsetTop = 40;
    const offsetLeft = (canvas.width - cols * (brickW + padding)) / 2;

    let bricks;
    let ball;
    let paddle;

    let score = 0;
    let best = parseInt(sessionStorage.getItem("breakoutBestScore")) || 0;
    let interval;
    let gameRunning = false;

    function resetBricks() {
        bricks = [];
        for (let c = 0; c < cols; c++) {
            bricks[c] = [];
            for (let r = 0; r < rows; r++) {
                bricks[c][r] = {
                    x: c * (brickW + padding) + offsetLeft,
                    y: r * (brickH + padding) + offsetTop,
                    active: true
                };
            }
        }
    }

    function resetObjects() {
        ball = { x: canvas.width / 2, y: canvas.height - 80, dx: 3, dy: -3, r: 10 };
        paddle = { x: canvas.width / 2 - 125, y: canvas.height - 70, w: 250, h: 60 };
        score = 0;
        scoreEl.textContent = "Score : 0";
        bestEl.textContent = "Meilleur Score : " + best;
    }

    function drawBricks() {
        const colors = ["#FF1744", "#00E5FF", "#FFD700", "#FF6F00", "#00E676", "#E040FB", "#FF4081"];
        bricks.forEach((col, colIndex) =>
            col.forEach(b => {
                if (b.active) {
                    ctx.fillStyle = colors[colIndex % colors.length];
                    ctx.fillRect(b.x, b.y, brickW, brickH);
                    
                    ctx.strokeStyle = "#000";
                    ctx.lineWidth = 3;
                    ctx.strokeRect(b.x, b.y, brickW, brickH);
                    
                    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                    ctx.fillRect(b.x + 3, b.y + 3, brickW - 6, brickH / 2.5);
                }
            })
        );
    }

    function drawPaddle() {
        if (paddleImgLoaded) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(paddleImg, paddle.x, paddle.y, paddle.w, paddle.h);
            ctx.imageSmoothingEnabled = true;
        } else {
            const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.h);
            gradient.addColorStop(0, "#FFD700");
            gradient.addColorStop(0.5, "#FFA500");
            gradient.addColorStop(1, "#FF8C00");
            
            ctx.fillStyle = gradient;
            ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
            
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 4;
            ctx.strokeRect(paddle.x, paddle.y, paddle.w, paddle.h);
            
            ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
            ctx.shadowBlur = 15;
            ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
            ctx.shadowBlur = 0;
        }
    }

    function drawBall() {
        const gradient = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 2, ball.x, ball.y, ball.r);
        gradient.addColorStop(0, "#fff");
        gradient.addColorStop(1, "#fdd33c");
        
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function moveBall() {
        ball.x += ball.dx;
        ball.y += ball.dy;

        if (ball.x < ball.r) {
            ball.x = ball.r;
            ball.dx *= -1;
        } else if (ball.x > canvas.width - ball.r) {
            ball.x = canvas.width - ball.r;
            ball.dx *= -1;
        }
        
        if (ball.y < ball.r) {
            ball.y = ball.r;
            ball.dy *= -1;
        }

        if (
            ball.y + ball.r >= paddle.y &&
            ball.y < paddle.y + paddle.h &&
            ball.x >= paddle.x &&
            ball.x <= paddle.x + paddle.w &&
            ball.dy > 0
        ) {
            ball.dy *= -1;
            ball.y = paddle.y - ball.r;
            
            const hitPos = (ball.x - paddle.x) / paddle.w;
            ball.dx = (hitPos - 0.5) * 6;
        }

        if (ball.y > canvas.height) {
            endGame();
        }
    }

    function movePaddle(e) {
        if (e.key === "ArrowLeft") {
            paddle.x -= 20;
            if (paddle.x < 0) paddle.x = 0;
        }
        if (e.key === "ArrowRight") {
            paddle.x += 20;
            if (paddle.x + paddle.w > canvas.width) paddle.x = canvas.width - paddle.w;
        }
    }

    // ========== Breakout Overlay System ==========
    let breakoutWinOverlay = null;
    let breakoutWinConfettiCanvas = null;
    let breakoutWinConfettiCtx = null;
    let breakoutWinConfettiAnim = null;

    let breakoutLoseOverlay = null;
    let breakoutLoseRainCanvas = null;
    let breakoutLoseRainCtx = null;
    let breakoutLoseRainAnim = null;

    function ensureBreakoutWinOverlay() {
        if (breakoutWinOverlay) return;

        breakoutWinOverlay = document.createElement("div");
        breakoutWinOverlay.className = "ttt-overlay ttt-hidden";
        breakoutWinOverlay.style.display = "none";

        breakoutWinConfettiCanvas = document.createElement("canvas");
        breakoutWinConfettiCanvas.className = "ttt-confetti";
        breakoutWinConfettiCtx = breakoutWinConfettiCanvas.getContext("2d");

        const card = document.createElement("div");
        card.className = "ttt-modal";

        const title = document.createElement("div");
        title.style.fontSize = "2.8rem";
        title.style.fontWeight = "bold";
        title.style.color = "#FFD700";
        title.style.marginBottom = "18px";
        title.textContent = "VICTOIRE !";

        const scoreDisplay = document.createElement("div");
        scoreDisplay.style.fontSize = "3rem";
        scoreDisplay.style.fontWeight = "bold";
        scoreDisplay.style.color = "#333";
        scoreDisplay.style.margin = "20px 0";
        scoreDisplay.id = "breakout-win-score";

        const img = document.createElement("img");
        img.className = "ttt-win-image";
        img.src = "assets/images/tictactoe/tictactoe-win.png";
        img.addEventListener("error", () => {
            img.style.display = "none";
        });

        const replayBtn = document.createElement("button");
        replayBtn.className = "ttt-win-replay-btn";
        replayBtn.textContent = "Rejouer";
        replayBtn.addEventListener("click", () => {
            hideBreakoutWinOverlay();
            resetObjects();
            resetBricks();
            restartButton.style.display = "none";
            gameRunning = true;
            interval = setInterval(update, 16);
        });

        card.appendChild(title);
        card.appendChild(scoreDisplay);
        card.appendChild(img);
        card.appendChild(replayBtn);

        breakoutWinOverlay.appendChild(breakoutWinConfettiCanvas);
        breakoutWinOverlay.appendChild(card);
        document.body.appendChild(breakoutWinOverlay);

        window.addEventListener("resize", () => {
            breakoutWinConfettiCanvas.width = window.innerWidth;
            breakoutWinConfettiCanvas.height = window.innerHeight;
        });
    }

    function ensureBreakoutLoseOverlay() {
        if (breakoutLoseOverlay) return;

        breakoutLoseOverlay = document.createElement("div");
        breakoutLoseOverlay.className = "ttt-overlay ttt-hidden";
        breakoutLoseOverlay.style.display = "none";

        breakoutLoseRainCanvas = document.createElement("canvas");
        breakoutLoseRainCanvas.className = "ttt-confetti";
        breakoutLoseRainCtx = breakoutLoseRainCanvas.getContext("2d");

        const card = document.createElement("div");
        card.className = "ttt-modal";

        const title = document.createElement("div");
        title.style.fontSize = "2.8rem";
        title.style.fontWeight = "bold";
        title.style.color = "#999";
        title.style.marginBottom = "18px";
        title.textContent = "DÉFAITE";

        const scoreDisplay = document.createElement("div");
        scoreDisplay.style.fontSize = "3rem";
        scoreDisplay.style.fontWeight = "bold";
        scoreDisplay.style.color = "#333";
        scoreDisplay.style.margin = "20px 0";
        scoreDisplay.id = "breakout-lose-score";

        const img = document.createElement("img");
        img.className = "ttt-win-image";
        img.src = "assets/images/tictactoe/tictactoe-lose.png";
        img.addEventListener("error", () => {
            img.style.display = "none";
        });

        const replayBtn = document.createElement("button");
        replayBtn.className = "ttt-win-replay-btn";
        replayBtn.textContent = "Rejouer";
        replayBtn.addEventListener("click", () => {
            hideBreakoutLoseOverlay();
            resetObjects();
            resetBricks();
            restartButton.style.display = "none";
            gameRunning = true;
            interval = setInterval(update, 16);
        });

        card.appendChild(title);
        card.appendChild(scoreDisplay);
        card.appendChild(img);
        card.appendChild(replayBtn);

        breakoutLoseOverlay.appendChild(breakoutLoseRainCanvas);
        breakoutLoseOverlay.appendChild(card);
        document.body.appendChild(breakoutLoseOverlay);

        window.addEventListener("resize", () => {
            breakoutLoseRainCanvas.width = window.innerWidth;
            breakoutLoseRainCanvas.height = window.innerHeight;
        });
    }

    function showBreakoutVictory(finalScore) {
        ensureBreakoutWinOverlay();
        const scoreDisplay = document.getElementById("breakout-win-score");
        scoreDisplay.textContent = finalScore + " points";
        breakoutWinOverlay.style.display = "grid";
        breakoutWinOverlay.style.background = "rgba(255, 255, 255, 0.15)";
        breakoutWinOverlay.style.backdropFilter = "blur(12px)";
        breakoutWinConfettiCanvas.width = window.innerWidth;
        breakoutWinConfettiCanvas.height = window.innerHeight;
        startBreakoutWinConfetti();
        playBreakoutWinSound();
    }

    function showBreakoutDefeat(finalScore) {
        ensureBreakoutLoseOverlay();
        const scoreDisplay = document.getElementById("breakout-lose-score");
        scoreDisplay.textContent = finalScore + " points";
        breakoutLoseOverlay.style.display = "grid";
        breakoutLoseOverlay.style.background = "rgba(0, 0, 0, 0.15)";
        breakoutLoseOverlay.style.backdropFilter = "blur(12px)";
        breakoutLoseRainCanvas.width = window.innerWidth;
        breakoutLoseRainCanvas.height = window.innerHeight;
        startBreakoutLoseRain();
        playBreakoutLoseSound();
    }

    function hideBreakoutWinOverlay() {
        if (!breakoutWinOverlay) return;
        breakoutWinOverlay.style.display = "none";
        if (breakoutWinConfettiAnim) {
            cancelAnimationFrame(breakoutWinConfettiAnim);
            breakoutWinConfettiAnim = null;
        }
        if (breakoutWinConfettiCtx) breakoutWinConfettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        document.querySelectorAll("audio").forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    function hideBreakoutLoseOverlay() {
        if (!breakoutLoseOverlay) return;
        breakoutLoseOverlay.style.display = "none";
        if (breakoutLoseRainAnim) {
            cancelAnimationFrame(breakoutLoseRainAnim);
            breakoutLoseRainAnim = null;
        }
        if (breakoutLoseRainCtx) breakoutLoseRainCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        document.querySelectorAll("audio").forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    function playBreakoutWinSound() {
        try {
            const audio = new Audio("assets/sounds/yeah.mp3");
            audio.volume = 0.7;
            audio.play().catch(() => {
                if ("speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                    const u = new SpeechSynthesisUtterance("yeeaaaaahhh");
                    u.lang = "en-US";
                    u.rate = 1.15;
                    u.pitch = 1.8;
                    window.speechSynthesis.speak(u);
                }
            });
        } catch {}
    }

    function playBreakoutLoseSound() {
        try {
            const audio = new Audio("assets/sounds/lose.mp3");
            audio.volume = 0.7;
            audio.play().catch(() => {
                if ("speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                    const u = new SpeechSynthesisUtterance("oh no");
                    u.lang = "en-US";
                    u.rate = 0.85;
                    u.pitch = 0.6;
                    window.speechSynthesis.speak(u);
                }
            });
        } catch {}
    }

    function startBreakoutWinConfetti() {
        if (!breakoutWinConfettiCtx || !breakoutWinConfettiCanvas) return;
        const colors = ["#FFD700", "#FF4081", "#00E5FF", "#00E676", "#E040FB", "#FF6F00"];
        const particles = Array.from({ length: 220 }, () => ({
            x: Math.random() * window.innerWidth,
            y: -20 - Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 3.2,
            vy: 2.5 + Math.random() * 4.5,
            r: 2 + Math.random() * 4,
            a: 0.7 + Math.random() * 0.3,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.25,
            c: colors[Math.floor(Math.random() * colors.length)]
        }));

        const start = performance.now();
        const ctx = breakoutWinConfettiCtx;
        const frame = (now) => {
            const t = now - start;
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;
                p.vy += 0.03;
                if (p.y > window.innerHeight + 40) {
                    p.y = -30;
                    p.x = Math.random() * window.innerWidth;
                    p.vy = 2.5 + Math.random() * 4.5;
                }
                ctx.save();
                ctx.globalAlpha = p.a;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.c;
                ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
                ctx.restore();
            }
            if (t < 8000) {
                breakoutWinConfettiAnim = requestAnimationFrame(frame);
            }
        };
        if (breakoutWinConfettiAnim) cancelAnimationFrame(breakoutWinConfettiAnim);
        breakoutWinConfettiAnim = requestAnimationFrame(frame);
    }

    function startBreakoutLoseRain() {
        if (!breakoutLoseRainCtx || !breakoutLoseRainCanvas) return;
        const drops = Array.from({ length: 150 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight - window.innerHeight,
            l: 12 + Math.random() * 12,
            vy: 5 + Math.random() * 4,
            a: 0.4 + Math.random() * 0.35
        }));

        const start = performance.now();
        const ctx = breakoutLoseRainCtx;
        const frame = (now) => {
            const t = now - start;
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            for (const d of drops) {
                d.y += d.vy;
                if (d.y > window.innerHeight) {
                    d.y = -d.l;
                    d.x = Math.random() * window.innerWidth;
                }
                ctx.save();
                ctx.globalAlpha = d.a;
                ctx.strokeStyle = "#7c9dd6";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x, d.y + d.l);
                ctx.stroke();
                ctx.restore();
            }
            if (t < 8000) {
                breakoutLoseRainAnim = requestAnimationFrame(frame);
            }
        };
        if (breakoutLoseRainAnim) cancelAnimationFrame(breakoutLoseRainAnim);
        breakoutLoseRainAnim = requestAnimationFrame(frame);
    }

    document.addEventListener("keydown", movePaddle);

    function checkBricks() {
        bricks.forEach(col =>
            col.forEach(b => {
                if (b.active) {
                    if (
                        ball.x > b.x &&
                        ball.x < b.x + brickW &&
                        ball.y > b.y &&
                        ball.y < b.y + brickH
                    ) {
                        ball.dy *= -1;
                        b.active = false;
                        score++;
                        scoreEl.textContent = "Score : " + score;
                        if (score > best) {
                            best = score;
                            bestEl.textContent = "Meilleur Score : " + best;
                            sessionStorage.setItem("breakoutBestScore", String(best));
                        }
                        if (score === rows * cols) win();
                    }
                }
            })
        );
    }

    function update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        drawBall();
        drawPaddle();
        moveBall();
        checkBricks();
    }

    function endGame() {
        clearInterval(interval);
        gameRunning = false;
        restartButton.style.display = "block";
        showBreakoutDefeat(score);
    }

    function win() {
        clearInterval(interval);
        gameRunning = false;
        restartButton.style.display = "block";
        
        // Vérifier si record battu
        if (score > best) {
            best = score;
            bestEl.textContent = "Meilleur Score : " + best;
            sessionStorage.setItem("breakoutBestScore", String(best));
        }
        
        showBreakoutVictory(score);
    }

    restartButton.addEventListener("click", () => {
        resetObjects();
        resetBricks();
        restartButton.style.display = "none";
        gameRunning = true;
        interval = setInterval(update, 16);
    });

    resetObjects();
    resetBricks();
    
    function drawInitialState() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        drawBall();
        drawPaddle();
    }
    
    if (paddleImgLoaded) {
        drawInitialState();
    } else {
        paddleImg.onload = () => {
            paddleImgLoaded = true;
            drawInitialState();
        };
        setTimeout(drawInitialState, 100);
    }
})();
