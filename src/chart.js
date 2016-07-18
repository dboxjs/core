
function queryCarto(config, callback){
	var sql = new cartodb.SQL({ user: config.cartodb.user });
	sql.execute(config.cartodb.sql)
		.done(function(data){

			var result = data.rows
			//console.log('queryCarto',result);

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
  callback(null, data.map(parser));
}

function Chart(config) {
  var vm = this;
  vm._config = config; 
  vm._svg;
  vm._margin;
  vm._widht;
  vm._height;

  vm.draw();
}

Chart.prototype = chart.prototype = {
	'dispatch': d3.dispatch("load", "change"),
	'draw' : function(){
		var vm = this;

		vm._margin = vm._config.size.margin,
		vm._width = vm._config.size.width - vm._margin.left - vm._margin.right,
		vm._height = vm._config.size.height - vm._margin.top - vm._margin.bottom;
    
		vm._svg = d3.select(vm._config.bindTo).append("svg")
			.attr("width", vm._width + vm._margin.left + vm._margin.right)
			.attr("height", vm._height + vm._margin.top + vm._margin.bottom)
		.append("g")
			.attr("transform", "translate(" + vm._margin.left + "," + vm._margin.top + ")");

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

		if(vm._config.data.data){
		  	var q = d3.queue()
		            .defer(mapData, vm._config.data.data, vm._config.data.parser);
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
					domains.y = minMax;
				break;

				case 'time':
					
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
