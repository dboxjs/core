/*
 * Simple StackBar chart
 */

import * as d3 from "d3";

export default function(config) {

  function StackBar(config) {
    var vm = this;
    vm._config = config ? config : {};
    vm._data = [];
    vm._scales = {};
    vm._axes = {};
    vm._tip = d3.tip().attr('class', 'd3-tip');
  }

  //-------------------------------
  //User config functions
  StackBar.prototype.x = function(col) {
    var vm = this;
    vm._config.x = col;
    return vm;
  }

  StackBar.prototype.y = function(columns) {
    var vm = this;
    vm._config.y = columns;
    return vm;
  }

  StackBar.prototype.properties = function(properties){
    var vm = this;
    vm._config.properties = properties;
    return vm;
  }

  StackBar.prototype.colors = function(col) {
    var vm = this;
    vm._config.colors = col;
    return vm;
  }

  StackBar.prototype.tip = function(tip){
    var vm = this;
    vm._config.tip = tip;
    vm._tip.html(vm._config.tip);
    return vm;
  }

  StackBar.prototype.end = function() {
    var vm = this;
    return vm._chart;
  }

  //-------------------------------
  //Triggered by chart.js;
  StackBar.prototype.chart = function(chart) {
    var vm = this;
    vm._chart = chart;
    return vm;
  }

  StackBar.prototype.data = function(data) {
    var vm = this;

    vm._data = d3.stack()
                .keys(vm._config.y)
                .order(d3.stackOrderNone)
                .offset(d3.stackOffsetNone)
                (data)
    


    /*vm._data = d3.layout.stack()(vm._config.y.map(function(yStack) {
      return data.map(function(d) {
        var m = {};

        if(vm._config.properties !== undefined && Array.isArray(vm._config.properties) && vm._config.properties.length > 0){
          vm._config.properties.forEach(function(p){
            m[p] = d[p];
          })
        }
        return {x: d[vm._config.x], y: +d[yStack]};
      });
    }));*/
    return vm;
  }

  StackBar.prototype.scales = function(s) {
    var vm = this;
    vm._scales = s;
    return vm;
  }

  StackBar.prototype.axes = function(a) {
    var vm = this;
    vm._axes = a;
    return vm;
  }

  StackBar.prototype.domains = function() {
    var vm = this;

    vm._data;
    
    var xMinMax = vm._data[0].map(function(d) {return d.data[vm._config.x]; });
    debugger;
        /*yMinMax = d3.extent(vm._data, function(d) {
          console.log(d);
          return d.y0 + d.y; 
        });*/
    var arrOk = [0, 0];

    vm._scales.x.domain(xMinMax).nice();
    //vm._scales.y.domain(yMinMax).nice();

    return vm;
  };

  StackBar.prototype.draw = function() {
    var vm = this;
    var colors = ["b33040", "#d25c4d", "#f2b447", "#d9d574"];
    //Call the tip
    vm._chart._svg.call(vm._tip)

    var groups = vm._chart._svg.selectAll("g.bar")
      .data(vm._data)
      .enter().append("g")
      .attr("class", "bar")
      .style("fill", function(d, i) { return colors[i]; });

    var rect = groups.selectAll("rect")
      .data(function(d) { return d; })
      .enter()
      .append("rect")
      .attr("x", function(d) { return vm._scales.x(d.data[vm._config.x]); })
      .attr("y", function(d) { return vm._scales.y(d[0] + d[1]); })
      .attr("height", function(d) { return vm._scales.y(d[0]) - vm._scales.y(d[0] + d[1]); })
      .attr("width", vm._scales.x.rangeBand())
      .on('mouseover', function(d, i) {
        if (vm._config.mouseover) {
          vm._config.mouseover.call(vm, d, i);
        }
        vm._tip.show(d, d3.select(this).node());
      })
      .on('mouseout', function(d, i) {
        if (vm._config.mouseout) {
          vm._config.mouseout.call(this, d, i);
        }
        vm._tip.hide(d, d3.select(this).node());
      })
      .on("click", function(d, i) {
        if (vm._config.onclick) {
          vm._config.onclick.call(this, d, i);
        }
      });
      /*.on("mouseover", function() { tooltip.style("display", null); })
      .on("mouseout", function() { tooltip.style("display", "none"); })
      .on("mousemove", function(d) {
        var xPosition = d3.mouse(this)[0] - 15;
        var yPosition = d3.mouse(this)[1] - 25;
        tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
        tooltip.select("text").text(d.y);
      });*/
    return vm;
  }

  StackBar.prototype.select = function(id){
    var vm = this; 
    return vm._chart._svg.select("circle.StackBar-"+id);
  }

  StackBar.prototype.selectAll = function(id){
    var vm = this; 
    return vm._chart._svg.selectAll("circle");
  }

  return new StackBar(config);
}