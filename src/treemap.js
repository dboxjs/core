import chart from './chart.js';

function Treemap(config) {
  var vm = this;
  vm._config = config; 
  vm._chart; 
  vm._scales = {}; 
  vm._axes = {};
}

Treemap.prototype = treemap.prototype = {
  generate:function(){
    var vm = this, q;
    
    vm.draw();
    //vm.setScales();
    //vm.setAxes();

    q = vm._chart.loadData();

    q.await(function(error,data){
      if (error) {
        throw error;   
        return false;
      } 

      vm.setData(data);
      //vm.setDomains();
      vm.drawData();
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
        .call(vm._axes.x)
        .selectAll('text')
        .on("click",function(d,i){
          vm._config.xAxis.onclick.call(this, d, i);
        });


    if(vm._config.xAxis && vm._config.xAxis.text){
      xAxis.append("text")
        .attr("class", "label")
        .attr("x", vm._chart._width/2)
        .attr("y", 30)
        .style("text-anchor", "middle")
        .text(vm._config.xAxis.text);
    }

    if(vm._config.yAxis.visible){
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
    }
  
  },
  drawData : function(){
    var vm = this;
    d3.select(vm._config.bindTo + " *").remove();
    var treemap = d3.layout.treemap()
        .size([vm._config.size.width, vm._config.size.height])
        .sticky(true)
        .value(vm._config.accessor)
        .children(vm._config.children)
        .sort(function(a,b) {
          return a.value - b.value;
        });

    var div = d3.select(vm._config.bindTo).append("div")
        .style("position", "relative")
        .style("width", vm._config.size.width + "px")
        .style("height", vm._config.size.height + "px");

      div.datum(vm._data).selectAll(".node")
          .data(treemap.nodes)
        .enter().append("div")
          .attr("class", "node")
          .call(position)
          .style("background", function(d,i){ return !d.children ? vm._config.scales.color(i) : null;})
          .on("mouseover", function(d,i){ vm._config.data.mouseover.call(this, d, i); })
          .on("mouseout", function(d,i){ vm._config.data.mouseout.call(this, d, i); })
          .on("click", function(d,i){ vm._config.data.onclick.call(this, d, i); })
          .append("p")
          .attr("class","bold")
          .style("padding-left","3px")
          .style("padding-top","5px")
          .text(function(d){return !d.children ? d.key : null;});
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

    vm._chart._svg.selectAll('.node')
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

function position() {
  this.style("left", function(d) { return d.x + "px"; })
      .style("top", function(d) { return d.y + "px"; })
      .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
      .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
}

export default function treemap(config) {
  return new Treemap(arguments.length ? config : null);
}
