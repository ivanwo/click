import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';

// Global Scene variables
let camera, controls, scene, renderer, raycaster, gameHolder, INTERSECT;

// Display Settings
let pixelation = 0.25;

// Game Item Objects
let player;
let cube, wall, wall2, manhole;

// mousey
let mouse = new THREE.Vector2();
let mousePos;

init();
animate();

function init(){
    gameHolder = document.getElementById("game-holder");
    // initialize scene, renderer, and camera
    raycaster = new THREE.Raycaster();
    scene = new THREE.Scene();
    scene.background = new THREE.Color("lightgrey");
    scene.fog = new THREE.FogExp2( "white", 0.001);

    renderer = new THREE.WebGLRenderer({antialias:true, alpha:true}); // {antialias=true}
    renderer.setPixelRatio(window.devicePixelRatio*pixelation);
    renderer.setSize(gameHolder.clientWidth, gameHolder.clientHeight);
    renderer.setClearColor( 0x000000, 0 );

    camera = new THREE.PerspectiveCamera(60, window.innerWidth/ window.innerHeight, 1, 1000);
    camera.position.set(50,50,50);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 50;
    controls.maxDistance = 250;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enableKeys = true;
    controls.enablePan = false;
    // WASD
    controls.keys = {LEFT: 65, UP: 87, RIGHT: 68, BOTTOM: 83};
    // ARROW KEYS
    //controls.keys = {LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40};

    // GAME WORLD
    // ground
    const gt = new THREE.TextureLoader().load( "./img/concrete1.jpg" );
    const gg = new THREE.PlaneBufferGeometry( 1600, 1600 );
    const gm = new THREE.MeshPhongMaterial( { map: gt } );

	const ground = new THREE.Mesh( gg, gm );
	ground.rotation.x = - Math.PI / 2;
	ground.material.map.repeat.set( 64, 64 );
	ground.material.map.wrapS = THREE.RepeatWrapping;
	ground.material.map.wrapT = THREE.RepeatWrapping;
    ground.material.map.encoding = THREE.sRGBEncoding;
    ground.name= "ground";
    
    let markTexture = new THREE.TextureLoader().load("./img/brick.jpg");
    let markGeometry = new THREE.PlaneBufferGeometry(150,50);
    let markMesh = new THREE.MeshPhongMaterial({color:"gray", map: markTexture});
    wall = new THREE.Mesh(markGeometry,markMesh);
    wall2 = new THREE.Mesh(markGeometry,markMesh);
    wall.userData.clickMessage = "a sturdy looking brick wall";
    wall2.userData.clickMessage = "a sturdy looking brick wall";
    wall2.rotation.y = Math.PI;
    wall.position.set(-40,20,-80);
    wall2.position.set(-40,20,-80);
    wall.updateMatrixWorld();
    wall2.updateMatrixWorld();
    wall.name="wall";
    wall2.name="wall2";
    scene.add(wall);
    scene.add(wall2);

    cube = new THREE.Mesh(new THREE.CubeGeometry(10,10,10), new THREE.MeshPhongMaterial({color:"blue", flatShading:true}));
    scene.add(cube);
    cube.position.set(-50,0,-10);
    cube.userData.clickMessage ="do not touch the cube";
    cube.name="cube";
    cube.updateMatrixWorld();

    let manholeTexture = new THREE.TextureLoader().load("./img/manhole.png");
    let manholeGeometry = new THREE.PlaneBufferGeometry(20,20);
    let manholeMesh = new THREE.MeshBasicMaterial({color:"0x000000",map:manholeTexture, transparent:true});
    manhole = new THREE.Mesh(manholeGeometry, manholeMesh);
    manhole.rotation.x = - Math.PI/2;
    manhole.userData.clickMessage = "looks dirty, i wouldn't touch it";
    manhole.position.set(-30,-4.9,30);
    manhole.name="manhole";
    scene.add(manhole);


    // meshes and materials
    let coneGeometry = new THREE.ConeGeometry(4,8,6);
    let coneMaterial = new THREE.MeshPhongMaterial({color:"blue", flatShading:true});
    // arranging the stuff
    player = new THREE.Mesh(coneGeometry,coneMaterial)
    player.userData = {
        name:"player",
        clickMessage:"i think this is supposed to be you?",
        step: 0,
        path: new THREE.Line3(),
        pathPos: 0,
        target: new THREE.Vector3()
    };
    player.name="player";
    scene.add(player);
    player.position.set(10,0,10);


    ground.position.set(0,-5,0);
    // lights

    const ambientLight = new THREE.AmbientLight( 0x222222 );
    const dirLight1 = new THREE.DirectionalLight( "white" );
    dirLight1.position.set( -1, 1, 1 );
    //const dirLight2 = new THREE.DirectionalLight( 0x002288 );
	//dirLight2.position.set( 1, 1, -1 );

    // Add each item to the scene
    scene.add(ground);
    scene.add( dirLight1 );
    //ascene.add( dirLight2 );
    scene.add( ambientLight );

    // interact with the outer page
    // add game eventlisteners to the gameHolder
    gameHolder.appendChild(renderer.domElement);
    gameHolder.addEventListener('mousedown', mouseDownHandler, false);
    gameHolder.addEventListener('touchdown', mouseDownHandler, false);
    gameHolder.addEventListener('mouseup', mouseUpHandler, false);
    gameHolder.addEventListener('touchup', mouseUpHandler, false);
    gameHolder.addEventListener('mousemove', mouseMoveHandler, false);

    window.addEventListener('resize', onWindowResize, false);
    animate();
}
function mouseDownHandler(event){
    mousePos = {x: event.clientX, y:event.clientY};
}
function diff (num1, num2) {
    if (num1 > num2) {
        return num1 - num2
    } else {
        return num2 - num1
    }
}
function mouseUpHandler(event){
    let distance = diff(event.clientX, mousePos.x) + diff(event.clientY, mousePos.y);
    if(distance < 20){
        console.log("click");
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        let intersects = raycaster.intersectObjects(scene.children);
        if(intersects.length == 1){
            // one intersection, probably the ground
            // excellent candidate for "moving"
             gameHolder.style.cursor = "cell";
                setTimeout(_=> {gameHolder.style.cursor = "crosshair";} ,500);
            console.log(intersects);
            cursorBlip();
            console.log(player);
            player.userData.target = new THREE.Vector3(intersects[0].point.x,0,intersects[0].point.z);
            //console.log(somethingInTheWay(player.position,player.userData.target));
            document.getElementById("game-message").innerText = "we movin'";
            console.log(intersects[0].point.x +"    " +intersects[0].point.z);
            //somethingInTheWay( player.position, player.userData.target);
            if(!somethingInTheWay(player.position,player.userData.target)){
                player.userData.path = new THREE.Line3();
                player.userData.path.set(player.position, player.userData.target);
                player.userData.step = 0.5/player.userData.path.distance();
                player.userData.pathPos = 0;
            }
            
        }
        else if(intersects.length > 1){
            for(let item of intersects){
                if(item.object.userData.clickMessage!=undefined){
                    document.getElementById("game-message").innerText = item.object.userData.clickMessage;
                }
            }
            console.log(intersects);
        }
    }
    else{
        console.log("drag");
    }
}
//  ? ? ? ? ? ? ? 
function somethingInTheWay(start, direction){
    let pathRay = new THREE.Raycaster(start.clone(), direction.clone().normalize(), 0, direction.distanceTo(start));
    console.log(pathRay);
    if(pathRay.intersectObjects([cube,wall,wall2]).length > 0) {
        console.log("blocked");
        document.getElementById("game-message").innerText = "there appears to be something in the way";
        console.log(pathRay.intersectObjects([cube,wall,wall2]));
        return true;
    }
    else {
        console.log("onward");
        return false;
    }
    //return pathRay.intersectObjects([cube, wall,wall2]);
}
function cursorBlip(){
    gameHolder.style.cursor = "cell";
    setTimeout( _ => {gameHolder.style.cursor = "crosshair";},300)
}
function mouseMoveHandler(event){
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    let intersects = raycaster.intersectObjects(scene.children);
    if(intersects.length == 1){
        gameHolder.style.cursor = "crosshair";
    }
    else if(intersects.length > 1){
        gameHolder.style.cursor = "help";
    }
}
function playerGoForward(){
    if(player.userData.pathPos < 1){
        player.lookAt(player.userData.target);
        //player.translateOnAxis(player.userData.target, 0.01);
        let newPosition = new THREE.Vector3;
        player.userData.path.at(player.userData.pathPos, newPosition);
        let xDif = newPosition.x - player.position.x;
        let yDif = newPosition.y - player.position.y;
        let zDif = newPosition.z - player.position.z;
        camera.position.set(camera.position.x + xDif,camera.position.y + yDif, camera.position.z + zDif);
        player.position.set(newPosition.x,newPosition.y,newPosition.z);
        player.userData.pathPos += player.userData.step;
        //player.userData.path.set(player.position, player.userData.target);
        //player.userData.step = 0.5/playerPath.distance();
        //player.userData.pathPos;
    }
    else if(player.userData.pathPos > 1 ){
        //player.userData.target = new THREE.Vector3();
        //player.userData.pathPos = 0;
    }
    //
}

function onWindowResize(){
    //camera.aspect = window.innerWidth / window.innerHeight;
    camera.aspect = gameHolder.clientWidth / gameHolder.clientHeight;
	camera.updateProjectionMatrix();
    //renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setSize( gameHolder.clientWidth, gameHolder.clientHeight );
}
function animate(){
    requestAnimationFrame(animate);
    controls.update();
    //controls.set
    controls.target.set(player.position.x, player.position.y, player.position.z);
    playerGoForward();
    render();
}

function render(){
    renderer.render(scene,camera);
}