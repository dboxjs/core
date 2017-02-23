export default function(config) {

  /*mapConfig
    target: 'ID string'
    zoom:{
      available: bool,
      zoomRange: array of two numbers
    }

    circlesConfig
    minPadding: number
    radius: number
    style:{
      fill: string
      strokeColor: string
      strokeWidth: number
    }


    tipConfig
    classes: string
    content: html

    callbackConfig
    click
    over
    out

  */
  var dataStateLength;

  function MexicoMapRounded(mapConfig,circlesConfig,tipConfig,callbackConfig){

    this._mapConfig = mapConfig;
    this._circlesConfig = circlesConfig;

    this._tipConfig = (tipConfig) ? tipConfig : {};

    if(callbackConfig){
      this._callbackClick =   callbackConfig.click ? callbackConfig.click : null;
      this._callbackOver =   callbackConfig.over ? callbackConfig.over : null;
      this._callbackOut =   callbackConfig.out ? callbackConfig.over : null;
    }

    this._mapLayer = d3.select("#map-wrapper");
    this._tip = d3.tip();

    if(tipConfig){
      this._tip.attr('class', 'd3-tip ' + tipConfig.classes).html(tipConfig.html);
    }else{
      this._tip.attr('class', 'd3-tip').html("<span>I'm a Tip</span>");
    }

    this._zoom = d3.zoom().scaleExtent([1, 5]).on("zoom", this.zoomed);

  }

  MexicoMapRounded.prototype.zoomed = function(){
    this._tip.hide();
    this._mapLayer.attr("transform", d3.event.transform);
  }

  MexicoMapRounded.prototype.drawMap = function(data) {

    this._mapLayer.call(this._zoom).call(tip);

    this._data = d3.nest()
                    .key(function(d) { return d.inegi; })
                    .entries(data);

    this._data.forEach(function(obj,idx){
      dataStateLength = obj.values.length;
      obj.values.forEach(this.drawCircle);
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

    mapLayer.append("circle")
      .attr("cx",centerX + paddingX)
      .attr("cy",centerY + paddingY)
      .attr("r",(this._circlesConfig.radius) ? this._circlesConfig.radius : 2.5)
      .style("fill","red")
      .style('stroke', "white")
      .style('stroke-width','1px')
      .on('click',function(){
        console.log(this,self);
        self.triggerClick();
      })
      .on('mouseover',function(){
        self.triggerOver(item);
      })
      .on('mouseout',function(){
        self.triggerOut(item);
      });
  }

  MexicoMapRounded.prototype.triggerClick = function(item){
    console.log("click",item);
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

}
