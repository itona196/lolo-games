/* ========================================================================
   SNAKE SUSHI
========================================================================= */
(function () {
    const snakeCanvas = document.getElementById("snakeCanvas");
    if (!snakeCanvas) {
        console.error("Canvas snakeCanvas introuvable");
        return;
    }

    const snakeCtx = snakeCanvas.getContext("2d");

    const CELL = 32;
    const GRID_W = Math.floor(snakeCanvas.width / CELL);
    const GRID_H = Math.floor(snakeCanvas.height / CELL);

    const snakeImg = new Image();
    snakeImg.src = "assets/images/snake/snake.png";

    const foodImg = new Image();
    foodImg.src = "assets/images/snake/food.png";

    let snakeLoaded = false;
    let foodLoaded = false;

    snakeImg.onload = () => snakeLoaded = true;
    foodImg.onload = () => foodLoaded = true;

    let snakeBody = [];
    let snakeDir = "right";
    let snakeFood = null;
    let snakeScore = 0;
    let snakeBest = parseInt(localStorage.getItem("snakeBestScore")) || 0;
    let snakeLoop = null;
    let snakeRunning = false;

    function updateSnakeScoreDisplay() {
        const scoreEl = document.getElementById("snakeScore");
        const bestEl = document.getElementById("snakeBestScore");
        if (scoreEl) scoreEl.textContent = `Score : ${snakeScore}`;
        if (bestEl) bestEl.textContent = `Meilleur Score : ${snakeBest}`;
    }

    updateSnakeScoreDisplay();

    function updateSnakeBestScore() {
        if (snakeScore > snakeBest) {
            snakeBest = snakeScore;
            localStorage.setItem("snakeBestScore", snakeBest);
            updateSnakeScoreDisplay();
        }
    }

    function placeSnakeFood() {
        snakeFood = {
            x: Math.floor(Math.random() * GRID_W),
            y: Math.floor(Math.random() * GRID_H)
        };
    }

    function drawSnakeGame() {
        snakeCtx.fillStyle = "#222";
        snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

        if (snakeFood) {
            snakeCtx.drawImage(
                foodImg,
                snakeFood.x * CELL,
                snakeFood.y * CELL,
                CELL,
                CELL
            );
        }

        snakeBody.forEach(seg => {
            snakeCtx.drawImage(
                snakeImg,
                seg.x * CELL,
                seg.y * CELL,
                CELL,
                CELL
            );
        });
    }

    function updateSnake() {
        if (!snakeRunning) return;
        const head = { ...snakeBody[0] };

        if (snakeDir === "up") head.y--;
        if (snakeDir === "down") head.y++;
        if (snakeDir === "left") head.x--;
        if (snakeDir === "right") head.x++;

        snakeBody.unshift(head);

        if (snakeFood && head.x === snakeFood.x && head.y === snakeFood.y) {
            snakeScore++;
            updateSnakeScoreDisplay();
            placeSnakeFood();
        } else {
            snakeBody.pop();
        }

        // Collisions
        if (
            head.x < 0 || head.x >= GRID_W ||
            head.y < 0 || head.y >= GRID_H ||
            snakeBody.slice(1).some(s => s.x === head.x && s.y === head.y)
        ) {
            clearInterval(snakeLoop);
            snakeLoop = null;
            snakeRunning = false;
            
            const isNewRecord = snakeScore > snakeBest;
            updateSnakeBestScore();
            showSnakeGameOver(isNewRecord);
            return;
        }

        drawSnakeGame();
    }

    function startSnakeGame() {
        if (!snakeLoaded || !foodLoaded) {
            requestAnimationFrame(startSnakeGame);
            return;
        }

        snakeRunning = true;

        snakeBody = [{ x: Math.floor(GRID_W / 2), y: Math.floor(GRID_H / 2) }];
        snakeDir = "right";
        snakeScore = 0;
        updateSnakeScoreDisplay();

        placeSnakeFood();
        drawSnakeGame();

        clearInterval(snakeLoop);
        snakeLoop = setInterval(updateSnake, 120);
    }

    function initSnakePreview() {
        if (!snakeLoaded || !foodLoaded) {
            requestAnimationFrame(initSnakePreview);
            return;
        }

        snakeRunning = false;
        clearInterval(snakeLoop);
        snakeLoop = null;

        snakeBody = [{ x: Math.floor(GRID_W / 2), y: Math.floor(GRID_H / 2) }];
        snakeDir = "right";
        snakeScore = 0;
        placeSnakeFood();
        drawSnakeGame();
    }

    document.addEventListener("keydown", e => {
        if (!snakeRunning) return;
        if (e.key === "ArrowUp" && snakeDir !== "down") snakeDir = "up";
        if (e.key === "ArrowDown" && snakeDir !== "up") snakeDir = "down";
        if (e.key === "ArrowLeft" && snakeDir !== "right") snakeDir = "left";
        if (e.key === "ArrowRight" && snakeDir !== "left") snakeDir = "right";
    });

    const snakeStartBtn = document.getElementById("snakeRestartButton");
    if (snakeStartBtn) {
        snakeStartBtn.addEventListener("click", startSnakeGame);
    }
    initSnakePreview();

    let snakeRecordOverlay = null;
    let snakeRecordCanvas = null;
    let snakeRecordCtx = null;
    let snakeRecordAnim = null;

    function ensureSnakeRecordUi() {
        if (snakeRecordOverlay) return;

        snakeRecordOverlay = document.createElement("div");
        snakeRecordOverlay.className = "ttt-overlay ttt-hidden";
        snakeRecordOverlay.style.display = "none";

        snakeRecordCanvas = document.createElement("canvas");
        snakeRecordCanvas.className = "ttt-confetti";
        snakeRecordCtx = snakeRecordCanvas.getContext("2d");

        const card = document.createElement("div");
        card.className = "ttt-modal";

        const title = document.createElement("div");
        title.style.fontSize = "2.8rem";
        title.style.fontWeight = "bold";
        title.style.color = "#FFD700";
        title.style.marginBottom = "18px";
        title.textContent = "NOUVEAU RECORD !";

        const scoreText = document.createElement("div");
        scoreText.style.fontSize = "3rem";
        scoreText.style.fontWeight = "bold";
        scoreText.style.color = "#333";
        scoreText.style.margin = "20px 0";
        scoreText.id = "snake-record-score";

        const img = document.createElement("img");
        img.className = "ttt-win-image";
        img.src = "assets/images/tictactoe/tictactoe-win.png";
        img.addEventListener("error", () => {
            img.style.display = "none";
        });

        const replayBtn = document.createElement("button");
        replayBtn.className = "ttt-win-replay-btn";
        replayBtn.textContent = "Continuer";
        replayBtn.addEventListener("click", () => {
            hideSnakeRecordOverlay();
        });

        card.appendChild(title);
        card.appendChild(scoreText);
        card.appendChild(img);
        card.appendChild(replayBtn);

        snakeRecordOverlay.appendChild(snakeRecordCanvas);
        snakeRecordOverlay.appendChild(card);
        document.body.appendChild(snakeRecordOverlay);

        window.addEventListener("resize", () => {
            snakeRecordCanvas.width = window.innerWidth;
            snakeRecordCanvas.height = window.innerHeight;
        });
    }

    function hideSnakeRecordOverlay() {
        if (!snakeRecordOverlay) return;
        snakeRecordOverlay.classList.add("ttt-hidden");
        snakeRecordOverlay.classList.remove("ttt-show");
        snakeRecordOverlay.style.display = "none";
        if (snakeRecordAnim) {
            cancelAnimationFrame(snakeRecordAnim);
            snakeRecordAnim = null;
        }
        if (snakeRecordCtx) snakeRecordCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        document.querySelectorAll("audio").forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    function startSnakeRecordConfetti() {
        if (!snakeRecordCtx || !snakeRecordCanvas) return;

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
        const ctx = snakeRecordCtx;

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
                snakeRecordAnim = requestAnimationFrame(frame);
            }
        };

        if (snakeRecordAnim) cancelAnimationFrame(snakeRecordAnim);
        snakeRecordAnim = requestAnimationFrame(frame);
    }

    function playSnakeRecordSound() {
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

    // ======== OVERLAY GAME OVER SNAKE ========
    let snakeGameOverOverlay = null;
    let snakeGameOverCanvas = null;
    let snakeGameOverCtx = null;
    let snakeGameOverAnim = null;

    function ensureSnakeGameOverUi() {
        if (snakeGameOverOverlay) return;

        snakeGameOverOverlay = document.createElement("div");
        snakeGameOverOverlay.className = "ttt-overlay ttt-hidden";
        snakeGameOverOverlay.style.display = "none";
        snakeGameOverOverlay.style.background = "linear-gradient(135deg, rgba(30, 40, 60, 0.92), rgba(50, 60, 80, 0.88))";
        snakeGameOverOverlay.style.backdropFilter = "blur(8px)";

        snakeGameOverCanvas = document.createElement("canvas");
        snakeGameOverCanvas.className = "ttt-confetti";
        snakeGameOverCtx = snakeGameOverCanvas.getContext("2d");

        const card = document.createElement("div");
        card.className = "ttt-modal";

        const title = document.createElement("div");
        title.style.fontSize = "2.8rem";
        title.style.fontWeight = "bold";
        title.style.color = "#f44336";
        title.style.marginBottom = "18px";
        title.textContent = "GAME OVER !";

        const scoreText = document.createElement("div");
        scoreText.style.fontSize = "1.5rem";
        scoreText.style.color = "#666";
        scoreText.style.marginBottom = "18px";
        scoreText.id = "snake-game-over-score";

        const img = document.createElement("img");
        img.className = "ttt-win-image";
        img.src = "assets/images/snake/snake-gameover.png";
        img.addEventListener("error", () => {
            img.style.display = "none";
        });

        const replayBtn = document.createElement("button");
        replayBtn.className = "ttt-win-replay-btn";
        replayBtn.style.background = "linear-gradient(135deg, #f44336, #e57373)";
        replayBtn.textContent = "Continuer";
        replayBtn.addEventListener("click", () => {
            hideSnakeGameOver();
        });

        card.appendChild(title);
        card.appendChild(scoreText);
        card.appendChild(img);
        card.appendChild(replayBtn);

        snakeGameOverOverlay.appendChild(snakeGameOverCanvas);
        snakeGameOverOverlay.appendChild(card);
        document.body.appendChild(snakeGameOverOverlay);

        window.addEventListener("resize", () => {
            snakeGameOverCanvas.width = window.innerWidth;
            snakeGameOverCanvas.height = window.innerHeight;
        });
    }

    function showSnakeGameOver(isNewRecord) {
        if (isNewRecord) {
            ensureSnakeRecordUi();
            const scoreEl = document.getElementById("snake-record-score");
            if (scoreEl) {
                scoreEl.textContent = `${snakeScore} points`;
            }
            snakeRecordOverlay.classList.remove("ttt-hidden");
            snakeRecordOverlay.classList.add("ttt-show");
            snakeRecordOverlay.style.display = "grid";
            snakeRecordOverlay.style.background = "rgba(255, 255, 255, 0.15)";
            snakeRecordOverlay.style.backdropFilter = "blur(12px)";
            snakeRecordCanvas.width = window.innerWidth;
            snakeRecordCanvas.height = window.innerHeight;
            startSnakeRecordConfetti();
            playSnakeRecordSound();
        } else {
            ensureSnakeGameOverUi();
            const scoreEl = document.getElementById("snake-game-over-score");
            if (scoreEl) {
                scoreEl.textContent = `Score: ${snakeScore}`;
            }
            snakeGameOverOverlay.classList.remove("ttt-hidden");
            snakeGameOverOverlay.classList.add("ttt-show");
            snakeGameOverOverlay.style.display = "grid";
            snakeGameOverCanvas.width = window.innerWidth;
            snakeGameOverCanvas.height = window.innerHeight;
            startSnakeRain();
            playSnakeGameOverSound();
        }
    }

    function hideSnakeGameOver() {
        if (!snakeGameOverOverlay) return;
        snakeGameOverOverlay.classList.add("ttt-hidden");
        snakeGameOverOverlay.classList.remove("ttt-show");
        snakeGameOverOverlay.style.display = "none";
        if (snakeGameOverAnim) {
            cancelAnimationFrame(snakeGameOverAnim);
            snakeGameOverAnim = null;
        }
        if (snakeGameOverCtx) snakeGameOverCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        document.querySelectorAll("audio").forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    function playSnakeGameOverSound() {
        try {
            const audio = new Audio("assets/sounds/lose.mp3");
            audio.volume = 0.7;
            audio.play().catch(() => {
                if ("speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                    const u = new SpeechSynthesisUtterance("oh nooo");
                    u.lang = "en-US";
                    u.rate = 0.9;
                    u.pitch = 0.7;
                    window.speechSynthesis.speak(u);
                }
            });
        } catch {}
    }

    function startSnakeRain() {
        if (!snakeGameOverCtx) return;

        const raindrops = [];
        for (let i = 0; i < 150; i++) {
            raindrops.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight - window.innerHeight,
                length: Math.random() * 20 + 10,
                speed: Math.random() * 8 + 6,
                opacity: Math.random() * 0.3 + 0.2
            });
        }

        const startTime = Date.now();
        const duration = 6000;

        function animate() {
            if (Date.now() - startTime > duration) {
                return;
            }

            snakeGameOverCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            for (let drop of raindrops) {
                drop.y += drop.speed;

                if (drop.y > window.innerHeight) {
                    drop.y = -drop.length;
                    drop.x = Math.random() * window.innerWidth;
                }

                snakeGameOverCtx.strokeStyle = `rgba(150, 180, 220, ${drop.opacity})`;
                snakeGameOverCtx.lineWidth = 2;
                snakeGameOverCtx.beginPath();
                snakeGameOverCtx.moveTo(drop.x, drop.y);
                snakeGameOverCtx.lineTo(drop.x, drop.y + drop.length);
                snakeGameOverCtx.stroke();
            }

            snakeGameOverAnim = requestAnimationFrame(animate);
        }

        snakeGameOverAnim = requestAnimationFrame(animate);
    }
})();