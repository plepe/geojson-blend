const turf = require('@turf/turf')
const methods = require('./methods.js')

module.exports = function main (a, b, options) {
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
  //    properties['' + k] = v
  //  })
  //  item.properties = properties
  //  result.features.push(item)
  //})

  //b.features.forEach(item => {
  //  const properties = {}
  //  Object.entries(item.properties).forEach(([k, v]) => {
  //    properties[options.blend_prefix + k] = v
  //  })
  //  item.properties = properties
  //  result.features.push(item)
  //})

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
