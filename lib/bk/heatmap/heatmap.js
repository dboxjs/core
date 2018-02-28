import * as d3 from 'd3';

export default function(config) {

  function Heatmap(config){
    var vm = this;
    vm._config = config ? config : {};
    vm._data = [];
    vm._scales ={};
    vm._axes = {};
    vm._gridSize = Math.floor(vm._config.size.width / 16);
    vm._legendElementWidth = vm._gridSize;

    vm._config._format     = d3.format(",.1f");

    vm._tip = d3.tip().attr('class', 'd3-tip');
  }

  //-------------------------------
  //User config functions
  Heatmap.prototype.x = function(columns){
    var vm = this;
    vm._config.x = columns;
    return vm;
  }

  Heatmap.prototype.y = function(columns){
    var vm = this;
    vm._config.y = columns;
    return vm;
  }

  Heatmap.prototype.colors = function(colors){
    var vm = this;
    vm._config.colors = colors;
    return vm;
  }

  Heatmap.prototype.tip = function(tip){
    var vm = this;
    vm._config.tip = tip;
    vm._tip.html(vm._config.tip);
    return vm;
  }

  Heatmap.prototype.buckets = function(b){
    var vm = this;
    vm._config.buckets = buckets;
    return vm;
  }

  Heatmap.prototype.end = function(){
    var vm = this;
    return vm._chart;
  }

  //-------------------------------
  //Triggered by the chart.js;
  Heatmap.prototype.chart = function(chart){
    var vm = this;
    vm._chart = chart;
    return vm;
  }

  Heatmap.prototype.data = function(data){
    var vm = this;
    vm._data = data.map(function(d){
      var m = {
        y: d.edad_mujer,
        x: d.edad_hombre,
        value: +d.tot,
        percentage : +d.por,
      };
      return m;
    });
    return vm;
  }

  Heatmap.prototype.scales = function(s){
    var vm = this;
    vm._scales = s;
    return vm;
  }

  Heatmap.prototype.axes = function(a){
    var vm = this;
    vm._axes = a;
    return vm;
  }

  Heatmap.prototype.domains = function(){
    var vm = this;
    return vm;
  };

  Heatmap.prototype.draw = function(){
    var vm = this;

    //Call the tip
    vm._chart._svg.call(vm._tip)

    if(vm._config.xAxis){
      vm._config.xAxis.y =  vm._config.y.length * vm._gridSize+25;
    }else{
      vm._config.xAxis = { 'y' : vm._config.y.length * vm._gridSize };
    }

    vm._dayLabels = vm._chart._svg.selectAll(".dayLabel")
          .data(vm._config.y)
          .enter().append("text")
            .text(function (d) { return d; })
            .attr("x", 0)
            .attr("y", function (d, i) { return i * vm._gridSize; })
            .style("text-anchor", "end")
            .attr("transform", "translate(-6," + vm._gridSize / 1.5 + ")")
            .attr("class", "dayLabel mono axis");
            //.attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

    vm._timeLabels = vm._chart._svg.selectAll(".timeLabel")
        .data(vm._config.x)
        .enter().append("text")
          .text(function(d) { return d; })
          .attr("x", function(d, i) { return i * vm._gridSize; })
          .attr("y", vm._config.xAxis.y)
          .style("text-anchor", "middle")
          .attr("transform", "translate(" + vm._gridSize / 2 + ", -6)")
          .attr("class", "timeLabel mono axis");
          //.attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });


    var colorScale = d3.scaleQuantile()
        .domain([0, d3.max(vm._data, function (d) { return d.value; })])
        .range(vm._config.colors);

    var cards = vm._chart._svg.selectAll(".hour")
        .data(vm._data, function(d) {
          return d.y+':'+d.x;
        });

    cards.enter().append("rect")
        .attr("x", function(d) { return (vm._config.x.indexOf(d.x) ) * vm._gridSize; })
        .attr("y", function(d) { return (vm._config.y.indexOf(d.y)) * vm._gridSize; })
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("class", "hour bordered")
        .attr("id", function(d){ return 'x' + d.x + 'y' + d.y;})
        .attr("width", vm._gridSize)
        .attr("height", vm._gridSize)
        .on('mouseover', function(d,i){
          /*if(vm._config.data.mouseover){
            vm._config.data.mouseover.call(vm, d,i);
          }*/
          vm._tip.show(d, d3.select(this).node());
        })
        .on('mouseout', function(d,i){
          /*if(vm._config.data.mouseout){
            vm._config.data.mouseout.call(this, d,i);
          }*/
          vm._tip.hide(d, d3.select(this).node());
        })
        .on("click", function(d,i){
          if(vm._config.data.onclick){
            vm._config.data.onclick.call(this, d, i);
          }
        })
        .style("fill", vm._config.colors[0])
      .transition()
        .duration(3000)
        .ease(d3.easeLinear)
        .style("fill", function(d) { return colorScale(d.value); });


  /*
    var legend = vm._chart._svg.selectAll(".legend")
        .data([0].concat(colorScale.quantiles()), function(d) { return d; });

    var lgroup = legend.enter().append("g")
        .attr("class", "legend");

    lgroup.append("rect")
        .attr("x", function(d, i) {  return vm._legendElementWidth * i; })
        .attr("y", vm._config.size.height - vm._config.size.margin.bottom*2)
        .attr("width", vm._legendElementWidth)
        .attr("height", vm._gridSize / 2)
        .style("fill", function(d, i) { return vm._config.colors[i]; });

    lgroup.append("text")
        .attr("class", "mono")
        .text(function(d) { return "≥ " + Math.round(d); })
        .attr("x", function(d, i) { return vm._legendElementWidth * i; })
        .attr("y", vm._config.size.height - vm._config.size.margin.bottom*2 + vm._gridSize);

    legend.exit().remove();*/
    return vm;
  }

  return new Heatmap(config);
}

