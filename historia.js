/* ============================================================
   HISTORIA INTERACTIVA - VERSIÓN SIN LOCALSTORAGE (SIEMPRE INICIA)
   PLAZA DEL MINERO - LLALLAGUA - SIGLO XX
============================================================ */

(function () {

    console.log("Historia interactiva cargada. Esperando orden del LoadingManager...");

    var historiaOverlay;
    var historiaPanel;
    var historiaTitulo;
    var historiaTexto;
    var historiaImagen;
    var historiaNumero;
    var historiaProgreso;
    var historiaProgresoFill;
    var botonSiguiente;
    var botonExplorar;

    var historiaIniciada = false;
    var historiaTerminada = false;

    var pasoActual = 0;

    var puntosCamara = [
        { posicion: new THREE.Vector3(-15, 60, 120), objetivo: new THREE.Vector3(-90, 10, -35) },
        { posicion: new THREE.Vector3(-30, 40, 65), objetivo: new THREE.Vector3(-73, 20, 22) },
        { posicion: new THREE.Vector3(-40, 38, 25), objetivo: new THREE.Vector3(-70, 20, 11) },
        { posicion: new THREE.Vector3(-45, 48, -25), objetivo: new THREE.Vector3(-78, 20, -74) },
        { posicion: new THREE.Vector3(-60, 55, -90), objetivo: new THREE.Vector3(-111, 30, -13) }
    ];

    var historia = [
        { numero: "01", titulo: "La Plaza del Minero", imagen: "imagenes/plaza.jpg", texto: "La Plaza del Minero constituye uno de los espacios representativos de la memoria minera de Llallagua y del antiguo centro minero de Siglo XX. Este recorrido permite conocer sus elementos y relacionarlos con la historia social y minera de la región." },
        { numero: "02", titulo: "Siglo XX y la minería", imagen: "imagenes/historia.jpg", texto: "El desarrollo de Llallagua estuvo estrechamente relacionado con la actividad minera. El entorno de Siglo XX se convirtió en un espacio donde la minería, el trabajo y la vida cotidiana de los trabajadores formaron parte de la identidad de la población." },
        { numero: "03", titulo: "La memoria de los mineros", imagen: "imagenes/plaza3.jpg", texto: "La plaza puede entenderse también como un espacio de memoria. Sus monumentos representan personajes y elementos relacionados con la historia de los trabajadores mineros y con las luchas sociales que marcaron la vida del centro minero." },
        { numero: "04", titulo: "Personajes y monumentos", imagen: "imagenes/monumento.jpg", texto: "Durante el recorrido encontramos diferentes monumentos que permiten acercarnos a personajes y grupos vinculados con la historia de Llallagua. Cada uno puede ser explorado individualmente después de completar este recorrido." },
        { numero: "05", titulo: "Una plaza para recordar", imagen: "imagenes/lateral.jpg", texto: "Hoy, la Plaza del Minero puede ser recorrida como un espacio de memoria histórica. El modelo tridimensional permite observar sus elementos, acercarse a los monumentos y explorar virtualmente un lugar relacionado con la identidad minera de Llallagua." }
    ];

    function crearInterfaz() {
        historiaOverlay = document.getElementById("historia-overlay");
        historiaPanel = document.getElementById("historia-panel");
        historiaTitulo = document.getElementById("historia-titulo");
        historiaTexto = document.getElementById("historia-texto");
        historiaImagen = document.getElementById("historia-imagen");
        historiaNumero = document.getElementById("historia-numero");
        historiaProgreso = document.getElementById("historia-progreso-texto");
        historiaProgresoFill = document.getElementById("historia-progreso-fill");
        botonSiguiente = document.getElementById("historia-siguiente");
        botonExplorar = document.getElementById("btn-explorar-plaza");

        if (botonSiguiente) botonSiguiente.addEventListener("click", siguientePaso);
        if (botonExplorar) botonExplorar.addEventListener("click", terminarHistoria);
    }

    // ====================================================
    // FUNCIÓN GLOBAL QUE LLAMA MODELO_3.JS AL TERMINAR DE CARGAR
    // ====================================================
    window.iniciarHistoriaApp = function() {
        crearInterfaz();

        // Iniciamos la historia directamente siempre
        if (historiaIniciada) return;
        historiaIniciada = true;
        document.body.classList.add("historia-activa");
        
        if (controles) controles.enabled = false;
        if (historiaOverlay) historiaOverlay.classList.add("activa");
        
        mostrarPaso(0);
    };
    // ====================================================

    function mostrarPaso(indice) {
        pasoActual = indice;
        var paso = historia[indice];

        historiaNumero.innerText = paso.numero;
        historiaTitulo.innerText = paso.titulo;
        historiaTexto.innerText = paso.texto;
        historiaProgreso.innerText = (indice + 1) + " / " + historia.length;
        historiaProgresoFill.style.width = ((indice + 1) / historia.length * 100) + "%";
    
        if (indice % 2 === 0) {
            historiaPanel.classList.remove("historia-izquierda");
            historiaPanel.classList.add("historia-derecha");
        } else {
            historiaPanel.classList.remove("historia-derecha");
            historiaPanel.classList.add("historia-izquierda");
        }

        historiaImagen.classList.add("cambiando");

        setTimeout(function () {
            historiaImagen.src = paso.imagen;
            historiaImagen.onload = function () {
                historiaImagen.classList.remove("cambiando");
            };

            setTimeout(function () {
                historiaImagen.classList.remove("cambiando");
            }, 700);
        }, 250);

        moverCamara(puntosCamara[indice]);

        if (indice === historia.length - 1) {
            botonSiguiente.innerText = "FINALIZAR HISTORIA";
        } else {
            botonSiguiente.innerText = "CONTINUAR →";
        }
    }

    function siguientePaso() {
        if (pasoActual < historia.length - 1) {
            mostrarPaso(pasoActual + 1);
        } else {
            terminarHistoria();
        }
    }

    var animacionCamara = null;

    function moverCamara(punto) {
        if (!camera || !controles) return;

        if (animacionCamara) {
            cancelAnimationFrame(animacionCamara);
        }

        var inicio = camera.position.clone();
        var objetivoInicial = controles.target.clone();
        var destino = punto.posicion.clone();
        var destinoObjetivo = punto.objetivo.clone();
        
        var inicioTiempo = performance.now();
        var duracion = 1800;

        function animarCamara(ahora) {
            var progreso = (ahora - inicioTiempo) / duracion;
            if (progreso > 1) progreso = 1;

            var suavizado = progreso < 0.5
                ? 2 * progreso * progreso
                : 1 - Math.pow(-2 * progreso + 2, 2) / 2;

            camera.position.lerpVectors(inicio, destino, suavizado);
            controles.target.lerpVectors(objetivoInicial, destinoObjetivo, suavizado);
            controles.update();

            if (progreso < 1) {
                animacionCamara = requestAnimationFrame(animarCamara);
            }
        }

        animacionCamara = requestAnimationFrame(animarCamara);
    }

    function terminarHistoria() {
        
        historiaTerminada = true;
        if (historiaOverlay) historiaOverlay.classList.remove("activa");
        document.body.classList.remove("historia-activa");

        if (controles) {
            controles.enabled = true;
            controles.enableRotate = true;
            controles.enableZoom = true;
            controles.enablePan = true;
            controles.update();
        }

        if (botonExplorar) {
            botonExplorar.classList.add("visible");
            setTimeout(function () {
                botonExplorar.classList.remove("visible");
            }, 5000);
        }
    }

})();