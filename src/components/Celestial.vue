<!-- eslint-disable unused-imports/no-unused-imports -->
<!-- d3 will use `this` variable hence not compatible with compositional api -->
<script setup lang="ts">
import { geoEquirectangular, geoPath } from 'd3'
import { reactive } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { constellaLines, constellations, getAngles, getZenith, starColor, starSize, stars } from '~/composables'

// container
const el = ref<HTMLCanvasElement | null>(null)

// canvas
const size = reactive(useWindowSize({ includeScrollbar: false }))
const zenith = await getZenith()

// transform

function initCanvas(canvas: HTMLCanvasElement, width = 400, height = 400, _dpi?: number) {
  const ctx = canvas.getContext('2d')!

  const dpr = window.devicePixelRatio || 1
  // @ts-expect-error vendor
  const bsr = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1

  const dpi = _dpi || dpr / bsr

  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  canvas.width = width * dpi
  canvas.height = height * dpi
  // ctx.scale(dpi, dpi)

  return { ctx, dpi }
}

async function render() {
  const canvas = el.value!
  const { ctx } = initCanvas(canvas, size.width, size.height)
  const { width, height } = canvas
  const ratio = width / height
  const [w, h] = (ratio > 1) ? [30, 30 / ratio] : [30 * ratio, 30]
  const coordinates = [[-w, -h], [-w, h], [w, -h], [w, h]]

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)

  const rotation = getAngles(zenith)

  const scale = width / 1024
  const adapt = Math.sqrt(scale)
  const projection
  = geoEquirectangular()
    .fitExtent([[0, 0], [width, height]], { type: 'MultiPoint', coordinates })
    .rotate(rotation) // 投影球面的转动，即观察者转动观察角度和方向，我们默认不转动，观察者始终盯着天顶
    .reflectX(true)

  const starsPath = geoPath(projection, ctx).pointRadius(d => Math.max(adapt * starSize(d.properties.mag), 0.1))
  const constellaLinesPath = geoPath(projection, ctx)
  // draw stars
  stars.features.forEach((star) => {
    ctx.beginPath()
    starsPath(star)
    ctx.fillStyle = starColor(star.properties.bv)
    ctx.fill()
    const pt = projection(star.geometry.coordinates) as [number, number]
    const r = Math.max(adapt * starSize(star.properties.mag), 0.1)
    ctx.font = '14px '
    if (star.properties.name !== null)
      ctx.fillText(star.properties.name, pt[0] - r, pt[1]) // 避让半径
  })

  // draw constellation
  ctx.beginPath()
  constellaLinesPath(constellaLines)
  ctx.strokeStyle = '#999'
  ctx.stroke()

  // draw constellation name
  constellations.features.forEach((constellation) => {
    ctx.beginPath()
    const pt = projection(constellation.geometry.coordinates) as [number, number]
    if (constellation.properties.name !== null)
      ctx.fillText(constellation.properties.name, pt[0], pt[1]) // 避让半径
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
