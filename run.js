#!/usr/bin/env node
const fs = require('fs')
const turf = require('@turf/turf')

const findEqualLines = require('./src/findEqualLines.js')

const options = {
  distance: 10, // meters
}

const a = JSON.parse(fs.readFileSync('hauptrad.geojson'))
const b = JSON.parse(fs.readFileSync('rl-basisnetz.geojson'))

splitMultiLineStrings(a)
splitMultiLineStrings(b)
removeIllegalLineStrings(b)

const result = { type: 'FeatureCollection', features: [] }

console.log('original:', a.features.length, b.features.length, result.features.length)

findEqualLines(a, b, result, 'hrvn_', 'rlb_', options)
clearEmpty(a)
clearEmpty(b)

console.log('after equal lines:', a.features.length, b.features.length, result.features.length)

fs.writeFileSync('result.geojson', JSON.stringify(result, null, '  '))

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
  for (let i = 0; i < set.features.length; i++) {
    if (!set.features[i]) {
      set.features.splice(i, 1)
      i--
    }
  }
}
