function QuantilesAndCircles(options) {
  var vm = this;
  vm._config = options.config; 
  vm._chart  = options.chart; 
  vm._data   = options.data; 
  vm._scales = options.scales; 
}


QuantilesAndCircles.prototype.draw = function (){
  var vm = this;

  vm._chart._svg.selectAll(".dot")
    .data(vm._data)
  .enter().append("circle")
    .attr("class", "dot")
    .attr("r", 3.5)
    .attr("cx", function(d) { console.log('X',d.x, vm._scales.q(d.x)) ;return vm._scales.x ( vm._scales.q(d.x) ) +vm._scales.x.rangeBand()/2; })
    .attr("cy", function(d) { return vm._scales.y(d.y); })
    .style("fill", function(d) { return vm._scales.color(d.color); })
    .on('mouseover', function(d,i){
      vm._config.data.mouseover.call(vm, d,i);
    });

  /*vm._chart._svg.selectAll('line.stem')
      .data(vm._data)
    .enter()
      .append('line')
      .classed('stem', true)
      .attr('x1', function(d){
        return vm._scales.x(d.x)+vm._scales.x.range()/2;
      })
      .attr('x2', function(d){
        return vm._scales.x(d.x)+vm._scales.x.range()/2;
      })
      .attr('y1', function(d){
        return vm._scales.y(d.y);
      })
      .attr('y2', vm._chart._height)
      .attr('stroke', '#7A7A7A')*/

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


QuantilesAndCircles.prototype.renameAxis = function (axis){
  var vm = this;

  axis.selectAll("text")  
    .text('Marco rules!!!!!')

}


export default function quantilesAndCircles(options) {
  return new QuantilesAndCircles(arguments.length ? options : null);
}