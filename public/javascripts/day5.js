let scene, renderer, camera
let cube

// 初始化場景、相機、渲染器、物體
function init() {
  // 建立場景
  scene = new THREE.Scene()

  // 建立相機
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(10, 10, 10)
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
  pointLight.position.set(10, 10, -10)
  scene.add(pointLight)

  // 建立物體
  const geometry = new THREE.BoxGeometry(1, 1, 1) // 幾何體
  const material = new THREE.MeshPhongMaterial({
    color: 0x00ff00
  }) // 材質
  cube = new THREE.Mesh(geometry, material) // 建立網格物件
  cube.position.set(2, 1, 0)
  scene.add(cube)

  // 建立Line
  const material1 = new THREE.LineBasicMaterial( { color: 0x0000ff } );
  const points = [];
  points.push( new THREE.Vector3( - 1, 0, 0 ) );
  points.push( new THREE.Vector3( 0, 1, 0 ) );
  points.push( new THREE.Vector3( 1, 0, 0 ) );

  const geometry1 = new THREE.BufferGeometry().setFromPoints( points );
  const line = new THREE.Line( geometry1, material1 );
  scene.add(line);
}

// 建立動畫
function animate() {
  cube.rotation.x += 0.01
  cube.rotation.y += 0.01
}

// 渲染場景
function render() {
  animate()
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
render()