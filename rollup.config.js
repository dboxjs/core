import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';
import istanbul from 'rollup-plugin-istanbul';
import npm from "rollup-plugin-node-resolve";

let pkg = require('./package.json');
let external = Object.keys(pkg.dependencies);

//plugins: [
    //babel(babelrc()),
    //istanbul({
      //exclude: ['test/**/*', 'node_modules/**/*', 'docs/**/*', '.editorconfig']
    //})
  //],

export default {
  entry: 'lib/index.js',
  plugins: [
    npm({jsnext: true})
  ],
  external: external,
  targets: [
    {
      dest: pkg.main,
      format: 'umd',
      moduleName: 'dbox',
      sourceMap: true
    }
  ]
};

/*
,
    {
      dest: pkg.module,
      format: 'es',
      sourceMap: true
    }
*/