(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.dbox = global.dbox || {})));
}(this, function (exports) { 'use strict';

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

	  vm._tip = d3.tip().attr('class', 'd3-tip').html(vm._config.data.tip);
	  vm.draw();
	}

	Chart.prototype = chart.prototype = {
		'dispatch': d3.dispatch("load", "change"),
		'draw' : function(){
			var vm = this;

			d3.select(vm._config.bindTo).html("");

			vm._margin = vm._config.size.margin,
			vm._width = vm._config.size.width - vm._margin.left - vm._margin.right,
			vm._height = vm._config.size.height - vm._margin.top - vm._margin.bottom;
	    
			vm._svg = d3.select(vm._config.bindTo).append("svg")
				.attr("width", vm._width + vm._margin.left + vm._margin.right)
				.attr("height", vm._height + vm._margin.top + vm._margin.bottom)
			.append("g")
				.attr("transform", "translate(" + vm._margin.left + "," + vm._margin.top + ")")
				.call(vm._tip);

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





	function chart(config) {
	  return new Chart(arguments.length ? config : null);
	}

	function Scatter(config) {
	  var vm = this;
	  vm._config = config; 
	  vm._chart; 
	  vm._scales = {}; 
	  vm._axes = {};
	}

	Scatter.prototype = scatter.prototype = {
		generate:function(){
			var vm = this, q;
			
			vm.draw();
			vm.setScales();
			vm.setAxes();

			q = vm._chart.loadData();

	    q.await(function(error,data){
	      if (error) {
	        throw error;	 
	        return false;
	      } 

	      vm.setData(data);
	      vm.setDomains();
	      vm.drawAxes();
	      vm.drawData();
	      vm.draw45Line();
	    })

		},
		draw : function(){
			var vm = this
			vm._chart = chart(vm._config);
		},
		setScales: function(){
			var vm = this;
	    vm._scales = vm._chart.setScales();
			
		}, 
		setAxes : function(){
			var vm = this;

			vm._axes.x = d3.svg.axis()
			  .scale(vm._scales.x)
			  .orient("bottom");

			vm._axes.y = d3.svg.axis()
			  .scale(vm._scales.y)
			  .orient("left");
		},
		setData:function(data){
	    var vm = this;
	    vm._data = data;
	  },
	  setDomains:function(){
	    var vm = this;
	    vm._scales.x.domain(d3.extent(vm._data, function(d) { return d.x; })).nice();
	    vm._scales.y.domain(d3.extent(vm._data, function(d) { return d.y; })).nice();
	  },
	  drawAxes:function(){
	    var vm = this;

	    var xAxis = vm._chart._svg.append("g")
	        .attr("class", "x axis")
	        .attr("transform", "translate(0," + vm._chart._height + ")")
	        .call(vm._axes.x);


	    if(vm._config.xAxis && vm._config.xAxis.text){
	      xAxis.append("text")
	        .attr("class", "label")
	        .attr("x", vm._chart._width)
	        .attr("y", 30)
	        .attr("x", 470)
	        .style("text-anchor", "end")
	        .text(vm._config.xAxis.text);
	    }

	    var yAxis = vm._chart._svg.append("g")
	        .attr("class", "y axis")
	        .call(vm._axes.y);    

	    if(vm._config.yAxis && vm._config.yAxis.text){
	      yAxis.append("text")
	        .attr("class", "label")
	        .attr("transform", "rotate(-90)")
	        .attr("y", -40)
	        .attr("x", -100)
	        .attr("dy", ".71em")
	        .style("text-anchor", "end")
	        .text(vm._config.yAxis.text);
	    }
	  
	  },
	  draw45Line: function(){
	    var vm = this;
	    vm._chart._svg.append('line')
	      .attr("x1", vm._scales.x(0))
	      .attr("y1", vm._scales.y(0))
	      .attr("x2", vm._scales.x(vm._scales.x.domain()[1]))
	      .attr("y2", vm._scales.y(vm._scales.y.domain()[1]))
	      .style("stroke-dasharray", ("10,3"))
	      .attr("stroke","#bbb");
	  },
	  drawData : function(){
	    var vm = this;
	    vm._chart._svg.selectAll(".dot")
	      .data(vm._data, function(d){ return d.key})
	    .enter().append("circle")
	      .attr("class", "dot")
	      .attr("r", 3.5)
	      .attr("cx", function(d) { return vm._scales.x(d.x); })
	      .attr("cy", function(d) { return vm._scales.y(d.y); })
	      .style("fill", function(d) { return vm._scales.color(d.color); })
	      .on('mouseover', function(d,i){
	        vm._config.data.mouseover.call(vm, d,i);
	        vm._chart._tip.show(d, d3.select(this).node())
	      })
	      .on('mouseout', function(d,i){
	        vm._config.data.mouseout.call(this, d,i);
	        vm._chart._tip.hide();
	      })
	      .on("click", function(d,i){
	        vm._config.data.onclick.call(this, d, i);
	      });
	  }, 
	  select:function(selector){
	    var vm = this; 
	   
	    vm._chart._svg.selectAll('circle')
	      .data(vm._data)
	      .attr('r', function(d){
	        if(d.x === selector || d.y === selector || d.z === selector){
	          vm._chart._tip.show(d,d3.select(this).node())
	          return 10;
	        }else{
	          return 3.5;
	        }
	      })
	      .style('fill', '#ccc')
	      .style('cursor', 'pointer')
	  },
	  redraw: function(config){
	    var vm = this;
	    vm._chart.destroy(); 
	    vm._config = config; 
	    vm.generate();

	  }


	}

	function scatter(config) {
	  return new Scatter(arguments.length ? config : null);
	}

	function Timeline(config) {
	  var vm = this;
	  vm._config = config; 
	  vm._chart; 
	  vm._scales = {}; 
	  vm._axes = {};
	}

	Timeline.prototype = timeline.prototype = {
		generate:function(){
			var vm = this, q;
			
			vm.draw();
	    vm.setScales();
			vm.setAxes();

			q = vm._chart.loadData();

	    q.await(function(error,data){
	      if (error) {
	        //console.log(error)
	        throw error;	
	        return false; 
	      }

	      debugger;
	      vm.setData(data);
	      vm.setDomains();
	      vm.drawAxes();
	      vm.drawData();
	    })

		},
		draw : function(){
			var vm = this
			vm._chart = chart(vm._config);
		},
		setScales: function(){
			var vm = this;

			vm._scales.x = d3.time.scale()
			  .range([0, vm._chart._width]);

			vm._scales.y = d3.scale.linear()
			  .range([vm._chart._height, 0]);

			vm._scales.color = d3.scale.category10();
		}, 
		setAxes : function(){
			var vm = this;

			vm._axes.x = d3.svg.axis()
			  .scale(vm._scales.x)
			  .orient("bottom");

			vm._axes.y = d3.svg.axis()
			  .scale(vm._scales.y)
			  .orient("left");
		},
		setData:function(data){
	    var vm = this;
	    var keys = d3.keys(data[0]).filter(function(key) { return key !== "date"; }); 

	    var series = keys.map(function(name) {
	      return {
	        name: name,
	        values: data.map(function(d) {
	          return {x: d.date, y: +d[name]};
	        })
	      };
	    });

	    vm._data = series;
	  },
	  setDomains:function(){
	    var vm = this;

	    vm._scales.color.domain(vm._data.map(function(serie){
	      return serie.name;
	    }));

	    vm._scales.x.domain([
	      d3.min(vm._data, function(c) { return d3.min(c.values, function(v) { return v.x; }); }),
	      d3.max(vm._data, function(c) { return d3.max(c.values, function(v) { return v.x; }); })
	    ]);

	    vm._scales.y.domain([
	      d3.min(vm._data, function(c) { return d3.min(c.values, function(v) { return v.y; }); }),
	      d3.max(vm._data, function(c) { return d3.max(c.values, function(v) { return v.y; }); })
	    ]);
	  },
	  drawAxes:function(){
	    var vm = this;

	    vm._chart._svg.append("g")
	        .attr("class", "x axis")
	        .attr("transform", "translate(0," + vm._chart._height + ")")
	        .call(vm._axes.x)
	      .append("text")
	        .attr("class", "label")
	        .attr("x", vm._chart._width)
	        .attr("y", -6)
	        .style("text-anchor", "end")
	        .text("Time");

	    vm._chart._svg.append("g")
	        .attr("class", "y axis")
	        .call(vm._axes.y)
	      .append("text")
	        .attr("class", "label")
	        .attr("transform", "rotate(-90)")
	        .attr("y", 6)
	        .attr("dy", ".71em")
	        .style("text-anchor", "end")
	        .text("")
	  },
	  drawData : function(){
	    var vm = this;

	    var line = d3.svg.line()
	        .interpolate("basis")
	        .x(function(d) { return vm._scales.x(d.x); })
	        .y(function(d) { return vm._scales.y(d.y); });
	      
	    var series = vm._chart._svg.selectAll(".series")
	        .data(vm._data)
	      .enter().append("g")
	        .attr("class", "series");

	    series.append("path")
	        .attr("class", "line")
	        .attr("d", function(d) { return line(d.values); })
	        .style("stroke", function(d) { return vm._scales.color(d.name); })
	        
	    series.append("text")
	        .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
	        .attr("transform", function(d) { return "translate(" + vm._scales.x(d.value.x) + "," + vm._scales.y(d.value.y) + ")"; })
	        .attr("x", 3)
	        .attr("dy", ".35em")
	        .text(function(d) { return d.name; });
	  }


	}

	function timeline(config) {
	  return new Timeline(arguments.length ? config : null);
	}

	function StackedArea(config) {
	  var vm = this;
	  vm._config = config; 
	  vm._chart; 
	  vm._scales = {}; 
	  vm._axes = {};
	}

	StackedArea.prototype = stackedArea.prototype = {
	  generate:function(){
	    var vm = this, q;
	    
	    vm.draw();
	    vm.setScales();
	    vm.setAxes();

	    q = vm._chart.loadData();

	    q.await(function(error,data){
	      if (error) throw error;   

	      //console.log(error,data);

	      vm.setData(data);
	      vm.drawData();
	    })

	  },
	  select: function(datum){
	    return d3.selectAll(".layer").data(datum);
	  },
	  draw : function(){
	    var vm = this
	    vm._chart = chart(vm._config);
	  },
	  setScales: function(){
	    var vm = this;

	    vm._scales.x = d3.scale.ordinal()
	      .rangePoints([0, vm._chart._width]);

	    vm._scales.y = d3.scale.linear()
	      .range([vm._chart._height, 0]);
	    
	    if(vm._config.colorScale)
	      vm._scales.color = vm._config.colorScale;
	    if(!vm._config.colorScale)
	      vm._scales.color = d3.scale.category20();
	  }, 
	  setAxes : function(){
	    var vm = this;

	    vm._axes.x = d3.svg.axis()
	      .scale(vm._scales.x)
	      .orient("bottom");

	    vm._axes.y = d3.svg.axis()
	      .scale(vm._scales.y)
	      .orient("left");
	  },
	  setData:function(data){
	    var vm = this;
	    vm._data = data;
	  },
	  setDomains:function(){
	    var vm = this;
	    vm._scales.x.domain(vm._data.map(function(d) { return d.x; }));
	    vm._scales.y.domain([0, d3.max(vm._data, function(d) { return d.y0 + d.y; })]);
	    if(vm._config.percentage)
	      vm._scales.y.domain([0, 100]);
	  },
	  drawAxes:function(){
	    var vm = this;

	    vm._chart._svg.append("g")
	        .attr("class", "x axis")
	        .attr("transform", "translate(0," + vm._chart._height + ")")
	        .call(vm._axes.x)
	      .append("text")
	        .attr("class", "label")
	        .attr("x", vm._chart._width)
	        .attr("y", -6)
	        .style("text-anchor", "end");

	    vm._chart._svg.append("g")
	        .attr("class", "y axis")
	        .call(vm._axes.y)
	      .append("text")
	        .attr("class", "label")
	        .attr("transform", "rotate(-90)")
	        .attr("y", 6)
	        .attr("dy", ".71em")
	        .style("text-anchor", "end");
	  },
	  drawData : function(){
	    var vm = this;

	    var total = d3.nest()
	        .key(function(d){ return d.x; })
	        .rollup(function(leaves){ 
	          return d3.sum(leaves, function(j){ return j.y; });
	        }).entries(vm._data);

	    var stack = d3.layout.stack()
	      .offset("zero")
	      .values(function(d) { return d.values; })
	      .x(function(d) { return d.x; })
	      .y(function(d) { return d.y; });

	    var nest = d3.nest()
	        .key(function(d) { return d.key; });

	    var area = d3.svg.area()
	      .interpolate("monotone")
	      .x(function(d) { return vm._scales.x(d.x); })
	      .y0(function(d) { return vm._scales.y(d.y0); })
	      .y1(function(d) { return vm._scales.y(d.y0 + d.y); });

	    if(vm._config.percentage){
	      var area = d3.svg.area()
	      .interpolate("monotone")
	      .x(function(d) { return vm._scales.x(d.x); })
	      .y0(function(d) { return vm._scales.y((d.y0) * 100 / getChild(total, d.x+'').values); })
	      .y1(function(d) { return vm._scales.y((d.y0 + d.y) * 100 / getChild(total, d.x+'').values); });
	    }

	    var layers = stack(nest.entries(vm._data));
	    
	    vm.setDomains();
	    vm.drawAxes();

	    vm._chart._svg.selectAll(".layer")
	      .data(layers, function(d){return d.key;})
	    .enter().append("path")
	      .attr("class", "layer")
	      .attr("d", function(d) { return area(d.values); })
	      .style("fill", function(d, i) { return vm._scales.color(i); })
	      .on("click", function(d, i){
	        vm._config.data.onclick.call(this, d, i); })
	      .on("mouseover", function(d, i){
	        vm._config.data.onmouseover.call(this, d, i); })
	      .on("mouseout", function(d, i){
	        vm._config.data.onmouseout.call(this, d, i); });
	  }

	}

	function getChild(data, key){
	  var obj = {};
	  data.forEach(function(d){
	    if(d.key === key){
	      obj = d;
	    }
	  });
	  return obj;
	}

	function stackedArea(config){
	  return new StackedArea(arguments.length ? config : null);
	}

	function Columns(options) {
	  var vm = this;
		vm._config = options.config; 
		vm._chart  = options.chart; 
		vm._data   = options.data; 
		vm._scales = options.scales; 
	}

	Columns.prototype.draw = function (){
	  var vm = this;

	  vm._chart._svg.selectAll(".bar")
	      .data(vm._data)
	    .enter().append("rect")
	      .attr("class", "bar")
	      .attr("x", function(d) { return vm._scales.x(d.x); })
	      .attr("width", vm._scales.x.rangeBand())
	      .attr("y", function(d) { return vm._scales.y(d.y); })
	      .attr("height", function(d) { return vm._chart._height - vm._scales.y(d.y); })
	      .on('mouseover', function(d,i){
		      vm._config.data.mouseover.call(vm, d,i);
		    });

	}

	function columns(options) {
	  return new Columns(arguments.length ? options : null);
	}

	function LineAndCircles(options) {
	  var vm = this;
	  vm._config = options.config; 
	  vm._chart  = options.chart; 
	  vm._data   = options.data; 
	  vm._scales = options.scales; 
	}


	LineAndCircles.prototype.draw = function (){
	  var vm = this;

	  vm._chart._svg.selectAll(".dot")
	    .data(vm._data)
	  .enter().append("circle")
	    .attr("class", "dot")
	    .attr("r", 3.5)
	    .attr("cx", function(d) { return vm._scales.x(d.x)+vm._scales.x.rangeBand()/2; })
	    .attr("cy", function(d) { return vm._scales.y(d.y); })
	    .style("fill", function(d) { return vm._scales.color(d.color); })
	    .on('mouseover', function(d,i){
	      vm._config.data.mouseover.call(vm, d,i)
	    })
	    .on('mouseover', function(d){
	      vm._chart._tip.show(d, d3.select(this).node())
	    })
	    .on('mouseout', vm._chart._tip.hide)
	    

	  vm._chart._svg.selectAll('line.stem')
	      .data(vm._data)
	    .enter()
	      .append('line')
	      .classed('stem', true)
	      .attr('x1', function(d){
	        return vm._scales.x(d.x)+vm._scales.x.rangeBand()/2;
	      })
	      .attr('x2', function(d){
	        return vm._scales.x(d.x)+vm._scales.x.rangeBand()/2;
	      })
	      .attr('y1', function(d){
	        return vm._scales.y(d.y);
	      })
	      .attr('y2', vm._chart._height)
	      .attr('stroke', '#7A7A7A')

	  vm._chart._svg.selectAll('circle')
	      .data(vm._data)
	    .enter()
	      .append('circle')
	      .attr('cx', function(d) {
	        return vm._scales.x(d.x);
	      })
	      .attr('cy', function(d) {
	        return vm._scales.y(d.y);
	      })
	      .attr('r', 6)
	      .attr('fill', '#ccc')
	      .style('cursor', 'pointer')

	}

	LineAndCircles.prototype.select = function(selector){
	  var vm = this; 
	   
	  vm._chart._svg.selectAll('circle')
	    .data(vm._data)
	    .attr('r', function(d){
	      if(d.x === selector || d.y === selector){
	        vm._chart._tip.show(d,d3.select(this).node())
	        return 10;
	      }else{
	        return 3.5;
	      }
	    })
	    .style('fill', '#ccc')
	    .style('cursor', 'pointer')
	}


	function lineAndCircles(options) {
	  return new LineAndCircles(arguments.length ? options : null);
	}

	function QuantilesAndCircles(options) {
	  var vm = this;
	  vm._config = options.config; 
	  vm._chart  = options.chart; 
	  vm._data   = options.data; 
	  vm._scales = options.scales; 
	}


	QuantilesAndCircles.prototype.draw = function (){
	  var vm = this;

	  vm._chart._svg.selectAll(".dot")
	    .data(vm._data)
	  .enter().append("circle")
	    .attr("class", "dot")
	    .attr("r", 3.5)
	    .attr("cx", function(d) { console.log('X',d.x, vm._scales.q(d.x)) ;return vm._scales.x ( vm._scales.q(d.x) ) +vm._scales.x.rangeBand()/2; })
	    .attr("cy", function(d) { return vm._scales.y(d.y); })
	    .style("fill", function(d) { return vm._scales.color(d.color); })
	    .on('mouseover', function(d,i){
	      vm._config.data.mouseover.call(vm, d,i);
	    });

	  /*vm._chart._svg.selectAll('line.stem')
	      .data(vm._data)
	    .enter()
	      .append('line')
	      .classed('stem', true)
	      .attr('x1', function(d){
	        return vm._scales.x(d.x)+vm._scales.x.range()/2;
	      })
	      .attr('x2', function(d){
	        return vm._scales.x(d.x)+vm._scales.x.range()/2;
	      })
	      .attr('y1', function(d){
	        return vm._scales.y(d.y);
	      })
	      .attr('y2', vm._chart._height)
	      .attr('stroke', '#7A7A7A')*/

	  vm._chart._svg.selectAll('circle')
	      .data(vm._data)
	    .enter()
	      .append('circle')
	      .attr('cx', function(d) {
	        return vm._scales.x(d.x);
	      })
	      .attr('cy', function(d) {
	        return vm._scales.y(d.y);
	      })
	      .attr('r', 6)
	      .attr('fill', '#ccc')
	      .style('cursor', 'pointer')

	}


	QuantilesAndCircles.prototype.renameAxis = function (axis){
	  var vm = this;

	  axis.selectAll("text")  
	    .text('Marco rules!!!!!')

	}


	function quantilesAndCircles(options) {
	  return new QuantilesAndCircles(arguments.length ? options : null);
	}

	function AverageLines(options) {
	  var vm = this;
	  vm._config = options.config; 
	  vm._chart  = options.chart; 
	  vm._data   = options.data; 
	  vm._scales = options.scales; 
	}


	AverageLines.prototype.draw = function (){
	  var vm = this;

	  //Remove all
	  vm._chart._svg.selectAll("line.avg-line").remove(); 

	  if(vm._config.plotOptions && vm._config.plotOptions.bars && Array.isArray(vm._config.plotOptions.bars.averageLines) && vm._config.plotOptions.bars.averageLines.length >0 ){
	    
	    //draw line
	    vm._chart._svg.selectAll("line.avg-line")
	      .data(vm._config.plotOptions.bars.averageLines)
	    .enter().append("line")
	      .attr("class", ".avg-line")
	      .attr('x1', 0)
	      .attr('x2', function(d){
	        return vm._chart._width;
	      })
	      .attr('y1', function(d){
	        return vm._scales.y(d.data.raw);
	      })
	      .attr('y2', function(d){
	        return vm._scales.y(d.data.raw);
	      })
	      .attr('stroke', function(d){  return d.color })
	      .attr("stroke-width", function(d){ 
	        var strokeWidth = '3px'; 
	        if(d.strokeWidth) strokeWidth = d.strokeWidth;
	        return strokeWidth; 
	      })
	      .style('display', function(d){
	        if(d.enabled) return 'block';
	        else return 'none';
	      })


	    //Add text
	    vm._chart._svg.selectAll("text.avg-line")
	      .data(vm._config.plotOptions.bars.averageLines)
	    .enter().append("text")
	        .attr("class", "avg-line")
	        .attr("x", vm._chart._width)
	        .attr("y", function(d){
	          return vm._scales.y(d.data.raw);
	        })
	        .style("text-anchor", "start")
	        .style("fill", function(d){  return d.color } )
	        .style("font-size", function(d){ 
	          var size = '14px'; 
	          if(d.fontSize) size = d.fontSize;
	          return size; 
	        })
	        .text(function(d){
	          return d.data.raw;
	        })
	        .style('display', function(d){
	          if(d.enabled) return 'block';
	          else return 'none';
	        });

	    /* @TODO ADD LEGEND FOR AVERAGE LINES
	    vm._chart._svg.selectAll("rect.avg-line")
	      .append('rect')
	      .attr("class", "avg-line")
	      .attr("x", function(d) { return vm._scales.x(0); })
	      .attr("width", vm._chart._width)
	      .attr("y", function(d) { return 0 })
	      .attr("height", function(d) { return vm._chart._height - vm._scales.y(d.y); });*/
	  }
	}

	function averageLines(options) {
	  return new AverageLines(arguments.length ? options : null);
	}

	function Bars(config) {
	  var vm = this;
	  vm._config = config; 
	  vm._chart; 
	  vm._scales = {}; 
	  vm._axes = {};
	  vm._averageLines = []; 
	  vm.columns = null; 
	  vm.lineAndCircles = null; 
	  vm.quantilesAndCircles = null; 
	}

	Bars.prototype = bars.prototype = {
		generate:function(){
			var vm = this, q, averageLines;

			vm.init();
			vm.setScales();
			vm.setAxes();

			q = vm._chart.loadData();

	    q.awaitAll(function(error,data){
	      if (error) {
	        throw error;	 
	        return false;
	      } 
	      vm.setData(data);
	      vm.setDomains();
	      vm.drawAxes();
	      vm.drawData();
	      vm._chart.dispatch.load(); 
	    });

		},
		init : function(){
			var vm = this
			vm._chart = chart(vm._config);
	    vm._chart.dispatch.on("load.chart", vm._config.events.load(vm));
		},
		setScales: function(){
			var vm = this;
	    vm._scales = vm._chart.setScales();
		}, 
		setAxes : function(){
			var vm = this;

			vm._axes.x = d3.svg.axis()
			  .scale(vm._scales.x)
			  .orient("bottom");

			vm._axes.y = d3.svg.axis()
			  .scale(vm._scales.y)
			  .orient("left")


	    if(vm._config.yAxis && vm._config.yAxis.ticks 
	        && vm._config.yAxis.ticks.enabled === true && vm._config.yAxis.ticks.style ){

	      switch(vm._config.yAxis.ticks.style){
	        case 'straightLine':
	          vm._axes.y
	            .tickSize(-vm._chart._width,0);
	        break;
	      }
	    }
		},
		setData:function(data){
	    var vm = this;
	    
	    if(Array.isArray(data)){
	      
	      vm._data = data[0];

	      if(data.length > 1){
	        data.forEach(function(d,i){
	          if(i>0) {
	            if(vm._config.plotOptions.bars.averageLines[i-1].data.cartodb){
	              vm._config.plotOptions.bars.averageLines[i-1].data.raw = d[0].avg; 
	            }
	          }
	        });
	      }
	    }
	  },
	  setDomains:function(){
	    var vm = this;
	    
	    var domains = vm._chart.getDomains(vm._data);

	    vm._scales.x.domain(domains.x);
	    vm._scales.y.domain(domains.y);

	    //Quantile scale
	    if(vm._scales.q){ 
	      vm._scales.q.domain(domains.q);
	      console.log('Domain',vm._scales.q.domain())
	      console.log('Range',vm._scales.q.range())
	      console.log('Treshold',vm._scales.q.quantiles());      
	    }

	  },
	  drawAxes:function(){
	    var vm = this;

	     var params ={
	      "config"  : vm._config, 
	      "chart"   : vm._chart,
	      "data"    : vm._data,
	      "scales"  : vm._scales, 
	    }

	    var xAxis = vm._chart._svg.append("g")
	        .attr("class", "x axis")
	        .attr("transform", "translate(0," + vm._chart._height + ")")
	        .call(vm._axes.x);

	    //Rotation
	    xAxis.selectAll("text")  
	        .style("text-anchor", "end")
	        .attr("dx", "-.8em")
	        .attr("dy", ".15em")
	        .attr("transform", function(d) {
	            return "rotate(-65)" 
	            });

	    if(vm._config.style){
	      switch(vm._config.style){

	        case 'quantilesAndCircles':
	          if(vm.quantilesAndCircles === null ){
	            vm.quantilesAndCircles = quantilesAndCircles(params); 
	          }
	          vm.quantilesAndCircles.renameAxis(xAxis);
	        break
	      }
	    }      

	    if(vm._config.xAxis && vm._config.xAxis.text){
	      xAxis.append("text")
	        .attr("class", "label")
	        .attr("x", vm._chart._width)
	        .attr("y", -6)
	        .style("text-anchor", "end")
	        .text(vm._config.xAxis.text);
	    }

	    var yAxis = vm._chart._svg.append("g")
	        .attr("class", "y axis")
	        .call(vm._axes.y);    

	    if(vm._config.yAxis && vm._config.yAxis.text){
	      yAxis.append("text")
	        .attr("class", "label")
	        .attr("transform", "rotate(-90)")
	        .attr("y", 6)
	        .attr("dy", ".71em")
	        .style("text-anchor", "end")
	        .text(vm._config.yAxis.text);
	    }
	  },
	  drawData : function(){
	    var vm = this; 

	    var params ={
	      "config"  : vm._config, 
	      "chart"   : vm._chart,
	      "data"    : vm._data,
	      "scales"  : vm._scales, 
	    }

	    if(vm._config.style){
	      switch(vm._config.style){
	        case 'lineAndCircles':
	          if(vm.quantilesAndCircles === null ){
	            vm.lineAndCircles = lineAndCircles(params); 
	          }
	          vm.lineAndCircles.draw();
	        break;

	        case 'columns':
	          if(vm.quantilesAndCircles === null ){
	            vm.columns = columns(params); 
	          }
	          vm.columns.draw();
	        break

	        case 'quantilesAndCircles':
	          if(vm.quantilesAndCircles === null ){
	            vm.quantilesAndCircles = quantilesAndCircles(params); 
	          }
	          vm.quantilesAndCircles.draw();
	        break

	        default:
	         if(vm.quantilesAndCircles === null ){
	            vm.columns = columns(params); 
	          }
	          vm.columns.draw();
	        break;
	      }
	    }
	    //Draw averageLines
	    vm.averageLines = averageLines(params); 
	    vm.averageLines.draw();
	  },
	  set: function(option,value){
	    var vm = this; 
	    if(option === 'config') {
	      vm._config = value; 
	    }else{
	      vm._config[option] = value ; 
	    }
	    
	  }, 
	  select:function(selector){
	    var vm = this; 

	    if(vm._config.style){
	      switch(vm._config.style){
	        case 'lineAndCircles':
	          if(vm.lineAndCircles === null ){
	            vm.lineAndCircles = lineAndCircles(params); 
	          }
	          vm.lineAndCircles.select(selector);
	        break;

	        case 'columns':
	          if(vm.columns === null ){
	            vm.columns = columns(params); 
	          }
	          vm.columns.draw();
	        break

	        case 'quantilesAndCircles':
	          if(vm.quantilesAndCircles === null ){
	            vm.quantilesAndCircles = quantilesAndCircles(params); 
	          }
	          vm.quantilesAndCircles.draw();
	        break

	        default:
	         if(vm.columns === null ){
	            vm.columns = columns(params); 
	          }
	          vm.columns.draw();
	        break;
	      }
	    }
	  },
	  redraw: function(){
	    var vm = this;
	    vm._chart.destroy(); 
	    vm.generate();
	  }
	  
	}


	function bars(config) {
	  return new Bars(arguments.length ? config : null);
	}

	exports.scatter = scatter;
	exports.timeline = timeline;
	exports.stackedArea = stackedArea;
	exports.bars = bars;

	Object.defineProperty(exports, '__esModule', { value: true });

}));