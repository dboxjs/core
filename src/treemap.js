export default function(config) {
  function Treemap(config) {
    var vm = this;
    vm._config = config ? config : {};
    vm._config._padding = 4;
    vm._config._colorScale = d3.scaleOrdinal(d3.schemeCategory20c);
    vm._config._labels = true;
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

  Treemap.prototype.colorScale = function(arrayOfColors){
    var vm = this;
    vm._config._colorScale = d3.scaleOrdinal(arrayOfColors);
    return vm;
  }

  Treemap.prototype.padding = function(padding){
    var vm = this;
    vm._config._padding = padding;
    return vm;
  }

  Treemap.prototype.nestBy = function(keys) {
    var vm = this;
    if(Array.isArray(keys)) {
      if(keys.length == 0)
        throw "Error: nestBy() array is empty";
      vm._config._keys = keys;
    } else if(typeof keys === 'string' || keys instanceof String) {
      vm._config._keys = [keys];
    } else {
      if(keys == undefined || keys == null)
        throw "Error: nestBy() expects column names to deaggregate data";
      vm._config._keys = [keys.toString()];
      console.warning("nestBy() expected name of columns. Argument will be forced to string version .toString()");
    }
    vm._config._labelName = vm._config._keys[vm._config._keys.length - 1]; //label will be last key
    return vm;
  }

  Treemap.prototype.labels = function(bool) {
    var vm = this;
    vm._config._labels = Boolean(bool);
    return vm;
  };

  //-------------------------------
  //Triggered by the chart.js;
  Treemap.prototype.chart = function(chart){
    var vm = this;
    vm._chart = chart;
    return vm;
  }

  Treemap.prototype.scales = function(scales){
    var vm = this;
    return vm;
  }

  Treemap.prototype.axes = function(axes){
    var vm = this;
    return vm;
  }

  Treemap.prototype.domains = function(){
    var vm = this;
    return vm;
  }

  Treemap.prototype.isValidStructure = function(datum){
    var vm = this;
    if((typeof datum.name === 'string' || datum.name instanceof String) && Array.isArray(datum.children)) {
      var res = true;
      datum.children.forEach(function(child) {
        res = res && vm.isValidStructure(child);
      });
      return res;
    } else if((typeof datum.name === 'string' || datum.name instanceof String) && Number(datum[vm._config._size]) == datum[vm._config._size]) {
      return true;
    } else {
      return false;
    }
  }

  Treemap.prototype.formatNestedData = function(data) {
    var vm = this;
    if(data.key) {
      data.name = data.key;
      delete data.key;
    } else {
      if(!Array.isArray(data.values)) {
        data.name = data[vm._config._labelName];
      }
    }
    if(Array.isArray(data.values)) {
      var children = [];
      data.values.forEach(function(v){
        children.push(vm.formatNestedData(v))
      });
      data.children = children;
      delete data.values;
    }
    if(!data[vm._config._size] && data.value){
      data[vm._config._size] = data.value;
    }
    return data;
  }

  Treemap.prototype.data = function(data){
    var vm = this;
    // Validate structure like [{name: '', children: [{},{}]}]
    if(data){
      if(Array.isArray(data) && data.length > 0) {
        if(!vm.isValidStructure(data[0])) {
          data.forEach(function(d){
            d[vm._config._size] = +d[vm._config._size];
          });
          try {
            if(!vm._config._keys)
              throw "nestBy() in layer was not configured";
            var nested = 'd3.nest()';
            for (var i = 0; i < vm._config._keys.length; i++) {
              nested += '.key(function(d){ return d.'+ vm._config._keys[i] + '; })';
            }
            nested += '.rollup(function(leaves) { return d3.sum(leaves, function(d) {return d.' + vm._config._size + ';})})'
            nested += '.entries(data)';

            var nestedData = eval(nested);
            // TODO: improve way to get nested multiple keys
            var aux = {};
            aux.key = 'data';
            aux.values = _.cloneDeep(nestedData); // WARN: Lodash dependency
            data = vm.formatNestedData(aux);
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
            data = vm.formatNestedData(data);
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
    var format = d3.format(",d");

    var treemap = d3.treemap()
        .tile(d3.treemapResquarify)
        .size([vm._chart._width, vm._chart._height])
        .round(true)
        .paddingInner(vm._config._padding);

    var root = d3.hierarchy(vm._data)
        .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
        .sum(function(d){return d[vm._config._size];})
        .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

    treemap(root);

    var cell = vm._chart._svg.selectAll("g")
      .data(root.leaves())
      .enter().append("g")
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

    cell.append("rect")
        .attr("id", function(d) { return d.data.id; })
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; })
        .attr("fill", function(d) { return vm._config._colorScale(d.data.id); });

    cell.append("clipPath")
        .attr("id", function(d) { return "clip-" + d.data.id; })
      .append("use")
        .attr("xlink:href", function(d) { return "#" + d.data.id; });

    if(vm._config._labels) {
      cell.append("text")
          .attr("clip-path", function(d) { return "url(#clip-" + d.data.id + ")"; })
        .selectAll("tspan")
          .data(function(d) { return d.data.id.split(/(?=[A-Z][^A-Z])/g); })
        .enter().append("tspan")
          .attr('class','capitalize')
          .attr("x", 10)
          .attr("y", function(d, i) { return 15 + i * 10; })
          .text(function(d) {
            var arr = d.split('data.')[1].split('.');
            return arr.length > 1 ? arr.slice(arr.length - 2, arr.length).join(' / ') : arr[arr.length - 1].toString();
          });
    }

    cell.append("title")
        .text(function(d) { return d.data.name + "\n" + format(d.value); });

    return vm;
  }
  return new Treemap(config);
}
