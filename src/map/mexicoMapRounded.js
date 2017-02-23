var dataStateLength;

export default function MexicoMapRounded(mapConfig,circlesConfig,tipConfig,callbackConfig) {

    this._mapConfig = mapConfig;
    /*mapConfig
    target: 'ID string'
    zoom:{
      available: bool,
      zoomRange: array of two numbers
    }*/

    this._circlesConfig = circlesConfig;

    /*circlesConfig
    minPadding: number
    radius: number
    style:{
      fill: string
      strokeColor: string
      strokeWidth: number
    }*/

    this._tipConfig = (tipConfig) ? tipConfig : {};

    /*tipConfig
    classes: string
    html: string*/

    if(callbackConfig){
      this._callbackClick =   callbackConfig.click ? callbackConfig.click : null;
      this._callbackOver =   callbackConfig.over ? callbackConfig.over : null;
      this._callbackOut =   callbackConfig.out ? callbackConfig.out : null;
    }

    /*
      callbackConfig
      click
      over
      out
    */

    this._mapLayer = d3.select(this._mapConfig.target);
    this._tip = d3.tip();

    if(tipConfig){
      this._tip.attr('class', 'd3-tip ' + tipConfig.classes).html(tipConfig.html);
    }else{
      this._tip.attr('class', 'd3-tip').html("<span>I'm a Tip</span>");
    }

    var self = this;

    this._zoom = d3.zoom().scaleExtent(this._mapConfig.zoom.zoomRange).on("zoom",function(){
      self.zoomed();
    });

}


MexicoMapRounded.prototype.zoomed = function(){
  this._tip.hide();
  this._mapLayer.attr("transform", d3.event.transform);
}

MexicoMapRounded.prototype.drawMap = function(data) {

  this._mapLayer.call(this._zoom);
  this._mapLayer.call(this._tip);

  this._data = d3.nest()
                  .key(function(d) { return d.inegi; })
                  .entries(data);

  var self = this;
  this._data.forEach(function(obj,idx){

    dataStateLength = obj.values.length;
    obj.values.forEach(function(item,index){

      self.drawCircle(item,index);

    });

  });

};


MexicoMapRounded.prototype.drawCircle = function(item,index){

  var bbox,center;

  var max,min = (this._circlesConfig.minPadding) ? this._circlesConfig.minPadding : 5;
  var paddingX, paddingY,centerX,centerY;

  bbox = d3.select("#est_"+item.inegi).node().getBBox();

  max = bbox.width;

  paddingX = (dataStateLength > 1) ? Math.floor(Math.random()*(max-min+1) + min)/4 : 0;

  max = bbox.height;

  paddingY = (dataStateLength > 1) ? Math.floor(Math.random()*(max-min+1) + min)/4 : 0;

  centerY = (bbox.y + bbox.height/2);
  centerX = (bbox.x + bbox.width/2);

  var self = this;

  this._mapLayer.append("circle")
    .attr("cx",centerX + paddingX)
    .attr("cy",centerY + paddingY)
    .attr("r",(self._circlesConfig.radius) ? self._circlesConfig.radius : 2.5)
    .style("fill",self._circlesConfig.style.fill)
    .style('stroke', self._circlesConfig.style.strokeColor)
    .style('stroke-width',self._circlesConfig.style.strokeWidth + "px")
    .on('click',function(){
      self.triggerClick(item);
    })
    .on('mouseover',function(){
      self.triggerOver(item);
    })
    .on('mouseout',function(){
      self.triggerOut(item);
    });
}

MexicoMapRounded.prototype.triggerClick = function(item){
  if(this._callbackClick){
    this._callbackClick(item);
  }
}

MexicoMapRounded.prototype.triggerOver = function(item){

  this._tip.show(item);
  if(this._callbackOver){
    this._callbackOver(item);
  }
}

MexicoMapRounded.prototype.triggerOut = function(item){
  this._tip.hide();
  if(this._callbackOut){
    this._callbackOut(item);
  }
}

MexicoMapRounded.prototype.setTipHtml = function(content){
  this._tip.html(content);
}
