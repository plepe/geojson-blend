const turf = require('@turf/turf')

module.exports = function getCommonLength (aItem, aPos, aDir, bItem, bPos, bDir, options) {
  const step = 1
  const maxLength = Math.min(
    aDir === 1 ? turf.length(aItem, { units: 'meters' }) - aPos : aPos,
    bDir === 1 ? turf.length(bItem, { units: 'meters' }) - bPos : bPos
  )

  for (let pos = 0; pos < maxLength; pos += step) {
    const d = turf.distance(
      turf.along(aItem, aPos + pos * aDir, { units: 'meters' }),
      turf.along(bItem, bPos + pos * bDir, { units: 'meters' }),
      { units: 'meters' }
    )

    if (d >= options.distance) {
      return Math.max(pos - step - options.distance, 0)
    }
  }

  return maxLength
}
