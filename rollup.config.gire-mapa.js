import npm from "rollup-plugin-node-resolve";

export default {
  entry: "index.js",
  format: "umd",
  moduleName: "dbox",
  plugins: [npm({jsnext: true})],
  dest: "../../aws/gire-mapa-muerte-materna/src/dbox/build/dbox.js"
};
