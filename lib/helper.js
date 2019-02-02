import * as d3 from 'd3';
var d3Tip = require('d3-tip');
var _ = require('lodash');

export default function () {

  var vm = this; // Hard binded to chart

  var Helper = {
    chart: {
      config: vm._config,
      width: vm._width,
      height: vm._height,
      style: vm._addStyle,
      fullSvg: function () {
        return vm._fullSvg;
      },
      svg: function () {
        return vm._svg;
      },
    },
    utils: {
      d3: {}
    }
  };
  Helper.utils.d3.tip = d3Tip;

  /**
   * Generate scale based on data and config 
   */
  Helper.utils.generateScale = function (data, config) {
    var scale = {};
    var domains;
    if (!config.range) {
      throw 'Range is not defined';
    }
    // Used in bars.js when we want to create a groupBy or stackBy bar chart
    if (config.groupBy && config.groupBy == 'parent') {
      // Axis of type band 
      domains = data.map(function (d) {
        return d[config.column];
      });
    } else if (config.stackBy && config.stackBy == 'parent') {
      domains = data[0].map(function (d) {
        return d.data[config.column];
      });
    } else if (config.groupBy == 'children') {
      // GroupBy Columns
      domains = config.column;
    } else if (config.groupBy == 'data') {
      // Considering the highest value on all the columns for each groupBy column
      domains = [0, d3.max(data, function (d) {
        return d3.max(config.column, function (column) {
          return d[column];
        });
      })];
    } else if (config.stackBy == 'data') {
      // Using a d3.stack() 
      domains = [0, d3.max(data, function (serie) {
        return d3.max(serie, function (d) {
          return d[1];
        });
      })];
    } else if (config.groupBy == undefined && config.type == 'band') {
      // In case the axis is of type band and there is no groupby
      domains = data.map(function (d) {
        return d[config.column];
      });
    } else if (config.type === 'linear') {
      // Axis of type numeric
      if (config.minZero) {
        domains = [0, d3.max(data, function (d) {
          return +d[config.column];
        })];
      } else {
        domains = d3.extent(data, function (d) {
          return +d[config.column];
        });
      }
    } else {
      // Axis of type band
      domains = data.map(function (d) {
        return d[config.column];
      });
    }

    if (config.domains && Array.isArray(config.domains)) {
      domains = config.domains;
    }

    if (config.type) {
      switch (config.type) {
        case 'linear':
          scale = d3.scaleLinear()
            .rangeRound(config.range)
            .domain(domains)
            .nice();
          break;

        case 'time':
          scale = d3.scaleTime()
            .range(config.range);
          // .domain(domains);
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
            .padding(0.1);
          break;

        case 'quantile':
          scale = d3.scaleBand()
            .rangeRound(config.range)
            .padding(0.1)
            .domain(data.map(function (d) {
              return d[config.column];
            }));
          if (!config.bins) {
            config.bins = 10;
          }
          scale = d3.scaleQuantile()
            .range(d3.range(config.bins));
          break;

        default:
          scale = d3.scaleLinear()
            .rangeRound(config.range)
            .domain(domains)
            .nice();
          break;
      }
    } else {
      scale = d3.scaleLinear()
        .rangeRound(config.range)
        .domain(domains)
        .nice();
    }

    return scale;
  };

  Helper.utils.format = function (d, smallVersion, decimals) {
    if (Number.isNaN(Number(d))) { // d is not a number, return original value
      return d;
    }
    var fullNumber = smallVersion ? false : true;
    var floatingPoints = 1;
    if (vm._config.decimals) {
      floatingPoints = Number(vm._config.decimals);
    }
    if (decimals && Number.isInteger(decimals)) {
      floatingPoints = decimals;
    }
    var value = '';
    if (vm._config.formatPreffix) {
      value += vm._config.formatPreffix;
    }
    var suffix = '';
    
    if (!fullNumber) {
      
      var linearAxis = vm._config.yAxis && vm._config.yAxis.scale === 'linear' && (_.inRange(d, vm._scales.y.domain()[0], vm._scales.y.domain()[1]) || d === vm._scales.y.domain()[1]) ? 'yAxis' : vm._config.xAxis && vm._config.xAxis.scale === 'linear' && (_.inRange(d, vm._scales.x.domain()[0], vm._scales.x.domain()[1]) || d === vm._scales.x.domain()[1]) ? 'xAxis' : '';
      var mean = d3.mean(vm._scales[linearAxis.replace('Axis','')].ticks());
      
      if (mean >= 1000000000000) {
        if (linearAxis) {
          vm._config[linearAxis].text = 'Billones';
        } else {
          suffix = ' billones';
        }
        d = d / 1000000000000;
      } else if (mean >= 1000000000) { // Thousands of millions
        if (linearAxis) {
          vm._config[linearAxis].text = 'Miles de millones';
        } else {
          suffix = ' mil millones';
        }
        d = d / 1000000000;
      } else if (mean >= 1000000) { // Millions
        if (linearAxis) {
          vm._config[linearAxis].text = 'Millones';
        } else {
          suffix = ' millones';
        }
        d = d / 1000000;
      } else if (mean >= 1000) { // Thousands
        if (linearAxis) {
          vm._config[linearAxis].text = 'Miles';
        } else {
          suffix = ' mil';
        }
        d = d / 1000;
      }
    }
    
    if (Number.isInteger(d)) {
      value += d3.format(',.0f')(d);
    } else if (d > 1) {
      value += d3.format(',.' + floatingPoints + 'f')(d);
    } else {
      var floats = d.toString().split('.')[1];
      var points = 1;
      if (floats) {
        for (let index = 0; index < floats.length; index++) {
          const number = Number(floats[index]);
          if (number === 0) {
            points += 1;
          } else {
            break;
          }
        }
        value += d3.format(',.' + points + 'f')(d);
      }
    }
    value += suffix;
    
    if (vm._config.formatSuffix && value.indexOf(vm._config.formatSuffix) < 0) {
      value += vm._config.formatSuffix;
    }
    return value;
  };

  // wrap function used in x axis labels
  Helper.utils.wrap = function (text, width, tooltip) {
    text.each(function () {
      var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr('y'),
        dy = parseFloat(text.attr('dy')) || 0,
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
            if (words.length > 0 && tspan.node().getComputedTextLength() > width) {
              if (tooltip) {
                text
                  .on('mouseover', tooltip.show)
                  .on('mouseout', tooltip.hide);
              }
              let i = 1;
              while (tspan.node().getComputedTextLength() > width) {
                tspan.text(function () {
                  return tspan.text().slice(0, -i) + '...';
                });
                ++i;
              }
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
  };

  Helper.utils.sortAscending = function (a, b) {
    if (!Number.isNaN(+a) && !Number.isNaN(+b)) {
      // If both values are numbers use numeric value
      return Number(a) - Number(b);
    } else if (!Number.isNaN(+a) && Number.isNaN(+b)) {
      return -1;
    } else if (Number.isNaN(+a) && !Number.isNaN(+b)) {
      return 1;
    } else if (a <= b) {
      return -1;
    } else {
      return 1;
    }
  };

  Helper.utils.sortDescending = function (a, b) {
    if (!Number.isNaN(+b) && !Number.isNaN(+a)) {
      // If both values are numbers use numeric value
      return Number(b) - Number(a);
    } else if (!Number.isNaN(+b) && Number.isNaN(+a)) {
      return -1;
    } else if (Number.isNaN(+b) && !Number.isNaN(+a)) {
      return 1;
    } else if (b <= a) {
      return -1;
    } else {
      return 1;
    }
  };

  Helper.utils.VirtualScroller = function () {
    var enter = null,
      update = null,
      exit = null,
      data = [],
      dataid = null,
      svg = null,
      viewport = null,
      totalRows = 0,
      position = 0,
      rowHeight = 30,
      totalHeight = 0,
      viewportHeight = 0,
      visibleRows = 0,
      delta = 0,
      lineNumber = 1,
      lineHeight = 1.1, //ems
      dispatch = d3.dispatch('pageDown', 'pageUp'),
      scrollTop = 0;

    
    function virtualscroller(container) {
      function render(resize) {
        if (resize) {
          viewportHeight = parseInt(viewport.style('height')) - 240;
          visibleRows = Math.ceil(viewportHeight / rowHeight);
          //visibleRows = data.length - 2;
        }
        var lastPosition = position;
        if(position < data.length && position >= 0 && scrollTop < 0) {
          position += 1;
        } else if(position <= data.length && position > 0 && scrollTop > 0) {
          position -= 1;
        }
        delta = position - lastPosition;
        scrollRenderFrame(position);
      }


      function scrollRenderFrame(scrollPosition) {   
        var position0 = Math.max(0, Math.min(scrollPosition, totalRows - visibleRows + 1)),
          position1 = position0 + visibleRows;
        if(totalRows < visibleRows) {
          d3.selectAll('.arrow-scroll').style('display', 'none');
        } else {
          d3.selectAll('.arrow-scroll').style('display', 'flex');
        }
        container.each(function () {
          var rowSelection = container.selectAll('.legend-checkbox')
            .data(data.slice(position0, Math.min(position1, totalRows)), dataid);
          rowSelection.exit().call(exit).remove();
          
          rowSelection.enter().append('g')
            .attr('class', 'legend-checkbox legend')
            .attr('random', function(d) {
              return d;
            })
            .call(enter)
            .attr('transform', function (d, i) {
              return 'translate(0,' + (vm._config.legendTitle && lineNumber > 1 ? lineNumber * lineHeight + i : 1 + i) * 21 + ')';
            })
            .on('click', function (d) {
              // Run the custom function
              var i = data.findIndex(x => x.name == d.name);
              if (typeof vm._config.events.onClickLegend === 'function') {
                vm._config.events.onClickLegend.call(this, d, i);
              }
              d3.event.stopPropagation();
            });
            
          rowSelection.order();
          var rowUpdateSelection = container.selectAll('.legend-checkbox');
          
          rowUpdateSelection.call(update);
          
          rowUpdateSelection.each(function (d, i) {
            d3.select(this)
              .attr('font-weight', 'bold')
              .attr('transform', function (d) {
                return 'translate(0,' + (vm._config.legendTitle && lineNumber > 1 ? lineNumber * lineHeight + i : 1 + i) * 21 + ')';
              });
          });

          d3.select('.legendBox')
            .append('rect')
            .attr('width', '150px')
            .attr('height', rowHeight/2 + 'px')
            .attr('transform', 'translate(0, 200 )')
            .style('fill', 'white');
          
        });

        if (position1 > (data.length - visibleRows)) {
          dispatch.call('pageDown', {
            delta: delta
          });
        } else if (position0 < visibleRows) {
          dispatch.call('pageUp', {
            delta: delta
          });
        }
      }

      virtualscroller.render = render;
      d3.select('.legendBox').on('mousewheel.zoom', function () {
        var evt = d3.event;
        scrollTop = evt.wheelDelta;
        render(true);
      });
      render(true);
    }

    virtualscroller.render = function (resize) {};

    virtualscroller.data = function (_, __) {
      if (!arguments.length) return data;
      data = _;
      dataid = __;
      return virtualscroller;
    };

    virtualscroller.dataid = function (_) {
      if (!arguments.length) return dataid;
      dataid = _;
      return virtualscroller;
    };

    virtualscroller.enter = function (_) {
      if (!arguments.length) return enter;
      enter = _;
      return virtualscroller;
    };

    virtualscroller.update = function (_) {
      if (!arguments.length) return update;
      update = _;
      return virtualscroller;
    };

    virtualscroller.exit = function (_) {
      if (!arguments.length) return exit;
      exit = _;
      return virtualscroller;
    };

    virtualscroller.totalRows = function (_) {
      if (!arguments.length) return totalRows;
      totalRows = _;
      return virtualscroller;
    };

    virtualscroller.rowHeight = function (_) {
      if (!arguments.length) return rowHeight;
      rowHeight = +_;
      return virtualscroller;
    };

    virtualscroller.totalHeight = function (_) {
      if (!arguments.length) return totalHeight;
      totalHeight = +_;
      return virtualscroller;
    };

    virtualscroller.position = function (_) {
      if (!arguments.length) return position;
      position = +_;
      if (viewport) {
        
        viewport.node().scrollTop = position;
      }
      return virtualscroller;
    };

    virtualscroller.svg = function (_) {
      if (!arguments.length) return svg;
      svg = _;
      return virtualscroller;
    };

    virtualscroller.viewport = function (_) {
      if (!arguments.length) return viewport;
      viewport = _;
      return virtualscroller;
    };

    virtualscroller.delta = function () {
      return delta;
    };

    virtualscroller.legendTitle = function (_) {
      return legendTitle;
    };

    const rebind = function(target, source) {
      var i = 1, n = arguments.length, method;
      while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
      return target;
    };
    
    // Method is assumed to be a standard D3 getter-setter:
    // If passed with no arguments, gets the value.
    // If passed with arguments, sets the value and returns the target.
    function d3_rebind(target, source, method) {
      return function() {
        var value = method.apply(source, arguments);
        return value === source ? target : value;
      };
    }

    rebind(virtualscroller, dispatch, 'on');

    return virtualscroller;
  };

  return Helper;
}
