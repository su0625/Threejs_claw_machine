let scene, renderer, camera
let cameraControl, stats
let pointLight

// 建立監測器
function initStats(){
    const stats = new Stats()
    stats.setMode(0) // FPS mode
    // stats.setMode(1) // MS
    // stats.setMode(2) // MB
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
  camera.position.set(10, 10, 10)
  camera.lookAt(scene.position)

  statsUI = initStats()

  // 建立渲染器
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  // 設定背景顏色
//   renderer.setClearColor(0xeeeeee, 1.0)
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
  plane.position.set(0, -0.5, 0)
  plane.castShadow = true
  // 設定接收陰影的投影面
  plane.receiveShadow = true
  scene.add(plane)

  // 建立光源
  let pointLight = new THREE.PointLight(0xf0f0f0)
  pointLight.position.set(-10, 20, 20)
  pointLight.castShadow = true // 投影
  scene.add(pointLight)

  // 將渲染器的 DOM 綁到網頁上
  document.body.appendChild(renderer.domElement)

  // 創建cube
  const geometry = new THREE.BoxGeometry( 1, 1, 1 );
  const material = new THREE.MeshBasicMaterial( {color: 0xffff30} );
  const cube = new THREE.Mesh( geometry, material );
  scene.add( cube );

  // clone cube
  var cube_clone = cube.clone()
  cube_clone.position.set(5,0,0)
  scene.add(cube_clone)

  // copy cube
  var sphere_geo = new THREE.SphereGeometry(1,16,5)
  var sphere_material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
  sphere_material.copy(material)
  const sphere = new THREE.Mesh( sphere_geo,sphere_material);
  sphere.position.set(-5,0,0)
  scene.add(sphere)

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