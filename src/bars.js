import chart from './chart.js';

function Bars(config) {
  var vm = this;
  vm._config = config; 
  vm._chart; 
  vm._scales = {}; 
  vm._axes = {};
}

Bars.prototype = bars.prototype = {
	generate:function(){
		var vm = this, q;

		vm.init();
		vm.setScales();
		vm.setAxes();

		q = vm._chart.loadData();

    q.await(function(error,data){
      if (error) {
        throw error;	 
        return false;
      } 

      vm.setData(data);
      vm.setDomains();
      vm.drawAxes();
      vm.drawData();
      vm._chart.dispatch.load(); 
    })

	},
	init : function(){
		var vm = this
		vm._chart = chart(vm._config);
    vm._chart.dispatch.on("load.chart", vm._config.events.load(vm));

	},
	setScales: function(){
		var vm = this;
    vm._scales = vm._chart.setScales();
	}, 
	setAxes : function(){
		var vm = this;

		vm._axes.x = d3.svg.axis()
		  .scale(vm._scales.x)
		  .orient("bottom");

		vm._axes.y = d3.svg.axis()
		  .scale(vm._scales.y)
		  .orient("left")


    if(vm._config.yAxis && vm._config.yAxis.ticks 
        && vm._config.yAxis.ticks.enabled === true && vm._config.yAxis.ticks.style ){

      switch(vm._config.yAxis.ticks.style){
        case 'straightLine':
          vm._axes.y
            .tickSize(-vm._chart._width,0);
        break;
      }
      
    }

	},
	setData:function(data){
    var vm = this;
    vm._data = data;
  },
  setDomains:function(){
    var vm = this;
    

    var domains = vm._chart.getDomains(vm._data);
    
    vm._scales.x.domain(domains.x);
    vm._scales.y.domain(domains.y);

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
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function(d) {
            return "rotate(-65)" 
            });

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
          vm.lineAndCircles(); 
        break;

        case 'columns':
          vm.columns(); 
        break

        default:
         vm.columns(); 
        break;
      }

      return; 
    }

    vm.columns();
  }, 
  redraw: function(config){
    var vm = this;
    vm._chart.destroy(); 
    vm._config = config; 
    vm.generate();

  }


}

Bars.prototype.columns = function (){
  var vm = this;

  vm._chart._svg.selectAll(".bar")
      .data(vm._data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return vm._scales.x(d.x); })
      .attr("width", vm._scales.x.rangeBand())
      .attr("y", function(d) { return vm._scales.y(d.y); })
      .attr("height", function(d) { return vm._chart._height - vm._scales.y(d.y); });

}

Bars.prototype.lineAndCircles = function (){
  var vm = this;

  vm._chart._svg.selectAll(".dot")
    .data(vm._data)
  .enter().append("circle")
    .attr("class", "dot")
    .attr("r", 3.5)
    .attr("cx", function(d) { return vm._scales.x(d.x)+vm._scales.x.rangeBand()/2; })
    .attr("cy", function(d) { return vm._scales.y(d.y); })
    .style("fill", function(d) { return vm._scales.color(d.color); })
    .on('mouseover', function(d,i){
      vm._config.data.mouseover.call(vm, d,i);
    });

  vm._chart._svg.selectAll('line.stem')
      .data(vm._data)
    .enter()
      .append('line')
      .classed('stem', true)
      .attr('x1', function(d){
        return vm._scales.x(d.x)+vm._scales.x.rangeBand()/2;
      })
      .attr('x2', function(d){
        return vm._scales.x(d.x)+vm._scales.x.rangeBand()/2;
      })
      .attr('y1', function(d){
        return vm._scales.y(d.y);
      })
      .attr('y2', vm._chart._height)
      .attr('stroke', '#7A7A7A')

  vm._chart._svg.selectAll('circle')
      .data(vm._data)
    .enter()
      .append('circle')
      .attr('cx', function(d) {
        return vm._scales.x(d.x);
      })
      .attr('cy', function(d) {
        return vm._scales.y(d.y);
      })
      .attr('r', 6)
      .attr('fill', '#ccc')
      .style('cursor', 'pointer')

}

export default function bars(config) {
  return new Bars(arguments.length ? config : null);
}
