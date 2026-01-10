/* ========================================================================
   AIM TRAINER
========================================================================= */
(function () {
    const canvas = document.getElementById("targetCanvas");
    const ctx = canvas.getContext("2d");
    const startBtn = document.getElementById("targetStartButton");
    const scoreEl = document.getElementById("targetScore");
    const timeEl = document.getElementById("targetTime");

    let score = 0;
    let time = 10;
    let running = false;
    let x, y;
    const r = 50;
    let timer;
    let bestScore = parseInt(localStorage.getItem("aimTrainerBestScore")) || 0;

    const targetImg = new Image();
    targetImg.src = "assets/images/aim/target.png";
    let targetLoaded = false;
    targetImg.onload = () => {
        targetLoaded = true;
        draw();
    };

    if (bestScore > 0) {
        scoreEl.textContent = "Score : 0 | Meilleur : " + bestScore;
    }

    let aimOverlay = null;
    let aimConfettiCanvas = null;
    let aimConfettiCtx = null;
    let aimConfettiAnim = null;

    function ensureAimOverlay() {
        if (aimOverlay) return;

        aimOverlay = document.createElement("div");
        aimOverlay.className = "ttt-overlay ttt-hidden";
        aimOverlay.style.display = "none";

        aimConfettiCanvas = document.createElement("canvas");
        aimConfettiCanvas.className = "ttt-confetti";
        aimConfettiCtx = aimConfettiCanvas.getContext("2d");

        const card = document.createElement("div");
        card.className = "ttt-modal";

        const title = document.createElement("div");
        title.style.fontSize = "2.8rem";
        title.style.fontWeight = "bold";
        title.style.color = "#FFD700";
        title.style.marginBottom = "18px";
        title.textContent = "NOUVEAU RECORD !";
        title.id = "aim-overlay-title";

        const scoreDisplay = document.createElement("div");
        scoreDisplay.style.fontSize = "3rem";
        scoreDisplay.style.fontWeight = "bold";
        scoreDisplay.style.color = "#333";
        scoreDisplay.style.margin = "20px 0";
        scoreDisplay.id = "aim-score-display";

        const img = document.createElement("img");
        img.className = "ttt-win-image";
        img.src = "assets/images/tictactoe/tictactoe-win.png";
        img.id = "aim-overlay-img";
        img.addEventListener("error", () => {
            img.style.display = "none";
        });

        const replayBtn = document.createElement("button");
        replayBtn.className = "ttt-win-replay-btn";
        replayBtn.textContent = "Rejouer";
        replayBtn.addEventListener("click", () => {
            hideAimOverlay();
        });

        card.appendChild(title);
        card.appendChild(scoreDisplay);
        card.appendChild(img);
        card.appendChild(replayBtn);

        aimOverlay.appendChild(aimConfettiCanvas);
        aimOverlay.appendChild(card);
        document.body.appendChild(aimOverlay);

        window.addEventListener("resize", () => {
            aimConfettiCanvas.width = window.innerWidth;
            aimConfettiCanvas.height = window.innerHeight;
        });
    }

    function showAimRecord(finalScore) {
        ensureAimOverlay();

        const title = document.getElementById("aim-overlay-title");
        const scoreDisplay = document.getElementById("aim-score-display");
        const img = document.getElementById("aim-overlay-img");

        title.textContent = "NOUVEAU RECORD !";
        title.style.color = "#FFD700";
        scoreDisplay.textContent = finalScore + " points";
        img.style.display = "block";

        aimOverlay.style.display = "grid";
        aimOverlay.style.background = "rgba(255, 255, 255, 0.15)";
        aimOverlay.style.backdropFilter = "blur(12px)";
        aimConfettiCanvas.width = window.innerWidth;
        aimConfettiCanvas.height = window.innerHeight;

        startAimConfetti();
        playAimWinSound();
    }

    function showAimScore(finalScore) {
        ensureAimOverlay();

        const title = document.getElementById("aim-overlay-title");
        const scoreDisplay = document.getElementById("aim-score-display");
        const img = document.getElementById("aim-overlay-img");

        title.textContent = "Ton score";
        title.style.color = "#666";
        scoreDisplay.textContent = finalScore + " points";
        img.style.display = "none";

        aimOverlay.style.display = "grid";
        aimOverlay.style.background = "rgba(255, 255, 255, 0.15)";
        aimOverlay.style.backdropFilter = "blur(12px)";
        aimConfettiCanvas.width = window.innerWidth;
        aimConfettiCanvas.height = window.innerHeight;

        // Pas de confettis ni de son
    }

    function hideAimOverlay() {
        if (!aimOverlay) return;
        aimOverlay.style.display = "none";
        if (aimConfettiAnim) {
            cancelAnimationFrame(aimConfettiAnim);
            aimConfettiAnim = null;
        }
        if (aimConfettiCtx) aimConfettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        // Arrêter tous les sons
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        document.querySelectorAll("audio").forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    function playAimWinSound() {
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

    function startAimConfetti() {
        if (!aimConfettiCtx || !aimConfettiCanvas) return;

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
        const ctx = aimConfettiCtx;

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
                aimConfettiAnim = requestAnimationFrame(frame);
            }
        };

        if (aimConfettiAnim) cancelAnimationFrame(aimConfettiAnim);
        aimConfettiAnim = requestAnimationFrame(frame);
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!running) return;

        // Dessiner l'image en rond au lieu du cercle
        if (targetLoaded) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(targetImg, x - r, y - r, r * 2, r * 2);
            ctx.restore();
            
            // Bordure blanche
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 3;
            ctx.stroke();
        } else {
            // Fallback si l'image n'est pas chargée
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = "#fdd33c";
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }

    function newTarget() {
        const m = r + 5;
        x = Math.random() * (canvas.width - m * 2) + m;
        y = Math.random() * (canvas.height - m * 2) + m;
        draw();
    }

    function end() {
        running = false;
        clearInterval(timer);
        startBtn.style.display = "block";
        
        // Vérifier si record battu
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem("aimTrainerBestScore", bestScore);
            showAimRecord(score);
        } else {
            showAimScore(score);
        }
        
        scoreEl.textContent = "Score : " + score + " | Meilleur : " + bestScore;
    }

    function start() {
        running = true;
        score = 0;
        time = 10;
        scoreEl.textContent = "Score : 0 | Meilleur : " + bestScore;
        timeEl.textContent = "Temps : 10s";

        startBtn.style.display = "none";
        newTarget();

        timer = setInterval(() => {
            time--;
            timeEl.textContent = "Temps : " + time + "s";
            if (time <= 0) end();
        }, 1000);
    }

    startBtn.addEventListener("click", start);

    canvas.addEventListener("click", e => {
        if (!running) return;

        const rect = canvas.getBoundingClientRect();
        const xx = e.clientX - rect.left;
        const yy = e.clientY - rect.top;

        if (Math.hypot(xx - x, yy - y) < r) {
            score++;
            scoreEl.textContent = "Score : " + score + " | Meilleur : " + bestScore;
            newTarget();
        }
    });

    draw();
})();
