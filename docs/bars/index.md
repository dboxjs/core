---
# Package
# @dboxjs/bar
---

### Normal Bar chart 

*  Set the x and y attributes according to the dataset

```javascript
var chart = dbox.chart(config)
  .bindTo('#chart')
  .data({
    raw: data, // Modified data by selectedChart (parse dates or fill NAs)
  });

var bars = chart.layer(dbox.bars)
  .x('State')
  .y('Under 5 Years')
  .fill('State');

chart.draw();
```

### GroupBy Bar Chart 

* Set the x attribute according to the dataset. This attribute will serve as the parent category
* Set the groupBy with an array of attributes. This attributes will serve as the "children" categories

```javascript
var chart = dbox.chart(config)
  .bindTo('#chart')
  .data({
    raw: data, // Modified data by selectedChart (parse dates or fill NAs)
  });

var bars = chart.layer(dbox.bars)
    .x('State')
    .groupBy(['Under 5 Years','5 to 13 Years', "14 to 17 Years", "18 to 24 Years", "25 to 44 Years", "45 to 64 Years", "65 Years and Over"  ])

chart.draw();
```

### StackBy Bar Chart 

* Set the x attribute according to the dataset. This attribute will serve as the parent category
* Set the stackBy with an array of attributes. This attributes will serve as the "children" categories

```javascript
var chart = dbox.chart(config)
  .bindTo('#chart')
  .data({'raw': data})

var bars = chart.layer(dbox.bars)
    .x('State')
    .stackBy(['Under 5 Years','5 to 13 Years', "14 to 17 Years", "18 to 24 Years", "25 to 44 Years", "45 to 64 Years", "65 Years and Over"  ])

chart.draw();
```


