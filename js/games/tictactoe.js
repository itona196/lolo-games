/* ========================================================================
   MORPION VS BOT (MINIMAX IMBATTABLE)
========================================================================= */
(function () {
let board = [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""]
];

let playerTurn = true;
let pScore = 0, dScore = 0, bScore = 0;

const TTT_WIN_IMAGE_SRC = "sprites/ttt-win.png";
const TTT_WIN_AUDIO_SRC = "sprites/yeah.mp3";

let tttOverlayEl = null;
let tttWinAudio = null;

function ensureTTTOverlay() {
    if (tttOverlayEl) return;

    const overlay = document.createElement("div");
    overlay.id = "tttOverlay";
    overlay.className = "ttt-overlay ttt-hidden";

    overlay.innerHTML = `
        <div class="ttt-confetti" aria-hidden="true"></div>
        <div class="ttt-modal" role="dialog" aria-modal="true" aria-label="Victoire">
            <img class="ttt-win-image" alt="Victoire" />
            <div class="ttt-win-actions">
                <button type="button" class="play-btn ttt-replay">Rejouer</button>
                <button type="button" class="play-btn ttt-close">Fermer</button>
            </div>
            <p class="ttt-win-hint">Astuce : remplace sprites/ttt-win.png et sprites/yeah.mp3</p>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) hideTTTOverlay(false);
    });

    overlay.querySelector(".ttt-close").addEventListener("click", () => hideTTTOverlay(false));
    overlay.querySelector(".ttt-replay").addEventListener("click", () => hideTTTOverlay(true));

    tttOverlayEl = overlay;

    tttWinAudio = new Audio(TTT_WIN_AUDIO_SRC);
    tttWinAudio.preload = "auto";
    tttWinAudio.volume = 1.0;
}

function clearTTTConfetti() {
    if (!tttOverlayEl) return;
    const confettiRoot = tttOverlayEl.querySelector(".ttt-confetti");
    if (confettiRoot) confettiRoot.replaceChildren();
}

function spawnTTTConfetti() {
    if (!tttOverlayEl) return;
    const confettiRoot = tttOverlayEl.querySelector(".ttt-confetti");
    if (!confettiRoot) return;
    confettiRoot.replaceChildren();

    const colors = ["#FF1744", "#00E5FF", "#FFD700", "#00E676", "#E040FB", "#FF6F00", "#FF4081"];
    const count = 120;
    for (let i = 0; i < count; i++) {
        const piece = document.createElement("div");
        piece.className = "ttt-confetti-piece";
        piece.style.left = Math.random() * 100 + "%";
        piece.style.background = colors[i % colors.length];
        piece.style.animationDuration = (1.6 + Math.random() * 1.6).toFixed(2) + "s";
        piece.style.animationDelay = (-Math.random() * 0.8).toFixed(2) + "s";
        piece.style.transform = `rotate(${Math.random() * 360}deg)`;
        piece.style.opacity = String(0.75 + Math.random() * 0.25);
        confettiRoot.appendChild(piece);
    }
}

function showTTTWinOverlay() {
    ensureTTTOverlay();
    const img = tttOverlayEl.querySelector(".ttt-win-image");
    if (img) img.src = TTT_WIN_IMAGE_SRC;

    spawnTTTConfetti();

    tttOverlayEl.classList.remove("ttt-hidden");
    tttOverlayEl.classList.add("ttt-show");

    // Lecture audio (doit être déclenché suite à un clic utilisateur -> OK ici)
    if (tttWinAudio) {
        try {
            tttWinAudio.currentTime = 0;
            void tttWinAudio.play();
        } catch {
            // Ignore si le navigateur bloque l'autoplay
        }
    }
}

function hideTTTOverlay(restart) {
    if (!tttOverlayEl) return;
    tttOverlayEl.classList.add("ttt-hidden");
    tttOverlayEl.classList.remove("ttt-show");
    clearTTTConfetti();
    if (restart) restartTTT();
}

function updateTTTScores() {
    pScoreEl.textContent = "Joueur : " + pScore;
    dScoreEl.textContent = "Matchs nuls : " + dScore;
    bScoreEl.textContent = "Bot : " + bScore;
}

const pScoreEl = document.getElementById("tictactoe-player-score");
const dScoreEl = document.getElementById("tictactoe-draw-score");
const bScoreEl = document.getElementById("tictactoe-bot-score");

function updateTTTScores() {
    pScoreEl.textContent = "Joueur : " + pScore;
    dScoreEl.textContent = "Matchs nuls : " + dScore;
    bScoreEl.textContent = "Bot : " + bScore;
}

let tttWinOverlay;
let tttWinConfettiCanvas;
let tttWinConfettiCtx;
let tttWinConfettiAnim = null;

function ensureTttWinUi() {
    if (tttWinOverlay) return;

    tttWinOverlay = document.createElement("div");
    tttWinOverlay.className = "ttt-win-overlay";
    tttWinOverlay.style.display = "none";

    const confettiCanvas = document.createElement("canvas");
    confettiCanvas.className = "ttt-confetti-canvas";
    tttWinConfettiCanvas = confettiCanvas;
    tttWinConfettiCtx = confettiCanvas.getContext("2d");

    const card = document.createElement("div");
    card.className = "ttt-win-card";

    const title = document.createElement("div");
    title.className = "ttt-win-title";
    title.textContent = "VICTOIRE !";

    const img = document.createElement("img");
    img.className = "ttt-win-image";
    img.alt = "Victoire";
    img.src = "assets/images/tictactoe/tictactoe-win.png";
    img.addEventListener("error", () => {
        // Si l'image n'existe pas, on masque proprement
        img.style.display = "none";
    });

    const replayBtn = document.createElement("button");
    replayBtn.className = "ttt-win-replay-btn";
    replayBtn.textContent = "Rejouer";
    replayBtn.addEventListener("click", () => {
        hideTttWinCelebration();
        restartTTT();
    });

    card.appendChild(title);
    card.appendChild(img);
    card.appendChild(replayBtn);

    tttWinOverlay.appendChild(confettiCanvas);
    tttWinOverlay.appendChild(card);
    document.body.appendChild(tttWinOverlay);

    window.addEventListener("resize", () => resizeTttConfettiCanvas());
}

function resizeTttConfettiCanvas() {
    if (!tttWinConfettiCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    tttWinConfettiCanvas.width = Math.floor(window.innerWidth * dpr);
    tttWinConfettiCanvas.height = Math.floor(window.innerHeight * dpr);
    tttWinConfettiCanvas.style.width = window.innerWidth + "px";
    tttWinConfettiCanvas.style.height = window.innerHeight + "px";
    if (tttWinConfettiCtx) tttWinConfettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function speakWinLine() {
    try {
        // Essayer d'abord de jouer un fichier audio
        const audio = new Audio("assets/sounds/yeah.mp3");
        audio.volume = 0.7;
        audio.play().catch(() => {
            // Si le fichier n'existe pas, utiliser la synthèse vocale
            if (!("speechSynthesis" in window)) return;
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance("yeeaaaaahhh");
            u.lang = "en-US";
            u.rate = 1.15;
            u.pitch = 1.8; // Voix très aiguë = enfant
            window.speechSynthesis.speak(u);
        });
    } catch {
        // ignorer
    }
}

function startTttConfetti(durationMs = 8000) {
    if (!tttWinConfettiCtx || !tttWinConfettiCanvas) return;
    resizeTttConfettiCanvas();

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
    const ctx = tttWinConfettiCtx;

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
            ctx.fillRect(-p.r, -p.r / 2, p.r * 2.2, p.r);
            ctx.restore();
        }

        if (t < durationMs) {
            tttWinConfettiAnim = requestAnimationFrame(frame);
        } else {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            tttWinConfettiAnim = null;
        }
    };

    if (tttWinConfettiAnim) cancelAnimationFrame(tttWinConfettiAnim);
    tttWinConfettiAnim = requestAnimationFrame(frame);
}

function showTttWinCelebration() {
    ensureTttWinUi();
    tttWinOverlay.style.display = "grid";
    startTttConfetti();
    speakWinLine();
}

function hideTttWinCelebration() {
    if (!tttWinOverlay) return;
    tttWinOverlay.style.display = "none";
    if (tttWinConfettiAnim) {
        cancelAnimationFrame(tttWinConfettiAnim);
        tttWinConfettiAnim = null;
    }
    if (tttWinConfettiCtx) tttWinConfettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    
    // Arrêter tous les sons
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
    // Arrêter tous les fichiers audio
    document.querySelectorAll("audio").forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
}

let tttLoseOverlay = null;
let tttLoseConfettiCanvas = null;
let tttLoseConfettiCtx = null;
let tttLoseConfettiAnim = null;

function ensureTttLoseUi() {
    if (tttLoseOverlay) return;

    tttLoseOverlay = document.createElement("div");
    tttLoseOverlay.id = "ttt-overlay-lose";
    tttLoseOverlay.className = "ttt-overlay ttt-hidden";
    tttLoseOverlay.style.display = "none";
    tttLoseOverlay.style.background = "linear-gradient(135deg, rgba(30, 40, 60, 0.92), rgba(50, 60, 80, 0.88))";
    tttLoseOverlay.style.backdropFilter = "blur(8px)";

    tttLoseConfettiCanvas = document.createElement("canvas");
    tttLoseConfettiCanvas.className = "ttt-confetti";
    tttLoseConfettiCtx = tttLoseConfettiCanvas.getContext("2d");

    const card = document.createElement("div");
    card.className = "ttt-modal";

    const title = document.createElement("div");
    title.style.fontSize = "2.8rem";
    title.style.fontWeight = "bold";
    title.style.color = "#f44336";
    title.style.marginBottom = "18px";
    title.textContent = "DÉFAITE !";

    const img = document.createElement("img");
    img.className = "ttt-win-image";
    img.src = "assets/images/tictactoe/tictactoe-lose.png";
    img.addEventListener("error", () => {
        img.style.display = "none";
    });

    const replayBtn = document.createElement("button");
    replayBtn.className = "ttt-win-replay-btn";
    replayBtn.style.background = "linear-gradient(135deg, #f44336, #e57373)";
    replayBtn.textContent = "Rejouer";
    replayBtn.addEventListener("click", () => {
        hideTttLoseCelebration();
        restartTTT();
    });

    card.appendChild(title);
    card.appendChild(img);
    card.appendChild(replayBtn);

    tttLoseOverlay.appendChild(tttLoseConfettiCanvas);
    tttLoseOverlay.appendChild(card);
    document.body.appendChild(tttLoseOverlay);

    window.addEventListener("resize", () => {
        tttLoseConfettiCanvas.width = window.innerWidth;
        tttLoseConfettiCanvas.height = window.innerHeight;
    });
}

function showTttLoseCelebration() {
    ensureTttLoseUi();
    tttLoseOverlay.style.display = "grid";
    tttLoseConfettiCanvas.width = window.innerWidth;
    tttLoseConfettiCanvas.height = window.innerHeight;
    startTttLoseConfetti();
    playLoseSound();
}

function hideTttLoseCelebration() {
    if (!tttLoseOverlay) return;
    tttLoseOverlay.style.display = "none";
    if (tttLoseConfettiAnim) {
        cancelAnimationFrame(tttLoseConfettiAnim);
        tttLoseConfettiAnim = null;
    }
    if (tttLoseConfettiCtx) tttLoseConfettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    
    // Arrêter tous les sons
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
    // Arrêter tous les fichiers audio
    document.querySelectorAll("audio").forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
}

let tttDrawOverlay = null;
let tttDrawConfettiCanvas = null;
let tttDrawConfettiCtx = null;
let tttDrawConfettiAnim = null;

function ensureTttDrawUi() {
    if (tttDrawOverlay) return;

    tttDrawOverlay = document.createElement("div");
    tttDrawOverlay.id = "ttt-overlay-draw";
    tttDrawOverlay.className = "ttt-overlay ttt-hidden";
    tttDrawOverlay.style.display = "none";
    tttDrawOverlay.style.background = "linear-gradient(135deg, rgba(100, 100, 100, 0.3), rgba(150, 150, 150, 0.25))";
    tttDrawOverlay.style.backdropFilter = "blur(10px)";

    tttDrawConfettiCanvas = document.createElement("canvas");
    tttDrawConfettiCanvas.className = "ttt-confetti";
    tttDrawConfettiCtx = tttDrawConfettiCanvas.getContext("2d");

    const card = document.createElement("div");
    card.className = "ttt-modal";

    const title = document.createElement("div");
    title.style.fontSize = "2.8rem";
    title.style.fontWeight = "bold";
    title.style.color = "#757575";
    title.style.marginBottom = "18px";
    title.textContent = "MATCH NUL !";

    const img = document.createElement("img");
    img.className = "ttt-win-image";
    img.src = "assets/images/tictactoe/tictactoe-draw.png";
    img.addEventListener("error", () => {
        img.style.display = "none";
    });

    const replayBtn = document.createElement("button");
    replayBtn.className = "ttt-win-replay-btn";
    replayBtn.style.background = "linear-gradient(135deg, #9e9e9e, #bdbdbd)";
    replayBtn.textContent = "Rejouer";
    replayBtn.addEventListener("click", () => {
        hideTttDrawCelebration();
        restartTTT();
    });

    card.appendChild(title);
    card.appendChild(img);
    card.appendChild(replayBtn);

    tttDrawOverlay.appendChild(tttDrawConfettiCanvas);
    tttDrawOverlay.appendChild(card);
    document.body.appendChild(tttDrawOverlay);

    window.addEventListener("resize", () => {
        tttDrawConfettiCanvas.width = window.innerWidth;
        tttDrawConfettiCanvas.height = window.innerHeight;
    });
}

function showTttDrawCelebration() {
    ensureTttDrawUi();
    tttDrawOverlay.style.display = "grid";
    tttDrawConfettiCanvas.width = window.innerWidth;
    tttDrawConfettiCanvas.height = window.innerHeight;
    startTttDrawParticles();
    playDrawSound();
}

function hideTttDrawCelebration() {
    if (!tttDrawOverlay) return;
    tttDrawOverlay.style.display = "none";
    if (tttDrawConfettiAnim) {
        cancelAnimationFrame(tttDrawConfettiAnim);
        tttDrawConfettiAnim = null;
    }
    if (tttDrawConfettiCtx) tttDrawConfettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    
    // Arrêter tous les sons
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
    // Arrêter tous les fichiers audio
    document.querySelectorAll("audio").forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
}

function playDrawSound() {
    try {
        const audio = new Audio("assets/sounds/draw.mp3");
        audio.volume = 0.7;
        audio.play().catch(() => {
            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance("draw");
                u.lang = "en-US";
                u.rate = 1;
                u.pitch = 1;
                window.speechSynthesis.speak(u);
            }
        });
    } catch {}
}

function startTttDrawParticles() {
    if (!tttDrawConfettiCtx) return;

    // Particules grises qui flottent lentement
    const particles = [];
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1,
            size: Math.random() * 6 + 3,
            opacity: Math.random() * 0.3 + 0.1,
            color: Math.random() > 0.5 ? "#9e9e9e" : "#bdbdbd"
        });
    }

    const startTime = Date.now();
    const duration = 5000;

    function animate() {
        if (Date.now() - startTime > duration) {
            return;
        }

        tttDrawConfettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (let p of particles) {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = window.innerWidth;
            if (p.x > window.innerWidth) p.x = 0;
            if (p.y < 0) p.y = window.innerHeight;
            if (p.y > window.innerHeight) p.y = 0;

            tttDrawConfettiCtx.fillStyle = p.color;
            tttDrawConfettiCtx.globalAlpha = p.opacity;
            tttDrawConfettiCtx.beginPath();
            tttDrawConfettiCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            tttDrawConfettiCtx.fill();
        }

        tttDrawConfettiCtx.globalAlpha = 1;
        tttDrawConfettiAnim = requestAnimationFrame(animate);
    }

    tttDrawConfettiAnim = requestAnimationFrame(animate);
}

function playLoseSound() {
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

function startTttLoseConfetti() {
    if (!tttLoseConfettiCtx) return;

    // Gouttes de pluie
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

        tttLoseConfettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (let drop of raindrops) {
            drop.y += drop.speed;

            if (drop.y > window.innerHeight) {
                drop.y = -drop.length;
                drop.x = Math.random() * window.innerWidth;
            }

            tttLoseConfettiCtx.strokeStyle = `rgba(150, 180, 220, ${drop.opacity})`;
            tttLoseConfettiCtx.lineWidth = 2;
            tttLoseConfettiCtx.beginPath();
            tttLoseConfettiCtx.moveTo(drop.x, drop.y);
            tttLoseConfettiCtx.lineTo(drop.x, drop.y + drop.length);
            tttLoseConfettiCtx.stroke();
        }

        tttLoseConfettiAnim = requestAnimationFrame(animate);
    }

    tttLoseConfettiAnim = requestAnimationFrame(animate);
}

function refreshBoard() {
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
            const c = document.getElementById(`tictactoe-cell-${i}-${j}`);
            // On affiche des images via le CSS (classes), pas de texte
            c.textContent = "";
            c.className = "tictactoe-cell";

            if (board[i][j] === "X") c.classList.add("player-symbol");
            if (board[i][j] === "O") c.classList.add("bot-symbol");
        }
}

function checkWin(sym) {
    for (let i = 0; i < 3; i++)
        if (board[i][0] === sym && board[i][1] === sym && board[i][2] === sym)
            return true;

    for (let j = 0; j < 3; j++)
        if (board[0][j] === sym && board[1][j] === sym && board[2][j] === sym)
            return true;

    if (board[0][0] === sym && board[1][1] === sym && board[2][2] === sym)
        return true;

    if (board[0][2] === sym && board[1][1] === sym && board[2][0] === sym)
        return true;

    return false;
}

function checkDraw() {
    return board.flat().every(v => v !== "");
}

/* ===================== MINIMAX ===================== */

function minimax(board, depth, isMax) {
    if (checkWin("O")) return 10 - depth;
    if (checkWin("X")) return depth - 10;
    if (checkDraw()) return 0;

    if (isMax) {
        let best = -Infinity;
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++)
                if (board[i][j] === "") {
                    board[i][j] = "O";
                    best = Math.max(best, minimax(board, depth + 1, false));
                    board[i][j] = "";
                }
        return best;
    } else {
        let best = Infinity;
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++)
                if (board[i][j] === "") {
                    board[i][j] = "X";
                    best = Math.min(best, minimax(board, depth + 1, true));
                    board[i][j] = "";
                }
        return best;
    }
}

/* ===================== JEU ===================== */

function playCell(i, j) {
    if (!playerTurn || board[i][j] !== "") return;

    board[i][j] = "X";
    refreshBoard();

    if (checkWin("X")) {
        pScore++;
        showTttWinCelebration();
        return;
    }

    if (checkDraw()) {
        dScore++;
        updateTTTScores();
        showTttDrawCelebration();
        return;
    }

    playerTurn = false;
    setTimeout(botPlay, 300);
}

function botPlay() {
    // 0 = complètement random, 1 = quasi imbattable
    const BOT_SMARTNESS = 0.65;

    const possibleMoves = [];
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            if (board[i][j] === "") possibleMoves.push([i, j]);

    if (possibleMoves.length === 0) return;

    const shouldPlayBest = Math.random() < BOT_SMARTNESS;
    if (!shouldPlayBest) {
        const [i, j] = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        board[i][j] = "O";
        refreshBoard();

        if (checkWin("O")) {
            bScore++;
            playerTurn = false;
            updateTTTScores();
            showTttLoseCelebration();
            return;
        }

        if (checkDraw()) {
            dScore++;
            updateTTTScores();
            showTttDrawCelebration();
            return;
        }

        playerTurn = true;
        return;
    }

    let bestScore = -Infinity;
    let move = null;

    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            if (board[i][j] === "") {
                board[i][j] = "O";
                let score = minimax(board, 0, false);
                board[i][j] = "";

                if (score > bestScore) {
                    bestScore = score;
                    move = [i, j];
                }
            }

    if (!move) {
        // Fallback sécurité
        const [i, j] = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        move = [i, j];
    }

    board[move[0]][move[1]] = "O";
    refreshBoard();

    if (checkWin("O")) {
        bScore++;
        updateTTTScores();
        showTttLoseCelebration();
        return;
    }

    if (checkDraw()) {
        dScore++;
        updateTTTScores();
        showTttDrawCelebration();
        return;
    }

    playerTurn = true;
}

function restartTTT() {
    board = [["", "", ""], ["", "", ""], ["", "", ""]];
    playerTurn = true;
    refreshBoard();
    updateTTTScores();
}

/* ===================== EVENTS ===================== */

for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
        document
            .getElementById(`tictactoe-cell-${i}-${j}`)
            .addEventListener("click", () => playCell(i, j));

restartTTT();
})();