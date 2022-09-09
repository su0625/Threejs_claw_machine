let scene, renderer, camera
let cameraControl, stats, gui
let usagiObj,piskeObj
let Speed = 0

// Cannon.js
var world
let groundBody,groundCM,gripperRGroup,gripperRCM
let friction = 0.5
let restitution = 0.7

// Usagi初始位置
let usagi_init_x = 0
let usagi_init_y = 5.1
let usagi_init_z = 0

// 夾爪初始位置
let gripperR_init_x = -3.8
let gripperR_init_y = 9.5
let gripperR_init_z = 1
let gripperL_init_x = -6.8
let gripperL_init_y = 9.5
let gripperL_init_z = 1

// gltf
var glass_load_flag = false

class Usagi{
    constructor(){
        const headGeo = new THREE.BoxGeometry(1.5, 1, 1);
        const earGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25);

        //設定 Usagi 圖案
        const headTexture = new THREE.TextureLoader().load('images/Usagi_face.jpg')
        const earTexture = new THREE.TextureLoader().load('images/Usagi_ear.jpg')
        
        // 每一面同圖案
        const earMaterial = new THREE.MeshLambertMaterial({map:earTexture})

        // 只給一面有臉
        const headMaterials = []
        for (let i = 0; i < 6; i++) {
            let map

            if (i === 4){
                map = headTexture
            }
            else map = earTexture

            headMaterials.push(new THREE.MeshStandardMaterial({ map: map }))
        }

        //設定部位
        this.head = new THREE.Mesh(headGeo,headMaterials)
        this.head.position.set(0,0,0)
        this.ear1 = new THREE.Mesh(earGeo,earMaterial)
        this.ear1.position.set(-0.25,0.5,0)
        this.ear2 = new THREE.Mesh(earGeo,earMaterial)
        this.ear2.position.set(0.25,0.5,0)

        // 組合
        this.usagi = new THREE.Group()
        this.usagi.add(this.head)
        this.usagi.add(this.ear1)
        this.usagi.add(this.ear2)

        this.usagi.traverse(function(object) {
            if (object instanceof THREE.Mesh) {
              object.castShadow = true
              object.receiveShadow = true
            }
        })
    }
}

// 加入場景
function createUsagi(){
    usagiObj = new Usagi()
    usagiObj.usagi.position.x = 0
    usagiObj.usagi.position.y = 0
    usagiObj.usagi.position.z = 12
    scene.add(usagiObj.usagi)
}

class Piske{
    constructor(){
        const headGeo = new THREE.BoxGeometry(1.5, 1, 1);

        //設定 Piske 圖案
        const headTexture = new THREE.TextureLoader().load('images/Piske_face.jpg')
        const bodyTexture = new THREE.TextureLoader().load('images/Piske_body.jpg')

        // 只給一面有臉
        const headMaterials = []
        for (let i = 0; i < 6; i++) {
            let map

            if (i === 4){
                map = headTexture
            }
            else map = bodyTexture

            headMaterials.push(new THREE.MeshStandardMaterial({ map: map }))
        }

        //設定部位
        this.head = new THREE.Mesh(headGeo,headMaterials)
        this.head.position.set(0,0,0)

        // 組合
        this.piske = new THREE.Group()
        this.piske.add(this.head)

        this.piske.traverse(function(object) {
            if (object instanceof THREE.Mesh) {
              object.castShadow = true
              object.receiveShadow = true
            }
        })
    }
}

// 加入場景
function createPiske(){
    piskeObj = new Piske()
    piskeObj.piske.position.x = 3
    piskeObj.piske.position.y = 0.5
    piskeObj.piske.position.z = 12
    scene.add(piskeObj.piske)
}
  
// 建立監測器
function initStats() {
    const stats = new Stats()
    stats.setMode(0)
    document.getElementById('stats').appendChild(stats.domElement)
    return stats
}

// 初始化
function init() {
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(0, 10, 30)
    camera.lookAt(scene.position)
  
    statsUI = initStats()

    // 建立渲染器
    renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    // 設定背景顏色
    renderer.setClearColor(0xeeeeee, 1.0)
    renderer.shadowMap.enabled = true 
    // 陰影貼圖種類   
    renderer.shadowMap.type = 2
        
    // 設置環境光提供輔助柔和白光
    let ambientLight = new THREE.AmbientLight(0x404040)
    scene.add(ambientLight)
    // 設置聚光燈幫忙照亮物體
    let spotLight = new THREE.SpotLight(0xf0f0f0)
    spotLight.position.set(-10, 30, 20)
    scene.add(spotLight)

    // 建立光源
    let pointLight = new THREE.PointLight(0xccffcc, 1, 100)
    pointLight.castShadow = true // 投影
    pointLight.position.set(-30, 30, 30)
    scene.add(pointLight)
  
    //建立軌道控制器   
    cameraControl = new THREE.OrbitControls(camera, renderer.domElement)
    // 啟用阻尼效果
    cameraControl.enableDamping = true
    // 阻尼系數
    cameraControl.dampingFactor = 0.05
  
    //物件加入場景   
    createUsagi()
    createPiske()
    base_loader()
    glass_outer_loader()
    
  // 將渲染器的 DOM 綁到網頁上
  document.body.appendChild(renderer.domElement)
}

function initCannon(){
  // 建立Cannon世界
  world = new CANNON.World()
  // 設定重力場為 y 軸 -9.8 m/s²
  world.gravity.set(0, -9.8, 0)
  // 碰撞偵測
  world.broadphase = new CANNON.NaiveBroadphase()

  // 建立地板剛體
  let groundShape = new CANNON.Plane()
  groundCM = new CANNON.Material()
  groundBody = new CANNON.Body({
    mass: 0,
    shape: groundShape,
    material: groundCM
  })
  // setFromAxisAngle 地板沿著X軸轉90度
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
  world.add(groundBody)

  // 地板網格
  let groundGeometry = new THREE.PlaneGeometry(30, 30, 30)
  let groundtexture = new THREE.TextureLoader().load('images/map.png')
  let groundMaterial = new THREE.MeshLambertMaterial({
    map:groundtexture,side: THREE.DoubleSide,
  })
  let ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // gripperR 剛體
  let gripperRShape = new CANNON.Box(new CANNON.Vec3(0.6, 0.1, 0.3))
  gripperRCM = new CANNON.Material()
  gripperRBody = new CANNON.Body({
    mass: 0,
    shape: gripperRShape,
    position: new CANNON.Vec3(gripperR_init_x, gripperR_init_y, gripperR_init_z),
    material: gripperRCM
  })
  world.add(gripperRBody)

  // gripperR 網格
  const gripperRGeo = new THREE.BoxGeometry(1.2, 0.2, 0.6);
  const gripperRMat = new THREE.MeshPhongMaterial({
    color: 0x4287f5,
  });
  gripperR = new THREE.Mesh(gripperRGeo, gripperRMat);
  gripperR.castShadow = true
  scene.add(gripperR);

  // gripperRTop 剛體
  let gripperRTopShape = new CANNON.Box(new CANNON.Vec3(0.2, 0.5, 0.25))
  gripperRTopCM = new CANNON.Material()
  gripperRTopBody = new CANNON.Body({
    mass: 5,
    shape: gripperRTopShape,
    position: new CANNON.Vec3(gripperR_init_x+0.4, gripperR_init_y+0.5, gripperR_init_z),
    material: gripperRTopCM
  })
  world.add(gripperRTopBody)

  // gripperRTop 網格
  const gripperRTopGeo = new THREE.BoxGeometry(0.4, 1, 0.5);
  const gripperRTopMat = new THREE.MeshPhongMaterial({
    color: 0x4287f5,
  });
  gripperRTop = new THREE.Mesh(gripperRTopGeo, gripperRTopMat);
  gripperRTop.castShadow = true
  scene.add(gripperRTop)

  // gripperR 網格組裝   
  gripperRBodyJoint = new CANNON.LockConstraint(gripperRBody,gripperRTopBody)
  world.addConstraint(gripperRBodyJoint)

  // gripperL剛體
  let gripperLShape = new CANNON.Box(new CANNON.Vec3(0.6, 0.1, 0.25))
  let gripperLCM = new CANNON.Material()
  gripperLBody = new CANNON.Body({
    mass: 0,
    shape: gripperLShape,
    position: new CANNON.Vec3(gripperL_init_x, gripperL_init_y, gripperL_init_z),
    material: gripperLCM,
  })
  world.add(gripperLBody)

  // gripperL網格
  const gripperLGeo = new THREE.BoxGeometry(1.2, 0.2, 0.5);
  const gripperLMat = new THREE.MeshPhongMaterial({
    color: 0x4287f5,
  });
  gripperL = new THREE.Mesh(gripperLGeo, gripperLMat);
  gripperL.castShadow = true
  scene.add(gripperL);

  // gripperLTop 剛體
  let gripperLTopShape = new CANNON.Box(new CANNON.Vec3(0.2, 0.5, 0.25))
  gripperLTopCM = new CANNON.Material()
  gripperLTopBody = new CANNON.Body({
    mass: 5,
    shape: gripperLTopShape,
    position: new CANNON.Vec3(gripperL_init_x-0.4, gripperL_init_y+0.5, gripperL_init_z),
    material: gripperLTopCM
  })
  world.add(gripperLTopBody)

  // gripperLTop 網格
  const gripperLTopGeo = new THREE.BoxGeometry(0.4, 1, 0.5);
  const gripperLTopMat = new THREE.MeshPhongMaterial({
    color: 0x4287f5,
  });
  gripperLTop = new THREE.Mesh(gripperLTopGeo, gripperLTopMat);
  gripperLTop.castShadow = true
  scene.add(gripperLTop)

  // gripperL 網格組裝
  gripperLBodyJoint = new CANNON.LockConstraint(gripperLBody,gripperLTopBody)
  world.addConstraint(gripperLBodyJoint)
}

function initClawMachineCannon(){  
    // 建立機台地板剛體 
    let machineBottom = new CANNON.Box(new CANNON.Vec3(3.4, 0.1, 3))
    let machineBottomMaterial = new CANNON.Material()
    machineBottomBody = new CANNON.Body({
        shape: machineBottom,
        position: new CANNON.Vec3(-0.4, 4.5, 0),
        material: machineBottomMaterial,
    })
    world.add(machineBottomBody)

    // 機台地板網格
    const machineBottomGeo = new THREE.BoxGeometry(6.8, 0.2, 6);
    const machineBottomMat = new THREE.MeshPhongMaterial({
        color: 0x000000,
    });
    machine = new THREE.Mesh(machineBottomGeo, machineBottomMat);
    machine.castShadow = true
    scene.add(machine);

    // 右牆壁剛體
    let wallshape = new CANNON.Box(new CANNON.Vec3(0.1, 2, 3))
    let wallMaterial = new CANNON.Material()
    wallBody = new CANNON.Body({
        shape: wallshape,
        position: new CANNON.Vec3(3, 6.5, 0),
        material: wallMaterial,
    })
    world.add(wallBody)

    // 右牆壁網格
    const wallGeo = new THREE.BoxGeometry(0.2, 4, 6);
    const wallMat = new THREE.MeshPhongMaterial({
        color: 0x4287f5,
    });
    wall = new THREE.Mesh(wallGeo, wallMat);
    wall.castShadow = true
    scene.add(wall);

    // 左牆壁剛體
    let wallLshape = new CANNON.Box(new CANNON.Vec3(0.1, 3.7, 3))
    let wallLMaterial = new CANNON.Material()
    wallLBody = new CANNON.Body({
        shape: wallLshape,
        position: new CANNON.Vec3(-7.3, 4.8, 0),
        material: wallLMaterial,
    })
    world.add(wallLBody)

    // 左牆壁網格
    const wallLGeo = new THREE.BoxGeometry(0.2, 7.4, 6);
    const wallLMat = new THREE.MeshPhongMaterial({
        color: 0x4287f5,
    });
    wallL = new THREE.Mesh(wallLGeo, wallLMat);
    wallL.castShadow = true
    scene.add(wallL);

    // 夾板剛體
    let swallshape = new CANNON.Box(new CANNON.Vec3(0.1, 2.5, 3))
    let swallMaterial = new CANNON.Material()
    swallBody = new CANNON.Body({
        shape: swallshape,
        position: new CANNON.Vec3(-3.8, 3.4, 0),
        material: swallMaterial,
    })
    world.add(swallBody)

    //夾板網格
    const swallGeo = new THREE.BoxGeometry(0.2, 5, 6);
    const swallMat = new THREE.MeshPhongMaterial({
        color: 0x4287f5,
    });
    swall = new THREE.Mesh(swallGeo, swallMat);
    swall.castShadow = true
    scene.add(swall);

    // 掉落物地板剛體
    let floorshape = new CANNON.Box(new CANNON.Vec3(1.8, 0.1, 3))
    let floorMaterial = new CANNON.Material()
    floorBody = new CANNON.Body({
        shape: floorshape,
        position: new CANNON.Vec3(-5.6, 1, 0),
        material: floorMaterial,
    })
    world.add(floorBody)

    //掉落物地板網格
    const floorGeo = new THREE.BoxGeometry(3.6, 0.2, 6);
    const floorMat = new THREE.MeshPhongMaterial({
        color: 0x4287f5,
    });
    floor = new THREE.Mesh(floorGeo, floorMat);
    floor.castShadow = true
    scene.add(floor);

    // 背板
    let backwallshape = new CANNON.Box(new CANNON.Vec3(5.2, 2, 0.1))
    let backwallMaterial = new CANNON.Material()
    backwallBody = new CANNON.Body({
        shape: backwallshape,
        position: new CANNON.Vec3(-2.2, 6.5, -3),
        material: backwallMaterial,
    })
    world.add(backwallBody)

    const backwallGeo = new THREE.BoxGeometry(10.5, 4, 0.2);
    const backwallMat = new THREE.MeshPhongMaterial({
        color: 0x1C4265,
        transparent:true,
        // opacity:0.5,
    });
    backwall = new THREE.Mesh(backwallGeo, backwallMat);
    backwall.castShadow = true
    // backwall.position.set(-2.1,6.5,-3)
    scene.add(backwall);

}

function initUsagiCannon(){
// 建立Usagi A 剛體 Sphere(radius)
  let UsagiAShape = new CANNON.Box(new CANNON.Vec3(0.75, 0.1, 0.5))
  UsagiACM = new CANNON.Material()
  UsagiABody = new CANNON.Body({
    mass: 1,
    shape: UsagiAShape,
    position: new CANNON.Vec3(usagi_init_x,usagi_init_y+0.4,usagi_init_z),
    material: UsagiACM,
  })
  world.add(UsagiABody) 

  // Usagi A網格
  const UsagiAGeo = new THREE.BoxGeometry(1.5, 0.2, 1);
  const UsagiAMat = new THREE.MeshPhongMaterial({
    color: 0x4287f5,
  });
  UsagiA = new THREE.Mesh(UsagiAGeo, UsagiAMat);
  UsagiA.castShadow = true
  scene.add(UsagiA);

  // 建立Usagi B 剛體 Sphere(radius)
  let UsagiBShape = new CANNON.Box(new CANNON.Vec3(0.75, 0.1, 0.5))
  let UsagiBCM = new CANNON.Material()
  UsagiBBody = new CANNON.Body({
    mass: 1,
    shape: UsagiBShape,
    position: new CANNON.Vec3(usagi_init_x, usagi_init_y-0.4, usagi_init_z),
    material: UsagiBCM,
  })
  world.add(UsagiBBody)

  // Usagi B網格
  const UsagiBGeo = new THREE.BoxGeometry(1.5, 0.2, 1);
  const UsagiBMat = new THREE.MeshPhongMaterial({
    color: 0x4287f5,
  });
  UsagiB = new THREE.Mesh(UsagiBGeo, UsagiBMat);
  UsagiB.castShadow = true
  scene.add(UsagiB);

  // 建立Usagi C 剛體 Sphere(radius)
  let UsagiCShape = new CANNON.Box(new CANNON.Vec3(0.25, 0.3, 0.25))
  let UsagiCCM = new CANNON.Material()
  UsagiCBody = new CANNON.Body({
    mass: 1,
    shape: UsagiCShape,
    position: new CANNON.Vec3(usagi_init_x, usagi_init_y, usagi_init_z),
    material: UsagiCCM,
  })
  world.add(UsagiCBody)

  // Usagi C網格
  const UsagiCGeo = new THREE.BoxGeometry(0.5, 0.6, 0.5);
  const UsagiCMat = new THREE.MeshPhongMaterial({
    color: 0x4287f5,
  });
  UsagiC = new THREE.Mesh(UsagiCGeo, UsagiCMat);
  UsagiC.castShadow = true
  scene.add(UsagiC);

  // Usagi 剛體組裝
  UsagiBodyJoint1 = new CANNON.LockConstraint(UsagiABody,UsagiBBody)
  world.addConstraint(UsagiBodyJoint1)
  UsagiBodyJoint2 = new CANNON.LockConstraint(UsagiBBody,UsagiCBody)
  world.addConstraint(UsagiBodyJoint2)


  // 設定地板剛體與物體剛體 碰撞時會交互作用
//   UsagiGroundContact = new CANNON.ContactMaterial(gripperRCM, UsagiBCM, {
//     mass:0,
//     friction: 0, 
//     restitution: 0 // 恢復係數, 衡量兩個物體碰撞後反彈程度
//   })
//   world.addContactMaterial(UsagiGroundContact)
}

function initPiskeCannon(){
    // 建立Piske A 剛體 Sphere(radius)
      let PiskeAShape = new CANNON.Box(new CANNON.Vec3(0.75, 0.1, 0.5))
      let PiskeACM = new CANNON.Material()
      PiskeABody = new CANNON.Body({
        mass: 5,
        shape: PiskeAShape,
        position: new CANNON.Vec3(3,0.8,0),
        material: PiskeACM,
      })
      world.add(PiskeABody)
    
      // Piske A網格
      const PiskeAGeo = new THREE.BoxGeometry(1.5, 0.2, 1);
      const PiskeAMat = new THREE.MeshPhongMaterial({
        color: 0x4287f5,
      });
      PiskeA = new THREE.Mesh(PiskeAGeo, PiskeAMat);
      PiskeA.castShadow = true
      scene.add(PiskeA);
    
      // 建立Piske B 剛體 Sphere(radius)
      let PiskeBShape = new CANNON.Box(new CANNON.Vec3(0.75, 0.1, 0.5))
      let PiskeBCM = new CANNON.Material()
      PiskeBBody = new CANNON.Body({
        mass: 1,
        shape: PiskeBShape,
        position: new CANNON.Vec3(3, 0.1, 0),
        material: PiskeBCM,
      })
      world.add(PiskeBBody)
    
      // Piske B網格
      const PiskeBGeo = new THREE.BoxGeometry(1.5, 0.2, 1);
      const PiskeBMat = new THREE.MeshPhongMaterial({
        color: 0x4287f5,
      });
      PiskeB = new THREE.Mesh(PiskeBGeo, PiskeBMat);
      PiskeB.castShadow = true
    //   scene.add(PiskeB);
    
      // 建立Piske C 剛體 Sphere(radius)
      let PiskeCShape = new CANNON.Box(new CANNON.Vec3(0.25, 0.3, 0.25))
      let PiskeCCM = new CANNON.Material()
      PiskeCBody = new CANNON.Body({
        mass: 5,
        shape: PiskeCShape,
        position: new CANNON.Vec3(3, 0.5, 0),
        material: PiskeCCM,
      })
      world.add(PiskeCBody)
    
      // Piske C網格
      const PiskeCGeo = new THREE.BoxGeometry(0.5, 0.8, 0.5);
      const PiskeCMat = new THREE.MeshPhongMaterial({
        color: 0x4287f5,
      });
      PiskeC = new THREE.Mesh(PiskeCGeo, PiskeCMat);
      PiskeC.castShadow = true
    //   scene.add(PiskeC);
    
      // Piske 剛體組裝
      PiskeBodyJoint1 = new CANNON.LockConstraint(PiskeABody,PiskeBBody)
      world.addConstraint(PiskeBodyJoint1)
      PiskeBodyJoint2 = new CANNON.LockConstraint(PiskeBBody,PiskeCBody)
      world.addConstraint(PiskeBodyJoint2)
    
      // 設定地板剛體與物體剛體 碰撞時會交互作用
      PiskeGroundContact = new CANNON.ContactMaterial(gripperRCM, PiskeBCM, {
        friction: friction, 
        restitution: restitution // 恢復係數, 衡量兩個物體碰撞後反彈程度
      })
      world.addContactMaterial(PiskeGroundContact)
}

const timeStep = 1.0 / 60.0 // seconds

function render() {
    world.step(timeStep)
    // 複製剛體位址到物體位置
    UsagiA.position.copy(UsagiABody.position)
    UsagiA.quaternion.copy(UsagiABody.quaternion)

    UsagiB.position.copy(UsagiBBody.position)
    UsagiB.quaternion.copy(UsagiBBody.quaternion)

    UsagiC.position.copy(UsagiCBody.position)
    UsagiC.quaternion.copy(UsagiCBody.quaternion)

    // usagiObj.usagi.position.copy(UsagiCBody.position)
    // usagiObj.usagi.quaternion.copy(UsagiCBody.quaternion)

    // piskeObj.piske.position.copy(PiskeCBody.position)
    // piskeObj.piske.quaternion.copy(PiskeCBody.quaternion)
    PiskeA.position.copy(PiskeABody.position)
    PiskeA.quaternion.copy(PiskeABody.quaternion)

    // PiskeA.position.copy(PiskeABody.position)
    // PiskeA.quaternion.copy(PiskeABody.quaternion)

    // PiskeB.position.copy(PiskeBBody.position)
    // PiskeB.quaternion.copy(PiskeBBody.quaternion)

    // PiskeC.position.copy(PiskeCBody.position)
    // PiskeC.quaternion.copy(PiskeCBody.quaternion)

    statsUI.update()
    TWEEN.update()
    cameraControl.update()

    requestAnimationFrame(wall_load)
    requestAnimationFrame(gripper_load)
    requestAnimationFrame(render)

    renderer.render(scene, camera)
}

function wall_load() {
  // 機台
  machine.position.copy(machineBottomBody.position)
  machine.quaternion.copy(machineBottomBody.quaternion)

  wall.position.copy(wallBody.position)
  wall.quaternion.copy(wallBody.quaternion)

  wallL.position.copy(wallLBody.position)
  wallL.quaternion.copy(wallLBody.quaternion)

  floor.position.copy(floorBody.position)
  floor.quaternion.copy(floorBody.quaternion)

  swall.position.copy(swallBody.position)
  swall.quaternion.copy(swallBody.quaternion)

  backwall.position.copy(backwallBody.position)
  backwall.quaternion.copy(backwallBody.quaternion)

  // if(glass_load_flag){
  //   glass_outerObj.position.copy(backwallBody.position)
  //   glass_outerObj.quaternion.copy(backwallBody.quaternion)
  // }
}
function gripper_load(){
  gripperRTop.position.copy(gripperRTopBody.position)
  gripperRTop.quaternion.copy(gripperRTopBody.quaternion)

  gripperR.position.copy(gripperRBody.position)
  gripperR.quaternion.copy(gripperRBody.quaternion)

  gripperLTop.position.copy(gripperLTopBody.position)
  gripperLTop.quaternion.copy(gripperLTopBody.quaternion)

  gripperL.position.copy(gripperLBody.position)
  gripperL.quaternion.copy(gripperLBody.quaternion)
}

function click_Gripper(){
    console.log("click_Gripper")
    // init_x = gripperRBody.position.x
    // init_z = gripperRBody.position.z
    // init_y = gripperRBody.position.y

    initR_x = gripperRBody.position.x
    initR_z = gripperRBody.position.z
    initR_y = gripperRBody.position.y
    initL_x = gripperLBody.position.x
    initL_z = gripperLBody.position.z
    initL_y = gripperLBody.position.y

    // R
    let offsetR = {x:initR_x,z:initR_z,y:initR_y}
    let DownTargetR = {x:initR_x,z:initR_z,y:initR_y-4.5}
    let MoveTargetR = {x:initR_x-0.65,z:initR_z,y:initR_y-4.5}
    let UpTargetR = {x:initR_x-0.65,z:initR_z,y:initR_y}
    let OriginR = {x:gripperR_init_x-0.65,z:gripperR_init_z,y:gripperR_init_y}
    let ReleaseTargetR = {x:gripperR_init_x,z:gripperR_init_z,y:gripperR_init_y}

    // L
    let offsetL= {x:initL_x,z:initL_z,y:initL_y}
    let DownTargetL = {x:initL_x,z:initL_z,y:initL_y-4.5}
    let MoveTargetL = {x:initL_x+0.65,z:initL_z,y:initL_y-4.5}
    let UpTargetL = {x:initL_x+0.65,z:initL_z,y:initL_y}
    let OriginL = {x:gripperL_init_x+0.65,z:gripperL_init_z,y:gripperL_init_y}
    let ReleaseTargetL = {x:gripperL_init_x,z:gripperL_init_z,y:gripperL_init_y}

    console.log(offsetR)

    const DownR=()=>{
        gripperRBody.position.y = offsetR.y
    }
    tweenDownR = new TWEEN.Tween(offsetR)
      .to(DownTargetR,1800)
      .easing(TWEEN.Easing.Quintic.Out)
      .onUpdate(DownR)
      .onComplete(()=>{
          console.log("downR")
    })

    const DownL=()=>{
        gripperLBody.position.y = offsetL.y
    }
    tweenDownL = new TWEEN.Tween(offsetL)
      .to(DownTargetL,1800)
      .easing(TWEEN.Easing.Quintic.Out)
      .onUpdate(DownL)
      .onComplete(()=>{
          console.log("downL")
    })

    const MoveR=()=>{
      gripperRBody.position.x = DownTargetR.x
    }
    
    tweenMoveR = new TWEEN.Tween(DownTargetR)
    .to(MoveTargetR,1500)
    .easing(TWEEN.Easing.Quintic.Out)
    .onUpdate(MoveR)
    .onComplete(()=>{
        console.log("moveR")
    })

    const MoveL=()=>{
        gripperLBody.position.x = DownTargetL.x
      }
      
    tweenMoveL = new TWEEN.Tween(DownTargetL)
      .to(MoveTargetL,1500)
      .easing(TWEEN.Easing.Quintic.Out)
      .onUpdate(MoveL)
      .onComplete(()=>{
          console.log("moveL")
    })

    const UpR=()=>{
        gripperRBody.position.y = MoveTargetR.y
    }

    tweenUpR = new TWEEN.Tween(MoveTargetR)
    .to(UpTargetR,2500)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(UpR)
    .onComplete(()=>{
      console.log("UpR")
    }) 

    const UpL=()=>{
        gripperLBody.position.y = MoveTargetL.y
    }

    tweenUpL = new TWEEN.Tween(MoveTargetL)
    .to(UpTargetL,2500)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(UpL)
    .onComplete(()=>{
      console.log("UpL")
    })

    const ToOriginR=()=>{
        gripperRBody.position.x = UpTargetR.x
        gripperRBody.position.y = UpTargetR.y
        gripperRBody.position.z = UpTargetR.z
    }

    tweenToOriginR = new TWEEN.Tween(UpTargetR)
    .to(OriginR,5000)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(ToOriginR)
    .onComplete(()=>{
      console.log("ToOriginR")
    })

    const ToOriginL=()=>{
        gripperLBody.position.x = UpTargetL.x
        gripperLBody.position.y = UpTargetL.y
        gripperLBody.position.z = UpTargetL.z
    }

    tweenToOriginL = new TWEEN.Tween(UpTargetL)
    .to(OriginL,5000)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(ToOriginL)
    .onComplete(()=>{
      console.log("ToOriginL")
    })

    const ReleaseR=()=>{
        gripperRBody.position.x = OriginR.x
    }

    tweenReleaseR = new TWEEN.Tween(OriginR)
    .to(ReleaseTargetR,1800)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(ReleaseR)
    .onComplete(()=>{
      console.log("ReleaseR")
    })   

    const ReleaseL=()=>{
        gripperLBody.position.x = OriginL.x
    }

    tweenReleaseL = new TWEEN.Tween(OriginL)
    .to(ReleaseTargetL,1800)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(ReleaseL)
    .onComplete(()=>{
      console.log("ReleaseL")
    })

    tweenDownR.start()
    tweenDownR.chain(tweenMoveR)
    tweenMoveR.chain(tweenUpR)
    tweenUpR.chain(tweenToOriginR)
    tweenToOriginR.chain(tweenReleaseR)

    tweenDownL.start()
    tweenDownL.chain(tweenMoveL)
    tweenMoveL.chain(tweenUpL)
    tweenUpL.chain(tweenToOriginL)
    tweenToOriginL.chain(tweenReleaseL)
}

function click_Right(){
    initR_x = gripperRBody.position.x
    initR_z = gripperRBody.position.z
    initR_y = gripperRBody.position.y
    initL_x = gripperLBody.position.x
    initL_z = gripperLBody.position.z
    initL_y = gripperLBody.position.y
    let offsetR = {x:initR_x,z:initR_z,y:initR_y}
    let targetR = {x:initR_x+1,z:initR_z,y:initR_y}
    let offsetL = {x:initL_x,z:initL_z,y:initL_y}
    let targetL = {x:initL_x+1,z:initL_z,y:initL_y}

    const RRight=()=>{
      //移動
      gripperRBody.position.x = offsetR.x
    }
    tweenRRight = new TWEEN.Tween(offsetR)
        .to(targetR,750)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(RRight)
        .onComplete(()=>{
        })

    
    const LRight=()=>{
      //移動
      gripperLBody.position.x = offsetL.x
    }
    tweenLRight = new TWEEN.Tween(offsetL)
        .to(targetL,750)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(LRight)
        .onComplete(()=>{
            console.log("Right done")
        })

    tweenRRight.start()
    tweenLRight.start()
}

function click_Left(){
    initR_x = gripperRBody.position.x
    initR_z = gripperRBody.position.z
    initR_y = gripperRBody.position.y
    initL_x = gripperLBody.position.x
    initL_z = gripperLBody.position.z
    initL_y = gripperLBody.position.y
    let offsetR = {x:initR_x,z:initR_z,y:initR_y}
    let targetR = {x:initR_x-1,z:initR_z,y:initR_y}
    let offsetL = {x:initL_x,z:initL_z,y:initL_y}
    let targetL = {x:initL_x-1,z:initL_z,y:initL_y}

    const RLeft=()=>{
      gripperRBody.position.x = offsetR.x
    }
    tweenRLeft = new TWEEN.Tween(offsetR)
        .to(targetR,750)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(RLeft)
        .onComplete(()=>{
        })

    
    const LLeft=()=>{
      gripperLBody.position.x = offsetL.x
    }
    tweenLLeft = new TWEEN.Tween(offsetL)
        .to(targetL,750)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(LLeft)
        .onComplete(()=>{
            console.log("Left done")
        })

    tweenRLeft.start()
    tweenLLeft.start()
}

function click_Forward(){
    initR_x = gripperRBody.position.x
    initR_z = gripperRBody.position.z
    initR_y = gripperRBody.position.y
    initL_x = gripperLBody.position.x
    initL_z = gripperLBody.position.z
    initL_y = gripperLBody.position.y
    let offsetR = {x:initR_x,z:initR_z,y:initR_y}
    let targetR = {x:initR_x,z:initR_z+0.5,y:initR_y}
    let offsetL = {x:initL_x,z:initL_z,y:initL_y}
    let targetL = {x:initL_x,z:initL_z+0.5,y:initL_y}

    const RForward=()=>{
      gripperRBody.position.z = offsetR.z
    }
    tweenRForward = new TWEEN.Tween(offsetR)
        .to(targetR,750)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(RForward)
        .onComplete(()=>{
        })

    
    const LForward=()=>{
      gripperLBody.position.z = offsetL.z
    }
    tweenLForward = new TWEEN.Tween(offsetL)
        .to(targetL,750)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(LForward)
        .onComplete(()=>{
            console.log("Forward done")
        })

    tweenRForward.start()
    tweenLForward.start()
}

function click_Back(){
    initR_x = gripperRBody.position.x
    initR_z = gripperRBody.position.z
    initR_y = gripperRBody.position.y
    initL_x = gripperLBody.position.x
    initL_z = gripperLBody.position.z
    initL_y = gripperLBody.position.y
    let offsetR = {x:initR_x,z:initR_z,y:initR_y}
    let targetR = {x:initR_x,z:initR_z-0.5,y:initR_y}
    let offsetL = {x:initL_x,z:initL_z,y:initL_y}
    let targetL = {x:initL_x,z:initL_z-0.5,y:initL_y}

    const RBack=()=>{
      gripperRBody.position.z = offsetR.z
    }
    tweenRBack = new TWEEN.Tween(offsetR)
        .to(targetR,750)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(RBack)
        .onComplete(()=>{
        })

    
    const LBack=()=>{
      gripperLBody.position.z = offsetL.z
    }
    tweenLBack = new TWEEN.Tween(offsetL)
        .to(targetL,750)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(LBack)
        .onComplete(()=>{
            console.log("Back done")
        })

    tweenRBack.start()
    tweenLBack.start()
}

function base_loader(){
    // 載入 loader
    const loader = new THREE.GLTFLoader()
    // Load a glTF resource
    loader.load(
        'gltf/claw_machine/base.gltf',
	// called when the resource is loaded
    function ( gltf ) {
        base = gltf
        baseObj = gltf.scene
        baseObj.position.x = -2;

        baseObj.scale.set(1, 1, 1);

        // 設定陰影
        baseObj.traverse(function(object) {
            if (object instanceof THREE.Mesh) {
              object.castShadow = true
              object.receiveShadow = true
            }
          })

        scene.add(baseObj);
        load_flag = true
        console.log(gltf)
	},
	// called while loading is progressing
	function ( xhr ) {
		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
	},
	// called when loading has errors
	function ( error ) {
		console.log( 'An error happened:'+error );
	}
)}

function glass_outer_loader(){
  // 載入 loader
  const loader = new THREE.GLTFLoader()
  // Load a glTF resource
  loader.load(
      'gltf/claw_machine/glass-outer.gltf',
// called when the resource is loaded
  function ( gltf ) {
      glass_outer = gltf
      glass_outerObj = gltf.scene
      glass_outerObj.position.x = -2;
      glass_outerObj.position.y = 4.5;

      glass_outerObj.scale.set(1, 1, 1);

      // 設定陰影
      glass_outerObj.traverse(function(object) {
          if (object instanceof THREE.Mesh) {
            object.castShadow = true
            object.receiveShadow = true
          }
        })

      scene.add(glass_outerObj);
      glass_load_flag = true
      // console.log(gltf)
},
// called while loading is progressing
function ( xhr ) {
  console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
},
// called when loading has errors
function ( error ) {
  console.log( 'An error happened:'+error );
}
)}

// 監聽螢幕寬高來做簡單 RWD 設定
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

init()
initCannon()
initUsagiCannon()
initPiskeCannon()
initClawMachineCannon()
render()