// Aplicando as tranformações de deformação utilizando Shaders

import * as THREE from 'three';
import { GUI } 		from 'gui'

const 	rendSize 	= new THREE.Vector2();

let 	gui 		= new GUI();

let 	scene,
		renderer,
		camera,
		controls,
		id;

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

	camera = new THREE.OrthographicCamera( -12.0, 12.0, 12.0, -12.0, -12.0, 12.0 );
	scene.add( camera );

	initGUI();

	buildScene();

	renderer.render(scene, camera);};

/// ***************************************************************
/// **                                                           **
/// ***************************************************************

function initGUI() {

	controls = 	{	Tapering 	: false,
					Twisting 	: false,
					Bending 	: false,
					};

	gui.add( controls, 'Tapering').onChange(applyDeformation);
	gui.add( controls, 'Twisting').onChange(applyDeformation);
	gui.add( controls, 'Bending').onChange(applyDeformation);
	gui.open();
};

/// ***************************************************************
/// **                                                           **
/// ***************************************************************

function buildScene() {

	scene.add(new THREE.AxesHelper(10.0));

	let shaderTapering 	= 	new THREE.ShaderMaterial( 	{ 	vertexShader 	: document.getElementById('Tapering-VS').textContent,
															fragmentShader 	: document.getElementById('Deform-FS').textContent,
															wireframe  		: true,
														} );

	let shaderTwisting 	= 	new THREE.ShaderMaterial( 	{ 	vertexShader 	: document.getElementById('Twisting-VS').textContent,
															fragmentShader 	: document.getElementById('Deform-FS').textContent,
															wireframe  		: true,
														} );

	let shaderBending 	= 	new THREE.ShaderMaterial( 	{ 	vertexShader 	: document.getElementById('Bending-VS').textContent,
															fragmentShader 	: document.getElementById('Deform-FS').textContent,
															wireframe  		: true,
														} );


	let redBox 		= new THREE.Mesh( 	new THREE.BoxGeometry(1.0, 1.0, 1.0, 5, 5, 5), 
										shaderTapering
										);
	redBox.name 				= "Red Box";
	redBox.matrixAutoUpdate 	= false;
	redBox.matrix.copy( new THREE.Matrix4().identity());
	redBox.matrix.multiply(	new THREE.Matrix4().makeTranslation(-8.0, 0.0, 0.0));
	redBox.matrix.multiply(new THREE.Matrix4().makeScale(4.0, 10.0, 4.0));
	redBox.needsUpdate = true;

	scene.add(redBox);

	let greenBox 		= new THREE.Mesh( 	new THREE.BoxGeometry(1.0, 1.0, 1.0, 5, 5, 5), 
											shaderTwisting	
										);
	greenBox.name 				= "Green Box";
	greenBox.matrixAutoUpdate 	= false;
	greenBox.matrix.copy( new THREE.Matrix4().identity());
	greenBox.matrix.multiply( new THREE.Matrix4().makeTranslation(0.0, 0.0, 0.0));
	greenBox.matrix.multiply( new THREE.Matrix4().makeScale(4.0, 10.0, 4.0));
	greenBox.needsUpdate = true;

	scene.add(greenBox);

	let blueBox 		= new THREE.Mesh( 	new THREE.BoxGeometry(1.0, 1.0, 1.0, 5, 5, 5), 
											shaderBending
										);
	blueBox.name 				= "Blue Box";
	blueBox.matrixAutoUpdate 	= false;
	blueBox.matrix.copy( new THREE.Matrix4().identity());
	blueBox.matrix.multiply( new THREE.Matrix4().makeTranslation(8.0, 0.0, 0.0));
	blueBox.matrix.multiply(new THREE.Matrix4().makeScale(4.0, 10.0, 4.0));
	blueBox.needsUpdate = true;

	scene.add(blueBox);
}

/// ***************************************************************
/// **                                                           **
/// ***************************************************************

function applyDeformation(val) {

	// Coloque aqui função que controla a aplicação das deformações nos shaders

}

/// ***************************************************************
/// **                                                           **
/// ***************************************************************
function animate(time) {

	// Coloque aqui função que anima as deformações
		
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
}


/// ***************************************************************
/// ***************************************************************
/// ***************************************************************

main();
