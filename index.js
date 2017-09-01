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
} from "./lib/chart/chart";

export {
  default as timeline,
} from "./lib/timeline/timeline";

/* export {
  default as stackedArea
} from "@dboxjs/stacked-area"
 */

export {
  default as heatmap,
} from "@dboxjs/heatmap";

export {
  default as treemap,
} from "@dboxjs/treemap";

/* Chart modules */
export {
  default as bars
} from "@dboxjs/bars"

export {
  default as radar
} from "@dboxjs/dbox-radar"

export {
  default as scatter,
} from "@dboxjs/dbox-scatter"