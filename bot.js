
require("dotenv").config();
const tmi = require("tmi.js");
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
 
const app = express();
 
// =====================
// Cargar estadísticas
// =====================
const statsPath = path.join(__dirname, "stats.json");
let stats = { wins: 0, losses: 0, history: [] };
 
if (fs.existsSync(statsPath)) {
    try {
        const loaded = JSON.parse(fs.readFileSync(statsPath, "utf8"));
        stats = {
            wins: loaded.wins || 0,
            losses: loaded.losses || 0,
            // Compatibilidad con stats.json viejos que no tenían "history"
            history: Array.isArray(loaded.history) ? loaded.history : []
        };
    } catch (e) {
        console.error("Error al leer stats.json, usando valores por defecto", e);
    }
} else {
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}
 
let overlaySettings = {
    mode: "full",
    visible: true
};
 
// Cuántas partidas guardamos como máximo en el historial (evita que crezca infinito)
const MAX_HISTORY = 100;
 
// =====================
// Servidor Express (Overlay)
// =====================
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
 
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});
 
// Calcula la racha actual a partir del historial (último resultado repetido consecutivo)
function calcularRacha(history) {
    if (!history || history.length === 0) return null;
 
    const ultimo = history[history.length - 1];
    let count = 0;
 
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i] === ultimo) count++;
        else break;
    }
 
    return { tipo: ultimo, count };
}
 
app.get("/stats", (req, res) => {
    let total = stats.wins + stats.losses;
    let winrate = total > 0 ? ((stats.wins / total) * 100).toFixed(1) : 0;
 
    res.json({
        wins: stats.wins,
        losses: stats.losses,
        winrate: winrate,
        last10: stats.history.slice(-10),
        streak: calcularRacha(stats.history)
    });
});
 
app.get("/settings", (req, res) => {
    res.json(overlaySettings);
});
 
// Puerto dinámico asignado por Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});
 
// =====================
// Twitch Bot
// =====================
const client = new tmi.Client({
    options: { debug: true },
    identity: {
        username: process.env.TWITCH_USERNAME,
        password: process.env.TWITCH_TOKEN
    },
    channels: [process.env.TWITCH_CHANNEL]
});
 
client.connect().catch(console.error);
 
// Helper para guardar estadísticas en disco
function guardarStats() {
    try {
        fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    } catch (e) {
        console.error("Error al guardar stats.json:", e);
    }
}
 
// Agrega un resultado al historial, respetando el límite máximo
function agregarAlHistorial(resultado) {
    stats.history.push(resultado);
    if (stats.history.length > MAX_HISTORY) {
        stats.history = stats.history.slice(-MAX_HISTORY);
    }
}
 
// Quita la última ocurrencia de un resultado del historial (para !rwin / !rlose)
function quitarDelHistorial(resultado) {
    for (let i = stats.history.length - 1; i >= 0; i--) {
        if (stats.history[i] === resultado) {
            stats.history.splice(i, 1);
            break;
        }
    }
}
 
// =====================
// Comandos Twitch
// =====================
client.on("message", (channel, tags, message, self) => {
    if (self) return;
 
    const esAdmin =
        tags.username.toLowerCase() === (process.env.TWITCH_USERNAME || "").toLowerCase() ||
        tags.mod === true ||
        tags.badges?.broadcaster === "1";
 
    if (message === "!win" && esAdmin) {
        stats.wins++;
        agregarAlHistorial("win");
        guardarStats();
        client.say(channel, `🏆 Win registrado! Total: ${stats.wins}`);
    }
 
    if (message === "!lose" && esAdmin) {
        stats.losses++;
        agregarAlHistorial("loss");
        guardarStats();
        client.say(channel, `💀 Derrota registrada! Total: ${stats.losses}`);
    }
 
    if (message === "!rwin" && esAdmin) {
        if (stats.wins > 0) {
            stats.wins--;
            quitarDelHistorial("win");
            guardarStats();
            client.say(channel, `↩️ Win eliminado. Total: ${stats.wins}`);
        } else {
            client.say(channel, `⚠️ No hay wins para eliminar`);
        }
    }
 
    if (message === "!rlose" && esAdmin) {
        if (stats.losses > 0) {
            stats.losses--;
            quitarDelHistorial("loss");
            guardarStats();
            client.say(channel, `↩️ Loss eliminado. Total: ${stats.losses}`);
        } else {
            client.say(channel, `⚠️ No hay losses para eliminar`);
        }
    }
 
    if (message === "!compact" && esAdmin) {
        overlaySettings.mode = "compact";
        client.say(channel, "📦 Overlay compacto activado");
    }
 
    if (message === "!full" && esAdmin) {
        overlaySettings.mode = "full";
        client.say(channel, "🖥️ Overlay completo activado");
    }
 
    if (message === "!hide" && esAdmin) {
        overlaySettings.visible = false;
        client.say(channel, "👻 Overlay oculto");
    }
 
    if (message === "!show" && esAdmin) {
        overlaySettings.visible = true;
        client.say(channel, "👀 Overlay visible");
    }
});