import resolve from "rollup-plugin-node-resolve";
import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';

import istanbul from 'rollup-plugin-istanbul';

let pkg = require('./package.json');
let external = Object.keys(pkg.dependencies);

export default {
  entry: 'index.js',
  plugins: [
    resolve(),
    'external-helpers',
    babel(babelrc())
  ],
  external: external,
  globals: {
    'lodash': '_',
    'd3':'d3',
    'cartodb':'cartodb',
    'textures':'textures'
  },
  targets: [
    {
      dest: pkg.main,
      format: 'umd',
      moduleName: 'dbox',
      sourceMap: true
    }
  ]
};
