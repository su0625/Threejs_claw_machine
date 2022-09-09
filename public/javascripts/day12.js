let scene, renderer, camera
let cameraControl, stats, gui
let usagiObj
let jumpSpeed = 0

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
    // tweenHandler()
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
  
    //地板
    const planeGeometry = new THREE.PlaneGeometry(30, 30)
    const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
    let plane = new THREE.Mesh(planeGeometry, planeMaterial)
    //沿著X軸轉90度
    plane.rotation.x = -Math.PI / 2
    // 設定接收陰影的投影面
    plane.receiveShadow = true
    plane.position.set(0, -0.5, 0)
    plane.name = 'floor'
    scene.add(plane)

    //物件加入場景   
    createUsagi()
    
  // 將渲染器的 DOM 綁到網頁上
  document.body.appendChild(renderer.domElement)
}

// 原地走動動畫
function UsagiJump() {
    jumpSpeed += 0.04
    usagiObj.usagi.position.y = Math.abs(Math.sin(jumpSpeed)/2)
}

function render() {
    statsUI.update()
    cameraControl.update()
    UsagiJump()
    TWEEN.update()
  
    requestAnimationFrame(render)
    renderer.render(scene, camera)
}

// 監聽螢幕寬高來做簡單 RWD 設定
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

function click_left(){
    console.log("click_left")
    // 物體起始位置
    init_x = usagiObj.usagi.position.x
    init_z = usagiObj.usagi.position.z
    let offset = {x:init_x,z:init_z}
    // 目標位置
    let target = {x:init_x-1,z:0}

    const onUpdate=()=>{
      //移動
      usagiObj.usagi.position.x = offset.x
      usagiObj.usagi.position.z = offset.z
    }
    tween = new TWEEN.Tween(offset)
        // 設定花費時間
        .to(target,750)
        // 設定移動效果
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(onUpdate)
        .onComplete(()=>{
            console.log("done")
        })
    tween.start()
}

function click_right(){
    console.log("click_right")
    init_x = usagiObj.usagi.position.x
    init_z = usagiObj.usagi.position.z
    let offset = {x:init_x,z:init_z}
    let target = {x:init_x+1,z:0}

    const onUpdate=()=>{
      //移動
      usagiObj.usagi.position.x = offset.x
      usagiObj.usagi.position.z = offset.z
    }
    tween = new TWEEN.Tween(offset)
        .to(target,750)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(onUpdate)
        .onComplete(()=>{
            console.log("done")
        })
    tween.start()
}

init()
render()