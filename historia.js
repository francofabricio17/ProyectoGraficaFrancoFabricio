/* ============================================================
   HISTORIA INTERACTIVA
   PLAZA DEL MINERO - LLALLAGUA - SIGLO XX
============================================================ */

(function () {

    console.log("Historia interactiva iniciada");

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

    /*
     * =========================================================
     * PUNTOS DE CÁMARA (AJUSTADOS PARA ESTAR MÁS ALEJADOS)
     * =========================================================
     */

    var puntosCamara = [

        {
            // Paso 1 - Más alejado y alto
            posicion: new THREE.Vector3(
                -15,  // antes -30
                60,   // antes 45
                120   // antes 95
            ),
            objetivo: new THREE.Vector3(
                -90,
                10,
                -35
            )
        },

        {
            // Paso 2 - Más alejado hacia atrás
            posicion: new THREE.Vector3(
                -30,  // antes -45
                40,   // antes 30
                65    // antes 45
            ),
            objetivo: new THREE.Vector3(
                -73,
                20,
                22
            )
        },

        {
            // Paso 3 - Un plano un poco más general
            posicion: new THREE.Vector3(
                -40,  // antes -55
                38,   // antes 28
                25    // antes 15
            ),
            objetivo: new THREE.Vector3(
                -70,
                20,
                11
            )
        },

        {
            // Paso 4 - Aleja la cámara del monumento
            posicion: new THREE.Vector3(
                -45,  // antes -60
                48,   // antes 35
                -25   // antes -45
            ),
            objetivo: new THREE.Vector3(
                -78,
                20,
                -74
            )
        },

        {
            // Paso 5 - Plano abierto final
            posicion: new THREE.Vector3(
                -60,  // antes -80
                55,   // antes 42
                -90   // antes -65
            ),
            objetivo: new THREE.Vector3(
                -111,
                30,
                -13
            )
        }

    ];


    /*
     * =========================================================
     * CONTENIDO
     * =========================================================
     */

    var historia = [
        {
            numero: "01",
            titulo: "La Plaza del Minero",
            imagen: "imagenes/plaza.jpg",
            texto: "La Plaza del Minero constituye uno de los espacios representativos de la memoria minera de Llallagua y del antiguo centro minero de Siglo XX. Este recorrido permite conocer sus elementos y relacionarlos con la historia social y minera de la región."
        },
        {
            numero: "02",
            titulo: "Siglo XX y la minería",
            imagen: "imagenes/historia.jpg",
            texto: "El desarrollo de Llallagua estuvo estrechamente relacionado con la actividad minera. El entorno de Siglo XX se convirtió en un espacio donde la minería, el trabajo y la vida cotidiana de los trabajadores formaron parte de la identidad de la población."
        },
        {
            numero: "03",
            titulo: "La memoria de los mineros",
            imagen: "imagenes/plaza3.jpg",
            texto: "La plaza puede entenderse también como un espacio de memoria. Sus monumentos representan personajes y elementos relacionados con la historia de los trabajadores mineros y con las luchas sociales que marcaron la vida del centro minero."
        },
        {
            numero: "04",
            titulo: "Personajes y monumentos",
            imagen: "imagenes/monumento.jpg",
            texto: "Durante el recorrido encontramos diferentes monumentos que permiten acercarnos a personajes y grupos vinculados con la historia de Llallagua. Cada uno puede ser explorado individualmente después de completar este recorrido."
        },
        {
            numero: "05",
            titulo: "Una plaza para recordar",
            imagen: "imagenes/lateral.jpg",
            texto: "Hoy, la Plaza del Minero puede ser recorrida como un espacio de memoria histórica. El modelo tridimensional permite observar sus elementos, acercarse a los monumentos y explorar virtualmente un lugar relacionado con la identidad minera de Llallagua."
        }
    ];


    /*
     * =========================================================
     * ESPERAR A QUE MODELO.JS TERMINE DE CREAR LA ESCENA
     * =========================================================
     */

    function esperarEscena() {
        if (
            typeof THREE === "undefined" ||
            typeof camera === "undefined" ||
            typeof controles === "undefined"
        ) {
            setTimeout(esperarEscena, 100);
            return;
        }

        crearInterfaz();
        iniciarHistoria();
    }


    /*
     * =========================================================
     * CREAR INTERFAZ
     * =========================================================
     */

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

        botonSiguiente.addEventListener("click", siguientePaso);
        botonExplorar.addEventListener("click", terminarHistoria);
    }


    /*
     * =========================================================
     * INICIAR HISTORIA
     * =========================================================
     */

    function iniciarHistoria() {
        if (historiaIniciada) return;
        historiaIniciada = true;
        document.body.classList.add("historia-activa");
        
        controles.enabled = false;
        historiaOverlay.classList.add("activa");
        
        mostrarPaso(0);
    }


    /*
     * =========================================================
     * MOSTRAR PASO
     * =========================================================
     */

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


    /*
     * =========================================================
     * SIGUIENTE CAPÍTULO
     * =========================================================
     */

    function siguientePaso() {
        if (pasoActual < historia.length - 1) {
            mostrarPaso(pasoActual + 1);
        } else {
            terminarHistoria();
        }
    }


    /*
     * =========================================================
     * MOVIMIENTO CINEMATOGRÁFICO DE CÁMARA
     * =========================================================
     */

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


    /*
     * =========================================================
     * TERMINAR HISTORIA
     * =========================================================
     */

    function terminarHistoria() {
        historiaTerminada = true;
        historiaOverlay.classList.remove("activa");
        document.body.classList.remove("historia-activa");

        controles.enabled = true;
        controles.enableRotate = true;
        controles.enableZoom = true;
        controles.enablePan = true;
        controles.update();

        botonExplorar.classList.add("visible");

        setTimeout(function () {
            botonExplorar.classList.remove("visible");
        }, 5000);
    }


    /*
     * =========================================================
     * INICIAR CUANDO EXISTAN CAMERA Y CONTROLES
     * =========================================================
     */

    esperarEscena();

})();