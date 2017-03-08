/*eslint-disable*/
function LineAndCircles(options) {
  var vm = this;
  vm._config = options.config; 
  vm._chart  = options.chart; 
  vm._data   = options.data; 
  vm._scales = options.scales; 
}


LineAndCircles.prototype.draw = function (){
  var vm = this;

  vm._chart._svg.selectAll(".dot")
    .data(vm._data)
  .enter().append("circle")
    .attr("class", "dot")
    .attr("r", 5)
    .attr("cx", function(d) { return vm._scales.x(d.x)+vm._scales.x.rangeBand()/2; })
    .attr("cy", function(d) { return vm._scales.y(d.y); })
    .style("fill", function(d) { return d.color; })
    .style("stroke", function(d) { return d.color; })
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
    })
    

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
      .attr('stroke', function(d){
        return d.color;
      })

  /*vm._chart._svg.selectAll('circle')
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
      .attr('fill', function(d){
        return d.color;
      })
      .style('cursor', 'pointer')*/

}

LineAndCircles.prototype.select = function(selector){
  var vm = this;
  var select = false; 
   
  vm._chart._svg.selectAll('.dot')
    .each(function(d){
      if(d.x === selector || d.y === selector){
        select = d3.select(this); 
      }
    })
    
  return select; 
    
}


export default function lineAndCircles(options) {
  return new LineAndCircles(arguments.length ? options : null);
}
/*eslint-enable*/