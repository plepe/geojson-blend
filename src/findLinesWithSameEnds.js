const turf = require('@turf/turf')

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

  const length = getCommonLength(aItem, bItem, options)
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

function getCommonLength (a, b, options) {
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
