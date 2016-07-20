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
    .attr("r", 3.5)
    .attr("cx", function(d) { return vm._scales.x(d.x)+vm._scales.x.rangeBand()/2; })
    .attr("cy", function(d) { return vm._scales.y(d.y); })
    .style("fill", function(d) { return vm._scales.color(d.color); })
    .on('mouseover', function(d,i){
      vm._config.data.mouseover.call(vm, d,i)
    })
    .on('mouseover', function(d){
      vm._chart._tip.show(d, d3.select(this).node())
    })
    .on('mouseout', vm._chart._tip.hide)
    

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

LineAndCircles.prototype.select = function(selector){
  var vm = this; 
   
  vm._chart._svg.selectAll('circle')
    .data(vm._data)
    .attr('r', function(d){
      if(d.x === selector || d.y === selector){
        vm._chart._tip.show(d,d3.select(this).node())
        return 10;
      }else{
        return 3.5;
      }
    })
    .style('fill', '#ccc')
    .style('cursor', 'pointer')
}


export default function lineAndCircles(options) {
  return new LineAndCircles(arguments.length ? options : null);
}