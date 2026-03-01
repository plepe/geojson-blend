#!/usr/bin/env node
const fs = require('fs')
const turf = require('@turf/turf')

const methods = {
  'equal-lines': require('./src/findEqualLines.js'),
  'lines-with-same-ends': require('./src/findLinesWithSameEnds.js'),
  'intersecting-lines': require('./src/findIntersectingLines.js'),
  'nearby-sections': require('./src/findNearbySections.js')
}

const options = {
  distance: 10, // meters
  step: 1, // when testing lines, check every n meters
  methods: ['nearby-sections'], // which methods to use
}

const a = JSON.parse(fs.readFileSync('hauptrad.geojson'))
const b = JSON.parse(fs.readFileSync('rl-basisnetz.geojson'))

splitMultiLineStrings(a)
splitMultiLineStrings(b)
removeIllegalLineStrings(b)

const result = { type: 'FeatureCollection', features: [] }

console.error('original:', a.features.length, b.features.length, result.features.length)

options.methods.forEach(methodId => {
  const method = methods[methodId]

  if (!method) {
    throw new Error('Method "' + method + '" unknown!')
  }

  method(a, b, result, 'hrvn_', 'rlb_', options)
  clearEmpty(a)
  clearEmpty(b)

 console.error('after ' + methodId, a.features.length, b.features.length, result.features.length)
})

//a.features.forEach(item => {
//  const properties = {}
//  Object.entries(item.properties).forEach(([k, v]) => {
//    properties['hrvn_' + k] = v
//  })
//  item.properties = properties
//  result.features.push(item)
//})

//b.features.forEach(item => {
//  const properties = {}
//  Object.entries(item.properties).forEach(([k, v]) => {
//    properties['rlb_' + k] = v
//  })
//  item.properties = properties
//  result.features.push(item)
//})

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
