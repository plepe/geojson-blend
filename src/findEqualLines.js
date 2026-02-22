const turf = require('@turf/turf')

module.exports = function findEqualLines (a, b, result, aPrefix, bPrefix, options) {
  // console.error('building buffers for a')
  const aBuffered = a.features.map(i => turf.buffer(i, options.distance, { units: 'meters' }))
  // console.error('building buffers for b')
  const bBuffered = b.features.map(i => turf.buffer(i, options.distance, { units: 'meters' }))
  // console.error('building buffers done')

  a.features.forEach((aItem, ai) => {
    if (!aItem) { return }

    b.features.forEach((bItem, bi) => {
      if (!bItem) { return }

      if (turf.booleanWithin(aItem, bBuffered[bi]) && turf.booleanWithin(bItem, aBuffered[ai])) {
        // console.error('found', ai, bi)
        const item = {
          type: 'Feature',
          properties: {},
          geometry: aItem.geometry
        }

        Object.entries(aItem.properties).forEach(([k, v]) => {
          item.properties[aPrefix + k] = v
        })
        Object.entries(bItem.properties).forEach(([k, v]) => {
          item.properties[bPrefix + k] = v
        })

        a[ai] = null
        b[bi] = null

        result.features.push(item)
      }
    })
  })
}


