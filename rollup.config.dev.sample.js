import commonjs from 'rollup-plugin-commonjs';
import resolve from "rollup-plugin-node-resolve";
import babel from 'rollup-plugin-babel';

let pkg = require('./package.json');
let external = Object.keys(pkg.dependencies);

export default {
  input: 'index.dev.js',
  plugins: [
    resolve(),
    commonjs({
      namedExports: {
      // left-hand side can be an absolute path, a path
      // relative to the current directory, or the name
      // of a module in node_modules
      'node_modules/d3-tip/index.js': [ 'd3.tip' ]
      },
    }),
    /*eslint({
      exclude: 'node_modules/**',
    }),*/
    babel({
      exclude: 'node_modules/**'
    })
  ],
  external: external,
  output: [
    {
      file: '/Users/alecsgarza/vpress/one-page-demo/js/dbox.js',
      format: 'umd',
      name: 'dbox',
      sourcemap: true,
      globals: {
        'lodash': '_',
        'd3':'d3',
        'cartodb':'cartodb',
        'textures':'textures',
      },
    }
  ]
};
