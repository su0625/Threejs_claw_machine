let scene, renderer, camera
let cameraControl, stats, gui

// Cannon.js
let world
let groundBody

// gltf
let actions = 0
var load_flag = false

clock = new THREE.Clock();

function gltf_loader(){
    // 載入 loader
    const loader = new THREE.GLTFLoader()
    // Load a glTF resource
    loader.load(
        'gltf/dog_gltf/scene.gltf',
    // 'gltf/dog_glb/playful_dog.glb',
	// called when the resource is loaded
    function ( gltf ) {
        gltf = gltf
        dogObj = gltf.scene
        dogObj.rotation.y = Math.PI / 8;
        dogObj.position.y = 0;

        dogObj.scale.set(10, 10, 10);

        dogObj.traverse(function(object) {
            if (object instanceof THREE.Mesh) {
              object.castShadow = true
              object.receiveShadow = true
            }
          })

        scene.add(dogObj);
        load_flag = true
        console.log(gltf)

        // 抓取動畫名稱
        actionsObj = {}
        for(i=0;i<gltf.animations.length;i++){
            animate_name = gltf.animations[i]['name']
            actionsObj[animate_name]=i
        }
        console.log("actionsObj:",actionsObj)

        // 調用動畫
        mixer = new THREE.AnimationMixer( gltf.scene )
        action = mixer.clipAction(gltf.animations[actions])
        action.play()

        gui.add(controls,'actions', actionsObj).onChange(e=>{
            // 將原本動畫停止
            action.stop()
            // 開始新動畫
            action = mixer.clipAction(gltf.animations[e])
            action.play()
        });
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


// 建立監測器
function initStats() {
    const stats = new Stats()
    stats.setMode(0)
    document.getElementById('stats').appendChild(stats.domElement)
    return stats
}

let controls = new (function() {
    this.message = "dat.gui"
    this.actions = 0
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

    // 建立渲染器(抗拒齒)
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize(window.innerWidth, window.innerHeight)
    // 設定背景顏色
    renderer.setClearColor(0xeeeeee, 1.0)
    renderer.shadowMap.enabled = true 
    // 陰影貼圖種類   
    renderer.shadowMap.type = 2
    renderer.outputEncoding = THREE.sRGBEncoding;
    // 將渲染器的 DOM 綁到網頁上
    document.body.appendChild(renderer.domElement)
        
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
    gltf_loader()
}

function initCannon(){
  // 建立Cannon世界
  world = new CANNON.World()
  // 設定重力場為 y 軸 -9.8 m/s²
  world.gravity.set(0, -9.8, 0)

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

function animate() {
    if (load_flag){
        var delta = clock.getDelta();
        if ( mixer ) mixer.update( delta ); 
    }
}

const fixedTimeStep = 1.0 / 60.0 // seconds

function render() {
    world.step(fixedTimeStep)
    statsUI.update()
    cameraControl.update()
    requestAnimationFrame(animate);
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