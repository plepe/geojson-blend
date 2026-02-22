const turf = require('@turf/turf')
const getCommonLength = require('./getCommonLength.js')

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

function cut (a, ai, aDir, aPrefix, b, bi, bDir, bPrefix, result, options) {
  const aItem = a.features[ai]
  const bItem = b.features[bi]

  const aLength = turf.length(aItem, { units: 'meters' })
  const bLength = turf.length(bItem, { units: 'meters' })
  const length = getCommonLength(aItem, aDir === 1 ? 0 : aLength, aDir, bItem, bDir === 1 ? 0 : bLength, bDir, options)

  if (length == 0) {
    return false
  }

  //console.log('length', length)
  const item = aDir === 1 ?
    turf.lineSliceAlong(aItem, 0, length, { units: 'meters' }) :
    turf.lineSliceAlong(aItem, aLength - length, aLength, { units: 'meters' })

  Object.entries(aItem.properties).forEach(([k, v]) => {
    item.properties[aPrefix + k] = v
  })
  Object.entries(bItem.properties).forEach(([k, v]) => {
    item.properties[bPrefix + k] = v
  })

  result.features.push(item)

  if (aLength > length) {
    a.features[ai] = aDir === 1 ?
      turf.lineSliceAlong(aItem, length, aLength, { units: 'meters' }) :
      turf.lineSliceAlong(aItem, 0, aLength - length, { units: 'meters' })
    a.features[ai].properties = aItem.properties
  } else {
    a.features[ai] = null
  }

  if (bLength > length) {
    b.features[bi] = bDir === 1 ?
      turf.lineSliceAlong(bItem, length, bLength, { units: 'meters' }) :
      turf.lineSliceAlong(bItem, 0, bLength - length, { units: 'meters' })
    b.features[bi].properties = bItem.properties
  } else {
    b.features[bi] = null
  }

  return true
}
