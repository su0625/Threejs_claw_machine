let scene, renderer, camera
let cameraControl, stats, gui
let usagiObj
let Speed = 0

// Cannon.js
var world
let groundBody

// Usagi初始位置
let usagi_init_x = 0
let usagi_init_y = 0.5
let usagi_init_z = 0

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
    scene.add(usagiObj.usagi)
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
      20,
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
  let groundCM = new CANNON.Material()
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
    // 若不需要顯示網格可以註解掉 剛體效果還是會在
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

    // 貼圖
    usagiObj.usagi.position.copy(UsagiCBody.position)
    usagiObj.usagi.quaternion.copy(UsagiCBody.quaternion)

    statsUI.update()
    cameraControl.update()
    requestAnimationFrame(render)
    renderer.render(scene, camera)
}

// 監聽螢幕寬高來做簡單 RWD 設定
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

init()
initCannon()
initUsagiCannon()
render()