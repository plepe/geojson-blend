#!/usr/bin/env node
const ArgumentParser = require('argparse').ArgumentParser
const fs = require('fs')

const main = require('./src/main.js')
const methods = require('./src/methods.js')

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

parser.add_argument('--include-remaining', {
  help: 'Include remaining lines from the input file which were not matched (default: true).',
  default: 'true'
})

const options = { ...parser.parse_args() }
options.methods = options.methods.split(',')
if (['true', 'false'].includes(options.include_remaining)) {
  options.include_remaining = options.include_remaining === 'true'
} else {
  throw new Error("--include-remaining: expecting 'true' or 'false'")
}

if (options.input === '-' && options.blend === '-') {
  throw new Error("Can't read both '--file' and '--blend' from stdin.")
}

const input = options.input === '-' ? '/dev/stdin' : options.input
const a = JSON.parse(fs.readFileSync(input))

const blend = options.blend === '-' ? '/dev/stdin' : options.blend
const b = JSON.parse(fs.readFileSync(blend))

const result = main(a, b, options)

const output = options.output === '-' ? '/dev/stdout' : options.output
fs.writeFileSync(output, JSON.stringify(result, null, '  '))
