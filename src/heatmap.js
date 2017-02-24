export default function(config) {

  function Heatmap(config){
    var vm = this;
    vm._config = config ? config : {};
    vm._data = [];
    vm._scales ={};
    vm._axes = {};
    //vm._tip = d3.tip().attr('class', 'd3-tip').html(vm._config.data.tip);
    //
    vm._gridSize = Math.floor(vm._config.size.width / 16);
    vm._legendElementWidth = vm._gridSize;
    vm._buckets = 9;
    vm._colors = ['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#253494','#081d58','#031033']
//["#41b6c4","#1d91c0","#225ea8","#253494","#081d58"]; // alternatively colorbrewer.YlGnBu[9]
    //vm._days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    //vm._times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12a", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12p"];
    vm._days = ["12", "13", "14", "15", "16", "17"];
    vm._times = ["12", "13", "14", "15", "16", "17", "18","19","20","21","22","23","24","25","26+"];

    vm._datasets = ["data.tsv", "data2.tsv"];
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
      /*var m = {
        day: +d.day,
        hour: +d.hour,
        value: +d.value
      };*/
      var m = {
        day: d.edad_mujer,
        hour: d.edad_hombre,
        value: +d.tot
      };
      return m;
    });
    console.log(vm._data);
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

    vm._dayLabels = vm._chart._svg.selectAll(".dayLabel")
          .data(vm._days)
          .enter().append("text")
            .text(function (d) { return d; })
            .attr("x", 0)
            .attr("y", function (d, i) { return i * vm._gridSize; })
            .style("text-anchor", "end")
            .attr("transform", "translate(-6," + vm._gridSize / 1.5 + ")")
            .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

    vm._timeLabels = vm._chart._svg.selectAll(".timeLabel")
        .data(vm._times)
        .enter().append("text")
          .text(function(d) { return d; })
          .attr("x", function(d, i) { return i * vm._gridSize; })
          .attr("y", 0)
          .style("text-anchor", "middle")
          .attr("transform", "translate(" + vm._gridSize / 2 + ", -6)")
          .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });


    var colorScale = d3.scaleQuantile()
        .domain([0, d3.max(vm._data, function (d) { return d.value; })])
        .range(vm._colors);

    console.log(colorScale.domain(), colorScale(20))

    var cards = vm._chart._svg.selectAll(".hour")
        .data(vm._data, function(d) {return d.day+':'+d.hour;});

    cards.append("title");

    cards.enter().append("rect")
        .attr("x", function(d) { console.log("times", vm._times.indexOf(d.hour)); return (vm._times.indexOf(d.hour) ) * vm._gridSize; })
        .attr("y", function(d) { console.log("days", vm._days.indexOf(d.day));  return (vm._days.indexOf(d.day)) * vm._gridSize; })
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("class", "hour bordered")
        .attr("width", vm._gridSize)
        .attr("height", vm._gridSize)
        .style("fill", vm._colors[0])
        .transition()
        .duration(3000)
        .ease(d3.easeLinear)
        .style("fill", function(d) { return colorScale(d.value); });

    cards.select("title").text(function(d) { return d.value; });

    cards.exit().remove();

    var legend = vm._chart._svg.selectAll(".legend")
        .data([0].concat(colorScale.quantiles()), function(d) { return d; });

    var lgroup = legend.enter().append("g")
        .attr("class", "legend");

    lgroup.append("rect")
        .attr("x", function(d, i) { console.log( vm._legendElementWidth * i); return vm._legendElementWidth * i; })
        .attr("y", vm._config.size.height - vm._config.size.margin.bottom*2)
        .attr("width", vm._legendElementWidth)
        .attr("height", vm._gridSize / 2)
        .style("fill", function(d, i) { return vm._colors[i]; });

    lgroup.append("text")
        .attr("class", "mono")
        .text(function(d) { return "≥ " + Math.round(d); })
        .attr("x", function(d, i) { return vm._legendElementWidth * i; })
        .attr("y", vm._config.size.height - vm._config.size.margin.bottom*2 + vm._gridSize);

    legend.exit().remove();
    return vm;
  }

  return new Heatmap(config);
}

