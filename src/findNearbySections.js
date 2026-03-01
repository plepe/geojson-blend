const turf = require('@turf/turf')

module.exports = function findNearbySections (a, b, result, aPrefix, bPrefix, options) {
  for (let ai = 0; ai < a.features.length; ai++) {
    const aItem = a.features[ai]
    if (!aItem) { return }

    const aLength = turf.length(aItem, { units: 'meters' })
    const aBuffer = turf.buffer(aItem, options.distance, { units: 'meters' })
    let match = null
    let minDistance = options.distance

    b.features.forEach((bItem, bi) => {
      if (!bItem) { return }

      if (!turf.booleanIntersects(aBuffer, bItem)) { return }

      let aStart = null, aEnd = null
      let bStart = null, bEnd = null
      let bLastPos = null
      let sumDistance = 0
      let countSteps = 0
      for (let pos = 0; pos < aLength; pos += options.step) {
        const aPoi = turf.along(aItem, pos, { units: 'meters' })
        const bPoi = turf.nearestPointOnLine(bItem, aPoi, { units: 'meters' })

        if (bPoi.properties.dist < options.distance) {
          if (bStart === null) {
            aStart = pos
            bStart = bPoi.properties.location
          }
          sumDistance += bPoi.properties.dist
          countSteps += 1
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
        const avgDistance = sumDistance / countSteps

        if (similar > 0.9 && similar < 1.1) {
          //console.error('found', ai, bi, avgDistance)
          //console.error('  A', aStart, aEnd, aEnd - aStart)
          //console.error('  B', bStart, bEnd, bEnd - bStart)
          const aMatchLength = aEnd - aStart
          if (avgDistance < minDistance) {
            match = { index: bi, aStart, aEnd, bStart, bEnd}
            minDistance = avgDistance
          }
        }
      }
    })

    if (match) {
      const bItem = b.features[match.index]
      const newItem = updateRemains(a, ai, bItem, match.aStart, match.aEnd, aPrefix, bPrefix, options)
      result.features.push(newItem)

      if (a.features[ai]) {
        ai-- // try again with rest of line
      }
    }
  }
}

function updateRemains (list, index, otherItem, start, end, prefix, otherPrefix, options) {
  let remains = []
  const item = list.features[index]
  const length = turf.length(item, { units: 'meters' })

  if (start > 0) {
    const l = turf.lineSliceAlong(item, 0, start, { units: 'meters' })
    l.properties = item.properties
    remains.push(l)
  }
  if (end < length) {
    const l = turf.lineSliceAlong(item, end, length, { units: 'meters' })
    l.properties = item.properties
    remains.push(l)
  }

  const newItem = turf.lineSliceAlong(item, start, end, { units: 'meters' })
  Object.entries(item.properties).forEach(([k, v]) => {
    newItem.properties[prefix + k] = v
  })
  Object.entries(otherItem.properties).forEach(([k, v]) => {
    newItem.properties[otherPrefix + k] = v
  })

  if (remains.length === 0) {
    list.features[index] = null
  } else {
    list.features[index] = remains[0]
  }

  if (remains.length === 2) {
    list.features.push(remains[1])
  }

  return newItem
}
