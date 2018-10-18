import commonjs from 'rollup-plugin-commonjs';
import resolve from "rollup-plugin-node-resolve";
import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';

const pkg = require('./package.json');

const external = Object.keys(pkg.dependencies);

export default {
  input: 'index.dev.js',
  plugins: [
    resolve(),
    commonjs({
      ignoreGlobal: true,
    }),
    /*eslint({
      exclude: 'node_modules/**',
    }),*/
    babel({
      exclude: 'node_modules/**'
    })
  ],
  external,
  output: {
    file: './dist/dbox.js',
    format: 'umd',
    name: 'dbox',
    sourcemap: true,
    globals: {
      lodash: '_',
      d3: 'd3',
      cartodb: 'cartodb',
      textures: 'textures',
      d3Tip: 'd3-tip',
    },
  },
};
