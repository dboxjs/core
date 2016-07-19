function AverageLines(options) {
  var vm = this;
  vm._config = options.config; 
  vm._chart  = options.chart; 
  vm._data   = options.data; 
  vm._scales = options.scales; 
}


AverageLines.prototype.draw = function (){
  var vm = this;

  //Remove all
  vm._chart._svg.selectAll("line.avg-line").remove(); 

  if(vm._config.plotOptions && vm._config.plotOptions.bars && Array.isArray(vm._config.plotOptions.bars.averageLines) && vm._config.plotOptions.bars.averageLines.length >0 ){
    
    //draw line
    vm._chart._svg.selectAll("line.avg-line")
      .data(vm._config.plotOptions.bars.averageLines)
    .enter().append("line")
      .attr("class", ".avg-line")
      .attr('x1', 0)
      .attr('x2', function(d){
        return vm._chart._width;
      })
      .attr('y1', function(d){
        return vm._scales.y(d.data.raw);
      })
      .attr('y2', function(d){
        return vm._scales.y(d.data.raw);
      })
      .attr('stroke', function(d){  return d.color })
      .attr("stroke-width", function(d){ 
        var strokeWidth = '3px'; 
        if(d.strokeWidth) strokeWidth = d.strokeWidth;
        return strokeWidth; 
      })
      .style('display', function(d){
        if(d.enabled) return 'block';
        else return 'none';
      })


    //Add text
    vm._chart._svg.selectAll("text.avg-line")
      .data(vm._config.plotOptions.bars.averageLines)
    .enter().append("text")
        .attr("class", "avg-line")
        .attr("x", vm._chart._width)
        .attr("y", function(d){
          return vm._scales.y(d.data.raw);
        })
        .style("text-anchor", "start")
        .style("fill", function(d){  return d.color } )
        .style("font-size", function(d){ 
          var size = '14px'; 
          if(d.fontSize) size = d.fontSize;
          return size; 
        })
        .text(function(d){
          return d.data.raw;
        })
        .style('display', function(d){
          if(d.enabled) return 'block';
          else return 'none';
        });

    /* @TODO ADD LEGEND FOR AVERAGE LINES
    vm._chart._svg.selectAll("rect.avg-line")
      .append('rect')
      .attr("class", "avg-line")
      .attr("x", function(d) { return vm._scales.x(0); })
      .attr("width", vm._chart._width)
      .attr("y", function(d) { return 0 })
      .attr("height", function(d) { return vm._chart._height - vm._scales.y(d.y); });*/
  }
}

export default function averageLines(options) {
  return new AverageLines(arguments.length ? options : null);
}