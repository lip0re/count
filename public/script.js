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