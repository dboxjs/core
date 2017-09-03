# Development Setup  

Setting up a development environment 

## Getting started

1. Create a directory *dboxjs*

2. Clone the following repositories:
* core
* bars
* heatmap
* radar
* scatter
* timeline
* treemap

3. In all the repositories execute 
```
npm install
```
4. In @dboxjs/core 
    * Duplicate rollup.conf.js save as rollup.config.dev.js
    * Modify targets > dest to the desired destination
      ```javascript
       targets: [
        {
          dest: "your/desired/folder",
          format: 'umd',
          moduleName: 'dbox',
          sourceMap: true
        }
      ```

6. Run rollup
```
num run dev
```
