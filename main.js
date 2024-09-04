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
document.body.appendChild(renderer.domElement);

// Define a custom shader material for soft lighting
const customShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        lightPosition: { value: new THREE.Vector3(50, 50, 50) }, // Position of the light source
        diffuseColor: { value: new THREE.Color(0xaaaaaa) }, // Softer default gray color
    },
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vNormal = normalize(normalMatrix * normal); // Pass the normal to fragment shader
            vPosition = vec3(modelViewMatrix * vec4(position, 1.0)); // Pass the position of the vertex
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 lightPosition;
        uniform vec3 diffuseColor;

        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
            // Calculate lighting direction and intensity
            vec3 lightDirection = normalize(lightPosition - vPosition);
            float lightIntensity = max(dot(vNormal, lightDirection), 0.0); // Simple diffuse lighting

            // Create a soft lighting effect by adjusting intensity
            float softLighting = pow(lightIntensity, 1.5); // Power to make the light softer

            // Final color, with a soft lighting gradient
            gl_FragColor = vec4(softLighting * diffuseColor, 1.0);
        }
    `,
});

// Create the ground using the custom shader
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Set a soft green for the ground
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate the plane to be horizontal
ground.position.y = -1; // Position it slightly below the origin
scene.add(ground);

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

// Load the block using the same shader material for consistent lighting
const loader = new THREE.GLTFLoader();

loader.load(
    'goalngrow_assets/block.glb',
    function (gltf) {
        block = gltf.scene;
        block.scale.set(1, 1, 1); // Scale the model as needed
        block.position.set(0, 0, 0); // Start the block at the origin

        // Traverse through the model's children to apply the custom shader
        block.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry.attributes.normal && child.geometry.attributes.position) {
                    // Apply shader only if the mesh has normal and position attributes
                    child.material = customShaderMaterial;
                    // Extract color from original material if available
                    if (child.material.color) {
                        customShaderMaterial.uniforms.diffuseColor.value = child.material.color;
                    }
                } else {
                    console.warn("Skipping mesh without normals or position attributes:", child.name);
                }
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
