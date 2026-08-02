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
let stats = { wins: 0, losses: 0 };

if (fs.existsSync(statsPath)) {
    try {
        stats = JSON.parse(fs.readFileSync(statsPath, "utf8"));
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

// =====================
// Servidor Express (Overlay)
// =====================
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/stats", (req, res) => {
    let total = stats.wins + stats.losses;
    let winrate = total > 0 ? ((stats.wins / total) * 100).toFixed(1) : 0;

    res.json({
        wins: stats.wins,
        losses: stats.losses,
        winrate: winrate
    });
});

app.get("/settings", (req, res) => {
    res.json(overlaySettings);
});

// Un solo listen con el puerto dinámico de Railway
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

// Helper para guardar stats
function guardarStats() {
    try {
        fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    } catch (e) {
        console.error("Error al guardar stats.json:", e);
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
        guardarStats();
        client.say(channel, `🏆 Win registrado! Total: ${stats.wins}`);
    }

    if (message === "!lose" && esAdmin) {
        stats.losses++;
        guardarStats();
        client.say(channel, `💀 Derrota registrada! Total: ${stats.losses}`);
    }

    if (message === "!rwin" && esAdmin) {
        if (stats.wins > 0) {
            stats.wins--;
            guardarStats();
            client.say(channel, `↩️ Win eliminado. Total: ${stats.wins}`);
        } else {
            client.say(channel, `⚠️ No hay wins para eliminar`);
        }
    }

    if (message === "!rlose" && esAdmin) {
        if (stats.losses > 0) {
            stats.losses--;
            guardarStats();
            client.say(channel, `↩️ Loss eliminado. Total: ${stats.losses}`);
        } else {
            client.say(channel, `⚠️ No hay losses for eliminar`);
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