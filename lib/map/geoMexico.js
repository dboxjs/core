import mxStates from './utils/mxStates.js';
import mxMunicipalities from './utils/mxMunicipalities.js';
import mxZones from './utils/mxZones.js';

function GeoMexico(chart, config) {
    var vm = this;
    vm._config = config;
    vm._chart = chart;
    vm._data = null;
    vm.states = null;
    vm.municipalities = null;
    vm.zones = null;
    vm._tip = d3.tip().attr('class', 'd3-tip');
    vm._tip.html(vm._config.tip);
}


GeoMexico.prototype.drawStates = function() {
    var vm = this;

    //Call the tip
    vm._chart._svg.call(vm._tip)

    var tran = [2580, 700];

    vm.projection = d3.geoMercator()
        .scale(1300)
        .translate(tran);

    vm.path = d3.geoPath()
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
            d.id = d.properties.state_code.toString();
            if(d.id.length === 1) d.id = '0'+d.id;
            return d.id;
        })
        .enter().append("path")
        .attr("d", d3.geoPath().projection(vm.projection))
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
            vm._tip.show(d, d3.select(this).node())
        })
        .on('mouseout', function(d, i) {
            if (vm._config.data.mouseout) {
                vm._config.data.mouseout.call(this, d, i)
            }
            vm._tip.hide(d, d3.select(this).node())
        })
        .on("click", function(d, i) {
            //Marco
            if (vm._config.onclick) {
                vm._config.onclick.call(this, d, i)
            }
            vm.clickedEstado(d);
        })

    vm.statesDefault = vm.states.selectAll("path").data();

    vm.states.selectAll("path").attr("stroke", "#333").attr('stroke-width', 0.2);
    vm.states.selectAll("path").attr("fill", "red");
    vm.states.selectAll("path").attr('data-total', null);
    vm.states.selectAll("path")
        .data(vm._data, function(d) {
            return parseInt(d.id);
        })
        .attr('fill', function(d) {
            return vm._getQuantileColor(d);
        })
        .attr('data-total', function(d) {
            return +d[vm._config.z];
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
            return +d[vm._config.z];
        })

    //Resets the map "Estados" path data to topojson
    vm.states.selectAll("path").data(vm.statesDefault, function(d) {
        return d.id;
    });

}

//@Todo - upgrade to a general function for all geotypes; Upgrade from pnud.data4.mx
GeoMexico.prototype.clickedEstado = function(d) {
    var vm = this;
    vm.edo_zoom = {
          "1":10,
          "2":3,
          "3":3,
          "4":4,
          "5":3,
          "6":10,
          "7":5,
          "8":2,
          "9":12,
          "10":4,
          "11":8,
          "12":5,
          "13":8,
          "14":5,
          "15":6,
          "16":6,
          "17":10,
          "18":6,
          "19":4,
          "20":5,
          "21":6,
          "22":9,
          "23":5,
          "24":6,
          "25":4,
          "26":2,
          "27":7,
          "28":3,
          "29":10,
          "30":4,
          "31":4,
          "32":4
      };
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

GeoMexico.prototype.resetStates = function(){
    var vm = this;
    vm.states.transition()
      .duration(750)
      .attr("transform", function(){
        return "translate("+(vm._config.size.translateX) +",100) scale("+vm._config.size.scale+")"      
      });
}

GeoMexico.prototype.drawMunicipalities = function() {
    var vm = this;
    //Call the tip
    vm._chart._svg.call(vm._tip)

    var tran = [2580, 700];

    vm.projection = d3.geoMercator()
        .scale(1300)
        .translate(tran);

    vm.path = d3.geoPath()
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
        .attr("d", d3.geoPath().projection(vm.projection))
        .attr("id", function(d) {
            return "municipality-" + d.id;
        })
        .attr("data-geotype", 'municipalities')
        .attr("fill", "#808080")
        .attr('stroke', '#a0a0a0')
        .style('stroke-width', '.5px')
        .on('mouseover', function(d, i) {
            if (vm._config.data.mouseover) {
                vm._config.data.mouseover.call(this, d, i)
            }
            vm._tip.show(d, d3.select(this).node())
        })
        .on('mouseout', function(d, i) {
            if (vm._config.data.mouseout) {
                vm._config.data.mouseout.call(this, d, i)
            }
            vm._tip.hide(d, d3.select(this).node())
        })
        .on("click", function(d, i) {
            //Marco
            if (vm._config.onclick) {
                vm._config.onclick.call(this, d, i)
            }
            vm.clickedMunicipality(d);
        })

    /*  return vm.municipalities.selectAll("path").data()*/
    vm.municipalitiesDefault = vm.municipalities.selectAll("path").data();

    vm.municipalities.selectAll("path").attr("stroke", "#888").attr('stroke-width', 0.2);
    vm.municipalities.selectAll("path").attr("fill", "#ccc");
    vm.municipalities.selectAll("path").attr('data-total', null);
    vm.municipalities.selectAll("path")
        .data(vm._data, function(d) {
            return d.id;
        })
        .attr('fill', function(d) {
            return vm._getQuantileColor(d);
        })
        .attr('data-total', function(d) {
            return +d[vm._config.z];
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
        .attr("d", d3.geoPath().projection(vm.projection))
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
            return +d[vm._config.z];
        })

    //Resets the map "Municipios" path data to topojson
    vm.municipalities.selectAll("path").data(vm.municipalitiesDefault, function(d) {
        return d.id;
    });

}

GeoMexico.prototype.clickedMunicipality = function(d) {
    var vm = this;

    vm.edo_zoom = {
      "1":10,
      "2":3,
      "3":3,
      "4":4,
      "5":3,
      "6":10,
      "7":5,
      "8":2,
      "9":12,
      "10":4,
      "11":8,
      "12":5,
      "13":8,
      "14":5,
      "15":6,
      "16":6,
      "17":10,
      "18":6,
      "19":4,
      "20":5,
      "21":6,
      "22":9,
      "23":5,
      "24":6,
      "25":4,
      "26":2,
      "27":7,
      "28":3,
      "29":10,
      "30":4,
      "31":4,
      "32":4
  };
  
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
      return +d[vm._config.z];
    })

  //Resets the map "Municipios" path data to topojson
  vm.municipalities.selectAll("path").data(vm.municipalitiesDefault, function(d){ return d.id; });

}

GeoMexico.prototype.filterByMinMaxStates = function() {
  var vm = this; 

  vm.states.selectAll("path").attr("stroke","#333").attr('stroke-width', 0.2);
  vm.states.selectAll("path").attr("fill", "red");
  vm.states.selectAll("path").attr('data-total', null);
  vm.states.selectAll("path")
    .data(vm._data, function(d){ return d.id; })
    .attr('fill', function(d){
      return vm._getQuantileColor(d);
    })
    .attr('data-total', function(d){
      return +d[vm._config.z];
    })

  //Resets the map "Municipios" path data to topojson
  vm.states.selectAll("path").data(vm.statesDefault, function(d){ return d.id; });

}

GeoMexico.prototype.drawZones = function(){
    var vm = this;

    var mx = mxZones();
    //Call the tip
    vm._chart._svg.call(vm._tip)

    /*  var bounds = mx.bbox;
    vm.projection = d3.geoMercator();

    var b = [];
    b.push( vm.projection([bounds[0], bounds[1]]) );
    b.push( vm.projection([bounds[2], bounds[3]]) );

    //@TODO VALIDATE WIDTH
    var s = .7 / Math.max((b[1][0] - b[0][0]) / vm._chart._width, (b[1][1] - b[0][1]) / vm._chart._height),
    t = [(vm._chart._width - s * (b[1][0] + b[0][0])) / 2, (vm._chart._height - s * (b[1][1] + b[0][1])) / 2];

    vm.projection
        .scale(s)
        .translate(t);
    */


    //@TODO - REVIEW DINAMIC WAY ABOVE
    var tran = [2580, 700];

    vm.projection = d3.geoMercator()
        .scale(1300)
        .translate(tran);
    
    vm.path = d3.geoPath()
        .projection(vm.projection);

    vm.zonesEstados = vm._chart._svg.append("g")
        .attr("id", "zonesEstados")
        .style('display','true')
        .attr("transform", function() {
            return "translate(" + (vm._config.size.translateX) + ",100) scale(" + vm._config.size.scale + ")"
        });

    vm.zones = vm._chart._svg.append("g")
        .attr("id", "zones")
        .style('display', 'true')
        .attr("transform", function() {
            return "translate(" + (vm._config.size.translateX) + ",100) scale(" + vm._config.size.scale + ")"
        });

    vm.zonesEstados.selectAll("path")
        .data(topojson.feature(mx, mx.objects.estados).features, function(d){
            return d.id;
        })
        .enter().append("path")
        .attr("d", d3.geoPath().projection(vm.projection))
        .attr("id", function(d){
            return "state-"+d.id;
        })
        .attr("fill", "white")
        .style("stroke", "#808080")
        .style('stroke-width','0.5px')

    vm.zones.selectAll("path")
        .data(topojson.feature(mx, mx.objects.zonas).features, function(d){
            return d.id = d.properties.id_zona;
        })
        .enter().append("path")
        .attr("d", d3.geoPath().projection(vm.projection))
        .attr("id", function(d){
            return "zone-"+d.id;
        })
        .attr("fill", "#808080")
        .style("stroke", "white")
        .style('stroke-width','0.5px')
        .attr("data-geotype", 'zones')
        .on('mouseover', function(d, i) {
            if (vm._config.data.mouseover) {
                vm._config.data.mouseover.call(this, d, i)
            }
            vm._tip.show(d, d3.select(this).node())
        })
        .on('mouseout', function(d, i) {
            if (vm._config.data.mouseout) {
                vm._config.data.mouseout.call(this, d, i)
            }
            vm._tip.hide(d, d3.select(this).node())
        })
        .on("click", function(d, i) {
            //Marco
            if (vm._config.onclick) {
                vm._config.onclick.call(this, d, i)
            }
            vm.clickedZones(d);
        })
      

    vm.zonesDefault = vm.zones.selectAll("path").data();

    vm.zones.selectAll("path").attr("stroke", "#333").attr('stroke-width', 0.5);
    vm.zones.selectAll("path").attr("fill", "red");
    vm.zones.selectAll("path").attr('data-total', null);
    vm.zones.selectAll("path")
        .data(vm._data, function(d) {
            return parseInt(d.id);
        })
        .attr('fill', function(d) {
            return vm._getQuantileColor(d);
        })
        .attr('data-total', function(d) {
            return +d[vm._config.z];
        })

    //Resets the map "Estados" path data to topojson
    vm.zones.selectAll("path").data(vm.zonesDefault, function(d) {
        return d.id;
    });

    /*vm.states.selectAll("path")
        .data(topojson.feature(mx, mx.objects.states).features, function(d) {
            d.id = d.properties.state_code.toString();
            if(d.id.length === 1) d.id = '0'+d.id;
            return d.id;
        })
        .enter().append("path")
        .attr("d", d3.geoPath().projection(vm.projection))
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
            vm._tip.show(d, d3.select(this).node())
        })
        .on('mouseout', function(d, i) {
            if (vm._config.data.mouseout) {
                vm._config.data.mouseout.call(this, d, i)
            }
            vm._tip.hide(d, d3.select(this).node())
        })
        .on("click", function(d, i) {
            //Marco
            if (vm._config.onclick) {
                vm._config.onclick.call(this, d, i)
            }
            vm.clickedEstado(d);
        })

    vm.statesDefault = vm.states.selectAll("path").data();

    vm.states.selectAll("path").attr("stroke", "#333").attr('stroke-width', 0.2);
    vm.states.selectAll("path").attr("fill", "red");
    vm.states.selectAll("path").attr('data-total', null);
    vm.states.selectAll("path")
        .data(vm._data, function(d) {
            return parseInt(d.id);
        })
        .attr('fill', function(d) {
            return vm._getQuantileColor(d);
        })
        .attr('data-total', function(d) {
            return +d[vm._config.z];
        })

    //Resets the map "Estados" path data to topojson
    vm.states.selectAll("path").data(vm.statesDefault, function(d) {
        return d.id;
    });*/
}

GeoMexico.prototype.clickedZones = function(d) {
    var vm = this;

    vm.edo_zoom = {
      "1":10,
      "2":3,
      "3":3,
      "4":4,
      "5":3,
      "6":10,
      "7":5,
      "8":2,
      "9":12,
      "10":4,
      "11":8,
      "12":5,
      "13":8,
      "14":5,
      "15":6,
      "16":6,
      "17":10,
      "18":6,
      "19":4,
      "20":5,
      "21":6,
      "22":9,
      "23":5,
      "24":6,
      "25":4,
      "26":2,
      "27":7,
      "28":3,
      "29":10,
      "30":4,
      "31":4,
      "32":4
  };
  
    var x, y, k;
    if (d && vm.centeredZones !== d) {
        var centroid = vm.path.centroid(d);
        x = centroid[0];
        y = centroid[1];
        k = 5;
        vm.centeredZones = d;
    } else {
        x = vm.width / 2;
        y = vm.height / 2;
        k = 0.7;
        vm.centeredZones = null;
    }

    vm.zones.selectAll("path")
        .classed("active", vm.centeredZones && function(d) {
            return d === vm.centeredZones;
        });

    vm.zones.transition()
        .duration(750)
        .attr("transform", function() {
            if (vm.centeredZones === null) return "translate(" + (vm._config.size.translateX) + ",100) scale(" + vm._config.size.scale + ")"
            return "translate(" + vm._chart._width / 2 + "," + vm._chart._height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")";
        });

    /*vm.states.transition()
        .duration(750)
        .attr("transform", function() {
            if (vm.centeredZones === null) return "translate(" + (vm._config.size.translateX) + ",100) scale(" + vm._config.size.scale + ")"
            return "translate(" + vm._chart._width / 2 + "," + vm._chart._height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")";
        });*/

}
export default function geoMexico(chart, config) {
  return new GeoMexico(chart, config);

}