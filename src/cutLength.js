const turf = require('@turf/turf')

module.exports = function cutLength (a, ai, aPos, aDir, aPrefix, b, bi, bPos, bDir, bPrefix, length, result, options) {
  const aItem = a.features[ai]
  const bItem = b.features[bi]

  const aLength = turf.length(aItem, { units: 'meters' })
  const bLength = turf.length(bItem, { units: 'meters' })

  //console.log(aDir, aPos - length, aPos, length, aLength)
  const item = aDir === 1 ?
    turf.lineSliceAlong(aItem, aPos, aPos + length, { units: 'meters' }) :
    turf.lineSliceAlong(aItem, aPos - length, aPos, { units: 'meters' })

  Object.entries(aItem.properties).forEach(([k, v]) => {
    item.properties[aPrefix + k] = v
  })
  Object.entries(bItem.properties).forEach(([k, v]) => {
    item.properties[bPrefix + k] = v
  })

  result.features.push(item)

  addRemains(a, ai, aPos, aDir, length)
  addRemains(b, bi, bPos, bDir, length)

  return true
}

function addRemains (list, index, pos, dir, length) {
  const item = list.features[index]
  const itemLength = turf.length(item, { units: 'meters' })
  const result = []

  if (dir < 0) {
    if (pos - length > 0) {
      result.push(turf.lineSliceAlong(item, pos - length, pos, { units: 'meters' }))
    }
    if (pos < itemLength) {
      result.push(turf.lineSliceAlong(item, pos, itemLength, { units: 'meters' }))
    }
  } else {
    if (pos > 0) {
      result.push(turf.lineSliceAlong(item, 0, pos, { units: 'meters' }))
    }
    if (pos + length < itemLength) {
      result.push(turf.lineSliceAlong(item, pos + length, itemLength, { units: 'meters' }))
    }
  }

  result.forEach(r => {
    r.properties = item.properties
  })

  if (result.length > 0) {
    list.features[index] = result[0]
  }
  if (result.length > 1) {
    list.features.push(result[1])
  }
}
