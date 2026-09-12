var scene;
var camera;
var renderer;
var plaza;
var controles;
var sound;

var marcadores = [
    { texto: "Monumento a Irineo Pimentel Rojas", posicion: new THREE.Vector3(-73, 41, 22.5), elemento: null, enlace: "irineo.html" },
    { texto: "Monumento a Federico Escobar", posicion: new THREE.Vector3(-70, 40, 11.5), elemento: null, enlace: "federico.html" },
    { texto: "Monumento a Cesar, Gillermo e Isaac", posicion: new THREE.Vector3(-74, 39, -38), elemento: null, enlace: "cesar.html" },
    { texto: "Monumento a las Palliris", posicion: new THREE.Vector3(-78, 40,-74), elemento: null, enlace: "palliri.html" },
    { texto: "Monumento al Minero", posicion: new THREE.Vector3(-111.5, 57, -13), elemento: null, enlace: "minero.html" }
];

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#050d0a');
    
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(4, 10, 25);

    // ====================================================
    // GESTOR DE CARGAS (LOADING MANAGER)
    // ====================================================
    var manager = new THREE.LoadingManager();
    
    manager.onProgress = function (url, itemsLoaded, itemsTotal) {
        var progressBar = document.getElementById('progress-bar'); 
        var progressText = document.getElementById('progress-text');
        if (itemsTotal > 0 && progressText) {
            var porcentaje = Math.round((itemsLoaded / itemsTotal) * 100);
            if (progressBar) progressBar.style.width = porcentaje + '%';
            progressText.innerText = porcentaje + '%';
        }
    };

    manager.onLoad = function () {
        console.log("Carga al 100%. Todos los modelos y texturas están listos.");
        var loaderContainer = document.getElementById('loader-container');
        if (loaderContainer) {
            loaderContainer.classList.add('loaded');
        }
        
        // Llamamos a la historia SOLAMENTE cuando todo está cargado
        if (typeof window.iniciarHistoriaApp === 'function') {
            window.iniciarHistoriaApp();
        }
    };

    // ====================================================

    var listener = new THREE.AudioListener();
    camera.add(listener);
    
    sound = new THREE.Audio(listener);
    // Agregamos el manager al AudioLoader para que espere la música
    var audioLoader = new THREE.AudioLoader(manager);
    audioLoader.load('assets/mieros.mp3', function(buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.3);
    });
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0; 
    renderer.outputColorSpace = THREE.SRGBColorSpace; 
    
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    
    controles = new THREE.OrbitControls(camera, renderer.domElement);
    controles.enableDamping = true;
    controles.dampingFactor = 0.08;
    controles.enableZoom = true;
    controles.enableRotate = true;
    controles.enablePan = true;
    controles.minDistance = 5;
    controles.maxDistance = 300;
    controles.maxPolarAngle = Math.PI / 2;
    
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);
    
    var hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x112211, 0.5);
    scene.add(hemisphereLight);
    
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(30, 60, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 512; 
    directionalLight.shadow.mapSize.height = 512;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    var d = 80; 
    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;
    directionalLight.shadow.bias = -0.0005; 
    scene.add(directionalLight);
    
    var directionalLight2 = new THREE.DirectionalLight(0xaaccff, 0.3);
    directionalLight2.position.set(-30, 20, -30);
    scene.add(directionalLight2);

    // Agregamos el manager al TextureLoader
    const textureLoader = new THREE.TextureLoader(manager);
    textureLoader.load(
        "imagenes/cielo.jpg",
        function (texture) {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.background = texture;
            scene.environment = texture;
        }
    );
    
    // Agregamos el manager al GLTFLoader
    var cargar = new THREE.GLTFLoader(manager);
    
    var etiquetasContainer = document.getElementById('etiquetas-container');
    if(etiquetasContainer) {
        marcadores.forEach(function(marcador) {
            var div = document.createElement('div');
            div.className = 'etiqueta-3d';
            div.innerText = marcador.texto;
            div.onclick = function() {
                window.location.href = marcador.enlace;
            };
            etiquetasContainer.appendChild(div);
            marcador.elemento = div;
        });
    }
    
    // 1. Cargar el modelo principal de la plaza
    cargar.load("assets/piso.glb", function(gltf) {
        plaza = gltf.scene;
        plaza.position.set(0, 0, 0);
        plaza.scale.set(5, 5, 5);
        plaza.traverse(function(obj) {
            if(obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
                if(obj.material) {
                obj.material.needsUpdate = true;
                    if(obj.material.map) {
                        obj.material.map.generateMipmaps = true;
                        obj.material.map.minFilter = THREE.LinearMipmapLinearFilter;
                        obj.material.map.magFilter = THREE.LinearFilter;
                        obj.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                    }
                }
            }
        });
        
        scene.add(plaza);
        var box = new THREE.Box3().setFromObject(plaza);
        var center = box.getCenter(new THREE.Vector3());
        controles.target.copy(center);
        camera.position.set(center.x + 2800, center.y + 470, center.z - 1800);
        camera.lookAt(center)
        controles.update();
    }, undefined, function(error) {
        console.log("Error cargando piso.glb:", error);
    });

    // Función segura simplificada, el LoadingManager se encarga de contar
    function cargarModeloSeguro(url, callbackExito) {
        cargar.load(url, function(gltf) {
            callbackExito(gltf.scene);
        }, undefined, function(error) {
            console.log("Error en modelo: " + url, error);
        });
    }

    // 2. Pedestales y Palliri
    cargarModeloSeguro("assets/Pedestalirineo.glb", function(est1) { est1.scale.set(3.5, 3.5, 3.5); est1.position.set(-73, 3.5, 22); scene.add(est1); });
    cargarModeloSeguro("assets/Pedestalfederico.glb", function(est2) { est2.scale.set(3.5, 3.5, 3.5); est2.position.set(-73, 3.3, 11); scene.add(est2); });
    cargarModeloSeguro("assets/Pedestalescobar.glb", function(est3) { est3.scale.set(3.5, 3.5, 3.5); est3.position.set(-74, 3.5, -38); scene.add(est3); });
    cargarModeloSeguro("assets/Palliri.glb", function(est4) { est4.scale.set(4, 4, 4); est4.position.set(-78, 11, -74); est4.rotation.set(0, Math.PI / 2, 0); scene.add(est4); });
    cargarModeloSeguro("assets/completomina.glb", function(est6) { est6.scale.set(10, 10, 10); est6.position.set(-111.5, 19, -13); est6.rotation.set(0, Math.PI / 2, 0); scene.add(est6); });
    
    // 3. Postes
    cargarModeloSeguro("assets/poste.glb", function(modeloBase) {
        modeloBase.scale.set(8.5, 8.5, 8.5);
        var obj1 = modeloBase.clone(); obj1.position.set(-52, 7, 30); scene.add(obj1);
        var obj2 = modeloBase.clone(); obj2.position.set(-52, 7, -5); scene.add(obj2);
        var obj3 = modeloBase.clone(); obj3.position.set(-52, 7, -35); scene.add(obj3);
        var obj4 = modeloBase.clone(); obj4.position.set(-52, 7, -65); scene.add(obj4);
        var obj5 = modeloBase.clone(); obj5.position.set(-52, 7, -95); scene.add(obj5);
        var obj6 = modeloBase.clone(); obj6.position.set(-25, 1.4, 79); scene.add(obj6);
        var obj7 = modeloBase.clone(); obj7.position.set(-89.5, 7, -93.5); scene.add(obj7);
        var obj8 = modeloBase.clone(); obj8.position.set(-89, 7, -117); scene.add(obj8);
        var obj9 = modeloBase.clone(); obj9.position.set(-52, 7, -120); scene.add(obj9);
        var obj10 = modeloBase.clone(); obj10.position.set(-130, 7, -150); scene.add(obj10);
        var obj11 = modeloBase.clone(); obj11.position.set(-135, 7, -103); scene.add(obj11);  
        var obj12 = modeloBase.clone(); obj12.position.set(-52, 7, -150); scene.add(obj12);
    });

    // 4. Bancas Verdes
    cargarModeloSeguro("assets/bancaverde.glb", function(modeloBanca) {
        modeloBanca.scale.set(11, 11, 10);
        var obj7 = modeloBanca.clone(); obj7.position.set(-77.5, 8, -60); scene.add(obj7);
        var obj8 = modeloBanca.clone(); obj8.position.set(-77.5, 8, -88.5); obj8.rotation.y += Math.PI; scene.add(obj8);
        var obj9 = modeloBanca.clone(); obj9.position.set(-68, 8, -75.5); obj9.rotation.set(0, Math.PI / 2, 0); scene.add(obj9);
        var obj10 = modeloBanca.clone(); obj10.position.set(-111, 8, -60); scene.add(obj10);
        var obj11 = modeloBanca.clone(); obj11.position.set(-114.5, 8, -88.5); obj11.rotation.y += Math.PI; scene.add(obj11);
        var obj12 = modeloBanca.clone(); obj12.position.set(-112, 8, -120); scene.add(obj12);
        var obj13 = modeloBanca.clone(); obj13.position.set(-112.5, 8, -148); obj13.rotation.y += Math.PI; scene.add(obj13);
        var obj14 = modeloBanca.clone(); obj14.position.set(-77.5, 8, -148); obj14.rotation.y += Math.PI; scene.add(obj14);
        var obj15 = modeloBanca.clone(); obj15.position.set(-77.5, 8, -119); scene.add(obj15);
        var obj16 = modeloBanca.clone(); obj16.position.set(-68, 8, -134.5); obj16.rotation.set(0, Math.PI / 2, 0); scene.add(obj16);
    });

    cargarModeloSeguro("assets/arbol.glb", function(modeloArbol) {
        modeloArbol.scale.set(35, 35, 35);
        var obj40 = modeloArbol.clone(); obj40.position.set(-105, 8, 20); scene.add(obj40);
        var obj41 = modeloArbol.clone(); obj41.position.set(-105, 8, -38); scene.add(obj41);
        var obj42 = modeloArbol.clone(); obj42.position.set(-128, 8, -38); scene.add(obj42);
    });

    cargarModeloSeguro("assets/planta.glb", function(modeloPlanta) {
        modeloPlanta.scale.set(6, 7, 6);
        var obj40 = modeloPlanta.clone(); obj40.position.set(-85, 7, -82); scene.add(obj40);
        var obj41 = modeloPlanta.clone(); obj41.position.set(-120, 7, -70); scene.add(obj41);
        var obj42 = modeloPlanta.clone(); obj42.scale.set(8, 8,8); obj42.position.set(-123, 7.5,-147);  scene.add(obj42);
    });

    cargarModeloSeguro("assets/letrasiglo.glb", function(modeloletra) {
        modeloletra.scale.set(24, 24, 24);
        var obj40 = modeloletra.clone(); obj40.position.set(-78, 8, -133); obj40.rotation.set(0, Math.PI / -2, 0); scene.add(obj40);
    });
    
    cargarModeloSeguro("assets/pilar.glb", function(modelopilar) {
        modelopilar.scale.set(9, 12, 12);
        var pilar22 = modelopilar.clone(); pilar22.position.set(-105, 10.5, 0.5); pilar22.rotation.y = Math.PI/2; scene.add(pilar22);
        var pilar23 = modelopilar.clone(); pilar23.position.set(-116.9, 10.5, 0.5); pilar23.rotation.y = Math.PI/2; scene.add(pilar23);
    });
    
    cargarModeloSeguro("assets/pilar.glb", function(modeloPilar) {
        modeloPilar.scale.set(9, 12, 12);
        var pilar7 = modeloPilar.clone(); pilar7.position.set(-121.5, 10.5, -22); scene.add(pilar7);
        var pilar17 = modeloPilar.clone(); pilar17.position.set(-121.5, 10.5, -13); scene.add(pilar17);
        var pilar18 = modeloPilar.clone(); pilar18.position.set(-121.5, 10.5, -4); scene.add(pilar18);
        var pilar19 = modeloPilar.clone(); pilar19.position.set(-100.5, 10.5, -22); scene.add(pilar19);
        var pilar20 = modeloPilar.clone(); pilar20.position.set(-100.5, 10.5, -13); scene.add(pilar20);
        var pilar21 = modeloPilar.clone(); pilar21.position.set(-100.5, 10.5, -4); scene.add(pilar21);
    });
    
    // 5. Sillas de goma
    cargarModeloSeguro("assets/sillagoma.glb", function(modeloSilla) {
        modeloSilla.scale.set(6, 6.5, 6);
        var obj14 = modeloSilla.clone(); obj14.position.set(-61.5, 7, 23); obj14.rotation.y = Math.PI; scene.add(obj14);
        var silla2 = modeloSilla.clone(); silla2.position.set(-61.5, 7, 10); silla2.rotation.y = Math.PI; scene.add(silla2);
        var silla3 = modeloSilla.clone(); silla3.position.set(-61.5, 7, -33); silla3.rotation.y = Math.PI; scene.add(silla3);
        var silla4 = modeloSilla.clone(); silla4.position.set(-61.5, 7, -42); silla4.rotation.y = Math.PI; scene.add(silla4);
        var silla5 = modeloSilla.clone(); silla5.position.set(-61.5, 7, -63); silla5.rotation.y = Math.PI; scene.add(silla5);
        var silla6 = modeloSilla.clone(); silla6.position.set(-61.5, 7, -87); silla6.rotation.y = Math.PI; scene.add(silla6);
    });

    // 6. Barandas
    cargarModeloSeguro("assets/barandasplaza.glb", function(modeloBaranda) {
        var obj8 = modeloBaranda.clone(); obj8.scale.set(6, 7, 8.5); obj8.position.set(-65, 8.6, 30); obj8.rotation.set(0, Math.PI / 2, 0); scene.add(obj8);
        var obj9 = modeloBaranda.clone(); obj9.scale.set(6, 7, 8.5); obj9.position.set(-96.3, 8.6, 30); obj9.rotation.set(0, Math.PI / 2, 0); scene.add(obj9);
        var obj10 = modeloBaranda.clone(); obj10.scale.set(6, 7, 7.5); obj10.position.set(-65, 8.6, 30); scene.add(obj10);
        var obj11 = modeloBaranda.clone(); obj11.scale.set(6, 7, 6); obj11.position.set(-65, 8.6, 2); obj11.rotation.set(0, Math.PI / 2, 0); scene.add(obj11);
        var obj12 = modeloBaranda.clone(); obj12.scale.set(6, 7, 8); obj12.position.set(-87, 8.6, 1); scene.add(obj12);
        var obj13 = modeloBaranda.clone(); obj13.scale.set(6, 7, 6); obj13.position.set(-65, 8.6, -29.5); obj13.rotation.set(0, Math.PI / 2, 0); scene.add(obj13);
        var obj15 = modeloBaranda.clone(); obj15.scale.set(6, 7, 8.5); obj15.position.set(-65, 8.6, -45); obj15.rotation.set(0, Math.PI / 2, 0); scene.add(obj15);
        var obj16 = modeloBaranda.clone(); obj16.scale.set(6, 7, 8.5); obj16.position.set(-96.3, 8.6, -45); obj16.rotation.set(0, Math.PI / 2, 0); scene.add(obj16);
        var obj17 = modeloBaranda.clone(); obj17.scale.set(6, 7, 4.2); obj17.position.set(-65, 8.6, -29.5); scene.add(obj17);
        var obj18 = modeloBaranda.clone(); obj18.scale.set(6, 5.5, 1.3); obj18.position.set(-87, 8.6, -117.5); obj18.rotation.set(0, Math.PI / 5, 0); scene.add(obj18);
    });

    cargarModeloSeguro("assets/barandasplaza.glb", function(modelobaranda) {
        var grupoBarandas = new THREE.Group();
        var obj30 = modelobaranda.clone(); obj30.scale.set(6, 5.5, 1.6); obj30.position.set(-65, 8.6, -57); obj30.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj30);
        var obj31 = modelobaranda.clone(); obj31.scale.set(6, 5.5, 1.5); obj31.position.set(-71, 8.6, -57); grupoBarandas.add(obj31);
        var obj32 = modelobaranda.clone(); obj32.scale.set(6, 5.5, 3.3); obj32.position.set(-65, 8.6, -57); grupoBarandas.add(obj32);
        var obj33 = modelobaranda.clone(); obj33.scale.set(6, 5.5, 3.5); obj33.position.set(-71, 8.6, -63); obj33.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj33);
        var obj34 = modelobaranda.clone(); obj34.scale.set(6, 5.5, 1.5); obj34.position.set(-84, 8.6, -57); grupoBarandas.add(obj34);
        var obj35 = modelobaranda.clone(); obj35.scale.set(6, 5.5, 3.5); obj35.position.set(-71, 8.6, -86); obj35.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj35);
        var obj36 = modelobaranda.clone(); obj36.scale.set(6, 5.5, 1.5); obj36.position.set(-84, 8.6, -86); grupoBarandas.add(obj36);
        var obj37 = modelobaranda.clone(); obj37.scale.set(6, 5.5, 1.6); obj37.position.set(-65, 8.6, -91); obj37.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj37);
        var obj38 = modelobaranda.clone(); obj38.scale.set(6, 5.5, 1.5); obj38.position.set(-71, 8.6, -86); grupoBarandas.add(obj38);
        var obj39 = modelobaranda.clone(); obj39.scale.set(6, 5.5, 9); obj39.position.set(-87, 8.6, -57); obj39.rotation.set(0, -Math.PI / -30, 0); grupoBarandas.add(obj39);
        var obj40 = modelobaranda.clone(); obj40.scale.set(6, 5.5, 1.5); obj40.position.set(-65, 8.6, -69); obj40.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj40);
        var obj41 = modelobaranda.clone(); obj41.scale.set(6, 5.5, 1.5); obj41.position.set(-65, 8.6, -82); obj41.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj41);
        var obj42 = modelobaranda.clone(); obj42.scale.set(6, 5.5, 3.5); obj42.position.set(-71, 8.6, -69); grupoBarandas.add(obj42);
        var obj43 = modelobaranda.clone(); obj43.scale.set(6, 5.5, 2.5); obj43.position.set(-65, 8.6, -82); grupoBarandas.add(obj43);
        var obj44 = modelobaranda.clone(); obj44.scale.set(6, 5.5, 1.8); obj44.position.set(-84, 8.6, -91); obj44.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj44);
        var obj45 = modelobaranda.clone(); obj45.scale.set(6, 5.5, 0.8); obj45.position.set(-84, 8.6, -57); obj45.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj45);
        var obj46 = modelobaranda.clone(); obj46.scale.set(6, 5.5, 9); obj46.position.set(-97, 8.6, -57); obj46.rotation.set(0, -Math.PI / -30, 0); grupoBarandas.add(obj46);
        var obj47 = modelobaranda.clone(); obj47.scale.set(6, 5.5, 1.8); obj47.position.set(-97.5, 8.6, -57); obj47.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj47);
        var obj48 = modelobaranda.clone(); obj48.scale.set(6, 5.5, 1.5); obj48.position.set(-104.5, 8.6, -57); grupoBarandas.add(obj48);
        var obj49 = modelobaranda.clone(); obj49.scale.set(6, 5.5, 1.5); obj49.position.set(-117.5, 8.6, -57); grupoBarandas.add(obj49);
        var obj50 = modelobaranda.clone(); obj50.scale.set(6, 5.5, 3.5); obj50.position.set(-104.5, 8.6, -63); obj50.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj50);
        var obj51 = modelobaranda.clone(); obj51.scale.set(6, 5.5, 1.8); obj51.position.set(-117.5, 8.6, -57); obj51.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj51);
        var obj52 = modelobaranda.clone(); obj52.scale.set(6, 5.5, 9); obj52.position.set(-124, 8.6, -57); obj52.rotation.set(0, -Math.PI / -30, 0); grupoBarandas.add(obj52);
        var obj53 = modelobaranda.clone(); obj53.scale.set(6, 5.5, 3.5); obj53.position.set(-108, 8.6, -85); obj53.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj53);
        var obj54 = modelobaranda.clone(); obj54.scale.set(6, 5.5, 1.8); obj54.position.set(-121, 8.6, -90.5); obj54.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj54);
        var obj55 = modelobaranda.clone(); obj55.scale.set(6, 5.5, 1.5); obj55.position.set(-121, 8.6, -85); grupoBarandas.add(obj55);
        var obj56 = modelobaranda.clone(); obj56.scale.set(6, 5.5, 1.5); obj56.position.set(-108, 8.6, -85); grupoBarandas.add(obj56);
        var obj57 = modelobaranda.clone(); obj57.scale.set(6, 5.5, 1.8); obj57.position.set(-101, 8.6, -90.5); obj57.rotation.set(0, Math.PI / 2, 0); grupoBarandas.add(obj57);
        scene.add(grupoBarandas);

        var grupoBarandasCopia1 = new THREE.Group();
        var c1_30 = modelobaranda.clone(); c1_30.scale.set(6, 5.5, 1.6); c1_30.position.set(-65, 8.6, -57); c1_30.rotation.set(0, Math.PI / 2, 0); grupoBarandasCopia1.add(c1_30);
        var c1_31 = modelobaranda.clone(); c1_31.scale.set(6, 5.5, 1.5); c1_31.position.set(-71, 8.6, -57); grupoBarandasCopia1.add(c1_31);
        var c1_32 = modelobaranda.clone(); c1_32.scale.set(6, 5.5, 3.3); c1_32.position.set(-65, 8.6, -57); grupoBarandasCopia1.add(c1_32);
        var c1_33 = modelobaranda.clone(); c1_33.scale.set(6, 5.5, 3.5); c1_33.position.set(-71, 8.6, -63); c1_33.rotation.set(0, Math.PI / 2, 0); grupoBarandasCopia1.add(c1_33);
        var c1_34 = modelobaranda.clone(); c1_34.scale.set(6, 5.5, 1.5); c1_34.position.set(-84, 8.6, -57); grupoBarandasCopia1.add(c1_34);
        var c1_35 = modelobaranda.clone(); c1_35.scale.set(6, 5.5, 3.5); c1_35.position.set(-71, 8.6, -86); c1_35.rotation.set(0, Math.PI / 2, 0); grupoBarandasCopia1.add(c1_35);
        var c1_36 = modelobaranda.clone(); c1_36.scale.set(6, 5.5, 1.5); c1_36.position.set(-84, 8.6, -86); grupoBarandasCopia1.add(c1_36);
        var c1_37 = modelobaranda.clone(); c1_37.scale.set(6, 5.5, 1.6); c1_37.position.set(-65, 8.6, -91); c1_37.rotation.set(0, Math.PI / 2, 0); grupoBarandasCopia1.add(c1_37);
        var c1_38 = modelobaranda.clone(); c1_38.scale.set(6, 5.5, 1.5); c1_38.position.set(-71, 8.6, -86); grupoBarandasCopia1.add(c1_38);
        var c1_39 = modelobaranda.clone(); c1_39.scale.set(6, 5.5, 8);   c1_39.position.set(-90, 8.6, -61); c1_39.rotation.set(0, -Math.PI / 30, 0); grupoBarandasCopia1.add(c1_39);
        var c1_40 = modelobaranda.clone(); c1_40.scale.set(6, 5.5, 1.5); c1_40.position.set(-65, 8.6, -69); c1_40.rotation.set(0, Math.PI / 2, 0); grupoBarandasCopia1.add(c1_40);
        var c1_41 = modelobaranda.clone(); c1_41.scale.set(6, 5.5, 1.5); c1_41.position.set(-65, 8.6, -82); c1_41.rotation.set(0, Math.PI / 2, 0); grupoBarandasCopia1.add(c1_41);
        var c1_42 = modelobaranda.clone(); c1_42.scale.set(6, 5.5, 3.5); c1_42.position.set(-71, 8.6, -69); grupoBarandasCopia1.add(c1_42);
        var c1_43 = modelobaranda.clone(); c1_43.scale.set(6, 5.5, 2.5); c1_43.position.set(-65, 8.6, -82); grupoBarandasCopia1.add(c1_43);
        var c1_44 = modelobaranda.clone(); c1_44.scale.set(6, 5.5, 0.8); c1_44.position.set(-84, 8.6, -91); c1_44.rotation.set(0, Math.PI / 2, 0); grupoBarandasCopia1.add(c1_44);
        var c1_45 = modelobaranda.clone(); c1_45.scale.set(6, 5.5, 0.8); c1_45.position.set(-84, 8.6, -57); c1_45.rotation.set(0, Math.PI / 2, 0); grupoBarandasCopia1.add(c1_45);
        var c1_46 = modelobaranda.clone(); c1_46.scale.set(6, 5.5, 9);   c1_46.position.set(-101, 8.6, -57); c1_46.rotation.set(0, -Math.PI / 30, 0); grupoBarandasCopia1.add(c1_46);
        var c1_47 = modelobaranda.clone(); c1_47.scale.set(6, 5.5, 1.2); c1_47.position.set(-100.5, 8.6, -57); c1_47.rotation.set(0, Math.PI / 2, 0); grupoBarandasCopia1.add(c1_47);
        var c1_48 = modelobaranda.clone(); c1_48.scale.set(6, 5.5, 1.5); c1_48.position.set(-105.5, 8.6, -57); grupoBarandasCopia1.add(c1_48);
        var c1_49 = modelobaranda.clone(); c1_49.scale.set(6, 5.5, 1.5); c1_49.position.set(-118.5, 8.6, -57); grupoBarandasCopia1.add(c1_49);
        var c1_50 = modelobaranda.clone(); c1_50.scale.set(6, 5.5, 3.5); c1_50.position.set(-105.5, 8.6, -63); c1_50.rotation.set(0, Math.PI / 2, 0); grupoBarandasCopia1.add(c1_50);
        var c1_51 = modelobaranda.clone(); c1_51.scale.set(6, 5.5, 1.3); c1_51.position.set(-118.5, 8.6, -57); c1_51.rotation.set(0, Math.PI / 2, 0); grupoBarandasCopia1.add(c1_51);
        var c1_52 = modelobaranda.clone(); c1_52.scale.set(6, 5.5, 9);   c1_52.position.set(-123.5, 8.6, -57); c1_52.rotation.set(0, -Math.PI / -30, 0); grupoBarandasCopia1.add(c1_52);
        var c1_53 = modelobaranda.clone(); c1_53.scale.set(6, 5.5, 3.5); c1_53.position.set(-106, 8.6, -85); c1_53.rotation.set(0, Math.PI / 2, 0); grupoBarandasCopia1.add(c1_53);
        var c1_54 = modelobaranda.clone(); c1_54.scale.set(6, 5.5, 2.3); c1_54.position.set(-119, 8.6, -90.5); c1_54.rotation.set(0, Math.PI / 2, 0); grupoBarandasCopia1.add(c1_54);
        var c1_55 = modelobaranda.clone(); c1_55.scale.set(6, 5.5, 1.5); c1_55.position.set(-119, 8.6, -85); grupoBarandasCopia1.add(c1_55);
        var c1_56 = modelobaranda.clone(); c1_56.scale.set(6, 5.5, 1.5); c1_56.position.set(-106, 8.6, -85); grupoBarandasCopia1.add(c1_56);
        var c1_57 = modelobaranda.clone(); c1_57.scale.set(6, 5.5, 2.2); c1_57.position.set(-98, 8.6, -90.5); c1_57.rotation.set(0, Math.PI / 2, 0); grupoBarandasCopia1.add(c1_57);

        grupoBarandasCopia1.position.set(0, 0, -60); 
        scene.add(grupoBarandasCopia1);
    });

    cargarModeloSeguro("assets/planta1.glb", function(modeloplanta1) {
        var obj18 = modeloplanta1.clone(); obj18.scale.set(7, 7, 7); obj18.position.set(-83, 7.5, -70);  scene.add(obj18);
        var obj19 = modeloplanta1.clone(); obj19.scale.set(7, 7, 7); obj19.position.set(-105, 7.5, -70);  scene.add(obj19);
        var obj20 = modeloplanta1.clone(); obj20.scale.set(7, 7, 7); obj20.position.set(-83, 7.5, -40);  scene.add(obj20);
        var obj21 = modeloplanta1.clone(); obj21.scale.set(7, 7, 7); obj21.position.set(-74, 7.5,-134);  scene.add(obj21);
        var obj22 = modeloplanta1.clone(); obj22.scale.set(7, 7, 7); obj22.position.set(-103, 7.5,-134);  scene.add(obj22);
        var obj23 = modeloplanta1.clone(); obj23.scale.set(8, 8,8); obj23.position.set(-121, 7.5,-134);  scene.add(obj23);
    });

    cargarModeloSeguro("assets/planta3.glb", function(modeloplanta3) {
        var obj18 = modeloplanta3.clone(); obj18.scale.set(7, 7, 7); obj18.position.set(-83, 7.5, -76.5);  scene.add(obj18);
        var obj19 = modeloplanta3.clone(); obj19.scale.set(7, 7, 7); obj19.position.set(-113, 7.5, -70);  scene.add(obj19);
        var obj20 = modeloplanta3.clone(); obj20.scale.set(7, 7, 7); obj20.position.set(-90, 7.5, -40);  scene.add(obj20);
        var obj21 = modeloplanta3.clone(); obj21.scale.set(7, 7, 7); obj21.position.set(-68, 7.5, -33);  scene.add(obj21);
        var obj22 = modeloplanta3.clone(); obj22.scale.set(7, 7, 7); obj22.position.set(-68, 7.5, -42);  scene.add(obj22);
        var obj23 = modeloplanta3.clone(); obj23.scale.set(7, 7, 7); obj23.position.set(-68, 7.5, 17);  scene.add(obj23);
        var obj24 = modeloplanta3.clone(); obj24.scale.set(7, 7, 7); obj24.position.set(-68, 7.5, 25);  scene.add(obj24);
        var obj25 = modeloplanta3.clone(); obj25.scale.set(7, 7, 7); obj25.position.set(-68, 7.5, 7);  scene.add(obj25);
        var obj26 = modeloplanta3.clone(); obj26.scale.set(7, 7, 7); obj26.position.set(-102, 7.5, -146);  scene.add(obj26);
        var obj27 = modeloplanta3.clone(); obj27.scale.set(7, 7, 7); obj27.position.set(-68, 7.5, -120);  scene.add(obj27);
    });

    cargarModeloSeguro("assets/otroarbolito.glb", function(modeloarbolito2) {
        var obj18 = modeloarbolito2.clone(); obj18.scale.set(2, 2, 2); obj18.position.set(-70, 7.5, -63);  scene.add(obj18);
        var obj19 = modeloarbolito2.clone(); obj19.scale.set(2, 2, 2); obj19.position.set(-100, 7.5, -64);  scene.add(obj19);
        var obj20 = modeloarbolito2.clone(); obj20.scale.set(4, 4, 4); obj20.position.set(-140, 7.5, -25);  scene.add(obj20);
        var obj21 = modeloarbolito2.clone(); obj21.scale.set(2, 2, 2); obj21.position.set(-85, 7.5, 10);  scene.add(obj21);
        var obj22 = modeloarbolito2.clone(); obj22.scale.set(1.8, 1.8, 1.8); obj22.position.set(-68, 7.5, -124);  scene.add(obj22);
        var obj23 = modeloarbolito2.clone(); obj23.scale.set(1.8, 1.8, 1.8); obj23.position.set(-103, 7.5, -122);  scene.add(obj23);
    });

    cargarModeloSeguro("assets/otroarbolito1.glb", function(modeloarbolito3) {
        var obj18 = modeloarbolito3.clone(); obj18.scale.set(0.05, 0.05, 0.05); obj18.position.set(-75, 7.5, -83);  scene.add(obj18);
        var obj19 = modeloarbolito3.clone(); obj19.scale.set(0.05, 0.05, 0.05); obj19.position.set(-104, 7.5, -78);  scene.add(obj19);
        var obj20 = modeloarbolito3.clone(); obj20.scale.set(0.05, 0.05, 0.05); obj20.position.set(-140, 7.5, -18);  scene.add(obj20);
        var obj21 = modeloarbolito3.clone(); obj21.scale.set(0.05, 0.05, 0.05); obj21.position.set(-80, 7.5,15);  scene.add(obj21);
        var obj22 = modeloarbolito3.clone(); obj22.scale.set(0.05, 0.05, 0.05); obj22.position.set(-74, 7.5,-128);  scene.add(obj22);
    });

    cargarModeloSeguro("assets/fuente.glb", function(modelofuente) {
        modelofuente.scale.set(15, 15, 15);
        var pilar22 = modelofuente.clone(); pilar22.position.set(-114, 7, -104); pilar22.rotation.y = Math.PI/2; scene.add(pilar22);
    });

    cargarModeloSeguro("assets/arbol1.glb", function(modeloarbol1) {
        modeloarbol1.scale.set(600, 600, 600);
        var pilar22 = modeloarbol1.clone(); pilar22.position.set(-103, 5, -82); scene.add(pilar22);
        var pilar23 = modeloarbol1.clone(); pilar23.position.set(-123, 5, -82); scene.add(pilar23);
        var pilar24 = modeloarbol1.clone(); pilar24.position.set(-85, 5, -145); scene.add(pilar24);
        var pilar25 = modeloarbol1.clone(); pilar25.position.set(-121, 5, -120); scene.add(pilar25);
    });

    cargarModeloSeguro("assets/reloj.glb", function(modeloreloj) {
        modeloreloj.scale.set(19, 19, 19);
        var pilar22 = modeloreloj.clone(); pilar22.position.set(-68, 8, -147); pilar22.rotation.y = Math.PI/2; scene.add(pilar22);
    });

    cargarModeloSeguro("assets/plantarecta.glb", function(modeloplantarecta) {
        var obj18 = modeloplantarecta.clone(); obj18.scale.set(10, 10, 10); obj18.position.set(-83, 7.5, -135);  scene.add(obj18);
        var obj19 = modeloplantarecta.clone(); obj19.scale.set(12, 12, 12); obj19.position.set(-112, 7.5, -136);  scene.add(obj19);
        var obj20 = modeloplantarecta.clone(); obj20.scale.set(13, 13, 13); obj20.position.set(-140, 7.5, -8);  scene.add(obj20);
        var obj21 = modeloplantarecta.clone(); obj21.scale.set(14, 14, 14); obj21.position.set(-120, 7.5,19);  scene.add(obj21);
    });

    cargarModeloSeguro("assets/llantamaseta.glb", function(modelomaseta) {
        var obj18 = modelomaseta.clone(); obj18.scale.set(7, 7, 7); obj18.position.set(-80, 7.5, 23);  scene.add(obj18);
        var obj19 = modelomaseta.clone(); obj19.scale.set(7, 7, 7); obj19.position.set(-118, 7.5, -40);  scene.add(obj19);
        var obj20 = modelomaseta.clone(); obj20.scale.set(6, 6, 6); obj20.position.set(-86, 7.5, -33.5);  scene.add(obj20);
    });

    cargarModeloSeguro("assets/otromasetallanta.glb", function(modelomasetaotro) {
        var obj18 = modelomasetaotro.clone(); obj18.scale.set(7, 7, 7); obj18.position.set(-88, 7.5, 20);  scene.add(obj18);
        var obj19 = modelomasetaotro.clone(); obj19.scale.set(7, 7, 7); obj19.position.set(-138, 7.5, -35);  scene.add(obj19);
    });

    cargarModeloSeguro("assets/barandadorada.glb", function(modelodorado) {
        modelodorado.scale.set(18, 11, 11);
        var pilar22 = modelodorado.clone(); pilar22.position.set(-142, 14, -67); pilar22.rotation.y = Math.PI/2; scene.add(pilar22);
        var pilar23 = modelodorado.clone(); pilar23.position.set(-142, 14, -80); pilar23.rotation.y = Math.PI/2; scene.add(pilar23);
        var pilar24 = modelodorado.clone(); pilar24.position.set(-142, 14, -93); pilar24.rotation.y = Math.PI/2; scene.add(pilar24);
        var pilar25 = modelodorado.clone(); pilar25.position.set(-142, 14, -106); pilar25.rotation.y = Math.PI/2; scene.add(pilar25);
        var pilar26 = modelodorado.clone(); pilar26.position.set(-142, 14, -119); pilar26.rotation.y = Math.PI/2; scene.add(pilar26);
        var pilar27 = modelodorado.clone(); pilar27.position.set(-142, 14, -132); pilar27.rotation.y = Math.PI/2; scene.add(pilar27);
        var pilar28 = modelodorado.clone(); pilar28.position.set(-142, 14, -145); pilar28.rotation.y = Math.PI/2; scene.add(pilar28);
    });

    cargarModeloSeguro("assets/muro.glb", function(modelomuro) {
        modelomuro.scale.set(30, 22, 10);
        var pilar22 = modelomuro.clone(); pilar22.position.set(103, 0, -125); pilar22.rotation.y = Math.PI/2; scene.add(pilar22);
        var pilar23 = modelomuro.clone(); pilar23.position.set(103, 0, -153); pilar23.rotation.y = Math.PI/2; scene.add(pilar23);
        var pilar24 = modelomuro.clone(); pilar24.position.set(103, 0, -181); pilar24.rotation.y = Math.PI/2; scene.add(pilar24);
    });

    cargarModeloSeguro("assets/puertasiglo.glb", function(modelopuerta) {
        modelopuerta.scale.set(35, 43, 25);
        var pilar22 = modelopuerta.clone(); pilar22.position.set(101.5, 2, 0);pilar22.rotation.y = -Math.PI / 2;  scene.add(pilar22);
    });

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if(controles) controles.update();
    
    marcadores.forEach(function(marcador) {
        if (marcador.elemento && camera) {
            var vec = marcador.posicion.clone();
            vec.project(camera); 
            if (vec.z < 1) { 
                var x = (vec.x * 0.5 + 0.5) * window.innerWidth;
                var y = (vec.y * -0.5 + 0.5) * window.innerHeight;
                marcador.elemento.style.left = x + 'px';
                marcador.elemento.style.top = y + 'px';
                marcador.elemento.style.display = 'block'; 
            } else {
                marcador.elemento.style.display = 'none'; 
            }
        }
    });

    if(renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

window.addEventListener('click', function() {
    if (sound && !sound.isPlaying && sound.buffer) {
        sound.play();
    }
}, { once: true });

init();
animate();