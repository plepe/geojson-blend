const turf = require('@turf/turf')

module.exports = function getCommonLength (a, b, options) {
  let pos = 0
  const step = 1
  const maxLength = Math.min(turf.length(a, { units: 'meters' }), turf.length(b, { units: 'meters' }))

  for (let pos = 0; pos < maxLength; pos += step) {
    const d = turf.distance(turf.along(a, pos, { units: 'meters' }), turf.along(b, pos, { units: 'meters' }), { units: 'meters' })
    if (d >= options.distance) {
      return Math.max(pos - step - options.distance, 0)
    }
  }

  return maxLength
}
