---
# Development Setup  
---

Setting up a development environment 

## Getting started

1. Create a directory *dboxjs*

2. Clone the following repositories:

```
git clone git@github.com:dboxjs/core.git
git clone git@github.com:dboxjs/bars.git
git clone git@github.com:dboxjs/distro.git
git clone git@github.com:dboxjs/heatmap.git
git clone git@github.com:dboxjs/leaflet.git
git clone git@github.com:dboxjs/map.git
git clone git@github.com:dboxjs/radar.git
git clone git@github.com:dboxjs/scatter.git
git clone git@github.com:dboxjs/spineplot.git
git clone git@github.com:dboxjs/timeline.git
git clone git@github.com:dboxjs/treemap.git
```


3. execute make file 
```
cd core 
make checkout_dev
make pull 
make install 
make eslint
make babel
```
4. In @dboxjs/core 
    * Duplicate rollup.conf.js save as rollup.config.dev.js
    * Modify input as `input: 'index.dev.js'`
    * Modify output > file to the desired destination
      ```javascript
       output: {
          file: '.../dboxjs-one-page/js/dbox.js',
          // file: './dev/dbox.js',
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
      ```

6. Run rollup
```
npm run dev
```
