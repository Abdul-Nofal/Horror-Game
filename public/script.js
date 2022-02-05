eruda.init();

import * as THREE from "https://cdn.skypack.dev/three@0.136.0";

import { PointerLockControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/PointerLockControls.js";

import { FBXLoader } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/FBXLoader.js";

let scene, camera, renderer, controls, clock;

let keyboard = {};
let player = {
  speed: .08,
  feetRay: new THREE.Raycaster(),
  isCrouching: false
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
    if(!options.color) {
      options.color = new Color("#686868");
    }
    this.material = new THREE.MeshBasicMaterial();
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
    
    if(options.clip) {
      this.mesh.clip = options.clip;
    }
    
    this.direction = new THREE.Vector3();
    this.mesh.getWorldDirection(this.direction);
    if(Math.abs(this.direction.x) === Math.max(Math.abs(this.direction.x), Math.abs(this.direction.y), Math.abs(this.direction.z))) {
      this.mesh.material.color = new THREE.Color(options.color.light || 0x00ff00);
    }else if(Math.abs(this.direction.y) === Math.max(Math.abs(this.direction.x), Math.abs(this.direction.y), Math.abs(this.direction.z))) {
      this.mesh.material.color = new THREE.Color(options.color.dark || 0x00ff00);      
    }else {
      this.mesh.material.color = new THREE.Color(options.color.hex || 0x00ff00);
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
    if(!options.color) {
      options.color = new Color("#686868");
    }

    this.texture = new THREE.TextureLoader().load(options.map || "/assets/textures/floor.jpg");
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    this.texture.repeat.set(sx/3.5, sy/3.5);

    this.material = new THREE.MeshBasicMaterial({         side: THREE.DoubleSide
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

    this.direction = new THREE.Vector3();
    this.mesh.getWorldDirection(this.direction);
    if(Math.abs(this.direction.x) === Math.max(Math.abs(this.direction.x), Math.abs(this.direction.y), Math.abs(this.direction.z))) {
      this.mesh.material.color = new THREE.Color(options.color.light || 0x00ff00);
    }else if(Math.abs(this.direction.y) === Math.max(Math.abs(this.direction.x), Math.abs(this.direction.y), Math.abs(this.direction.z))) {
      this.mesh.material.color = new THREE.Color(options.color.dark || 0x00ff00);      
    }else {
      this.mesh.material.color = new THREE.Color(options.color.hex || 0x00ff00);
    }
    scene.add(this.mesh);
  }
}

class Lamp {
  constructor(x, y, z, size=1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.size = size*.24;
    this.downed = false;
    var scope = this;
    this.loader = new FBXLoader();
    this.loader.setPath("/assets/lamp/");
    this.loader.load("lamp.fbx", fbx => {
      fbx.scale.setScalar(this.size);
      fbx.traverse(child => {
        if(child.isMesh) {
          child.material = new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("assets/lamp/lamp_texture.png")});
          child.material.map.magFilter = THREE.NearestFilter;
          child.material.map.minFilter = THREE.LinearMipMapLinearFilter;
        }
      });
      fbx.position.x = x;
      fbx.position.y = y;
      fbx.position.z = z;
      scope.model = fbx;
      scope.model.canFall = true;
      scope.model.scope = scope;
      scene.add(fbx);
      blocks.push(scope.model);
    });
  }
  fall() {
    if(!this.downed) {
      this.downed = true;
      var scope = this;
      var playerPos = {
        x: camera.position.x,
        z: camera.position.z
      };
      var rot = 0;
      var fallAnim = setInterval(function(){
        scope.model.rotateOnAxis(new THREE.Vector3(playerPos.x - scope.model.position.x, 0, playerPos.z - scope.model.position.z).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), -90 * Math.PI/180), 1 * Math.PI/180);
        if(rot >= 90) {
          clearInterval(fallAnim);
          setTimeout(function() {
            scope.model.rotateOnAxis(new THREE.Vector3(playerPos.x - scope.model.position.x, 0, playerPos.z - scope.model.position.z).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), -90 * Math.PI/180), -90 * Math.PI/180);
            scope.downed = false;
          }, 6000);
        }else {
          rot++;
        }
      }, 1);
    }
  }
}

class Closet {
  constructor(x, y, z, size=1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.size = size*.7;
    this.downed = false;
    var scope = this;
    this.loader = new FBXLoader();
    this.loader.setPath("/assets/closet/");
    this.loader.load("closet.fbx", fbx => {
      fbx.scale.setScalar(this.size);
      fbx.traverse(child => {
        if(child.isMesh) {
          child.material = new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("assets/closet/closet_texture.png")});
          child.material.map.magFilter = THREE.NearestFilter;
          child.material.map.minFilter = THREE.LinearMipMapLinearFilter;
        }
      });
      fbx.position.x = x;
      fbx.position.y = y;
      fbx.position.z = z;
      scope.model = fbx;
      scope.model.scope = scope;
      scene.add(fbx);
      blocks.push(scope.model);
    });
  }
}

class Color {
  constructor(hex, intensity=15) {
    this.hex = hex;
    this.dark = this.adjust(hex, -intensity);
    this.light = this.adjust(hex, intensity);
  }
  adjust(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
  }
}

let black = new Color("#181818");
let white = new Color("#E7E7E7");
let grey = new Color("#686868");
let blue = new Color("#2e5984");

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

  clock = new THREE.Clock();


  BuildHouse();
}

// Update
function Update() {
  requestAnimationFrame(Update);
  Movement();

  // Player Gravity
  player.feetRay.set(camera.position, new THREE.Vector3(0, -1, 0));

	const intersects = player.feetRay.intersectObjects( scene.children );

	for ( let i = 0; i < intersects.length; i ++ ) {
    console.log(intersects[i]);
    if(intersects[i].distance > (player.isCrouching ? 1.1 : 2.1)) {
      camera.position.y -= .1;
    }else if(intersects[i].distance < (player.isCrouching ? 0.9 : 1.9)) {
      camera.position.y += .1;
    }else {
      camera.position.y = intersects[i].point.y + (player.isCrouching ? 1 : 2);
    }
  }
  renderer.render(scene, camera);
};

function Movement() {
  if(keyboard[87] || keyboard[83] || keyboard[65] || keyboard[68]) {
    if(keyboard[16]) {
      player.speed = .03;
      player.isCrouching = true;
    }else {
      player.speed = .08;
      player.isCrouching = false;
    }

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
      blocks[i].isCollision = true;
      let boundingBox = new THREE.Box3().setFromObject(blocks[i]);
      let size = new THREE.Vector3();
      let center = new THREE.Vector3();
      boundingBox.getSize(size);
      boundingBox.getCenter(center);
      if(blocks[i].clip) {
        v = .1;
      }else {
        v = .2;
      }
      if (
        camera.position.x <= center.x + size.x / 2 + v &&
        camera.position.x >= center.x - size.x / 2 - v &&
        camera.position.z <= center.z + size.z / 2 + v &&
        camera.position.z >= center.z - size.z / 2 - v &&
        camera.position.y <= center.y + size.y / 2 + v &&
        camera.position.y >= center.y - size.y / 2 - v
      ) {
        if(blocks[i].canFall) {
          blocks[i].scope.fall();
        }else {
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
}
function BuildHouse() {
  // ***** MAIN FLOOR *****
  // Master Bedroom
  new Wall(0, 0, 0, 35, 4, {
    color: white
  });
  new Wall(3.5*5, 0, 3.5*3, 3.5*6, 4, {
    rotation: {
      y: 90
    },
    color: white
  });
  new Wall(-3.5*5, 0, 3.5*3, 3.5*6, 4, {
    rotation: {
      y: 90
    },
    color: white
  });
  new Wall(-3.5*2.875, 0, 3.5*6, 3.5*4.25, 4, {
    color: white
  });
  new Wall(3.5*2.875, 0, 3.5*6, 3.5*4.25, 4, {
    color: white
  });
  new Floor(0, 0, 3.5*3, 10*3.5, 6*3.5, {
    color: black
  });
  new Floor(0, 4, 3.5*3, 10*3.5, 6*3.5, {
    color: grey
  });

  // Hall
  new Wall(.75*3.5, 0, 10*3.5, 3.5*8, 4, {
    rotation: {
      y: 90
    },
    color: white 
  });
  new Wall(-.75*3.5, 0, 6.5*3.5, 3.5*1, 4, {
    rotation: {
      y: 90
    },
    color: white
  });

  new Wall(-.75*3.5, 0, 10*3.5, 3.5*4, 4, {
    rotation: {
      y: 90
    },
    color: white
  });
  new Wall(.75*3.5, 0, 17.375*3.5, 5.25*3.5, 4, {
    rotation: {
      y: 90
    },
    color: white
  });
  new Wall(.75*3.5, 0, 21.5*3.5, 1*3.5, 4, {
    rotation: {
      y: 90
    },
    color: white
  });
  new Floor(0, 0, 14*3.5, 1.5*3.5, 16*3.5, {
    color: black
  });
  new Floor(0, 4, 14*3.5, 1.5*3.5, 16*3.5, {
    color: grey
  });

  // Guest Bedroom
  new Wall(-3.25*3.5, 0, 12*3.5, 5*3.5, 4, {
    color: white
  });
  new Wall(-3.25*3.5, 0, 18*3.5, 5*3.5, 4, {
    color: white
  });
  new Wall(-5.75*3.5, 0, 15*3.5, 6*3.5, 4, {
    rotation: {
      y: 90
    },
    color: white
  });
  new Wall(-.75*3.5, 0, 14.625*3.5, 5.25*3.5, 4, {
    rotation: {
      y: 90
    },
    color: white
  });
  new Floor(-3.25*3.5, 0, 15*3.5, 5*3.5, 6*3.5, {
    color: black
  });
  new Floor(-3.25*3.5, 4, 15*3.5, 5*3.5, 6*3.5, {
    color: grey
  });

  // Closet
  new Wall(1.75*3.5, 0, 14*3.5, 3.5*2, 4, {
    color: white
  });
  new Wall(2.75*3.5, 0, 15*3.5, 3.5*2, 4, {
    rotation: {
      y: 90
    },
    color: white
  });
  new Wall(1.75*3.5, 0, 16*3.5, 3.5*2, 4, {
    color: white
  });
  new Floor(1.75*3.5, 0, 15*3.5, 2*3.5, 2*3.5, {
    color: black
  });
  new Floor(1.75*3.5, 4, 15*3.5, 2*3.5, 2*3.5, {
    color: grey
  });

  // Backroom
  new Wall(-.75*3.5, 0, 23.5*3.5, 11*3.5, 4, {
    rotation: {
      y: 90
    },
    color: white
  });
  new Wall(.375*3.5, 0, 22*3.5, .75*3.5, 4, {
    color: white
  });
  new Wall(0, 0, 24*3.5, 4*3.5, 4, {
    rotation: {
      y: 90
    },
    color: white
  });
  new Wall(1.5*3.5, 0, 26*3.5, 3*3.5, 4, {
    color: white
  });
  new Wall(3*3.5, 0, 27.5*3.5, 3*3.5, 4, {
    rotation: {
      y: 90
    },
    color: white
  });
  new Wall(1.125*3.5, 0, 29*3.5, 3.75*3.5, 4, {
    color: white
  });
  new Floor(-.375*3.5, 0, 24*3.5, .75*3.5, 4*3.5, {
    color: black
  });
  new Floor(-.375*3.5, 4, 24*3.5, .75*3.5, 4*3.5, {
    color: grey
  });
  new Floor(1.125*3.5, 0, 27.5*3.5, 3.75*3.5, 3*3.5, {
    color: black
  });
  new Floor(1.125*3.5, 4, 27.5*3.5, 3.75*3.5, 3*3.5, {
    color: grey
  });
}

window.onload = function() {
  Start();
  Update();
}

window.onkeydown = function(e) {
  keyboard[e.keyCode] = true;
  if(e.key === "f") {
    l1.fall();
  }
}

window.onkeyup = function(e) {
  keyboard[e.keyCode] = false;
}

window.onclick = function() {
  controls.lock();
}

window.onresize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}