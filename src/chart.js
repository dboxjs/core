
function queryCarto(config, callback){
	var sql = new cartodb.SQL({ user: config.cartodb.user });
	sql.execute(config.cartodb.sql)
		.done(function(data){
			data.rows = data.row.map(config.paser)
			callback(null, data);
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
	draw : function(){
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
			          .defer(d3.tsv, vm._config.data.url, vm._config.data.parser);
			return q;
		} 

    if(vm._config.data.csv){
      var q = d3.queue()
                .defer(d3.csv, vm._config.data.url, vm._config.data.parser);
      return q;
    }

    if(vm._config.data.data){
      var q = d3.queue()
                .defer(mapData, vm._config.data.data, vm._config.data.parser);
      return q;
    }

		if(vm._config.data.cartodb){
			
			var q = d3.queue()
					  .defer(queryCarto,vm._config.data)

			return q; 

		}
	}
}





export default function chart(config) {
  return new Chart(arguments.length ? config : null);
}
