import * as THREE from 'three';
import { GLTFLoader } from 'gltf-loader';
import { OrbitControls } from 'orb-cam-ctrl';
import { GUI } from 'gui';


// Global variables
let scene, renderer, clock;
let drone, city;
let activeCamera, cameraOrbit, cameraThirdPerson, cameraFirstPerson, orbitControls;
let cameraMarkers = {}; // Markers to visualize cameras
let gui, cameraInfo;
let orbitCameraData = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } };

// Paths and points
const pathPoints = [
  { position: new THREE.Vector3(0.79, 0.13, 1.51), rotation: new THREE.Euler(-0.45, -2.04, -0.02) },
  { position: new THREE.Vector3(0.79, 7.00, 1.51), rotation: new THREE.Euler(-85.62, -0.16, -2.03) },
  { position: new THREE.Vector3(-3.04, 11.48, -9.07), rotation: new THREE.Euler(-0.77, 1.66, 0.02) },
  { position: new THREE.Vector3(-3.24, 11.39, -16.01), rotation: new THREE.Euler(-4.99, 0.72, 0.06) },
  { position: new THREE.Vector3(-9.00, 11.39, -16.02), rotation: new THREE.Euler(-4.99, -89.83, -4.99) },
  { position: new THREE.Vector3(-9.02, 11.65, -24.24), rotation: new THREE.Euler(-4.99, -89.83, -4.99) }
];

// Model paths
const city_model_path = './3d_models/low_poly_city/scene.gltf';
const flying_drone_model_path = './3d_models/drone/scene.gltf';

// Initialize the scene
function setup_scene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky-blue background

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Clock for animation
  clock = new THREE.Clock();

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);

  // Setup cameras first
  setup_cameras();

  // GUI setup
  setup_gui();

  // Draw path
  draw_path();

  // Add camera markers
  add_camera_markers();

  // Load models
  load_model(city_model_path, (loadedCity) => {
    city = loadedCity;
    city.scale.set(0.5, 0.5, 0.5);
    scene.add(city);
  });

  load_model(flying_drone_model_path, (loadedDrone) => {
    drone = loadedDrone;
    drone.scale.set(0.5, 0.5, 0.5);
    scene.add(drone);
    move_drone_along_path();
  });

  // Listen for key press event to log the camera data
  window.addEventListener('keydown', onKeyPress);
}

// Key press handler
function onKeyPress(event) {
  if (event.key === 'p' || event.key === 'P') {
    const position = cameraOrbit.position;
    const rotation = cameraOrbit.rotation;

    // Printing the position and rotation in the specified format
    console.log(`{ position: new THREE.Vector3(${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}), rotation: new THREE.Euler(${THREE.MathUtils.radToDeg(rotation.x).toFixed(2)}, ${THREE.MathUtils.radToDeg(rotation.y).toFixed(2)}, ${THREE.MathUtils.radToDeg(rotation.z).toFixed(2)}) }`);
  }
}

// Set up cameras
function setup_cameras() {
  // Orbit camera
  cameraOrbit = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  cameraOrbit.position.set(20, 20, 20);
  orbitControls = new OrbitControls(cameraOrbit, renderer.domElement);

  // Third-person camera
  cameraThirdPerson = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  // First-person camera
  cameraFirstPerson = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  // Set the default active camera
  activeCamera = cameraOrbit;
}

function setup_gui() {
  // Existing code for setting up the GUI
  gui = new GUI();

  // Camera selection GUI
  const cameraOptions = { Orbit: 'Orbit', ThirdPerson: 'ThirdPerson', FirstPerson: 'FirstPerson' };
  gui.add({ Camera: 'Orbit' }, 'Camera', Object.keys(cameraOptions)).onChange((cameraName) => {
    switch (cameraName) {
      case 'Orbit':
        activeCamera = cameraOrbit;
        break;
      case 'ThirdPerson':
        activeCamera = cameraThirdPerson;
        break;
      case 'FirstPerson':
        activeCamera = cameraFirstPerson;
        break;
    }
  });

  // Folder for camera position and rotation controls
  const cameraInfo = gui.addFolder('Orbit Camera Info');
  
  // Position controls for orbit camera
  cameraInfo.add(orbitCameraData.position, 'x', -50, 50).name('Position X').listen().onChange(() => {
    cameraOrbit.position.x = orbitCameraData.position.x;
  });
  cameraInfo.add(orbitCameraData.position, 'y', -50, 50).name('Position Y').listen().onChange(() => {
    cameraOrbit.position.y = orbitCameraData.position.y;
  });
  cameraInfo.add(orbitCameraData.position, 'z', -50, 50).name('Position Z').listen().onChange(() => {
    cameraOrbit.position.z = orbitCameraData.position.z;
  });

  // Rotation controls for orbit camera
  cameraInfo.add(orbitCameraData.rotation, 'x', -Math.PI, Math.PI).name('Rotation X').listen().onChange(() => {
    cameraOrbit.rotation.x = orbitCameraData.rotation.x;
  });
  cameraInfo.add(orbitCameraData.rotation, 'y', -Math.PI, Math.PI).name('Rotation Y').listen().onChange(() => {
    cameraOrbit.rotation.y = orbitCameraData.rotation.y;
  });
  cameraInfo.add(orbitCameraData.rotation, 'z', -Math.PI, Math.PI).name('Rotation Z').listen().onChange(() => {
    cameraOrbit.rotation.z = orbitCameraData.rotation.z;
  });

  // Open the folder by default
  cameraInfo.open();
}

// Update orbit camera data for GUI
function update_orbit_camera_data() {
  const { position, rotation } = cameraOrbit;

  orbitCameraData.position.x = position.x.toFixed(2);
  orbitCameraData.position.y = position.y.toFixed(2);
  orbitCameraData.position.z = position.z.toFixed(2);

  orbitCameraData.rotation.x = THREE.MathUtils.radToDeg(rotation.x).toFixed(2);
  orbitCameraData.rotation.y = THREE.MathUtils.radToDeg(rotation.y).toFixed(2);
  orbitCameraData.rotation.z = THREE.MathUtils.radToDeg(rotation.z).toFixed(2);
}

// Load models
function load_model(path, callback) {
  const loader = new GLTFLoader();
  loader.load(
    path,
    (gltf) => callback(gltf.scene),
    undefined,
    (error) => console.error('Error loading model:', error)
  );
}

// Add markers for cameras
function add_camera_markers() {
  function create_marker(position, color) {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.copy(position);
    scene.add(marker);
    return marker;
  }

  cameraMarkers.orbit = create_marker(cameraOrbit.position, 0xff0000);
  cameraMarkers.thirdPerson = create_marker(new THREE.Vector3(0, 5, 0), 0x00ff00);
  cameraMarkers.firstPerson = create_marker(new THREE.Vector3(0, 2, 2), 0x0000ff);
}

// Draw path using lines
function draw_path() {
  const pathGeometry = new THREE.BufferGeometry();
  const points = pathPoints.map((point) => point.position);
  pathGeometry.setFromPoints(points);

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
  const line = new THREE.Line(pathGeometry, lineMaterial);
  scene.add(line);
}

function move_drone_along_path() {
  let pointIndex = 0;

  function move_to_next_point() {
    if (pointIndex >= pathPoints.length) {
      pointIndex = 0; // Reset to the first point to loop
    }

    const nextPoint = pathPoints[pointIndex];
    const duration = 2000; // Duration to reach the next point (ms)

    const start = { ...drone.position, rotation: drone.rotation.clone() };
    const end = { position: nextPoint.position, rotation: nextPoint.rotation };

    const startTime = clock.getElapsedTime();

    function update_position() {
      const elapsed = (clock.getElapsedTime() - startTime) * 1000;
      const t = Math.min(elapsed / duration, 1);

      drone.position.lerpVectors(start, end.position, t);

      // Interpolating rotation using quaternions
      const startQuaternion = new THREE.Quaternion().setFromEuler(start.rotation);
      const endQuaternion = new THREE.Quaternion().setFromEuler(end.rotation);
      const interpolatedQuaternion = startQuaternion.slerp(endQuaternion, t);

      drone.rotation.setFromQuaternion(interpolatedQuaternion);

      if (t < 1) {
        requestAnimationFrame(update_position);
      } else {
        pointIndex++; // Move to the next point
        if (pointIndex >= pathPoints.length) {
          pointIndex = 0; // Reset to loop again
        }
        move_to_next_point();
      }
    }

    update_position();
  }

  move_to_next_point();
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (activeCamera === cameraOrbit) {
    update_orbit_camera_data();
  } else if (activeCamera === cameraThirdPerson) {
    // Update third-person camera position relative to the drone
    cameraThirdPerson.position.copy(drone.position).add(new THREE.Vector3(0, 5, 10)); // 10 units behind and 5 above
    cameraThirdPerson.lookAt(drone.position);
  } else if (activeCamera === cameraFirstPerson) {
    // Update first-person camera position to match the drone's position
    cameraFirstPerson.position.copy(drone.position);
    cameraFirstPerson.rotation.copy(drone.rotation);
  }

  orbitControls.update();
  renderer.render(scene, activeCamera);
}

// Initialize the scene and start animation
setup_scene();
animate();
