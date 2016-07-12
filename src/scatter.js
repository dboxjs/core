import chart from './chart.js';

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

    vm._chart._svg.selectAll(".dot")
      .data(vm._data)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", function(d) { return vm._scales.x(d.x); })
      .attr("cy", function(d) { return vm._scales.y(d.y); })
      .style("fill", function(d) { return vm._scales.color(d.color); })
      .on('mouseover', function(d,i){
        vm._config.data.mouseover.call(vm, d,i);
      });
  }, 
  redraw: function(config){
    var vm = this;
    vm._chart.destroy(); 
    vm._config = config; 
    vm.generate();

  }


}

export default function scatter(config) {
  return new Scatter(arguments.length ? config : null);
}
