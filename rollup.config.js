import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';

const pkg = require('./package.json');

const external = Object.keys(pkg.dependencies);


export default {
  input: 'index.js',
  plugins: [
    resolve(),
    babel({ babelHelpers: 'bundled' })
  ],
  external: external,
  output: {
    file: pkg.main,
    format: 'umd',
    name: 'dbox',
    sourcemap: true,
    globals: {
      lodash: '_',
      d3: 'd3',
      cartodb: 'cartodb',
      textures: 'textures',
      topojson: 'topojson',
      leaflet: 'L',
    },
  },
};
