import chart from './chart.js';

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

      vm.setData(data);
      vm.setDomains();
      vm.drawAxes();
      console.log("generate", vm._data);
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
    vm._data = d3.nest()
          .key(function(d){ return d.name; })
          .entries(vm._data);

    console.log("drawData", vm._data);
    var line = d3.svg.line()
        .interpolate(vm._config.data.interpolation)
        .defined(function(d) { return d; })
        .x(function(d) { console.log('x', vm._scales.x.domain(), d.x, vm._scales.x(d.x+'')); return vm._scales.x(d.x); })
        .y(function(d) { return vm._scales.y(d.y); });
      
    var series = vm._chart._svg.selectAll(".series")
        .data(vm._data)
      .enter().append("g")
        .attr("class", "series");

    series.append("path")
        .attr("class", "line")
        .attr("d", function(d) { console.log(d.key, line(d.values)); return line(d.values); })
        .style("stroke", function(d) { return vm._scales.color(d.key); })
        
    series.append("text")
        .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
        .attr("transform", function(d) { return "translate(" + vm._scales.x(d.value.x) + "," + vm._scales.y(d.value.y) + ")"; })
        .attr("x", 3)
        .attr("dy", ".35em")
        .text(function(d) { return d.name; });
  }


}

export default function timeline(config) {
  return new Timeline(arguments.length ? config : null);
}