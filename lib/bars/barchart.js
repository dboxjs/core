/*
 * Simple Bar chart
 */

import * as d3 from "d3";

export default function(config) {

  function Bars(config) {
    var vm = this;
    vm._config = config ? config : {};
    vm._data = [];
    vm._config.colorScale = d3.schemeCategory20c;
    vm._scales = {color: d3.scaleOrdinal(vm._config.colorScale)};
    vm._axes = {};
    //vm._tip = d3.tip().attr('class', 'd3-tip').html(vm._config.data.tip);
  }

  //-------------------------------
  //User config functions
  Bars.prototype.x = function(columnName) {
    var vm = this;
    vm._config.x = columnName;
    return vm;
  }

  Bars.prototype.y = function(columnName) {
    var vm = this;
    vm._config.y = columnName;
    return vm;
  }

  Bars.prototype.color = function(columnName) {
    var vm = this;
    vm._config.color = columnName;
    return vm;
  }

  Bars.prototype.end = function() {
    var vm = this;
    return vm._chart;
  }

  Bars.prototype.colorScale = function(arrayOfColors) {
    var vm = this;
    vm._config.colorScale = arrayOfColors;
    return vm;
  }

  //-------------------------------
  //Triggered by the chart.js;
  Bars.prototype.chart = function(chart) {
    var vm = this;
    vm._chart = chart;
    return vm;
  }

  Bars.prototype.data = function(data) {
    var vm = this;
    vm._data = data.map(function(d) {
      if(d[vm._config.x] == Number(d[vm._config.x]))
        d[vm._config.x] = +d[vm._config.x];
      if(d[vm._config.y] == Number(d[vm._config.y]))
        d[vm._config.y] = +d[vm._config.y];
      return d;
    });
    return vm;
  }

  Bars.prototype.scales = function(s) {
    var vm = this;
    vm._scales = s;
    /* Use
    * vm._config.x
    * vm._config.xAxis.scale
    * vm._config.y
    * vm._config.yAxis.scale
    * vm._data
    */
    /* Generate x scale */
    var config = {
        column: vm._config.x,
        type: vm._config.xAxis.scale,
        range: [0, vm._chart._width],
        minZero: true
    };
    vm._scales.x = vm._chart.generateScale(vm._data, config);

    /* Generate y scale */
    config = {
        column: vm._config.y,
        type: vm._config.yAxis.scale,
        range: [vm._chart._height, 0],
        minZero: true
    };
    vm._scales.y = vm._chart.generateScale(vm._data, config);
    vm._chart._scales.x = vm._scales.x;
    vm._chart._scales.y = vm._scales.y;
    vm._scales.color = d3.scaleOrdinal(vm._config.colorScale);
    return vm;
  }

  Bars.prototype.axes = function(a) {
    var vm = this;
    vm._axes = a;
    return vm;
  }

  Bars.prototype.domains = function() {
    var vm = this;
    return vm;
  };

  Bars.prototype.draw = function() {
    var vm = this;
    //vm._chart._svg.call(vm.tip);

    if(vm._config.xAxis.enabled) {
       vm._chart._svg.append("g")
          .attr("class", "xAxis axis")
          .attr("transform", "translate(0," + vm._chart._height + ")")
          .call(d3.axisBottom(vm._scales.x));
    }

    if(vm._config.yAxis.enabled) {
      var yAxis = d3.axisLeft(vm._scales.y)
              .ticks(vm._config.yAxis.ticks || 10);

      vm._chart._svg.append("g")
          .attr("class", "yAxis axis")
          .call(yAxis);
        /*
        Axis Title
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", "0.71em")
          .attr("text-anchor", "end")
          .text("Frequency");
        */
    }

    vm._chart._svg.selectAll(".bar")
        .data(vm._data)
        .enter().append("rect")
          .attr("class", "bar")
          .attr("x", function(d) { return vm._config.xAxis.scale == 'linear' && vm._config.yAxis.scale == 'linear'? 0 : vm._scales.x(d[vm._config.x]); })
          .attr("y", function(d) { return vm._scales.y(d[vm._config.y]);})
          .attr("width", function(d){ return vm._scales.x.bandwidth ? vm._scales.x.bandwidth() : vm._scales.x(d[vm._config.x]) })
          .attr("height", function(d) { return vm._chart._height - vm._scales.y(d[vm._config.y]); })
          .attr("fill", function(d){ return vm._scales.color(d[vm._config.color])})
          .on('mouseover', function() {

          })
          .on('mouseout', function() {

          })
          .on('click', function() {

          });
    return vm;
  }

  return new Bars(config);
}
