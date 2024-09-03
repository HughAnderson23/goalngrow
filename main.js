const scene = new THREE.Scene();

// Use an OrthographicCamera for an isometric view
const aspect = window.innerWidth / window.innerHeight;
const d = 20; // Controls the zoom level
const camera = new THREE.OrthographicCamera(
    -d * aspect, d * aspect, d, -d, 1, 1000
);

// Initially set the camera position
camera.position.set(20, 20, 20);
camera.lookAt(scene.position); // Ensure the camera is looking at the center of the scene

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0x87CEEB); // Set the background color to a sky blue
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadow mapping
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
document.body.appendChild(renderer.domElement);

// Add a ground plane with a gradient-like material
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x0000ff, // Base blue color
    roughness: 0.5,
    metalness: 0.0, // Less metalness for a non-metallic appearance
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate the plane to be horizontal
ground.position.y = -1; // Position it slightly below the origin
ground.receiveShadow = true; // Ground receives shadows
scene.add(ground);

// Replace sunlight with a point light for more dynamic lighting
const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
pointLight.position.set(10, 20, 10); // Position the light above the scene
pointLight.castShadow = true; // Enable shadows
pointLight.shadow.mapSize.width = 2048; // Shadow map resolution
pointLight.shadow.mapSize.height = 2048;
scene.add(pointLight);

// Add ambient light for base lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft white light
scene.add(ambientLight);

const keys = { w: false, a: false, s: false, d: false };

let block; // Variable to store the imported block

function animate() {
    requestAnimationFrame(animate);

    if (block) {
        // Adjust movement for isometric perspective
        const moveSpeed = 0.1;

        if (keys.w) {
            block.position.x -= moveSpeed;
            block.position.z -= moveSpeed;
        }
        if (keys.s) {
            block.position.x += moveSpeed;
            block.position.z += moveSpeed;
        }
        if (keys.a) {
            block.position.x -= moveSpeed;
            block.position.z += moveSpeed;
        }
        if (keys.d) {
            block.position.x += moveSpeed;
            block.position.z -= moveSpeed;
        }

        // Update the camera position to follow the block
        camera.position.set(
            block.position.x + 20, // Offset camera position to maintain isometric view
            block.position.y + 20,
            block.position.z + 20
        );
        camera.lookAt(block.position); // Ensure the camera is always looking at the block
    }

    renderer.render(scene, camera);
}
animate();

const loader = new THREE.GLTFLoader();

loader.load(
    'goalngrow_assets/block.glb',
    function (gltf) {
        block = gltf.scene;
        block.scale.set(1, 1, 1); // Scale the model as needed
        block.position.set(0, 0, 0); // Start the block at the origin
        block.castShadow = true; // Enable shadow casting for the block

        // Traverse through the model's children to enable shadows and set materials
        block.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material = new THREE.MeshStandardMaterial({
                    color: child.material.color,
                    roughness: 0.5,
                    metalness: 0.1
                }); // Convert to MeshStandardMaterial for better lighting effects
            }
        });

        scene.add(block);
    },
    undefined,
    function (error) {
        console.error('Error loading model:', error);
    }
);

document.addEventListener('keydown', (event) => {
    if (event.key === 'w') keys.w = true;
    if (event.key === 'a') keys.a = true;
    if (event.key === 's') keys.s = true;
    if (event.key === 'd') keys.d = true;
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'w') keys.w = false;
    if (event.key === 'a') keys.a = false;
    if (event.key === 's') keys.s = false;
    if (event.key === 'd') keys.d = false;
});
