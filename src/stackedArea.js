import chart from './chart.js';

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

      console.log(error,data);

      vm.setData(data);
      vm.drawData();
    })

  },
  draw : function(){
    var vm = this
    vm._chart = chart(vm._config);
  },
  setScales: function(){
    var vm = this;

    vm._scales.x = d3.scale.linear()
      .range([0, vm._chart._width]);

    vm._scales.y = d3.scale.linear()
      .range([vm._chart._height, 0]);

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
    vm._scales.x.domain(d3.extent(vm._data, function(d) { return d.x; })).nice();
    vm._scales.y.domain([0, d3.max(vm._data, function(d) { return d.y0 + d.y; })]).nice();
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
        .text("Sepal Width (cm)");

    vm._chart._svg.append("g")
        .attr("class", "y axis")
        .call(vm._axes.y)
      .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Sepal Length (cm)")
  },
  drawData : function(){
    var vm = this;

    var stack = d3.layout.stack()
      .offset("zero")
      .values(function(d) { return d.values; })
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; });

    var nest = d3.nest()
        .key(function(d) { return d.key; });

    var area = d3.svg.area()
      .interpolate("cardinal")
      .x(function(d) { return vm._scales.x(d.x); })
      .y0(function(d) { return vm._scales.y(d.y0); })
      .y1(function(d) { return vm._scales.y(d.y0 + d.y); });

    var layers = stack(nest.entries(vm._data));
    
    vm.setDomains();
    vm.drawAxes();

    vm._chart._svg.selectAll(".layer")
      .data(layers)
    .enter().append("path")
      .attr("class", "layer")
      .attr("d", function(d) { return area(d.values); })
      .style("fill", function(d, i) { return vm._scales.color(i); });
  }

}

export default function stackedArea(config) {
  return new StackedArea(arguments.length ? config : null);
}
