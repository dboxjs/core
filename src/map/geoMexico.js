import mxStates from './utils/mxStates.js';
import mxMunicipalities from './utils/mxMunicipalities.js';

function GeoMexico(options) {
    var vm = this;
    vm._config = options.config;
    vm._chart = options.chart;
    vm._data = null;
    vm.states = null;
    vm.municipalities = null;
}


GeoMexico.prototype.drawStates = function() {
    var vm = this;

    var tran = [2580, 700];

    vm.projection = d3.geo.mercator()
        .scale(1300)
        .translate(tran);

    vm.path = d3.geo.path()
        .projection(vm.projection);

    vm.states = vm._chart._svg.append("g")
        .attr("id", "states")
        .style('display', 'true')
        .attr("transform", function() {
            //return "translate("+(vm._chart._width*.2) +",100) scale(0.9,0.9)"
            return "translate(" + (vm._config.size.translateX) + ",100) scale(" + vm._config.size.scale + ")"
        });

    var mx = mxStates();
    vm.states.selectAll("path")
        .data(topojson.feature(mx, mx.objects.states).features, function(d) {
            d.id = parseInt(d.properties.state_code);
            return d.id;
        })
        .enter().append("path")
        .attr("d", d3.geo.path().projection(vm.projection))
        .attr("id", function(d) {
            return "state-" + d.id;
        })
        .attr("data-geotype", 'states')
        .attr("fill", "#808080")
        .attr('stroke', '#a0a0a0')
        .style('stroke-width', '1px')
        .on('mouseover', function(d, i) {
            if (vm._config.data.mouseover) {
                vm._config.data.mouseover.call(this, d, i)
            }
            vm._chart._tip.show(d, d3.select(this).node())
        })
        .on('mouseout', function(d, i) {
            if (vm._config.data.mouseout) {
                vm._config.data.mouseout.call(this, d, i)
            }
            vm._chart._tip.hide(d, d3.select(this).node())
        })
        .on("click", function(d, i) {
            //Marco
            if (vm._config.data.click) {
                vm._config.data.click.call(this, d, i)
            }
            vm.clickedEstado(d);
        })

    vm.statesDefault = vm.states.selectAll("path").data();

    vm.states.selectAll("path").attr("stroke", "#333").attr('stroke-width', 0.2);
    vm.states.selectAll("path").attr("fill", "red");
    vm.states.selectAll("path").attr('data-total', null);
    vm.states.selectAll("path")
        .data(vm._data, function(d) {
            return d.id;
        })
        .attr('fill', function(d) {
            return vm._getQuantileColor(d);
        })
        .attr('data-total', function(d) {
            return d.z;
        })

    //Resets the map "Estados" path data to topojson
    vm.states.selectAll("path").data(vm.statesDefault, function(d) {
        return d.id;
    });

}

GeoMexico.prototype.redrawStates = function() {
    var vm = this;

    vm.states.selectAll("path").attr("stroke", "#333").attr('stroke-width', 0.2);
    vm.states.selectAll("path").attr("fill", "red");
    vm.states.selectAll("path").attr('data-total', null);
    vm.states.selectAll("path")
        .data(vm._data, function(d) {
            return d.id;
        })
        .attr('fill', function(d) {
            return vm._getQuantileColor(d);
        })
        .attr('data-total', function(d) {
            return d.z;
        })

    //Resets the map "Estados" path data to topojson
    vm.states.selectAll("path").data(vm.statesDefault, function(d) {
        return d.id;
    });

}

//@Todo - upgrade to a general function for all geotypes; Upgrade from pnud.data4.mx
GeoMexico.prototype.clickedEstado = function(d) {
    var vm = this;

    var x, y, k;
    if (d && vm.centered !== d) {
        var centroid = vm.path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = vm.edo_zoom[d.properties.state_code];
        //k = 5;
        vm.centered = d;
    } else {
        x = vm.width / 2;
        y = vm.height / 2;
        k = 0.7;
        vm.centered = null;
    }

    vm.states.selectAll("path")
        .classed("active", vm.centered && function(d) {
            return d === vm.centered;
        });

    vm.states.transition()
        .duration(750)
        .attr("transform", function() {
            if (vm.centered === null) return "translate(" + (vm._config.size.translateX) + ",100) scale(" + vm._config.size.scale + ")"
            return "translate(" + vm._chart._width / 2 + "," + vm._chart._height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")";
        });
}

GeoMexico.prototype.drawMunicipalities = function() {
    var vm = this;
    var tran = [2580, 700];

    vm.projection = d3.geo.mercator()
        .scale(1300)
        .translate(tran);

    vm.path = d3.geo.path()
        .projection(vm.projection);

    vm.municipalities = vm._chart._svg.append("g")
        .attr("id", "municipalities")
        .attr("transform", function() {
            //return "translate("+(vm._chart._width*.2) +",100) scale(0.9,0.9)"
            return "translate(" + (vm._config.size.translateX) + ",100) scale(" + vm._config.size.scale + ")"
        });

    var mx = mxMunicipalities();

    vm.municipalities.selectAll("path")
        .data(topojson.feature(mx, mx.objects.municipios2).features, function(d) {
            d.id = d.properties.CVE_ENT + d.properties.CVE_MUN;
            return d.id;
        })
        .enter().append("path")
        .attr("d", d3.geo.path().projection(vm.projection))
        .attr("id", function(d) {
            return "mun-" + d.id;
        })
        .attr("data-geotype", 'municipalities')
        .attr("fill", "#808080")
        .attr('stroke', '#a0a0a0')
        .style('stroke-width', '.5px')
        .on('mouseover', function(d, i) {
            if (vm._config.data.mouseover) {
                vm._config.data.mouseover.call(this, d, i)
            }
            vm._chart._tip.show(d, d3.select(this).node())
        })
        .on('mouseout', function(d, i) {
            if (vm._config.data.mouseout) {
                vm._config.data.mouseout.call(this, d, i)
            }
            vm._chart._tip.hide(d, d3.select(this).node())
        })
        .on("click", function(d, i) {
            //Marco
            if (vm._config.data.click) {
                vm._config.data.click.call(this, d, i)
            }
            vm.clickedMunicipality(d);
        })

    /*  return vm.municipalities.selectAll("path").data()*/
    vm.municipalitiesDefault = vm.municipalities.selectAll("path").data();

    vm.municipalities.selectAll("path").attr("stroke", "#888").attr('stroke-width', 0.2);
    vm.municipalities.selectAll("path").attr("fill", "red");
    vm.municipalities.selectAll("path").attr('data-total', null);
    vm.municipalities.selectAll("path")
        .data(vm._data, function(d) {
            return d.id;
        })
        .attr('fill', function(d) {
            return vm._getQuantileColor(d);
        })
        .attr('data-total', function(d) {
            return d.z;
        })

    //Resets the map "Municipios" path data to topojson
    vm.municipalities.selectAll("path").data(vm.municipalitiesDefault, function(d) {
        return d.id;
    });

    //Draw states    
    vm.states = vm._chart._svg.append("g")
        .attr("id", "states")
        .style('display', 'true')
        .attr("transform", function() {
            //return "translate("+(vm._chart._width*.2) +",100) scale(0.9,0.9)"
            return "translate(" + (vm._config.size.translateX) + ",100) scale(" + vm._config.size.scale + ")"
        });

    var mx = mxStates();
    vm.statesDefault = topojson.feature(mx, mx.objects.states).features;
    vm.drawStatesCountouring(vm.statesDefault);
}

GeoMexico.prototype.drawStatesCountouring = function(data){
    var vm = this;
    vm.states.selectAll('.state').remove();
    vm.states.selectAll("path")
        .data(data, function(d) {
            d.id = parseInt(d.properties.state_code);
            return d.id;
        })
        .enter().append("path")
        .attr("d", d3.geo.path().projection(vm.projection))
        .attr("id", function(d) {
            return "state-" + d.id;
        })
        .attr("class", "state")
        .attr("data-geotype", 'states')
        .attr("fill", "transparent")
        .attr('stroke', '#242424')
        .style('stroke-width', '2px')
        .on('mouseover', function(d, i) {
            var data = _.filter(vm.statesDefault, function(obj){ return obj.id !== d.id; });
            vm.drawStatesCountouring(data);
        });
}

GeoMexico.prototype.redrawMunicipalities = function() {
    var vm = this;

    vm.municipalities.selectAll("path").attr("stroke", "#333").attr('stroke-width', 0.2);
    vm.municipalities.selectAll("path").attr("fill", "red");
    vm.municipalities.selectAll("path").attr('data-total', null);
    vm.municipalities.selectAll("path")
        .data(vm._data, function(d) {
            return d.id;
        })
        .attr('fill', function(d) {
            return vm._getQuantileColor(d);
        })
        .attr('data-total', function(d) {
            return d.z;
        })

    //Resets the map "Municipios" path data to topojson
    vm.municipalities.selectAll("path").data(vm.municipalitiesDefault, function(d) {
        return d.id;
    });

}

GeoMexico.prototype.clickedMunicipality = function(d) {
    var vm = this;

    var x, y, k;
    if (d && vm.centeredMunicipality !== d) {
        var centroid = vm.path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = 5;
        vm.centeredMunicipality = d;
    } else {
        x = vm.width / 2;
        y = vm.height / 2;
        k = 0.7;
        vm.centeredMunicipality = null;
    }

    vm.municipalities.selectAll("path")
        .classed("active", vm.centeredMunicipality && function(d) {
            return d === vm.centeredMunicipality;
        });

    vm.municipalities.transition()
        .duration(750)
        .attr("transform", function() {
            if (vm.centeredMunicipality === null) return "translate(" + (vm._config.size.translateX) + ",100) scale(" + vm._config.size.scale + ")"
            return "translate(" + vm._chart._width / 2 + "," + vm._chart._height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")";
        });

    vm.states.transition()
        .duration(750)
        .attr("transform", function() {
            if (vm.centeredMunicipality === null) return "translate(" + (vm._config.size.translateX) + ",100) scale(" + vm._config.size.scale + ")"
            return "translate(" + vm._chart._width / 2 + "," + vm._chart._height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")";
        });

}

GeoMexico.prototype.filterByMinMaxMunicipalities = function() {
  var vm = this; 

  vm.municipalities.selectAll("path").attr("stroke","#333").attr('stroke-width', 0.2);
  vm.municipalities.selectAll("path").attr("fill", "red");
  vm.municipalities.selectAll("path").attr('data-total', null);
  vm.municipalities.selectAll("path")
    .data(vm._data, function(d){ return d.id; })
    .attr('fill', function(d){
      return vm._getQuantileColor(d);
    })
    .attr('data-total', function(d){
      return d.z;
    })

  //Resets the map "Municipios" path data to topojson
  vm.municipalities.selectAll("path").data(vm.municipalitiesDefault, function(d){ return d.id; });

}

export default function geoMexico(options) {
  return new GeoMexico(arguments.length ? options : null);

}