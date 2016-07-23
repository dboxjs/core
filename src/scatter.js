import chart from './chart.js';

function Scatter(config) {
  var vm = this;
  vm._config = config; 
  vm._chart; 
  vm._scales = {}; 
  vm._axes = {};
}

Scatter.prototype = scatter.prototype = {
	generate:function(){
		var vm = this, q;
		
		vm.draw();
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
      vm.draw45Line();
    })

	},
	draw : function(){
		var vm = this
		vm._chart = chart(vm._config);
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
    
	},
	setData:function(data){
    var vm = this;
    vm._data = data;
  },
  setDomains:function(){
    var vm = this;
    vm._scales.x.domain(d3.extent(vm._data, function(d) { return d.x; })).nice();
    vm._scales.y.domain(d3.extent(vm._data, function(d) { return d.y; })).nice();
  },
  drawAxes:function(){
    var vm = this;

    var xAxis = vm._chart._svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + vm._chart._height + ")")
        .call(vm._axes.x);


    if(vm._config.xAxis && vm._config.xAxis.text){
      xAxis.append("text")
        .attr("class", "label")
        .attr("x", vm._chart._width)
        .attr("y", 30)
        .attr("x", 470)
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
        .attr("y", -40)
        .attr("x", -100)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(vm._config.yAxis.text);
    }
  
  },
  draw45Line: function(){
    var vm = this;

    if(vm._config.plotOptions && vm._config.plotOptions.scatter && vm._config.plotOptions.scatter.draw45Line === true){
      vm._chart._svg.append('line')
      .attr("x1", vm._scales.x(0))
      .attr("y1", vm._scales.y(0))
      .attr("x2", vm._scales.x(vm._scales.x.domain()[1]))
      .attr("y2", vm._scales.y(vm._scales.y.domain()[1]))
      .style("stroke-dasharray", ("10,3"))
      .attr("stroke","#bbb");
    }
    
  },
  drawData : function(){
    var vm = this;
    var circles = vm._chart._svg.selectAll(".dot")
      .data(vm._data)
      //.data(vm._data, function(d){ return d.key})
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 5)
      .attr("cx", function(d) { return vm._scales.x(d.x); })
      .attr("cy", function(d) { return vm._scales.y(d.y); })
      .style("fill", function(d) { return d.color; })

      .on('mouseover', function(d,i){
        if(vm._config.data.mouseover){
          vm._config.data.mouseover.call(vm, d,i);
        }
        vm._chart._tip.show(d, d3.select(this).node());
      })
      .on('mouseout', function(d,i){
        if(vm._config.data.mouseout){
          vm._config.data.mouseout.call(this, d,i);
        }
        vm._chart._tip.hide();
      })
      .on("click", function(d,i){
        if(vm._config.data.onclick){
          vm._config.data.onclick.call(this, d, i);
        }
      });
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

    vm._chart._svg.selectAll('.dot')
      .each(function(d){
        if(d.x === selector || d.y === selector){
          select = d3.select(this); 
        }
      });

    return select; 
  },
  triggerMouseOver:function(selector){
    var vm = this; 
   
    vm._chart._svg.selectAll('circle')
      .each(function(d){
        if(d.x === selector || d.y === selector || d.z === selector){
          vm._chart._tip.show(d,d3.select(this).node())
        }
      })
  },
  triggerMouseOut:function(selector){
    console.log(selector)
    var vm = this; 
   
    vm._chart._svg.selectAll('circle')
      .each(function(d){
        if(d.x === selector || d.y === selector || d.z === selector){
          vm._chart._tip.hide(d,d3.select(this).node())
        }
      })
  },
  redraw: function(){
    var vm = this;
    vm._chart.destroy(); 
    vm.generate();
  }


}

export default function scatter(config) {
  return new Scatter(arguments.length ? config : null);
}
