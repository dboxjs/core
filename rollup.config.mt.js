import npm from "rollup-plugin-node-resolve";

export default {
  entry: "index.js",
  format: "umd",
  moduleName: "dbox",
  plugins: [npm({jsnext: true})],
  //dest: "../mt-sociodemograficos-olimpicos/src/dbox/build/dbox.js"
  //dest: "../mt-delegados/src/dbox/build/dbox.js"
  dest: "../mt-post-olimpicos/src/dbox/build/dbox.js"
};
