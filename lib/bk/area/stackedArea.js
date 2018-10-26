/*eslint-disable*/

// TODO: Update example
/* Stacked Area example
 */

import * as d3 from "d3";

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

    vm._scales.x = d3.scaleOrdinal()
      .rangePoints([0, vm._chart._width]);

    vm._scales.y = d3.scaleLinear()
      .range([vm._chart._height, 0]);

    if(vm._config.colorScale)
      vm._scales.color = vm._config.colorScale;
    if(!vm._config.colorScale)
      vm._scales.color = d3.scaleOrdinal(d3.schemeCategory20);
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
    var nestedData = nest.entries(vm._data).sort(function(a,b){ return a.values[a.values.length - 1].y > b.values[b.values.length -1].y ? -1 : 1;});
    var layers = stack(nestedData);

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

export default function stackedArea(config){
  return new StackedArea(arguments.length ? config : null);
}
/*eslint-enable*/
