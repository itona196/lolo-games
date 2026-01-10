/* ========================================================================
   JEU DE LA TAUPE
========================================================================= */
(function () {
    const moleScoreElement = document.getElementById("moleScore");
    const moleBestScoreElement = document.getElementById("moleBestScore");
    const moleTimerElement = document.getElementById("moleTimer");
    const moleStartButton = document.getElementById("moleStartButton");
    const moleHoles = document.querySelectorAll(".moleHole");

    if (sessionStorage.getItem("moleBestScore") === null) {
        const legacy = localStorage.getItem("moleBestScore");
        if (legacy !== null) sessionStorage.setItem("moleBestScore", legacy);
    }
    localStorage.removeItem("moleBestScore");

    const moleImg = new Image();
    moleImg.src = "assets/images/mole/mole.png";
    let moleImageLoaded = false;
    moleImg.onload = () => {
        moleImageLoaded = true;
        moleHoles.forEach(hole => {
            hole.style.backgroundImage = "url('assets/images/mole/mole.png')";
        });
    };

    let moleScore = 0;
    let moleBestScore = parseInt(sessionStorage.getItem("moleBestScore")) || 0;
    let moleTimer = 50;
    let moleGameTimer;
    let moleTimeout;
    let moleRunning = false;

    let activeMoles = [];
    const baseInterval = 2500;
    let currentInterval = baseInterval;
    let maxActiveMoles = 1;
    let timeoutDuration = 4500;

    function updateScore() {
        moleScoreElement.textContent = "Score : " + moleScore;
    }

    function updateBest() {
        moleBestScoreElement.textContent = "Meilleur Score : " + moleBestScore;
        sessionStorage.setItem("moleBestScore", String(moleBestScore));
    }

    function updateTimer() {
        moleTimerElement.textContent = "Temps restant : " + moleTimer;
    }

    // Afficher le meilleur score au chargement
    updateBest();

    function moleClicked() {
        if (!moleRunning) return;

        if (this.classList.contains("active")) {
            // Ajouter l'animation de punch
            this.classList.add("clicked");
            
            this.classList.remove("active");
            activeMoles = activeMoles.filter(x => x !== this);
            moleScore++;
            updateScore();

            // Augmenter la difficulté progressivement (plus agressif)
            currentInterval = Math.max(400, currentInterval - 80);
            timeoutDuration = Math.max(1000, timeoutDuration - 180);
            
            // Augmenter le nombre de taupes simultanées tous les 3 points
            if (moleScore > 0 && moleScore % 3 === 0 && maxActiveMoles < 3) {
                maxActiveMoles++;
            }

            clearTimeout(moleTimeout);
            moleTimeout = setTimeout(() => {
                if (moleRunning && activeMoles.length > 0) endGame("Trop lent");
            }, timeoutDuration);
            
            // Retirer l'animation après qu'elle soit finie
            setTimeout(() => this.classList.remove("clicked"), 300);
        } else {
            endGame("Mauvais clic !");
        }
    }

    moleHoles.forEach(hole => {
        hole.addEventListener("click", moleClicked);
    });

    function spawn() {
        if (!moleRunning) return;

        if (activeMoles.length < maxActiveMoles) {
            const idx = Math.floor(Math.random() * moleHoles.length);
            const hole = moleHoles[idx];

            if (!hole.classList.contains("active")) {
                hole.classList.add("active");
                activeMoles.push(hole);
                
                    // Mettre le timeout seulement quand une taupe apparaît
                clearTimeout(moleTimeout);
                moleTimeout = setTimeout(() => {
                    if (moleRunning && activeMoles.length > 0) endGame("Trop lent");
                }, timeoutDuration);
            }
        }

        setTimeout(spawn, currentInterval);
    }

    let moleOverlay = null;
    let moleConfettiCanvas = null;
    let moleConfettiCtx = null;
    let moleConfettiAnim = null;

    function ensureMoleOverlay() {
        if (moleOverlay) return;

        moleOverlay = document.createElement("div");
        moleOverlay.className = "ttt-overlay ttt-hidden";
        moleOverlay.style.display = "none";

        moleConfettiCanvas = document.createElement("canvas");
        moleConfettiCanvas.className = "ttt-confetti";
        moleConfettiCtx = moleConfettiCanvas.getContext("2d");

        const card = document.createElement("div");
        card.className = "ttt-modal";

        const title = document.createElement("div");
        title.style.fontSize = "2.8rem";
        title.style.fontWeight = "bold";
        title.style.color = "#FFD700";
        title.style.marginBottom = "18px";
        title.id = "mole-overlay-title";

        const scoreDisplay = document.createElement("div");
        scoreDisplay.style.fontSize = "3rem";
        scoreDisplay.style.fontWeight = "bold";
        scoreDisplay.style.color = "#333";
        scoreDisplay.style.margin = "20px 0";
        scoreDisplay.id = "mole-score-display";

        const img = document.createElement("img");
        img.className = "ttt-win-image";
        img.src = "assets/images/tictactoe/tictactoe-win.png";
        img.id = "mole-overlay-img";
        img.addEventListener("error", () => {
            img.style.display = "none";
        });

        const replayBtn = document.createElement("button");
        replayBtn.className = "ttt-win-replay-btn";
        replayBtn.textContent = "Rejouer";
        replayBtn.addEventListener("click", () => {
            hideMoleOverlay();
        });

        card.appendChild(title);
        card.appendChild(scoreDisplay);
        card.appendChild(img);
        card.appendChild(replayBtn);

        moleOverlay.appendChild(moleConfettiCanvas);
        moleOverlay.appendChild(card);
        document.body.appendChild(moleOverlay);

        window.addEventListener("resize", () => {
            moleConfettiCanvas.width = window.innerWidth;
            moleConfettiCanvas.height = window.innerHeight;
        });
    }

    function showMoleRecord(finalScore) {
        ensureMoleOverlay();

        const title = document.getElementById("mole-overlay-title");
        const scoreDisplay = document.getElementById("mole-score-display");
        const img = document.getElementById("mole-overlay-img");

        title.textContent = "NOUVEAU RECORD !";
        title.style.color = "#FFD700";
        scoreDisplay.textContent = finalScore + " points";
        img.style.display = "block";

        moleOverlay.style.display = "grid";
        moleOverlay.style.background = "rgba(255, 255, 255, 0.15)";
        moleOverlay.style.backdropFilter = "blur(12px)";
        moleConfettiCanvas.width = window.innerWidth;
        moleConfettiCanvas.height = window.innerHeight;

        startMoleConfetti();
        playMoleWinSound();
    }

    function showMoleScore(finalScore) {
        ensureMoleOverlay();

        const title = document.getElementById("mole-overlay-title");
        const scoreDisplay = document.getElementById("mole-score-display");
        const img = document.getElementById("mole-overlay-img");

        title.textContent = "Ton score";
        title.style.color = "#666";
        scoreDisplay.textContent = finalScore + " points";
        img.style.display = "none";

        moleOverlay.style.display = "grid";
        moleOverlay.style.background = "rgba(255, 255, 255, 0.15)";
        moleOverlay.style.backdropFilter = "blur(12px)";
        moleConfettiCanvas.width = window.innerWidth;
        moleConfettiCanvas.height = window.innerHeight;
    }

    function hideMoleOverlay() {
        if (!moleOverlay) return;
        moleOverlay.style.display = "none";
        if (moleConfettiAnim) {
            cancelAnimationFrame(moleConfettiAnim);
            moleConfettiAnim = null;
        }
        if (moleConfettiCtx) moleConfettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        document.querySelectorAll("audio").forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    function playMoleWinSound() {
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

    function startMoleConfetti() {
        if (!moleConfettiCtx || !moleConfettiCanvas) return;

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
        const ctx = moleConfettiCtx;

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
                moleConfettiAnim = requestAnimationFrame(frame);
            }
        };

        if (moleConfettiAnim) cancelAnimationFrame(moleConfettiAnim);
        moleConfettiAnim = requestAnimationFrame(frame);
    }

    function endGame(reason) {
        if (!moleRunning) return;

        moleRunning = false;
        clearInterval(moleGameTimer);
        if (moleTimeout) clearTimeout(moleTimeout);

        activeMoles.forEach(h => h.classList.remove("active"));
        activeMoles = [];

        const finalScore = moleScore;
        const isNewRecord = finalScore > moleBestScore;
        
        if (isNewRecord) {
            moleBestScore = finalScore;
            updateBest();
            showMoleRecord(finalScore);
        } else {
            showMoleScore(finalScore);
        }

        moleStartButton.style.display = "block";
        moleStartButton.disabled = false;
    }

    function startGame() {
        moleScore = 0;
        moleTimer = 50;
        currentInterval = baseInterval;
        maxActiveMoles = 1;
        timeoutDuration = 4500;
        updateScore();
        updateBest();
        updateTimer();

        moleRunning = true;

        moleStartButton.disabled = true;
        moleStartButton.style.display = "none";


        spawn();

        moleGameTimer = setInterval(() => {
            moleTimer--;
            updateTimer();
            if (moleTimer <= 0) {
                endGame("Temps écoulé");
            }
        }, 1000);
    }

    moleStartButton.addEventListener("click", startGame);
})();
