import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';

let pkg = require('./package.json');
let external = Object.keys(pkg.dependencies);

export default {
  input: 'index.js',
  plugins: [
    resolve(),
    'external-helpers',
    babel(babelrc())
  ],
  external: external,
  output:
  {
    file: pkg.main,
    format: 'umd',
    name: 'dbox',
    sourcemap: true,
    globals: {
      'lodash': '_',
      'd3': 'd3',
      'cartodb': 'cartodb',
      'textures': 'textures'
    },
  }
};
