function queryCarto(config, callback){
	var sql = new cartodb.SQL({ user: config.cartodb.user });
	sql.execute(config.cartodb.sql)
		.done(function(data){

			var result = data.rows

			if( config.parser ){
				result = data.rows.map(config.parser)
			}

			callback(null, result);
		})
  		.error(function(error){
			callback(error, null);
		})
}

function mapData(data, parser, callback){
  if(data.map)
    callback(null, data.map(parser));
  else
    callback(null, data);
}

function Chart(config) {
  var vm = this;
  vm._config = config; 
  vm._svg;
  vm._margin;
  vm._width;
  vm._height;

  vm._tip = d3.tip().attr('class', 'd3-tip').html(vm._config.data.tip);  
  vm.draw();
}

Chart.prototype = chart.prototype = {
	'dispatch': d3.dispatch("load", "change"),
	'draw' : function(){
		var vm = this;

		d3.select(vm._config.bindTo).select('svg').remove();
		d3.select(vm._config.bindTo).html('');

		if(vm._config.template){
			d3.select(vm._config.bindTo).classed(vm._config.template, true)
		}
		

		//Add title to the chart
		if(vm._config.chart && vm._config.chart.title){
			d3.select(vm._config.bindTo).append("div")
				.attr("class", "chart-title")
				.html(vm._config.chart.title)
		}

		var legend = d3.select(vm._config.bindTo).append("div")
				.attr("class", "chart-legend-top");
		//Add Legend to the chart
		if(vm._config.legend && vm._config.legend.enable === true && vm._config.legend.position === 'top'){
			var html = ''; 
			vm._config.legend.categories.forEach(function(c){
				html +="<div class='dbox-legend-category-title'><span class='dbox-legend-category-color' style='background-color:"+c.color+";'> </span>"+c.title+"</div>";
			})
			legend.html(html)
		}

		//Define the margins
    if(vm._config.size.margin){
		vm._margin = vm._config.size.margin;
    } else {
      	vm._margin = {left: 0, right: 0, top: 0, bottom: 0};
    }

	    //Define width and height
		vm._width = vm._config.size.width - vm._margin.left - vm._margin.right,
		vm._height = vm._config.size.height - vm._margin.top - vm._margin.bottom;
    	
    	//Create the svg
		vm._svg = d3.select(vm._config.bindTo).append("svg")
			.attr("width", vm._width + vm._margin.left + vm._margin.right)
			.attr("height", vm._height + vm._margin.top + vm._margin.bottom)
		  .append("g")
			.attr("transform", "translate(" + vm._margin.left + "," + vm._margin.top + ")");

    	
    	//Call the tip function
    	if(vm._config.data.tip){
			vm._svg.call(vm._tip);
    	}

		//Apply background color
		if(vm._config.chart && vm._config.chart.background && vm._config.chart.background.color){
			d3.select(vm._config.bindTo+" svg").style('background-color', vm._config.chart.background.color )
		}
		
		var legendBottom = d3.select(vm._config.bindTo).append("div")
				.attr("class", "chart-legend-bottom");
		//Legend for average lines
		/*
		if(vm._config.plotOptions && vm._config.plotOptions.bars 
			&& vm._config.plotOptions.bars.averageLines && Array.isArray(vm._config.plotOptions.bars.averageLines) 
			&& vm._config.plotOptions.bars.averageLines.length >0 ){

			d3.select(vm._config.bindTo).append("div")
				.attr("class", "container-average-lines")
			  .append('div')
			  	.attr("class", "legend-average-lines")
				.html('Average Lines Controller')
		}
		*/

	},
	loadData:function(){
		var vm = this; 

		if(vm._config.data.tsv){
			var q = d3.queue()
			          .defer(d3.tsv, vm._config.data.tsv, vm._config.data.parser);
		} 

		if(vm._config.data.csv){
		  	var q = d3.queue()
		            .defer(d3.csv, vm._config.data.csv, vm._config.data.parser);
		}

		if(vm._config.data.raw){
		  	var q = d3.queue()
		            .defer(mapData, vm._config.data.raw, vm._config.data.parser);
		}

		if(vm._config.data.cartodb){
			var q = d3.queue()
					  .defer(queryCarto,vm._config.data)
		}


		if(vm._config.plotOptions && vm._config.plotOptions.bars 
			&& vm._config.plotOptions.bars.averageLines && Array.isArray(vm._config.plotOptions.bars.averageLines) 
			&& vm._config.plotOptions.bars.averageLines.length >0 ){
			
			vm._config.plotOptions.bars.averageLines.forEach(function(l){
				if(l.data.cartodb){
					q.defer(queryCarto, l.data)
				}
			})
		}


		return q;
	}, 
	setScales:function(){
		var vm = this; 

		var scales = {}; 
		
		//xAxis scale
		if(vm._config.xAxis && vm._config.xAxis.scale){
			switch(vm._config.xAxis.scale){
				case 'linear':
					scales.x = d3.scale.linear()
		  				.range([0, vm._width]);
				break;

				case 'time':
					scales.x = d3.time.scale()
		  				.range([0, vm._width]);
				break;

				case 'ordinal':
					scales.x = d3.scale.ordinal()
						.rangeBands([0, vm._width], 0.1)
				break;

		        case 'quantile':
		          scales.x = d3.scale.ordinal()
		            .rangeBands([0, vm._width], 0.1)

		          scales.q = d3.scale.quantile()
		            .range(d3.range(vm._config.xAxis.buckets) )
		        break;

				default:
					scales.x = d3.scale.linear()
		  				.range([0, vm._width]);
				break;
			}
		}else{
			scales.x = d3.scale.linear()
  				.range([0, vm._width]);
		}

		//yAxis scale
		if(vm._config.yAxis && vm._config.yAxis.scale){
			switch(vm._config.yAxis.scale){
				case 'linear':
					scales.y = d3.scale.linear()
		  				.range([vm._height, 0]);
				break;

				case 'time':
					scales.y = d3.time.scale()
		  				.range([vm._height, 0]);
				break;

				case 'ordinal':
					scales.y = d3.scale.ordinal()
						.rangeBands([vm._height, 0], 0.1)
				break;

        case 'quantile':
          scales.y = d3.scale.ordinal()
            .rangeBands([0, vm._width], 0.1)

          scales.q = d3.scale.quantile()
            .range(d3.range(vm._config.yAxis.buckets) )
        break;

				default:
					scales.y = d3.scale.linear()
		  				.range([vm._height, 0]);
				break;
			}
		}else{
			scales.y = d3.scale.linear()
  				.range([vm._height, 0]);
		}


		scales.color = d3.scale.category10();

		return scales; 		
	},
	getDomains:function(data){
		var vm = this; 

		var domains = {}; 
		var minMax = [];
	    var sorted = ''; 


	    //Default ascending function 
	    var sortFunctionY = function(a, b) { return d3.ascending(a.y,b.y); }; 
	    var sortFunctionX = function(a, b) { return d3.ascending(a.x,b.x); }; 
			

	    //if applying sort
	    if(vm._config.data.sort && vm._config.data.sort.order){
	      switch(vm._config.data.sort.order){
	        case 'asc':
	          sortFunctionY = function(a, b) { return d3.ascending(a.y,b.y); };
	          sortFunctionX = function(a, b) { return d3.ascending(a.x,b.x); }; 
	        break;

	        case 'desc':
	          sortFunctionY = function(a, b) { return d3.descending(a.y,b.y); };
	          sortFunctionX = function(a, b) { return d3.descending(a.x,b.x); }; 
	        break;
	      }
	    }


		//xAxis
		if(vm._config.xAxis && vm._config.xAxis.scale){
			switch(vm._config.xAxis.scale){
				case 'linear':
					minMax = d3.extent(data, function(d) { return d.x; })
					domains.x = minMax;
				break;

				case 'time':
		          minMax = d3.extent(data, function(d) { return d.x; })
		          domains.x = minMax;
				break;

				case 'ordinal':
				  
		          //If the xAxis' order depends on the yAxis values 
		          if(vm._config.data.sort && vm._config.data.sort.axis === 'y'){ 
		            sorted = data.sort(sortFunctionY);
		          }else { 
		            sorted = data.sort(sortFunctionX);
		          }

		          domains.x = [];
		          sorted.forEach(function(d){
		            domains.x.push(d.x);
		          })

				break;

		        case 'quantile':
		          
		          //The xAxis order depends on the yAxis values 
		          if(vm._config.data.sort && vm._config.data.sort.axis === 'y'){ 
		            sorted = data.sort(sortFunctionY);
		          }else { 
		            sorted = data.sort(sortFunctionX);
		          }

		          domains.q = [];
		          sorted.forEach(function(d){
		            domains.q.push(d.x);
		          })

		          domains.x = d3.range(vm._config.xAxis.buckets);

		        break;


				default:
					minMax = d3.extent(data, function(d) { return d.x; })
					domains.x = minMax;
				break;
			}
		}else{
			minMax = d3.extent(data, function(d) { return d.x; })
			domains.x = minMax;
		}

		//yAxis
		if(vm._config.yAxis && vm._config.yAxis.scale){
			switch(vm._config.yAxis.scale){
				case 'linear':
					minMax = d3.extent(data, function(d) { return d.y; })

					//Adjust for min values greater than zero
					//set the min value to -10% 
					if(minMax[0] > 0 ){
						minMax[0] = minMax[0] - (minMax[1]- minMax[0])*.1
					} 
					domains.y = minMax;
				break;

				case 'time':
					minMax = d3.extent(data, function(d) { return d.y; })
          			domains.y = minMax;
				break;

				case 'ordinal':
		          if(vm._config.data.sort && vm._config.data.sort.axis === 'y'){

		            var sorted = data.sort(function(a, b) { return d3.ascending(a.y,b.y); });
		            domains.y = [];
		            sorted.forEach(function(d){
		              domains.y.push(d.x);
		            })

		          }else{
		            domains.y = d3.map(data, function(d) {
		              return d.y;
		            }).keys().sort(function(a, b) { return d3.ascending(a,b); });
		          }
					
				break;

				default:
					minMax = d3.extent(data, function(d) { return d.y; })
					domains.y = minMax;
				break;
			}
		}else{
			minMax = d3.extent(data, function(d) { return d.y; })
			domains.y = minMax;
		}


		return domains; 		
	}, 
	destroy:function(){
		var vm = this;
		d3.select(vm._config.bindTo).html("");
	}
}





export default function chart(config) {
  return new Chart(arguments.length ? config : null);
}
