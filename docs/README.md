# Dbox.js - @dboxjs/core
---
A library to create easy reusable charts

## Installation

Using npm
```
npm install @dboxjs/core
```

## Usage

Dbox uses one chart that allows to draw different layers

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
dbox.js has several layers currently implemented. Each layer is developed independently. However all instances should at least have the following listed methods. 


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


​                                           

---
# @dboxjs/bar
---

## Usage

```javascript
var data = [
      {
        "State": "CA",
        "Under 5 Years": 2704659,
        "5 to 13 Years": 4499890,
        "14 to 17 Years": 2159981,
        "18 to 24 Years": 3853788,
        "25 to 44 Years": 10604510,
        "45 to 64 Years": 8819342,
        "65 Years and Over": 4114496
      },
      {
        "State": "TX",
        "Under 5 Years": 2027307,
        "5 to 13 Years": 3277946,
        "14 to 17 Years": 1420518,
        "18 to 24 Years": 2454721,
        "25 to 44 Years": 7017731,
        "45 to 64 Years": 5656528,
        "65 Years and Over": 2472223
      },
      {
        "State": "NY",
        "Under 5 Years": 1208495,
        "5 to 13 Years": 2141490,
        "14 to 17 Years": 1058031,
        "18 to 24 Years": 1999120,
        "25 to 44 Years": 5355235,
        "45 to 64 Years": 5120254,
        "65 Years and Over": 2607672
      }
    ]


var config = {
  size: {
    width: 600,
    height: 400,
    margin: {top: 5, right: 5, bottom: 40, left: 100}
  },
  xAxis: {
    enabled: true,
    scale:  'band',
  },
  yAxis: {
    enabled: true,
    scale:  'linear',
  }
};

var chart = dbox.chart(config)
  .bindTo('#chart')
  .data({'raw': data})
  .layer(dbox.bars)
    .x('State')
    .y('Under 5 Years')
    .end()
  .draw();
  
```

### Normal Bar chart 

*  Set the x and y attributes according to the dataset

```javascript
var chart = dbox.chart(config)
  .bindTo('#chart')
  .data({'raw': data})
  .layer(dbox.bars)
    .x('State')
    .y('Under 5 Years')
    .end()
  .draw();
```

### GroupBy Bar Chart 

* Set the x attribute according to the dataset. This attribute will serve as the parent category
* Set the groupBy with an array of attributes. This attributes will serve as the "children" categories

```javascript
var chart = dbox.chart(config)
  .bindTo('#chart')
  .data({'raw': data})
  .layer(dbox.bars)
    .x('State')
    .groupBy(['Under 5 Years','5 to 13 Years', "14 to 17 Years", "18 to 24 Years", "25 to 44 Years", "45 to 64 Years", "65 Years and Over"  ])
    .end()
  .draw();
```

### StackBy Bar Chart 

* Set the x attribute according to the dataset. This attribute will serve as the parent category
* Set the stackBy with an array of attributes. This attributes will serve as the "children" categories

```javascript
var chart = dbox.chart(config)
  .bindTo('#chart')
  .data({'raw': data})
  .layer(dbox.bars)
    .x('State')
    .stackBy(['Under 5 Years','5 to 13 Years', "14 to 17 Years", "18 to 24 Years", "25 to 44 Years", "45 to 64 Years", "65 Years and Over"  ])
    .end()
  .draw();
```

## Methods

### .x(string) 
___
| Parameter       | Description  |
| -------------   | -----|
| columnName      |Attribute from the dataset to use in the x Axis |


### .y(string) 
___
| Parameter       | Description  |
| -------------   | -----|
| columnName      | Attribute from the dataset to use in the y Axis |


### .groupBy(array) 
___
| Parameter       | Description 
| -------------   | -----|
| columns         | Array of columns to groupBy in the xAxis | 

---
# Contribute
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
    * Modify output > file to the desired destination
      ```javascript
       output: [
        {
          file: "your/desired/folder",
          format    : 'umd',
          name      : 'dbox',
          sourcemap : true
        }
      ```
```

6. Run rollup
```
npm run dev
```

```