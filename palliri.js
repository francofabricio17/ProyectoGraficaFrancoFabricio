var scene;
var camera;
var renderer;
var plaza; // Guarda el modelo de tu estatua
var controles;

function init()
{
    scene = new THREE.Scene();
    
    // 1. FONDO DE AMBIENTE MINERO (Tonalidades carbón, acero y fuego de carbón/mineral)
    const canvasFondo = document.createElement('canvas');
    canvasFondo.width = 1;
    canvasFondo.height = 256;
    const ctx = canvasFondo.getContext('2d');
    const degradado = ctx.createLinearGradient(0, 0, 0, 256);
    
    degradado.addColorStop(0, '#0d0f12');   // Gris muy oscuro / casi negro (profundidad de la mina)
    degradado.addColorStop(0.6, '#1e252b');  // Gris acero / azulado en el centro
    degradado.addColorStop(1, '#4a2f13');    // Tono terracota / óxido / mineral en la base
    ctx.fillStyle = degradado;
    ctx.fillRect(0, 0, 1, 256);
    
    const texturaCielo = new THREE.CanvasTexture(canvasFondo);
    if (texturaCielo.colorSpace) {
        texturaCielo.colorSpace = THREE.SRGBColorSpace;
    } else if (texturaCielo.encoding) {
        texturaCielo.encoding = THREE.sRGBEncoding;
    }
    scene.background = texturaCielo;

    // 2. PARTÍCULAS TIPO CHISPAS O POLVO MINERAL
    const verticesChispas = [];
    for (let i = 0; i < 600; i++) {
        const x = (Math.random() - 0.5) * 60;
        const y = (Math.random() - 0.5) * 50 + 10; 
        const z = (Math.random() - 0.5) * 60 - 20; 
        verticesChispas.push(x, y, z);
    }
    const geomChispas = new THREE.BufferGeometry();
    
    // Método compatible con Three.js r108
    geomChispas.addAttribute('position', new THREE.BufferAttribute(new Float32Array(verticesChispas), 3));
    
    // Material de polvo en suspensión o mineral brillante
    const matChispas = new THREE.PointsMaterial({
        color: 0xe0a96d,
        size: 0.15, 
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.6
    });
    
    const puntosChispas = new THREE.Points(geomChispas, matChispas);
    scene.add(puntosChispas);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 5, 10);
    
    // 3. Renderizador optimizado
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4; // Ajustado levemente para mayor claridad en sombras
    
    if (renderer.outputColorSpace) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if (renderer.outputEncoding) {
        renderer.outputEncoding = THREE.sRGBEncoding;
    }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    
    // 4. Controles interactivos de órbita
    controles = new THREE.OrbitControls(camera, renderer.domElement);
    controles.enableDamping = true;
    controles.dampingFactor = 0.08;
    controles.enableZoom = true;
    controles.enableRotate = true;
    controles.enablePan = true;
    controles.minDistance = 2;
    controles.maxDistance = 150;
    controles.maxPolarAngle = Math.PI / 2;
    
    // 5. Iluminación temática minera potenciada
    var ambientLight = new THREE.AmbientLight(0x4a433c, 1.5); // Aumentada luz de relleno ambiental
    scene.add(ambientLight);
    
    var hemisphereLight = new THREE.HemisphereLight(0x3a4b5c, 0x241910, 1.0);
    hemisphereLight.position.set(0, 30, 0);
    scene.add(hemisphereLight);
    
    // Luz principal cálida (Estilo antorcha/linterna)
    var directionalLight = new THREE.DirectionalLight(0xffcc80, 4.5); 
    directionalLight.position.set(20, 25, 25);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048; 
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.bias = -0.001; // Evita artefactos extraños de sombras ("shadow acne")
    scene.add(directionalLight);
    
    // Luz de contra lateral fría (Simula destellos metálicos de la roca o veta)
    var directionalLight2 = new THREE.DirectionalLight(0x739cb3, 2.5); 
    directionalLight2.position.set(-25, 15, -20);
    scene.add(directionalLight2);

    // Foco cenital superior directo
    var spotLight = new THREE.SpotLight(0xffe0b2, 5.0);
    spotLight.position.set(0, 40, 5);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.8; // Suaviza los bordes del cono de luz
    spotLight.castShadow = true;
    scene.add(spotLight);
    
    // Captura de elementos del Loader HTML
    var loaderContainer = document.getElementById('loader-container');
    var progressBar = document.getElementById('progress-bar');
    var progressText = document.getElementById('progress-text');
    
    // 6. Carga del Modelo .GLB de la Palliri
    var cargar = new THREE.GLTFLoader();
    cargar.load("assets/Palliri.glb", 
        function(gltf)
        {
            plaza = gltf.scene;
            plaza.position.set(0, 0, 0);
            plaza.scale.set(4, 4, 4);
            
            plaza.traverse(function(obj)
            {
                if(obj.isMesh)
                {
                    obj.castShadow = true;
                    obj.receiveShadow = true;
                    if(obj.material)
                    {
                        obj.material.needsUpdate = true;
                        
                        // CORRECCIÓN DE OPACIDAD: Fuerza al material a reaccionar ante los reflejos de luz
                        if(obj.material.roughness !== undefined) {
                            obj.material.roughness = Math.min(obj.material.roughness, 0.55);
                        }
                        
                        if(obj.material.map)
                        {
                            obj.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                        }
                    }
                }
            });
            scene.add(plaza);
            
            // --- DIRECCIONAMIENTO DINÁMICO DE LUCES AL MODELO ---
            var box = new THREE.Box3().setFromObject(plaza);
            var center = box.getCenter(new THREE.Vector3());
            var size = box.getSize(new THREE.Vector3());
            
            // Forzamos a que las luces principales apunten directamente al centro de la estatua
            directionalLight.target = plaza;
            spotLight.target = plaza;
            
            // Reajustamos la altura del foco según las dimensiones del modelo cargado
            spotLight.position.set(center.x, center.y + size.y * 1.6, center.z + 1);
            
            controles.target.set(center.x, center.y, center.z);
            camera.position.set(center.x, center.y + size.y * 0.4, center.z + size.z * 2.5);
            controles.update();
            
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
            console.log("Error cargando modelo:", error);
            if (progressText) progressText.innerText = "Error de carga";
        }
    );
}

function animate()
{
    requestAnimationFrame(animate);
    
    if(plaza) {
        plaza.rotation.y += 0.01;
    }

    controles.update();
    renderer.render(scene, camera);
}

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

init();
animate();

// --- ESTILOS DE BOTONES ACERO/MINA ---
const estilosBotones = document.createElement('style');
estilosBotones.innerHTML = `
    button, .interfaz-controles button {
        background: linear-gradient(135deg, #3a444d 0%, #222930 100%); 
        color: #e0dacf; 
        border: 2px solid #222930; 
        border-radius: 8px; 
        padding: 10px 20px;
        font-family: 'Montserrat', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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

    button:disabled {
        background: #5c636a;
        color: #b0b5b8;
        border: 1px solid #494f54;
        cursor: not-allowed;
        box-shadow: none;
    }
`;
document.head.appendChild(estilosBotones);