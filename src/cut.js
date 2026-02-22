const turf = require('@turf/turf')
const getCommonLength = require('./getCommonLength.js')

module.exports = function cut (a, ai, aDir, aPrefix, b, bi, bDir, bPrefix, result, options) {
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
