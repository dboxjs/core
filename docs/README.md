# Dbox
# @dboxjs/core
---
A library to create easy reusable charts

## Installation

Using npm
```
npm install @dboxjs/core
```

## Usage

Dbox uses one chart with the possibility to add multiple layers

```javascript
var config = {
  'size':{
    'width': width,
    'height': 500,
    'margin':{top: 20, right: 20, bottom: 30, left: 40},
  },
  'xAxis':{
    'scale':'time'
  }
}

dbox.chart(config)
    .bindTo('#timeline-chart')
    .data({'csv':'assets/data/linea.csv'})
  .layer(dbox.timeline)
    .x('year')
    .series(['tot'])
    .color('species')
  .end()
    .draw();
```

Check examples on [dboxjs.org](http://dboxjs.org)

## Dependencies
Dbox uses ```cartodb```, ```d3```, ```d3-queue```, ```d3-tip```, ```lodash```, ```topojson```


---
# Layers
---
dbox.js has diverse layers implemented. Each layer is developed independently. However all instances should at least have the following listed methods. 

| Public Methods        | Description                                                       |@dboxjs/bar  |
| -------------         | -------------                                                     |:-------------:|
| .data(*object*)       | Passes the data to the layer                                      |  X  |
| .map(*function*)      | Used to create a new array of data                                |  -  |
| .filter(*function*)   | Used to filter rows in the data                                   |  -  |
| .sortBy(*function*)   | Used to sort the rows in the data                                 |  -  |
| .color(*string*)      | Specify which column as the input for color selection             |  X  |
| .colorScale(*array*)  | Specify the range of hexadecimal colors for each serie of data    |  X  |
| .tip(*function*)      | Specify the html to render on mouse hover                         |  -  |
| .format(*function*)   | Pending                                                           |  -  |
                    
---
# Development Setup  
---

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

```
git clone git@github.com:dboxjs/core.git
git clone git@github.com:dboxjs/bars.git
git clone git@github.com:dboxjs/heatmap.git
git clone git@github.com:dboxjs/radar.git
git clone git@github.com:dboxjs/scatter.git
git clone git@github.com:dboxjs/timeline.git
git clone git@github.com:dboxjs/treemap.git
```


3. In all the repositories execute 
```
npm install
```
4. In @dboxjs/core 
    * Duplicate rollup.conf.js save as rollup.config.dev.js
    * Modify entry as `entry: 'index.dev.js'`
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
npm run dev
```

