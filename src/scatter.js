 import chart from './chart.js';

function Scatter(config) {
  var vm = this;
  vm._config = config; 
  vm._chart; 
  vm._scales = {}; 
  vm._axes = {};
}

function getChild(data, key){
  var obj = {};
  data.forEach(function(d){
    if(d.key === key)
      obj = d;
  });
  return obj;
}

Scatter.prototype = scatter.prototype = {
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

      vm.draw();
      vm.setData(data);
      vm.setDomains();

      vm.drawAxes();
      vm.drawData();
      vm.draw45Line();
    })

	},
	init : function(){
		var vm = this;
		vm._chart = chart(vm._config);
	},
  draw:function(){
    var vm = this;
    vm._chart.draw();
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

    if( vm._config.yAxis.ticks.format){
      console.log('Set tick format');
      vm._axes.y.tickFormat(vm._config.yAxis.ticks.format); 
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

    if(vm._config.xAxis.bars){
      vm._chart._svg.selectAll('.bar')
          .data(vm._scales.x.domain())
          .enter().append('rect')
          .attr('class',function(d,i){ return i % 2 ? 'bar' : 'bar colored';})
          .attr('x', function(d){ return vm._scales.x(d);})
          .attr('y', -10)
          .attr('width', vm._config.size.width / vm._scales.x.domain().length)
          .attr('height', vm._config.size.height - 30)
          .attr('fill',function(d,i){ return i % 2 ? 'transparent' : '#fafafa'; })
          .attr('transform','translate(-' + (vm._config.size.width / vm._scales.x.domain().length) / 2 +',-10)');
    }

    var xAxis = vm._chart._svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + vm._chart._height + ")")
        .call(vm._axes.x);

    xAxis.selectAll('text')
        .on("click",function(d,i){
          vm._config.xAxis.onclick.call(this, d, i);
        });


    if(vm._config.xAxis && vm._config.xAxis.text){
      xAxis.append("text")
        .attr("class", "label title")
        .attr("x", vm._chart._width/2)
        .attr("y", 30)
        .style("text-anchor", "middle")
        .text(vm._config.xAxis.text);
    }

    if(vm._config.yAxis && vm._config.yAxis.visible){
      var yAxis = vm._chart._svg.append("g")
          .attr("class", "y axis")
          .call(vm._axes.y);    

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
  
  },
  draw45Line: function(){
    var vm = this;

    if(vm._config.plotOptions && vm._config.plotOptions.scatter && vm._config.plotOptions.scatter.draw45Line === true){
      var x2 = vm._scales.x(d3.max(vm._scales.x.domain()));
      var y2 = vm._scales.y(d3.max(vm._scales.y.domain()));
      vm._chart._svg.append('line')
        .attr("x1", vm._scales.x(0))
        .attr("y1", vm._scales.y(0))
        .attr("x2", x2)
        .attr("y2", y2)
        .style("stroke-dasharray", ("10,3"))
        .attr("stroke","#bbb");
    }
    
  },
  drawData : function(){
    var vm = this;
    if(vm._config.values){
      var scale = d3.scale.linear().range([5, (vm._config.size.width / vm._scales.x.domain().length) - 20]);
      var nested = d3.nest().key(function(d){ return d.x; }).entries(vm._data);
      var circles = vm._chart._svg.selectAll(".dot")
        .data(vm._data)
      .enter().append("rect")
        .attr("class", "square")
        .attr("x", function(d) { 
          scale.domain(d3.extent(getChild(nested, d.x).values, function(d){ return d.value; }));
          return vm._scales.x(d.x) - scale(d.value) / 2; })
        .attr("y", function(d) { 
          scale.domain(d3.extent(getChild(nested, d.x).values, function(d){ return d.value; }));
          return vm._scales.y(d.y) - scale(d.value) / 2; })
        .attr("width", function(d){ 
          scale.domain(d3.extent(getChild(nested, d.x).values, function(d){ return d.value; }));
          return scale(d.value); })
        .attr("height", function(d){ 
          scale.domain(d3.extent(getChild(nested, d.x).values, function(d){ return d.value; }));
          return scale(d.value); })

        .on('mouseover', function(d,i){
          if(vm._config.data.mouseover){
            vm._config.data.mouseover.call(vm, d,i);
          }
        })
        .on('mouseout', function(d,i){
          if(vm._config.data.mouseout){
            vm._config.data.mouseout.call(this, d,i);
          }
        })
        .on("click", function(d,i){
          if(vm._config.data.onclick){
            vm._config.data.onclick.call(this, d, i);
          }
        });
      } else {
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
      }
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
