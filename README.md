# geojson-blend
Blend a GeoJSON file with a second GeoJSON file

Takes two input files with LineStrings. MultiLineStrings will be converted to LineStrings, other geometry types are not supported.

For every line in the input file, matching lines in the blend file are searched. If a matching line is found, the properties of the blended line are copied. Depending on the method(s) used, the lines may be broken into smaller chunks.

The result will contain all lines of the input file (or only the matched lines, if `--include-remaining=false` is used).

## INSTALLATION
```
npm install -G geojson-blend
geojson-blend --help # usage information
```

## DEVELOPMENT
```
git clone https://github.com/plepe/geojson-blend
cd geojson-blend
npm install
node run.js --help
```
