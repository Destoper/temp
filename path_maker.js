import * as THREE from 'three';
import { GLTFLoader } from 'gltf-loader';
import { OrbitControls } from 'orb-cam-ctrl';
import { GUI } from 'gui';

let scene, camera, renderer, model, raycaster, mouse, sphereArray = [], lineArray = [];
let isMouseDown = false; // Flag to track if mouse is pressed
let lastMouseX = 0; // Store the last mouse X position
let lastMouseY = 0; // Store the last mouse Y position
let rotationSpeed = 0.002; // Speed of camera rotation based on mouse drag
let keyboard = { forward: false, backward: false, left: false, right: false, up: false, down: false };
let moveSpeed = 0.1; // Speed for WASD movement

// Initialize scene and camera
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB); // Sky color

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 5); // Camera height 1.6 for human-like view

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Load the 3D model
  const loader = new GLTFLoader();
  loader.load('./3d_models/low_poly_city/scene.gltf', function(gltf) {
    model = gltf.scene;
    model.scale.set(0.1, 0.1, 0.1); // Scale model as needed
    scene.add(model);
  });

  // Lights
  const light = new THREE.AmbientLight(0x404040); // Ambient light
  scene.add(light);

  // Handle window resize
  window.addEventListener('resize', onWindowResize, false);

  // Mouse click event for sphere interaction
  window.addEventListener('click', onMouseClick, false);

  // Mouse events for rotation
  window.addEventListener('mousedown', onMouseDown, false);
  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('mouseup', onMouseUp, false);

  // Keyboard events for movement
  window.addEventListener('keydown', onKeyDown, false);
  window.addEventListener('keyup', onKeyUp, false);

  // Animation loop
  animate();
}

// Mouse events for rotation
function onMouseDown(event) {
  isMouseDown = true;
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
}

function onMouseMove(event) {
  if (isMouseDown) {
    // Calculate the change in mouse position
    const deltaX = event.clientX - lastMouseX;
    const deltaY = event.clientY - lastMouseY;

    // Update the camera rotation based on mouse movement
    camera.rotation.y -= deltaX * rotationSpeed; // Left-right rotation
    camera.rotation.x -= deltaY * rotationSpeed; // Up-down rotation

    // Clamp the camera rotation to avoid flipping over
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

    // Update the last mouse position
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  }
}

function onMouseUp() {
  isMouseDown = false;
}

// Update camera aspect on resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle key presses for movement
function onKeyDown(event) {
  switch (event.key) {
    case 'w': keyboard.forward = true; break;
    case 's': keyboard.backward = true; break;
    case 'a': keyboard.left = true; break;
    case 'd': keyboard.right = true; break;
    case 'Shift': keyboard.up = true; break;
    case 'Control': keyboard.down = true; break;
    case 'p': addSphere(); break;
    case 'o': resetCameraRotation(); break; // Add this line to reset the camera rotation on 'O' key press
  }
}

function onKeyUp(event) {
  switch (event.key) {
    case 'w': keyboard.forward = false; break;
    case 's': keyboard.backward = false; break;
    case 'a': keyboard.left = false; break;
    case 'd': keyboard.right = false; break;
    case 'Shift': keyboard.up = false; break;
    case 'Control': keyboard.down = false; break;
  }
}

// Move the camera based on WASD keys and Shift for up movement
function moveCamera() {
  if (keyboard.forward) camera.position.z -= moveSpeed;  // Move forward
  if (keyboard.backward) camera.position.z += moveSpeed; // Move backward
  if (keyboard.left) camera.position.x -= moveSpeed;     // Move left
  if (keyboard.right) camera.position.x += moveSpeed;    // Move right
  if (keyboard.up) camera.position.y += moveSpeed;           // Move up with Shift
  if (keyboard.down) camera.position.y -= moveSpeed;         // Move down with Control
}

// Add a sphere to the scene and save the position
function addSphere() {
    const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    let sphereMaterial;  // Declare sphereMaterial outside the conditions
  
    if (sphereArray.length === 0) {
      // First sphere, green color
      sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    } else {
      // For all subsequent spheres, red color, but update the last sphere material if necessary
      if (sphereArray.length > 1) { 
          const lastSphere = sphereArray[sphereArray.length - 1];
          // Change the material of the last sphere
          lastSphere.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      }
      // The new sphere (second and beyond) will be yellow
      sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    }
  
    // Create the new sphere with the determined material
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.copy(camera.position);
    scene.add(sphere);
    sphereArray.push(sphere);
  
    // If there's a previous sphere, connect it to this one
    if (sphereArray.length > 1) {
      const lastSpherePosition = sphereArray[sphereArray.length - 2].position;
      createLine(lastSpherePosition, sphere.position);
    }
  
    console.log('Sphere positions:', sphereArray);
  }

// Create a path (line) between two points
function createLine(start, end) {
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  lineArray.push(line); // Save the line to remove it later
}

// Detect a click on a sphere and remove it
function onMouseClick(event) {
  // Normalize mouse coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the raycaster
  raycaster.setFromCamera(mouse, camera);

  // Check for intersections with spheres
  const sphereIntersects = raycaster.intersectObjects(sphereArray);

  if (sphereIntersects.length > 0) {
      const clickedSphere = sphereIntersects[0].object;
      const clickedIndex = sphereArray.indexOf(clickedSphere);

      // Remove the clicked sphere from the scene
      scene.remove(clickedSphere);

      // Remove it from the sphere array
      sphereArray = sphereArray.filter(sphere => sphere !== clickedSphere);

      // Fix the sphere colors
      if (sphereArray.length > 0) {
          sphereArray[0].material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
          if (sphereArray.length > 1) {
              sphereArray[sphereArray.length - 1].material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
          }
      }

      // Recreate lines between the remaining spheres
      recreateLines();
  } else {
      // Check for intersections with lines
      const lineIntersects = raycaster.intersectObjects(lineArray);

      if (lineIntersects.length > 0) {
          const clickedLine = lineIntersects[0];
          const positionOnLine = clickedLine.point;

          // Create a new sphere at the clicked position
          const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
          const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
          const newSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

          newSphere.position.copy(positionOnLine);
          scene.add(newSphere);

          // Insert the sphere into the correct position in the path
          let insertIndex = 0;
          for (let i = 1; i < sphereArray.length; i++) {
              const start = sphereArray[i - 1].position;
              const end = sphereArray[i].position;

              // Check if the clicked point lies on this segment
              if (start.distanceTo(positionOnLine) + positionOnLine.distanceTo(end) - start.distanceTo(end) < 0.01) {
                  insertIndex = i;
                  break;
              }
          }

          sphereArray.splice(insertIndex, 0, newSphere);

          // Fix the colors of the spheres
          sphereArray[0].material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
          if (sphereArray.length > 1) {
              sphereArray[sphereArray.length - 1].material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
          }

          // Recreate lines between all spheres
          recreateLines();
      }
  }
}


function recreateLines() {
  // Clear all existing lines
  lineArray.forEach(line => {
      scene.remove(line);
  });
  lineArray = [];

  // Create new lines between all remaining spheres
  for (let i = 1; i < sphereArray.length; i++) {
      const start = sphereArray[i - 1].position;
      const end = sphereArray[i].position;
      createLine(start, end);
  }
}


// Reset camera rotation to default (no rotation)
function resetCameraRotation() {
  camera.rotation.set(0, 0, 0); // Reset the camera's rotation to (0, 0, 0)
  console.log('Camera rotation reset');
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  moveCamera();

  // Update the renderer
  renderer.render(scene, camera);
}

// Event listeners for keyboard and mouse controls
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);

// Initialize the scene
init();
