var scene;
var camera;
var renderer;
var irineoModel; // Variable unificada para representar el modelo de Irineo
var controles;

function init()
{
    scene = new THREE.Scene();
    
    // 1. FONDO DE AMBIENTE MINERO COMPLEJO (Tonalidades carbón, acero y base terracota)
    const canvasFondo = document.createElement('canvas');
    canvasFondo.width = 1;
    canvasFondo.height = 256;
    const ctx = canvasFondo.getContext('2d');
    const degradado = ctx.createLinearGradient(0, 0, 0, 256);
    
    degradado.addColorStop(0, '#0d0f12');   // Gris muy oscuro (profundidad)
    degradado.addColorStop(0.6, '#1e252b');  // Gris acero / azulado
    degradado.addColorStop(1, '#4a2f13');    // Tono terracota / óxido mineral en la base
    ctx.fillStyle = degradado;
    ctx.fillRect(0, 0, 1, 256);
    
    const texturaCielo = new THREE.CanvasTexture(canvasFondo);
    if (texturaCielo.colorSpace) {
        texturaCielo.colorSpace = THREE.SRGBColorSpace;
    } else if (texturaCielo.encoding) {
        texturaCielo.encoding = THREE.sRGBEncoding;
    }
    scene.background = texturaCielo;

    // 2. PARTÍCULAS EN SUSPENSIÓN (Chispas o polvo de oro mineral flotante)
    const verticesChispas = [];
    for (let i = 0; i < 600; i++) {
        const x = (Math.random() - 0.5) * 60;
        const y = (Math.random() - 0.5) * 50 + 10; 
        const z = (Math.random() - 0.5) * 60 - 20; 
        verticesChispas.push(x, y, z);
    }
    const geomChispas = new THREE.BufferGeometry();
    
    if (geomChispas.setAttribute) {
        geomChispas.setAttribute('position', new THREE.Float32BufferAttribute(verticesChispas, 3));
    } else if (geomChispas.addAttribute) {
        geomChispas.addAttribute('position', new THREE.BufferAttribute(new Float32Array(verticesChispas), 3));
    }
    
    // Material del polvo flotante color cobre/oro
    const matChispas = new THREE.PointsMaterial({
        color: 0xe0a96d,
        size: 0.15, 
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.6
    });
    
    const puntosChispas = new THREE.Points(geomChispas, matChispas);
    scene.add(puntosChispas);

    // 3. Perspectiva de cámara
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 5, 10);
    
    // 4. Renderizador optimizado de Alta Exposición
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4; // Exposición corregida para balancear los tonos oscuros
    
    if (renderer.outputColorSpace) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if (renderer.outputEncoding) {
        renderer.outputEncoding = THREE.sRGBEncoding;
    }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    
    // 5. Controles de Órbita con restricciones
    controles = new THREE.OrbitControls(camera, renderer.domElement);
    controles.enableDamping = true;
    controles.dampingFactor = 0.08;
    controles.enableZoom = true;
    controles.enableRotate = true;
    controles.enablePan = true;
    controles.minDistance = 2;
    controles.maxDistance = 150;
    controles.maxPolarAngle = Math.PI / 2; // Bloquea la cámara para que no atraviese el suelo
    
    // =================================================================
    // 6. ILUMINACIÓN MIXTA AVANZADA POTENCIADA (Específica para Irineo)
    // =================================================================
    
    // Luz ambiental base reforzada para rellenar zonas muertas
    var ambientLight = new THREE.AmbientLight(0x4a433c, 1.4); 
    scene.add(ambientLight);
    
    // Luz de hemisferio con matices azul-acero y suelo mineral
    var hemisphereLight = new THREE.HemisphereLight(0x3a4b5c, 0x241910, 0.9);
    hemisphereLight.position.set(0, 30, 0);
    scene.add(hemisphereLight);
    
    // Luz frontal principal dorada y potente (Estilo reflector)
    var directionalLight = new THREE.DirectionalLight(0xffcc80, 4.5); 
    directionalLight.position.set(15, 25, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048; 
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.bias = -0.001; // Evita imperfecciones de auto-sombreado
    scene.add(directionalLight);
    
    // Luz de contra lateral fría (Aporta silueta y recorta los bordes)
    var directionalLight2 = new THREE.DirectionalLight(0x739cb3, 2.5); 
    directionalLight2.position.set(-20, 15, -15);
    scene.add(directionalLight2);

    // Foco cenital directo cenital
    var spotLight = new THREE.SpotLight(0xffe0b2, 5.0);
    spotLight.position.set(0, 40, 5);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.7; // Difuminado estético del haz de luz
    spotLight.castShadow = true;
    scene.add(spotLight);
    
    // Captura de elementos del Loader HTML
    var loaderContainer = document.getElementById('loader-container');
    var progressBar = document.getElementById('progress-bar');
    var progressText = document.getElementById('progress-text');
    
    // 7. Carga del Modelo .GLB de Irineo
    var cargar = new THREE.GLTFLoader();
    cargar.load("assets/Irineo.glb", 
        function(gltf)
        {
            irineoModel = gltf.scene;
            irineoModel.position.set(0, 0, 0);
            irineoModel.scale.set(5, 5, 5); // Escala del modelo de Irineo
            
            irineoModel.traverse(function(obj)
            {
                if(obj.isMesh)
                {
                    obj.castShadow = true;
                    obj.receiveShadow = true;
                    if(obj.material)
                    {
                        obj.material.needsUpdate = true;
                        obj.material.roughness = 0.4; // Ajuste óptimo para brillos
                        if(obj.material.map)
                        {
                            obj.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                        }
                    }
                }
            });
            scene.add(irineoModel);
            
            // --- DIRECCIONAMIENTO EXCLUSIVO DE LAS LUCES A IRINEO ---
            var box = new THREE.Box3().setFromObject(irineoModel);
            var center = box.getCenter(new THREE.Vector3());
            var size = box.getSize(new THREE.Vector3());
            
            // Enlazamos dinámicamente los objetivos de luz al nuevo modelo
            directionalLight.target = irineoModel;
            spotLight.target = irineoModel;
            
            // Reajustamos la altura de emisión del SpotLight proporcionalmente
            spotLight.position.set(center.x, center.y + size.y * 1.5, center.z + 1);
            
            // Centrado automático dinámico en pantalla y aproximación ideal de cámara
            var alturaBajar = center.y + 1.5;
            
            controles.target.set(center.x, alturaBajar, center.z);
            camera.position.set(center.x, alturaBajar + 3, center.z + 18); 
            controles.update();
            
            // Apagar barra de carga de forma fluida
            setTimeout(function() {
                if (loaderContainer) loaderContainer.classList.add('loaded');
            }, 250);
        },
        function(xhr)
        {
            if (xhr.total > 0) {
                var porcentaje = Math.round((xhr.loaded / xhr.total) * 100);
                if (progressBar) progressBar.style.width = porcentaje + '%';
                if (progressText) progressText.innerText = porcentaje + '%';
            } else {
                if (progressText) progressText.innerText = "Cargando...";
            }
        },
        function(error)
        {
            console.log("Error cargando modelo de Irineo:", error);
            if (progressText) progressText.innerText = "Error de carga";
        }
    );
}

// 8. Ciclo de Animación (Rotación continua en el eje Y)
function animate()
{
    requestAnimationFrame(animate);
    
    if(irineoModel) {
        irineoModel.rotation.y += 0.005; // Velocidad de rotación continua suave
    }

    controles.update();
    renderer.render(scene, camera);
}

// Adaptación responsiva al redimensionar ventana
window.addEventListener("resize", function()
    {
        if(camera) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
        if(renderer) {
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
);

// Arrancar escena
init();
animate();

// --- INYECCIÓN DINÁMICA: ESTILOS DE BOTONES ACERO/MINA ---
const estilosBotones = document.createElement('style');
estilosBotones.innerHTML = `
    button, .interfaz-controles button {
        background: linear-gradient(135deg, #3a444d 0%, #222930 100%); 
        color: #e0dacf; 
        border: 2px solid #222930; 
        border-radius: 8px; 
        padding: 10px 20px;
        font-family: 'Montserrat', sans-serif;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        box-shadow: 0 4px 6px rgba(0,0,0,0.4); 
        position: relative;
        overflow: hidden;
    }
    button:hover {
        background: linear-gradient(135deg, #505c66 0%, #3a444d 100%);
        color: #f4eee1;
        box-shadow: 0 6px 12px rgba(0,0,0,0.6); 
        transform: translateY(-2px); 
    }
    button:active {
        background: linear-gradient(135deg, #191e23 0%, #0f1316 100%);
        transform: translateY(1px); 
        box-shadow: 0 2px 4px rgba(0,0,0,0.4);
    }
`;
document.head.appendChild(estilosBotones);