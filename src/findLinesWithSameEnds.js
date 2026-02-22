const turf = require('@turf/turf')
const cut = require('./cut.js')

module.exports = function findLinesWithSameEnds (a, b, result, aPrefix, bPrefix, options) {
  let restart = false
  for (let ai = 0; ai < a.features.length; ai++) {
    // console.log(ai)
    let aItem = a.features[ai]
    if (!aItem) { continue }

    restart = false
    const aPoi1 = aItem.geometry.coordinates[0]
    const aPoi2 = aItem.geometry.coordinates[aItem.geometry.coordinates.length - 1]

    b.features.forEach((bItem, bi) => {
      if (restart) { return }
      if (!bItem) { return }

      const bPoi1 = bItem.geometry.coordinates[0]
      const bPoi2 = bItem.geometry.coordinates[bItem.geometry.coordinates.length - 1]

      const distances = [ turf.distance(aPoi1, bPoi1, { units: 'meters' }), turf.distance(aPoi1, bPoi2, { units: 'meters' }), turf.distance(aPoi2, bPoi1, { units: 'meters' }), turf.distance(aPoi2, bPoi2, { units: 'meters' }) ]

      if (distances[0] < options.distance) {
        if (cut(a, ai, 1, aPrefix, b, bi, 1, bPrefix, result, options)) {
          restart = true
        }
      } else if (distances[1] < options.distance) {
        if (cut(a, ai, 1, aPrefix, b, bi, -1, bPrefix, result, options)) {
          restart = true
        }
      } else if (distances[2] < options.distance) {
        if (cut(a, ai, -1, aPrefix, b, bi, 1, bPrefix, result, options)) {
          restart = true
        }
      } else if (distances[3] < options.distance) {
        if (cut(a, ai, -1, aPrefix, b, bi, -1, bPrefix, result, options)) {
          restart = true
        }
      }
    })

    if (restart) {
      ai--
    }
  }
}
