import carto from './carto/carto.js';
import Helper from './helper.js';

import * as d3 from 'd3';
import * as _ from 'lodash';

/*
 * Dbox Chart core
 */
export default function (config) {

  var Chart = {};

  Chart.init = function (config) {
    var vm = this;

    var defaultConfig = {
      size: {
        width: 800,
        height: 600,
        margin: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      }
    };

    var defaultStyle = {
      chart: {
        backgroundColor : {
          color: '#2A2A2A',
          linearGradient : { x1: 0, y1: 0, x2: 1, y2: 1 },
          stops: [
            [0, '#FCFCFC'],
            [1, '#F3F2F2']
          ]
        }
      },
      yAxis: {
        enabled: true,
        axis: {
          strokeWidth: 3,
          strokeColor: '#5F6C6C',
          strokeOpacity: 0,
          paddingTick: 0,
        },
        ticks: {
          strokeWidth: 3,
          strokeColor: '#929D9E',
          grid: 'dashed',
          gridDashed: '3, 5'
        },
        labels: {
          fontSize: 12,
          fontWeight: 600,
          textColor: '#fff',
          textAnchor: 'middle'
        }
      },
      xAxis: {
        enabled: true,
        axis: {
          strokeWidth: 3,
          strokeColor: '#5F6C6C',
          strokeOpacity: 1,
          paddingTick: 5,
        },
        ticks: {
          strokeWidth: 1,
          strokeColor: '#5F6C6C',
        },
        labels: {
          fontSize: 12,
          fontWeight: 600,
          textColor: '#fff',
          textAnchor: 'middle'
        }
      } 
    };

    vm._config = config ? _.cloneDeep(config) : defaultConfig;


    vm._data = [];
    vm._margin = vm._config.size.margin;
    vm._addStyle = config.addStyle ? config.addStyle : defaultStyle;

    //Define width and height
    vm._width = vm._config.size.width - vm._margin.left - vm._margin.right;
    vm._height = vm._config.size.height - vm._margin.top - vm._margin.bottom;
    vm._svg = '';
    vm._scales = {};
    vm._axes = {};

    //Public
    vm.layers = [];

    //Helper data/functions for layers to use
    vm.helper = Helper.bind(vm)();
  };

  //------------------------
  //User
  Chart.config = function (config) {
    var vm = this;
    vm._config = _.cloneDeep(config);
    return vm;
  };

  Chart.size = function (sizeObj) {
    var vm = this;
    if (sizeObj) {
      if (sizeObj.margin) {
        if (sizeObj.margin.left == Number(sizeObj.margin.left)) {
          vm._config.size.margin.left = sizeObj.margin.left;
          vm._margin.left = sizeObj.margin.left;
        }
        if (sizeObj.margin.right == Number(sizeObj.margin.right)) {
          vm._config.size.margin.right = sizeObj.margin.right;
          vm._margin.right = sizeObj.margin.right;
        }
        if (sizeObj.margin.top == Number(sizeObj.margin.top)) {
          vm._config.size.margin.top = sizeObj.margin.top;
          vm._margin.top = sizeObj.margin.top;
        }
        if (sizeObj.margin.bottom == Number(sizeObj.margin.bottom)) {
          vm._config.size.margin.bottom = sizeObj.margin.bottom;
          vm._margin.bottom = sizeObj.margin.bottom;
        }
      }
      if (sizeObj.width == Number(sizeObj.width)) {
        vm._config.size.width = sizeObj.width;
        vm._width = sizeObj.width;
      }
      if (sizeObj.height == Number(sizeObj.height)) {
        vm._config.size.height = sizeObj.height;
        vm._height = sizeObj.height;
      }
    }
    return vm;
  };

  Chart.grid = function (bool) {
    var vm = this;
    vm._config.grid = bool ? true : false;
    return vm;
  };

  Chart.bindTo = function (selector) {
    var vm = this;
    vm._config.bindTo = selector;
    return vm;
  };

  Chart.data = function (data) {
    var vm = this;
    if (vm._config.data !== undefined) {
      vm._config.data = Object.assign({}, vm._config.data, data);
    } else {
      vm._config.data = data;
    }
    return vm;
  };

  Chart.legend = function (legend) {
    var vm = this;
    vm._config.legend = legend;
    return vm;
  };

  Chart.legendType = function (legendType) {
    var vm = this;
    vm._config.legendType = legendType;
    return vm;
  };

  Chart.legendTitle = function (legendTitle) {
    var vm = this;
    vm._config.legendTitle = legendTitle;
    return vm;
  };

  Chart.layer = function (_layer, _config) {
    var vm = this;
    var layer;
    var config = _config ? _config : vm._config;
    if (_layer === undefined && _layer === null) {
      //@Todo Throw Error
    } else {
      layer = _layer(config, vm.helper);
      vm.layers.push(layer);
      return layer;
    }
  };

  Chart.getLayer = function (layerIndex) {
    var vm = this;
    return vm.layers[layerIndex];
  };

  Chart.draw = function () {
    var vm = this,
      q;
    vm._scales = vm.scales();
    //vm._axes   = vm.axes(); CALL THE AXES AFTER DATA LOADING IN ORDER TO UPDATE THE DOMAINS OF THE SCALES

    q = vm.loadData();

    q.awaitAll(function (error, results) {
      if (error)
        throw error;

      if (Array.isArray(results) && results.length == 1) {
        vm._data = results[0];
      } else {
        vm._data = results;
      }

      vm.initLayers();
      vm.drawSVG();

      //@TODO, ONE MAIN AXES THEN ADD THE POSSIBILITY FOR THE LAYER TO OVERRIDE 
      vm._axes = vm.axes();
      vm.drawAxes();

      //Draw layers after axes
      vm.drawLayers();

      //Trigger load chart event
      if (vm._config.events && vm._config.events.load) {
        vm.dispatch.on('load.chart', vm._config.events.load(vm));
      }


    });
    return vm;
  };

  Chart.addStyle = function (theme) {
    var vm = this;
    vm._addStyle = theme;
    return vm;
  };

  //----------------------
  // Helper functions
  Chart.scales = function () {
    var vm = this;

    var scales = {};
    // xAxis scale
    if (vm._config.xAxis && vm._config.xAxis.scale) {
      switch (vm._config.xAxis.scale) {
        case 'linear':
          scales.x = d3.scaleLinear()
            .range([0, vm._width]);
          break;

        case 'time':
          scales.x = d3.scaleTime()
            .range([0, vm._width]);
          break;

        case 'ordinal':
          scales.x = d3.scaleOrdinal()
            .range([0, vm._width], 0.1);
          break;

        case 'band':
          scales.x = d3.scaleBand()
            .rangeRound([0, vm._width])
            .padding(0.1);
          break;

        case 'quantile':
          scales.x = d3.scaleOrdinal()
            .range([0, vm._width], 0.1);

          scales.q = d3.scaleQuantile()
            .range(d3.range(vm._config.xAxis.buckets));
          break;

        default:
          scales.x = d3.scaleLinear()
            .range([0, vm._width]);
          break;
      }
    } else {
      scales.x = d3.scaleLinear()
        .range([0, vm._width]);
    }

    //yAxis scale
    if (vm._config.yAxis && vm._config.yAxis.scale) {
      switch (vm._config.yAxis.scale) {
        case 'linear':
          scales.y = d3.scaleLinear()
            .range([vm._height, 0]);
          break;

        case 'time':
          scales.y = d3.scaleTime()
            .range([vm._height, 0]);
          break;

        case 'ordinal':
          scales.y = d3.scaleOrdinal()
            .range([vm._height, 0], 0.1);
          break;

        case 'band':
          scales.y = d3.scaleBand()
            .rangeRound([vm._height, 0])
            .padding(0.1);
          break;

        case 'quantile':
          scales.y = d3.scaleOrdinal()
            .range([0, vm._width], 0.1);

          scales.q = d3.scaleQuantile()
            .range(d3.range(vm._config.yAxis.buckets));
          break;

        default:
          scales.y = d3.scaleLinear()
            .range([vm._height, 0]);
          break;
      }
    } else {
      scales.y = d3.scaleLinear()
        .range([vm._height, 0]);
    }


    scales.color = d3.scaleOrdinal(d3.schemeCategory10);

    return scales;
  };

  Chart.setScales = function (scales) {

  };

  Chart.axes = function () {
    var vm = this,
      axes = {};
    axes.x = d3.axisBottom(vm._scales.x);
    axes.y = d3.axisLeft(vm._scales.y);

    //remove corners in axis line
    axes.x.tickSizeOuter(0);
    axes.y.tickSizeOuter(0);

    //Gridline replace with *addStyle
    if (vm._config.xAxis && vm._config.xAxis.ticks &&
      vm._config.xAxis.ticks.enabled === true && vm._config.xAxis.ticks.style) {

      switch (vm._config.xAxis.ticks.style) {
        case 'straightLine':
          axes.x
            .tickSize(-vm._height, 0);
          break;
        case 'dashLine':
          axes.x
            .tickSize(-vm._width, 0);
          break;
      }
    }

    if (vm._addStyle.xAxis.ticks.grid) {
      switch (vm._addStyle.xAxis.ticks.grid) {
        case 'straight':
          axes.y
            .tickSize(-vm._width, 0);
          break;
        case 'dashed':
          axes.y
            .tickSize(-vm._width, 0);
          break;
      }
    }

    if (vm._config.xAxis && vm._config.xAxis.ticks && vm._config.xAxis.ticks.values) {
      axes.x.tickValues(vm._config.xAxis.ticks.values);
    }

    if (vm._config.xAxis && vm._config.xAxis.ticks && vm._config.xAxis.ticks.format) {
      axes.x.tickFormat(vm._config.xAxis.ticks.format);
    }

    //Gridline replace with *addStyle
    if (vm._config.yAxis && vm._config.yAxis.ticks &&
      vm._config.yAxis.ticks.enabled === true && vm._config.yAxis.ticks.style) {

      switch (vm._config.yAxis.ticks.style) {
        case 'straightLine':
          axes.y
            .tickSize(-vm._width, 0);
          break;
        case 'dashLine':
          axes.y
            .tickSize(-vm._width, 0);
          break;
      }
    }

    if (vm._addStyle.yAxis.ticks.grid) {
      switch (vm._addStyle.yAxis.ticks.grid) {
        case 'straight':
          axes.y
            .tickSize(-vm._width, 0);
          break;
        case 'dashed':
          axes.y
            .tickSize(-vm._width, 0);
          break;
      }
    }

    if (vm._config.yAxis && vm._config.yAxis.ticks && vm._config.yAxis.ticks.format) {
      axes.y.tickFormat(vm._config.yAxis.ticks.format);
    }
    return axes;
  };

  Chart.loadData = function () {
    var vm = this;
    var q;

    if (vm._config.data.tsv) {
      q = d3.queue()
        .defer(d3.tsv, vm._config.data.tsv);
    }

    if (vm._config.data.json) {
      q = d3.queue()
        .defer(d3.json, vm._config.data.json);
    }

    if (vm._config.data.csv) {
      q = d3.queue()
        .defer(d3.csv, vm._config.data.csv);
    }

    if (vm._config.data.raw) {
      q = d3.queue()
        .defer(vm.mapData, vm._config.data.raw);
    }

    if (vm._config.data.cartodb) {
      q = d3.queue()
        .defer(carto.query, vm._config.data);
    }

    if (vm._config.map && vm._config.map.topojson && vm._config.map.topojson.url) {
      q.defer(d3.json, vm._config.map.topojson.url);
    }

    if (vm._config.plotOptions && vm._config.plotOptions.bars &&
      vm._config.plotOptions.bars.averageLines && Array.isArray(vm._config.plotOptions.bars.averageLines) &&
      vm._config.plotOptions.bars.averageLines.length > 0) {

      vm._config.plotOptions.bars.averageLines.forEach(function (l) {
        if (l.data.cartodb) {
          q.defer(carto.query, l.data);
        }
      });
    }

    return q;
  };

  Chart.initLayers = function () {
    var vm = this;
    vm.layers.forEach(function (ly) {
      ly.data(vm._data)
        .scales();

      //@TODO validate domains from multiple layers
      vm._scales = ly._scales;
    });
  };


  Chart.drawSVG = function () {
    var vm = this;

    //Remove any previous svg
    d3.select(vm._config.bindTo).select('svg').remove();
    d3.select(vm._config.bindTo).html('');

    //Add the css template class
    if (vm._config.template) {
      d3.select(vm._config.bindTo).classed(vm._config.template, true);
    }

    //Add title to the chart
    if (vm._config.chart && vm._config.chart.title) {
      d3.select(vm._config.bindTo).append('div')
        .attr('class', 'chart-title')
        .html(vm._config.chart.title);
    }

    //Add Legend to the chart
    //@TODO - PASS THE STYLES TO DBOX.CSS
    //@TODO - ALLOW DIFFERENT POSSITIONS FOR THE LEGEND
    if (vm._config.legend && vm._config.legend.enabled === true && vm._config.legend.position === 'top') {
      var legend = d3.select(vm._config.bindTo).append('div')
        .attr('class', 'chart-legend-top');

      var html = '';
      html += '<div style="background-color:#E2E2E1;text-align:center;height: 40px;margin: 0px 15px">';
      vm._config.legend.categories.forEach(function (c) {
        html += '<div class="dbox-legend-category-title" style="margin:0 20px;"><span class="dbox-legend-category-color" style="background-color:' + c.color + ';"> </span><span style="height: 10px;float: left;margin: 10px 5px 5px 5px;border-radius: 50%;">' + c.title + '</span></div>';
      });
      html += '</div>';
      legend.html(html);
    }


    //Create the svg
    vm._fullSvg = d3.select(vm._config.bindTo).append('svg')
      .style('font-size', vm._config.chart ? vm._config.chart['font-size'] ? vm._config.chart['font-size'] : '12px' : '12px')
      .attr('width', vm._width + vm._margin.left + vm._margin.right)
      .attr('height', vm._height + vm._margin.top + vm._margin.bottom);

    vm._svg = vm._fullSvg
      .append('g')
      .attr('transform', 'translate(' + vm._margin.left + ',' + vm._margin.top + ')');


    //Call the tip function
    /*if(vm._config.data.tip){
      vm._svg.call(vm._tip);
    }*/

    //Apply background color
    
    d3.select(vm._config.bindTo + ' svg').style('background-color', vm._addStyle.chart.backgroundColor.color);
    

    d3.select(vm._config.bindTo).append('div')
      .attr('class', 'chart-legend-bottom');
    //Legend for average lines
    /*
    if(vm._config.plotOptions && vm._config.plotOptions.bars
      && vm._config.plotOptions.bars.averageLines && Array.isArray(vm._config.plotOptions.bars.averageLines)
      && vm._config.plotOptions.bars.averageLines.length >0 ){

      d3.select(vm._config.bindTo).append('div')
        .attr('class', 'container-average-lines')
        .append('div')
          .attr('class', 'legend-average-lines')
        .html('Average Lines Controller')
    }
    */

    if (vm._config.hasOwnProperty('legend')) {
      vm.drawLegend(vm._config.legend);
    }
  };

  Chart.drawLayers = function () {
    var vm = this;
    vm.layers.forEach(function (ly) {
      ly.draw();
    });
  };

  Chart.drawLegend = function () {
    var vm = this;

    const legendTip = vm.helper.utils.d3.tip().html(d => {
      return '<div class="title-tip">' + (d.name || d) + '</div>';
    });
    vm._fullSvg.call(legendTip);

    // Draw legend
    var legendBox = vm._fullSvg.append('g')
      .attr('class', 'legendBox')
      .attr('transform', 'translate(' + (vm._config.size.width - vm._config.size.margin.right + 5) + ',' + 1 * 19 + ')');

    legendBox.append('text')
      .attr('class', 'legend-title')
      .text(vm._config.legendTitle);


    //wrap legend title if text size exceeds 70% of container
    let lWidth = vm._config.size.margin.right;
    var text = d3.selectAll('.legend-title'),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      lineNumber = 1,
      lineHeight = 1.1, // ems
      y = text.attr('y'),
      dy = 0,
      tspan = text.text(null).append('tspan').attr('x', 0).attr('y', y).attr('dy', dy + 'em');
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(' '));
      if (tspan.node().getComputedTextLength() > lWidth) {
        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        ++lineNumber;
        tspan = text.append('tspan').attr('x', 0).attr('y', y).attr('dy', lineHeight + 'em').text(word);
      }
    }

    let lbWidth = vm._config.size.margin.right * 0.8;

    if (vm._config.legendType === 'checkbox') {
      let size = 18,
        x = 0,
        y = 0,
        rx = 2,
        ry = 2,
        markStrokeWidth = 3,
        boxStrokeWidth = 0,
        legendOptions;

      vm._scales.color.domain(vm._config.legend.map(o => o.name));

      var legendCheck = legendBox.selectAll('.legend-checkbox')
        .data(vm._config.legend)
        .enter().append('g')
        .attr('class', '.legend-checkbox')
        .attr('transform', function (d, i) {
          return 'translate(0,' + (lineNumber > 1 ? lineNumber * lineHeight + i : 1 + i) * 20 + ')';
        })
        .on('click', function (d, i) {
          // Run the custom function
          if (typeof vm._config.events.onClickLegend === 'function') {
            vm._config.events.onClickLegend.call(this, d, i);
          }

          // Select/Unselect on click
          /*d3.selectAll('.mark')
            .each(function(e, j){
              if (j === i) {
                d3.select(this).property('checked', function (d, i) {
                  //External function call. It must be after all the internal code; allowing the user to overide 
                  legendOptions = vm._config.legend.call(this, d, i);
                  return legendOptions['active'];
                  });
                d3.select(this).attr('opacity', d3.select(this).property('checked') ? 1 : 0);
              }
            })*/

          d3.event.stopPropagation();
        });

      legendCheck.append('rect')
        .attr('width', size)
        .attr('height', size)
        .attr('x', x)
        .attr('rx', rx)
        .attr('ry', ry)
        .attr('fill-opacity', 1)
        .attr('fill', function (d, i) {
          return vm._scales.color(d.name);
        })
        .attr('stroke-width', boxStrokeWidth)
        .attr('stroke', function (d, i) {
          return vm._scales.color(d.name);
        });

      let coordinates = [{
          x: x + (size / 8),
          y: y + (size / 2)
        },
        {
          x: x + (size / 2.2),
          y: (y + size) - (size / 4)
        },
        {
          x: (x + size) - (size / 8),
          y: (y + (size / 10))
        }
      ];

      let line = d3.line()
        .x(function (d) {
          return d.x;
        })
        .y(function (d) {
          return d.y;
        });

      let mark = legendCheck.append('path')
        .attr('d', line(coordinates))
        .attr('stroke-width', markStrokeWidth)
        .attr('stroke', 'white')
        .attr('fill', 'none')
        .attr('class', 'mark')
        .property('checked', function (d, i) {
          //External function call. It must be after all the internal code; allowing the user to overide 
          return d.active;
        })
        .attr('opacity', function () {
          if (d3.select(this).property('checked')) {
            return 1;
          } else {
            return 0;
          }
        });

      legendCheck.append('text')
        .attr('class', 'labelText')
        .attr('x', 20)
        .attr('y', 9)
        .attr('dy', '.35em')
        .attr('text-anchor', 'start')
        .text(function (d, i) {
          //External function call. It must be after all the internal code; allowing the user to overide 
          return d.name;
        });

      //cut label text if text size exceeds 80% of container
      let labeltext = legendCheck.selectAll('text').each(function (d) {
        if (typeof (d.name) === 'string') {
          if (this.getComputedTextLength() > lbWidth) {
            d3.select(this)
              .attr('title', d.name)
              .on('mouseover', legendTip.show)
              .on('mouseout', legendTip.hide);
            let i = 1;
            while (this.getComputedTextLength() > lbWidth) {
              d3.select(this).text(function (d) {
                return d['name'].slice(0, -i) + '...';
              });
              ++i;
            }
          } else {
            return d;
          }
        }
      });
    } else {
      
      var legend = legendBox.selectAll('.legend')
        .data(vm._config.legend)
        .enter().append('g')
        .attr('class', 'legend')
        .attr('transform', function (d, i) {
          return 'translate(' + 5 + ',' + (lineNumber > 1 ? lineNumber * lineHeight + i : 1 + i) * 19 + ')';
        });

      legend.append('rect')
        .attr('x', 0)
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', function (d, i) {
          return vm._scales.color(d.name);
        });

      legend.append('text')
        .attr('x', 20)
        .attr('y', 9)
        .attr('dy', '.35em')
        .attr('text-anchor', 'start')
        .text(function (d, i) {
          //External function call. It must be after all the internal code; allowing the user to overide 
          return d.name;
        });

      //cut label text if text size exceeds 80% of container
      let lbWidth = vm._config.size.margin.right - 19;
      let labeltext = legend.selectAll('text').each(function (d) {
        if (typeof (d.name) === 'string') {
          if (this.getComputedTextLength() > lbWidth) {
            d3.select(this)
              .attr('title', d.name)
              .on('mouseover', legendTip.show)
              .on('mouseout', legendTip.hide);
            let i = 1;
            while (this.getComputedTextLength() > lbWidth) {
              d3.select(this).text(function (d) {
                return d['name'].slice(0, -i) + '...';
              });
              ++i;
            }
          } else {
            return d;
          }
        }
      });
    }
  };

  Chart.drawGrid = function () {
    var vm = this;
    return vm;
  };

  Chart.drawAxes = function () {
    var vm = this;
    var xAxis, yAxis;

    /**
     * Draw axes depends on axes config and styles.
     * Let's start with config.
     */

    const axesTip = vm.helper.utils.d3.tip().html(d => {
      //console.log(d);
      return '<div class="title-tip">' + d + '</div>';
    });
    vm._svg.call(axesTip);


    /**
     * Config axes
     */

    // y

      if (!vm._config.yAxis || (vm._config.yAxis && vm._config.yAxis.enabled !== false)) {
        yAxis = vm._svg.append('g')
          .attr('class', 'y axis')
          .call(vm._axes.y);
      }

      if (vm._config.yAxis.domain && vm._config.yAxis.domain.hasOwnProperty('enabled')) {
        if (vm._config.yAxis.ticks) {
          if (vm._config.yAxis.domain.enabled === false && vm._config.yAxis.ticks.enabled === false) {
            d3.select('g.y.axis .domain').remove();
            d3.selectAll('g.y.axis .tick').remove();
          } else if (vm._config.yAxis.domain.enabled === false && vm._config.yAxis.ticks.enabled === true) {
            d3.select('g.y.axis .domain').remove();
            //d3.selectAll('g.y.axis .tick text').remove();
          }
        } else {
          if (vm._config.yAxis.domain.enabled === false) {
            d3.select('g.y.axis .domain').remove();
            d3.selectAll('g.y.axis .tick').remove();
          }
        }
      }

      if (!vm._config.yAxis || (vm._config.yAxis && vm._config.yAxis.enabled !== false)) {
        // Add ellipsis to cut label text when too long
        // for yAxis on the left
        yAxis.selectAll('text').each(function (d) {
          let element = this;
          if (typeof (d) === 'string') {
            if (this.getComputedTextLength() > 0.8 * vm._margin.left) {
              d3.select(element)
                .on('mouseover', axesTip.show)
                .on('mouseout', axesTip.hide);
              let i = 1;
              while (this.getComputedTextLength() > 0.8 * vm._margin.left) {
                d3.select(this).text(function (d) {
                  return d.slice(0, -i) + '...';
                }).attr('title', d);
                ++i;
              }
            } else {
              return d;
            }
          }
        });
      }

      //Dropdown Y axis
      if (vm._config.yAxis && vm._config.yAxis.dropdown && vm._config.yAxis.dropdown.enabled === true) {
        var yAxisDropDown = d3.select(vm._config.bindTo).append('div').attr('class', 'dbox-yAxis-select')
          .append('select')
          .on('change', function () {
            vm.updateAxis('y', this.value);
          });

        /*
        .attr('style', function(){
                                var x = -1*d3.select(vm._config.bindTo).node().getBoundingClientRect().width/2+ vm._chart._margin.left/4;
                                var y = -1*d3.select(vm._config.bindTo).node().getBoundingClientRect().height/2;
                                return 'transform: translate('+x+'px,'+y+'px) rotate(-90deg);'
                              })
        */

        var x = -1 * d3.select(vm._config.bindTo).node().getBoundingClientRect().width / 2 + vm._margin.left / 2.5;
        var y = -1 * d3.select(vm._config.bindTo).node().getBoundingClientRect().height / 1.5;

        if (vm._config.yAxis.dropdown.styles) {

          var styles = vm._config.yAxis.dropdown.styles;
          styles.display = 'block';
          styles.transform = 'translate(' + x + 'px,' + y + 'px) rotate(-90deg)';
          styles.margin = 'auto';
          styles['text-align'] = 'center';
          styles['text-align-last'] = 'center';

          d3.select('.dbox-yAxis-select select').styles(styles);

          d3.select('.dbox-yAxis-select select option').styles({
            'text-align': 'left'
          });

        } else {
          d3.select('.dbox-yAxis-select select').styles({
            'display': 'block',
            'transform': 'translate(' + x + 'px,' + y + 'px) rotate(-90deg)',
            'margin': 'auto',
            'text-align': 'center',
            'text-align-last': 'center'
          });

          d3.select('.dbox-yAxis-select select option').styles({
            'text-align': 'left'
          });
        }

        if (vm._config.yAxis.dropdown.options) {

          yAxisDropDown.selectAll('option')
            .data(vm._config.yAxis.dropdown.options)
            .enter().append('option')
            .attr('class', function (d) {
              return d.value;
            })
            .attr('value', function (d) {
              return d.value;
            })
            .text(function (d) {
              return d.title;
            })
            .property('selected', function (d) {
              return d.selected;
            });

        } else {
          console.log('No options present in config');
        }
      }

      // y

      /////////////////////////////

    // x

      if (!vm._config.xAxis || (vm._config.xAxis && vm._config.xAxis.enabled !== false)) {

        xAxis = vm._svg.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + vm._height + ')')
          .call(vm._axes.x);

        //Do not show line if axis is disabled
        if (vm._config.xAxis.line && vm._config.xAxis.line.enabled == false) {
          xAxis.selectAll('path')
            .style('display', 'none');
        }

        //Set custom position for ticks
        if (vm._config.xAxis.ticks && vm._config.xAxis.ticks.x) {
          xAxis.selectAll('text')
            .attr('dx', vm._config.xAxis.ticks.x);
        }

        if (vm._config.xAxis.ticks && vm._config.xAxis.ticks.y) {
          xAxis.selectAll('text')
            .attr('dy', vm._config.xAxis.ticks.y);
        }

        //Disable ticks when set to false
        if (vm._config.xAxis.ticks && vm._config.xAxis.ticks.line && vm._config.xAxis.ticks.line.enabled === false) {
          xAxis.selectAll('line')
            .style('display', 'none');
        }
      }

      if (vm._config.xAxis.domain !== undefined && vm._config.xAxis.domain.hasOwnProperty('enabled')) {
        if (vm._config.xAxis.ticks) {
          if (vm._config.xAxis.domain.enabled === false && vm._config.xAxis.ticks.enabled === false) {
            d3.select(vm._config.bindTo + ' g.x.axis .domain').remove();
            d3.selectAll('g.x.axis .tick').remove();
          } else if (vm._config.xAxis.domain.enabled === false && vm._config.xAxis.ticks.enabled === true) {
            d3.select(vm._config.bindTo + ' g.x.axis .domain').remove();
            //d3.selectAll('g.x.axis .tick text').remove();
          }
        } else {
          if (vm._config.xAxis.domain.enabled === false) {
            d3.select(vm._config.bindTo + ' g.x.axis .domain').remove();
            d3.selectAll(vm._config.bindTo + ' g.x.axis .tick').remove();
          }
        }
      }

      if (!vm._config.xAxis || (vm._config.xAxis && vm._config.xAxis.enabled !== false)) {

        // Add ellipsis to cut label text 
        // when it is too long
        let horizontal = true;
        if (vm._width / xAxis.selectAll('text').size() > 60) {
          xAxis.selectAll('text').each(function (d) {
            if (typeof (d) === 'string') {
              d3.select(this)
                .on('mouseover', axesTip.show)
                .on('mouseout', axesTip.hide);
              // wrap labels horizontally
              let xBandWidth = vm._scales.x.bandwidth ? vm._scales.x.bandwidth() : vm._scales.x(d[vm._config.x]);
              d3.select(this).attr('title', d).call(wrap, xBandWidth * 0.85);
            }
          });
        } else {
          xAxis.selectAll('text').each(function (d) {
            if (typeof (d) === 'string') {
              // Vertical labels
              if (this.getComputedTextLength() > vm._scales.x.bandwidth()) {
                d3.select(this)
                  .attr('text-anchor', 'end')
                  .attr('dy', 0)
                  .attr('transform', 'translate(-5,8)rotate(-90)');
              }
              // Still doesn't fit!
              if (this.getComputedTextLength() > 0.8 * vm._config.size.margin.bottom) {
                d3.select(this)
                  .on('mouseover', axesTip.show)
                  .on('mouseout', axesTip.hide);
                let i = 1;
                while (this.getComputedTextLength() > 0.8 * vm._config.size.margin.bottom) {
                  d3.select(this).text(function (d) {
                    return d.slice(0, -i) + '...';
                  }).attr('title', d);
                  ++i;
                }
              } else {
                return d;
              }
            }
          });
        }
      }

      //wrap function used in x axis labels
      function wrap(text, width) {
        text.each(function () {
          var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr('y'),
            dy = parseFloat(text.attr('dy')),
            tspan = text.text(null).append('tspan').attr('x', 0).attr('y', y).attr('dy', dy + 'em');
          while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(' '));
            if (tspan.node().getComputedTextLength() > width) {
              line.pop();
              tspan.text(line.join(' '));
              line = [word];
              tspan = text.append('tspan').attr('x', 0).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
              if (lineNumber > 0) {
                if (words.length > 0 && tspan.node().getComputedTextLength() < width) {
                  tspan.text(function () {
                    return tspan.text() + '...';
                  });
                }
                words = [];
              } else {
                let i = 1;
                while (tspan.node().getComputedTextLength() > width) {
                  tspan.text(function () {
                    return tspan.text().slice(0, -i) + '...';
                  });
                  ++i;
                }
              }
            }
          }
        });
      }

      //Dropdown X axis
      if (vm._config.xAxis && vm._config.xAxis.dropdown && vm._config.xAxis.dropdown.enabled === true) {
        var xAxisDropDown = d3.select(vm._config.bindTo).append('div').attr('class', 'dbox-xAxis-select')
          .append('select')
          .on('change', function () {
            vm.updateAxis('x', this.value);
          });

        if (vm._config.xAxis.dropdown.styles) {

          var styles = vm._config.xAxis.dropdown.styles;
          styles.display = 'block';
          styles.margin = 'auto';
          styles['text-align'] = 'center';
          styles['text-align-last'] = 'center';

          d3.select('.dbox-xAxis-select select').styles(styles);

          d3.select('.dbox-xAxis-select select option').styles({
            'text-align': 'left'
          });

        } else {
          d3.select('.dbox-xAxis-select select').styles({
            'display': 'block',
            'margin': 'auto',
            'text-align': 'center',
            'text-align-last': 'center'
          });

          d3.select('.dbox-xAxis-select select option').styles({
            'text-align': 'left'
          });
        }

        if (vm._config.xAxis.dropdown.options) {

          xAxisDropDown.selectAll('option')
            .data(vm._config.xAxis.dropdown.options)
            .enter().append('option')
            .attr('class', function (d) {
              return d.value;
            })
            .attr('value', function (d) {
              return d.value;
            })
            .text(function (d) {
              return d.title;
            })
            .property('selected', function (d) {
              return d.selected;
            });

        } else {
          console.log('No options present in config');
        }
      }

    /**
     * Let's style axes
     */ 

    // y

      //to be replaced with *addStyle
      if (vm._config.yAxis && vm._config.yAxis.enabled !== false) {

        if (vm._config.yAxis && vm._config.yAxis.text) {
          yAxis.append('text')
            .attr('class', 'label title')
            .attr('transform', 'rotate(-90)')
            .attr('y', vm._config.yAxis.y ? vm._config.yAxis.y : -50)
            .attr('x', -150)
            .attr('dy', '.71em')
            .style('text-anchor', 'middle')
            .style('fill', vm._config.yAxis.fill ? vm._config.yAxis.fill : 'black')
            .style('font-size', vm._config.yAxis['font-size'] ? vm._config.yAxis['font-size'] : '12px')
            .style('font-weight', vm._config.xAxis['font-weight'] ? vm._config.xAxis['font-weight'] : '600')
            .text(vm._config.yAxis.text);
        }
      }

      //Set ticks straight or dashed, to be replaced with *addStyle
      if (vm._config.yAxis.ticks && vm._config.yAxis.ticks.enabled && vm._config.yAxis.ticks.style) {
        switch (vm._config.yAxis.ticks.style) {
          case 'straightLine':
            break;
          case 'dashLine':
            d3.selectAll('g.y.axis .tick line').attr('stroke-dasharray', '5, 5');
            break;
        }
      }
      //To be replaced with *addStyle 
      if (vm._config.yAxis.domain && vm._config.yAxis.domain.enabled && vm._config.yAxis.domain.stroke) {
        d3.select('g.y.axis .domain').attr('stroke', vm._config.yAxis.domain.stroke);
      }

      //To be replaced with *addStyle 
      if (vm._config.yAxis.domain && vm._config.yAxis.domain.enabled && vm._config.yAxis.domain['stroke-width']) {
        d3.select('g.y.axis .domain').attr('stroke-width', vm._config.yAxis.domain['stroke-width']);
      } 

      
      // y

      /////////////////////////////

    // x


      if (!vm._config.xAxis || (vm._config.xAxis && vm._config.xAxis.enabled !== false)) {

        //To be replaced with *addStyle -checked
        if (vm._config.xAxis.ticks && vm._config.xAxis.ticks.style) {
          Object.keys(vm._config.xAxis.ticks.style).forEach(function (k) {
            xAxis.selectAll('text')
              .style(k, vm._config.xAxis.ticks.style[k]);
          });
        }

        //Set rotation for ticks, to be replaced with *addStyle
        if (vm._config.xAxis.ticks && vm._config.xAxis.ticks.rotate) {
          xAxis.selectAll('text')
            .attr('text-anchor', 'end')
            .attr('transform', 'rotate(' + vm._config.xAxis.ticks.rotate + ')');
        }

        //Set ticks straight or dashed, to be replaced with *addStyle -checked
        if (vm._config.xAxis.ticks && vm._config.xAxis.ticks.enabled && vm._config.xAxis.ticks.style) {
          switch (vm._config.xAxis.ticks.style) {
            case 'straightLine':
              break;
            case 'dashLine':
              d3.selectAll(vm._config.bindTo + ' g.x.axis .tick line').attr('stroke-dasharray', '5, 5');
              break;
          }
        }

      }

      //to be replaced with *addStyle -checked
      if (vm._config.xAxis.domain && vm._config.xAxis.domain.enabled && vm._config.xAxis.domain.stroke) {
        d3.select(vm._config.bindTo + ' g.x.axis .domain').attr('stroke', vm._config.xAxis.domain.stroke);
      }

      //to be replaced with *addStyle -checked
      if (vm._config.xAxis.domain && vm._config.xAxis.domain.enabled && vm._config.xAxis.domain['stroke-width']) {
        d3.select(vm._config.bindTo + ' g.x.axis .domain').attr('stroke-width', vm._config.xAxis.domain['stroke-width']);
      }

      //to be replaced with *addStyle
      if (vm._config.xAxis && vm._config.xAxis.text) {
        xAxis.append('text')
          .attr('class', 'label title')
          .attr('x', vm._width / 2)
          .attr('y', vm._config.xAxis.y ? vm._config.xAxis.y : 30)
          .style('text-anchor', 'middle')
          .style('fill', vm._config.xAxis.fill ? vm._config.xAxis.fill : 'black')
          .style('font-size', vm._config.xAxis['font-size'] ? vm._config.xAxis['font-size'] : '12px')
          .style('font-weight', vm._config.xAxis['font-weight'] ? vm._config.xAxis['font-weight'] : '600')
          .text(vm._config.xAxis.text);
      }

    /**
     * trial 1
     * 
     */
    
    console.log('enabler riiiick', vm._addStyle);

    //Style Y axis
    if (vm._config.xAxis.enabled !== false && vm._addStyle.xAxis.enabled) {
      yAxis.selectAll('.domain')
        .attr('stroke-width', vm._addStyle.yAxis.axis.strokeWidth)
        .attr('stroke',  vm._addStyle.yAxis.axis.strokeColor)
        .attr('opacity', vm._addStyle.yAxis.axis.strokeOpacity);

      yAxis.selectAll('.tick line')
        .attr('stroke-width', vm._addStyle.yAxis.ticks.strokeWidth)
        .attr('stroke',  vm._addStyle.yAxis.ticks.strokeColor)
        .attr('width',  vm._addStyle.yAxis.ticks.tickWidth)
        //condition gridline
        .attr('stroke-dasharray', vm._addStyle.yAxis.ticks.gridDashed)
        .attr('transform', 'translate(-'+ vm._addStyle.yAxis.axis.paddingTick +', 0)');

      //don't draw first tick when styled as grid
      if (vm._addStyle.yAxis.ticks.grid) {
        yAxis.selectAll('.tick:first-of-type line:first-of-type')
          .attr('stroke', 'none');
      }

      yAxis.selectAll('text')
        .attr('font-size', vm._addStyle.yAxis.labels.fontSize)
        .attr('font-weight', vm._addStyle.yAxis.labels.fontWeight)
        .attr('fill', vm._addStyle.yAxis.labels.textColor)
        .attr('text-anchor', vm._addStyle.yAxis.labels.textAnchor)
        .attr('transform', 'translate(-'+ vm._addStyle.yAxis.axis.paddingTick +', 0)');

    }

    //Style X axis
    if (vm._config.xAxis.enabled !== false && vm._addStyle.xAxis.enabled) {
      xAxis.selectAll('.domain')
        .attr('stroke-width', vm._addStyle.xAxis.axis.strokeWidth)
        .attr('stroke',  vm._addStyle.xAxis.axis.strokeColor)
        .attr('opacity', vm._addStyle.xAxis.axis.strokeOpacity);

      xAxis.selectAll('.tick line')
        .attr('stroke-width', vm._addStyle.xAxis.ticks.strokeWidth)
        .attr('stroke',  vm._addStyle.xAxis.ticks.strokeColor)
        .attr('transform', 'translate(0, '+ vm._addStyle.xAxis.axis.paddingTick +')');
      
      //don't draw first tick when styled as grid
      if (vm._addStyle.xAxis.ticks.grid) {
        XAxis.selectAll('.tick:first-of-type line:first-of-type')
          .attr('stroke', 'none');
      }

      xAxis.selectAll('text')
        .attr('font-size', vm._addStyle.xAxis.labels.fontSize)
        .attr('font-weight', vm._addStyle.xAxis.labels.fontWeight)
        .attr('fill', vm._addStyle.xAxis.labels.textColor)
        .attr('text-anchor', vm._addStyle.xAxis.labels.textAnchor)
        .attr('transform', 'translate(0, '+ vm._addStyle.xAxis.axis.paddingTick +')');
    }
  };

  Chart.updateAxis = function (axis, value) {
    var vm = this;

    if (axis === 'x') {
      vm._config.xAxis.dropdown.options.map((obj) => {
        if (obj.value === value) {
          obj.selected = true;
        } else {
          obj.selected = false;
        }
      });
    } else if (axis === 'y') {
      vm._config.yAxis.dropdown.options.map((obj) => {
        if (obj.value === value) {
          obj.selected = true;
        } else {
          obj.selected = false;
        }
      });
    }

    vm._config[axis] = value;

    var layer = vm.layers[0];

    layer._config = vm._config;

    vm.draw();

    //Trigger update chart axis
    if (vm._config.events && vm._config.events.change) {
      vm.dispatch.on('change.axis', vm._config.events.change(vm));
    }
  };



  Chart.dispatch = d3.dispatch('load', 'change');

  Chart.mapData = function (data, callback) {
    callback(null, data);
  };

  Chart.getDomains = function (data) {
    var vm = this;

    var domains = {};
    var minMax = [];
    var sorted = '';


    //Default ascending function
    var sortFunctionY = function (a, b) {
      return d3.ascending(a.y, b.y);
    };
    var sortFunctionX = function (a, b) {
      return d3.ascending(a.x, b.x);
    };


    //if applying sort
    if (vm._config.data.sort && vm._config.data.sort.order) {
      switch (vm._config.data.sort.order) {
        case 'asc':
          sortFunctionY = function (a, b) {
            return d3.ascending(a.y, b.y);
          };
          sortFunctionX = function (a, b) {
            return d3.ascending(a.x, b.x);
          };
          break;

        case 'desc':
          sortFunctionY = function (a, b) {
            return d3.descending(a.y, b.y);
          };
          sortFunctionX = function (a, b) {
            return d3.descending(a.x, b.x);
          };
          break;
      }
    }


    // xAxis
    if (vm._config.xAxis && vm._config.xAxis.scale) {
      switch (vm._config.xAxis.scale) {
        case 'linear':
          minMax = d3.extent(data, function (d) {
            return d.x;
          });
          domains.x = minMax;
          break;

        case 'time':
          minMax = d3.extent(data, function (d) {
            return d.x;
          });
          domains.x = minMax;
          break;

        case 'ordinal':

          // If the xAxis' order depends on the yAxis values
          if (vm._config.data.sort && vm._config.data.sort.axis === 'y') {
            sorted = data.sort(sortFunctionY);
          } else {
            sorted = data.sort(sortFunctionX);
          }

          domains.x = [];
          sorted.forEach(function (d) {
            domains.x.push(d.x);
          });

          break;

        case 'quantile':

          //The xAxis order depends on the yAxis values
          if (vm._config.data.sort && vm._config.data.sort.axis === 'y') {
            sorted = data.sort(sortFunctionY);
          } else {
            sorted = data.sort(sortFunctionX);
          }

          domains.q = [];
          sorted.forEach(function (d) {
            domains.q.push(d.x);
          });

          domains.x = d3.range(vm._config.xAxis.buckets);

          break;


        default:
          minMax = d3.extent(data, function (d) {
            return d.x;
          });
          domains.x = minMax;
          break;
      }
    } else {
      minMax = d3.extent(data, function (d) {
        return d.x;
      });
      domains.x = minMax;
    }

    //yAxis
    if (vm._config.yAxis && vm._config.yAxis.scale) {
      switch (vm._config.yAxis.scale) {
        case 'linear':
          minMax = d3.extent(data, function (d) {
            return d.y;
          });

          //Adjust for min values greater than zero
          //set the min value to -10%
          if (minMax[0] > 0) {
            minMax[0] = minMax[0] - (minMax[1] - minMax[0]) * .1;
          }
          domains.y = minMax;
          break;

        case 'time':
          minMax = d3.extent(data, function (d) {
            return d.y;
          });
          domains.y = minMax;
          break;

        case 'ordinal':
          if (vm._config.data.sort && vm._config.data.sort.axis === 'y') {

            var sorted = data.sort(function (a, b) {
              return d3.ascending(a.y, b.y);
            });
            domains.y = [];
            sorted.forEach(function (d) {
              domains.y.push(d.x);
            });

          } else {
            domains.y = d3.map(data, function (d) {
              return d.y;
            }).keys().sort(function (a, b) {
              return d3.ascending(a, b);
            });
          }

          break;

        default:
          minMax = d3.extent(data, function (d) {
            return d.y;
          });
          domains.y = minMax;
          break;
      }
    } else {
      minMax = d3.extent(data, function (d) {
        return d.y;
      });
      domains.y = minMax;
    }


    return domains;
  };

  Chart.destroy = function () {
    var vm = this;
    d3.select(vm._config.bindTo).html('');
  };

  Chart.init(config);

  return Chart;
}
