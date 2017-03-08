/*eslint-disable*/
import chart from './chart.js';
import columns from './bars/columns.js';
import lineAndCircles from './bars/lineAndCircles.js';
import quantilesAndCircles from './bars/quantilesAndCircles.js';
import averageLines from './bars/utils/averageLines.js';

function Bars(config) {
  var vm = this;
  vm._config = config;
  vm._chart;
  vm._scales = {};
  vm._axes = {};
  vm._stats = {};
  vm._averageLines = [];
  vm.columns = null;
  vm.lineAndCircles = null;
  vm.quantilesAndCircles = null;
}

Bars.prototype = bars.prototype = {
	generate:function(){
		var vm = this, q, averageLines;

		vm.init();
		vm.setScales();


		q = vm._chart.loadData();

    q.awaitAll(function(error,data){
      if (error) {
        throw error;
        return false;
      }
      vm.setStats(data);
      vm.setAxes(data);
      vm.setData(data);
      vm.setDomains();
      vm._setChartType();
      vm.drawAxes();
      vm.drawData();
      vm.drawLegends();

      //Trigger load chart event
      if( vm._config.events && vm._config.events.load){
        vm._chart.dispatch.on("load.chart", vm._config.events.load(vm));
      }

    });

	},
	init : function(){
		var vm = this
		vm._chart = chart(vm._config);
	},
	setScales: function(){
		var vm = this;
    vm._scales = vm._chart.setScales();
	},
  setStats: function(data){

    var vm = this;

    if(Array.isArray(data)){
      vm._stats.x = {};
      vm._stats.x.minMax = d3.extent(data[0], function(d){return d.x});
    }

    console.log('setStats', vm._stats, data)
  },
	setAxes : function(data){
		var vm = this;

		vm._axes.x = d3.svg.axis()
		  .scale(vm._scales.x)
		  .orient("bottom");

    //
		vm._axes.y = d3.svg.axis()
		  .scale(vm._scales.y)
		  .orient("left")

    //Config the style of the ticks
    if(vm._config.yAxis && vm._config.yAxis.ticks
        && vm._config.yAxis.ticks.enabled === true && vm._config.yAxis.ticks.style ){

      switch(vm._config.yAxis.ticks.style){
        //Use a straight line accross the whole width of the chart
        case 'straightLine':
          vm._axes.y
            .tickSize(-vm._chart._width,0);
        break;
      }
    }
	},
	setData:function(data){
    var vm = this;

    if(Array.isArray(data)){

      vm._data = data[0];

      if(data.length > 1){
        data.forEach(function(d,i){
          if(i>0) {
            if(vm._config.plotOptions.bars.averageLines[i-1].data.cartodb){
              vm._config.plotOptions.bars.averageLines[i-1].data.raw = d[0].avg;
            }
          }
        });
      }
    }
  },
  setDomains:function(){
    var vm = this;

    var domains = vm._chart.getDomains(vm._data);

    vm._scales.x.domain(domains.x);
    vm._scales.y.domain(domains.y);

    //Quantile scale
    if(vm._scales.q){
      vm._scales.q.domain(domains.q);
    }

  },
  _setChartType:function(){
    var vm = this;

    var params ={
      "config"  : vm._config,
      "chart"   : vm._chart,
      "data"    : vm._data,
      "scales"  : vm._scales,
    }

    if(vm._config.style){
      switch(vm._config.style){
        case 'lineAndCircles':
          vm.lineAndCircles = lineAndCircles(params);
        break;
        case 'columns':
          vm.columns = columns(params);
        break;
        case 'quantilesAndCircles':
          vm.quantilesAndCircles = quantilesAndCircles(params);
        break;
      }
    }

    //Set averageLines
    vm.averageLines = averageLines(params);

  },
  drawAxes:function(){
    var vm = this;

    var xAxis = vm._chart._svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + vm._chart._height + ")")
        .call(vm._axes.x);

    //Rotation
    xAxis.selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "0em")
        .attr("dy", "0em")
        .attr("transform", function(d) {
          return "translate(0,8)rotate(-65)"
        });

    if(vm._config.style){
      switch(vm._config.style){
        case 'quantilesAndCircles':
          vm.quantilesAndCircles.renameAxis(xAxis);
        break
      }
    }

    if(vm._config.xAxis && vm._config.xAxis.text){
      xAxis.append("text")
        .attr("class", "label")
        .attr("x", vm._chart._width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(vm._config.xAxis.text);
    }

    var yAxis = vm._chart._svg.append("g")
        .attr("class", "y axis")
        .call(vm._axes.y);

    if(vm._config.yAxis && vm._config.yAxis.text){
      yAxis.append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(vm._config.yAxis.text);
    }
  },
  drawData : function(){
    var vm = this;

    if(vm._config.style){
      switch(vm._config.style){
        case 'lineAndCircles':
          vm.lineAndCircles.draw();
        break;
        case 'columns':
          vm.columns.draw();
        break
        case 'quantilesAndCircles':
          vm.quantilesAndCircles.draw();
        break
        default:
          vm.columns.draw();
        break;
      }
    }
    vm.averageLines.draw();
  },
  set: function(option,value){
    var vm = this;
    if(option === 'config') {
      vm._config = value;
    }else{
      vm._config[option] = value ;
    }
  },
  select:function(selector){
    var vm = this;
    var select = false;
    if(vm._config.style){
      switch(vm._config.style){
        case 'lineAndCircles':
          select = vm.lineAndCircles.select(selector);
        break;
        case 'columns':
          select = vm.columns.select(selector);
        break
        case 'quantilesAndCircles':
          select = vm.quantilesAndCircles.select(selector);
        break
        default:
          select = vm.columns.select(selector);
        break;
      }
    }

    return select;
  },
  triggerMouseOver:function(selector){
    var vm = this;

    vm._chart._svg.selectAll('circle')
      .each(function(d){
        if(d.x === selector || d.y === selector){
          vm._chart._tip.show(d,d3.select(this).node())
        }
      })
  },
  triggerMouseOut:function(selector){
    var vm = this;
    vm._chart._svg.selectAll('circle')
      .each(function(d){
        if(d.x === selector || d.y === selector){
          vm._chart._tip.hide(d,d3.select(this).node())
        }
      })
  },
  redraw: function(){
    var vm = this;
    vm._chart.destroy();
    vm.generate();
  },
  drawLegends: function(){
    var vm = this;
    if(vm._config.plotOptions && vm._config.plotOptions.bars
      && vm._config.plotOptions.bars.averageLines && Array.isArray(vm._config.plotOptions.bars.averageLines)
      && vm._config.plotOptions.bars.averageLines.length >0 ){

      var avgLinesLegend = d3.select(vm._config.bindTo + ' .chart-legend-top').append("div")
        .attr("class", "container-average-lines")
        .append('div')
          .attr("class", "legend-average-lines")
          .style('padding-left','15px')
          .style('padding-right','15px');

      var legendContent = avgLinesLegend.selectAll('.legend-content')
        .data(vm._config.plotOptions.bars.averageLines)
        .enter().append('div')
        .attr("class","legend-content")
        .style("float","left")
        .style('margin-right','10px');

      legendContent.append("div")
        .style('width','10px')
        .style('height', '10px')
        .style('float', 'left')
        .style('margin-right','3px')
        .style('margin-bottom','3px')
        .style("background", function(d){ console.log(d); return d.color; })
        .style('color','white')
        .style('font-weight','bold')
        .style('cursor','pointer')
        .text(function(d){
          return d.enabled ? '✓' : '';
        })
        .on('click',function(d){
          //d.enabled = d.enabled ? false : true;
          d3.select(this).text(d.enabled ? '✓' : '');
          for(var i = 0; i < vm._config.plotOptions.bars.averageLines.length; i++){
            if(vm._config.plotOptions.bars.averageLines[i] === d){
              vm._config.plotOptions.bars.averageLines[i].enabled = vm._config.plotOptions.bars.averageLines[i].enabled ? false : true;
              break;
            }
          }
          vm.redraw();
        });

      legendContent.append("span")
        .text(function(d){ return d.title; });
    }
  }

}


export default function bars(config) {
  return new Bars(arguments.length ? config : null);
}
/*eslint-enable*/