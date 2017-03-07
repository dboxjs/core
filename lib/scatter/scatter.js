/*
 * Simple Scatter chart
 */

import * as d3 from "d3";

export default function(config) {

  function Scatter(config) {
    var vm = this;
    vm._config = config ? config : {};
    vm._data = [];
    vm._scales = {};
    vm._axes = {};
    //vm._tip = d3.tip().attr('class', 'd3-tip').html(vm._config.data.tip);
  }

  //-------------------------------
  //User config functions
  Scatter.prototype.x = function(col) {
    var vm = this;
    vm._config.x = col;
    return vm;
  }

  Scatter.prototype.y = function(col) {
    var vm = this;
    vm._config.y = col;
    return vm;
  }

  Scatter.prototype.color = function(col) {
    var vm = this;
    vm._config.color = col;
    return vm;
  }

  Scatter.prototype.end = function() {
    var vm = this;
    return vm._chart;
  }

  //-------------------------------
  //Triggered by the chart.js;
  Scatter.prototype.chart = function(chart) {
    var vm = this;
    vm._chart = chart;
    return vm;
  }

  Scatter.prototype.data = function(data) {
    var vm = this;
    vm._data = data.map(function(d) {
      var m = {};
      m.x = +d[vm._config.x];
      m.y = +d[vm._config.y];
      m.color = d[vm._config.color];
      return m;
    });
    return vm;
  }

  Scatter.prototype.scales = function(s) {
    var vm = this;
    vm._scales = s;
    return vm;
  }

  Scatter.prototype.axes = function(a) {
    var vm = this;
    vm._axes = a;
    return vm;
  }

  Scatter.prototype.domains = function() {
    var vm = this;
    var xMinMax = d3.extent(vm._data, function(d) {
        return d.x;
      }),
      yMinMax = d3.extent(vm._data, function(d) {
        return d.y;
      });
    var arrOk = [0, 0];

    if (vm._config.fixTo45) {
      if (xMinMax[1] > yMinMax[1]) {
        arrOk[1] = xMinMax[1];
      } else {
        arrOk[1] = yMinMax[1];
      }

      if (xMinMax[0] < yMinMax[0]) {
        //yMinMax = xMinMax;
        arrOk[0] = xMinMax[0];
      } else {
        arrOk[0] = yMinMax[0];
      }

      vm._scales.x.domain(arrOk).nice();
      vm._scales.y.domain(arrOk).nice();

    } else {
      vm._scales.x.domain(xMinMax).nice();
      vm._scales.y.domain(yMinMax).nice();
    }

    return vm;
  };

  Scatter.prototype.draw = function() {
    var vm = this;

    console.log(vm, vm._scales, vm._scales.y(6.3))

    var circles = vm._chart._svg.selectAll(".dot")
      .data(vm._data)
      //.data(vm._data, function(d){ return d.key})
      .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 5)
      .attr("cx", function(d) {
        return vm._scales.x(d.x);
      })
      .attr("cy", function(d) {
        console.log(d, vm._scales, vm._scales.y(d.y));
        return vm._scales.y(d.y);
      })
      .style("fill", function(d) {
        return vm._scales.color(d.color);
      })
      .on('mouseover', function(d, i) {
        if (vm._config.mouseover) {
          vm._config.mouseover.call(vm, d, i);
        }
        //vm._chart._tip.show(d, d3.select(this).node());
      })
      .on('mouseout', function(d, i) {
        if (vm._config.mouseout) {
          vm._config.mouseout.call(this, d, i);
        }
        //vm._chart._tip.hide();
      })
      .on("click", function(d, i) {
        if (vm._config.onclick) {
          vm._config.onclick.call(this, d, i);
        }
      });

    return vm;
  }

  return new Scatter(config);
}