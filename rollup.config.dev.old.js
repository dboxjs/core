import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';
import istanbul from 'rollup-plugin-istanbul';

let pkg = require('./package.json');
let external = Object.keys(pkg.dependencies);

export default {
  input: 'index.dev.js',
  plugins: [
    resolve(),
    'external-helpers',
    babel(babelrc())
  ],
  external: external,
  globals: {
    'lodash': '_',
    'd3': 'd3',
    'textures': 'textures'
  },
  output: [
    {
      file: '../../devf/devf-app/node_modules/@dboxjs/core/dist/dbox.js',
      format: 'umd',
      name: 'dbox',
      sourcemap: true
    }
  ]
};
