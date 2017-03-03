# SVG Treemap

Draws a treemap chart using SVG Rects.

## Treemap.nestBy() 

**(Required)** Expects an array of column names that will be used to generate hierarchical data.

__nestBy('columnName')__: Uses only one level nesting

__nestBy(['columnName1', 'columnName2', ...])__: Nests data using many levels of hierarchy

```javascript
{
"name": "grandparent",
"children": [
  {
  "name": "parent",
  "children": [
    {
    "name": "child",
    "value": 464
    }
  ]
  }
]
}
```

## Treemap.size()

**(Required)** Expects a column name that will be used to determine each rect size. It **must ** be a _Number_

```javascript
data = {"name": "foo", "value": 32};
layer.size('value')
```

## Treemap.colorScale()

**(Optional)** Expects an array of colors what will be used to match each children fill color

**Default:** d3.colorScale20c 

```
layer.colorScale(['red','#45f530','blue'])
```

## Treemap.padding()

**(Optional)** Expects a _Number_ set as inner padding

**Default:** 4

```javascript
layer.padding(5)
```

## Treemap.labels()

**(Optional)** Expects ```true``` or ```false``` to show or hide labels on each rect.

**Default:** ```true```

```javascript
layer.labels(false)
```

## Treemap.tip()

**(Optional)** Expects a function that will be used as HTML option for d3-tip

**Default:** ```function(d) { return d.data.name + "\n" + vm._config._format(d.value); };```

```javascript
layer.tip(function(d) { return d.data.name; });
```
