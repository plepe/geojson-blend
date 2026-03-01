#!/usr/bin/env node
const ArgumentParser = require('argparse').ArgumentParser
const fs = require('fs')
const turf = require('@turf/turf')

const methods = {
  'equal-lines': require('./src/findEqualLines.js'),
  'lines-with-same-ends': require('./src/findLinesWithSameEnds.js'),
  'intersecting-lines': require('./src/findIntersectingLines.js'),
  'nearby-sections': require('./src/findNearbySections.js')
}

const defaultOptions = {
  distance: 10, // meters
  step: 1, // when testing lines, check every n meters
  methods: ['nearby-sections'], // which methods to use
}
defaultOptions.methods = defaultOptions.methods.join(',')

const parser = new ArgumentParser({
  add_help: true,
  description: 'Blend a GeoJSON file with a second GeoJSON file'
})

parser.add_argument('--input', {
  help: 'Original GeoJSON file. Use "-" to read from stdin (default).',
  default: '-'
})

parser.add_argument('--blend', {
  help: 'GeoJSON File to blend with. Use "-" to read from stdin.',
  required: true
})

parser.add_argument('--blend-prefix', {
  help: 'When copying properties from the lines of the blend file, prefix the properties by this string.',
  default: 'blend-'
})

parser.add_argument('--output', {
  help: 'Where to write the output file. Use "-" to write to stdout (default).',
  default: '-'
})

parser.add_argument('--distance', {
  help: 'Max. distance in meters for matching lines.',
  default: defaultOptions.distance
})

parser.add_argument('--step', {
  help: 'When iterating over lines, use the specified step distance in meters.',
  default: defaultOptions.step
})

parser.add_argument('--methods', {
  help: 'Use the specified methods for matching (available: ' + Object.keys(methods).join(', ') + ').',
  default: defaultOptions.methods
})

const options = { ...parser.parse_args() }
options.methods = options.methods.split(',')

if (options.input === '-' && options.blend === '-') {
  throw new Error("Can't read both '--file' and '--blend' from stdin.")
}

const input = options.input === '-' ? '/dev/stdin' : options.input
const a = JSON.parse(fs.readFileSync(input))

const blend = options.blend === '-' ? '/dev/stdin' : options.blend
const b = JSON.parse(fs.readFileSync(blend))

splitMultiLineStrings(a)
splitMultiLineStrings(b)
removeIllegalLineStrings(a)
removeIllegalLineStrings(b)

const result = { type: 'FeatureCollection', features: [] }

console.error('original:', a.features.length, b.features.length, result.features.length)

options.methods.forEach(methodId => {
  const method = methods[methodId]

  if (!method) {
    throw new Error('Method "' + method + '" unknown!')
  }

  method(a, b, result, '', options.blend_prefix, options)
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

const output = options.output === '-' ? '/dev/stdout' : options.output
fs.writeFileSync(output, JSON.stringify(result, null, '  '))

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
