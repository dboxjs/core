import * as d3 from 'd3';
var d3Tip = require('d3-tip');
import * as _ from 'lodash';

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
      }
    },
    utils: {
      d3: {}
    }
  };
  Helper.utils.d3.tip = typeof d3Tip === 'function' ? d3Tip : d3Tip.default;

  /**
   * Generate scale based on data and config
   * @param {*} data
   * @param {*} config
   * @returns
   */
  Helper.utils.generateScale = function (data, config) {
    var scale = {};
    var domains;
    if (!config.range) {
      throw 'Range is not defined';
    }
    // Used in bars.js when we want to create a groupBy or stackBy bar chart
    if (config.groupBy && config.groupBy === 'parent') {
      // Axis of type band
      domains = data.map(function (d) {
        return d[config.column];
      });
    } else if (config.stackBy && config.stackBy === 'parent') {
      domains = data[0].map(function (d) {
        return d.data[config.column];
      });
    } else if (config.groupBy === 'children') {
      // GroupBy Columns
      domains = config.column;
    } else if (config.groupBy === 'data') {
      // Considering the highest value on all the columns for each groupBy column
      domains = [
        0,
        d3.max(data, function (d) {
          return d3.max(config.column, function (column) {
            return d[column];
          });
        })
      ];
    } else if (config.stackBy === 'data') {
      // Using a d3.stack()
      domains = [
        0,
        d3.max(data, function (serie) {
          return d3.max(serie, function (d) {
            return d[1];
          });
        })
      ];
    } else if (config.groupBy === undefined && config.type === 'band') {
      // In case the axis is of type band and there is no groupby
      domains = data.map(function (d) {
        return d[config.column];
      });
    } else if (config.type === 'linear') {
      // Axis of type numeric
      if (config.minZero) {
        domains = [
          0,
          d3.max(data, function (d) {
            return +d[config.column];
          })
        ];
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
          scale = d3
            .scaleLinear()
            .rangeRound(config.range)
            .domain(domains)
            .nice();
          break;

        case 'time':
          scale = d3.scaleTime().range(config.range);
          // .domain(domains);
          break;

        case 'ordinal':
          scale = d3
            .scaleBand()
            .rangeRound(config.range)
            .padding(0.1)
            .domain(domains);
          break;

        case 'band':
          scale = d3
            .scaleBand()
            .rangeRound(config.range)
            .domain(domains)
            .padding(0.1);
          break;

        case 'quantile':
          scale = d3
            .scaleBand()
            .rangeRound(config.range)
            .padding(0.1)
            .domain(
              data.map(function (d) {
                return d[config.column];
              })
            );
          if (!config.bins) {
            config.bins = 10;
          }
          scale = d3.scaleQuantile().range(d3.range(config.bins));
          break;

        default:
          scale = d3
            .scaleLinear()
            .rangeRound(config.range)
            .domain(domains)
            .nice();
          break;
      }
    } else {
      scale = d3
        .scaleLinear()
        .rangeRound(config.range)
        .domain(domains)
        .nice();
    }

    return scale;
  };

  /**
   * Format numbers
   * @param {Object} config - configurate current formatter
   * @param {number} config.decimals - Quantity of decimals to use
   * @param {string} config.axis - Current scale selected from axis ['xAxis', 'yAxis']
   * @param {string} config.formatPreffix - Preffix to use in formatting. Eg. '$'
   * @param {string} config.formatSuffix - Suffix to use in formatting. Eg. '%'
   * @param {boolean} [smallNumber] - Display number in small format
   * @returns Function configured to parse a number [d]
   */
  Helper.utils.format = function (config, smallNumber) {
    if (!config) {
      // Default config
      var linearAxis =
        vm._config.yAxis && vm._config.yAxis.scale === 'linear' ?
        'yAxis' :
        vm._config.xAxis && vm._config.xAxis.scale === 'linear' ?
        'xAxis' :
        '';
      config = {
        decimals: vm._config.decimals,
        axis: linearAxis,
        formatPreffix: vm._config.formatPreffix,
        formatSuffix: vm._config.formatSuffix
      };
    }
    return function (d) {
      if (Number.isNaN(Number(d))) {
        // d is not a number, return original value
        return d;
      }
      var fullNumber = smallNumber ? false : true;
      var floatingPoints = 1; // Default
      if (config.decimals !== undefined && Number.isInteger(config.decimals)) {
        floatingPoints = Number(config.decimals);
      }
      var value = '';
      if (config.formatPreffix) {
        value += config.formatPreffix;
      }
      var suffix = '';

      if (smallNumber) {
        var currentAxis = config.axis;
        var mean = currentAxis ?
          d3.mean(vm._scales[currentAxis.replace('Axis', '')].ticks()) :
          d;

        if (mean >= 1000000000000) {
          if (currentAxis) {
            vm._config[currentAxis].scaleText = 'Billones';
          } else {
            suffix = ' billones';
          }
          d = d / 1000000000000;
        } else if (mean >= 1000000000) {
          // Thousands of millions
          if (currentAxis) {
            vm._config[currentAxis].scaleText = 'Miles de millones';
          } else {
            suffix = ' mil millones';
          }
          d = d / 1000000000;
        } else if (mean >= 1000000) {
          // Millions
          if (currentAxis) {
            vm._config[currentAxis].scaleText = 'Millones';
          } else {
            suffix = ' millones';
          }
          d = d / 1000000;
        } else if (mean >= 10000) {
          // Thousands
          if (currentAxis) {
            vm._config[currentAxis].scaleText = 'Miles';
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

      if (config.formatSuffix && value.indexOf(config.formatSuffix) < 0) {
        value += config.formatSuffix;
      }
      return value;
    };
  };

  // wrap function used in x axis labels
  Helper.utils.wrap = function (text, width, tooltip) {
    text.each(function () {
      var text = d3.select(this),
        words = text
        .text()
        .split(/\s+/)
        .reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr('y'),
        dy = parseFloat(text.attr('dy')) || 0,
        tspan = text
        .text(null)
        .append('tspan')
        .attr('x', 0)
        .attr('y', y)
        .attr('dy', dy + 'em');

      while ((word = words.pop())) {
        line.push(word);
        tspan.text(line.join(' '));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = text
            .append('tspan')
            .attr('x', 0)
            .attr('y', y)
            .attr('dy', ++lineNumber * lineHeight + dy + 'em')
            .text(word);

          if (lineNumber > 0) {
            if (
              words.length > 0 &&
              tspan.node().getComputedTextLength() > width
            ) {
              if (tooltip) {
                text.on('mouseover', tooltip.show).on('mouseout', tooltip.hide);
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
      lineNumber = 0,
      lineHeight = 0.7, //ems
      scrollTop = 0;

    function virtualscroller(container) {
      function render(resize) {
        if (resize) {
          /*
           * Tested values:
           * 240 -> 9 rows
           * 170 -> 13 rows
           */
          viewportHeight = parseInt(viewport.style('height')) - 170;
          visibleRows = Math.ceil(viewportHeight / rowHeight);
        }
        var lastPosition = position;
        if (position < data.length && position >= 0 && scrollTop < 0) {
          position += 1;
        } else if (position <= data.length && position > 0 && scrollTop > 0) {
          position -= 1;
        }
        delta = position - lastPosition;
        scrollRenderFrame(position);
      }

      function scrollRenderFrame(scrollPosition) {
        var position0 = Math.max(
            0,
            Math.min(scrollPosition, totalRows - visibleRows + 1)
          ),
          position1 = position0 + visibleRows;
        container.each(function () {
          var rowSelection = container
            .selectAll('.legend-checkbox')
            .data(
              data.slice(position0, Math.min(position1, totalRows)),
              dataid
            );
          rowSelection
            .exit()
            .call(exit)
            .remove();
          rowSelection
            .enter()
            .append('g')
            .attr('class', 'legend-checkbox legend')
            .attr('random', function (d) {
              return d;
            })
            .call(enter)
            .attr('transform', function (d, i) {
              return (
                'translate(0,' +
                (vm._config.legendTitle && lineNumber > 1 ?
                  lineNumber * lineHeight + i :
                  1 + i) *
                21 +
                ')'
              );
            })
            .on('click', function (d) {
              // Run the custom function
              var i = data.findIndex(x => x.name === d.name);
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
                return (
                  'translate(0,' +
                  (vm._config.legendTitle && lineNumber > 1 ?
                    lineNumber * lineHeight + i :
                    1 + i) *
                  21 +
                  ')'
                );
              });
          });
        });
      }

      virtualscroller.render = render;
      let isFirefox = typeof InstallTrigger !== 'undefined';
      let support =
        'onwheel' in d3.select('.legendBox') ?
        'wheel' // Modern browsers support "wheel"
        :
        document.onmousewheel !== undefined ?
        'mousewheel' // Webkit and IE support at least "mousewheel"
        :
        'wheel'; // let's assume that remaining browsers are older Firefox
      d3.select('.legendBox').on(support, function () {
        // isFirefox ? 'wheel' : 'mousewheel.zoom'
        //Chrome & IE: mousewheel.zoom | Firefox: DOMMouseScroll (not supported yet).
        var evt = d3.event;
        evt.preventDefault();
        scrollTop = isFirefox ? evt.deltaY : evt.wheelDelta;
        render(true);
      });
      render(true);
      drawScrollLegend(visibleRows);
    }

    function drawScrollLegend(visibleRows) {
      var scrollLegend = d3
        .select('.legendBox')
        .append('g')
        .attr('class', 'scroll-legend')
        .append('text')
        .attr('transform', `translate(0,${visibleRows * 25})`);

      scrollLegend
        .append('tspan')
        .attr('class', 'material-icons expand-more')
        .text('mouse');

      scrollLegend
        .append('tspan')
        .attr('x', 30)
        .attr('y', -12)
        .text('Desplázate con el');

      scrollLegend
        .append('tspan')
        .attr('x', 60)
        .attr('y', -1)
        .text('cursor');

      if (totalRows < visibleRows) {
        d3.selectAll('.scroll-legend').style('display', 'none');
      } else {
        d3.selectAll('.scroll-legend').style('display', 'flex');
      }
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

    virtualscroller.lineNumber = function (_) {
      if (!arguments.length) return lineNumber;
      lineNumber = _;
      return virtualscroller;
    };

    const rebind = function (target, source) {
      var i = 1,
        n = arguments.length,
        method;
      while (++i < n)
        target[(method = arguments[i])] = d3_rebind(
          target,
          source,
          source[method]
        );
      return target;
    };

    // Method is assumed to be a standard D3 getter-setter:
    // If passed with no arguments, gets the value.
    // If passed with arguments, sets the value and returns the target.
    function d3_rebind(target, source, method) {
      return function () {
        var value = method.apply(source, arguments);
        return value === source ? target : value;
      };
    }

    return virtualscroller;
  };

  return Helper;
}
