(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.dbox = global.dbox || {})));
}(this, function (exports) { 'use strict';

  function carto() {

    function carto(){

    }

    carto.query = function(config, callback){
      //Config the cartdb User
      var sql = new cartodb.SQL({ user: config.cartodb.user });
      //Execute the query
      sql.execute(config.cartodb.sql)
        .done(function(data){

          var result = data.rows;
          //parse the data
          if( config.parser ){
            result = data.rows.map(config.parser)
          }
          //execute the callback with no error
          callback(null, result);
        })
        .error(function(error){
          //Return the error
          callback(error, null);
        })
    }

    return carto;
  }

  function chart(config) {

    function Chart(config){
      var vm = this;
      vm._config = config ? config : {};
      vm._data = [];
      vm._margin = vm._config.size.margin ? vm._config.size.margin : {left: 0, right: 0, top: 0, bottom: 0};

      //Define width and height
      vm._width = vm._config.size.width ? vm._config.size.width - vm._margin.left - vm._margin.right : 800;
      vm._height = vm._config.size.height ? vm._config.size.height - vm._margin.top - vm._margin.bottom : 600;
      vm._svg = '';
      vm._scales ={};
      vm._axes = {};
      //vm._tip = d3.tip().attr('class', 'd3-tip').html(vm._config.data.tip);

      //Public
      vm.layers = [];

    }
    //------------------------
    //User
    Chart.prototype.config = function(config){
      var vm = this;
      vm._config = config;
      return vm;
    }

    Chart.prototype.data = function(data){
      var vm= this;
      vm._config.data = data;
      return vm;
    }

    Chart.prototype.layer = function(_layer, _config){
      var vm = this;
      var layer;
      var config = _config ? _config : vm._config;
      if( _layer === undefined && _layer === null){
        //@Todo Throw Error
      }else{
        layer = _layer(config);
        layer.chart(vm);
        vm.layers.push(layer);
        return layer;
      }
    }

    Chart.prototype.draw =function(){
      var vm     = this, q;
      vm._scales = vm.scales();
      vm._axes   = vm.axes();

      q = vm.loadData();

      q.await(function(error,data){
        if (error) {
          throw error;
          return false;
        }
        vm._data = data;
        vm.drawSVG();
        vm.drawAxes();
        vm.drawGraphs();
      })

    }

    //----------------------
    //Helper functions
    Chart.prototype.scales = function(){
      var vm = this;

      var scales = {};

      //xAxis scale
      if(vm._config.xAxis && vm._config.xAxis.scale){
        switch(vm._config.xAxis.scale){
          case 'linear':
            scales.x = d3.scaleLinear()
                .range([0, vm._width]);
          break;

          case 'time':
            scales.x = d3.scaleTime()
                .range([0, vm._width]);
          break;

          case 'ordinal':
            scales.x = d3.scaleOrdinal()
              .rangeBands([0, vm._width], 0.1)
          break;

              case 'quantile':
                scales.x = d3.scaleOrdinal()
                  .rangeBands([0, vm._width], 0.1)

                scales.q = d3.scaleQuantile()
                  .range(d3.range(vm._config.xAxis.buckets) )
              break;

          default:
            scales.x = d3.scaleLinear()
                .range([0, vm._width]);
          break;
        }
      }else{
        scales.x = d3.scaleLinear()
            .range([0, vm._width]);
      }

      //yAxis scale
      if(vm._config.yAxis && vm._config.yAxis.scale){
        switch(vm._config.yAxis.scale){
          case 'linear':
            scales.y = d3.scaleLinear()
                .range([vm._height, 0]);
          break;

          case 'time':
            scales.y = d3.scaleTime()
                .range([vm._height, 0]);
          break;

          case 'ordinal':
            scales.y = d3.scaleOrdinal()
              .rangeBands([vm._height, 0], 0.1)
          break;

          case 'quantile':
            scales.y = d3.scaleOrdinal()
              .rangeBands([0, vm._width], 0.1)

            scales.q = d3.scaleQuantile()
              .range(d3.range(vm._config.yAxis.buckets) )
          break;

          default:
            scales.y = d3.scaleLinear()
                .range([vm._height, 0]);
          break;
        }
      }else{
        scales.y = d3.scaleLinear()
            .range([vm._height, 0]);
      }


      scales.color = d3.scaleOrdinal(d3.schemeCategory10);

      return scales;
    }

    Chart.prototype.axes = function(){
      var vm = this, axes={};

      axes.x = d3.axisBottom(vm._scales.x);
      axes.y = d3.axisLeft(vm._scales.y);

      if(vm._config.yAxis && vm._config.yAxis.ticks
          && vm._config.yAxis.ticks.enabled === true && vm._config.yAxis.ticks.style ){

        switch(vm._config.yAxis.ticks.style){
          case 'straightLine':
            axes.y
              .tickSize(-vm._width,0);
          break;
        }
      }

      if( vm._config.yAxis && vm._config.yAxis.ticks && vm._config.yAxis.ticks.format){
        axes.y.tickFormat(vm._config.yAxis.ticks.format);
      }
      return axes;
    }

    Chart.prototype.loadData = function(){
      var vm = this;

      if(vm._config.data.tsv){
        var q = d3.queue()
                  .defer(d3.tsv, vm._config.data.tsv);
      }

      if(vm._config.data.json){
        var q = d3.queue()
                  .defer(d3.json, vm._config.data.json);
      }

      if(vm._config.data.csv){
          var q = d3.queue()
                  .defer(d3.csv, vm._config.data.csv);
      }

      if(vm._config.data.raw){
          var q = d3.queue()
                  .defer(vm.mapData, vm._config.data.raw);
      }

      if(vm._config.data.cartodb){
        var q = d3.queue()
              .defer(carto.query,vm._config.data)
      }


      if(vm._config.plotOptions && vm._config.plotOptions.bars
        && vm._config.plotOptions.bars.averageLines && Array.isArray(vm._config.plotOptions.bars.averageLines)
        && vm._config.plotOptions.bars.averageLines.length >0 ){

        vm._config.plotOptions.bars.averageLines.forEach(function(l){
          if(l.data.cartodb){
            q.defer(carto.query, l.data)
          }
        })
      }


      return q;
    }

    Chart.prototype.drawSVG = function(){
      var vm = this;

      //Remove any previous svg
      d3.select(vm._config.bindTo).select('svg').remove();
      d3.select(vm._config.bindTo).html('');

      //Add the css template class
      if(vm._config.template){
        d3.select(vm._config.bindTo).classed(vm._config.template, true)
      }

      //Add title to the chart
      if(vm._config.chart && vm._config.chart.title){
        d3.select(vm._config.bindTo).append("div")
          .attr("class", "chart-title")
          .html(vm._config.chart.title)
      }

      //Add Legend to the chart
      //@TODO - PASS THE STYLES TO DBOX.CSS
      //@TODO - ALLOW DIFFERENT POSSITIONS FOR THE LEGEND
      if(vm._config.legend && vm._config.legend.enable === true && vm._config.legend.position === 'top'){
        var legend = d3.select(vm._config.bindTo).append("div")
          .attr("class", "chart-legend-top");

        var html = '';
        html+="<div style='background-color:#E2E2E1;text-align:center;height: 40px;margin: 0px 15px'>";
        vm._config.legend.categories.forEach(function(c){
          html+="<div class='dbox-legend-category-title' style='margin:0 20px;'><span class='dbox-legend-category-color' style='background-color:"+c.color+";'> </span><span style='height: 10px;float: left;margin: 10px 5px 5px 5px;border-radius: 50%;'>"+c.title+"</span></div>";
        })
        html+="</div>";
        legend.html(html)
      }


      //Create the svg
      vm._svg = d3.select(vm._config.bindTo).append("svg")
        .attr("width", vm._width + vm._margin.left + vm._margin.right)
        .attr("height", vm._height + vm._margin.top + vm._margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vm._margin.left + "," + vm._margin.top + ")");

      //Call the tip function
      if(vm._config.data.tip){
        vm._svg.call(vm._tip);
      }

      //Apply background color
      if(vm._config.chart && vm._config.chart.background && vm._config.chart.background.color){
        d3.select(vm._config.bindTo+" svg").style('background-color', vm._config.chart.background.color )
      }

      var legendBottom = d3.select(vm._config.bindTo).append("div")
          .attr("class", "chart-legend-bottom");
      //Legend for average lines
      /*
      if(vm._config.plotOptions && vm._config.plotOptions.bars
        && vm._config.plotOptions.bars.averageLines && Array.isArray(vm._config.plotOptions.bars.averageLines)
        && vm._config.plotOptions.bars.averageLines.length >0 ){

        d3.select(vm._config.bindTo).append("div")
          .attr("class", "container-average-lines")
          .append('div')
            .attr("class", "legend-average-lines")
          .html('Average Lines Controller')
      }
      */

    }

    Chart.prototype.drawAxes = function(){
      var vm = this;
      var xAxis, yAxis;

      if(!vm._config.xAxis || ( vm._config.xAxis && vm._config.xAxis.enabled !== false ) ){
        xAxis = vm._svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + vm._height + ")")
          .call(vm._axes.x);
      }

      if(!vm._config.yAxis || ( vm._config.yAxis && vm._config.yAxis.enabled !== false ) ){
        yAxis = vm._svg.append("g")
          .attr("class", "y axis")
          .call(vm._axes.y);
      }

      /*xAxis.selectAll('text')
          .on("click",function(d,i){
            vm._config.xAxis.onclick.call(this, d, i);
          });*/


      if(vm._config.xAxis && vm._config.xAxis.text){
        xAxis.append("text")
          .attr("class", "label title")
          .attr("x", vm._chart._width/2)
          .attr("y", 30)
          .style("text-anchor", "middle")
          .text(vm._config.xAxis.text);
      }

      if(vm._config.xAxis && vm._config.xAxis.dropdown && vm._config.xAxis.dropdown.enable === true){
        var xAxisDropDown = d3.select(vm._config.bindTo).append("div").attr('class','dbox-xAxis-select')
                              .append("select")
                              .on("change", function(){
                                vm.updateAxis('x', this.value)
                              });

        xAxisDropDown.selectAll("option")
          .data(vm._config.xAxis.dropdown.options)
          .enter().append("option")
          .attr("value", function (d) { return d.value; })
          .text(function (d) { return d.title; })
          .property("selected", function(d){ return d.selected  })

      }

      if(vm._config.yAxis && vm._config.yAxis.enabled !== false){

        if(vm._config.yAxis && vm._config.yAxis.text){
          yAxis.append("text")
            .attr("class", "label title")
            .attr("transform", "rotate(-90)")
            .attr("y", -30)
            .attr("x", -150)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(vm._config.yAxis.text);
        }
      }

      if(vm._config.yAxis && vm._config.yAxis.dropdown && vm._config.yAxis.dropdown.enable === true){
        var yAxisDropDown = d3.select(vm._config.bindTo).append("div").attr('class','dbox-yAxis-select')
                              .attr('style', function(){
                                var x = -1*d3.select(vm._config.bindTo).node().getBoundingClientRect().width/2+ vm._chart._margin.left/4;
                                var y = -1*d3.select(vm._config.bindTo).node().getBoundingClientRect().height/2;
                                return 'transform: translate('+x+'px,'+y+'px) rotate(-90deg);'
                              })
                              .append("select")
                              .on("change", function(){
                                vm.updateAxis('y', this.value)
                              });

        yAxisDropDown.selectAll("option")
          .data(vm._config.yAxis.dropdown.options)
          .enter().append("option")
          .attr("value", function (d) { return d.value; })
          .text(function (d) { return d.title; })
          .property("selected", function(d){ return d.selected  })

      }

    }

    Chart.prototype.drawGraphs = function(){
      var vm = this;

      vm.layers.forEach(function(gr){
        gr.data(vm._data)
          .scales(vm._scales)
          .axes(vm._axes)
          .domains()
          .draw();
      })
    }

    Chart.prototype.dispatch = d3.dispatch("load", "change");

    Chart.prototype.mapData  =  function (data, callback){
      callback(null, data);
    }

    Chart.prototype.getDomains = function(data){
      var vm = this;

      var domains = {};
      var minMax = [];
        var sorted = '';


        //Default ascending function
        var sortFunctionY = function(a, b) { return d3.ascending(a.y,b.y); };
        var sortFunctionX = function(a, b) { return d3.ascending(a.x,b.x); };


        //if applying sort
        if(vm._config.data.sort && vm._config.data.sort.order){
          switch(vm._config.data.sort.order){
            case 'asc':
              sortFunctionY = function(a, b) { return d3.ascending(a.y,b.y); };
              sortFunctionX = function(a, b) { return d3.ascending(a.x,b.x); };
            break;

            case 'desc':
              sortFunctionY = function(a, b) { return d3.descending(a.y,b.y); };
              sortFunctionX = function(a, b) { return d3.descending(a.x,b.x); };
            break;
          }
        }


      //xAxis
      if(vm._config.xAxis && vm._config.xAxis.scale){
        switch(vm._config.xAxis.scale){
          case 'linear':
            minMax = d3.extent(data, function(d) { return d.x; })
            domains.x = minMax;
          break;

          case 'time':
                minMax = d3.extent(data, function(d) { return d.x; })
                domains.x = minMax;
          break;

          case 'ordinal':

                //If the xAxis' order depends on the yAxis values
                if(vm._config.data.sort && vm._config.data.sort.axis === 'y'){
                  sorted = data.sort(sortFunctionY);
                }else {
                  sorted = data.sort(sortFunctionX);
                }

                domains.x = [];
                sorted.forEach(function(d){
                  domains.x.push(d.x);
                })

          break;

              case 'quantile':

                //The xAxis order depends on the yAxis values
                if(vm._config.data.sort && vm._config.data.sort.axis === 'y'){
                  sorted = data.sort(sortFunctionY);
                }else {
                  sorted = data.sort(sortFunctionX);
                }

                domains.q = [];
                sorted.forEach(function(d){
                  domains.q.push(d.x);
                })

                domains.x = d3.range(vm._config.xAxis.buckets);

              break;


          default:
            minMax = d3.extent(data, function(d) { return d.x; })
            domains.x = minMax;
          break;
        }
      }else{
        minMax = d3.extent(data, function(d) { return d.x; })
        domains.x = minMax;
      }

      //yAxis
      if(vm._config.yAxis && vm._config.yAxis.scale){
        switch(vm._config.yAxis.scale){
          case 'linear':
            minMax = d3.extent(data, function(d) { return d.y; })

            //Adjust for min values greater than zero
            //set the min value to -10%
            if(minMax[0] > 0 ){
              minMax[0] = minMax[0] - (minMax[1]- minMax[0])*.1
            }
            domains.y = minMax;
          break;

          case 'time':
            minMax = d3.extent(data, function(d) { return d.y; })
                  domains.y = minMax;
          break;

          case 'ordinal':
                if(vm._config.data.sort && vm._config.data.sort.axis === 'y'){

                  var sorted = data.sort(function(a, b) { return d3.ascending(a.y,b.y); });
                  domains.y = [];
                  sorted.forEach(function(d){
                    domains.y.push(d.x);
                  })

                }else{
                  domains.y = d3.map(data, function(d) {
                    return d.y;
                  }).keys().sort(function(a, b) { return d3.ascending(a,b); });
                }

          break;

          default:
            minMax = d3.extent(data, function(d) { return d.y; })
            domains.y = minMax;
          break;
        }
      }else{
        minMax = d3.extent(data, function(d) { return d.y; })
        domains.y = minMax;
      }


      return domains;
    }

    Chart.prototype.destroy = function(){
      var vm = this;
      d3.select(vm._config.bindTo).html("");
    }

    return new Chart(config);
  }

  function scatter(config) {

    function Scatter(config){
      var vm = this;
      vm._config = config ? config : {};
      vm._data = [];
      vm._scales ={};
      vm._axes = {};
      //vm._tip = d3.tip().attr('class', 'd3-tip').html(vm._config.data.tip);
    }

    //-------------------------------
    //User config functions
    Scatter.prototype.x = function(col){
      var vm = this;
      vm._config.x = col;
      return vm;
    }

    Scatter.prototype.y = function(col){
      var vm = this;
      vm._config.y = col;
      return vm;
    }

    Scatter.prototype.color = function(col){
      var vm = this;
      vm._config.color = col;
      return vm;
    }

    Scatter.prototype.end = function(){
      var vm = this;
      return vm._chart;
    }

    //-------------------------------
    //Triggered by the chart.js;
    Scatter.prototype.chart = function(chart){
      var vm = this;
      vm._chart = chart;
      return vm;
    }

    Scatter.prototype.data = function(data){
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

    Scatter.prototype.scales = function(s){
      var vm = this;
      vm._scales = s;
      return vm;
    }

    Scatter.prototype.axes = function(a){
      var vm = this;
      vm._axes = a;
      return vm;
    }

    Scatter.prototype.domains = function(){
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

    Scatter.prototype.draw = function(){
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

    return new Scatter(config);
  }

  function timeline(config) {

    var parseDate = d3.timeParse("%Y-%m-%d");

    function Timeline(config){
      var vm = this;
      vm._config = config ? config : {};
      vm._data = [];
      vm._scales ={};
      vm._axes = {};

      vm._line = d3.line()
        .curve(d3.curveBasis)
        .x(function(d) { return vm._scales.x(d.x); })
        .y(function(d) { return vm._scales.y(d.y); });
    }

    //-------------------------------
    //User config functions
    Timeline.prototype.x = function(col){
      var vm = this;
      vm._config.x = col;
      return vm;
    }

    Timeline.prototype.y = function(col){
      var vm = this;
      vm._config.y = col;
      return vm;
    }

    Timeline.prototype.series = function(arr){
      var vm = this;
      vm._config.series = arr;
      return vm;
    }

    Timeline.prototype.color = function(col){
      var vm = this;
      vm._config.color = col;
      return vm;
    }

    Timeline.prototype.end = function(){
      var vm = this;
      return vm._chart;
    }

    //-------------------------------
    //Triggered by the chart.js;
    Timeline.prototype.chart = function(chart){
      var vm = this;
      vm._chart = chart;
      return vm;
    }


    Timeline.prototype.data = function(data){
      var vm = this;

      vm._data = data.map(function(d){
        d.x = parseDate(d[vm._config.x]);
        d.color = d[vm._config.color];
        delete(d[vm._config.x]);
        return d;
      });

      vm._lines = vm._config.y ? vm._config.y : vm._config.series;

      vm._lines = vm._lines.map(function(name) {
        return {
          name: name,
          values: data.map(function(d) {
            return {x: d.x, y: +d[name]};
          })
        };
      });

      return vm;
    }

    Timeline.prototype.scales = function(s){
      var vm = this;
      vm._scales = s;
      return vm;
    }

    Timeline.prototype.axes = function(a){
      var vm = this;
      vm._axes = a;
      return vm;
    }

    Timeline.prototype.domains = function(){
      var vm = this;
      var xMinMax = d3.extent(vm._data, function(d) { return d.x; });

      var yMinMax = [
        d3.min(vm._lines, function(c) { return d3.min(c.values, function(v) { return v.y; }); }),
        d3.max(vm._lines, function(c) { return d3.max(c.values, function(v) { return v.y; }); })
      ];

      vm._scales.x.domain(xMinMax).nice();
      vm._scales.y.domain(yMinMax).nice();

      return vm;
    };

    Timeline.prototype.draw = function(){
      var vm = this;

      var lines = vm._chart._svg.selectAll(".lines")
        .data(vm._lines)
      .enter().append("g")
        .attr("class", "lines");

      var path = vm._chart._svg.selectAll(".lines").append("path")
        .attr("class", "line")
        .attr("d", function(d) {
          console.log(d);
          console.log(vm._line(d.values));
          return vm._line(d.values);
        })
        .style("stroke", function(d){
          if (d.name == "Airbus"){
            return "rgb(000,255,000)";
          }else {
            return "#000";
          }
        });


      path.each(function(d) { d.totalLength = this.getTotalLength(); })
        .attr("stroke-dasharray", function(d) { return d.totalLength + " " + d.totalLength; })
        .attr("stroke-dashoffset", function(d) { return d.totalLength; })
        .transition()
          .duration(5000)
          .ease(d3.easeLinear)
          .attr("stroke-dashoffset", 0);

      return vm;
    }

    return new Timeline(config);
  }


  /*import chart from './chart.js';

  function Timeline(config) {
    var vm = this;
    vm._config = config;
    vm._chart;
    vm._scales = {};
    vm._axes = {};
  }

  Timeline.prototype = timeline.prototype = {
  	generate:function(){
  		var vm = this, q;

  		vm.draw();
      vm.setScales();
  		vm.setAxes();

  		q = vm._chart.loadData();

      q.await(function(error,data){
        if (error) {
          //console.log(error)
          throw error;
          return false;
        }

        vm.setData(data);
        vm.setDomains();
        vm.drawAxes();
        console.log("generate", vm._data);
        vm.drawData();
      })

  	},
  	draw : function(){
  		var vm = this
  		vm._chart = chart(vm._config);
  	},
  	setScales: function(){
  		var vm = this;

  		vm._scales.x = d3.scaleTime()
  		  .range([0, vm._chart._width]);

  		vm._scales.y = d3.scaleLinear()
  		  .range([vm._chart._height, 0]);

      vm._scales.color = d3.scaleOrdinal(d3.schemeCategory20c);
  	},
  	setAxes : function(){
  		var vm = this;

  		vm._axes.x = d3.svg.axis()
  		  .scale(vm._scales.x)
  		  .orient("bottom");

  		vm._axes.y = d3.svg.axis()
  		  .scale(vm._scales.y)
  		  .orient("left");


      if(vm._config.yAxis && vm._config.yAxis.ticks
          && vm._config.yAxis.ticks.enabled === true && vm._config.yAxis.ticks.style ){

        switch(vm._config.yAxis.ticks.style){
          case 'straightLine':
            vm._axes.y
              .tickSize(-vm._chart._width,0);
          break;
        }

      }

      if( vm._config.yAxis.ticks.format){
        console.log('Set tick format');
        vm._axes.y.tickFormat(vm._config.yAxis.ticks.format);
      }
  	},
  	setData:function(data){
      var vm = this;
      var keys = d3.keys(data[0]).filter(function(key) { return key !== "date"; });

      var series = keys.map(function(name) {
        return {
          name: name,
          values: data.map(function(d) {
            return {x: d.date, y: +d[name]};
          })
        };
      });

      vm._data = series;
    },
    setDomains:function(){
      var vm = this;

      vm._scales.color.domain(vm._data.map(function(serie){
        return serie.name;
      }));

      vm._scales.x.domain([
        d3.min(vm._data, function(c) { return d3.min(c.values, function(v) { return v.x; }); }),
        d3.max(vm._data, function(c) { return d3.max(c.values, function(v) { return v.x; }); })
      ]);

      vm._scales.y.domain([
        d3.min(vm._data, function(c) { return d3.min(c.values, function(v) { return v.y; }); }),
        d3.max(vm._data, function(c) { return d3.max(c.values, function(v) { return v.y; }); })
      ]);
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
          .text("");

      var yAxis = vm._chart._svg.append("g")
          .attr("class", "y axis")
          .call(vm._axes.y)


      if(vm._config.yAxis && vm._config.yAxis.text){
        yAxis.append("text")
          .attr("class", "label")
          .attr("transform", "rotate(-90)")
          .attr("x", -vm._chart._height/2)
          .attr("y", -vm._config.size.margin.left + 10)
          .attr("dy", ".71em")
          .style("text-anchor", "middle")
          .style("font-size","14px")
          .text(vm._config.yAxis.text);
      }

    },
    drawData : function(){
      var vm = this;
      var line = d3.svg.line()
          .interpolate(vm._config.data.interpolation)
          .defined(function(d) { return d; })
          .x(function(d) { return vm._scales.x(d.x); })
          .y(function(d) { return vm._scales.y(d.y); });

      var series = vm._chart._svg.selectAll(".series")
          .data(vm._data)
        .enter().append("g")
          .attr("class", "series")

      series.append("path")
          .attr("class", "line")
          .attr("d", function(d) { return line(d.values); })
          .style("stroke-dasharray",function(d){ if(d.name == "Nacional"){
              return ("10,5");
            }})
          .style("stroke", function(d) {
            if(d.color){ return d.color; }
            else { return vm._scales.color(d.key); }
          }) //return vm._scales.color(d.name); })
          .style("stroke-width", 3);


      series.selectAll('.dot')
          .data(function(d){return d.values})
        .enter().append("circle")
          .attr("class", "dot")
          .attr("r", 3)
          .attr("cx", function(d) { return vm._scales.x(d.x); })
          .attr("cy", function(d) { return vm._scales.y(d.y); })
          .style("fill", function(d) {
            if(d.color){ return d.color; }
            else { return vm._scales.color(d.key); }
          })//return vm._scales.color(d.name); })
          .style("stroke", function(d) {
            if(d.color){ return d.color; }
            else { return vm._scales.color(d.key); }
          }) // return vm._scales.color(d.name); })
          .on('mouseover', function(d,i){
            if(vm._config.data.mouseover){
              vm._config.data.mouseover.call(vm, d,i)
            }
            vm._chart._tip.show(d, d3.select(this).node())
          })
          .on('mouseout',function(d,i){
            if(vm._config.data.mouseout){
              vm._config.data.mouseout.call(vm, d,i)
            }
            vm._chart._tip.hide(d, d3.select(this).node())
          });

          //series.selectAll('.dot-inside')
          //  .data(function(d){return d.values})
          //.enter().append("circle")
          //  .attr("class", "dot-inside")
          //  .attr("r", 4)
          //  .attr("cx", function(d) { return vm._scales.x(d.x); })
          //  .attr("cy", function(d) { return vm._scales.y(d.y); })
          //  .style("fill", 'black')//return vm._scales.color(d.name); })
          //  .style("stroke", function(d) { return d.color;}) // return vm._scales.color(d.name); })
          //  .on('mouseover', function(d,i){
          //    if(vm._config.data.mouseover){
          //      vm._config.data.mouseover.call(vm, d,i)
          //    }
          //    vm._chart._tip.show(d, d3.select(this).node())
          //  })
          //  .on('mouseout',function(d,i){
          //    if(vm._config.data.mouseout){
          //      vm._config.data.mouseout.call(vm, d,i)
          //    }
          //    vm._chart._tip.hide(d, d3.select(this).node())
          //  });


      //series.append("text")
      //    .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
      //    .attr("transform", function(d) { return "translate(" + vm._scales.x(d.value.x) + "," + vm._scales.y(d.value.y) + ")"; })
      //    .attr("x", 3)
      //    .attr("dy", ".35em")
      //    .text(function(d) { return d.name; });
    }


  }

  export default function timeline(config) {
    return new Timeline(arguments.length ? config : null);
  }*/

  function heatmap(config) {

    function Heatmap(config){
      var vm = this;
      vm._config = config ? config : {};
      vm._data = [];
      vm._scales ={};
      vm._axes = {};
      //vm._tip = d3.tip().attr('class', 'd3-tip').html(vm._config.data.tip);
      //
      vm._gridSize = Math.floor(vm._config.size.width / 24);
      vm._legendElementWidth = vm._gridSize*2;
      vm._buckets = 9;
      vm._colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"]; // alternatively colorbrewer.YlGnBu[9]
      vm._days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
      vm._times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12a", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12p"];
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
        var m = {
          day: +d.day,
          hour: +d.hour,
          value: +d.value
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
          .domain([0, vm._buckets - 1, d3.max(vm._data, function (d) { return d.value; })])
          .range(vm._colors);

      console.log(colorScale.domain(), colorScale(20))

      var cards = vm._chart._svg.selectAll(".hour")
          .data(vm._data, function(d) {return d.day+':'+d.hour;});

      cards.append("title");

      cards.enter().append("rect")
          .attr("x", function(d) { return (d.hour - 1) * vm._gridSize; })
          .attr("y", function(d) { return (d.day - 1) * vm._gridSize; })
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

  function treemap(config) {
    function Treemap(config) {
      var vm = this;
      vm._config = config ? config : {};
      vm._config._padding = 4;
      vm._config._colorScale = d3.scale.category20c();
      vm._data = [];
      vm._scales = {};
      vm._axes = {};
    }

    //-------------------------------
    //User config functions
    Treemap.prototype.end = function(){
      var vm = this;
      return vm._chart;
    }

    Treemap.prototype.size = function(col){
      var vm = this;
      vm._config._size = col;
      return vm;
    }

    Treemap.prototype.colorScale = function(colorScale){
      var vm = this;
      vm._config._colorScale = colorScale;
      return vm;
    }

    Treemap.prototype.padding = function(padding){
      var vm = this;
      vm._config._padding = padding;
      return vm;
    }

    Treemap.prototype.nestBy = function(key) {
      var vm = this;
      vm._config._key = key;
      return vm;
    }

    //-------------------------------
    //Triggered by the chart.js;
    Treemap.prototype.chart = function(chart){
      var vm = this;
      vm._chart = chart;
      return vm;
    }

    Treemap.prototype.isValidStructure = function(datum){
      var vm = this;
      return ((typeof datum.name === 'string' || datum.name instanceof String) && Array.isArray(datum.children) || (typeof datum.name === 'string' || datum.name instanceof String) && Number(datum[vm._config._size]) == datum[vm._config._size]);
    }

    Treemap.prototype.formatNestedData = function(data){
      var vm = this;
      if(data.key) {
        data.name = data.key;
        delete data.key;
      } else if(vm._config._key) {
        data.name = data[vm._config._key];
      }
      if(Array.isArray(data.values)) {
        var children = [];
        data.values.forEach(function(v){
          children.push(vm.formatNestedData(v))
        });
        data.children = children;
        delete data.values;
      }
      return data;
    }

    Treemap.prototype.data = function(data){
      var vm = this;
      // TODO validate structure like [{name: '', children: [{},{}]}]
      if(data){
        if(Array.isArray(data) && data.length > 0) {
          if(!vm.isValidStructure(data[0])) {
            data.forEach(function(d){
              d[vm._config._size] = +d[vm._config._size];
            });
            try {
              if(!vm._config._key)
                throw "nestBy() in layer was not configured"
              data = [vm.formatNestedData(d3.nest()
                  .key(function(d){ return d[vm._config._key]; })
                  .entries(data)[0])];
            } catch(err){
              console.error(err);
            }
          }
        } else {
          if(!vm.isValidStructure(data)) {
            try {
              if(!data.key)
                throw "Property 'key' not found";
              if(data[vm._config._size] !== Number(data[vm._config._size]))
                throw  "Value used for treemap rect size is not a number";
              data = [vm.formatNestedData(data)];
            } catch(err){
              console.error(err);
            }
          }
        }
      }
      vm._data = data;
      return vm;
    }

    Treemap.prototype.draw = function(){
      var vm = this;
      var treemap = d3.layout.treemap()
        .padding(vm._config._padding)
        .size([vm._chart._width, vm._chart._height])
        .value(function(d) { return d[vm._config._size]; });

      var cell = vm._chart._svg.data(vm._config._data).selectAll("g")
          .data(treemap.nodes)
        .enter().append("g")
          .attr("class", "cell")
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

      cell.append("rect")
          .attr("width", function(d) { return d.dx; })
          .attr("height", function(d) { return d.dy; })
          .style("fill", function(d) { return d.children ? vm._config._colorScale(d.name) : null; });

      cell.append("text")
          .attr("x", function(d) { return d.dx / 2; })
          .attr("y", function(d) { return d.dy / 2; })
          .attr("dy", ".35em")
          .attr("text-anchor", "middle")
          .text(function(d) { return d.children ? null : d.name; });

      return vm;
    }

    return new Treemap(config);
  }

  function mexicoMapRounded(config) {

    /*mapConfig
      target: 'ID string'
      zoom:{
        available: bool,
        zoomRange: array of two numbers
      }

      circlesConfig
      minPadding: number
      radius: number
      style:{
        fill: string
        strokeColor: string
        strokeWidth: number
      }


      tipConfig
      classes: string
      content: html

      callbackConfig
      click
      over
      out

    */
    var dataStateLength;

    function MexicoMapRounded(mapConfig,circlesConfig,tipConfig,callbackConfig){

      this._mapConfig = mapConfig;
      this._circlesConfig = circlesConfig;

      this._tipConfig = (tipConfig) ? tipConfig : {};

      if(callbackConfig){
        this._callbackClick =   callbackConfig.click ? callbackConfig.click : null;
        this._callbackOver =   callbackConfig.over ? callbackConfig.over : null;
        this._callbackOut =   callbackConfig.out ? callbackConfig.over : null;
      }

      this._mapLayer = d3.select("#map-wrapper");
      this._tip = d3.tip();

      if(tipConfig){
        this._tip.attr('class', 'd3-tip ' + tipConfig.classes).html(tipConfig.html);
      }else{
        this._tip.attr('class', 'd3-tip').html("<span>I'm a Tip</span>");
      }

      this._zoom = d3.zoom().scaleExtent([1, 5]).on("zoom", this.zoomed);

    }

    MexicoMapRounded.prototype.zoomed = function(){
      this._tip.hide();
      this._mapLayer.attr("transform", d3.event.transform);
    }

    MexicoMapRounded.prototype.drawMap = function(data) {

      this._mapLayer.call(this._zoom).call(tip);

      this._data = d3.nest()
                      .key(function(d) { return d.inegi; })
                      .entries(data);

      this._data.forEach(function(obj,idx){
        dataStateLength = obj.values.length;
        obj.values.forEach(this.drawCircle);
      });

    };


    MexicoMapRounded.prototype.drawCircle = function(item,index){

      var bbox,center;

      var max,min = (this._circlesConfig.minPadding) ? this._circlesConfig.minPadding : 5;
      var paddingX, paddingY,centerX,centerY;

      bbox = d3.select("#est_"+item.inegi).node().getBBox();

      max = bbox.width;

      paddingX = (dataStateLength > 1) ? Math.floor(Math.random()*(max-min+1) + min)/4 : 0;

      max = bbox.height;

      paddingY = (dataStateLength > 1) ? Math.floor(Math.random()*(max-min+1) + min)/4 : 0;

      centerY = (bbox.y + bbox.height/2);
      centerX = (bbox.x + bbox.width/2);

      var self = this;

      mapLayer.append("circle")
        .attr("cx",centerX + paddingX)
        .attr("cy",centerY + paddingY)
        .attr("r",(this._circlesConfig.radius) ? this._circlesConfig.radius : 2.5)
        .style("fill","red")
        .style('stroke', "white")
        .style('stroke-width','1px')
        .on('click',function(){
          console.log(this,self);
          self.triggerClick();
        })
        .on('mouseover',function(){
          self.triggerOver(item);
        })
        .on('mouseout',function(){
          self.triggerOut(item);
        });
    }

    MexicoMapRounded.prototype.triggerClick = function(item){
      console.log("click",item);
      if(this._callbackClick){
        this._callbackClick(item);
      }
    }

    MexicoMapRounded.prototype.triggerOver = function(item){
      this._tip.show(item);
      if(this._callbackOver){
        this._callbackOver(item);
      }
    }

    MexicoMapRounded.prototype.triggerOut = function(item){
      this._tip.hide();
      if(this._callbackOut){
        this._callbackOut(item);
      }
    }

    MexicoMapRounded.prototype.setTipHtml = function(content){
      this._tip.html(content);
    }

    return MexicoMapRounded;

  }

  exports.chart = chart;
  exports.scatter = scatter;
  exports.timeline = timeline;
  exports.heatmap = heatmap;
  exports.treemap = treemap;
  exports.mexicoMapRounded = mexicoMapRounded;

  Object.defineProperty(exports, '__esModule', { value: true });

}));