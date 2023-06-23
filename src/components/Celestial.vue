<!-- eslint-disable unused-imports/no-unused-imports -->
<!-- d3 will use `this` variable hence not compatible with compositional api -->
<script setup lang="ts">
import { extent, geoEquirectangular, geoPath, scalePow, scaleQuantize, zoom } from 'd3'
import { reactive } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { constellaLines, constellations, getAngles, getZenith, spectrum, stars } from '~/composables'

// container
const el = ref<HTMLCanvasElement | null>(null)

// canvas
const size = reactive(useWindowSize({ includeScrollbar: false }))

// transform

const projection = geoEquirectangular()
const proj_scale = projection.scale()
const projectionRatio = 1 // since we use 30° clip circle
const zoomlevel = 1
const zenith = getZenith()
const rotation = getAngles(zenith)

// constants
const starbase = 7
const starexp = -0.28

// marker size, color
const starMagRange = extent(stars.features, d => d.properties.mag) as [number, number]
// main sequence (主序星) bv <= 1.7
const starBVRange = extent(stars.features, d => d.properties.bv) as [number, number]
const starColorRange = scaleQuantize(starBVRange, spectrum)

function initCanvas(canvas: HTMLCanvasElement, width = 400, height = 400, _dpi?: number) {
  const ctx = canvas.getContext('2d')!

  const dpr = window.devicePixelRatio || 1
  // @ts-expect-error vendor
  const bsr = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1

  const dpi = _dpi || dpr / bsr

  // const l = Math.min(width, height)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  canvas.width = height * dpi
  canvas.height = height * dpi
  // ctx.scale(dpi, dpi)
  // console.log(width, height, dpi, dpr)

  return { ctx, dpi }
}

function render() {
  const canvas = el.value!
  const length = (size.height < size.width) ? size.height : size.width
  const { ctx } = initCanvas(canvas, length, length)
  const { width, height } = canvas
  const l = width
  const r = size.width / size.height
  // w, h as the view field width and height adapt to actual window shape
  const w = l / Math.sqrt(1 + 1 / (r * r))
  const h = l / Math.sqrt(1 + (r * r))
  // auxiliary figures0
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = 'blue' // Border color
  ctx.lineWidth = 2 // Border width
  ctx.strokeRect((l - w) / 2, (l - h) / 2, w, h)

  // console.log(w, h)
  // we follow settings in d3-celestial
  // for aitoff, the scale is 162 in d3-celestial, no idea of this number and 1024
  const scale = width / 1024
  console.log('scale', scale)
  console.log('width', width)
  // const scale = width

  function starSize(mag: number | null) {
    const adapt = Math.sqrt(scale)
    if (mag === null)
      return 0.1
    return Math.max(adapt * starbase * Math.exp(starexp * (mag + 2)), 0.1)
  }
  projection
    .rotate(rotation) // 投影球面的转动，即观察者转动观察角度和方向，我们默认不转动，观察者始终盯着天顶
    .clipAngle(30) // 投影的经纬度范围，即观察者的视野范围，这里采用正常人眼的中央视野范围，即+-30°
    // .center([0, 0])
  const starSizeRange = scalePow(starMagRange, starMagRange.map(starSize)).exponent(1)
  // projection
  projection
    .fitExtent([[0, 0], [width, height]], stars)
    // .fitExtent([[(l - w) / 2, (l - h) / 2], [(l + w) / 2, (l + h) / 2]], stars)

  // console.log(width, height)

  const starPath = geoPath(projection, ctx).pointRadius(d => starSizeRange(d.properties.mag))
  // draw stars
  stars.features.forEach((star) => {
    ctx.beginPath()
    starPath(star)
    ctx.fillStyle = starColorRange(star.properties.bv)
    ctx.fill()
  })
}

onMounted(async () => {
  // window.addEventListener('resize', render)
  watchEffect(() => {
    render()
  })
})
</script>

<template>
  <canvas id="celestial" ref="el" width="400" height="400" style="display: block" />
</template>
