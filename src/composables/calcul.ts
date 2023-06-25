// astronomical calculation functions, mainly adapted from d3-celestial

const eulerAngles = {
  equatorial: [0.0, 0.0, 0.0], // 赤道
  ecliptic: [0.0, 0.0, 23.4393], // 黄道
}

/**
 * Get rotation euler angles such that the given coords is rotated to the center
 * @param coords - [latitude, longitude, orientation(optional)]
 * @returns euler angle
 */
export function getAngles(coords: [number, number] | [number, number, number]): [number, number, number] {
  if (coords === null || coords.length <= 0)
    return [0, 0, 0]
  const rot = eulerAngles.equatorial
  if (!coords[2])
    coords[2] = 0
  return [rot[0] - coords[0], rot[1] - coords[1], rot[2] + coords[2]]
}

async function getGeoPos(): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => { resolve([pos.coords.latitude, pos.coords.longitude]) },

      (err) => {
        console.error(`Error: ${err.message}, fallback to [0,0]`)
        // eslint-disable-next-line prefer-promise-reject-errors
        reject([0, 0])
      }, // we prefer return a default fallback if error
    )
  })
}

/**
* we need to find equatorial coordinates for zenith
* i.e. right ascention and declination
* its declination is equal to the observer's latitude
* while its right ascention depends on the sidereal time
*/
export async function getZenith(): Promise<[number, number]> {
  const loc = await getGeoPos()
  console.log(loc)
  const dt = new Date()
  const ra = getMST(dt, loc[1])
  const dec = loc[0]
  return [ra, dec]
}

function getMST(dt: Date, lon: number) {
  let yr = dt.getUTCFullYear()
  let mo = dt.getUTCMonth() + 1
  const dy = dt.getUTCDate()
  const h = dt.getUTCHours()
  const m = dt.getUTCMinutes()
  const s = dt.getUTCSeconds()

  if ((mo === 1) || (mo === 2)) {
    yr = yr - 1
    mo = mo + 12
  }

  const a = Math.floor(yr / 100)
  const b = 2 - a + Math.floor(a / 4)
  const c = Math.floor(365.25 * yr)
  const d = Math.floor(30.6001 * (mo + 1))

  // days since J2000.0
  const jd = b + c + d - 730550.5 + dy + (h + m / 60.0 + s / 3600.0) / 24.0

  // julian centuries since J2000.0
  const jt = jd / 36525.0

  // the mean sidereal time in degrees
  let mst = 280.46061837 + 360.98564736629 * jd + 0.000387933 * jt * jt - jt * jt * jt / 38710000 + lon

  // in degrees modulo 360.0
  if (mst > 0.0)
    while (mst > 360.0) mst = mst - 360.0
  else
    while (mst < 0.0) mst = mst + 360.0

  return mst
}
