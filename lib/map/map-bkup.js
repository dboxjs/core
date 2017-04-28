/*
  Map.prototype = map.prototype = {
    generate:function(){
      var vm = this, q;
      
      vm.init();

      q = vm._chart.loadData();

      q.await(function(error,data){
        if (error) {
          throw error;   
          return false;
        } 

        // @TODO DRAW SVG UNTIL CHART FINISHED LOADING DATA 
        //vm.draw();
        vm._setChartType(); 
        vm.setData(data);
        vm.drawData();
        vm._chart.dispatch.on("load.chart", vm._config.events.load(vm));

      })

    },
    init : function(){
      var vm = this
      vm._chart = chart(vm._config);
    },
    //@TODO DRAW SVG UNTIL CHART FINISHED LOADING DATA 
    //  draw : function(){
    //  var vm = this
    //  vm._chart.draw();
    //},
    _setChartType:function(){
      var vm = this; 

      var params ={
        "config"  : vm._config, 
        "chart"   : vm._chart,
      }

      if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.geo){
        switch(vm._config.plotOptions.map.geo){
          case 'mexico':
            vm.geo = geoMexico(params);
          break;
        }
      }
    },
    setData:function(data){
      var vm = this;
      
      if(vm._config.data.filter){
        data = data.filter(vm._config.data.filter);
      }
    
      vm._data = data;
      vm.quantiles = vm._setQuantile(data);
      vm.minMax = d3.extent(data, function(d) { return d.z; })

      vm._config.plotOptions.map.min = vm.minMax [0];
      vm._config.plotOptions.map.max = vm.minMax [1];

      

      vm.geo._config = vm._config; 
      vm.geo._data = data;
      vm.geo.quantiles = vm.quantiles;
      vm.geo.minMax = vm.minMax
      vm.geo._getQuantileColor = vm._getQuantileColor; 

    },
    _setQuantile: function(data){
      var vm = this; 
      var values = [];
      var quantile = []; 

      if(vm._config.plotOptions.map.quantiles.predefinedQuantiles.length > 0){
        return vm._config.plotOptions.map.quantiles.predefinedQuantiles;
      }

      data.forEach(function(d){      
        values.push(d.z);
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
        //if(total === 0 ){
        //  return d4theme.colors.quantiles[0];//return '#fff';
        //}else if(total <= vm.quantiles[1]){
        //  return d4theme.colors.quantiles[1];//return "#f7c7c5";
        //}
        if(total <= vm.quantiles[1]){
          return vm._config.plotOptions.map.quantiles.colors[0];//"#f7c7c5";
        }
      }

    },
    drawData : function(){
      var vm = this;
      
      if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.geoDivision == 'states'){
        vm.geo.drawStates(); 
      }

      if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.geoDivision == 'municipalities'){
        vm.geo.drawMunicipalities(); 
      }

      vm._drawLegend(); 

    },
    _drawLegend: function(){
      var vm = this; 
      var quantiles = [], legendWidth, legendFill;

      if(typeof vm._config.legend === 'object'){
        legendWidth = vm._config.legend.width ? vm._config.legend.width  : 150; 
        legendFill  = vm._config.legend.fill ? vm._config.legend.fill  : 'white'; 
      }

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

      //START GENERATING SHADOW
      var defs = vm._chart._svg.append("defs");

      var filter = defs.append("filter")
          .attr("id", "drop-shadow")
          .attr("x",0)
          .attr("y",0)
          .attr("height", "120%");

      filter.append("feoffset")
          .attr("in", "SourceGraphic")
          .attr("dx", 5)
          .attr("dy", 5)
          .attr("result", "offOut");

      filter.append("feColorMatrix")
            .attr("result","matrixOut")
            .attr("in","offOut")
            .attr("type","matrix")
            .attr("values","0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.4 0");

      filter.append("feGaussianBlur")
          .attr("in", "matrixOut")        
          .attr("result", "blurOut")
          .attr("stdDeviation", 5);

      filter.append("feblend")
          .attr("in", "SourceGraphic")
          .attr("in2", "blurOut")
          .attr("mode", "normal");

      var feMerge = filter.append("feMerge");

      feMerge.append("feMergeNode")
          .attr("in", "offsetBlur")
      feMerge.append("feMergeNode")
          .attr("in", "SourceGraphic");

      //FINISH GENERATING SHADOW

      vm._chart._legend
        .append('rect')
          .attr('class','back-rect')
          .attr('x', 5)
          .attr('y', (vm._chart._height - (20 * quantiles.length)+ 10) - 20)
          .attr('width', legendWidth + 15)
          .attr('height', (20 * quantiles.length) + 60 )
          .style('fill', legendFill)
          .attr('rx', 5)
          .attr('ry', 5)
          .style("filter", "url(#drop-shadow)")

      vm._chart._legend.selectAll('.rect-info')
        .data(quantiles)
      .enter().append('circle')
        .attr('cx', 28)
        .attr('cy', function(d,i){
          i++;
          var y = (vm._chart._height - (20 * quantiles.length)) + (i*20);
          return y + 25;
        })
        .attr('r', 9)  
        //.enter().append('rect')
        //.attr('class','rect-info')
        //.attr('x', 10)
        //.attr('y', function(d,i){
        //  i++;
        //  var y = (vm._chart._height - (20 * quantiles.length)) + (i*20);
        //  return y;
        //})
        //.attr('width', 18)
        //.attr('height', 18)
        .style('fill', function(d){
          return d.color;
        })
        .style('stroke', '#A7A7A7');


        vm._chart._legend.append('rect')
      .attr('width', legendWidth - 5)
      .attr('height', (20 * quantiles.length) + 17)
      .attr('x', 14)
      .attr('y', (vm._chart._height - (20 * quantiles.length)) + 24)
      .attr('fill', 'rgba(0,0,0,0)')
      .attr('stroke', '#AEADB3')
      .attr('stroke-dasharray', '10,5')
      .attr('stroke-linecap', 'butt')
      .attr('stroke-width', '3')

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
        .attr('x', 43)
        .attr('y', function(d,i){
          i++;
          var y = 15 + (vm._chart._height - (20 * quantiles.length))  + (i*20);
          return y + 15;
        })
        .call(wrap, legendWidth);

        vm._chart._legend
        .append("text")
        .attr("x",10)
        .attr("y",(vm._chart._height - (20 * quantiles.length)) + 12)
        .text(vm._config.legend.title)
        .attr("font-family", "Roboto")
        .attr("font-size", "11px")
        .style("fill","#aeadb3")
        .style("font-weight", "bold")
        .call(wrap, legendWidth);
    }, 
    update :function(config){
      
      var vm = this, q;

      vm._config = config; 
      vm._chart._config = config; 
      

      q = vm._chart.loadData();

      q.await(function(error,data){
        if (error) {
          throw error;   
          return false;
        }  
        vm.setData(data);
        vm.redrawData();
        vm._chart.dispatch.on("load.chart", vm._config.events.load(vm));
      })
      
    }, 
    redrawData: function (){
      
      var vm = this; 

      if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.geoDivision == 'states'){
        vm.geo.redrawStates(); 
      }

      if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.geoDivision == 'municipalities'){
        vm.geo.redrawMunicipalities(); 
      }

      vm._drawLegend(); 
    },
    filterByMinMax: function(minMax){
      var vm = this; 

      vm._config.plotOptions.map.min = minMax[0];
      vm._config.plotOptions.map.max = minMax[1];

      vm.geo._config.plotOptions.map.min = minMax[0];
      vm.geo._config.plotOptions.map.max = minMax[1];


      if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.geoDivision == 'states'){
        vm.geo.filterByMinMaxStates(); 
      }

      
      if(vm._config.plotOptions && vm._config.plotOptions.map && vm._config.plotOptions.map.geoDivision == 'municipalities'){
        vm.geo.filterByMinMaxMunicipalities(); 
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

    vm.geo.resetStates(); 

    
  }

  function wrap(text, width) {

    text.each(function() {
      var text = d3.select(this)

      var dy1 = 0;
      if ((width - text.text().length) < 150){
        dy1 = - 6;
      }

      var words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 8, // ems
          y = text.attr("y"),
          x = text.attr("x"),
          dy = parseFloat(text.attr("y"))/10;        
          var tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy1 + "px");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + "px").text(word).attr("font-size", "11px");
        }
      }
    });
  }
  
  export default function map(config) {
    return new Map(arguments.length ? config : null);
  }
*/