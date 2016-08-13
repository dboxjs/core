# Let's get started

## Installation

## config 
---
### config.bindTo
HTML id of the div where the chart will be drawn    
```javascript
config.bindTo = '#id'
```

### config.size
Object for specifing the following properties of the chart
* width
* height
* margin

```javascript
'size':{
  'width':  d3.select('#map').node().getBoundingClientRect().width ? d3.select('#map').node().getBoundingClientRect().width : 555,
  'height':500,
  'margin':{top: 20, right: 50, bottom: 100, left: 40},
},
```



## Complete example
```javascript
var config = {
	'bindTo': '#map',
	'size':{
	  'width':  d3.select('#map').node().getBoundingClientRect().width ? d3.select('#map').node().getBoundingClientRect().width : 555,
	  'height':500,
	  'margin':{top: 20, right: 50, bottom: 100, left: 40},
	},
	'template':'dbox-gray',
	'data':{
	  'csv':'app/components/map/data/Pobreza.csv',
	  'sort':{
	    'axis': 'y',
	    'order': 'desc', // asc - 1, desc  -1 ,
	    //'visible':false,
	  },
	  parser:function(d,i) {
	    var n = {};
	    n.id = +d.INEGI;
	    n.z = +d.Total_08;
	    return n;
	  },
	  tip:function(d) {
	    var formatWhole = d3.format(",.0f");
	    var format = d3.format(",.2f");
	    var formatDecimals = d3.format(",.2f");
	    var formatDecimalsThree = d3.format(",.3f");

	    var html = '';
	    var total = d3.select(this).attr('data-total');

	    if(d.properties.state_name) html+=d.properties.state_name;
	    if(d.properties.inegi) html+='<br>Inegi: '+d.properties.inegi;

	    if( total !== null ) {
	      switch(units){
	        case 'total':
	          html+='<br>'+ vm.formatWhole(total);
	        break;
	        default:
	          html+='<br>'+ vm.formatDecimals(total);
	        break;
	      }
	    }
	    return html;
	  },
	  mouseover:function(d,i){
	    console.log(d,i)
	  }
	},
	'xAxis':{
	  'scale' : 'ordinal',
	  'text'  : 'Districts',
	},
	'yAxis':{
	  'scale' : 'linear',
	  'text'  : 'Total Employed',
	  'ticks':{
	    'enabled':true,
	    'style':'straightLine'
	  }
	},
	'events':{
	  'load': function(bars){
	    /*var bar = bars.select('Kohistan');
	    if( bar !== false){
	      bar.attr('fill', 'red')
	    };*/
	  }
	},
	'plotOptions':{
	    'map':{
	      'geoType':'states',
	      'units': 'percentage',
	      'quantiles':{
	        'buckets':5,
	        'colors': [ '#85f2b7', '#c8f3df', '#f7f4f3','#f1c6ce',  '#e36984' ],
	        'outOfRangeColor': '#969696'
	      }
	    }
	  }

	}
```

### Bars
```javascript
```

