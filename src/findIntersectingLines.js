const turf = require('@turf/turf')
const cutLength = require('./cutLength.js')
const getCommonLength = require('./getCommonLength.js')

module.exports = function findIntersectingLines (a, b, result, aPrefix, bPrefix, options) {
  let restart = false
  for (let ai = 0; ai < a.features.length; ai++) {
    // console.log(ai)
    let aItem = a.features[ai]
    if (!aItem) { continue }

    restart = false

    b.features.forEach((bItem, bi) => {
      if (restart) { return }
      if (!bItem) { return }

      const r = findCross(aItem, bItem, options)
      if (!r) { return }

      const [ aPos, aDir, bPos, bDir, length ] = r

      if (cutLength(a, ai, aPos, aDir, aPrefix, b, bi, bPos, bDir, bPrefix, length, result, options)) {
        restart = true
      }
    })

    if (restart) {
      ai--
    }
  }
}

function findCross (aItem, bItem, options) {
  const pois = turf.lineIntersect(aItem, bItem)
  if (!pois.features.length) {
    return
  }

  for (let poiIndex = 0; poiIndex < pois.features.length; poiIndex++) {
    const aPos = turf.nearestPointOnLine(aItem, pois.features[poiIndex], { units: 'meters' }).properties.location
    const bPos = turf.nearestPointOnLine(bItem, pois.features[poiIndex], { units: 'meters' }).properties.location

    const commonLengths = [
      getCommonLength(aItem, aPos, 1, bItem, bPos, 1, options),
      getCommonLength(aItem, aPos, -1, bItem, bPos, 1, options),
      getCommonLength(aItem, aPos, 1, bItem, bPos, -1, options),
      getCommonLength(aItem, aPos, -1, bItem, bPos, -1, options),
    ]
    const maxLength = Math.max(...commonLengths)
    console.log(commonLengths, maxLength)

    if (maxLength > 1) {
      const i = commonLengths.indexOf(maxLength)
      return [aPos, i % 2 ? -1 : 1, bPos, i > 1 ? -1 : 1, maxLength ]
    }
  }
}
