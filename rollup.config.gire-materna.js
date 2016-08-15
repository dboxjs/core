import npm from "rollup-plugin-node-resolve";

export default {
  entry: "index.js",
  format: "umd",
  moduleName: "dbox",
  plugins: [npm({jsnext: true})],
  dest: "../gire-mapa-muerte-materna-swiip/src/dbox/build/dbox.js"
};
