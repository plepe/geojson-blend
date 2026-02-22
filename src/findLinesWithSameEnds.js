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
        if (cut(a, ai, aPrefix, b, bi, bPrefix, result, options)) {
          restart = true
        }
      } else if (distances[1] < options.distance) {
        b.features[bi].geometry.coordinates.reverse()

        if (cut(a, ai, aPrefix, b, bi, bPrefix, result, options)) {
          restart = true
        }

        if (b.features[bi]) {
          b.features[bi].geometry.coordinates.reverse()
        }
      } else if (distances[2] < options.distance) {
        a.features[ai].geometry.coordinates.reverse()

        if (cut(a, ai, aPrefix, b, bi, bPrefix, result, options)) {
          restart = true
        }

        if (a.features[ai]) {
          a.features[ai].geometry.coordinates.reverse()
        }
      } else if (distances[3] < options.distance) {
        a.features[ai].geometry.coordinates.reverse()
        b.features[bi].geometry.coordinates.reverse()

        if (cut(a, ai, aPrefix, b, bi, bPrefix, result, options)) {
          restart = true
        }

        if (a.features[ai]) {
          a.features[ai].geometry.coordinates.reverse()
        }
        if (b.features[bi]) {
          b.features[bi].geometry.coordinates.reverse()
        }
      }
    })

    if (restart) {
      ai--
    }
  }
}

function cut (a, ai, aPrefix, b, bi, bPrefix, result, options) {
  const aItem = a.features[ai]
  const bItem = b.features[bi]

  const length = getCommonLength(aItem, 0, 1, bItem, 0, 1, options)
  const aLength = turf.length(aItem, { units: 'meters' })
  const bLength = turf.length(bItem, { units: 'meters' })

  if (length == 0) {
    return false
  }

  //console.log('length', length)
  const item = turf.lineSliceAlong(aItem, 0, length, { units: 'meters' })

  Object.entries(aItem.properties).forEach(([k, v]) => {
    item.properties[aPrefix + k] = v
  })
  Object.entries(bItem.properties).forEach(([k, v]) => {
    item.properties[bPrefix + k] = v
  })

  result.features.push(item)

  if (aLength > length) {
    a.features[ai] = turf.lineSliceAlong(aItem, length, aLength, { units: 'meters' })
    a.features[ai].properties = aItem.properties
  } else {
    a.features[ai] = null
  }

  if (bLength > length) {
    b.features[bi] = turf.lineSliceAlong(bItem, length, bLength, { units: 'meters' })
    b.features[bi].properties = bItem.properties
  } else {
    b.features[bi] = null
  }

  return true
}
