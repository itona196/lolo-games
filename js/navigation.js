/* ========================================================================
   SYSTEME DE SWITCH ENTRE LES JEUX
========================================================================= */
const gameButtons = document.querySelectorAll(".game-card");
const gameContainers = document.querySelectorAll(".game-container");

function showGame(id) {
    gameContainers.forEach(c => c.classList.remove("active"));
    document.getElementById(id + "Game").classList.add("active");

    gameButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.game === id);
    });
    
    // Sauvegarder le jeu actif
    localStorage.setItem('currentGame', id);
}

gameButtons.forEach(btn => {
    btn.addEventListener("click", () => showGame(btn.dataset.game));
});

// Charger le dernier jeu actif ou afficher "mole" par défaut
const lastGame = localStorage.getItem('currentGame') || 'mole';
showGame(lastGame);
