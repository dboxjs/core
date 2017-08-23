/*
 * Dbox Chart core
 */

import carto from '../carto/carto.js';

export default function(config) {

  function Chart(config){
    var vm = this;
    var defaultConfig = {size: {width: 800, height: 600, margin: {left: 0, right: 0, top: 0, bottom: 0}}};
    vm._config = config ? _.cloneDeep(config) : defaultConfig;
    vm._data = [];
    vm._margin = vm._config.size.margin;

    //Define width and height
    vm._width = vm._config.size.width - vm._margin.left - vm._margin.right;
    vm._height = vm._config.size.height - vm._margin.top - vm._margin.bottom;
    vm._svg = '';
    vm._scales ={};
    vm._axes = {};

    //Public
    vm.layers = [];

  }
  //------------------------
  //User
  Chart.prototype.config = function(config){
    var vm = this;
    vm._config = _.cloneDeep(config);
    return vm;
  };

  Chart.prototype.size = function(sizeObj) {
    var vm = this;
    if (sizeObj) {
      if(sizeObj.margin) {
        if(sizeObj.margin.left == Number(sizeObj.margin.left)) {
          vm._config.size.margin.left = sizeObj.margin.left;
          vm._margin.left = sizeObj.margin.left;
        }
        if(sizeObj.margin.right == Number(sizeObj.margin.right)) {
          vm._config.size.margin.right = sizeObj.margin.right;
          vm._margin.right = sizeObj.margin.right;
        }
        if(sizeObj.margin.top == Number(sizeObj.margin.top)) {
          vm._config.size.margin.top = sizeObj.margin.top;
          vm._margin.top = sizeObj.margin.top;
        }
        if(sizeObj.margin.bottom == Number(sizeObj.margin.bottom)) {
          vm._config.size.margin.bottom = sizeObj.margin.bottom;
          vm._margin.bottom = sizeObj.margin.bottom;
        }
      }
      if(sizeObj.width == Number(sizeObj.width)) {
        vm._config.size.width = sizeObj.width;
        vm._width = sizeObj.width;
      }
      if(sizeObj.height == Number(sizeObj.height)) {
        vm._config.size.height = sizeObj.height;
        vm._height = sizeObj.height;
      }
    }
    return vm;
  };

  Chart.prototype.grid = function(bool) {
    var vm = this;
    vm._config.grid = bool ? true : false;
    return vm;
  };

  Chart.prototype.bindTo = function(selector) {
    var vm = this;
    vm._config.bindTo = selector;
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

  Chart.prototype.getLayer = function(layerIndex){
    var vm = this;
    return vm.layers[layerIndex];
  }

  Chart.prototype.draw =function(){
    var vm     = this, q;
    vm._scales = vm.scales();
    vm._axes   = vm.axes();



    q = vm.loadData();

    q.await(function(error,data){
      if (error)
        throw error;

      vm._data = data;
      vm.drawSVG();
      
      vm.drawGraphs();
      vm.drawAxes();

      //Trigger load chart event
      if( vm._config.events && vm._config.events.load){
        vm.dispatch.on("load.chart", vm._config.events.load(vm));
      }

    })
    return vm;
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
            .range([0, vm._width], 0.1)
        break;

        case 'band':
          scales.x = d3.scaleBand()
            .rangeRound([0, vm._width])
            .padding(0.1)
        break;

            case 'quantile':
              scales.x = d3.scaleOrdinal()
                .range([0, vm._width], 0.1)

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
            .range([vm._height, 0], 0.1)
        break;

        case 'band':
          scales.y = d3.scaleBand()
            .rangeRound([vm._height, 0])
            .padding(0.1)
        break;

        case 'quantile':
          scales.y = d3.scaleOrdinal()
            .range([0, vm._width], 0.1)

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

  Chart.prototype.generateScale = function(data, config){
    var vm = this;
    var scale = {};
    if(!config.range) {
      throw 'Range is not defined';
    }

    var domains = d3.extent(data, function(d){ return +d[config.column]});
    if(config.minZero){
      domains = [0, d3.max(data, function(d){ return +d[config.column]})];
    }
    if(config.type){
      switch(config.type){
        case 'linear':
          scale = d3.scaleLinear()
            .rangeRound(config.range)
            .domain(domains);
        break;

        case 'time':
          scale = d3.scaleTime()
            .range(config.range)
            .domain(domains);
        break;

        case 'ordinal':
          scale = d3.scaleBand()
            .rangeRound(config.range)
            .padding(0.1)
            .domain(data.map(function(d){ return d[config.column]}));
        break;

        case 'quantile':
          scale = d3.scaleBand()
            .rangeRound(config.range)
            .padding(0.1)
            .domain(data.map(function(d){ return d[config.column]}));
          if(!config.bins)
            config.bins = 10;
          scale = d3.scaleQuantile()
            .range(d3.range(config.bins))
        break;

        default:
          scale = d3.scaleLinear()
            .rangeRound(config.range)
            .domain(domains);
        break;
      }
    }else{
      scale = d3.scaleLinear()
            .rangeRound(config.range)
            .domain(domains);
    }

    return scale;
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
    var q;

    if(vm._config.data.tsv){
      q = d3.queue()
            .defer(d3.tsv, vm._config.data.tsv);
    }

    if(vm._config.data.json){
      q = d3.queue()
            .defer(d3.json, vm._config.data.json);
    }

    if(vm._config.data.csv){
      q = d3.queue()
            .defer(d3.csv, vm._config.data.csv);
    }

    if(vm._config.data.raw){
      q = d3.queue()
            .defer(vm.mapData, vm._config.data.raw);
    }

    if(vm._config.data.cartodb){
      q = d3.queue()
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
      .style("font-size", vm._config.chart ? vm._config.chart['font-size'] ? vm._config.chart['font-size'] : '12px' : '12px'  )
      .attr("width", vm._width + vm._margin.left + vm._margin.right)
      .attr("height", vm._height + vm._margin.top + vm._margin.bottom)
      .append("g")
      .attr("transform", "translate(" + vm._margin.left + "," + vm._margin.top + ")")
      

    //Call the tip function
    /*if(vm._config.data.tip){
      vm._svg.call(vm._tip);
    }*/

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

  Chart.prototype.drawGrid = function() {
    var vm = this;
    return vm;
  };

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
        .attr("x", vm._width/2)
        .attr("y",  vm._config.xAxis.y ? vm._config.xAxis.y : 30)
        .style("text-anchor", "middle")
        .style("fill", vm._config.xAxis.fill ? vm._config.xAxis.fill : 'black' )
        .style("font-size", vm._config.xAxis['font-size'] ? vm._config.xAxis['font-size'] : '12px' )
        .style("font-weight", vm._config.xAxis['font-weight'] ? vm._config.xAxis['font-weight'] : '600' )
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
          .attr("y", vm._config.yAxis.y ? vm._config.yAxis.y : -50)
          .attr("x", -150)
          .attr("dy", ".71em")
          .style("text-anchor", "middle")
          .style("fill", vm._config.yAxis.fill ? vm._config.yAxis.fill : 'black' )
          .style("font-size", vm._config.yAxis['font-size'] ? vm._config.yAxis['font-size'] : '12px' )
          .style("font-weight", vm._config.xAxis['font-weight'] ? vm._config.xAxis['font-weight'] : '600' )
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

      //@TODO validate domains from multiple layers
      vm._scales = gr._scales;
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
