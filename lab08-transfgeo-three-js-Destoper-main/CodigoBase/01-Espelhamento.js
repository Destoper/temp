// Aplicando a transformações geométrica de espelhamento no Vertex Shader.

import * as THREE from 'three';
import { GUI } 		from 'gui'

const 	rendSize 	= new THREE.Vector2();
let 	pos 		= 0.0;

let 	scene,
		renderer,
		camera,
		controls;

let gui = new GUI();

/// ***************************************************************
/// **                                                           **
/// ***************************************************************

function main() {

	renderer = new THREE.WebGLRenderer();

	renderer.setClearColor(new THREE.Color(0.0, 0.0, 0.0));

	rendSize.x = 
	rendSize.y = Math.min(window.innerWidth, window.innerHeight) * 0.8;

	renderer.setSize(rendSize.x, rendSize.y);

	document.body.appendChild(renderer.domElement);

	scene 	= new THREE.Scene();

	camera = new THREE.OrthographicCamera( -5.0, 5.0, 5.0, -5.0, -1.0, 1.0 );
	scene.add( camera );

	initGUI();

	buildScene();

	renderer.render(scene, camera);
};

/// ***************************************************************
/// **                                                           **
/// ***************************************************************

function initGUI() {

	controls = 	{	EspelhamentoX : false,
					EspelhamentoY : false 
	 			};

	gui.add( controls, 'EspelhamentoX').onChange(updateShaderUniforms);
	gui.add( controls, 'EspelhamentoY').onChange(updateShaderUniforms);
	gui.open();
};

/// ***************************************************************
/// **                                                           **
/// ***************************************************************

function updateShaderUniforms(val) {

	let obj = scene.getObjectByName("Quadrado")
	obj.material.uniforms.uMirrorX.value = controls.EspelhamentoX;
	obj.material.uniforms.uMirrorY.value = controls.EspelhamentoY;
	obj.material.uniformsNeedUpdate = true;

	renderer.clear();
	renderer.render(scene, camera);    
}

/// ************shearY***************************************************
/// **                                                           **
/// ***************************************************************

function buildScene() {

	let axis = new THREE.AxesHelper(5.0);
	scene.add(axis);


	let shaderMat = 	new THREE.ShaderMaterial( 	
							{ 	uniforms  		: 	{	uMirrorX	: { type 	: "b" , 
																		value  	: false },
														uMirrorY	: { type 	: "b" , 
																		value  	: false }, 
													},
								vertexShader 	: document.getElementById('Mirror-VS').textContent,
								fragmentShader 	: document.getElementById('Mirror-FS').textContent,
								wireframe  		: false,
								vertexColors	: true,
								side:  THREE.DoubleSide
							} );

	let geometryQuad = new THREE.PlaneGeometry( 2.0, 2.0, 1, 1 );
	const count = geometryQuad.attributes.position.count;
	geometryQuad.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( count * 3 ), 3 ) );

	const positionsQuad = geometryQuad.attributes.position;
	const colorsQuad = geometryQuad.attributes.color;

	colorsQuad.setXYZ( 0, 0.0, 1.0, 0.0 );
	colorsQuad.setXYZ( 1, 1.0, 0.0, 0.0 );
	colorsQuad.setXYZ( 2, 1.0, 1.0, 1.0 );
	colorsQuad.setXYZ( 3, 0.0, 0.0, 1.0 );

	let quad1 	= new THREE.Mesh 	( 	geometryQuad, 
										shaderMat, 
									);
	quad1.name = "Quadrado";
	quad1.position.x = 1.0;
	quad1.position.y = 1.0;
	scene.add(quad1);


};

/// ***************************************************************
/// ***************************************************************
/// ***************************************************************

main();
