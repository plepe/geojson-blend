#!/usr/bin/env node
const fs = require('fs')
const turf = require('@turf/turf')

const distance = 10

const a = JSON.parse(fs.readFileSync('hauptrad.geojson'))
const b = JSON.parse(fs.readFileSync('rl-basisnetz.geojson'))

splitMultiLineStrings(a)
splitMultiLineStrings(b)
removeIllegalLineStrings(b)

const result = { type: 'FeatureCollection', features: [] }

console.log('original:', a.features.length, b.features.length, result.features.length)

findEqualLines(a, b, result, 'hrvn_', 'rlb_')
clearEmpty(a)
clearEmpty(b)

console.log('after equal lines:', a.features.length, b.features.length, result.features.length)

fs.writeFileSync('result.geojson', JSON.stringify(result, null, '  '))

function findEqualLines (a, b, result, aPrefix, bPrefix) {
  // console.error('building buffers for a')
  const aBuffered = a.features.map(i => turf.buffer(i, distance, { units: 'meters' }))
  // console.error('building buffers for b')
  const bBuffered = b.features.map(i => {
    return turf.buffer(i, distance, { units: 'meters' })
  })
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

function splitMultiLineStrings (geojson) {
  geojson.features.forEach(feature => {
    if (feature.geometry.type === 'MultiLineString') {
      const coordinates = feature.geometry.coordinates
      feature.geometry.type = 'LineString'
      feature.geometry.coordinates = coordinates.pop()

      coordinates.forEach(c => {
        const f = {
          type: 'Feature',
          properties: { ...feature.properties },
          geometry: { type: 'LineString', coordinates: c }
        }
        geojson.features.push(f)
      })
    }
  })
}

function removeIllegalLineStrings (geojson) {
  geojson.features = geojson.features.filter(feature => {
    return feature.geometry.coordinates.length >= 2
  })
}

function clearEmpty (set) {
  for (let i = 0; i < set.length; i++) {
    if (!set[i]) {
      set.splice(i, 1)
      i--
    }
  }
}
