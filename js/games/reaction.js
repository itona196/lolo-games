/* ========================================================================
   JEU DE RÉFLEXE
========================================================================= */
(function () {
    const button = document.getElementById("reactionButton");
    const msg = document.getElementById("reactionMessage");
    const result = document.getElementById("reactionResult");

    let state = "idle";
    let timeout;
    let start;
    let bestTime = parseInt(localStorage.getItem("reactionBestTime")) || Infinity;

    if (bestTime !== Infinity) {
        result.textContent = "Meilleur temps : " + bestTime + " ms";
    }

    let reactionOverlay = null;
    let reactionConfettiCanvas = null;
    let reactionConfettiCtx = null;
    let reactionConfettiAnim = null;

    function ensureReactionOverlay() {
        if (reactionOverlay) return;

        reactionOverlay = document.createElement("div");
        reactionOverlay.className = "ttt-overlay ttt-hidden";
        reactionOverlay.style.display = "none";

        reactionConfettiCanvas = document.createElement("canvas");
        reactionConfettiCanvas.className = "ttt-confetti";
        reactionConfettiCtx = reactionConfettiCanvas.getContext("2d");

        const card = document.createElement("div");
        card.className = "ttt-modal";

        const title = document.createElement("div");
        title.style.fontSize = "2.8rem";
        title.style.fontWeight = "bold";
        title.style.color = "#4caf50";
        title.style.marginBottom = "18px";
        title.id = "reaction-overlay-title";

        const timeDisplay = document.createElement("div");
        timeDisplay.style.fontSize = "3.5rem";
        timeDisplay.style.fontWeight = "bold";
        timeDisplay.style.color = "#333";
        timeDisplay.style.margin = "20px 0";
        timeDisplay.id = "reaction-time-display";

        const img = document.createElement("img");
        img.className = "ttt-win-image";
        img.src = "assets/images/tictactoe/tictactoe-win.png";
        img.id = "reaction-overlay-img";
        img.addEventListener("error", () => {
            img.style.display = "none";
        });

        const replayBtn = document.createElement("button");
        replayBtn.className = "ttt-win-replay-btn";
        replayBtn.textContent = "Rejouer";
        replayBtn.addEventListener("click", () => {
            hideReactionOverlay();
        });

        card.appendChild(title);
        card.appendChild(timeDisplay);
        card.appendChild(img);
        card.appendChild(replayBtn);

        reactionOverlay.appendChild(reactionConfettiCanvas);
        reactionOverlay.appendChild(card);
        document.body.appendChild(reactionOverlay);

        window.addEventListener("resize", () => {
            reactionConfettiCanvas.width = window.innerWidth;
            reactionConfettiCanvas.height = window.innerHeight;
        });
    }

    function showReactionResult(time, isNewRecord) {
        ensureReactionOverlay();

        const title = document.getElementById("reaction-overlay-title");
        const timeDisplay = document.getElementById("reaction-time-display");
        const img = document.getElementById("reaction-overlay-img");

        timeDisplay.textContent = time + " ms";

        if (isNewRecord) {
            title.textContent = "NOUVEAU RECORD !";
            title.style.color = "#FFD700";
            img.style.display = "block";
            reactionOverlay.style.background = "rgba(255, 255, 255, 0.15)";
            reactionOverlay.style.backdropFilter = "blur(12px)";
        } else {
            title.textContent = "Ton temps";
            title.style.color = "#666";
            img.style.display = "none";
            reactionOverlay.style.background = "rgba(255, 255, 255, 0.15)";
            reactionOverlay.style.backdropFilter = "blur(12px)";
        }

        reactionOverlay.style.display = "grid";
        reactionConfettiCanvas.width = window.innerWidth;
        reactionConfettiCanvas.height = window.innerHeight;

        if (isNewRecord) {
            startReactionConfetti();
            playReactionWinSound();
        }
    }

    function hideReactionOverlay() {
        if (!reactionOverlay) return;
        reactionOverlay.style.display = "none";
        if (reactionConfettiAnim) {
            cancelAnimationFrame(reactionConfettiAnim);
            reactionConfettiAnim = null;
        }
        if (reactionConfettiCtx) reactionConfettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        // Arrêter tous les sons
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        document.querySelectorAll("audio").forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    function playReactionWinSound() {
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

    function startReactionConfetti() {
        if (!reactionConfettiCtx || !reactionConfettiCanvas) return;

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
        const ctx = reactionConfettiCtx;

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
                reactionConfettiAnim = requestAnimationFrame(frame);
            }
        };

        if (reactionConfettiAnim) cancelAnimationFrame(reactionConfettiAnim);
        reactionConfettiAnim = requestAnimationFrame(frame);
    }

    button.addEventListener("click", () => {
        if (state === "idle") {
            state = "wait";
            button.textContent = "Attends...";
            msg.textContent = "Ne clique pas encore.";
            const delay = 1500 + Math.random() * 2500;

            timeout = setTimeout(() => {
                state = "go";
                button.textContent = "CLIQUE !";
                msg.textContent = "Maintenant !";
                button.classList.add("ready");
                start = performance.now();
            }, delay);
        }

        else if (state === "wait") {
            clearTimeout(timeout);
            state = "idle";
            button.textContent = "Prêt ?";
            msg.textContent = "Trop tôt !";
            button.classList.remove("ready");
        }

        else if (state === "go") {
            const t = Math.round(performance.now() - start);
            
            let isNewRecord = false;
            if (t < bestTime) {
                bestTime = t;
                localStorage.setItem("reactionBestTime", bestTime);
                result.textContent = "Meilleur temps : " + bestTime + " ms";
                isNewRecord = true;
            }
            
            msg.textContent = "Ton temps : " + t + " ms";
            state = "idle";
            button.textContent = "Rejouer";
            button.classList.remove("ready");
            
            showReactionResult(t, isNewRecord);
        }
    });
})();


