let scene, renderer, camera
let cameraControl, stats, gui
let pointLight
let usagiObj

// 建立監測器
function initStats(){
    const stats = new Stats()
    stats.setMode(0) //FPS mode
    // stats.setMode(1) //畫面渲染時間
    document.getElementById('stats').appendChild(stats.domElement)
    return stats
}

class Usagi{
    constructor(){
        const headGeo = new THREE.BoxGeometry(1.5, 1, 1);
        const earGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25);

        //設定 Usagi 圖案
        const headTexture = new THREE.TextureLoader().load('images/Usagi_face.jpg')
        const earTexture = new THREE.TextureLoader().load('images/Usagi_ear.jpg')
        
        // 每一面同圖案
        const earMaterial = new THREE.MeshLambertMaterial({map:earTexture})

        // 只設定一面有臉
        const headMaterials = []
        for (let i = 0; i < 6; i++) {
            let map
            if (i === 4) {
                map = headTexture}
            else {
                map = earTexture
            }
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

// 初始化
function init() {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(10, 10, 10)
  camera.lookAt(scene.position)

  statsUI = initStats()

  // 建立渲染器
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  // 設定背景顏色
  renderer.setClearColor(0xeeeeee, 1.0)
  // 陰影效果
  renderer.shadowMap.enabled = true 
  // 陰影貼圖種類   
  renderer.shadowMap.type = 2

  //建立軌道控制器   
  cameraControl = new THREE.OrbitControls(camera, renderer.domElement)
  cameraControl.enableDamping = true
  cameraControl.dampingFactor = 0.05

  //地板
  const planeGeometry = new THREE.PlaneGeometry(30, 30)
  const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
  plane = new THREE.Mesh(planeGeometry, planeMaterial)
  //沿著X軸轉90度
  plane.rotation.x = -Math.PI / 2
  plane.position.set(0, 0, 0)
  plane.castShadow = true
  // 設定接收陰影的投影面
  plane.receiveShadow = true
  scene.add(plane)

  //物件加入場景   
//   createUsagi()

  // 建立光源
  let pointLight = new THREE.PointLight(0xf0f0f0)
  pointLight.position.set(-10, 20, 20)
  pointLight.castShadow = true // 投影
  scene.add(pointLight)

  // 將渲染器的 DOM 綁到網頁上
  document.body.appendChild(renderer.domElement)

  // Arrow Helper
//   const dir = new THREE.Vector3( 1, 2, 0 );

//   dir.normalize();

//   const origin = new THREE.Vector3( 0, 0, 0 );
//   const length = 1;
//   const hex = 0xffff00;

//   const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
//   scene.add( arrowHelper )

  // AxesHelper 
//   let axesHelper = new THREE.AxesHelper(3)
//   scene.add(axesHelper)

  // Box Helper
//   const sphere = new THREE.SphereGeometry();
//   const object = new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( 0xff0000 ) );
//   object.position.set(6,1,1)
//   const box = new THREE.BoxHelper( object, 0xffff00 );
//   scene.add( box );
//   scene.add(object)
  
  // Camera helper   
//   const helper = new THREE.CameraHelper( camera );
//   scene.add( helper );

  // Grid Helper
//   const size = 10;
//   const divisions = 10;
//   const gridHelper = new THREE.GridHelper( size, divisions,0xff0000,0xffffff);
//   scene.add( gridHelper );

  // Polar Helper 
  const radius = 10;
  const radials = 16;
  const circles = 8;
  const divisions = 64;

  const helper = new THREE.PolarGridHelper( radius, radials, circles, divisions );
  scene.add( helper );

}

// 渲染場景
function render() {
  requestAnimationFrame(render)
  //配合軌道控制器   
  cameraControl.update()
  //配合監測器  
  statsUI.update()
  renderer.render(scene, camera)
}

// 監聽螢幕寬高來做簡單 RWD 設定
window.addEventListener('resize', function() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

init()
render()