# Bar chart

Draws a bar chart using SVG figures

## Bars.x()

**Required** Expects a column name to use as x axis

__x('name')__: Sets 'name' as column used

*Info* You should specify scale type in configuration object
```javascript
var config {
  xAxis: {
    scale: 'ordinal'
  }
}
```

## Bars.y()

**Required** Expects a column name to use as y axis

__y('value'): Sets 'value' as column used

*Info* You should specify scale type in configuration object
```javascript
var config {
  yAxis: {
    scale: 'linear'
  }
}
```
