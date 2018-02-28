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
    vm._tip = d3.tip().attr('class', 'd3-tip');
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

  Scatter.prototype.radius = function(radius) {
    var vm = this;
    vm._config.radius = radius;
    return vm;
  }

  Scatter.prototype.radiusRange = function(radiusRange) {
    var vm = this;
    vm._config.radiusRange = radiusRange;
    return vm;
  }

  Scatter.prototype.properties = function(properties){
    var vm = this;
    vm._config.properties = properties;
    return vm;
  }

  Scatter.prototype.color = function(col) {
    var vm = this;
    vm._config.color = col;
    return vm;
  }

  Scatter.prototype.opacity = function(opacity) {
    var vm = this;
    vm._config.opacity = opacity;
    return vm;
  }

  Scatter.prototype.tip = function(tip){
    var vm = this;
    vm._config.tip = tip;
    vm._tip.html(vm._config.tip);
    return vm;
  }

  Scatter.prototype.end = function() {
    var vm = this;
    return vm._chart;
  }

  //-------------------------------
  //Triggered by chart.js;
  Scatter.prototype.chart = function(chart) {
    var vm = this;
    vm._chart = chart;
    return vm;
  }

  Scatter.prototype.data = function(data) {
    var vm = this;
    vm._data = [];
    data.forEach(function(d, i) {
      var m = {};
      m.datum = d;
      m.x = vm._config.xAxis.scale == 'linear' ? +d[vm._config.x] : d[vm._config.x];
      m.y = vm._config.yAxis.scale == 'linear'? +d[vm._config.y] : d[vm._config.y];
      m.color = vm._config.color.slice(0,1) !== '#' ? d[vm._config.color] : vm._config.color;
      m.radius = vm._config.radius !== undefined ? isNaN(vm._config.radius) ? +d[vm._config.radius] : vm._config.radius : 5;
      
      if(vm._config.properties !== undefined && Array.isArray(vm._config.properties) && vm._config.properties.length > 0){
        vm._config.properties.forEach(function(p){
          m[p] = d[p];
        })
      }
      vm._data.push(m);
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
      }), 
      radiusMinMax = d3.extent(vm._data, function(d) {
        return d.radius;
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
      vm._scales.radius = d3.scaleLinear()
                          .range(vm._config.radiusRange != undefined ? vm._config.radiusRange : [5, 15])
                          .domain(radiusMinMax).nice(); 

    } else {
      vm._scales.x.domain(xMinMax); //.nice();
      vm._scales.y.domain(yMinMax); //.nice();
      if(vm._scales.x.nice) {
        vm._scales.x.nice();
      }
      if(vm._scales.y.nice) {
        vm._scales.y.nice();
      }
      vm._scales.radius = d3.scaleLinear()
                          .range(vm._config.radiusRange != undefined ? vm._config.radiusRange : [5, 15])
                          .domain(radiusMinMax).nice(); 
      if(vm._config.xAxis && vm._config.xAxis.scale !== 'linear') {
        vm._scales.x.domain(vm._data.map(function(m){ return m.x; }));
      }
      if(vm._config.yAxis && vm._config.yAxis.scale !== 'linear') {
        vm._scales.y.domain(vm._data.map(function(m){ return m.y}));
      }
    }

    if(vm._config.xAxis.scaleDomain && Array.isArray(vm._config.xAxis.scaleDomain)) {
      vm._scales.x.domain(vm._config.xAxis.scaleDomain);
     
    } 
    if(vm._config.yAxis.scaleDomain && Array.isArray(vm._config.yAxis.scaleDomain)) {
      vm._scales.y.domain(vm._config.yAxis.scaleDomain);
    }
    return vm;
  };

  Scatter.prototype.draw = function() {
    var vm = this;
    
    //Call the tip
    vm._chart._svg.call(vm._tip)
   
    var circles = vm._chart._svg.selectAll(".dot")
      .data(vm._data)
      //.data(vm._data, function(d){ return d.key})
      .enter().append("circle")
      .attr("class", "dot")
      .attr("class",function(d,i){
        return d.properties !== undefined &&  d.properties.id !== undefined ? "scatter-"+d.properties.id : "scatter-"+i;
      })
      .attr("r", function(d){
        return vm._scales.radius(d.radius);
      })
      .attr("cx", function(d) {
        if(vm._config.xAxis.scale == 'ordinal' || vm._config.xAxis.scale == 'band')
          return vm._scales.x(d.x) + (Math.random() * (vm._scales.x.bandwidth() - (d.size * 2)));
        else 
          return vm._scales.x(d.x);
      })
      .attr("cy", function(d) {
        if(vm._config.yAxis.scale == 'ordinal' || vm._config.yAxis.scale == 'band')
          return vm._scales.y(d.y) + (Math.random() * (vm._scales.y.bandwidth() - (d.size * 2)));
        else 
          return vm._scales.y(d.y);
      })
      .style("fill", function(d) {
        return d.color.slice(0,1) !== '#' ?  vm._scales.color(d.color) : d.color;
      })
      .style("opacity", vm._config.opacity !== undefined ? vm._config.opacity  : 1 )
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

    return vm;
  }

  Scatter.prototype.select = function(id){
    var vm = this; 
    return vm._chart._svg.select("circle.scatter-"+id);
  }

  Scatter.prototype.selectAll = function(id){
    var vm = this; 
    return vm._chart._svg.selectAll("circle");
  }

  return new Scatter(config);
}