/*
 * Dboxjs
 *
 * You can import other modules here, including external packages. When
 * bundling using rollup you can mark those modules as external and have them
 * excluded or, if they have a jsnext:main entry in their package.json (like
 * this package does), let rollup bundle them into your dist file.
 */

/* Core */
export {
  default as chart,
} from "./chart/chart";

/* Chart objects */
export {
  default as scatter,
} from "./scatter/scatter";

export {
  default as timeline,
} from "./timeline/timeline";

export {
  default as heatmap,
} from "./heatmap/heatmap";

export {
  default as treemap,
} from "./treemap/treemap";

/*export {
  default as MexicoMapRounded
} from "./map/mexicoMapRounded";*/

export {
  default as bars
} from "./bars/barchart.js"

/*export {
  default as stackBar,
} from "./stackBar/stackBar.js"*/


/*export {
  default as map
} from "./map/map.js"*/


export {
  default as radar
} from "@dboxjs/dbox-radar"