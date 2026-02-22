#!/usr/bin/env node
const fs = require('fs')
const turf = require('@turf/turf')

const distance = 10

let a = JSON.parse(fs.readFileSync('hauptrad.geojson'))
let b = JSON.parse(fs.readFileSync('rl-basisnetz.geojson'))

a = splitMultiLineStrings(a)
b = splitMultiLineStrings(b)
b = removeIllegalLineStrings(b)

const result = { type: 'FeatureCollection', features: findEqualLines(a, b, 'hrvn_', 'rlb_') }

fs.writeFileSync('result.geojson', JSON.stringify(result, null, '  '))

function findEqualLines (a, b, aPrefix, bPrefix) {
  const result = []
  console.error('building buffers for a')
  const aBuffered = a.features.map(i => turf.buffer(i, distance, { units: 'meters' }))
  console.error('building buffers for b')
  const bBuffered = b.features.map(i => {
    return turf.buffer(i, distance, { units: 'meters' })
  })
  console.error('building buffers done')

  a.features.forEach((aItem, ai) => {
    b.features.forEach((bItem, bi) => {
      if (turf.booleanWithin(aItem, bBuffered[bi]) && turf.booleanWithin(bItem, aBuffered[ai])) {
        console.error('found', ai, bi)
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

        result.push(item)
      }
    })
  })

  return result
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

  return geojson
}

function removeIllegalLineStrings (geojson) {
  geojson.features = geojson.features.filter(feature => {
    return feature.geometry.coordinates.length >= 2
  })

  return geojson
}
