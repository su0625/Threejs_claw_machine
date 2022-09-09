let scene, renderer, camera

// 初始化場景、相機、渲染器、物體
function init() {
  // 建立場景
  scene = new THREE.Scene()

  // 建立相機
  camera = new THREE.PerspectiveCamera(
    100,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(5, 10, 10)
  camera.lookAt(scene.position)

  // 建立渲染器
  renderer = new THREE.WebGLRenderer()
  // 設定背景顏色
  renderer.setClearColor(0xeeeeee, 1.0)
  // 陰影效果
  renderer.shadowMap.enable = true 
  // 陰影貼圖種類   
  renderer.shadowMap.type = 2
  // 場景大小
  renderer.setSize(window.innerWidth, window.innerHeight) 
  // 將渲染器的 DOM 綁到網頁上
  document.body.appendChild(renderer.domElement)

  // 建立光源
  let pointLight = new THREE.PointLight(0xffffff)
  pointLight.position.set(10, 10, 10)
  scene.add(pointLight)

  //建立軌道控制器   
  cameraControl = new THREE.OrbitControls(camera, renderer.domElement)
  cameraControl.enableDamping = true
  // 值越小越難轉動   
  cameraControl.dampingFactor = 0.5

  //地板
  const planeGeometry = new THREE.PlaneGeometry(50, 50)
  const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
  plane = new THREE.Mesh(planeGeometry, planeMaterial)
  //沿著X軸轉90度
  plane.rotation.x = -Math.PI / 2
  plane.position.set(0, -0.5, 0)
  plane.castShadow = true
  // 設定接收陰影的投影面
  plane.receiveShadow = true
  scene.add(plane)

  var loader = new THREE.FontLoader();
  loader.load( 'fonts/gentilis_regular.typeface.json', function ( font ) {
    var textGeometry = new THREE.TextGeometry( "hello", {
      font: font,
      size: 5,
      height: 1,
      // 曲線上點的數量 
      curveSegments: 1,
      // 是否開啟斜角
      bevelEnabled: true,
      // 斜角深度 
      bevelThickness: 0.5,
      // 從文字輪廓到斜角距離   
      bevelSize: 0.5,
      // 斜角分段數
      bevelSegments: 1
    })

  var textMaterial = new THREE.MeshPhongMaterial( 
    { color: 0xff0000, specular: 0xffffff }
  );

  var mesh = new THREE.Mesh( textGeometry, textMaterial );
  mesh.position.set(-5,0,0)
  scene.add(mesh)

}); 


}



// 渲染場景
function render() {
  requestAnimationFrame(render)
  cameraControl.update()
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