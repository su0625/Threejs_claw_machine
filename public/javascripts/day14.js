let scene, renderer, camera
let cameraControl, stats, gui

// Cannon.js
let world
let groundBody
let sphereBody
let sphere
let sphereGroundContact

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
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(0, 20, 30)
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
    
    // 將渲染器的 DOM 綁到網頁上
    document.body.appendChild(renderer.domElement)
}

function initCannon(){
  // 建立Cannon世界
  world = new CANNON.World()
  // 設定重力場為 y 軸 -9.8 m/s²
  world.gravity.set(0, -9.8, 0)

  // 建立球剛體 
  var radius = 1
  sphereBody = new CANNON.Body({
    mass: 5,  //質量 kg
    position: new CANNON.Vec3(0, 10, 0), // m
    shape: new CANNON.Sphere(radius),
  })
  world.add(sphereBody)

  // 建立地板剛體
  var groundBody = new CANNON.Body({
    mass: 0, // mass = 0 使物體靜止
  })
  var groundShape = new CANNON.Plane()
  groundBody.addShape(groundShape);
  world.add(groundBody)
  // setFromAxisAngle 地板沿著X軸轉90度
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)

  // 球網格
  let sphereGeometry = new THREE.SphereGeometry(1, 32, 32)
  let sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x33aaaa })
  sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
  sphere.castShadow = true
  scene.add(sphere)

  // 地板網格
  let groundGeometry = new THREE.PlaneGeometry(30, 30, 30)
  let groundMaterial = new THREE.MeshLambertMaterial({
    color:0x505050,
    side: THREE.DoubleSide,
  })
  let ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
}

const fixedTimeStep = 1.0 / 60.0 // seconds

function render() {
    world.step(fixedTimeStep)
    // 複製剛體位址到物體位置
    sphere.position.copy(sphereBody.position)
    sphere.quaternion.copy(sphereBody.quaternion)
    console.log("Sphere y position: " + sphereBody.position.y);

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
render()