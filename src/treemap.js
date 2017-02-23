export default function(config) {
  function Treemap(config) {
    var vm = this;
    vm._config = config ? config : {};
    vm._config._padding = 4;
    vm._config._colorScale = d3.scale.category20c();
    vm._data = [];
    vm._scales = {};
    vm._axes = {};
  }

  //-------------------------------
  //User config functions
  Treemap.prototype.end = function(){
    var vm = this;
    return vm._chart;
  }

  Treemap.prototype.size = function(col){
    var vm = this;
    vm._config._size = col;
    return vm;
  }

  Treemap.prototype.colorScale = function(colorScale){
    var vm = this;
    vm._config._colorScale = colorScale;
    return vm;
  }

  Treemap.prototype.padding = function(padding){
    var vm = this;
    vm._config._padding = padding;
    return vm;
  }

  Treemap.prototype.nestBy = function(key) {
    var vm = this;
    vm._config._key = key;
    return vm;
  }

  //-------------------------------
  //Triggered by the chart.js;
  Treemap.prototype.chart = function(chart){
    var vm = this;
    vm._chart = chart;
    return vm;
  }

  Treemap.prototype.isValidStructure = function(datum){
    var vm = this;
    return ((typeof datum.name === 'string' || datum.name instanceof String) && Array.isArray(datum.children) || (typeof datum.name === 'string' || datum.name instanceof String) && Number(datum[vm._config._size]) == datum[vm._config._size]);
  }

  Treemap.prototype.formatNestedData = function(data){
    var vm = this;
    if(data.key) {
      data.name = data.key;
      delete data.key;
    } else if(vm._config._key) {
      data.name = data[vm._config._key];
    }
    if(Array.isArray(data.values)) {
      var children = [];
      data.values.forEach(function(v){
        children.push(vm.formatNestedData(v))
      });
      data.children = children;
      delete data.values;
    }
    return data;
  }

  Treemap.prototype.data = function(data){
    var vm = this;
    // TODO validate structure like [{name: '', children: [{},{}]}]
    if(data){
      if(Array.isArray(data) && data.length > 0) {
        if(!vm.isValidStructure(data[0])) {
          data.forEach(function(d){
            d[vm._config._size] = +d[vm._config._size];
          });
          try {
            if(!vm._config._key)
              throw "nestBy() in layer was not configured"
            data = [vm.formatNestedData(d3.nest()
                .key(function(d){ return d[vm._config._key]; })
                .entries(data)[0])];
          } catch(err){
            console.error(err);
          }
        }
      } else {
        if(!vm.isValidStructure(data)) {
          try {
            if(!data.key)
              throw "Property 'key' not found";
            if(data[vm._config._size] !== Number(data[vm._config._size]))
              throw  "Value used for treemap rect size is not a number";
            data = [vm.formatNestedData(data)];
          } catch(err){
            console.error(err);
          }
        }
      }
    }
    vm._data = data;
    return vm;
  }

  Treemap.prototype.draw = function(){
    var vm = this;
    var treemap = d3.layout.treemap()
      .padding(vm._config._padding)
      .size([vm._chart._width, vm._chart._height])
      .value(function(d) { return d[vm._config._size]; });

    var cell = vm._chart._svg.data(vm._config._data).selectAll("g")
        .data(treemap.nodes)
      .enter().append("g")
        .attr("class", "cell")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    cell.append("rect")
        .attr("width", function(d) { return d.dx; })
        .attr("height", function(d) { return d.dy; })
        .style("fill", function(d) { return d.children ? vm._config._colorScale(d.name) : null; });

    cell.append("text")
        .attr("x", function(d) { return d.dx / 2; })
        .attr("y", function(d) { return d.dy / 2; })
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(function(d) { return d.children ? null : d.name; });

    return vm;
  }

  return new Treemap(config);
}
