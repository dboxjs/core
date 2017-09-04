# Dbox.js

A library to create easy reusable charts

## Dependencies
Dbox uses ```cartodb```, ```d3```, ```d3-queue```, ```d3-tip```, ```lodash```, ```topojson```

## Instalation

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
