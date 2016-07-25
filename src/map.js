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
    vm._data = data;
    vm.quantile = vm._setQuantile(data);
  },
  _setQuantile: function(data){
    var vm = this; 
    var values = [];

    data.forEach(function(d){
      values.push(d.z);
    });

    values.sort(d3.ascending);

    var quantile = [ d3.quantile(values, 0), d3.quantile(values, 0.2), d3.quantile(values, 0.4), d3.quantile(values, 0.6), d3.quantile(values, 0.8), d3.quantile(values,1) ];

    if( quantile[1] === quantile[2] && quantile[2] === quantile[3] && quantile[3] === quantile[4] && quantile[4] === quantile[5]){
      quantile = [ d3.quantile(values, 0), d3.quantile(values, 0.2) ];
    }

    return quantile;
  },
  _getQuantileColor: function(d){
    var vm = this; 
    var total = parseFloat(d.z);

    if(vm.quantile.length > 2){
     /* if(total === 0 ){
        return d4theme.colors.quantiles[0];//'#fff';
      }else if(total <= vm.quantile[1]){
        return d4theme.colors.quantiles[1];//return "#f7c7c5";
      }else if(total <= vm.quantile[2]){
        return d4theme.colors.quantiles[2];//return "#e65158";
      }else if(total <= vm.quantile[3]){
        return d4theme.colors.quantiles[3];//return "#c20216";
      }else if(total <= vm.quantile[4]){
        return d4theme.colors.quantiles[4];//return "#750000";
      }else if(total <= vm.quantile[5]){
        return d4theme.colors.quantiles[5];//return "#480000";
      }*/

      if(total <= vm.quantile[1]){
        return "#f7c7c5";
      }else if(total <= vm.quantile[2]){
        return "#e65158";
      }else if(total <= vm.quantile[3]){
        return "#c20216";
      }else if(total <= vm.quantile[4]){
        return "#750000";
      }else if(total <= vm.quantile[5]){
        return "#480000";
      }

    }

    if(vm.quantile.length == 2){
      /*if(total === 0 ){
        return d4theme.colors.quantiles[0];//return '#fff';
      }else if(total <= vm.quantile[1]){
        return d4theme.colors.quantiles[1];//return "#f7c7c5";
      }*/
      if(total <= vm.quantile[1]){
        return d4theme.colors.quantiles[1];//return "#f7c7c5";
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
          return "translate(225,170) scale(0.699999988079071,0.699999988079071)";
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
            return "edo_"+d.inegi;
        })
        .attr("fill", "#808080")
        .style("stroke", "white")
        .style('stroke-width','1px')

      vm.statesDefault = vm.states.selectAll("path").data();

      vm.states.selectAll("path").attr("stroke","#333").attr('stroke-width', 0.2);
      vm.states.selectAll("path").attr("fill", "red");
      vm.states.selectAll("path").attr('data-total', null);
      vm.states.selectAll("path")
          .data(vm._data, function(d){ console.log(d); return d.id; })
          .attr('fill', function(d){
            var pass = true; //minMaxRange(d);
            if(pass === true){
              return vm._getQuantileColor(d);
            }else{
              return '#a8668c';
            }
          })
          .attr('data-total', function(d){
            return d.z;
          })
          .attr('stroke-width', 1 )
          .attr('stroke', '#ff0000');

      //Resets the map "Estados" path data to topojson
      vm.states.selectAll("path").data(vm.statesDefault, function(d){ return d.id; });
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

    vm._chart._svg.selectAll('.dot')
      .each(function(d){
        if(d.x === selector || d.y === selector){
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

export default function map(config) {
  return new Map(arguments.length ? config : null);
}
