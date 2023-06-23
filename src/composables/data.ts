import { json } from 'd3'
import type { FeatureCollection, Geometry } from 'geojson'

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

// data
export const stars = await json('../stars.6.min.geojson') as starCollection
export const constella = await json('../constellations.min.geojson') as constellaCollection
export const constellaLines = await json('../constellations.lines.min.geojson') as constellaCollection

export const spectrum = [
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
