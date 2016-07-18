

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
      .on('mouseover', function(d,i){
	      vm._config.data.mouseover.call(vm, d,i);
	    });

}

export default function columns(options) {
  return new Columns(arguments.length ? options : null);
}