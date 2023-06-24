<!-- eslint-disable unused-imports/no-unused-imports -->
<!-- d3 will use `this` variable hence not compatible with compositional api -->
<script setup lang="ts">
import { geoEquirectangular, geoPath, zoom } from 'd3'
import { reactive } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { constellaLines, constellations, getAngles, getZenith, starColor, starSize, stars } from '~/composables'

// container
const el = ref<HTMLCanvasElement | null>(null)

// canvas
const size = reactive(useWindowSize({ includeScrollbar: false }))

// transform

const projection = geoEquirectangular()
const projectionRatio = 1 // since we use 30° clip circle
const zenith = getZenith()
const rotation = getAngles(zenith)

function initCanvas(canvas: HTMLCanvasElement, width = 400, height = 400, _dpi?: number) {
  const ctx = canvas.getContext('2d')!

  const dpr = window.devicePixelRatio || 1
  // @ts-expect-error vendor
  const bsr = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1

  const dpi = _dpi || dpr / bsr

  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  canvas.width = height * dpi
  canvas.height = height * dpi
  // ctx.scale(dpi, dpi)

  return { ctx, dpi }
}

function render() {
  const canvas = el.value!
  const length = (size.height < size.width) ? size.height : size.width
  const { ctx } = initCanvas(canvas, length, length * projectionRatio)
  const { width, height } = canvas
  const l = width
  const r = size.width / size.height
  // w, h as the view field width and height adapt to actual window shape
  const w = l / Math.sqrt(1 + 1 / (r * r))
  const h = l / Math.sqrt(1 + (r * r))
  // auxiliary figures
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = 'blue' // Border color
  ctx.lineWidth = 2 // Border width
  ctx.strokeRect((l - w) / 2, (l - h) / 2, w, h)

  const scale = width / 1024
  const adapt = Math.sqrt(scale)

  projection
    .rotate(rotation) // 投影球面的转动，即观察者转动观察角度和方向，我们默认不转动，观察者始终盯着天顶
    .clipAngle(30) // 投影的经纬度范围，即观察者的视野范围，这里采用正常人眼的中央视野范围，即+-30°
    // .center([0, 0])
    .fitExtent([[0, 0], [width, height]], stars)
    // .translate([[(l - w) / 2, (l - h) / 2], [(l + w) / 2, (l + h) / 2]])

  // console.log(width, height)

  const starPath = geoPath(projection, ctx).pointRadius(d => Math.max(adapt * starSize(d.properties.mag), 0.1))
  // draw stars
  stars.features.forEach((star) => {
    ctx.beginPath()
    starPath(star)
    ctx.fillStyle = starColor(star.properties.bv)
    ctx.fill()
  })
}

onMounted(async () => {
  watchEffect(() => {
    render()
  })
})
</script>

<template>
  <canvas id="celestial" ref="el" width="400" height="400" style="display: block" />
</template>
