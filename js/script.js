import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { FBXLoader } from "./FBXLoader.js";

// Global Scene variables
let camera, controls, scene, renderer, raycaster, gameHolder, INTERSECT;

// Display Settings
let pixelation = 0.35;

// Game Item Objects
let player, playerGhost;
let cube, cube2, wall, wall2, manhole, wolf;
let touchables;

// mouse y
let mouse = new THREE.Vector2();
let mousePos;

init();
animate();

function init(){
    console.log(localStorage["item"]==undefined);
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
    let markGeometry = new THREE.CubeGeometry(150,50,5);
    let markMesh = new THREE.MeshPhongMaterial({color:"gray", map: markTexture});
    wall = new THREE.Mesh(markGeometry,markMesh);
    wall.userData.clickMessage = "a sturdy looking brick wall";
    wall.position.set(-40,20,-80);
    wall.updateMatrixWorld();
    wall.name="wall";
    scene.add(wall);

    //wolff
    const loader = new FBXLoader();
	loader.load( './models/Wolf.fbx', function ( object ) {
        object.position.set(-50,0,-40);
        object.lookAt(player.position);
        object.scale.set(0.3,0.3,0.3);
        object.material = markTexture;
        wolf = object;
        wolf.name="wolf";
        wolf.userData.clickMessage = "doggie";
		scene.add( wolf);
        });
        
    let crateTexture = new THREE.TextureLoader().load("./img/crate.jpg");
    cube = new THREE.Mesh(new THREE.CubeGeometry(15,15,15), new THREE.MeshPhongMaterial({flatShading:true, map:crateTexture}));
    cube2 = new THREE.Mesh(new THREE.CubeGeometry(15,15,15), new THREE.MeshPhongMaterial({flatShading:true, map:crateTexture}));
    scene.add(cube);
    cube.position.set(-50,4,-10);
    scene.add(cube2);
    cube2.position.set(50,4,-10);
    cube.userData.clickMessage ="looks like a sturdy wooden crate";
    cube2.userData.clickMessage ="who's leaving all these crates around, anyway?";
    cube.name="cube";
    cube2.name="cube2";
    cube.updateMatrixWorld();
    cube2.updateMatrixWorld();

    let manholeTexture = new THREE.TextureLoader().load("./img/manhole.png");
    let manholeGeometry = new THREE.PlaneBufferGeometry(20,20);
    let manholeMesh = new THREE.MeshBasicMaterial({color:"0x000000",map:manholeTexture, transparent:true});
    manhole = new THREE.Mesh(manholeGeometry, manholeMesh);
    manhole.rotation.x = - Math.PI/2;
    manhole.userData.clickMessage = "looks dirty, i wouldn't touch it";
    manhole.position.set(-30,-4.9,30);
    manhole.name="manhole";
    scene.add(manhole);

    // arranging the stuff
    playerGhost = new THREE.Mesh(new THREE.CubeGeometry(8,25,8), new THREE.MeshPhongMaterial({flatShading:true, wireframe:true}));
    player = new THREE.Mesh(new THREE.CubeGeometry(8,25,8), new THREE.MeshPhongMaterial({flatShading:true, wireframe:true}));
    player.userData = {
        name:"player",
        clickMessage:"doggie!",
        step: 0,
        path: new THREE.Line3(),
        pathPos: 0,
        target: new THREE.Vector3()
    };
    player.visible = false;
    playerGhost.visible = false;
    player.name="player";
    scene.add(player);
    scene.add(playerGhost);
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

    touchables = [wall,cube,cube2];
    const geometry = new THREE.CylinderBufferGeometry( 0, 10, 30, 4, 1 );
    const material = new THREE.MeshPhongMaterial( {  map: gt } );
    
    for(let i = 0; i < 100; i++){
        let size = Math.random() * 150;
        let box = new THREE.Mesh(new THREE.CubeGeometry(Math.random() * 150,Math.random() * 150,Math.random() * 150), new THREE.MeshPhongMaterial({flatShading:true, map:crateTexture}));
        box.position.x = Math.random() * 1600 - 800;
		box.position.y = size*0.4;
        box.position.z = Math.random() * 1600 - 800;
        box.userData.clickMessage = "smells like burnt pine";
        touchables.push(box);
        scene.add(box);
    }
    // interact with the outer page
    // add game eventlisteners to the gameHolder
    gameHolder.appendChild(renderer.domElement);
    gameHolder.addEventListener('mousedown', mouseDownHandler, false);
    gameHolder.addEventListener('touchend', mouseDownHandler, false);
    gameHolder.addEventListener('mouseup', mouseUpHandler, false);
    gameHolder.addEventListener('touchstart', mouseUpHandler, false);
    gameHolder.addEventListener('mousemove', mouseMoveHandler, false);
    document.getElementById("jank-o-meter").addEventListener('change', jank, false);
    document.getElementById("hitbox-toggle").addEventListener('change', hitbox, false);
    document.getElementById("save-button").addEventListener('click', saveData, false);
    document.getElementById("load-button").addEventListener('click', loadData, false);
    document.getElementById("clear-button").addEventListener('click', clearData, false);

    window.addEventListener('resize', onWindowResize, false);
    animate();
}
function saveData(){
    if(player.userData.pathPos ==1){
        alert("saving position");
        localStorage["player-position"] = `${player.position.x}~${player.position.y}~${player.position.z}`;
        localStorage["camera-position"] = `${camera.position.x}~${camera.position.y}~${camera.position.z}`;;
    }
    else{
        alert("stand still to save");
    }
}
function loadData(){
    if(localStorage["player-position"] != undefined){
        let tempP = localStorage["player-position"].split("~");
        player.position.set(parseFloat(tempP[0]),parseFloat(tempP[1]),parseFloat(tempP[2]));
        wolf.position.set(parseFloat(tempP[0]),parseFloat(tempP[1]),parseFloat(tempP[2]));
        playerGhost.position.set(parseFloat(tempP[0]),parseFloat(tempP[1]),parseFloat(tempP[2]));
        let tempC = localStorage["camera-position"].split("~");
        camera.position.set(parseFloat(tempC[0]),parseFloat(tempC[1]),parseFloat(tempC[2]));
        camera.lookAt(player.position);
    }
    else{
        alert("problem: no data");
    }
}
function clearData(){
    localStorage.clear();
}
function jank(event){
    pixelation = document.getElementById('jank-o-meter').value*0.08;
    console.log(pixelation);
    renderer.setPixelRatio(window.devicePixelRatio*pixelation);
}
function hitbox(){
    player.visible = !player.visible;
    playerGhost.visible = !playerGhost.visible;
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
        //console.log("click");
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
            //console.log(player);
            player.userData.target = new THREE.Vector3(intersects[0].point.x,0,intersects[0].point.z);
            console.log(intersects[0].point.x +"    " +intersects[0].point.z);
            //console.log(somethingInTheWay(player.position, player.userData.target));
            if(!somethingInTheWay(player.position,player.userData.target)){
                player.userData.path = new THREE.Line3();
                player.userData.path.set(player.position, player.userData.target);
                player.userData.step = 0.3/player.userData.path.distance();
                player.userData.pathPos = 0;
            }
            
        }
        else if(intersects.length > 1){
            for(let item of intersects){
                if(item.object.userData.clickMessage!=undefined){
                    if(item.object.position.distanceTo(player.position) < 150)
                        document.getElementById("game-message").innerText = item.object.userData.clickMessage;
                    else
                        document.getElementById("game-message").innerText = "you can't tell what that is from this far away";
                    //perhaps have the user look at the thing as well? have to do more 
                    // raycasting to get the exact point though...
                }
            }
            console.log(intersects);
        }
    }
    else{
        //console.log("drag");
    }
}
//  detects if an 'object' is in the way of a planned path
function somethingInTheWay(start, direction){
    let hit = false;
    playerGhost.position.set(start.clone());
    let walkLine = new THREE.Line3();
    walkLine.set(start, direction);
    for(let i = 0; i < 1; i+=0.001){
        let thisSpot = new THREE.Vector3();
        walkLine.at(i,thisSpot);
        playerGhost.position.set(thisSpot.x, thisSpot.y,thisSpot.z);
        for (var vertexIndex = 0; vertexIndex < playerGhost.geometry.vertices.length; vertexIndex++)
        {		
            var localVertex = playerGhost.geometry.vertices[vertexIndex].clone();
            var globalVertex = localVertex.applyMatrix4( playerGhost.matrix );
            var directionVector = globalVertex.sub( playerGhost.position );
            
            var ray = new THREE.Raycaster( thisSpot, directionVector.clone().normalize() );
            var collisionResults = ray.intersectObjects( touchables );
            if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) 
                hit = true;
        }	
    }
    document.getElementById("game-message").innerText = hit ? "there appears to be something in the way" : "on the move";
    return hit;
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
        let newPosition = new THREE.Vector3;
        player.userData.path.at(player.userData.pathPos, newPosition);
        newPosition.y = -1;
        let xDif = newPosition.x - player.position.x;
        let yDif = newPosition.y - player.position.y;
        let zDif = newPosition.z - player.position.z;
        camera.position.set(camera.position.x + xDif,camera.position.y + yDif, camera.position.z + zDif);
        player.position.set(newPosition.x,newPosition.y,newPosition.z);
        player.lookAt(newPosition);
        if(scene.getObjectByName("wolf")!=undefined){
            scene.getObjectByName("wolf").lookAt(newPosition);
            scene.getObjectByName("wolf").position.set(newPosition.x,-1,newPosition.z);
        }
        player.userData.pathPos += player.userData.step;
    }
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