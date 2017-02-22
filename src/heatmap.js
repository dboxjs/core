export default function(config) {

  function Heatmap(config){
    var vm = this;
    vm._config = config ? config : {};
    vm._data = [];
    vm._scales ={};
    vm._axes = {};
    //vm._tip = d3.tip().attr('class', 'd3-tip').html(vm._config.data.tip);
    //
    var vm._gridSize = Math.floor(width / 24),
      legendElementWidth = vm._gridSize*2,
      buckets = 9,
      colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"], // alternatively colorbrewer.YlGnBu[9]
      days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
      times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12a", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12p"];
      datasets = ["data.tsv", "data2.tsv"];

    var vm._dayLabels = svg.selectAll(".dayLabel")
          .data(days)
          .enter().append("text")
            .text(function (d) { return d; })
            .attr("x", 0)
            .attr("y", function (d, i) { return i * vm._gridSize; })
            .style("text-anchor", "end")
            .attr("transform", "translate(-6," + vm._gridSize / 1.5 + ")")
            .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

    var vm._timeLabels = svg.selectAll(".timeLabel")
        .data(times)
        .enter().append("text")
          .text(function(d) { return d; })
          .attr("x", function(d, i) { return i * vm._gridSize; })
          .attr("y", 0)
          .style("text-anchor", "middle")
          .attr("transform", "translate(" + vm._gridSize / 2 + ", -6)")
          .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });
  }

  //-------------------------------
  //User config functions
  Heatmap.prototype.x = function(col){
    var vm = this;
    vm._config.x = col;
    return vm;
  }

  Heatmap.prototype.y = function(col){
    var vm = this;
    vm._config.y = col;
    return vm;
  }

  Heatmap.prototype.color = function(col){
    var vm = this;
    vm._config.color = col;
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
      var m = {};
      m.x = +d[vm._config.x];
      m.y = +d[vm._config.y];
      m.color = d[vm._config.color];
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
    var xMinMax = d3.extent(vm._data, function(d) { return d.x; }),
        yMinMax=d3.extent(vm._data, function(d) { return d.y; });
    var arrOk = [0,0];

    if(vm._config.fixTo45){
      if(xMinMax[1] > yMinMax[1]){
        arrOk[1] = xMinMax[1];
      }else{
        arrOk[1] = yMinMax[1];
      }

      if(xMinMax[0] < yMinMax[0]){
        //yMinMax = xMinMax;
        arrOk[0] = xMinMax[0];
      }else{
        arrOk[0] = yMinMax[0];
      }

      vm._scales.x.domain(arrOk).nice();
      vm._scales.y.domain(arrOk).nice();

    }else{
      vm._scales.x.domain(xMinMax).nice();
      vm._scales.y.domain(yMinMax).nice();
    }

    return vm;
  };

  Heatmap.prototype.draw = function(){
    var vm = this;

    console.log(vm, vm._scales, vm._scales.y(6.3))

    var circles = vm._chart._svg.selectAll(".dot")
        .data(vm._data)
        //.data(vm._data, function(d){ return d.key})
      .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 5)
        .attr("cx", function(d) { return vm._scales.x(d.x); })
        .attr("cy", function(d) { console.log(d, vm._scales, vm._scales.y(d.y) ); return vm._scales.y(d.y); })
        .style("fill", function(d) { return vm._scales.color(d.color); })
        .on('mouseover', function(d,i){
          if(vm._config.mouseover){
            vm._config.mouseover.call(vm, d,i);
          }
          //vm._chart._tip.show(d, d3.select(this).node());
        })
        .on('mouseout', function(d,i){
          if(vm._config.mouseout){
            vm._config.mouseout.call(this, d,i);
          }
          //vm._chart._tip.hide();
        })
        .on("click", function(d,i){
          if(vm._config.onclick){
            vm._config.onclick.call(this, d, i);
          }
        });

    return vm;
  }

  return new Heatmap(config);
}

