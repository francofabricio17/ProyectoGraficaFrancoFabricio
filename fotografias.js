// --- LÓGICA DEL CARRUSEL GIRATORIO ---
const carrusel = document.getElementById('carrusel');
const tarjetas = document.querySelectorAll('.tarjeta-foto');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

const totalTarjetas = tarjetas.length;
const anguloPorTarjeta = 360 / totalTarjetas; 

const radioZ = 420; 
let rotacionActual = 0;

tarjetas.forEach((tarjeta, indice) => {
    const anguloCalculado = indice * anguloPorTarjeta;
    tarjeta.style.transform = `rotateY(${anguloCalculado}deg) translateZ(${radioZ}px)`;
});

function actualizarCarrusel() {
    carrusel.style.transform = `rotateY(${rotacionActual}deg)`;
}

nextBtn.addEventListener('click', () => {
    rotacionActual -= anguloPorTarjeta;
    actualizarCarrusel();
});

prevBtn.addEventListener('click', () => {
    rotacionActual += anguloPorTarjeta;
    actualizarCarrusel();
});

tarjetas.forEach((tarjeta, indice) => {
    tarjeta.addEventListener('click', () => {
        rotacionActual = -(indice * anguloPorTarjeta);
        actualizarCarrusel();
    });
});

// --- ESCENARIO DE PARTÍCULAS MINERALES FLOTANTES (Three.js) ---
let animationFrameId;

function iniciarParticulas() {
    // Mecanismo de reintento de carga de seguridad por si acaso
    if (typeof THREE === 'undefined') {
        console.warn("Librería Three.js no encontrada, reintentando en 50ms...");
        setTimeout(iniciarParticulas, 50);
        return;
    }

    const contenedorContainer = document.getElementById('webgl-container');
    if (!contenedorContainer) return;

    // 1. Escena, Cámara y Renderizador
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3.5; 

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    contenedorContainer.innerHTML = '';
    contenedorContainer.appendChild(renderer.domElement);

    // 2. Creación de Partículas 
    const particlesCount = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    // Paleta de colores minera (Tonos ocres, cobres y tierras)
    const paletaColores = [
        new THREE.Color(0xd98841), 
        new THREE.Color(0xfadbd8), 
        new THREE.Color(0xa0522d), 
        new THREE.Color(0xcd853f), 
        new THREE.Color(0xffe4c4), 
        new THREE.Color(0x5c4033)  
    ];

    for (let i = 0; i < particlesCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 26;        
        positions[i + 1] = (Math.random() - 0.5) * 22; 
        positions[i + 2] = (Math.random() - 0.5) * 16; 

        const colorAleatorio = paletaColores[Math.floor(Math.random() * paletaColores.length)];
        colors[i] = colorAleatorio.r;
        colors[i + 1] = colorAleatorio.g;
        colors[i + 2] = colorAleatorio.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.09,            
        vertexColors: true,    
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    const clock = new THREE.Clock();

    const tick = () => {
        const elapsedTime = clock.getElapsedTime();

        particleSystem.rotation.y = elapsedTime * 0.018;
        particleSystem.rotation.x = elapsedTime * 0.010;

        const positionsArray = geometry.attributes.position.array;
        for (let i = 1; i < positionsArray.length; i += 3) {
            positionsArray[i] = positionsArray[i] + Math.sin(elapsedTime + i) * 0.0018;
        }
        geometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
        animationFrameId = window.requestAnimationFrame(tick);
    };

    tick();

    // Adaptabilidad ante redimensionamiento de pantalla
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
}

// Inicialización de la función
iniciarParticulas();