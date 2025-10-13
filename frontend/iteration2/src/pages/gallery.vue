<template>
  <div class="page-wrapper">
    <!-- Full-page animated background -->
    <ParticlesBg
      class="bg-global"
      :particle-colors="['#9EE6D8', '#71D0C0', '#FFFFFF']"
      :particle-count="220"
      :particle-spread="10"
      :speed="0.12"
      :particle-base-size="100"
      :move-particles-on-hover="false"
      :alpha-particles="true"
      :disable-rotation="false"
    />

    <!-- Page surface -->
    <div class="page-surface">
      <Header />

      <main>
        <!-- Title hero -->
        <section class="hero">
          <h1 class="hero-title">
            Window Gallery<br class="mobile-break" />
          </h1>
          <p class="hero-subtitle">Discover Melbournian Greenery View</p>
        </section>

        <!-- Display area -->
        <section class="stage">
          <div class="circular-gallery" ref="containerRef"></div>
        </section>

        <!-- Actions below the gallery -->
        <div class="stage-actions">
          <button
            class="cg-explore-btn"
            @click="onExplore"
            :disabled="loading || !canShowMore"
            aria-label="Explore more"
          >
            {{ canShowMore ? (loading ? 'Loading…' : 'Explore More') : 'Nothing else' }}
          </button>

          <p v-if="error" class="cg-error">{{ error }}</p>
          <p v-if="!loading && !items.length && !error" class="muted">No photos now</p>
        </div>
      </main>

      <Footer />
    </div>

    <!-- Lightbox -->
    <div v-if="lightboxOpen" class="lb" @click.self="closeLightbox">
      <button class="lb-close" @click="closeLightbox" aria-label="Close">×</button>
      <button class="lb-nav prev" v-if="items.length>1" @click="prev">‹</button>
      <img class="lb-img" :src="items[activeIdx]?.image" :alt="items[activeIdx]?.text || 'Window view'">
      <button class="lb-nav next" v-if="items.length>1" @click="next">›</button>
    </div>
  </div>
</template>

<script setup>
/* Imports & setup */
import { defineComponent, h, onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform, Geometry } from 'ogl'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/* Env & constants */
const REGION = import.meta.env.VITE_AWS_REGION || 'ap-southeast-2'
const BUCKET = import.meta.env.VITE_S3_BUCKET
const ID_POOL = import.meta.env.VITE_COGNITO_ID_POOL
const PREFIX = 'YourWindow/'
const BATCH_SIZE = 6
const PREFETCH_PAGES = 2

/* Visual props */
const PROP_BEND = 3
const PROP_TEXT_COLOR = '#ffffff'
const PROP_BORDER_RADIUS = 0.05
const PROP_FONT = 'bold 30px Figtree'
const PROP_SCROLL_SPEED = 2
const PROP_SCROLL_EASE = 0.05

/* AWS client */
const s3 = new S3Client({
  region: REGION,
  credentials: fromCognitoIdentityPool({ clientConfig: { region: REGION }, identityPoolId: ID_POOL })
})

/* Reactive state */
const items = ref([])
const loading = ref(false)
const error = ref(null)
const canShowMore = ref(true)
const cursor = ref(undefined)
const queue = ref([])
const seen = ref(new Set())

/* Lightbox */
const lightboxOpen = ref(false)
const activeIdx = ref(0)
function openLightbox(i) { activeIdx.value = i; lightboxOpen.value = true; document.documentElement.style.overflow = 'hidden' }
function closeLightbox() { lightboxOpen.value = false; document.documentElement.style.overflow = '' }
function prev() { activeIdx.value = (activeIdx.value - 1 + items.value.length) % items.value.length }
function next() { activeIdx.value = (activeIdx.value + 1) % items.value.length }

/* Utils */
function debounce(func, wait) { let t; return function (...a) { clearTimeout(t); t = setTimeout(() => func.apply(this, a), wait) } }
function lerp(p1, p2, t) { return p1 + (p2 - p1) * t }
function autoBind(instance) {
  const proto = Object.getPrototypeOf(instance)
  Object.getOwnPropertyNames(proto).forEach(key => {
    if (key !== 'constructor' && typeof instance[key] === 'function') instance[key] = instance[key].bind(instance)
  })
}
function createTextTexture(gl, text, font = 'bold 30px monospace', color = 'black') {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = font
  const metrics = ctx.measureText(text)
  const textWidth = Math.ceil(metrics.width)
  const textHeight = Math.ceil(parseInt(font, 10) * 1.2)
  canvas.width = textWidth + 20
  canvas.height = textHeight + 20
  ctx.font = font
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  const texture = new Texture(gl, { generateMipmaps: false })
  texture.image = canvas
  return { texture, width: canvas.width, height: canvas.height }
}

/* Title class */
class Title {
  constructor({ gl, plane, text, textColor = '#545050', font = '30px sans-serif' }) {
    autoBind(this)
    this.gl = gl; this.plane = plane; this.text = text; this.textColor = textColor; this.font = font
    this.createMesh()
  }
  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor)
    const geometry = new Plane(this.gl)
    const program = new Program(this.gl, {
      vertex: `
        attribute vec3 position; attribute vec2 uv;
        uniform mat4 modelViewMatrix, projectionMatrix;
        varying vec2 vUv;
        void main(){ vUv=uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }
      `,
      fragment: `
        precision highp float; uniform sampler2D tMap; varying vec2 vUv;
        void main(){ vec4 c = texture2D(tMap, vUv); if (c.a < .1) discard; gl_FragColor = c; }
      `,
      uniforms: { tMap: { value: texture } },
      transparent: true
    })
    this.mesh = new Mesh(this.gl, { geometry, program })
    const aspect = width / height
    const textH = this.plane.scale.y * 0.15
    const textW = textH * aspect
    this.mesh.scale.set(textW, textH, 1)
    this.mesh.position.y = -this.plane.scale.y * 0.5 - textH * 0.5 - 0.05
    this.mesh.setParent(this.plane)
  }
}

/* Media class */
class Media {
  constructor({ geometry, gl, image, index, length, scene, screen, text, viewport, bend, textColor, borderRadius = 0, font }) {
    this.extra = 0
    this.geometry = geometry; this.gl = gl; this.image = image
    this.index = index; this.length = length; this.scene = scene; this.screen = screen
    this.text = text; this.viewport = viewport; this.bend = bend; this.textColor = textColor
    this.borderRadius = borderRadius; this.font = font
    this.createShader(); this.createMesh(); this.createTitle(); this.onResize()
  }
  createShader() {
    this.program = new Program(this.gl, {
      depthTest: false, depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position; attribute vec2 uv;
        uniform mat4 modelViewMatrix, projectionMatrix;
        uniform float uTime, uSpeed;
        varying vec2 vUv;
        void main(){
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x*4.0 + uTime) * 1.5 + cos(p.y*2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes, uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        varying vec2 vUv;
        float roundedBoxSDF(vec2 p, vec2 b, float r){
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x,d.y),0.0) - r;
        }
        void main(){
          vec2 ratio = vec2(
            min((uPlaneSizes.x/uPlaneSizes.y)/(uImageSizes.x/uImageSizes.y), 1.0),
            min((uPlaneSizes.y/uPlaneSizes.x)/(uImageSizes.y/uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          float alpha = 1.0 - smoothstep(-0.002, 0.002, d);
          gl_FragColor = vec4(color.rgb, alpha);
        }
      `,
      uniforms: {
        tMap: { value: null },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [2, 2] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius }
      },
      transparent: true
    })

    const ph = document.createElement('canvas')
    ph.width = 2; ph.height = 2
    const phCtx = ph.getContext('2d')
    phCtx.fillStyle = '#cccccc'
    phCtx.fillRect(0, 0, 2, 2)

    const tex = new Texture(this.gl, { image: ph, generateMipmaps: false, flipY: true, premultiplyAlpha: false })
    this.program.uniforms.tMap.value = tex

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.src = this.image
    img.onload = () => {
      tex.image = img
      tex.flipY = true
      tex.needsUpdate = true
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight]
    }
    img.onerror = () => { phCtx.fillStyle = '#e2e8f0'; phCtx.fillRect(0, 0, 2, 2); tex.needsUpdate = true }
  }
  createMesh() {
    this.plane = new Mesh(this.gl, { geometry: this.geometry, program: this.program })
    this.plane.setParent(this.scene)
  }
  createTitle() {
    this.title = new Title({ gl: this.gl, plane: this.plane, text: this.text, textColor: this.textColor, font: this.font })
  }
  update(scroll, direction) {
    this.plane.position.x = this.x - scroll.current - this.extra
    const x = this.plane.position.x
    const H = this.viewport.width / 2
    if (this.bend === 0) { this.plane.position.y = 0; this.plane.rotation.z = 0 }
    else {
      const B_abs = Math.abs(this.bend)
      const R = (H * H + B_abs * B_abs) / (2 * B_abs)
      const effectiveX = Math.min(Math.abs(x), H)
      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX)
      if (this.bend > 0) { this.plane.position.y = -arc; this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R) }
      else { this.plane.position.y = arc; this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R) }
    }
    this.speed = scroll.current - scroll.last
    this.program.uniforms.uTime.value += 0.04
    this.program.uniforms.uSpeed.value = this.speed
    const planeOffset = this.plane.scale.x / 2
    const viewportOffset = this.viewport.width / 2
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset
    if (direction === 'right' && this.isBefore) { this.extra -= this.widthTotal; this.isBefore = this.isAfter = false }
    if (direction === 'left' && this.isAfter) { this.extra += this.widthTotal; this.isBefore = this.isAfter = false }
  }
  onResize({ screen, viewport } = {}) {
    if (screen) this.screen = screen
    if (viewport) this.viewport = viewport
    this.scale = this.screen.height / 1500
    this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height
    this.plane.scale.x = (this.viewport.width  * (700 * this.scale)) / this.screen.width
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y]
    this.padding = 2
    this.width = this.plane.scale.x + this.padding
    this.widthTotal = this.width * this.length
    this.x = this.width * this.index
  }
}

/* App class */
class App {
  constructor(container, { items, bend, textColor = '#ffffff', borderRadius = 0.05, font = 'bold 30px Figtree', scrollSpeed = 2, scrollEase = 0.05, onTap } = {}) {
    autoBind(this)
    this.container = container
    this.el = this.container
    this.scrollSpeed = scrollSpeed
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 }
    this.onCheckDebounce = debounce(this.onCheck, 200)
    this.onTap = onTap
    this.createRenderer(); this.createCamera(); this.createScene(); this.onResize(); this.createGeometry()
    this.createMedias(items, bend, textColor, borderRadius, font)
    this.update(); this.addEventListeners()
  }
  createRenderer() {
    this.renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) })
    this.gl = this.renderer.gl
    this.gl.clearColor(0, 0, 0, 0)
    this.container.appendChild(this.gl.canvas)
  }
  createCamera() { this.camera = new Camera(this.gl); this.camera.fov = 45; this.camera.position.z = 20 }
  createScene() { this.scene = new Transform() }
  createGeometry() { this.planeGeometry = new Plane(this.gl, { heightSegments: 50, widthSegments: 100 }) }
  createMedias(items, bend = 1, textColor, borderRadius, font) {
    const galleryItems = items && items.length ? items : []
    this.sourceCount = galleryItems.length
    this.mediasImages = galleryItems.concat(galleryItems)
    this.medias = this.mediasImages.map((data, index) => new Media({
      geometry: this.planeGeometry, gl: this.gl, image: data.image, index, length: this.mediasImages.length,
      scene: this.scene, screen: this.screen, text: data.text, viewport: this.viewport, bend, textColor, borderRadius, font
    }))
  }
  screenToWorld(px, py) {
    const rect = this.container.getBoundingClientRect()
    const nx = ((px - rect.left) / rect.width) * 2 - 1
    const ny = 1 - ((py - rect.top) / rect.height) * 2
    return { x: nx * (this.viewport.width / 2), y: ny * (this.viewport.height / 2) }
  }
  pickAt(px, py) {
    const world = this.screenToWorld(px, py)
    let best = -1, bestMetric = -Infinity
    for (let i = 0; i < this.medias.length; i++) {
      const m = this.medias[i]
      const dx = world.x - m.plane.position.x
      const dy = world.y - m.plane.position.y
      const ang = -m.plane.rotation.z
      const cos = Math.cos(ang), sin = Math.sin(ang)
      const lx = dx * cos - dy * sin
      const ly = dx * sin + dy * cos
      const hw = m.plane.scale.x / 2
      const hh = m.plane.scale.y / 2
      const hit = (lx >= -hw && lx <= hw && ly >= -hh && ly <= hh)
      if (hit) { const metric = m.plane.scale.x; if (metric > bestMetric) { bestMetric = metric; best = i } }
    }
    if (best < 0) return -1
    return this.sourceCount > 0 ? (best % this.sourceCount) : -1
  }
  onPointerDown(e) {
    this.isDown = true
    this.dragMoved = false
    this.scroll.position = this.scroll.current
    this.start = e.clientX
    this.el.setPointerCapture?.(e.pointerId)
  }
  onPointerMove(e) {
    if (!this.isDown) return
    const distance = (this.start - e.clientX) * (this.scrollSpeed * 0.025)
    this.scroll.target = this.scroll.position + distance
    if (Math.abs(this.start - e.clientX) > 3) this.dragMoved = true
  }
  onPointerUp(e) {
    if (!this.isDown) return
    this.isDown = false
    this.el.releasePointerCapture?.(e.pointerId)
    if (!this.dragMoved && typeof this.onTap === 'function') {
      const idx = this.pickAt(e.clientX, e.clientY)
      if (idx >= 0) this.onTap(idx)
    }
    this.onCheck()
  }
  onWheel(e) { const d = e.deltaY || e.wheelDelta || e.detail; this.scroll.target += (d > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2; this.onCheckDebounce() }
  onCheck() {
    if (!this.medias || !this.medias[0]) return
    const width = this.medias[0].width
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width)
    const item = width * itemIndex
    this.scroll.target = this.scroll.target < 0 ? -item : item
  }
  onResize() {
    this.screen = { width: this.container.clientWidth, height: this.container.clientHeight }
    this.renderer.setSize(this.screen.width, this.screen.height)
    this.camera.perspective({ aspect: this.screen.width / this.screen.height })
    const fov = (this.camera.fov * Math.PI) / 180
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z
    const width = height * this.camera.aspect
    this.viewport = { width, height }
    if (this.medias) this.medias.forEach(m => m.onResize({ screen: this.screen, viewport: this.viewport }))
  }
  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease)
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left'
    if (this.medias) this.medias.forEach(m => m.update(this.scroll, direction))
    this.renderer.render({ scene: this.scene, camera: this.camera })
    this.scroll.last = this.scroll.current
    this.raf = window.requestAnimationFrame(this.update.bind(this))
  }
  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this)
    this.boundOnWheel = this.onWheel.bind(this)
    this.boundPD = this.onPointerDown.bind(this)
    this.boundPM = this.onPointerMove.bind(this)
    this.boundPU = this.onPointerUp.bind(this)
    window.addEventListener('resize', this.boundOnResize)
    this.el.addEventListener('wheel', this.boundOnWheel, { passive: true })
    this.el.addEventListener('pointerdown', this.boundPD)
    this.el.addEventListener('pointermove', this.boundPM)
    this.el.addEventListener('pointerup', this.boundPU)
    this.el.addEventListener('pointercancel', this.boundPU)
    this.el.addEventListener('lostpointercapture', this.boundPU)
  }
  destroy() {
    window.cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.boundOnResize)
    this.el.removeEventListener('wheel', this.boundOnWheel)
    this.el.removeEventListener('pointerdown', this.boundPD)
    this.el.removeEventListener('pointermove', this.boundPM)
    this.el.removeEventListener('pointerup', this.boundPU)
    this.el.removeEventListener('pointercancel', this.boundPU)
    this.el.removeEventListener('lostpointercapture', this.boundPU)
    if (this.renderer?.gl?.canvas?.parentNode) this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas)
  }
}

/* Particles background (same as之前版本) */
const ParticlesBg = defineComponent({
  name: 'ParticlesBg',
  props: {
    particleColors: { type: Array, default: () => ['#ffffff', '#ffffff', '#ffffff'] },
    particleCount: { type: Number, default: 200 },
    particleSpread: { type: Number, default: 10 },
    speed: { type: Number, default: 0.1 },
    particleBaseSize: { type: Number, default: 100 },
    moveParticlesOnHover: { type: Boolean, default: false },
    particleHoverFactor: { type: Number, default: 1 },
    alphaParticles: { type: Boolean, default: false },
    sizeRandomness: { type: Number, default: 1 },
    cameraDistance: { type: Number, default: 20 },
    disableRotation: { type: Boolean, default: false }
  },
  setup(props) {
    const containerRef = ref(null)
    const mouse = { x: 0, y: 0 }
    let renderer, gl, camera, program, particles, animationFrameId

    const hexToRgb = (hex) => {
      hex = hex.replace(/^#/, '')
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
      const int = parseInt(hex, 16)
      return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255]
    }

    const vertex = `
      attribute vec3 position;
      attribute vec4 random;
      attribute vec3 color;
      uniform mat4 modelMatrix, viewMatrix, projectionMatrix;
      uniform float uTime, uSpread, uBaseSize, uSizeRandomness;
      varying vec4 vRandom; varying vec3 vColor;
      void main(){
        vRandom = random; vColor = color;
        vec3 pos = position * uSpread; pos.z *= 10.0;
        vec4 mPos = modelMatrix * vec4(pos, 1.0);
        float t = uTime;
        mPos.x += sin(t*random.z + 6.28*random.w) * mix(0.1, 1.5, random.x);
        mPos.y += sin(t*random.y + 6.28*random.x) * mix(0.1, 1.5, random.w);
        mPos.z += sin(t*random.w + 6.28*random.y) * mix(0.1, 1.5, random.z);
        vec4 mvPos = viewMatrix * mPos;
        gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `
    const fragment = `
      precision highp float;
      uniform float uTime, uAlphaParticles;
      varying vec4 vRandom; varying vec3 vColor;
      void main(){
        vec2 uv = gl_PointCoord.xy;
        float d = length(uv - vec2(0.5));
        if(uAlphaParticles < 0.5){ if(d > 0.5) discard; gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0); }
        else { float circle = smoothstep(0.5, 0.4, d) * 0.8; gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle); }
      }
    `

    function onResize() {
      const el = containerRef.value
      if (!el || !renderer) return
      const w = el.clientWidth, h = el.clientHeight
      renderer.setSize(w, h)
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height })
    }
    function onMouseMove(e) {
      const el = containerRef.value; if (!el) return
      const rect = el.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      mouse.x = x; mouse.y = y
    }

    onMounted(() => {
      const el = containerRef.value; if (!el) return
      renderer = new Renderer({ depth: false, alpha: true }); gl = renderer.gl
      el.appendChild(gl.canvas); gl.clearColor(0,0,0,0)
      camera = new Camera(gl, { fov: 15 }); camera.position.set(0,0,props.cameraDistance)
      window.addEventListener('resize', onResize); onResize()
      if (props.moveParticlesOnHover) window.addEventListener('mousemove', onMouseMove)

      const count = props.particleCount
      const positions = new Float32Array(count * 3)
      const randoms = new Float32Array(count * 4)
      const colors = new Float32Array(count * 3)
      const palette = props.particleColors?.length ? props.particleColors : ['#ffffff','#ffffff','#ffffff']
      for (let i=0;i<count;i++){
        let x,y,z,len; do{ x=Math.random()*2-1; y=Math.random()*2-1; z=Math.random()*2-1; len=x*x+y*y+z*z } while (len>1||len===0)
        const r = Math.cbrt(Math.random()); positions.set([x*r,y*r,z*r], i*3)
        randoms.set([Math.random(),Math.random(),Math.random(),Math.random()], i*4)
        const col = hexToRgb(palette[Math.floor(Math.random()*palette.length)]); colors.set(col, i*3)
      }
      const geometry = new Geometry(gl, { position:{size:3,data:positions}, random:{size:4,data:randoms}, color:{size:3,data:colors} })
      program = new Program(gl, {
        vertex, fragment,
        uniforms:{
          uTime:{value:0}, uSpread:{value:props.particleSpread},
          uBaseSize:{value:props.particleBaseSize},
          uSizeRandomness:{value:props.sizeRandomness},
          uAlphaParticles:{value:props.alphaParticles?1:0}
        },
        transparent:true, depthTest:false
      })
      particles = new Mesh(gl, { mode: gl.POINTS, geometry, program })

      let last = performance.now(), elapsed = 0
      const update = (t)=>{
        requestAnimationFrame(update)
        const d = t - last; last = t; elapsed += d * props.speed
        program.uniforms.uTime.value = elapsed * 0.001
        if (props.moveParticlesOnHover){ particles.position.x = -mouse.x * props.particleHoverFactor; particles.position.y = -mouse.y * props.particleHoverFactor }
        if (!props.disableRotation){ particles.rotation.x = Math.sin(elapsed*0.0002)*0.1; particles.rotation.y = Math.cos(elapsed*0.0005)*0.15; particles.rotation.z += 0.01 * props.speed }
        renderer.render({ scene: particles, camera })
      }
      requestAnimationFrame(update)
    })

    onBeforeUnmount(()=>{ window.removeEventListener('resize', onResize); window.removeEventListener('mousemove', onMouseMove) })
    return () => h('div', { ref: containerRef, class: 'particles-container' })
  }
})

/* S3 paging & signing */
async function listOnePage() {
  const out = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: PREFIX, ContinuationToken: cursor.value, MaxKeys: 40 }))
  cursor.value = out.IsTruncated ? out.NextContinuationToken : undefined
  const keys = (out.Contents ?? [])
    .map(o => o.Key)
    .filter(k => k && !k.endsWith('/'))
    .filter(k => /\.(jpe?g|png|webp|gif|avif)$/i.test(k))
    .filter(k => !seen.value.has(k))
  queue.value.push(...keys)
}
async function signBatch(keys) {
  return Promise.all(keys.map(async k => {
    const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: k }), { expiresIn: 1800 })
    return { image: url, text: k.split('/').pop() || '' }
  }))
}
async function fillBatch() {
  while (queue.value.length < BATCH_SIZE && cursor.value !== undefined) await listOnePage()
  if (!queue.value.length && cursor.value === undefined) { canShowMore.value = false; return [] }
  const pick = []
  while (queue.value.length && pick.length < BATCH_SIZE) {
    const k = queue.value.shift()
    if (!seen.value.has(k)) { seen.value.add(k); pick.push(k) }
  }
  if (!pick.length) { canShowMore.value = false; return [] }
  return await signBatch(pick)
}
async function showMore() {
  loading.value = true; error.value = null
  try {
    const batch = await fillBatch()
    if (batch.length) items.value = batch
  } catch (e) { error.value = e?.message || String(e) }
  finally { loading.value = false }
}

/* App lifecycle glue */
const containerRef = ref(null)
let app = null
function rebuildApp() {
  if (!containerRef.value) return
  if (app) { try { app.destroy() } catch {} app = null }
  if (!items.value.length) return
  app = new App(containerRef.value, {
    items: items.value,
    bend: PROP_BEND,
    textColor: PROP_TEXT_COLOR,
    borderRadius: PROP_BORDER_RADIUS,
    font: PROP_FONT,
    scrollSpeed: PROP_SCROLL_SPEED,
    scrollEase: PROP_SCROLL_EASE,
    onTap: (originalIndex) => { openLightbox(originalIndex) }
  })
}
async function onExplore() { await showMore(); await nextTick(); rebuildApp() }

/* Mount */
onMounted(async () => {
  loading.value = true
  try {
    cursor.value = undefined; queue.value = []; seen.value = new Set()
    let rounds = 0
    while (cursor.value !== undefined || rounds === 0) { await listOnePage(); rounds++; if (rounds >= PREFETCH_PAGES) break }
    const batch = await fillBatch()
    if (batch.length) items.value = batch
    await nextTick(); rebuildApp()
  } catch (e) { error.value = e?.message || String(e) }
  finally { loading.value = false }
})
onBeforeUnmount(() => { if (app) { try { app.destroy() } catch {} app = null } })
</script>

<style scoped>
/* Page shell (dark base improves contrast for white hero title) */
.page-wrapper{
  min-height:100vh;
  background:
    radial-gradient(1200px 600px at 50% 0%, rgba(6,78,59,.18), transparent 60%),
    #0b1020;
}

/* Full-page animated background */
.particles-container.bg-global{
  position:fixed;
  inset:0;
  z-index:0;
  pointer-events:none;
}

/* Foreground surface */
.page-surface{
  position:relative;
  z-index:1;
  display:flex;
  flex-direction:column;
  min-height:100vh;
}

main { flex:1; padding:24px; }

/* Title hero (borrowed look from your landing page) */
.hero{
  display:flex;
  flex-direction:column;
  align-items:center;
  text-align:center;
  margin: 4vh auto 8px;
}
.hero-title{
  color:#ffffff;
  font-weight:900;
  line-height:1.1;
  letter-spacing:.01em;
  text-shadow:0 6px 18px rgba(0,0,0,.95);
  font-size: clamp(2.4rem, 4.8vw + 1rem, 4.25rem);
  margin: 0 0 .35rem;
}
.hero-subtitle{
  color:#eafaf7;
  opacity:.95;
  font-weight:600;
  line-height:1.55;
  text-shadow:0 6px 18px rgba(0,0,0,1);
  font-size: clamp(1rem, 1.2vw + .6rem, 1.35rem);
  margin: 0 0 10px;
}
.mobile-break{ display:none; }
@media (max-width:768px){
  .mobile-break{ display:inline; }
  .hero-title{ white-space:normal; font-size: clamp(1.9rem, 6vw + .6rem, 2.8rem); }
}

/* Display area */
.stage {
  position: relative;
  width: min(1100px, 94vw);
  height: clamp(420px, 58vh, 640px);
  margin: 10px auto 0;
  display: grid;
  place-items: center;
}
.circular-gallery {
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: grab;
  position: relative;
  z-index:1;
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(0,0,0,.35);
}
.circular-gallery:active { cursor: grabbing; }

/* Actions below the gallery */
.stage-actions{
  width: min(1100px, 94vw);
  margin: 14px auto 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.cg-explore-btn{
  padding:12px 18px;
  border-radius:9999px;
  font-weight:800;
  cursor:pointer;
  border:2px solid #9EE6D8;
  background:#0e5b4b;
  color:#E8FFFA;
  box-shadow:0 12px 28px rgba(0,0,0,.28);
}
.cg-explore-btn:disabled{ opacity:.55; cursor:not-allowed; }
.cg-error{
  background:#fee2e2; color:#991b1b;
  padding:6px 10px; border-radius:8px;
  font-size:12px; box-shadow:0 2px 8px rgba(0,0,0,.08);
}
.muted { color:#9fb2b7; text-align:center; }

/* Lightbox */
.lb { position: fixed; inset: 0; background: rgba(0,0,0,.72); display: grid; place-items: center; z-index: 60; }
.lb-img { max-width: 92vw; max-height: 82vh; border-radius: 12px; box-shadow: 0 12px 36px rgba(0,0,0,.4); }
.lb-close { position:absolute; top:14px; right:14px; font-size:22px; line-height:1; border:none; background:#fff; color:#111; border-radius:9999px; width:36px; height:36px; cursor:pointer; }
.lb-nav { position:absolute; top:50%; transform: translateY(-50%); width:44px; height:44px; border:none; border-radius:9999px; background:#fff; color:#111; font-size:24px; cursor:pointer; }
.lb-nav.prev { left:14px; }
.lb-nav.next { right:14px; }
</style>
