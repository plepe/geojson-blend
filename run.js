#!/usr/bin/env node
const fs = require('fs')
const turf = require('@turf/turf')

const findEqualLines = require('./src/findEqualLines.js')
const findLinesWithSameEnds = require('./src/findLinesWithSameEnds.js')
const findIntersectingLines = require('./src/findIntersectingLines.js')
const findNearbySections = require('./src/findNearbySections.js')

const options = {
  distance: 10, // meters
  step: 1, // when testing lines, check every n meters
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

findLinesWithSameEnds(a, b, result, 'hrvn_', 'rlb_', options)
 findIntersectingLines(a, b, result, 'hrvn_', 'rlb_', options)
 clearEmpty(a)
 clearEmpty(b)
 
 console.log('after intersecting lines:', a.features.length, b.features.length, result.features.length)

findNearbySections(a, b, result, 'hrvn_', 'rlb_', options)
clearEmpty(a)
clearEmpty(b)

console.log('after nearby sections:', a.features.length, b.features.length, result.features.length)

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
