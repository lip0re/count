const last10Face = document.getElementById("last10-face");
const historyRow = document.getElementById("history-row");
const streakText = document.getElementById("streak-text");


async function actualizar(){

    const respuesta = await fetch(
        "http://localhost:3000/stats"
    );


    const datos = await respuesta.json();


    document.getElementById("wins").innerHTML =
        datos.wins;


    document.getElementById("losses").innerHTML =
        datos.losses;


    document.getElementById("winrate").innerHTML =
        datos.winrate + "%";


    actualizarCirculo(
        datos.wins,
        datos.losses
    );

}

async function actualizarStats() {
    try {
        const res = await fetch("/stats");
        const data = await res.json();

        actualizarValores(data);
        actualizarCirculo(data);
        renderHistory(data.last10); // <-- Asegúrate de que esta línea esté aquí
    } catch (e) {
        console.error("Error al obtener /stats:", e);
    }
}

function renderStreak(streak) {
    if (!streakText) return;
    streakText.className = "streak-text";
    if (!streak || streak.count < 2) {
        streakText.textContent = "";
        return;
    }

    if (streak.tipo === "win") {
        streakText.textContent = `🔥 ${streak.count} seguidas`;
        streakText.classList.add("win-streak");
    } else {
        streakText.textContent = `❄️ ${streak.count} seguidas`;
        streakText.classList.add("loss-streak");
    }
}

async function actualizarStats() {
    try {
        const res = await fetch("/stats");
        const data = await res.json();

        actualizarValores(data);
        renderHistory(data.last10);
        renderStreak(data.streak);
    } catch (e) {
        console.error("Error al obtener /stats:", e);
    }
}

async function actualizarSettings() {
    try {
        const res = await fetch("/settings");
        const data = await res.json();

        overlay.classList.toggle("is-hidden", data.visible === false);

        const mostrarUlt10 = data.showLast10 === true;

        // La barra de números SIEMPRE se ve.
        // Los 10 círculos SOLO se muestran cuando activas !ult10.
        last10Face.classList.toggle("is-hidden", !mostrarUlt10);
    } catch (e) {
        console.error("Error al obtener /settings:", e);
    }
}

function renderHistory(last10) {
    const historyRow = document.getElementById("history-row");
    if (!historyRow) return;
    
    historyRow.innerHTML = "";
    
    // Si no hay datos aún, creamos un array vacío
    const lista = Array.isArray(last10) ? last10 : [];

    // Rellena los espacios faltantes hasta completar 10
    const faltantes = 10 - lista.length;
    for (let i = 0; i < faltantes; i++) {
        const dot = document.createElement("div");
        dot.className = "game-dot empty";
        historyRow.appendChild(dot);
    }

    // Renderiza las partidas registradas
    lista.forEach(resultado => {
        const dot = document.createElement("div");
        dot.className = "game-dot " + (resultado === "win" ? "win" : "loss");
        dot.textContent = resultado === "win" ? "✓" : "✕";
        historyRow.appendChild(dot);
    });
}



function actualizarCirculo(wins, losses){

    let total = wins + losses;


    let porcentajeWins = 0;


    if(total > 0){

        porcentajeWins =
        (wins / total) * 100;

    }


    const circulo =
    document.querySelector(".circle");


    circulo.style.background =
    `
    conic-gradient(
        #00ff99 0% ${porcentajeWins}%,
        #ff3355 ${porcentajeWins}% 100%
    )
    `;

}



setInterval(actualizar,1000);


actualizar();

async function modoOverlay(){

    const respuesta = await fetch(
        "http://localhost:3000/settings"
    );


    const datos = await respuesta.json();


    const overlay =
    document.getElementById("overlay");


    overlay.classList.remove(
        "compact",
        "hidden"
    );


    if(datos.mode === "compact"){

        overlay.classList.add("compact");

    }


    if(datos.visible === false){

        overlay.classList.add("hidden");

    }

}


setInterval(modoOverlay,1000);