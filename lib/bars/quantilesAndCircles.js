/*eslint-disable*/
function QuantilesAndCircles(options) {
  var vm = this;
  vm._config = options.config; 
  vm._chart  = options.chart; 
  vm._data   = options.data; 
  vm._scales = options.scales; 
}

QuantilesAndCircles.prototype.getAverages = function(){
    var vm = this;

    var auxArray = [], auxArray2= [];   
    var idx = 0;
    var averageArray = [];
      vm._data.forEach(function(d){

        auxArray2.push(d.y);
        auxArray[idx] = auxArray2;

        if(vm._scales.q(d.x) != idx){
          auxArray2 = [];
          idx = vm._scales.q(d.x);
        }       


       /* if(vm._scales.q(d.x) == idx){
          auxArray2.push(d.y);
          auxArray[idx] = auxArray2;
        }else{        
          auxArray2.push(d.y);
          auxArray[idx] = auxArray2;
          auxArray2 = [];
          idx = vm._scales.q(d.x)         
        }       
      */
      })

      //console.log(auxArray);
      
      auxArray.forEach(function(d,i){
        averageArray[i] = {y:d3.mean(d),x:i};
      });

      //console.log(averageArray);
      return averageArray;      
  }


QuantilesAndCircles.prototype.draw = function (){
    var vm = this;
    var averages = [];

    averages = this.getAverages();

     vm._chart._svg.selectAll(".recta")
      .data(averages)
    .enter().append("rect")
      .attr("class", "recta")
      .attr("x", function(d) {
        return vm._scales.x ( d.x ) + vm._scales.x.rangeBand()/16; 
      })
      .attr("y", function(d){
        return vm._scales.y(d.y);
      })
      .attr("width",vm._scales.x.rangeBand())
      .attr("height",function(d){
        return vm._scales.y(0) - vm._scales.y(d.y);       
      })
      .style("fill", '#f4f4f4')
      .on('mouseover', function(d,i){
        //vm._config.data.mouseover.call(vm, d,i);
      });

    vm._chart._svg.selectAll(".recta2")
      .data(averages)
    .enter().append("rect")
      .attr("class", "recta2")
      .attr("x", function(d) {
        //console.log("x",d.x)
        return vm._scales.x ( d.x ) + vm._scales.x.rangeBand()/16; 
      })

      .attr("y", function(d){
        return vm._scales.y(d.y);
      })
      .attr("width",vm._scales.x.rangeBand())
      .attr("height",function(d){
        return 5;       
      })
      .style("fill", '#ffcd32');


          /*.text(function(d){
            console.log(d);
            return d.country
          })
          .style("fill", '#000');*/

 



    vm._chart._svg.selectAll(".dot")
      .data(vm._data,function(d){
        return d.key;
      })
    .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("r", 12)
      .attr("cx", function(d) { //console.log('X',d.x, vm._scales.q(d.x));
        return vm._scales.x ( vm._scales.q(d.x) ) +vm._scales.x.rangeBand()/2; })
      .attr("cy", function(d) { return vm._scales.y(d.y); })
      .style("fill", '#b4b4b4')
      .style("fill-opacity",'0.4')
      .on('mouseover', function(d,i){
        vm._config.data.mouseover.call(this, d,i);
      });

     vm._chart._svg.selectAll(".dot2")
      .data(vm._data,function(d){
        return d.key;
      })
    .enter()
      .append("circle")
      .attr("class", "dot2")
      .attr("r", 8)
      .attr("cx", function(d) { //console.log('X',d.x, vm._scales.q(d.x));
        return vm._scales.x ( vm._scales.q(d.x) ) +vm._scales.x.rangeBand()/2; })
      .attr("cy", function(d) { return vm._scales.y(d.y); })
      .style("fill", '#7f7f7f')
      .style("fill-opacity",'0.4')
      .on('mouseover', function(d,i){
        vm._config.data.mouseover.call(vm, d,i);
      });


    /*vm._chart._svg.selectAll('line.stem')
        .data(vm._data)
      .enter()
        .append('line')
        .classed('stem', true)
        .attr('x1', function(d){
          return vm._scales.x(d.x)+vm._scales.x.range()/2;
        })
        .attr('x2', function(d){
          return vm._scales.x(d.x)+vm._scales.x.range()/2;
        })
        .attr('y1', function(d){
          return vm._scales.y(d.y);
        })
        .attr('y2', vm._chart._height)
        .attr('stroke', '#7A7A7A')*/

    vm._chart._svg.selectAll('circle')
        .data(vm._data)
      .enter()
        .append('circle')
        .attr('cx', function(d) {
          return vm._scales.x(d.x);
        })
        .attr('cy', function(d) {
          return vm._scales.y(d.y);
        })
        .attr('r', 6)
        .attr('fill', '#ccc')
        .style('cursor', 'pointer')

  }


QuantilesAndCircles.prototype.renameAxis = function (axis){
    var vm = this;

    console.log('Domain',vm._scales.q.domain().length)
        console.log('Range',vm._scales.q.range())
        console.log('Treshold',vm._scales.q.quantiles());   
    
    var rangeValues = vm._scales.q.range();
    var domainValues = vm._scales.q.domain();
    var treshold = vm._scales.q.quantiles();    
    axis.selectAll("text")  
      .text(function(d){        
        if(treshold[d] == undefined){
          return treshold[d - 1].toFixed(2) + " - " + d3.max(domainValues).toFixed(2);
        }
        if(d==0){
                  return d3.min(domainValues).toFixed(2) + " - " + treshold[d].toFixed(2);    
        }
        
        return treshold[d - 1].toFixed(2) + " - " + treshold[d].toFixed(2);
      })

    
  }

export default function quantilesAndCircles(options) {
  return new QuantilesAndCircles(arguments.length ? options : null);
}
/*eslint-enable*/