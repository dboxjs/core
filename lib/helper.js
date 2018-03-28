export default function(){
  var vm = this; //hard binded to chart; 

  var Helper = {
    chart: {
      config : vm._config,
      width: vm._width,
      height: vm._height,
      fullSvg : function(){
        return vm._fullSvg;
      },
      svg: function(){
        return vm._svg;
      } 
    },
    utils:{}
  }

  Helper.utils.generateScale = function(data, config){
    var scale = {};
    var domains; 
    if(!config.range) {
      throw 'Range is not defined';
    }
    //Used in bars.js when we want to create a groupBy or stackBy bar chart
    if(config.groupBy && config.groupBy == 'parent'){
      //Axis of type band 
      domains = data.map(function(d) { return d[config.column]; });
    }else if( config.stackBy && config.stackBy == 'parent'){
      domains = data[0].map(function(d) { return d.data[config.column]; });
    }else if(config.groupBy == 'children'){
      //GroupBy Columns
      domains = config.column; 
    }else if(config.groupBy == 'data'){
      //Considering the highest value on all the columns for each groupBy column
      domains = [0, d3.max(data, function(d) { return d3.max(config.column, function(column) { return d[column]; }); })];
    }else if(config.stackBy == 'data'){
      //Using a d3.stack() 
      domains = [0, d3.max(data, function(serie) { return d3.max(serie, function(d) { return d[1]; }) } )];
    }else if(config.groupBy == undefined && config.type == 'band'){
      //In case the axis is of type band and there is no groupby
      domains = data.map(function(d) { return d[config.column]; });
    } else if(config.type === 'linear'){
      //Axis of type numeric
      domains = d3.extent(data, function(d){ return +d[config.column];});
    }else{
      //Axis of type band
      domains = data.map(function(d) { return d[config.column]; });
    }

    if(config.minZero){
      domains = [0, d3.max(data, function(d){ return +d[config.column]; })];
    }
    if (config.domains && Array.isArray(config.domains)){
      domains = config.domains;
    }

    if(config.type){
      switch(config.type){
        case 'linear':
          scale = d3.scaleLinear()
            .rangeRound(config.range)
            .domain(domains);
        break;

        case 'time':
          scale = d3.scaleTime()
            .range(config.range)
            //.domain(domains);
        break;

        case 'ordinal':
          scale = d3.scaleBand()
            .rangeRound(config.range)
            .padding(0.1)
            .domain(domains);
        break;

        case 'band':
        scale = d3.scaleBand()
            .rangeRound(config.range)
            .domain(domains)
            .padding(0.1)
        break;

        case 'quantile':
          scale = d3.scaleBand()
            .rangeRound(config.range)
            .padding(0.1)
            .domain(data.map(function(d){ return d[config.column]}));
          if(!config.bins)
            config.bins = 10;
          scale = d3.scaleQuantile()
            .range(d3.range(config.bins))
        break;

        default:
          scale = d3.scaleLinear()
            .rangeRound(config.range)
            .domain(domains);
        break;
      }
    }else{
      scale = d3.scaleLinear()
            .rangeRound(config.range)
            .domain(domains);
    }

    return scale;
  }

  Helper.utils.format = function(d){
    if(d % 1 == 0){
      return d3.format(",.0f")(d);
    } else if(d < 1 && d > 0) {
      return d3.format(",.2f")(d);
    } else {
      return d3.format(",.1f")(d);
    }
  };

  return Helper
}
