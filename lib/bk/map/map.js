/*
 * Simple Scatter chart
 */
import geoMexico from './geoMexico.js';

export default function(config) {

  function Map(config) {
    var vm = this;
    vm._config = config ? config : {};
    vm._data = [];
    vm._scales = {};
    vm._axes = {};
    vm._tip = d3.tip().attr('class', 'd3-tip');

    vm._centers = {
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

    vm._edo_zoom = {
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

    vm._formatWithZeroDecimals  = d3.format(",.0f");
    vm._formatWithOneDecimal    = d3.format(",.1f");
    vm._formatWithTwoDecimals   = d3.format(",.2f");
    vm._formatWithThreeDecimals = d3.format(",.3f");


    vm._format = {};
    vm._format.total = vm._formatWithZeroDecimals;
    vm._format.percentage = function(d){return d3.format(",.1f")(d) + '%';} ;
    vm._format.change =  d3.format(",.1f");

    vm._geo = null; 
    vm._geoMexico = null;

  }

  //-------------------------------
  //User config functions

  Map.prototype.z = function(col) {
    var vm = this;
    vm._config.z = col;
    return vm;
  }

  Map.prototype.tip = function(tip){
    var vm = this;
    vm._config.tip = tip;
    vm._tip.html(vm._config.tip);
    return vm;
  }

  Map.prototype.onclick = function(onclick){
    var vm = this;
    vm._config.onclick = onclick;
    return vm;
  }

  Map.prototype.end = function() {
    var vm = this;

    //@Todo Review
    vm.setChartType();
    
    return vm._chart;
  }

  //-------------------------------
  //Triggered by the chart.js;
  Map.prototype.chart = function(chart) {
    var vm = this;
    vm._chart = chart;
    return vm;
  }

  Map.prototype.setChartType = function(){
    var vm = this; 

    if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.geo){
      switch(vm._config.plotOptions.map.geo){
        case 'mexico':
          vm._geo = geoMexico(vm._chart, vm._config);
        break;
      }
    }
  },

  Map.prototype.data = function(data) {
    var vm = this;
    
    if(vm._config.data.filter){
      data = data.filter(vm._config.data.filter);
    }
  
    vm._data = data;
    vm._quantiles = vm._setQuantile(data);
    vm._minMax = d3.extent(data, function(d) { return +d[vm._config.z]; })

    vm._config.plotOptions.map.min = vm._minMax [0];
    vm._config.plotOptions.map.max = vm._minMax [1];

    vm._geo._config = vm._config; 
    vm._geo._data = data;
    vm._geo._quantiles = vm._quantiles;
    vm._geo._minMax = vm._minMax
    vm._geo._getQuantileColor = vm._getQuantileColor; 
    return vm;
  }

  Map.prototype.scales = function(s) {
    var vm = this;
    vm._scales = s;
    return vm;
  }

  Map.prototype.axes = function(a) {
    var vm = this;
    vm._axes = a;
    return vm;
  }

  Map.prototype.domains = function() {
    var vm = this;
    return vm;
  };

  Map.prototype.draw  = function(){
    var vm = this;
    
    if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.geoDivision == 'states'){
      vm._geo.drawStates(); 
    }

    if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.geoDivision == 'municipalities'){
      vm._geo.drawMunicipalities(); 
    }

     if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.geoDivision == 'zones'){
      vm._geo.drawZones(); 
    }

    //vm._drawLegend(); 

  }

  Map.prototype._setQuantile = function(data){
    var vm = this; 
    var values = [];
    var quantile = []; 

    if(vm._config.plotOptions.map.quantiles &&  vm._config.plotOptions.map.quantiles.predefinedQuantiles 
        && vm._config.plotOptions.map.quantiles.predefinedQuantiles.length > 0){
      return vm._config.plotOptions.map.quantiles.predefinedQuantiles;
    }

    data.forEach(function(d){      
      values.push(+d[vm._config.z]);
    });

    values.sort(d3.ascending);
    
    //@TODO use quantile scale instead of manual calculations 
    if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.quantiles && vm._config.plotOptions.map.quantiles.buckets){

      if(vm._config.plotOptions.map.quantiles.ignoreZeros === true){
        var aux = _.dropWhile(values, function(o) { return o <= 0 });
        //aux.unshift(values[0]);  

        quantile.push(values[0]);
        quantile.push(0);
        
        for(var i = 1; i <= vm._config.plotOptions.map.quantiles.buckets - 1; i++ ){        
          quantile.push( d3.quantile(aux,  i* 1/(vm._config.plotOptions.map.quantiles.buckets - 1) ) )
        }

      }else{
        quantile.push( d3.quantile(values, 0) )
        for(var i = 1; i <= vm._config.plotOptions.map.quantiles.buckets; i++ ){        
          quantile.push( d3.quantile(values,  i* 1/vm._config.plotOptions.map.quantiles.buckets ) )
        }
      }


        
    }else{
      quantile = [ d3.quantile(values, 0), d3.quantile(values, 0.2), d3.quantile(values, 0.4), d3.quantile(values, 0.6), d3.quantile(values, 0.8), d3.quantile(values,1) ];
    }
   
    //@TODO - VALIDATE WHEN ZEROS NEED TO BE PUT ON QUANTILE 1 AND RECALCULATE NON ZERO VALUES INTO THE REST OF THE BUCKETS
    if( vm._config.plotOptions.map.quantiles && vm._config.plotOptions.map.quantiles.buckets 
        && vm._config.plotOptions.map.quantiles.buckets === 5){

      if( quantile[1] === quantile[2] && quantile[2] === quantile[3] && quantile[3] === quantile[4] && quantile[4] === quantile[5]){
        quantile = [ d3.quantile(values, 0), d3.quantile(values, 0.2) ];
      }
    }
   
    return quantile;
  }

  Map.prototype._getQuantileColor = function(d){
    var vm = this; 
    var total = parseFloat(d[vm._config.z]);

    //@TODO use quantile scale instead of manual calculations 
    if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.quantiles && vm._config.plotOptions.map.quantiles.colors){
      if(vm._quantiles.length > 2){

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

        if(total <= vm._quantiles[1]){
          return vm._config.plotOptions.map.quantiles.colors[0];//"#f7c7c5";
        }else if(total <= vm._quantiles[2]){
          return vm._config.plotOptions.map.quantiles.colors[1];//"#e65158";
        }else if(total <= vm._quantiles[3]){
          return vm._config.plotOptions.map.quantiles.colors[2];//"#c20216";
        }else if(total <= vm._quantiles[4]){
          return vm._config.plotOptions.map.quantiles.colors[3];//"#750000";
        }else if(total <= vm._quantiles[5]){
          return vm._config.plotOptions.map.quantiles.colors[4];//"#480000";
        }

      }
    }

    if(vm._quantiles.length == 2){
      /*if(total === 0 ){
        return d4theme.colors.quantiles[0];//return '#fff';
      }else if(total <= vm._quantiles[1]){
        return d4theme.colors.quantiles[1];//return "#f7c7c5";
      }*/
      if(total <= vm._quantiles[1]){
        return vm._config.plotOptions.map.quantiles.colors[0];//"#f7c7c5";
      }
    }

  }



 return new Map(config);
}