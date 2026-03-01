const turf = require('@turf/turf')

module.exports = function findNearbySections (a, b, result, aPrefix, bPrefix, options) {
  for (let ai = 0; ai < a.features.length; ai++) {
    const aItem = a.features[ai]
    if (!aItem) { return }

    const aLength = turf.length(aItem, { units: 'meters' })
    const aBuffer = turf.buffer(aItem, options.distance, { units: 'meters' })
    let match = null
    let maxMatchLength = 0

    b.features.forEach((bItem, bi) => {
      if (!bItem) { return }

      if (!turf.booleanIntersects(aBuffer, bItem)) { return }

      let aStart = null, aEnd = null
      let bStart = null, bEnd = null
      let bLastPos = null
      for (let pos = 0; pos < aLength; pos += options.step) {
        const aPoi = turf.along(aItem, pos, { units: 'meters' })
        const bPoi = turf.nearestPointOnLine(bItem, aPoi, { units: 'meters' })

        if (bPoi.properties.dist < options.distance) {
          if (bStart === null) {
            aStart = pos
            bStart = bPoi.properties.location
          }
          bLastPos = bPoi.properties.location
        } else if (bStart !== null) {
          aEnd = pos - options.step
          bEnd = bLastPos
          break
        }
      }

      if (bStart !== null && bEnd === null) {
        const aPoi = turf.along(aItem, aLength, { units: 'meters' })
        const bPoi = turf.nearestPointOnLine(bItem, aPoi, { units: 'meters' })
        if (bPoi.properties.dist < options.distance) {
          bEnd = bPoi.properties.location
        } else {
          bEnd = bLastPos
        }
        aEnd = aLength
      }

      if (Math.abs(aEnd - aStart) > options.distance) {
        const similar = Math.abs(bEnd - bStart) / (aEnd - aStart)

        if (similar > 0.9 && similar < 1.1) {
          //console.error('found', ai, bi, similar)
          //console.log('  A', aStart, aEnd, aEnd - aStart)
          //console.log('  B', bStart, bEnd, bEnd - bStart)
          const aMatchLength = aEnd - aStart
          if (aMatchLength > maxMatchLength) {
            match = { index: bi, aStart, aEnd, bStart, bEnd}
            maxMatchLength = aMatchLength
          }
        }
      }
    })

    if (match) {
      let aRemains = []
      const bItem = b.features[match.index]

      if (match.aStart > 0) {
        const l = turf.lineSliceAlong(aItem, 0, match.aStart, { units: 'meters' })
        l.properties = aItem.properties
        aRemains.push(l)
      }
      if (match.aEnd < aLength) {
        const l = turf.lineSliceAlong(aItem, match.aEnd, aLength, { units: 'meters' })
        l.properties = aItem.properties
        aRemains.push(l)
      }

      const item = turf.lineSliceAlong(aItem, match.aStart, match.aEnd, { units: 'meters' })
      Object.entries(aItem.properties).forEach(([k, v]) => {
        item.properties[aPrefix + k] = v
      })
      Object.entries(bItem.properties).forEach(([k, v]) => {
        item.properties[bPrefix + k] = v
      })
      result.features.push(item)

      if (aRemains.length === 0) {
        a.features[ai] = null
      } else {
        a.features[ai] = aRemains[0]
        ai-- // try again with rest of line
      }

      if (aRemains.length === 2) {
        a.features.push(aRemains[1])
      }
    }
  }
}
