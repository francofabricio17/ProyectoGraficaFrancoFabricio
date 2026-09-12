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
        
        if (typeof window.iniciarHistoriaApp === 'function') {
            window.iniciarHistoriaApp();
        }
    };

    // ====================================================
    // AUDIO
    // ====================================================
    var listener = new THREE.AudioListener();
    camera.add(listener);
    
    sound = new THREE.Audio(listener);
    var audioLoader = new THREE.AudioLoader(manager);
    audioLoader.load('assets/mieros.mp3', function(buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.3);
    });
    
    // ====================================================
    // OPTIMIZACIÓN 1: PIXEL RATIO DINÁMICO
    // ====================================================
    // Reemplaza esto:
// renderer = new THREE.WebGLRenderer({ antialias: true });

// Por esto:
renderer = new THREE.WebGLRenderer({ 
    antialias: false, 
    powerPreference: "high-performance",
    failIfMajorPerformanceCaveat: false
});
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Limita el ratio en celulares para ahorrar muchísima batería y recursos
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1 : 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0; 
    renderer.outputColorSpace = THREE.SRGBColorSpace; 
    
    // ====================================================
    // OPTIMIZACIÓN 2: REDUCCIÓN DE SOMBRAS
    // ====================================================
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
    // Mapas de sombra reducidos a 256 para liberar RAM de video
    directionalLight.shadow.mapSize.width = 256; 
    directionalLight.shadow.mapSize.height = 256;
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

    const textureLoader = new THREE.TextureLoader(manager);
    textureLoader.load("imagenes/cielo.jpg", function (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
    });
    
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
    
    // Función segura para cargar modelos
    function cargarModeloSeguro(url, callbackExito) {
        cargar.load(url, function(gltf) {
            callbackExito(gltf.scene);
        }, undefined, function(error) {
            console.log("Error en modelo: " + url, error);
        });
    }

    // ====================================================
    // OPTIMIZACIÓN 3: FUNCIÓN MÁGICA PARA INSTANCED MESH
    // Convierte miles de clones en un solo Draw Call
    // ====================================================
    function crearInstancias(gltfScene, instanciasData, scene, castShadow = true) {
        var dummy = new THREE.Object3D();
        gltfScene.traverse(function(child) {
            if (child.isMesh) {
                var instancedMesh = new THREE.InstancedMesh(child.geometry, child.material, instanciasData.length);
                instancedMesh.castShadow = castShadow;
                instancedMesh.receiveShadow = true;
                
                instanciasData.forEach(function(data, i) {
                    dummy.position.set(data.pos[0], data.pos[1], data.pos[2]);
                    
                    if (data.rot) dummy.rotation.set(data.rot[0], data.rot[1], data.rot[2]);
                    else dummy.rotation.set(0, 0, 0);
                    
                    if (data.scale) {
                        if (Array.isArray(data.scale)) dummy.scale.set(data.scale[0], data.scale[1], data.scale[2]);
                        else dummy.scale.set(data.scale, data.scale, data.scale);
                    } else {
                        dummy.scale.set(1, 1, 1);
                    }
                    
                    dummy.updateMatrix();
                    var finalMatrix = new THREE.Matrix4();
                    finalMatrix.multiplyMatrices(dummy.matrix, child.matrix);
                    
                    instancedMesh.setMatrixAt(i, finalMatrix);
                });
                instancedMesh.instanceMatrix.needsUpdate = true;
                scene.add(instancedMesh);
            }
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
                if(obj.material && obj.material.map) {
                    obj.material.needsUpdate = true;
                    obj.material.map.generateMipmaps = true;
                    obj.material.map.minFilter = THREE.LinearMipmapLinearFilter;
                    obj.material.map.magFilter = THREE.LinearFilter;
                    obj.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                }
            }
        });
        
        scene.add(plaza);
        var box = new THREE.Box3().setFromObject(plaza);
        var center = box.getCenter(new THREE.Vector3());
        controles.target.copy(center);
        camera.position.set(center.x + 2800, center.y + 470, center.z - 1800);
        camera.lookAt(center);
        controles.update();
    }, undefined, function(error) {
        console.log("Error cargando piso.glb:", error);
    });

    // 2. Pedestales y Monumentos Únicos
    cargarModeloSeguro("assets/Pedestalirineo.glb", function(est) { est.scale.set(3.5, 3.5, 3.5); est.position.set(-73, 3.5, 22); scene.add(est); });
    cargarModeloSeguro("assets/Pedestalfederico.glb", function(est) { est.scale.set(3.5, 3.5, 3.5); est.position.set(-73, 3.3, 11); scene.add(est); });
    cargarModeloSeguro("assets/Pedestalescobar.glb", function(est) { est.scale.set(3.5, 3.5, 3.5); est.position.set(-74, 3.5, -38); scene.add(est); });
    cargarModeloSeguro("assets/Palliri.glb", function(est) { est.scale.set(4, 4, 4); est.position.set(-78, 11, -74); est.rotation.set(0, Math.PI / 2, 0); scene.add(est); });
    cargarModeloSeguro("assets/completomina.glb", function(est) { est.scale.set(10, 10, 10); est.position.set(-111.5, 19, -13); est.rotation.set(0, Math.PI / 2, 0); scene.add(est); });
    
    // ====================================================
    // MODELOS REPETIDOS OPTIMIZADOS (InstancedMesh)
    // ====================================================

    // 3. Postes
    cargarModeloSeguro("assets/poste.glb", function(m) {
        crearInstancias(m, [
            { pos: [-52, 7, 30], scale: 8.5 }, { pos: [-52, 7, -5], scale: 8.5 }, { pos: [-52, 7, -35], scale: 8.5 },
            { pos: [-52, 7, -65], scale: 8.5 }, { pos: [-52, 7, -95], scale: 8.5 }, { pos: [-25, 1.4, 79], scale: 8.5 },
            { pos: [-89.5, 7, -93.5], scale: 8.5 }, { pos: [-89, 7, -117], scale: 8.5 }, { pos: [-52, 7, -120], scale: 8.5 },
            { pos: [-130, 7, -150], scale: 8.5 }, { pos: [-135, 7, -103], scale: 8.5 }, { pos: [-52, 7, -150], scale: 8.5 }
        ], scene);
    });

    // 4. Bancas Verdes
    cargarModeloSeguro("assets/bancaverde.glb", function(m) {
        crearInstancias(m, [
            { pos: [-77.5, 8, -60], scale: [11, 11, 10] },
            { pos: [-77.5, 8, -88.5], scale: [11, 11, 10], rot: [0, Math.PI, 0] },
            { pos: [-68, 8, -75.5], scale: [11, 11, 10], rot: [0, Math.PI / 2, 0] },
            { pos: [-111, 8, -60], scale: [11, 11, 10] },
            { pos: [-114.5, 8, -88.5], scale: [11, 11, 10], rot: [0, Math.PI, 0] },
            { pos: [-112, 8, -120], scale: [11, 11, 10] },
            { pos: [-112.5, 8, -148], scale: [11, 11, 10], rot: [0, Math.PI, 0] },
            { pos: [-77.5, 8, -148], scale: [11, 11, 10], rot: [0, Math.PI, 0] },
            { pos: [-77.5, 8, -119], scale: [11, 11, 10] },
            { pos: [-68, 8, -134.5], scale: [11, 11, 10], rot: [0, Math.PI / 2, 0] }
        ], scene);
    });

    // 5. Pilares (Agrupados)
    cargarModeloSeguro("assets/pilar.glb", function(m) {
        crearInstancias(m, [
            { pos: [-105, 10.5, 0.5], scale: [9, 12, 12], rot: [0, Math.PI/2, 0] },
            { pos: [-116.9, 10.5, 0.5], scale: [9, 12, 12], rot: [0, Math.PI/2, 0] },
            { pos: [-121.5, 10.5, -22], scale: [9, 12, 12] },
            { pos: [-121.5, 10.5, -13], scale: [9, 12, 12] },
            { pos: [-121.5, 10.5, -4], scale: [9, 12, 12] },
            { pos: [-100.5, 10.5, -22], scale: [9, 12, 12] },
            { pos: [-100.5, 10.5, -13], scale: [9, 12, 12] },
            { pos: [-100.5, 10.5, -4], scale: [9, 12, 12] }
        ], scene);
    });

    // 6. Sillas de Goma
    cargarModeloSeguro("assets/sillagoma.glb", function(m) {
        crearInstancias(m, [
            { pos: [-61.5, 7, 23], scale: [6, 6.5, 6], rot: [0, Math.PI, 0] },
            { pos: [-61.5, 7, 10], scale: [6, 6.5, 6], rot: [0, Math.PI, 0] },
            { pos: [-61.5, 7, -33], scale: [6, 6.5, 6], rot: [0, Math.PI, 0] },
            { pos: [-61.5, 7, -42], scale: [6, 6.5, 6], rot: [0, Math.PI, 0] },
            { pos: [-61.5, 7, -63], scale: [6, 6.5, 6], rot: [0, Math.PI, 0] },
            { pos: [-61.5, 7, -87], scale: [6, 6.5, 6], rot: [0, Math.PI, 0] }
        ], scene);
    });

    // 7. VEGETACIÓN (Se les apaga el "castShadow" enviando "false" al final)
    cargarModeloSeguro("assets/arbol.glb", function(m) {
        crearInstancias(m, [
            { pos: [-105, 8, 20], scale: 35 }, { pos: [-105, 8, -38], scale: 35 }, { pos: [-128, 8, -38], scale: 35 }
        ], scene, false); 
    });

    cargarModeloSeguro("assets/planta.glb", function(m) {
        crearInstancias(m, [
            { pos: [-85, 7, -82], scale: [6, 7, 6] }, { pos: [-120, 7, -70], scale: [6, 7, 6] }, { pos: [-123, 7.5, -147], scale: 8 }
        ], scene, false);
    });
    
    cargarModeloSeguro("assets/planta1.glb", function(m) {
        crearInstancias(m, [
            { pos: [-83, 7.5, -70], scale: 7 }, { pos: [-105, 7.5, -70], scale: 7 }, { pos: [-83, 7.5, -40], scale: 7 },
            { pos: [-74, 7.5, -134], scale: 7 }, { pos: [-103, 7.5, -134], scale: 7 }, { pos: [-121, 7.5, -134], scale: 8 }
        ], scene, false);
    });

    cargarModeloSeguro("assets/planta3.glb", function(m) {
        crearInstancias(m, [
            { pos: [-83, 7.5, -76.5], scale: 7 }, { pos: [-113, 7.5, -70], scale: 7 }, { pos: [-90, 7.5, -40], scale: 7 },
            { pos: [-68, 7.5, -33], scale: 7 }, { pos: [-68, 7.5, -42], scale: 7 }, { pos: [-68, 7.5, 17], scale: 7 },
            { pos: [-68, 7.5, 25], scale: 7 }, { pos: [-68, 7.5, 7], scale: 7 }, { pos: [-102, 7.5, -146], scale: 7 },
            { pos: [-68, 7.5, -120], scale: 7 }
        ], scene, false);
    });

    cargarModeloSeguro("assets/otroarbolito.glb", function(m) {
        crearInstancias(m, [
            { pos: [-70, 7.5, -63], scale: 2 }, { pos: [-100, 7.5, -64], scale: 2 }, { pos: [-140, 7.5, -25], scale: 4 },
            { pos: [-85, 7.5, 10], scale: 2 }, { pos: [-68, 7.5, -124], scale: 1.8 }, { pos: [-103, 7.5, -122], scale: 1.8 }
        ], scene, false);
    });

    cargarModeloSeguro("assets/otroarbolito1.glb", function(m) {
        crearInstancias(m, [
            { pos: [-75, 7.5, -83], scale: 0.05 }, { pos: [-104, 7.5, -78], scale: 0.05 }, { pos: [-140, 7.5, -18], scale: 0.05 },
            { pos: [-80, 7.5, 15], scale: 0.05 }, { pos: [-74, 7.5, -128], scale: 0.05 }
        ], scene, false);
    });

    cargarModeloSeguro("assets/plantarecta.glb", function(m) {
        crearInstancias(m, [
            { pos: [-83, 7.5, -135], scale: 10 }, { pos: [-112, 7.5, -136], scale: 12 }, 
            { pos: [-140, 7.5, -8], scale: 13 }, { pos: [-120, 7.5, 19], scale: 14 }
        ], scene, false);
    });
    
    cargarModeloSeguro("assets/arbol1.glb", function(m) {
        crearInstancias(m, [
            { pos: [-103, 5, -82], scale: 600 }, { pos: [-123, 5, -82], scale: 600 },
            { pos: [-85, 5, -145], scale: 600 }, { pos: [-121, 5, -120], scale: 600 }
        ], scene, false);
    });

    // 8. Macetas
    cargarModeloSeguro("assets/llantamaseta.glb", function(m) {
        crearInstancias(m, [
            { pos: [-80, 7.5, 23], scale: 7 }, { pos: [-118, 7.5, -40], scale: 7 }, { pos: [-86, 7.5, -33.5], scale: 6 }
        ], scene);
    });

    cargarModeloSeguro("assets/otromasetallanta.glb", function(m) {
        crearInstancias(m, [ { pos: [-88, 7.5, 20], scale: 7 }, { pos: [-138, 7.5, -35], scale: 7 } ], scene);
    });

    // 9. BARANDAS (¡Agrupadas todas juntas para máxima fluidez!)
    cargarModeloSeguro("assets/barandasplaza.glb", function(m) {
        var pi2 = Math.PI / 2;
        crearInstancias(m, [
            // Sueltas
            { pos: [-65, 8.6, 30], scale: [6, 7, 8.5], rot: [0, pi2, 0] }, { pos: [-96.3, 8.6, 30], scale: [6, 7, 8.5], rot: [0, pi2, 0] },
            { pos: [-65, 8.6, 30], scale: [6, 7, 7.5] }, { pos: [-65, 8.6, 2], scale: [6, 7, 6], rot: [0, pi2, 0] },
            { pos: [-87, 8.6, 1], scale: [6, 7, 8] }, { pos: [-65, 8.6, -29.5], scale: [6, 7, 6], rot: [0, pi2, 0] },
            { pos: [-65, 8.6, -45], scale: [6, 7, 8.5], rot: [0, pi2, 0] }, { pos: [-96.3, 8.6, -45], scale: [6, 7, 8.5], rot: [0, pi2, 0] },
            { pos: [-65, 8.6, -29.5], scale: [6, 7, 4.2] }, { pos: [-87, 8.6, -117.5], scale: [6, 5.5, 1.3], rot: [0, Math.PI/5, 0] },
            
            // Grupo principal
            { pos: [-65, 8.6, -57], scale: [6, 5.5, 1.6], rot: [0, pi2, 0] }, { pos: [-71, 8.6, -57], scale: [6, 5.5, 1.5] },
            { pos: [-65, 8.6, -57], scale: [6, 5.5, 3.3] }, { pos: [-71, 8.6, -63], scale: [6, 5.5, 3.5], rot: [0, pi2, 0] },
            { pos: [-84, 8.6, -57], scale: [6, 5.5, 1.5] }, { pos: [-71, 8.6, -86], scale: [6, 5.5, 3.5], rot: [0, pi2, 0] },
            { pos: [-84, 8.6, -86], scale: [6, 5.5, 1.5] }, { pos: [-65, 8.6, -91], scale: [6, 5.5, 1.6], rot: [0, pi2, 0] },
            { pos: [-71, 8.6, -86], scale: [6, 5.5, 1.5] }, { pos: [-87, 8.6, -57], scale: [6, 5.5, 9], rot: [0, Math.PI/30, 0] },
            { pos: [-65, 8.6, -69], scale: [6, 5.5, 1.5], rot: [0, pi2, 0] }, { pos: [-65, 8.6, -82], scale: [6, 5.5, 1.5], rot: [0, pi2, 0] },
            { pos: [-71, 8.6, -69], scale: [6, 5.5, 3.5] }, { pos: [-65, 8.6, -82], scale: [6, 5.5, 2.5] },
            { pos: [-84, 8.6, -91], scale: [6, 5.5, 1.8], rot: [0, pi2, 0] }, { pos: [-84, 8.6, -57], scale: [6, 5.5, 0.8], rot: [0, pi2, 0] },
            { pos: [-97, 8.6, -57], scale: [6, 5.5, 9], rot: [0, Math.PI/30, 0] }, { pos: [-97.5, 8.6, -57], scale: [6, 5.5, 1.8], rot: [0, pi2, 0] },
            { pos: [-104.5, 8.6, -57], scale: [6, 5.5, 1.5] }, { pos: [-117.5, 8.6, -57], scale: [6, 5.5, 1.5] },
            { pos: [-104.5, 8.6, -63], scale: [6, 5.5, 3.5], rot: [0, pi2, 0] }, { pos: [-117.5, 8.6, -57], scale: [6, 5.5, 1.8], rot: [0, pi2, 0] },
            { pos: [-124, 8.6, -57], scale: [6, 5.5, 9], rot: [0, Math.PI/30, 0] }, { pos: [-108, 8.6, -85], scale: [6, 5.5, 3.5], rot: [0, pi2, 0] },
            { pos: [-121, 8.6, -90.5], scale: [6, 5.5, 1.8], rot: [0, pi2, 0] }, { pos: [-121, 8.6, -85], scale: [6, 5.5, 1.5] },
            { pos: [-108, 8.6, -85], scale: [6, 5.5, 1.5] }, { pos: [-101, 8.6, -90.5], scale: [6, 5.5, 1.8], rot: [0, pi2, 0] },

            // Grupo Copia 1 (Calculadas con Z - 60 automáticamente en la data)
            { pos: [-65, 8.6, -117], scale: [6, 5.5, 1.6], rot: [0, pi2, 0] }, { pos: [-71, 8.6, -117], scale: [6, 5.5, 1.5] },
            { pos: [-65, 8.6, -117], scale: [6, 5.5, 3.3] }, { pos: [-71, 8.6, -123], scale: [6, 5.5, 3.5], rot: [0, pi2, 0] },
            { pos: [-84, 8.6, -117], scale: [6, 5.5, 1.5] }, { pos: [-71, 8.6, -146], scale: [6, 5.5, 3.5], rot: [0, pi2, 0] },
            { pos: [-84, 8.6, -146], scale: [6, 5.5, 1.5] }, { pos: [-65, 8.6, -151], scale: [6, 5.5, 1.6], rot: [0, pi2, 0] },
            { pos: [-71, 8.6, -146], scale: [6, 5.5, 1.5] }, { pos: [-90, 8.6, -121], scale: [6, 5.5, 8], rot: [0, -Math.PI/30, 0] },
            { pos: [-65, 8.6, -129], scale: [6, 5.5, 1.5], rot: [0, pi2, 0] }, { pos: [-65, 8.6, -142], scale: [6, 5.5, 1.5], rot: [0, pi2, 0] },
            { pos: [-71, 8.6, -129], scale: [6, 5.5, 3.5] }, { pos: [-65, 8.6, -142], scale: [6, 5.5, 2.5] },
            { pos: [-84, 8.6, -151], scale: [6, 5.5, 0.8], rot: [0, pi2, 0] }, { pos: [-84, 8.6, -117], scale: [6, 5.5, 0.8], rot: [0, pi2, 0] },
            { pos: [-101, 8.6, -117], scale: [6, 5.5, 9], rot: [0, -Math.PI/30, 0] }, { pos: [-100.5, 8.6, -117], scale: [6, 5.5, 1.2], rot: [0, pi2, 0] },
            { pos: [-105.5, 8.6, -117], scale: [6, 5.5, 1.5] }, { pos: [-118.5, 8.6, -117], scale: [6, 5.5, 1.5] },
            { pos: [-105.5, 8.6, -123], scale: [6, 5.5, 3.5], rot: [0, pi2, 0] }, { pos: [-118.5, 8.6, -117], scale: [6, 5.5, 1.3], rot: [0, pi2, 0] },
            { pos: [-123.5, 8.6, -117], scale: [6, 5.5, 9], rot: [0, Math.PI/30, 0] }, { pos: [-106, 8.6, -145], scale: [6, 5.5, 3.5], rot: [0, pi2, 0] },
            { pos: [-119, 8.6, -150.5], scale: [6, 5.5, 2.3], rot: [0, pi2, 0] }, { pos: [-119, 8.6, -145], scale: [6, 5.5, 1.5] },
            { pos: [-106, 8.6, -145], scale: [6, 5.5, 1.5] }, { pos: [-98, 8.6, -150.5], scale: [6, 5.5, 2.2], rot: [0, pi2, 0] }
        ], scene);
    });

    // 10. Barandas Doradas y Muros
    cargarModeloSeguro("assets/barandadorada.glb", function(m) {
        crearInstancias(m, [
            { pos: [-142, 14, -67], scale: [18, 11, 11], rot: [0, Math.PI/2, 0] }, { pos: [-142, 14, -80], scale: [18, 11, 11], rot: [0, Math.PI/2, 0] },
            { pos: [-142, 14, -93], scale: [18, 11, 11], rot: [0, Math.PI/2, 0] }, { pos: [-142, 14, -106], scale: [18, 11, 11], rot: [0, Math.PI/2, 0] },
            { pos: [-142, 14, -119], scale: [18, 11, 11], rot: [0, Math.PI/2, 0] }, { pos: [-142, 14, -132], scale: [18, 11, 11], rot: [0, Math.PI/2, 0] },
            { pos: [-142, 14, -145], scale: [18, 11, 11], rot: [0, Math.PI/2, 0] }
        ], scene);
    });

    cargarModeloSeguro("assets/muro.glb", function(m) {
        crearInstancias(m, [
            { pos: [103, 0, -125], scale: [30, 22, 10], rot: [0, Math.PI/2, 0] }, { pos: [103, 0, -153], scale: [30, 22, 10], rot: [0, Math.PI/2, 0] },
            { pos: [103, 0, -181], scale: [30, 22, 10], rot: [0, Math.PI/2, 0] }
        ], scene);
    });

    // 11. Modelos Únicos
    cargarModeloSeguro("assets/letrasiglo.glb", function(letra) {
        letra.scale.set(24, 24, 24); letra.position.set(-78, 8, -133); letra.rotation.set(0, Math.PI / -2, 0); scene.add(letra);
    });

    cargarModeloSeguro("assets/fuente.glb", function(fuente) {
        fuente.scale.set(15, 15, 15); fuente.position.set(-114, 7, -104); fuente.rotation.y = Math.PI/2; scene.add(fuente);
    });

    cargarModeloSeguro("assets/reloj.glb", function(reloj) {
        reloj.scale.set(19, 19, 19); reloj.position.set(-68, 8, -147); reloj.rotation.y = Math.PI/2; scene.add(reloj);
    });

    cargarModeloSeguro("assets/puertasiglo.glb", function(puerta) {
        puerta.scale.set(35, 43, 25); puerta.position.set(101.5, 2, 0); puerta.rotation.y = -Math.PI / 2; scene.add(puerta);
    });

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Asegurarse de mantener el ratio óptimo al rotar pantallas
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1 : 1.5));
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