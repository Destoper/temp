import * as THREE from 'three';
import { GUI } from 'gui'

const rendSize = new THREE.Vector2();
let scene, renderer, camera, controls;
let gui = new GUI();

function main() {
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color(0.0, 0.0, 0.0));
    rendSize.x = rendSize.y = Math.min(window.innerWidth, window.innerHeight) * 0.8;
    renderer.setSize(rendSize.x, rendSize.y);
    document.body.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-5.0, 5.0, 5.0, -5.0, -1.0, 1.0);
    scene.add(camera);
    initGUI();
    buildScene();
    renderer.render(scene, camera);
}

function initGUI() {
    controls = {
        shearX: 0.0,
        shearY: 0.0,
    };

    gui.add(controls, 'shearX', -1.0, 1.0, 0.05).onChange(updateShaderUniform);
    gui.add(controls, 'shearY', -1.0, 1.0, 0.05).onChange(updateShaderUniform);
    gui.open();
}

function updateShaderUniform() {
    let obj = scene.getObjectByName("QuadVerm");
    if (obj && obj.material) {
        obj.material.uniforms.shearX.value = controls.shearX;
        obj.material.uniforms.shearY.value = controls.shearY;
        obj.material.uniformsNeedUpdate = true;
    }
    renderer.clear();
    renderer.render(scene, camera);   
}

function buildScene() {
    scene.add(new THREE.AxesHelper(5.0));
    const uniforms = {
        "shearX": { value: controls.shearX },
        "shearY": { value: controls.shearY }
    };

    let shaderMat = new THREE.ShaderMaterial({
        vertexShader: document.getElementById('ShearVS').textContent,
        fragmentShader: document.getElementById('ShearFS').textContent,
        wireframe: true,
        uniforms: uniforms
    });

    let quad1 = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0, 10, 10), shaderMat);
    quad1.name = "QuadVerm";
    quad1.position.set(1.0, 1.0, 0);
    quad1.scale.set(2.0, 2.0, 1.0);
    scene.add(quad1);
}

main();
