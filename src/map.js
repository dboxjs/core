import chart from './chart.js';
import mxStates from './map/mxStates.js';

function Map(config) {
  var vm = this;
  vm._config = config; 
  vm._chart; 
  vm._scales = {}; 
  vm._axes = {};

  vm.centers = {
    "Aguascalientes":"1006",
    "Baja California":"2001",
    "Baja California Sur":"3009",
    "Campeche":"4009",
    "Coahuila de Zaragoza":"5021",
    "Colima":"6002",
    "Chiapas":"7094",
    "Chihuahua":"8004",
    "Distrito Federal":"9009",
    "Durango":"10028",
    "Guanajuato":"11003",
    "Guerrero":"12042",
    "Hidalgo":"13037",
    "Jalisco":"14093",
    "México":"15121",
    "Michoacán de Ocampo":"16079",
    "Morelos":"17030",
    "Nayarit":"18015",
    "Nuevo León":"19013",
    "Oaxaca":"20325",
    "Puebla":"21170",
    "Querétaro":"22015",
    "Quintana Roo":"23002",
    "San Luis Potosí":"24017",
    "Sinaloa":"25006",
    "Sonora":"26066",
    "Tabasco":"27012",
    "Tamaulipas":"28035",
    "Tlaxcala":"29011",
    "Veracruz de Ignacio de la Llave":"30192",
    "Yucatán":"31097",
    "Zacatecas":"32010"
  };

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



  vm.formatWithZeroDecimals  = d3.format(",.0f");
  vm.formatWithTwoDecimals   = d3.format(",.2f");
  vm.formatWithThreeDecimals = d3.format(",.3f");


  vm.format = {};
  vm.format.total = vm.formatWithZeroDecimals
  vm.format.percentage = function(d){return d3.format(",.1f")(d) + '%';}
  vm.format.change =  d3.format(",.1f");


}

Map.prototype = map.prototype = {
	generate:function(){
		var vm = this, q;
		
		vm.draw();
		vm.setScales();
		vm.setAxes();

		q = vm._chart.loadData();

    q.await(function(error,data){
      if (error) {
        throw error;	 
        return false;
      } 

      vm.setData(data);
      vm.setDomains();
      vm.drawAxes();
      vm.drawData();
    })

	},
	draw : function(){
		var vm = this
		vm._chart = chart(vm._config);
	},
	setScales: function(){
		var vm = this;
    vm._scales = vm._chart.setScales();
		
	}, 
	setAxes : function(){
		
	},
	setData:function(data){
    var vm = this;
    
    if(vm._config.data.filter){
      data = data.filter(vm._config.data.filter);
    }
  
    vm._data = data;
    
    vm.quantiles = vm._setQuantile(data);
    vm.minMax = d3.extent(data, function(d) { return d.z; })
  },
  _setQuantile: function(data){
    var vm = this; 
    var values = [];
    var quantile = []; 

    data.forEach(function(d){
      values.push(d.z);
    });

    values.sort(d3.ascending);

    //@TODO use quantile scale instead of manual calculations 
    if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.quantiles && vm._config.plotOptions.map.quantiles.buckets){
        quantile.push( d3.quantile(values, 0) )
      for(var i = 1; i <= vm._config.plotOptions.map.quantiles.buckets; i++ ){
        quantile.push( d3.quantile(values,  i* 1/vm._config.plotOptions.map.quantiles.buckets ) )
      }
    }else{
      quantile = [ d3.quantile(values, 0), d3.quantile(values, 0.2), d3.quantile(values, 0.4), d3.quantile(values, 0.6), d3.quantile(values, 0.8), d3.quantile(values,1) ];
    }
   
    //@TODO - VALIDATE WHEN ZEROS NEED TO BE PUT ON QUANTILE 1 AND RECALCULATE NON ZERO VALUES INTO THE REST OF THE BUCKETS
    if( vm._config.plotOptions.map.quantiles.buckets === 5){
      if( quantile[1] === quantile[2] && quantile[2] === quantile[3] && quantile[3] === quantile[4] && quantile[4] === quantile[5]){
        quantile = [ d3.quantile(values, 0), d3.quantile(values, 0.2) ];
      }
    }
   

    return quantile;
  },
  _getQuantileColor: function(d){
    var vm = this; 
    var total = parseFloat(d.z);


    //@TODO use quantile scale instead of manual calculations 
    if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.quantiles && vm._config.plotOptions.map.quantiles.colors){
      if(vm.quantiles.length > 2){


        if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.min !== undefined && vm._config.plotOptions.map.max !== undefined){
          if(total < vm._config.plotOptions.map.min || total > vm._config.plotOptions.map.max){
            console.log('outOfRangeColor', total, vm._config.plotOptions.map.min ,vm._config.plotOptions.map.max)
            return vm._config.plotOptions.map.quantiles.outOfRangeColor; 
          }
        }else{
          if(total < vm.minMax[0] || total > vm.minMax[1]){
            console.log('outOfRangeColor', total, vm._config.plotOptions.map.min ,vm._config.plotOptions.map.max)
            return vm._config.plotOptions.map.quantiles.outOfRangeColor; 
          }
        }

        if(total <= vm.quantiles[1]){
          return vm._config.plotOptions.map.quantiles.colors[0];//"#f7c7c5";
        }else if(total <= vm.quantiles[2]){
          return vm._config.plotOptions.map.quantiles.colors[1];//"#e65158";
        }else if(total <= vm.quantiles[3]){
          return vm._config.plotOptions.map.quantiles.colors[2];//"#c20216";
        }else if(total <= vm.quantiles[4]){
          return vm._config.plotOptions.map.quantiles.colors[3];//"#750000";
        }else if(total <= vm.quantiles[5]){
          return vm._config.plotOptions.map.quantiles.colors[4];//"#480000";
        }

      }
    }

    if(vm.quantiles.length == 2){
      /*if(total === 0 ){
        return d4theme.colors.quantiles[0];//return '#fff';
      }else if(total <= vm.quantiles[1]){
        return d4theme.colors.quantiles[1];//return "#f7c7c5";
      }*/
      if(total <= vm.quantiles[1]){
        return vm._config.plotOptions.map.quantiles.colors[0];//"#f7c7c5";
      }
    }

  },
  setDomains:function(){
    var vm = this;
  },
  drawAxes:function(){
    var vm = this;
  },
  drawData : function(){
    var vm = this;
    var tran = [2580, 700];

    vm.projection = d3.geo.mercator()
        .scale(1300)
        .translate(tran);

    vm.path = d3.geo.path()
      .projection(vm.projection);

    if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.geoType == 'states'){
      vm.states = vm._chart._svg.append("g")
        .attr("id", "states")
        .style('display','true')
        .attr("transform", function(){
          //return "translate("+(vm._chart._width*.2) +",100) scale(0.9,0.9)"
          return "translate("+(vm._config.size.translateX) +",100) scale("+vm._config.size.scale+")"
        });

      var mx = mxStates();    
      vm.states.selectAll("path")
        .data(topojson.feature(mx, mx.objects.states).features, function(d){
            d.id = parseInt(d.properties.state_code);
            return d.id;
        })
        .enter().append("path")
        .attr("d", d3.geo.path().projection(vm.projection))
        .attr("id", function(d){
            return "state-"+d.id;
        })
        .attr("data-geotype", 'states')
        .attr("fill", "#808080")
        .style("stroke", "white")
        .style('stroke-width','1px')
        .on('mouseover', function(d,i){
          if(vm._config.data.mouseover){
            vm._config.data.mouseover.call(this, d,i)
          }
          vm._chart._tip.show(d, d3.select(this).node())
        })
        .on('mouseout',function(d,i){
          if(vm._config.data.mouseout){
            vm._config.data.mouseout.call(this,d,i)
          }
          vm._chart._tip.hide(d, d3.select(this).node())
        })
        .on("click", function(d){
          if(vm._config.data.click){
            vm._config.data.click.call(this, d,i)
          }
          vm.clickedEstado(d);
        })

      vm.statesDefault = vm.states.selectAll("path").data();

      vm.states.selectAll("path").attr("stroke","#333").attr('stroke-width', 0.2);
      vm.states.selectAll("path").attr("fill", "red");
      vm.states.selectAll("path").attr('data-total', null);
      vm.states.selectAll("path")
          .data(vm._data, function(d){ return d.id; })
          .attr('fill', function(d){
            return vm._getQuantileColor(d);
          })
          .attr('data-total', function(d){
            return d.z;
          })
          .attr('stroke-width', 1 )
          .attr('stroke', '#ff0000');

      //Resets the map "Estados" path data to topojson
      vm.states.selectAll("path").data(vm.statesDefault, function(d){ return d.id; });

      vm._drawLegend(); 

      vm._chart.dispatch.on("load.chart", vm._config.events.load(vm));
    }

  },
  _drawLegend: function(){
    var vm = this; 
    var quantiles = [];

    vm._chart._svg.select('.legend').remove();
    vm._chart._legend = vm._chart._svg.append('g')
              .classed('legend',true);

    vm.quantilesWithFormat = []; 

    vm.quantiles.forEach(function(q){
      vm.quantilesWithFormat.push(vm.format[vm._config.plotOptions.map.units](q))
    })

    //@Todo - Make it dynamic according to the buckets number in the config
    if(vm.quantiles.length>2){
      quantiles = [
        {color: vm._config.plotOptions.map.quantiles.outOfRangeColor, value: 'Fuera de rango seleccionado', text: 'Fuera de rango seleccionado' },
        //@TODO - ADD NA VALUES --- {color: '#808080', value: 'N/A' },
        {color: vm._config.plotOptions.map.quantiles.colors[0], value: vm.quantiles[1], text: vm.quantilesWithFormat[0] +' a '+ vm.quantilesWithFormat[1] },
        {color: vm._config.plotOptions.map.quantiles.colors[1], value: vm.quantiles[2], text: vm.quantilesWithFormat[1] +' a '+ vm.quantilesWithFormat[2] },
        {color: vm._config.plotOptions.map.quantiles.colors[2], value: vm.quantiles[3], text: vm.quantilesWithFormat[2] +' a '+ vm.quantilesWithFormat[3] },
        {color: vm._config.plotOptions.map.quantiles.colors[3], value: vm.quantiles[4], text: vm.quantilesWithFormat[3] +' a '+ vm.quantilesWithFormat[4] },
        {color: vm._config.plotOptions.map.quantiles.colors[4], value: vm.quantiles[5], text: vm.quantilesWithFormat[4] +' a '+ vm.quantilesWithFormat[5] },
      ];
    }

    vm._chart._legend.selectAll('.back-rect')
        .data(quantiles)
      .enter().append('rect')
        .attr('class','back-rect')
        .attr('x', 5)
        .attr('y', 275)
        .attr('width', 255)
        .attr('height', 140)
        .style('fill', 'white');

    vm._chart._legend.selectAll('.rect-info')
      .data(quantiles)
    .enter().append('rect')
      .attr('class','rect-info')
      .attr('x', 10)
      .attr('y', function(d,i){
        i++;
        var y = (vm._chart._height - (20 * quantiles.length)) + (i*20);
        return y;
      })
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', function(d){
        return d.color;
      })
      .style('stroke', '#333');


    vm._chart._legend.selectAll('text')
       .data(quantiles)
    .enter().append('text')
      .text(function(d, i){

       return d.text ;

      })
      .attr("font-family", "Roboto")
      .attr("font-size", "12pts")
      .style("fill","#aeadb3")
      .style("font-weight", "bold")
      .attr('x', 30)
      .attr('y', function(d,i){
        i++;
        var y = 15 + (vm._chart._height - (20 * quantiles.length))  + (i*20);
        return y;
      });
  }, 
  update :function(config){

    var vm = this, q;

    vm._config = config; 
    vm._chart._config = config; 
    
    vm.setScales();
    vm.setAxes();

    q = vm._chart.loadData();

    q.await(function(error,data){
      if (error) {
        throw error;   
        return false;
      } 

      vm.setData(data);
      vm.setDomains();
      vm.drawAxes();
      vm.redrawData();
    })
    
  }, 
  redrawData: function (){
    
    var vm = this; 

    if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.geoType == 'states'){
      vm.states.selectAll("path").attr("stroke","#333").attr('stroke-width', 0.2);
      vm.states.selectAll("path").attr("fill", "red");
      vm.states.selectAll("path").attr('data-total', null);
      vm.states.selectAll("path")
          .data(vm._data, function(d){ return d.id; })
          .attr('fill', function(d){
            return vm._getQuantileColor(d);
          })
          .attr('data-total', function(d){
            return d.z;
          })
          .attr('stroke-width', 1 )
          .attr('stroke', '#ff0000');

      //Resets the map "Estados" path data to topojson
      vm.states.selectAll("path").data(vm.statesDefault, function(d){ return d.id; });

      vm._drawLegend(); 

      vm._chart.dispatch.on("load.chart", vm._config.events.load(vm));
    }
  },
  set: function(option,value){
    var vm = this; 
    if(option === 'config') {
      vm._config = value; 
    }else{
      vm._config[option] = value ; 
    }
  }, 
  select:function(selector){
    var vm = this;
    var select = false; 

    vm._chart._svg.selectAll('path')
      .each(function(d){
        if(d.id === selector){
          select = d3.select(this); 
        }
      });

    return select; 
  },
  triggerMouseOver:function(selector){
    var vm = this; 
   
    vm._chart._svg.selectAll('circle')
      .each(function(d){
        if(d.x === selector || d.y === selector || d.z === selector){
          vm._chart._tip.show(d,d3.select(this).node())
        }
      })
  },
  triggerMouseOut:function(selector){
    var vm = this; 
   
    vm._chart._svg.selectAll('circle')
      .each(function(d){
        if(d.x === selector || d.y === selector || d.z === selector){
          vm._chart._tip.hide(d,d3.select(this).node())
        }
      })
  },
  redraw: function(){
    var vm = this;
    vm._chart.destroy(); 
    vm.generate();
  }

}

Map.prototype.resetStates = function(){
  var vm = this; 

  vm.states.transition()
      .duration(750)
      .attr("transform", function(){
        return "translate("+(vm._chart._width*.2) +",100) scale("+vm._config.size.scale+")"      
      });
}

//@Todo - upgrade to a general function for all geotypes; Upgrade from pnud.data4.mx
Map.prototype.clickedEstado = function(d) {
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

      // if (ancho < 600){
      //   k = 0.3500000238418579;
      // }
      vm.centered = null;
    }

    vm.states.selectAll("path")
        .classed("active", vm.centered && function(d) { return d === vm.centered; });

    vm.states.transition()
        .duration(750)
        .attr("transform", function(){
            if(vm.centered === null) return "translate("+(vm._chart._width*.2) +",100) scale("+vm._config.size.scale+")"
            return "translate(" + vm._chart._width / 2 + "," + vm._chart._height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")";
        
        });

}

export default function map(config) {
  return new Map(arguments.length ? config : null);
}
