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

let stats = JSON.parse(
    fs.readFileSync(path.join(__dirname, "stats.json"))
);

let overlaySettings = {

    mode:"full",

    visible:true

};

// =====================
// Servidor para overlay
// =====================

const app = express();

app.use(cors());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
});


app.get("/stats", (req, res) => {

    let total = stats.wins + stats.losses;

    let winrate = total > 0
        ? ((stats.wins / total) * 100).toFixed(1)
        : 0;


    res.json({

        wins: stats.wins,
        losses: stats.losses,
        winrate: winrate

    });

});

app.get("/settings",(req,res)=>{

    res.json(overlaySettings);

});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
});


// =====================
// Twitch Bot
// =====================

const client = new tmi.Client({
    options: {
        debug: true
    },

    identity: {
        username: process.env.TWITCH_USERNAME,
        password: process.env.TWITCH_TOKEN
    },

    channels: [
        process.env.TWITCH_CHANNEL
    ]
});


client.connect();


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

        client.say(
            channel,
            `🏆 Win registrado! Total: ${stats.wins}`
        );
    }

    if (message === "!lose" && esAdmin) {


        stats.losses++;

        guardarStats();


        client.say(
            channel,
            `💀 Derrota registrada! Total: ${stats.losses}`
        );

    }

        // Restar victoria
    if(message === "!rwin" && esAdmin) {

        if(stats.wins > 0) {

            stats.wins--;

            guardarStats();

            client.say(
                channel,
                `↩️ Win eliminado. Total: ${stats.wins}`
            );

        } else {

            client.say(
                channel,
                `⚠️ No hay wins para eliminar`
            );

        }

    }



    // Restar derrota
    if(message === "!rlose" && esAdmin) {

        if(stats.losses > 0) {

            stats.losses--;

            guardarStats();

            client.say(
                channel,
                `↩️ Loss eliminado. Total: ${stats.losses}`
            );

        } else {

            client.say(
                channel,
                `⚠️ No hay losses para eliminar`
            );

        }

    }

    if(message === "!compact" && esAdmin){

    overlaySettings.mode="compact";

    client.say(
        channel,
        "📦 Overlay compacto activado"
    );

}


    if(message === "!full" && esAdmin){

    overlaySettings.mode="full";

    client.say(
        channel,
        "🖥️ Overlay completo activado"
    );

}



        if(message === "!hide" && esAdmin){

    overlaySettings.visible=false;

    client.say(
        channel,
        "👻 Overlay oculto"
    );

}



    if(message === "!show" && esAdmin){

    overlaySettings.visible=true;

    client.say(
        channel,
        "👀 Overlay visible"
    );

}



// =====================
// Guardar estadísticas
// =====================

function guardarStats(){

    fs.writeFileSync(
    path.join(__dirname, "stats.json"),
    JSON.stringify(stats, null, 2)
);

}

});