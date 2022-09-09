let scene, renderer, camera
let cameraControl, stats, gui

// Cannon.js
let world
let groundBody
let sphereBody
let sphere
let sphereGroundContact
let friction = 0.7
let restitution = 0.7

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
  usagiObj.usagi.position.z = 0
  scene.add(usagiObj.usagi)
}

// 建立監測器
function initStats() {
    const stats = new Stats()
    stats.setMode(0)
    document.getElementById('stats').appendChild(stats.domElement)
    return stats
}

let controls = new (function() {
    this.message = "dat.gui"
    this.reset = function() {
      sphereBody.position.set(0, 10, 0)
      sphereBody.velocity.set(0, 0, 0)
      sphereGroundContact.friction = friction
      sphereGroundContact.restitution = restitution
    }
    this.friction = 0.7
    this.restitution = 0.7
})()

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

    // 產生 GUI 介面
    gui = new dat.GUI()
    gui.add(controls,"message")
    gui.add(controls, 'reset')
    // 摩擦係數 範圍0-2
    gui.add(controls, 'friction', 0, 2).onChange(e => {
      friction = e
    })
    // 恢復係數 範圍0-2
    gui.add(controls, 'restitution', 0, 2).onChange(e => {
      restitution = e
    })

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

  // 建立球剛體 
  var radius = 1
  let sphereCM = new CANNON.Material()
  sphereBody = new CANNON.Body({
    mass: 5,  //質量 kg
    position: new CANNON.Vec3(0, 10, 0), // m
    shape: new CANNON.Sphere(radius),
    material:sphereCM
  })
  world.add(sphereBody)

  // 建立地板剛體
  let groundCM = new CANNON.Material()
  var groundBody = new CANNON.Body({
    mass: 0, // mass = 0 使物體靜止
    material:groundCM
  })
  var groundShape = new CANNON.Plane()
  groundBody.addShape(groundShape);
  world.add(groundBody)
  // setFromAxisAngle 地板沿著X軸轉90度
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)

  // 設定地板剛體與物體剛體 碰撞時會交互作用
  sphereGroundContact = new CANNON.ContactMaterial(groundCM, sphereCM, {
    friction: friction, 
    restitution: restitution // 恢復係數, 衡量兩個物體碰撞後反彈程度
  })
  world.addContactMaterial(sphereGroundContact)

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
    usagiObj.usagi.position.copy(sphereBody.position)
    usagiObj.usagi.quaternion.copy(sphereBody.quaternion)

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