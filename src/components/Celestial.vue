<!-- eslint-disable unused-imports/no-unused-imports -->
<!-- d3 will use `this` variable hence not compatible with compositional api -->
<script setup lang="ts">
import { extent, geoPath, json, scalePow, scaleQuantize } from 'd3'
import type { FeatureCollection, Geometry } from 'geojson'
import { geoAitoff } from 'd3-geo-projection'
import { reactive } from 'vue'
import { useWindowSize } from '@vueuse/core'

interface pStar {
  id: number
  mag: number
  bv: number
  name: string | null
}

interface pConstella {
  id: number
  name: string | null
}

interface starCollection extends FeatureCollection<Geometry, pStar> {}
interface constellaCollection extends FeatureCollection<Geometry, pConstella> {}

// const geoAitoff: GeoProjection = gaf
// container
const el = ref<HTMLCanvasElement | null>(null)

// canvas
const size = reactive(useWindowSize({ includeScrollbar: false }))

// data
const stars = await json('../stars.6.min.geojson') as starCollection
const constella = await json('../constellations.min.geojson') as constellaCollection
const constellaLines = await json('../constellations.lines.min.geojson') as constellaCollection

// transform
const lon = ref(0)
const lat = ref(0)
const proj = geoAitoff()
  .center([0, 0])
  .rotate([lon.value, lat.value])

// constants
const starbase = ref(4)
const starexp = ref(-0.28)

// marker size, color
const starMagRange = extent(stars.features, d => d.properties.mag) as [number, number]
// main sequence (主序星) bv <= 1.7
const starBVRange = extent(stars.features, d => d.properties.bv) as [number, number]
// bv 光谱
const starSpectrum = [
  '#9bbcff', '#9fbfff', '#a4c2ff', '#a9c5ff', '#afc9ff', '#b7ceff',
  '#bfd3ff', '#c9d9ff', '#d3e0ff', '#d7e2ff', '#d9e3ff', '#dce5ff',
  '#dee6ff', '#e0e7ff', '#e3e9ff', '#e6ebff', '#e9edff', '#ebeeff',
  '#eff0ff', '#f3f2ff', '#f6f4ff', '#f9f6ff', '#fef9ff', '#fff9fd',
  '#fff6f8', '#fff5f5', '#fff4f2', '#fff2ec', '#fff0e9', '#ffefe6',
  '#ffece0', '#ffebdc', '#ffe9d9', '#ffe8d5', '#ffe4ce', '#ffe3ca',
  '#ffe1c6', '#ffdfc2', '#ffddbe', '#ffdbba', '#ffd9b6', '#ffd7b1',
  '#ffd5ad', '#ffd3a8', '#ffd1a3', '#ffce9f', '#ffcc99', '#ffc994',
  '#ffc892', '#ffc78f', '#ffc489', '#ffc184', '#ffbe7e', '#ffbb78',
  '#ffb975', '#ffb872', '#ffb46b', '#ffb269', '#ffb165', '#ffad5e',
  '#ffab5a', '#ffa957', '#ffa753', '#ffa54f', '#ffa34b', '#ffa148',
  '#ff9d3f', '#ff9a3c', '#ff9836', '#ff9631', '#ff932c', '#ff9127',
  '#ff8e21', '#ff8b1a', '#ff8912', '#ff870a', '#ff8506', '#ff8300',
  '#ff8100', '#ff7e00', '#ff7c00', '#ff7a00', '#ff7800', '#ff7500',
  '#ff7300', '#ff7000', '#ff6d00', '#ff6b00', '#ff6900', '#ff6700',
  '#ff6500', '#ff6300', '#ff6000', '#ff5d00', '#ff5b00', '#ff5900',
  '#ff5600', '#ff5300', '#ff4f00', '#ff4b00', '#ff4700']

const starColorRange = scaleQuantize(starBVRange, starSpectrum)
// console.log(starMagRange.map(starSize))
// console.log(starBVRange.map(starSize))
// console.log(starMagRange)
// console.log(starBVRange)

function initCanvas(canvas: HTMLCanvasElement, width = 400, height = 400, _dpi?: number) {
  const ctx = canvas.getContext('2d')!

  const dpr = window.devicePixelRatio || 1
  // @ts-expect-error vendor
  const bsr = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1

  const dpi = _dpi || dpr / bsr

  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  canvas.width = dpi * width
  canvas.height = dpi * height
  ctx.scale(dpi, dpi)

  // console.log(width, height, dpi, canvas.width)

  return { ctx, dpi }
}

function render() {
  const canvas = el.value!
  const { ctx } = initCanvas(canvas, size.width, size.height)
  const { width, height } = canvas
  // we follow settings in d3-celestial
  // const ratio = 2
  // for aitoff, the scale is 162 in d3-celestial, no idea of this number and 1024
  const scale = 160 * width / 1024
  // const scale = width
  const adapt: number = Math.sqrt(proj.scale() / scale)

  function starSize(mag: number | null) {
    if (mag === null)
      return 0.1
    return Math.max(adapt * starbase.value * Math.exp(starexp.value * (mag + 2)), 0.1)
  }

  const starSizeRange = scalePow(starMagRange, starMagRange.map(starSize))
  proj.fitExtent([[0, 0], [width, height]], stars)
  // console.log(proj.scale())
  const starPath = geoPath(proj, ctx).pointRadius(d => starSizeRange(d.properties.mag))
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width, height)
  stars.features.forEach((star) => {
    ctx.beginPath()
    starPath(star)
    ctx.fillStyle = starColorRange(star.properties.bv)
    ctx.fill()
  })
}

onMounted(async () => {
  window.addEventListener('resize', render)
  render()
})

onUnmounted(() => {
  window.removeEventListener('resize', render)
})
</script>

<template>
  <canvas id="celestial" ref="el" width="400" height="400" />
</template>
