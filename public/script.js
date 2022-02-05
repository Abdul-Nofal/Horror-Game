eruda.init();

import * as THREE from "https://cdn.skypack.dev/three@0.136.0";

import { PointerLockControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/PointerLockControls.js";

let scene, camera, renderer, controls;
let keyboard = {};
let player = {
  speed: .23
}

let v = .2;

let blocks = [];

let checker = new THREE.TextureLoader().load("/assets/textures/wall.png");
checker.wrapS = THREE.RepeatWrapping;
checker.wrapT = THREE.RepeatWrapping;
checker.repeat.set(2, 3);

class Wall {
  constructor(x, y, z, sx, sy, options={}) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.sx = sx;
    this.sy = sy;
    this.options = options;
    this.material = new THREE.MeshBasicMaterial({
      color: options.color || 0xbd4b48,
    });
    this.geometry = new THREE.BoxGeometry(sx, sy, options.clip ? 0.07 : 0.08);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.x = x;
    this.mesh.position.y = y + sy/2;
    this.mesh.position.z = z;

    if(options.rotation) {
      this.mesh.rotation.x = options.rotation.x * Math.PI/180 || 0;
      this.mesh.rotation.y = options.rotation.y * Math.PI/180 || 0;
      this.mesh.rotation.z = options.rotation.z * Math.PI/180 || 0;
    }
  
    //this.mesh.material.map.repeat.set(sx/sy, 1);

    if(options.clip) {
      this.mesh.clip = options.clip;
    }
    scene.add(this.mesh);
    blocks.push(this.mesh);
  }
}

class Floor {
  constructor(x, y, z, sx, sy, options={}) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.sx = sx;
    this.sy = sy;
    this.options = options;
    this.texture = new THREE.TextureLoader().load(options.map || "/assets/textures/floor.jpg");
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    this.texture.repeat.set(sx/3.5, sy/3.5);

    this.material = new THREE.MeshBasicMaterial({
      color: options.color || 0xbd4b48,
      //map: this.texture,
      side: THREE.DoubleSide
    });
    this.geometry = new THREE.PlaneGeometry(sx, sy);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.x = x;
    this.mesh.position.y = y;
    this.mesh.position.z = z;

    this.mesh.rotation.x = -Math.PI/2;

    if(options.rotation) {
      this.mesh.rotation.x = options.rotation.x * Math.PI/180 || Math.PI/2;
      this.mesh.rotation.y = options.rotation.y * Math.PI/180 || 0;
      this.mesh.rotation.z = options.rotation.z * Math.PI/180 || 0;
    }

    if(options.clip) {
      this.mesh.clip = options.clip;
    }
    scene.add(this.mesh);
  }
}

// Start
function Start() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x091420);

  // Camera
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

  // Renderer
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  // Controls
  controls = new PointerLockControls(camera, renderer.domElement);
  camera.position.z = 5;
  camera.position.y = 2;

  BuildHouse();
}

// Update
function Update() {
  requestAnimationFrame(Update);
  Movement();
  renderer.render(scene, camera);
};

function Movement() {
  if(keyboard[87] || keyboard[83] || keyboard[65] || keyboard[68]) {
    if(keyboard[87]) {
      controls.moveForward(player.speed);
    }
    if(keyboard[83]) {
      controls.moveForward(-player.speed);
    }
    if(keyboard[65]) {
      controls.moveRight(-player.speed/1.5);
    }
    if(keyboard[68]) {
      controls.moveRight(player.speed/1.5);
    }
    for (let i = 0; i < blocks.length; i++) {
      let boundingBox = new THREE.Box3().setFromObject(blocks[i]);
      let size = new THREE.Vector3();
      boundingBox.getSize(size);
      if(blocks[i].clip) {
        v = .1;
      }else {
        v = .2;
      }
      if (
        camera.position.x <= blocks[i].position.x + size.x / 2 + v &&
        camera.position.x >= blocks[i].position.x - size.x / 2 - v &&
        camera.position.z <= blocks[i].position.z + size.z / 2 + v &&
        camera.position.z >= blocks[i].position.z - size.z / 2 - v
      ) {
        if(keyboard[87]) {
          controls.moveForward(-player.speed);
        }
        if(keyboard[83]) {
          controls.moveForward(player.speed);
        }
        if(keyboard[65]) {
          controls.moveRight(player.speed/1.5);
        }
        if(keyboard[68]) {
          controls.moveRight(-player.speed/1.5);
        }
      }
    }
  }
}

function BuildHouse() {
  // Master Bedroom
  new Wall(0, 0, 0, 35, 4, {
    color: 0xaa4441
  });
  new Wall(3.5*5, 0, 3.5*3, 3.5*6, 4, {
    rotation: {
      y: 90
    }
  });
  new Wall(-3.5*5, 0, 3.5*3, 3.5*6, 4, {
    rotation: {
      y: 90
    }
  });
  new Wall(-3.5*2.875, 0, 3.5*6, 3.5*4.25, 4, {
    color: 0xaa4441
  });
  new Wall(3.5*2.875, 0, 3.5*6, 3.5*4.25, 4, {
    color: 0xaa4441
  });
  new Floor(0, 0, 3.5*3, 10*3.5, 6*3.5, {
    color: 0x973c3a
  });
  new Floor(0, 4, 3.5*3, 10*3.5, 6*3.5, {
    color: 0x973c3a
  });

  
}

window.onload = function() {
  Start();
  Update();
}

window.onkeydown = function(e) {
  keyboard[e.keyCode] = true;
}

window.onkeyup = function(e) {
  keyboard[e.keyCode] = false;
}

window.onclick = function() {
  controls.lock();
}