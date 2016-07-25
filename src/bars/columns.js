

function Columns(options) {
  var vm = this;
	vm._config = options.config; 
	vm._chart  = options.chart; 
	vm._data   = options.data; 
	vm._scales = options.scales; 
}

Columns.prototype.draw = function (){
  var vm = this;

  vm._chart._svg.selectAll(".bar")
      .data(vm._data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return vm._scales.x(d.x); })
      .attr("width", vm._scales.x.rangeBand())
      .attr("y", function(d) { return vm._scales.y(d.y); })
      .attr("height", function(d) { return vm._chart._height - vm._scales.y(d.y); })
      .attr("fill", function(d){return d.color;})
      .on('mouseover', function(d,i){
	      vm._config.data.mouseover.call(vm, d,i);
	    });

}

Columns.prototype.select = function (selector){
  var vm = this;
  var select = false; 
   
  vm._chart._svg.selectAll('.bar')
    .each(function(d){
      if(d.x === selector || d.y === selector){
        select = d3.select(this); 
      }
    })
    
  return select; 
}

export default function columns(options) {
  return new Columns(arguments.length ? options : null);
}