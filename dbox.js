(function (window) {
    'use strict';

    //d3 library
    var d3 = window.d3 ? window.d3 : typeof require !== 'undefined' ? require("d3") : undefined;

    //Exposed and internal prototypes
    var chart = Chart.prototype;
    var internal = ChartInternal.prototype;

    /**----------------------------------------------------------------------
     * Main Object
    **/
    var dbox = { version: "0.1" };

    dbox.chart = function (config) {
      return new Chart(config);
    };


    /**----------------------------------------------------------------------
    * Constructors
    **/
    function Chart(config) {
      var vm = this;

      vm.config = config;

      vm.internal = new ChartInternal(vm);
      vm.internal.draw(config);
    }

    function ChartInternal(api){
      var vm = this;
      vm.api = api;
    }

    /**----------------------------------------------------------------------
    * Exposed Functions added to Chart.prototype
    **/
    chart.update = function(data){

    }

    /**----------------------------------------------------------------------
    * Internal Functions added to ChartInternal.prototype;
    **/
    internal.draw = function(config){
      var vm = this, q;

      vm.drawSVG(config);
      vm.setScales(config);

      q = vm.loadData(config.data);

      q.await(function(error,data){
        if (error) throw error;

        vm.setData.call(vm,data);
        vm.setDomains.call(vm);
        vm.drawAxes.call(vm);
        vm.drawData.call(vm);
      })
    }

    internal.drawSVG = function(config){
      var vm = this;

      vm.margin = {top: 20, right: 20, bottom: 30, left: 40},
      vm.width = config.size.width - vm.margin.left - vm.margin.right,
      vm.height = config.size.height - vm.margin.top - vm.margin.bottom;

      vm.svg = d3.select(config.bindTo).append("svg")
        .attr("width", vm.width + vm.margin.left + vm.margin.right)
        .attr("height", vm.height + vm.margin.top + vm.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + vm.margin.left + "," + vm.margin.top + ")");
    }

    internal.setScales = function(config){
      var vm = this;

      vm.x = d3.scale.linear()
          .range([0, vm.width]);

      vm.y = d3.scale.linear()
          .range([vm.height, 0]);

      vm.color = d3.scale.category10();

      vm.xAxis = d3.svg.axis()
          .scale(vm.x)
          .orient("bottom");

      vm.yAxis = d3.svg.axis()
          .scale(vm.y)
          .orient("left");
    }

    internal.loadData = function(data){
      if(data.url){
        var q = d3.queue()
                  .defer(d3.tsv,data.url);
        return q;
      }
    }

    internal.setData = function(data){
      var vm = this;

      data.forEach(vm.api.config.data.parser);

      vm.data = data;
    }

    internal.setDomains = function(){
      var vm = this;

      vm.x.domain(d3.extent(vm.data, function(d) { return d.sepalWidth; })).nice();
      vm.y.domain(d3.extent(vm.data, function(d) { return d.sepalLength; })).nice();

    }

    internal.drawAxes = function(){
      var vm = this;

      vm.svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + vm.height + ")")
          .call(vm.xAxis)
        .append("text")
          .attr("class", "label")
          .attr("x", vm.width)
          .attr("y", -6)
          .style("text-anchor", "end")
          .text("Sepal Width (cm)");

      vm.svg.append("g")
          .attr("class", "y axis")
          .call(vm.yAxis)
        .append("text")
          .attr("class", "label")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("Sepal Length (cm)")
    }

    internal.drawData = function(){
      var vm = this;

      vm.svg.selectAll(".dot")
        .data(vm.data)
      .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", function(d) { return vm.x(d.sepalWidth); })
        .attr("cy", function(d) { return vm.y(d.sepalLength); })
        .style("fill", function(d) { return vm.color(d.species); })
        .on('mouseover', function(d,i){
          vm.api.config.data.mouseover.call(vm.api, d,i);
        });
    }



    internal.scatter = function(config){

    }




    /**----------------------------------------------------------------------
    * Object declaration in window
    **/
    if (typeof define === 'function' && define.amd) {
        define("dbox", ["d3"], function () { return dbox; });
    } else if ('undefined' !== typeof exports && 'undefined' !== typeof module) {
        module.exports = dbox;
    } else {
        window.dbox = dbox;
    }

})(window);


