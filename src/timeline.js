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

    vm._scales.color = d3.scale.category20c();
	}, 
	setAxes : function(){
		var vm = this;

		vm._axes.x = d3.svg.axis()
		  .scale(vm._scales.x)
		  .orient("bottom");

		vm._axes.y = d3.svg.axis()
		  .scale(vm._scales.y)
		  .orient("left");


    if(vm._config.yAxis && vm._config.yAxis.ticks 
        && vm._config.yAxis.ticks.enabled === true && vm._config.yAxis.ticks.style ){

      switch(vm._config.yAxis.ticks.style){
        case 'straightLine':
          vm._axes.y
            .tickSize(-vm._chart._width,0);
        break;
      }

    }
   
    if( vm._config.yAxis.ticks.format){
      console.log('Set tick format');
      vm._axes.y.tickFormat(vm._config.yAxis.ticks.format); 
    }
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
        .text("");

    var yAxis = vm._chart._svg.append("g")
        .attr("class", "y axis")
        .call(vm._axes.y)


    if(vm._config.yAxis && vm._config.yAxis.text){
      yAxis.append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("x", -vm._chart._height/2)
        .attr("y", -vm._config.size.margin.left)
        .attr("dy", ".71em")
        .style("text-anchor", "middle")
        .style("font-size","14px")
        .text(vm._config.yAxis.text);
    }

  },
  drawData : function(){
    var vm = this;
    /* @Deprecated - data manipulation should only happen on the setData method
      vm._data = d3.nest()
        .key(function(d){ return d.name; })
        .entries(vm._data);
    */
    var line = d3.svg.line()
        .interpolate(vm._config.data.interpolation)
        .defined(function(d) { return d; })
        .x(function(d) { return vm._scales.x(d.x); })
        .y(function(d) { return vm._scales.y(d.y); });
      
    var series = vm._chart._svg.selectAll(".series")
        .data(vm._data)
      .enter().append("g")
        .attr("class", "series")

    series.append("path")
        .attr("class", "line")
        .attr("d", function(d) { return line(d.values); })
        .style("stroke-dasharray",function(d){ if(d.name == "Nacional"){
            return ("10,5");
          }})
        .style("stroke", function(d) { 
          if(d.color){ return d.color; }
          else { return vm._scales.color(d.key); }
        }) //return vm._scales.color(d.name); })
        .style("stroke-width", 3);


    series.selectAll('.dot')
        .data(function(d){return d.values})
      .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3)
        .attr("cx", function(d) { return vm._scales.x(d.x); })
        .attr("cy", function(d) { return vm._scales.y(d.y); })
        .style("fill", function(d) { 
          if(d.color){ return d.color; }
          else { return vm._scales.color(d.key); }
        })//return vm._scales.color(d.name); })
        .style("stroke", function(d) { 
          if(d.color){ return d.color; }
          else { return vm._scales.color(d.key); }
        }) // return vm._scales.color(d.name); })
        .on('mouseover', function(d,i){
          if(vm._config.data.mouseover){
            vm._config.data.mouseover.call(vm, d,i)
          }
          vm._chart._tip.show(d, d3.select(this).node())
        })
        .on('mouseout',function(d,i){
          if(vm._config.data.mouseout){
            vm._config.data.mouseout.call(vm, d,i)
          }
          vm._chart._tip.hide(d, d3.select(this).node())
        });
        /*
        series.selectAll('.dot-inside')
          .data(function(d){return d.values})
        .enter().append("circle")
          .attr("class", "dot-inside")
          .attr("r", 4)
          .attr("cx", function(d) { return vm._scales.x(d.x); })
          .attr("cy", function(d) { return vm._scales.y(d.y); })
          .style("fill", 'black')//return vm._scales.color(d.name); })
          .style("stroke", function(d) { return d.color;}) // return vm._scales.color(d.name); })
          .on('mouseover', function(d,i){
            if(vm._config.data.mouseover){
              vm._config.data.mouseover.call(vm, d,i)
            }
            vm._chart._tip.show(d, d3.select(this).node())
          })
          .on('mouseout',function(d,i){
            if(vm._config.data.mouseout){
              vm._config.data.mouseout.call(vm, d,i)
            }
            vm._chart._tip.hide(d, d3.select(this).node())
          });
          */
        
   /* series.append("text")
        .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
        .attr("transform", function(d) { return "translate(" + vm._scales.x(d.value.x) + "," + vm._scales.y(d.value.y) + ")"; })
        .attr("x", 3)
        .attr("dy", ".35em")
        .text(function(d) { return d.name; });*/
  }


}

export default function timeline(config) {
  return new Timeline(arguments.length ? config : null);
}