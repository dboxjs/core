(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? factory(exports, require('d3'), require('lodash'), require('topojson'))
    : typeof define === 'function' && define.amd
    ? define(['exports', 'd3', 'lodash', 'topojson'], factory)
    : factory((global.dbox = {}), global.d3, global._, global.topojson);
})(this, function (exports, d3, _$1, topojson$1) {
  'use strict';

  var d3Tip = require('d3-tip');

  function Helper() {
    var vm = this; // Hard binded to chart

    var Helper = {
      chart: {
        config: vm._config,
        width: vm._width,
        height: vm._height,
        style: vm._addStyle,
        fullSvg: function fullSvg() {
          return vm._fullSvg;
        },
        svg: function svg() {
          return vm._svg;
        },
      },
      utils: {
        d3: {},
      },
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
          }),
        ];
      } else if (config.stackBy === 'data') {
        // Using a d3.stack()
        domains = [
          0,
          d3.max(data, function (serie) {
            return d3.max(serie, function (d) {
              return d[1];
            });
          }),
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
            }),
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
          vm._config.yAxis && vm._config.yAxis.scale === 'linear'
            ? 'yAxis'
            : vm._config.xAxis && vm._config.xAxis.scale === 'linear'
            ? 'xAxis'
            : '';
        config = {
          decimals: vm._config.decimals,
          axis: linearAxis,
          formatPreffix: vm._config.formatPreffix,
          formatSuffix: vm._config.formatSuffix,
        };
      }
      return function (d) {
        if (Number.isNaN(Number(d))) {
          // d is not a number, return original value
          return d;
        }
        var floatingPoints = 1; // Default
        if (
          config.decimals !== undefined &&
          Number.isInteger(config.decimals)
        ) {
          floatingPoints = Number(config.decimals);
        }
        var value = '';
        if (config.formatPreffix) {
          value += config.formatPreffix;
        }
        var suffix = '';

        if (smallNumber) {
          var currentAxis = config.axis;
          var mean = currentAxis
            ? d3.mean(vm._scales[currentAxis.replace('Axis', '')].ticks())
            : d;

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
            for (var index = 0; index < floats.length; index++) {
              var number = Number(floats[index]);
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
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1,
          // ems
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
                (function () {
                  if (tooltip) {
                    text
                      .on('mouseover', tooltip.show)
                      .on('mouseout', tooltip.hide);
                  }
                  var i = 1;
                  while (tspan.node().getComputedTextLength() > width) {
                    tspan.text(function () {
                      return tspan.text().slice(0, -i) + '...';
                    });
                    ++i;
                  }
                })();
              }
              words = [];
            } else {
              (function () {
                var i = 1;
                while (tspan.node().getComputedTextLength() > width) {
                  tspan.text(function () {
                    return tspan.text().slice(0, -i) + '...';
                  });
                  ++i;
                }
              })();
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
        lineHeight = 0.7,
        //ems
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
            rowSelection.exit().call(exit).remove();
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
                  (vm._config.legendTitle && lineNumber > 1
                    ? lineNumber * lineHeight + i
                    : 1 + i) *
                    21 +
                  ')'
                );
              })
              .on('click', function (d) {
                // Run the custom function
                var i = data.findIndex(function (x) {
                  return x.name === d.name;
                });
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
                    (vm._config.legendTitle && lineNumber > 1
                      ? lineNumber * lineHeight + i
                      : 1 + i) *
                      21 +
                    ')'
                  );
                });
            });
          });
        }

        virtualscroller.render = render;
        var isFirefox = typeof InstallTrigger !== 'undefined';
        var support =
          'onwheel' in d3.select('.legendBox')
            ? 'wheel' // Modern browsers support "wheel"
            : document.onmousewheel !== undefined
            ? 'mousewheel' // Webkit and IE support at least "mousewheel"
            : 'wheel'; // let's assume that remaining browsers are older Firefox
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
          .attr('transform', 'translate(0,' + visibleRows * 25 + ')');

        scrollLegend
          .append('tspan')
          .attr('class', 'material-icons expand-more')
          .text('mouse');

        scrollLegend
          .append('tspan')
          .attr('x', 30)
          .attr('y', -12)
          .text('Desplázate con el');

        scrollLegend.append('tspan').attr('x', 60).attr('y', -1).text('cursor');

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

      return virtualscroller;
    };

    return Helper;
  }

  /**
   * Dbox Chart core
   */

  /**
   * Creates a chart type object
   * @constructor
   * @param {Object} config - Object with params to set chart size, xAxis and yAxis properties
   */

  function Chart(config) {
    var Chart = {};
    // Internet Explorer 6-11
    var isIE;
    try {
      isIE = /*@cc_on!@*/ false || (document && !!document.documentMode);
    } catch (err) {
      isIE = false;
    }
    // Edge 20+
    var isEdge;
    try {
      isEdge = !isIE && window && !!window.StyleMedia;
    } catch (err) {
      isEdge = false;
    }

    /**
     * Initialize chart object configuration
     * @param {Object} config - Object with params to configure the chart (developer's configure)
     */
    Chart.init = function (config) {
      var vm = this;

      /**
       * Set default size and default margins
       * for chart container (SVG)
       */
      var defaultConfig = {
        size: {
          width: 800,
          height: 600,
          margin: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          },
        },
      };

      var defaultStyle = {
        chart: {
          backgroundColor: {
            color: 'transparent',
            // linearGradient : { x1: 0, y1: 0, x2: 1, y2: 1 },
            // stops: [ [0, '#FCFCFC'], [1, '#F3F2F2'] ]
          },
        },
        title: {
          textColor: '#E6B537',
          fontSize: '30px',
          fontWeight: 600,
          textAlign: 'center',
          hr: {
            enabled: true,
            borderWidth: '1px',
            borderColor: '#fff',
          },
        },
        legend: {
          position: 'bottom',
          figure: 'circle',
          text: {
            textColor: '#fff',
            fontSize: '12px',
            fontWeight: 600,
          },
        },
        tooltip: {
          backgroundColor: '#757575',
          opacity: 0.9,
          text: {
            textColor: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            textAlign: 'center',
            fontFamily: 'sans-serif',
            padding: '0.8em',
          },
          border: {
            color: '#5A5C5D',
            radius: '5px',
            width: '1px',
          },
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
            gridDashed: '3, 5',
            opacity: 0.6,
          },
          labels: {
            fontSize: 12,
            fontWeight: 600,
            textColor: '#fff',
            textAnchor: 'end',
          },
          title: {
            fontSize: 17,
            fontWeight: 600,
            textColor: '#fff',
            textAnchor: 'middle',
            // rotation
            // text align or position
          },
        },
        xAxis: {
          enabled: true,
          axis: {
            strokeWidth: 3,
            strokeColor: '#5F6C6C',
            strokeOpacity: 1, //???
            paddingTick: 5,
          },
          ticks: {
            strokeWidth: 1,
            strokeColor: '#5F6C6C',
            // ticksize
          },
          labels: {
            fontSize: 12,
            fontWeight: 400,
            textColor: '#fff',
            textAnchor: 'middle',
          },
          title: {
            fontSize: 17,
            fontWeight: 600,
            textColor: '#fff',
            textAnchor: 'middle',
            // text align
          },
        },
      };

      /**
       * Clone recursively the config object if it has content.
       * Keep default configuration in other case.
       */
      vm._config = config ? _$1.cloneDeep(config) : defaultConfig;

      if (vm._config.xAxis) {
        vm._config.xAxis.axis = 'xAxis';
        /**
         * @deprecated Allow to use general config if axis-based is not especified
         */
        if (
          vm._config.xAxis.decimals === undefined &&
          vm._config.decimals !== undefined
        ) {
          vm._config.xAxis.decimals = vm._config.decimals;
        }
        if (
          vm._config.xAxis.formatPreffix === undefined &&
          vm._config.formatPreffix !== undefined
        ) {
          vm._config.xAxis.formatPreffix = vm._config.formatPreffix;
        }
        if (
          vm._config.xAxis.formatSuffix === undefined &&
          vm._config.formatSuffix !== undefined
        ) {
          vm._config.xAxis.formatSuffix = vm._config.formatSuffix;
        }
      }
      if (vm._config.yAxis) {
        vm._config.yAxis.axis = 'yAxis';
        /**
         * @deprecated Allow to use general config if axis-based is not especified
         */
        if (
          vm._config.yAxis.decimals === undefined &&
          vm._config.decimals !== undefined
        ) {
          vm._config.yAxis.decimals = vm._config.decimals;
        }
        if (
          vm._config.yAxis.formatPreffix === undefined &&
          vm._config.formatPreffix !== undefined
        ) {
          vm._config.yAxis.formatPreffix = vm._config.formatPreffix;
        }
        if (
          vm._config.yAxis.formatSuffix === undefined &&
          vm._config.formatSuffix !== undefined
        ) {
          vm._config.yAxis.formatSuffix = vm._config.formatSuffix;
        }
      }
      // Initialize data array
      vm._data = [];

      // Define margin sizes and styles
      vm._margin = vm._config.size.margin;
      vm._addStyle = vm._config.addStyle ? vm._config.addStyle : defaultStyle;

      // Define width and height
      vm._width = vm._config.size.width - vm._margin.left - vm._margin.right;
      vm._height = vm._config.size.height - vm._margin.top - vm._margin.bottom;
      vm._svg = '';
      vm._scales = {};
      vm._axes = {};

      // Public
      vm.layers = [];

      // Helper data/functions for layers to use
      vm.helper = Helper.bind(vm)();
    };

    //------------------------
    // User
    /**
     * User can set config object using this method
     * @param {Object} config - Objec with params to configure the chart (user's configure)
     */
    Chart.config = function (config) {
      var vm = this;
      vm._config = _$1.cloneDeep(config);
      return vm;
    };

    /**
     * User can set size of the chart using this method
     * @param {object} sizeObj - Size object
     * @param {number} [sizeObj.height] - Height of the chart
     * @param {number} [sizeObj.width] - Width of the chart
     * @param {object} [sizeObj.margin] - Margins of the chart
     * @param {number} [sizeObj.margin.top] - Margin top of the chart
     * @param {number} [sizeObj.margin.right] - Margin right of the chart
     * @param {number} [sizeObj.margin.bottom] - Margin bottom of the chart
     * @param {number} [sizeObj.margin.left] - Margin left of the chart
     */
    Chart.size = function (sizeObj) {
      var vm = this;
      if (sizeObj) {
        if (sizeObj.margin) {
          if (!Number.isNaN(+sizeObj.margin.left)) {
            vm._config.size.margin.left = sizeObj.margin.left;
            vm._margin.left = sizeObj.margin.left;
          }
          if (!Number.isNaN(+sizeObj.margin.right)) {
            vm._config.size.margin.right = sizeObj.margin.right;
            vm._margin.right = sizeObj.margin.right;
          }
          if (!Number.isNaN(+sizeObj.margin.top)) {
            vm._config.size.margin.top = sizeObj.margin.top;
            vm._margin.top = sizeObj.margin.top;
          }
          if (!Number.isNaN(+sizeObj.margin.bottom)) {
            vm._config.size.margin.bottom = sizeObj.margin.bottom;
            vm._margin.bottom = sizeObj.margin.bottom;
          }
        }
        if (!Number.isNaN(+sizeObj.width)) {
          vm._config.size.width = sizeObj.width;
          vm._width = sizeObj.width;
        }
        if (!Number.isNaN(+sizeObj.height)) {
          vm._config.size.height = sizeObj.height;
          vm._height = sizeObj.height;
        }
      }
      return vm;
    };

    /**
     * User can set a personalized style object
     * @param {object} stylesObj
     */
    Chart.addStyle = function (stylesObj) {
      var vm = this;
      if (stylesObj) {
        vm._addStyle = stylesObj;
      }
      return vm;
    };

    /**
     * Set if background grid is enabled and should be drawn
     * @param {boolean} enabled - Grid status
     */
    Chart.grid = function (enabled) {
      var vm = this;
      vm._config.grid = enabled ? true : false;
      return vm;
    };

    /**
     * Set selector of HTML node to embed the whole chart
     * @param {string} selector - HTML node selector
     */
    Chart.bindTo = function (selector) {
      var vm = this;
      vm._config.bindTo = selector;
      return vm;
    };

    /**
     * Set data to be used in chart
     * @param {Object[]} data - Data structure to be used
     */
    Chart.data = function (data) {
      var vm = this;
      if (vm._config.data !== undefined) {
        vm._config.data = Object.assign({}, vm._config.data, data);
      } else {
        vm._config.data = data;
      }
      return vm;
    };

    /**
     * Set configuration for legend
     * @param {Object} legend - Legend configuration
     */
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
        /** @todo Throw Error */
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
      // vm._axes   = vm.axes(); // CALL THE AXES AFTER DATA LOADING IN ORDER TO UPDATE THE DOMAINS OF THE SCALES

      q = vm.loadData();

      q.awaitAll(function (error, results) {
        if (error) throw error;

        if (Array.isArray(results) && results.length === 1) {
          vm._data = results[0];
        } else {
          vm._data = results;
        }

        vm.initLayers();
        vm.drawSVG();

        /** @todo ONE MAIN AXES THEN ADD THE POSSIBILITY FOR THE LAYER TO OVERRIDE */
        vm._axes = vm.axes();
        vm.drawAxes();

        // Draw layers after axes
        vm.drawLayers();

        // Trigger load chart event
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
            scales.x = d3.scaleLinear().range([0, vm._width]);
            break;

          case 'time':
            scales.x = d3.scaleTime().range([0, vm._width]);
            break;

          case 'ordinal':
            scales.x = d3.scaleOrdinal().range([0, vm._width], 0.1);
            break;

          case 'band':
            scales.x = d3.scaleBand().rangeRound([0, vm._width]).padding(0.1);
            break;

          case 'quantile':
            scales.x = d3.scaleOrdinal().range([0, vm._width], 0.1);

            scales.q = d3
              .scaleQuantile()
              .range(d3.range(vm._config.xAxis.buckets));
            break;

          default:
            scales.x = d3.scaleLinear().range([0, vm._width]);
            break;
        }
      } else {
        scales.x = d3.scaleLinear().range([0, vm._width]);
      }

      // yAxis scale
      if (vm._config.yAxis && vm._config.yAxis.scale) {
        switch (vm._config.yAxis.scale) {
          case 'linear':
            scales.y = d3.scaleLinear().range([vm._height, 0]);
            break;

          case 'time':
            scales.y = d3.scaleTime().range([vm._height, 0]);
            break;

          case 'ordinal':
            scales.y = d3.scaleOrdinal().range([vm._height, 0], 0.1);
            break;

          case 'band':
            scales.y = d3.scaleBand().rangeRound([vm._height, 0]).padding(0.1);
            break;

          case 'quantile':
            scales.y = d3.scaleOrdinal().range([0, vm._width], 0.1);

            scales.q = d3
              .scaleQuantile()
              .range(d3.range(vm._config.yAxis.buckets));
            break;

          default:
            scales.y = d3.scaleLinear().range([vm._height, 0]);
            break;
        }
      } else {
        scales.y = d3.scaleLinear().range([vm._height, 0]);
      }

      scales.color = d3.scaleOrdinal(d3.schemeCategory10);
      if (vm._config.legend && vm._config.legend.length > 0) {
        scales.color.domain(
          vm._config.legend.map(function (o) {
            return o.name;
          })
        );
      }

      return scales;
    };

    Chart.setScales = function () {};

    Chart.axes = function () {
      var vm = this,
        axes = {};
      axes.x = d3.axisBottom(vm._scales.x);
      axes.y = d3.axisLeft(vm._scales.y);

      // Remove corners in axis line
      axes.x.tickSizeOuter(0);
      axes.y.tickSizeOuter(0);

      // Replaced with *addStyle -check
      if (
        vm._config.xAxis &&
        vm._config.xAxis.ticks &&
        vm._config.xAxis.ticks.enabled === true &&
        vm._config.xAxis.ticks.style
      ) {
        switch (vm._config.xAxis.ticks.style) {
          case 'straightLine':
            axes.x.tickSize(-vm._height, 0);
            break;
          case 'dashLine':
            axes.x.tickSize(-vm._width, 0);
            break;
        }
      }
      // addStyle
      if (vm._addStyle.xAxis.ticks.grid) {
        switch (vm._addStyle.xAxis.ticks.grid) {
          case 'straight':
            axes.y.tickSize(-vm._width, 0);
            break;
          case 'dashed':
            axes.y.tickSize(-vm._width, 0);
            break;
        }
      }

      if (
        vm._config.xAxis &&
        vm._config.xAxis.ticks &&
        vm._config.xAxis.ticks.ticks
      ) {
        axes.x.ticks(vm._config.xAxis.ticks.ticks);
      }

      if (
        vm._config.xAxis &&
        vm._config.xAxis.ticks &&
        vm._config.xAxis.ticks.values
      ) {
        axes.x.tickValues(vm._config.xAxis.ticks.values);
      }

      if (
        vm._config.xAxis &&
        vm._config.xAxis.ticks &&
        vm._config.xAxis.scale === 'linear'
      ) {
        vm._scales.x.domain()[1];
        axes.x.tickFormat(vm.helper.utils.format(vm._config.xAxis, true));
      }
      if (
        vm._config.xAxis &&
        vm._config.xAxis.ticks &&
        vm._config.xAxis.ticks.format
      ) {
        axes.x.tickFormat(vm._config.xAxis.ticks.format);
      }

      // Replaced with *addStyle -check
      if (
        vm._config.yAxis &&
        vm._config.yAxis.ticks &&
        vm._config.yAxis.ticks.enabled === true &&
        vm._config.yAxis.ticks.style
      ) {
        switch (vm._config.yAxis.ticks.style) {
          case 'straightLine':
            axes.y.tickSize(-vm._width, 0);
            break;
          case 'dashLine':
            axes.y.tickSize(-vm._width, 0);
            break;
        }
      }
      // addStyle
      if (vm._addStyle.yAxis.ticks.grid) {
        switch (vm._addStyle.yAxis.ticks.grid) {
          case 'straight':
            axes.y.tickSize(-vm._width, 0);
            break;
          case 'dashed':
            axes.y.tickSize(-vm._width, 0);
            break;
        }
      }
      if (
        vm._config.yAxis &&
        vm._config.yAxis.ticks &&
        vm._config.yAxis.scale === 'linear'
      ) {
        axes.y.tickFormat(vm.helper.utils.format(vm._config.yAxis, true));
      }
      if (
        vm._config.yAxis &&
        vm._config.yAxis.ticks &&
        vm._config.yAxis.ticks.format
      ) {
        axes.y.tickFormat(vm._config.yAxis.ticks.format);
      }
      if (
        vm._config.yAxis &&
        vm._config.yAxis.ticks &&
        vm._config.yAxis.ticks.ticks
      ) {
        axes.y.ticks(vm._config.yAxis.ticks.ticks);
      }
      return axes;
    };

    Chart.loadData = function () {
      var vm = this;
      var q;

      if (vm._config.data.tsv) {
        q = d3.queue().defer(d3.tsv, vm._config.data.tsv);
      }

      if (vm._config.data.json) {
        q = d3.queue().defer(d3.json, vm._config.data.json);
      }

      if (vm._config.data.csv) {
        q = d3.queue().defer(d3.csv, vm._config.data.csv);
      }

      if (vm._config.data.raw) {
        q = d3.queue().defer(vm.mapData, vm._config.data.raw);
      }

      if (
        vm._config.map &&
        vm._config.map.topojson &&
        vm._config.map.topojson.url
      ) {
        q.defer(d3.json, vm._config.map.topojson.url);
      }

      return q;
    };

    Chart.initLayers = function () {
      var vm = this;
      vm.layers.forEach(function (ly) {
        ly.data(vm._data).scales();

        /** @todo validate domains from multiple layers */
        vm._scales = ly._scales;
      });
    };

    Chart.drawSVG = function () {
      var vm = this;

      // Remove any previous svg
      d3.select(vm._config.bindTo).select('svg').remove();
      d3.select(vm._config.bindTo).html('');

      // Add the css template class
      if (vm._config.template) {
        d3.select(vm._config.bindTo).classed(vm._config.template, true);
      }

      // Add title to the chart
      if (vm._config && vm._config.title) {
        d3.select(vm._config.bindTo)
          .append('div')
          .attr('class', 'chart-title')
          .html(vm._config.title)
          .style('display', 'flex')
          .style('justify-content', 'center')
          .style('align-items', 'center')
          .style('font-size', vm._addStyle.title.fontSize)
          .style('font-weight', vm._addStyle.title.fontWeight)
          .style('color', vm._addStyle.title.textColor)
          .style('text-align', vm._addStyle.title.textAlign);

        if (vm._addStyle.title.hr.enabled) {
          d3.select(vm._config.bindTo)
            .append('hr')
            .attr('class', 'hr-title')
            .style('width', '80%')
            .style('margin-left', '10%')
            .style('margin-top', '0.5em')
            .style('border-width', vm._addStyle.title.hr.borderWidth)
            .style('border-color', vm._addStyle.title.hr.borderColor);
        }
      }

      // Add Legend to the chart
      /** @todo PASS THE STYLES TO DBOX.CSS */
      /** @todo ALLOW DIFFERENT POSSITIONS FOR THE LEGEND */
      if (
        vm._config.legend &&
        vm._config.legend.enabled === true &&
        vm._config.legend.position === 'top'
      ) {
        var legend = d3
          .select(vm._config.bindTo)
          .append('div')
          .attr('class', 'chart-legend-top');

        var html = '';
        html +=
          '<div style="background-color:#E2E2E1;text-align:center;height: 40px;margin: 0px 15px">';
        vm._config.legend.categories.forEach(function (c) {
          html +=
            '<div class="dbox-legend-category-title" style="margin:0 20px;"><span class="dbox-legend-category-color" style="background-color:' +
            c.color +
            ';"> </span><span style="height: 10px;float: left;margin: 10px 5px 5px 5px;border-radius: 50%;">' +
            c.title +
            '</span></div>';
        });
        html += '</div>';
        legend.html(html);
      }

      var width = vm._width + vm._margin.left + vm._margin.right;
      var height = vm._height + vm._margin.top + vm._margin.bottom;
      // Create the svg
      vm._fullSvg = d3
        .select(vm._config.bindTo)
        .append('svg')
        .style(
          'font-size',
          vm._config.chart
            ? vm._config.chart['font-size']
              ? vm._config.chart['font-size']
              : '12px'
            : '12px'
        )
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', '0 0 ' + width + ' ' + height);

      vm._svg = vm._fullSvg
        .append('g')
        .attr(
          'transform',
          'translate(' + vm._margin.left + ',' + vm._margin.top + ')'
        );

      //Apply background color

      d3.select(vm._config.bindTo + ' svg').style(
        'background-color',
        vm._addStyle.chart.backgroundColor.color
      );

      // Legend for average lines
      /*
      d3.select(vm._config.bindTo).append('div')
        .attr('class', 'chart-legend-bottom');
      if (vm._config.plotOptions && vm._config.plotOptions.bars
        && vm._config.plotOptions.bars.averageLines && Array.isArray(vm._config.plotOptions.bars.averageLines)
        && vm._config.plotOptions.bars.averageLines.length >0 ){
         d3.select(vm._config.bindTo).append('div')
          .attr('class', 'container-average-lines')
          .append('div')
            .attr('class', 'legend-average-lines')
          .html('Average Lines Controller')
      }
      */

      if (
        vm._config.hasOwnProperty('legend') &&
        vm._config.legendEnabled === true
      ) {
        vm.drawLegend();
      }
    };

    Chart.drawLayers = function () {
      var vm = this;
      vm.layers.forEach(function (ly) {
        ly.draw();
      });
    };

    /**
     * Draw chart legends section
     */
    Chart.drawLegend = function () {
      // Reference to chart object
      var vm = this,
        legendBox,
        virtualScroller,
        legendX = vm._config.size.width - vm._config.size.margin.right + 10,
        marginTop = vm._config.size.margin.top + 10;
      // Set color domain
      if (!vm._scales.color && vm._config.colors) {
        vm._scales.color = d3.scaleOrdinal(vm._config.colors);
      }
      if (vm._config.legend && vm._config.legend.length > 0) {
        vm._scales.color.domain(
          vm._config.legend.map(function (o) {
            return o.name;
          })
        );
      }
      // Create information tips for each legend
      var legendTip = vm.helper.utils.d3.tip().html(function (d) {
        return '<div class="title-tip">' + (d.name || d) + '</div>';
      });
      vm._fullSvg.call(legendTip);

      // Draw legend, defaults to right
      legendBox = vm._fullSvg
        .append('g')
        .attr('class', 'legendBox')
        .attr('transform', 'translate(' + legendX + ', ' + marginTop + ')')
        .attr('width', vm._width)
        .attr('height', vm._height);
      // Add legends title (on top of legendBox)
      if (vm._config.legendTitle) {
        legendBox
          .append('g')
          .attr('width', '150px')
          .append('text')
          .attr('class', 'legend-title')
          .attr('x', 5)
          .style('font-weight', 'bold')
          .text(vm._config.legendTitle);
        // Wrap legend title if text size exceeds 70% of container
        var lWidth = vm._config.size.margin.right;
        var text = d3.selectAll('.legend-title'),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 1,
          lineHeight = 1.1,
          // ems
          y = text.attr('y'),
          dy = 0,
          tspan = text
            .text(null)
            .append('tspan')
            .attr('x', 0)
            .attr('y', y)
            .attr('dy', dy + 'em');
        while ((word = words.pop())) {
          line.push(word);
          tspan.text(line.join(' '));
          if (tspan.node().getComputedTextLength() > lWidth) {
            line.pop();
            tspan.text(line.join(' '));
            line = [word];
            ++lineNumber;
            tspan = text
              .append('tspan')
              .attr('x', -6)
              .attr('y', y)
              .attr('dy', lineHeight + 'em')
              .text(word);
          }
        }
      }

      // Label width
      var lbWidth = vm._config.size.margin.right * 0.8;
      if (vm._config.legendType === 'checkbox') {
        // Size and position of every checkbox
        var size = 18,
          x = 0,
          _y = 0,
          rx = 2,
          ry = 2,
          markStrokeWidth = 3;

        vm._scales.color.domain(
          vm._config.legend.map(function (o) {
            return o.name;
          })
        );

        var legendEnter = function legendEnter(legendCheck) {
          legendCheck
            .append('rect')
            .attr('width', size)
            .attr('height', size)
            .attr('x', x)
            .attr('rx', rx)
            .attr('ry', ry)
            .attr('fill-opacity', 1);
          var coordinates = [
            {
              x: x + size / 8,
              y: _y + size / 2,
            },
            {
              x: x + size / 2.2,
              y: _y + size - size / 4,
            },
            {
              x: x + size - size / 8,
              y: _y + size / 10,
            },
          ];

          var line = d3
            .line()
            .x(function (d) {
              return d.x;
            })
            .y(function (d) {
              return d.y;
            });

          // Mark (inside checkbox)
          legendCheck
            .append('path')
            .attr('d', line(coordinates))
            .attr('stroke-width', markStrokeWidth)
            .attr('stroke', 'white')
            .attr('fill', 'none')
            .attr('class', 'mark')
            .property('checked', function (d) {
              // External function call. It must be after all the internal code; allowing the user to overide
              return d.active;
            })
            .attr('opacity', function () {
              if (d3.select(this).property('checked')) {
                return 1;
              } else {
                return 0;
              }
            });

          legendCheck
            .append('text')
            .attr('class', 'labelText')
            .attr('x', 20)
            .attr('y', 9)
            .attr('dy', '.35em')
            .attr('text-anchor', 'start');

          legendCheck.select('rect').attr('fill', function (d) {
            return vm._scales.color(d.name);
          });

          legendCheck.select('text').text(function (d) {
            // External function call. It must be after all the internal code; allowing the user to overide
            // External function call. It must be after all the internal code; allowing the user to overide
            // External function call. It must be after all the internal code; allowing the user to overide
            return d.name;
          });

          // Cut label text if text size exceeds 80% of container
          legendCheck.selectAll('text').each(function (d) {
            var _this = this;

            if (typeof d.name === 'string') {
              // getComputedTextLenght: Returns a float representing the computed length for the text within the element.
              if (this.getComputedTextLength() > lbWidth) {
                (function () {
                  d3.select(_this)
                    .attr('title', d.name)
                    .on('mouseover', legendTip.show)
                    .on('mouseout', legendTip.hide);
                  var i = 1;
                  while (_this.getComputedTextLength() > lbWidth) {
                    d3.select(_this).text(function (d) {
                      return d['name'].slice(0, -i) + '...';
                    });
                    ++i;
                  }
                })();
              } else {
                return d;
              }
            }
          });
        }; // legendEnter ends

        // Let scroll legendBox from anywhere inside g container
        legendBox
          .append('rect')
          .attr('class', 'legendBoxBackground')
          .attr('width', '160px')
          .attr('height', '90%')
          .attr('transform', 'translate(0,0)')
          .style('fill', 'transparent');

        var legendUpdate = function legendUpdate(legendCheck) {
          legendCheck.select('rect').attr('fill', function (d) {
            return vm._scales.color(d.name);
          });

          legendCheck.select('text').text(function (d) {
            // External function call. It must be after all the internal code; allowing the user to overide
            // External function call. It must be after all the internal code; allowing the user to overide
            // External function call. It must be after all the internal code; allowing the user to overide
            return d.name;
          });

          legendCheck.selectAll('text').each(function (d) {
            var _this2 = this;

            if (typeof d.name === 'string') {
              // getComputedTextLenght: Returns a float representing the computed length for the text within the element.
              if (this.getComputedTextLength() > lbWidth) {
                (function () {
                  d3.select(_this2)
                    .attr('title', d.name)
                    .on('mouseover', legendTip.show)
                    .on('mouseout', legendTip.hide);
                  var i = 1;
                  while (_this2.getComputedTextLength() > lbWidth) {
                    d3.select(_this2).text(function (d) {
                      return d['name'].slice(0, -i) + '...';
                    });
                    ++i;
                  }
                })();
              } else {
                return d;
              }
            }
          });
        };

        var legendExit = function legendExit(legendCheck) {};

        virtualScroller = vm.helper.utils
          .VirtualScroller()
          .rowHeight(size)
          .enter(legendEnter)
          .update(legendUpdate)
          .exit(legendExit)
          .svg(vm._fullSvg)
          .totalRows(vm._config.legend.length)
          .viewport(d3.select('.empty-chart'))
          .lineNumber(lineNumber);

        virtualScroller.data(vm._config.legend, function (d) {
          return d.name;
        });
        legendBox.call(virtualScroller);

        // End of checkbox case
      } else {
        var legend;
        if (vm._config.styles && vm._addStyle.legend.position === 'bottom') {
          legend = legendBox
            .selectAll('.legend')
            .data(vm._config.legend)
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('width', vm._width / (vm._config.legend.length + 1))
            .attr('transform', function (d, i) {
              // Horizontal position
              // What if there are too many legends?
              return (
                'translate(' +
                (vm._width / (vm._config.legend.length + 1)) * i +
                ',' +
                (vm._config.legendTitle && lineNumber > 1
                  ? lineNumber * lineHeight
                  : 0) *
                  19 +
                ')'
              );
            });
        } else {
          legend = legendBox
            .selectAll('.legend')
            .data(vm._config.legend)
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', function (d, i) {
              return (
                'translate(' +
                5 +
                ',' +
                (vm._config.legendTitle && lineNumber > 1
                  ? lineNumber * lineHeight + i
                  : 1 + i) *
                  19 +
                ')'
              );
            });
        }

        if (vm._addStyle.legend.figure === 'circle') {
          legend
            .append('circle')
            .attr('cx', 2)
            .attr('cy', 9)
            .attr('r', 7)
            .attr('stroke-width', 2)
            .attr('stroke', function (d) {
              return vm._scales.color(d.name);
            })
            .attr('fill', function (d) {
              return vm._scales.color(d.name);
            })
            .attr('fill-opacity', 0.8);
        } else {
          legend
            .append('rect')
            .attr('x', 0)
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', function (d) {
              return vm._scales.color(d.name);
            });
        }

        legend
          .append('text')
          .attr('x', 20)
          .attr('y', 9)
          .attr('dy', '.35em')
          .attr('text-anchor', 'start')
          .text(function (d) {
            // External function call. It must be after all the internal code; allowing the user to overide
            return d.name;
          });

        // Cut label text if text size exceeds 80% of container
        var _lbWidth = vm._config.size.margin.right - 19;
        legend.selectAll('text').each(function (d) {
          var _this3 = this;

          if (typeof d.name === 'string') {
            if (this.getComputedTextLength() > _lbWidth) {
              (function () {
                d3.select(_this3)
                  .attr('title', d.name)
                  .on('mouseover', legendTip.show)
                  .on('mouseout', legendTip.hide);
                var i = 1;
                while (_this3.getComputedTextLength() > _lbWidth) {
                  d3.select(_this3).text(function (d) {
                    return d['name'].slice(0, -i) + '...';
                  });
                  ++i;
                }
              })();
            } else {
              return d;
            }
          }
        });
      }

      /**
       * Give some extra style
       */

      legendBox
        .selectAll('.legend text')
        .attr('fill', vm._addStyle.legend.text.textColor)
        .attr('font-size', vm._addStyle.legend.text.fontSize)
        .attr('font-weight', vm._addStyle.legend.text.fontWeight);

      // Prevent default scrolling of all elements inside legendBox
      var isFirefox = typeof InstallTrigger !== 'undefined';
      var support =
        'onwheel' in d3.select('.legendBox')
          ? 'wheel' // Modern browsers support 'wheel'
          : document.onmousewheel !== undefined
          ? 'mousewheel' // Webkit and IE support at least 'mousewheel'
          : 'DOMMouseScroll'; // let's assume that remaining browsers are older Firefox
      if (isFirefox) {
        // Newer Firefox versions support wheel events.
        // DOMMouseScroll is not supported yet.
        support = 'wheel';
      }
      d3.select('.legendBoxBackground').on(support, function () {
        var evt = d3.event;
        evt.preventDefault();
      });

      d3.select('.scroll-legend').on(support, function () {
        var evt = d3.event;
        evt.preventDefault();
      });

      legendBox.selectAll('text').on(support, function () {
        var evt = d3.event;
        evt.preventDefault();
      });

      legendBox.selectAll('rect').on(support, function () {
        var evt = d3.event;
        evt.preventDefault();
      });

      legendBox.selectAll('path').on(support, function () {
        var evt = d3.event;
        evt.preventDefault();
      });
    };

    Chart.drawGrid = function () {
      var vm = this;
      return vm;
    };

    Chart.drawAxes = function () {
      var vm = this;
      var yAxis;

      /**
       * Draw axes depends on axes config and styles.
       * Let's start with config.
       */

      //Axes tooltip
      var axesTip = vm.helper.utils.d3.tip().html(function (d) {
        return '<div class="title-tip">' + d + '</div>';
      });

      if (
        (!vm._config.yAxis ||
          (vm._config.yAxis && vm._config.yAxis.enabled !== false)) &&
        (!vm._config.xAxis ||
          (vm._config.xAxis && vm._config.xAxis.enabled !== false))
      ) {
        vm._svg.call(axesTip);
      }

      /**
       * Config axes
       */

      // y

      if (
        !vm._config.yAxis ||
        (vm._config.yAxis && vm._config.yAxis.enabled !== false)
      ) {
        yAxis = vm._svg.append('g').attr('class', 'y axis').call(vm._axes.y);

        if (vm._config.yAxis && vm._config.yAxis.text) {
          yAxis
            .append('text')
            .attr('class', 'axis-title')
            .attr('y', -vm._margin.left * 0.7)
            .attr('x', -vm._height / 2)
            .attr('transform', 'rotate(-90)')
            .attr('text-anchor', 'middle')
            .text(vm._config.yAxis.text);
        }

        if (vm._config.yAxis && vm._config.yAxis.scaleText) {
          yAxis
            .append('text')
            .attr('class', 'axis-scale-title')
            .attr('y', -12)
            .attr('x', -12)
            .attr('font-weight', 'bold')
            .attr('text-anchor', 'middle')
            .text(vm._config.yAxis.scaleText);
        }
      }

      if (
        vm._config.yAxis.domain &&
        vm._config.yAxis.domain.hasOwnProperty('enabled')
      ) {
        if (vm._config.yAxis.ticks) {
          if (
            vm._config.yAxis.domain.enabled === false &&
            vm._config.yAxis.ticks.enabled === false
          ) {
            d3.select('g.y.axis .domain').remove();
            d3.selectAll('g.y.axis .tick').remove();
          } else if (
            vm._config.yAxis.domain.enabled === false &&
            vm._config.yAxis.ticks.enabled === true
          ) {
            d3.select('g.y.axis .domain').remove();
            // d3.selectAll('g.y.axis .tick text').remove();
          }
        } else {
          if (vm._config.yAxis.domain.enabled === false) {
            d3.select('g.y.axis .domain').remove();
            d3.selectAll('g.y.axis .tick').remove();
          }
        }
      }

      if (
        !vm._config.yAxis ||
        (vm._config.yAxis && vm._config.yAxis.enabled !== false)
      ) {
        // Add ellipsis to cut label text when too long
        // for yAxis on the left
        yAxis.selectAll('text').each(function (d) {
          var _this4 = this;

          var element = this;
          if (typeof d === 'string') {
            if (this.getComputedTextLength() > 0.8 * vm._margin.left) {
              (function () {
                d3.select(element)
                  .on('mouseover', axesTip.show)
                  .on('mouseout', axesTip.hide);
                var i = 1;
                while (_this4.getComputedTextLength() > 0.8 * vm._margin.left) {
                  d3.select(_this4)
                    .text(function (d) {
                      return d.slice(0, -i) + '...';
                    })
                    .attr('title', d);
                  ++i;
                }
              })();
            } else {
              return d;
            }
          }
        });
      }

      // Dropdown Y axis
      if (
        vm._config.yAxis &&
        vm._config.yAxis.dropdown &&
        vm._config.yAxis.dropdown.enabled === true
      ) {
        var yAxisDropDown = d3
          .select(vm._config.bindTo)
          .append('div')
          .attr('class', 'dbox-yAxis-select')
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

        var x =
          (-1 *
            d3.select(vm._config.bindTo).node().getBoundingClientRect().width) /
            2 +
          vm._margin.left / 2.5;
        var y =
          (-1 *
            d3.select(vm._config.bindTo).node().getBoundingClientRect()
              .height) /
          1.5;

        if (vm._config.yAxis.dropdown.styles) {
          var styles = vm._config.yAxis.dropdown.styles;
          styles.display = 'block';
          styles.transform =
            'translate(' + x + 'px,' + y + 'px) rotate(-90deg)';
          styles.margin = 'auto';
          styles['text-align'] = 'center';
          styles['text-align-last'] = 'center';

          d3.select('.dbox-yAxis-select select').styles(styles);

          d3.select('.dbox-yAxis-select select option').styles({
            'text-align': 'left',
          });
        } else {
          d3.select('.dbox-yAxis-select select').styles({
            display: 'block',
            transform: 'translate(' + x + 'px,' + y + 'px) rotate(-90deg)',
            margin: 'auto',
            'text-align': 'center',
            'text-align-last': 'center',
          });

          d3.select('.dbox-yAxis-select select option').styles({
            'text-align': 'left',
          });
        }

        if (vm._config.yAxis.dropdown.options) {
          yAxisDropDown
            .selectAll('option')
            .data(vm._config.yAxis.dropdown.options)
            .enter()
            .append('option')
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
      if (
        !vm._config.xAxis ||
        (vm._config.xAxis && vm._config.xAxis.enabled !== false)
      ) {
        vm._xAxis = vm._svg
          .append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + vm._height + ')')
          .call(vm._axes.x);

        // Move axis domain line
        if (
          vm._config.yAxis.scale === 'linear' &&
          vm._scales.y.domain()[0] < 0
        ) {
          vm._xAxis
            .select('.domain')
            .attr(
              'transform',
              'translate(0,-' +
                Math.abs(vm._scales.y.range()[0] - vm._scales.y(0)) +
                ')'
            );
        }

        // Do not show line if axis is disabled
        if (vm._config.xAxis.line && vm._config.xAxis.line.enabled === false) {
          vm._xAxis.selectAll('path').style('display', 'none');
        }

        // Set custom position for ticks
        if (vm._config.xAxis.ticks && vm._config.xAxis.ticks.x) {
          vm._xAxis.selectAll('text').attr('dx', vm._config.xAxis.ticks.x);
        }

        if (vm._config.xAxis.ticks && vm._config.xAxis.ticks.y) {
          vm._xAxis.selectAll('text').attr('dy', vm._config.xAxis.ticks.y);
        }

        // Disable ticks when set to false
        if (
          vm._config.xAxis.ticks &&
          vm._config.xAxis.ticks.line &&
          vm._config.xAxis.ticks.line.enabled === false
        ) {
          vm._xAxis.selectAll('line').style('display', 'none');
        }
      }

      if (vm._config.xAxis && vm._config.xAxis.text) {
        vm._svg
          .select('.x.axis')
          .append('text')
          .attr('class', 'axis-title')
          .attr('x', vm._width / 2)
          .attr('y', 40)
          .style('text-anchor', 'middle')
          .text(vm._config.xAxis.text);
      }

      if (vm._config.xAxis && vm._config.xAxis.scaleText && vm._xAxis) {
        vm._xAxis
          .append('text')
          .attr('class', 'axis-scale-title')
          .attr('x', vm._width)
          .attr('y', 15)
          .style('text-anchor', 'start')
          .text(vm._config.xAxis.scaleText);
      }

      if (
        vm._config.xAxis.domain !== undefined &&
        vm._config.xAxis.domain.hasOwnProperty('enabled')
      ) {
        if (vm._config.xAxis.ticks) {
          if (
            vm._config.xAxis.domain.enabled === false &&
            vm._config.xAxis.ticks.enabled === false
          ) {
            d3.select(vm._config.bindTo + ' g.x.axis .domain').remove();
            d3.selectAll('g.x.axis .tick').remove();
          } else if (
            vm._config.xAxis.domain.enabled === false &&
            vm._config.xAxis.ticks.enabled === true
          ) {
            d3.select(vm._config.bindTo + ' g.x.axis .domain').remove();
            // d3.selectAll('g.x.axis .tick text').remove();
          }
        } else {
          if (vm._config.xAxis.domain.enabled === false) {
            d3.select(vm._config.bindTo + ' g.x.axis .domain').remove();
            d3.selectAll(vm._config.bindTo + ' g.x.axis .tick').remove();
          }
        }
      }

      // Dropdown X axis
      if (
        vm._config.xAxis &&
        vm._config.xAxis.dropdown &&
        vm._config.xAxis.dropdown.enabled === true
      ) {
        var xAxisDropDown = d3
          .select(vm._config.bindTo)
          .append('div')
          .attr('class', 'dbox-xAxis-select')
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
            'text-align': 'left',
          });
        } else {
          d3.select('.dbox-xAxis-select select').styles({
            display: 'block',
            margin: 'auto',
            'text-align': 'center',
            'text-align-last': 'center',
          });

          d3.select('.dbox-xAxis-select select option').styles({
            'text-align': 'left',
          });
        }

        if (vm._config.xAxis.dropdown.options) {
          xAxisDropDown
            .selectAll('option')
            .data(vm._config.xAxis.dropdown.options)
            .enter()
            .append('option')
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
      // Style Y axis
      if (vm._config.yAxis.enabled !== false && vm._addStyle.yAxis.enabled) {
        // Axis line
        yAxis
          .selectAll('.domain')
          .attr('stroke-linecap', 'round')
          .attr('stroke-width', vm._addStyle.yAxis.axis.strokeWidth)
          .attr('stroke', vm._addStyle.yAxis.axis.strokeColor)
          .attr('opacity', vm._addStyle.yAxis.axis.strokeOpacity);

        //axis title
        yAxis
          .selectAll('.axis-title')
          .attr('font-size', vm._addStyle.yAxis.title.fontSize)
          .attr('font-weight', vm._addStyle.yAxis.title.fontWeight)
          .attr('fill', vm._addStyle.yAxis.title.textColor)
          .attr('text-anchor', vm._addStyle.yAxis.title.textAnchor);

        // Tick lines
        yAxis
          .selectAll('.tick line')
          .attr('stroke-width', vm._addStyle.yAxis.ticks.strokeWidth)
          .attr('stroke', vm._addStyle.yAxis.ticks.strokeColor)
          .attr('stroke-opacity', vm._addStyle.yAxis.ticks.opacity)
          .attr('width', vm._addStyle.yAxis.ticks.tickWidth)
          // Condition gridline
          .attr('stroke-dasharray', vm._addStyle.yAxis.ticks.gridDashed)
          .attr(
            'transform',
            'translate(-' + vm._addStyle.yAxis.axis.paddingTick + ', 0)'
          );
        // Don't draw first tick when styled as grid
        if (vm._addStyle.yAxis.ticks.grid) {
          yAxis
            .selectAll('.tick:first-of-type line:first-of-type')
            .attr('stroke', 'none');
        }

        // Tick text
        yAxis
          .selectAll('.tick text')
          .attr('font-size', vm._addStyle.yAxis.labels.fontSize)
          .attr('font-weight', vm._addStyle.yAxis.labels.fontWeight)
          .attr('fill', vm._addStyle.yAxis.labels.textColor)
          .attr('text-anchor', vm._addStyle.yAxis.labels.textAnchor)
          .attr(
            'transform',
            'translate(-' + vm._addStyle.yAxis.axis.paddingTick + ', 0)'
          );
      }

      // Style X axis
      if (vm._config.xAxis.enabled !== false && vm._addStyle.xAxis.enabled) {
        // Axis line
        vm._xAxis
          .selectAll('.domain')
          .attr('stroke-linecap', 'round')
          .attr('stroke-width', vm._addStyle.xAxis.axis.strokeWidth)
          .attr('stroke', vm._addStyle.xAxis.axis.strokeColor)
          .attr('opacity', vm._addStyle.xAxis.axis.strokeOpacity);

        // Tick lines
        vm._xAxis
          .selectAll('.tick line')
          .attr('stroke-width', vm._addStyle.xAxis.ticks.strokeWidth)
          .attr('stroke', vm._addStyle.xAxis.ticks.strokeColor)
          .attr(
            'transform',
            'translate(0, ' + vm._addStyle.xAxis.axis.paddingTick + ')'
          );
        // Don't draw first tick when styled as grid
        if (vm._addStyle.xAxis.ticks.grid) {
          vm._xAxis
            .selectAll('.tick:first-of-type line:first-of-type')
            .attr('stroke', 'none');
        }

        // Tick text
        vm._xAxis
          .selectAll('.tick text')
          .attr('font-size', vm._addStyle.xAxis.labels.fontSize)
          .attr('font-weight', vm._addStyle.xAxis.labels.fontWeight)
          .attr('fill', vm._addStyle.xAxis.labels.textColor)
          .attr('text-anchor', vm._addStyle.xAxis.labels.textAnchor)
          .attr(
            'transform',
            vm._addStyle.xAxis.labels.rotate
              ? 'translate(0,55) rotate(' +
                  vm._addStyle.xAxis.axis.labels.rotate +
                  ')'
              : 'translate(0, ' + vm._addStyle.xAxis.axis.paddingTick + ')'
          );
      }

      var biggestLabelWidth = d3.max(
        d3
          .select('.x.axis')
          .selectAll('text')
          .nodes()
          .map(function (o) {
            return o.getComputedTextLength();
          })
      );
      if (
        !vm._config.xAxis ||
        (vm._config.xAxis && vm._config.xAxis.enabled !== false)
      ) {
        // Add ellipsis to cut label text
        // when it is too long

        // Biggest label computed text length

        var xBandWidth =
          (vm._scales.x.bandwidth
            ? vm._scales.x.bandwidth()
            : (vm._config.size.width -
                (vm._config.size.margin.left + vm._config.size.margin.right)) /
              vm._scales.x.ticks()) - 5;
        if (biggestLabelWidth > xBandWidth) {
          vm._addStyle.xAxis.labels.rotate = true;
          // Biggest label doesn't fit
          vm._xAxis.selectAll('text').each(function (d) {
            var _this5 = this;

            if (typeof d === 'string') {
              // Vertical labels
              d3.select(this)
                .attr('text-anchor', 'end')
                .attr('dy', 0)
                .attr('transform', 'translate(-6,12)rotate(-90)');
              // Still doesn't fit!
              if (
                this.getComputedTextLength() >
                0.8 * vm._config.size.margin.bottom
              ) {
                (function () {
                  d3.select(_this5)
                    .on('mouseover', axesTip.show)
                    .on('mouseout', axesTip.hide);
                  var i = 1;
                  while (
                    _this5.getComputedTextLength() >
                    0.8 * vm._config.size.margin.bottom
                  ) {
                    d3.select(_this5)
                      .text(function (d) {
                        return d.slice(0, -i) + '...';
                      })
                      .attr('title', d);
                    ++i;
                  }
                })();
              } else {
                return d;
              }
            }
          });
        }
      }

      if (vm._config.xAxis.enabled !== false && vm._addStyle.xAxis.enabled) {
        // Axis title
        vm._xAxis
          .selectAll('.axis-title')
          .attr('font-size', vm._addStyle.xAxis.title.fontSize)
          .attr('font-weight', vm._addStyle.xAxis.title.fontWeight)
          .attr('fill', vm._addStyle.xAxis.title.textColor)
          .attr('text-anchor', vm._addStyle.xAxis.title.textAnchor)
          .attr(
            'transform',
            'translate(0, ' +
              (vm._addStyle.xAxis.labels.rotate
                ? d3.min([
                    vm._config.size.margin.bottom * 0.7,
                    biggestLabelWidth,
                  ])
                : vm._addStyle.xAxis.axis.paddingTick) +
              ')'
          );
      }

      /**
       * Already replaced with addStyle
       */
      /*if (vm._config.yAxis && vm._config.yAxis.enabled !== false) {
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
      }*/

      // Set ticks straight or dashed, to be replaced with *addStyle -checked
      if (
        vm._config.yAxis.ticks &&
        vm._config.yAxis.ticks.enabled &&
        vm._config.yAxis.ticks.style
      ) {
        switch (vm._config.yAxis.ticks.style) {
          case 'straightLine':
            break;
          case 'dashLine':
            d3.selectAll('g.y.axis .tick line').attr(
              'stroke-dasharray',
              '5, 5'
            );
            break;
        }
      }
      // To be replaced with *addStyle -checked
      if (
        vm._config.yAxis.domain &&
        vm._config.yAxis.domain.enabled &&
        vm._config.yAxis.domain.stroke
      ) {
        d3.select('g.y.axis .domain').attr(
          'stroke',
          vm._config.yAxis.domain.stroke
        );
      }

      // To be replaced with *addStyle -checked
      if (
        vm._config.yAxis.domain &&
        vm._config.yAxis.domain.enabled &&
        vm._config.yAxis.domain['stroke-width']
      ) {
        d3.select('g.y.axis .domain').attr(
          'stroke-width',
          vm._config.yAxis.domain['stroke-width']
        );
      }

      // y

      /////////////////////////////

      // x

      if (
        !vm._config.xAxis ||
        (vm._config.xAxis && vm._config.xAxis.enabled !== false)
      ) {
        // To be replaced with *addStyle -checked
        if (vm._config.xAxis.ticks && vm._config.xAxis.ticks.style) {
          Object.keys(vm._config.xAxis.ticks.style).forEach(function (k) {
            vm._xAxis
              .selectAll('text')
              .style(k, vm._config.xAxis.ticks.style[k]);
          });
        }

        // Set rotation for ticks, to be replaced with *addStyle -checked
        if (vm._config.xAxis.ticks && vm._config.xAxis.ticks.rotate) {
          vm._xAxis
            .selectAll('text')
            .attr('text-anchor', 'end')
            .attr('transform', 'rotate(' + vm._config.xAxis.ticks.rotate + ')');
        }

        // Set ticks straight or dashed, to be replaced with *addStyle -checked
        if (
          vm._config.xAxis.ticks &&
          vm._config.xAxis.ticks.enabled &&
          vm._config.xAxis.ticks.style
        ) {
          switch (vm._config.xAxis.ticks.style) {
            case 'straightLine':
              break;
            case 'dashLine':
              d3.selectAll(vm._config.bindTo + ' g.x.axis .tick line').attr(
                'stroke-dasharray',
                '5, 5'
              );
              break;
          }
        }
      }

      // To be replaced with *addStyle -checked
      if (
        vm._config.xAxis.domain &&
        vm._config.xAxis.domain.enabled &&
        vm._config.xAxis.domain.stroke
      ) {
        d3.select(vm._config.bindTo + ' g.x.axis .domain').attr(
          'stroke',
          vm._config.xAxis.domain.stroke
        );
      }

      // To be replaced with *addStyle -checked
      if (
        vm._config.xAxis.domain &&
        vm._config.xAxis.domain.enabled &&
        vm._config.xAxis.domain['stroke-width']
      ) {
        d3.select(vm._config.bindTo + ' g.x.axis .domain').attr(
          'stroke-width',
          vm._config.xAxis.domain['stroke-width']
        );
      }
    };

    Chart.updateAxis = function (axis, value) {
      var vm = this;

      if (axis === 'x') {
        vm._config.xAxis.dropdown.options.map(function (obj) {
          if (obj.value === value) {
            obj.selected = true;
          } else {
            obj.selected = false;
          }
        });
      } else if (axis === 'y') {
        vm._config.yAxis.dropdown.options.map(function (obj) {
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

      // Trigger update chart axis
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
      var sorted = [];

      // Default ascending function
      var sortFunctionY = function sortFunctionY(a, b) {
        return vm.utils.sortAscending(a.y, b.y);
      };
      var sortFunctionX = function sortFunctionX(a, b) {
        return vm.utils.sortAscending(a.x, b.x);
      };

      // If applying sort
      if (vm._config.data.sort && vm._config.data.sort.order) {
        switch (vm._config.data.sort.order) {
          case 'asc':
            sortFunctionY = function sortFunctionY(a, b) {
              return vm.utils.sortAscending(a.y, b.y);
            };
            sortFunctionX = function sortFunctionX(a, b) {
              return vm.utils.sortAscending(a.x, b.x);
            };
            break;

          case 'desc':
            sortFunctionY = function sortFunctionY(a, b) {
              return vm.utils.sortDescending(a.y, b.y);
            };
            sortFunctionX = function sortFunctionX(a, b) {
              return vm.utils.sortDescending(a.x, b.x);
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
            // The xAxis order depends on the yAxis values
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

      // yAxis
      if (vm._config.yAxis && vm._config.yAxis.scale) {
        switch (vm._config.yAxis.scale) {
          case 'linear':
            minMax = d3.extent(data, function (d) {
              return d.y;
            });

            // Adjust for min values greater than zero
            // Set the min value to -10%
            if (minMax[0] > 0) {
              minMax[0] = minMax[0] - (minMax[1] - minMax[0]) * 0.1;
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
              sorted = data.sort(function (a, b) {
                return vm.utils.sortAscending(a.y, b.y);
              });
              domains.y = [];
              sorted.forEach(function (d) {
                domains.y.push(d.x);
              });
            } else {
              domains.y = d3
                .map(data, function (d) {
                  return d.y;
                })
                .keys()
                .sort(function (a, b) {
                  return vm.utils.sortAscending(a, b);
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

  /*
   * Simple Bar chart
   */
  function bars(config, helper) {
    //Link Bars to the helper object in helper.js
    var Bars = Object.create(helper);

    Bars.init = function (config) {
      var vm = this;

      vm._config = config ? config : {};
      vm._data = [];
      vm._scales = {};
      console.log(vm._config);
      vm._tip = vm.utils.d3
        .tip()
        .attr(
          'class',
          'd3-tip ' +
            (vm._config.tooltip && vm._config.tooltip.classed
              ? vm._config.tooltip.classed
              : '')
        )
        .direction('n')
        .html(
          vm._config.tip ||
            function (d) {
              var html = '';
              html += d[vm._config.x]
                ? '<span>' +
                  (Number.isNaN(+d[vm._config.x]) ||
                  vm._config.xAxis.scale === 'band'
                    ? d[vm._config.x]
                    : vm.utils.format(vm._config.xAxis)(d[vm._config.x])) +
                  '</span></br>'
                : '';
              html += d[vm._config.y]
                ? '<span>' +
                  (Number.isNaN(+d[vm._config.y]) ||
                  vm._config.yAxis.scale === 'band'
                    ? d[vm._config.y]
                    : vm.utils.format(vm._config.yAxis)(d[vm._config.y])) +
                  '</span></br>'
                : '';
              return html;
            }
        );
    };

    //-------------------------------
    //User config functions
    Bars.id = function (columnName) {
      var vm = this;
      vm._config.id = columnName;
      return vm;
    };

    Bars.x = function (columnName) {
      var vm = this;
      vm._config.x = columnName;
      return vm;
    };

    Bars.y = function (columnName) {
      var vm = this;
      vm._config.y = columnName;
      return vm;
    };

    /**
     * Used to draw a bar chart with multiple bars per group
     * @param {array} columns
     */
    Bars.groupBy = function (columns) {
      var vm = this;
      vm._config.groupBy = columns;
      return vm;
    };

    /**
     * Used to draw a bar chart stacked with multiple bars per group
     * @param {array} columns
     */
    Bars.stackBy = function (columnName) {
      var vm = this;
      vm._config.stackBy = columnName;
      return vm;
    };

    /**
     * column name used for the domain values
     * @param {string} columnName
     */
    Bars.fill = function (columnName) {
      var vm = this;
      vm._config.fill = columnName;
      return vm;
    };

    /**
     * array of values used
     * @param {array or scale} columnName
     */
    Bars.colors = function (colors) {
      var vm = this;
      if (Array.isArray(colors)) {
        // Using an array of colors for the range
        vm._config.colors = colors;
      } else {
        //Using a preconfigured d3.scale
        vm._scales.color = colors;
      }
      return vm;
    };

    Bars.sortBy = function (option) {
      //option = string [asc,desc]
      //option = array for groupBy and stackBy
      var vm = this;
      vm._config.sortBy = option;
      return vm;
    };

    Bars.format = function (format) {
      var vm = this;
      if (typeof format == 'function' || format instanceof Function) {
        vm.utils.format = format;
      } else {
        vm.utils.format = d3.format(format);
      }
      return vm;
    };

    Bars.tip = function (tip) {
      var vm = this;
      vm._config.tip = tip;
      return vm;
    };

    Bars.legend = function (legend) {
      var vm = this;
      vm._config.legend = legend;
      return vm;
    };

    //-------------------------------
    //Triggered by the chart.js;
    Bars.data = function (data) {
      var vm = this;

      if (vm._config.filter) {
        //In case we want to filter observations
        data = data.filter(vm._config.filter);
      }

      if (
        vm._config.hasOwnProperty('stackBy') &&
        Array.isArray(vm._config.stackBy) &&
        vm._config.stackBy.length > 0
      ) {
        // Used in a stackbar, transpose the data into layers
        vm._data = d3.stack().keys(vm._config.stackBy)(data);
      } else {
        // Normal bar, save the data as numbers
        vm._data = data.map(function (d) {
          if (d[vm._config.x] == Number(d[vm._config.x]))
            d[vm._config.x] = +d[vm._config.x];
          if (d[vm._config.y] == Number(d[vm._config.y]))
            d[vm._config.y] = +d[vm._config.y];
          return d;
        });
      }

      //@TODO - ALLOW MULITPLE SORTS
      if (vm._config.sortBy) {
        vm._data = vm._data.sort(function (a, b) {
          return a[vm._config.sortBy[0]] - b[vm._config.sortBy[0]];
        });
      }

      if (vm._config.hasOwnProperty('quantiles')) {
        vm._quantiles = vm._setQuasecondntile(data);
        vm._minMax = d3.extent(data, function (d) {
          return +d[vm._config.fill];
        });
      }

      return vm;
    };

    Bars.scales = function () {
      var vm = this;
      var config;
      // vm._scales = scales;
      /* Use
       * vm._config.x
       * vm._config.xAxis.scale
       * vm._config.y
       * vm._config.yAxis.scale
       * vm._data
       */
      //Normal bars
      if (vm._config.hasOwnProperty('x') && vm._config.hasOwnProperty('y')) {
        config = {
          column: vm._config.x,
          type: vm._config.xAxis.scale,
          range: [0, vm.chart.width],
          minZero: vm._config.xAxis.minZero,
        };
        if (vm._config.xAxis.domains) {
          config.domains = vm._config.xAxis.domains;
        }
        vm._scales.x = vm.utils.generateScale(vm._data, config);

        config = {
          column: vm._config.y,
          type: vm._config.yAxis.scale,
          range: [vm.chart.height, 0],
          minZero: vm._config.yAxis.minZero,
        };
        if (vm._config.yAxis.domains) {
          config.domains = vm._config.yAxis.domains;
        }
        vm._scales.y = vm.utils.generateScale(vm._data, config);
      }

      //GroupBy bars on the xAxis
      if (
        vm._config.hasOwnProperty('x') &&
        vm._config.hasOwnProperty('groupBy')
      ) {
        /* Generate x scale */
        config = {
          column: vm._config.x,
          type: vm._config.xAxis.scale,
          groupBy: 'parent',
          range: [0, vm.chart.width],
          minZero: vm._config.xAxis.minZero,
        };
        if (vm._config.xAxis.domains) {
          config.domains = vm._config.xAxis.domains;
        }
        vm._scales.x = vm.utils.generateScale(vm._data, config);

        /* Generate groupBy scale */
        config = {
          column: vm._config.groupBy,
          type: 'band',
          groupBy: 'children',
          range: [0, vm._scales.x.bandwidth()],
        };
        vm._scales.groupBy = vm.utils.generateScale(vm._data, config);
        //vm.chart.scales.groupBy = vm._scales.groupBy;

        /* Generate y scale */
        config = {
          column: vm._config.groupBy,
          type: vm._config.yAxis.scale,
          groupBy: 'data',
          range: [vm.chart.height, 0],
          minZero: vm._config.yAxis.minZero,
        };
        if (vm._config.yAxis.domains) {
          config.domains = vm._config.yAxis.domains;
        }
        vm._scales.y = vm.utils.generateScale(vm._data, config);
      }

      //GroupBy bars on the yAxis
      if (
        vm._config.hasOwnProperty('y') &&
        vm._config.hasOwnProperty('groupBy')
      ) {
        /* Generate y scale */
        config = {
          column: vm._config.y,
          type: vm._config.yAxis.scale,
          groupBy: 'parent',
          range: [0, vm.chart.height],
          minZero: vm._config.yAxis.minZero,
        };
        if (vm._config.yAxis.domains) {
          config.domains = vm._config.yAxis.domains;
        }
        vm._scales.y = vm.utils.generateScale(vm._data, config);

        /* Generate groupBy scale */
        config = {
          column: vm._config.groupBy,
          type: 'band',
          groupBy: 'children',
          range: [0, vm._scales.y.bandwidth()],
        };
        vm._scales.groupBy = vm.utils.generateScale(vm._data, config);
        //vm.chart.scales.groupBy = vm._scales.groupBy;

        /* Generate x scale */
        config = {
          column: vm._config.groupBy,
          type: vm._config.xAxis.scale,
          groupBy: 'data',
          range: [0, vm.chart.width],
          minZero: vm._config.xAxis.minZero,
        };
        if (vm._config.xAxis.domains) {
          config.domains = vm._config.xAxis.domains;
        }
        vm._scales.x = vm.utils.generateScale(vm._data, config);
      }

      //Stack bars on the xAxis
      if (
        vm._config.hasOwnProperty('x') &&
        vm._config.hasOwnProperty('stackBy')
      ) {
        /* Generate x scale */
        config = {
          column: vm._config.x,
          type: vm._config.xAxis.scale,
          stackBy: 'parent',
          range: [0, vm.chart.width],
          minZero: vm._config.xAxis.minZero,
        };
        if (vm._config.xAxis.domains) {
          config.domains = vm._config.xAxis.domains;
        }
        vm._scales.x = vm.utils.generateScale(vm._data, config);

        /* Generate y scale */
        config = {
          column: '',
          stackBy: 'data',
          type: vm._config.yAxis.scale,
          range: [vm.chart.height, 0],
          minZero: vm._config.yAxis.minZero,
        };
        if (vm._config.yAxis.domains) {
          config.domains = vm._config.yAxis.domains;
        }
        vm._scales.y = vm.utils.generateScale(vm._data, config);
      }

      // Stack bars on the yAxis
      if (
        vm._config.hasOwnProperty('y') &&
        vm._config.hasOwnProperty('stackBy')
      ) {
        /* Generate x scale */
        config = {
          column: '',
          type: vm._config.xAxis.scale,
          stackBy: 'data',
          range: [0, vm.chart.width],
          minZero: vm._config.xAxis.minZero,
        };
        if (vm._config.xAxis.domains) {
          config.domains = vm._config.xAxis.domains;
        }
        vm._scales.x = vm.utils.generateScale(vm._data, config);

        /* Generate y scale */
        config = {
          column: vm._config.y,
          stackBy: 'parent',
          type: vm._config.yAxis.scale,
          range: [vm.chart.height, 0],
          minZero: vm._config.yAxis.minZero,
        };
        if (vm._config.yAxis.domains) {
          config.domains = vm._config.yAxis.domains;
        }
        vm._scales.y = vm.utils.generateScale(vm._data, config);
      }

      //vm.chart.scales.x = vm._scales.x;
      //vm.chart.scales.y = vm._scales.y;

      if (
        !vm._scales.color ||
        (vm._scales.color && vm._scales.color.domain().length === 0)
      ) {
        if (vm._config.hasOwnProperty('colors')) {
          vm._scales.color = d3.scaleOrdinal(vm._config.colors);
        } else {
          vm._scales.color = d3.scaleOrdinal(d3.schemeCategory10);
        }
        if (vm._data && vm._data.length > 0) {
          vm._scales.color.domain(
            _$1.uniq(
              vm._data.map(function (d) {
                return d[vm._config.fill];
              })
            )
          );
        }
        if (vm._config.legend && vm._config.legend.length > 0) {
          vm._scales.color.domain(
            vm._config.legend.map(function (d) {
              return d.name;
            })
          );
        }
        return vm;
      }
    };

    Bars.drawLabels = function () {
      var vm = this;

      var charContainer = vm.chart
        .svg()
        .selectAll('.dbox-label')
        .data(vm._data);

      charContainer
        .enter()
        .append('text')
        .attr('class', 'dbox-label')
        .attr('x', function (d) {
          var value = vm._scales.x(d[vm._config.x]);
          if (vm._config.xAxis.scale == 'linear') {
            if (d[vm._config.x] > 0) {
              value = vm._scales.x(0);
            }
          }
          return value;
        })
        .attr('y', function (d) {
          var value = vm._scales.y(d[vm._config.y]);
          var barH = vm._scales.y.bandwidth
            ? vm._scales.y.bandwidth()
            : Math.abs(vm._scales.y(d[vm._config.y]) - vm._scales.y(0));
          if (vm._config.yAxis.scale === 'linear') {
            if (d[vm._config.y] < 0) {
              value = vm._scales.y(0);
            }
          } else if (vm._config.yAxis.scale !== 'linear') {
            value = value + barH;
          }
          // if (barH < 50) {
          //   return value - 30;
          // }
          return value - 7;
        })
        .attr('transform', function (d) {
          var barW = vm._scales.x.bandwidth
            ? vm._scales.x.bandwidth()
            : Math.abs(vm._scales.x(d[vm._config.x]) - vm._scales.x(0));
          if (!isNaN(d[vm._config.y])) {
            return 'translate(' + barW / 2 + ', 0)';
          }
          return 'translate(' + (barW + 30) + ', 0)';
        })
        .attr('text-anchor', 'middle')
        .text(function (d) {
          if (!isNaN(d[vm._config.y])) {
            return vm.utils.format(vm._config.yAxis)(d[vm._config.y])
              ? vm.utils.format(vm._config.yAxis, true)(d[vm._config.y])
              : '';
          }
          return vm.utils.format(vm._config.xAxis)(d[vm._config.x])
            ? vm.utils.format(vm._config.xAxis, true)(d[vm._config.x])
            : '';
        });

      // charContainer.enter().append('text')
      //   .attr('class', 'dbox-label-coefficient dbox-label-bars-coefficient')
      //   .attr('x', function (d) {
      //     var value = vm._scales.x(d[vm._config.x]);
      //     if (vm._config.xAxis.scale == 'linear') {
      //       if (d[vm._config.x] > 0) {
      //         value = vm._scales.x(0);
      //       }
      //     }
      //     return value;
      //   })
      //   .attr('y', function (d) {
      //     var value =  vm._scales.y(d[vm._config.y]);
      //     var barH = vm._scales.y.bandwidth ? vm._scales.y.bandwidth() : Math.abs(vm._scales.y(d[vm._config.y]) - vm._scales.y(0));
      //     if (vm._config.yAxis.scale === 'linear') {
      //       if (d[vm._config.y] < 0) {
      //         value = vm._scales.y(0);
      //       }
      //     }
      //     // if (barH < 50) {
      //     //   return value - 32;
      //     // }
      //     return value + 35;
      //   })
      //   .attr('transform', function(d) {
      //     var barW = vm._scales.x.bandwidth ? vm._scales.x.bandwidth() : Math.abs(vm._scales.x(d[vm._config.x]) - vm._scales.x(0));
      //     if (!isNaN(d[vm._config.y])) {
      //       return 'translate(' + barW/2 + ', 0)';
      //     }
      //     return 'translate(' + (barW + 30) + ', 0)';
      //   })
      //   .attr('text-anchor', 'middle')
      //   .text( function(d) {
      //     return (d.coefficient && !Number.isNaN(d.coefficient)) ? '(' + d.coefficient.toFixed(1) + ')' : '(-)';
      //   });
    };

    Bars.draw = function () {
      var vm = this;
      if (vm._config.hasOwnProperty('groupBy')) {
        if (vm._config.hasOwnProperty('x')) vm._drawGroupByXAxis();
        if (vm._config.hasOwnProperty('y')) vm._drawGroupByYAxis();
        return vm;
      }

      if (vm._config.hasOwnProperty('stackBy')) {
        if (vm._config.hasOwnProperty('x')) vm._drawStackByXAxis();
        if (vm._config.hasOwnProperty('y')) vm._drawStackByYAxis();
        return vm;
      }

      vm.chart.svg().call(vm._tip);

      vm.chart
        .svg()
        .selectAll('.bar')
        .data(vm._data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('id', function (d, i) {
          var id = 'bars-' + i;
          if (vm._config.id) {
            id = 'bars-' + d[vm._config.id];
          }
          return id;
        })
        .attr('x', function (d) {
          var value = vm._scales.x(d[vm._config.x]);
          if (vm._config.xAxis.scale == 'linear') {
            if (d[vm._config.x] > 0) {
              value = vm._scales.x(0);
            }
          }
          return value;
        })
        .attr('y', function (d) {
          var value = vm._scales.y(d[vm._config.y]);
          if (vm._config.yAxis.scale === 'linear') {
            if (d[vm._config.y] < 0) {
              value = vm._scales.y(0);
            }
          }
          return value;
        })
        .attr('width', function (d) {
          return vm._scales.x.bandwidth
            ? vm._scales.x.bandwidth()
            : Math.abs(vm._scales.x(d[vm._config.x]) - vm._scales.x(0));
        })
        .attr('height', function (d) {
          return vm._scales.y.bandwidth
            ? vm._scales.y.bandwidth()
            : Math.abs(vm._scales.y(d[vm._config.y]) - vm._scales.y(0));
        })
        .attr('fill', function (d) {
          return vm._scales.color !== false
            ? vm._scales.color(d[vm._config.fill])
            : vm._getQuantileColor(d[vm._config.fill], 'default');
        })
        .style('opacity', 0.9)
        .on('mouseover', function (d, i) {
          if (
            vm._config.hasOwnProperty('quantiles') &&
            vm._config.quantiles.hasOwnProperty('colorsOnHover')
          ) {
            //OnHover colors
            d3.select(this).attr('fill', function (d) {
              return vm._getQuantileColor(d[vm._config.fill], 'onHover');
            });
          }
          vm._tip.show(d, d3.select(this).node());

          if (vm._config.hasOwnProperty('onmouseover')) {
            //External function call, must be after all the internal code; allowing the user to overide
            vm._config.onmouseover.call(this, d, i);
          }
        })
        .on('mouseout', function (d, i) {
          if (
            vm._config.hasOwnProperty('quantiles') &&
            vm._config.quantiles.hasOwnProperty('colorsOnHover')
          ) {
            //OnHover reset default color
            d3.select(this).attr('fill', function (d) {
              return vm._getQuantileColor(d[vm._config.fill], 'default');
            });
          }
          vm._tip.hide();

          if (vm._config.hasOwnProperty('onmouseout')) {
            //External function call, must be after all the internal code; allowing the user to overide
            vm._config.onmouseout.call(this, d, i);
          }
        })
        .on('click', function (d, i) {
          if (vm._config.hasOwnProperty('click')) {
            vm._config.onclick.call(this, d, i);
          }
        });

      Bars.drawLabels();

      return vm;
    };

    /**
     * Draw bars grouped by
     */

    Bars.drawGroupLabels = function () {
      var vm = this;

      vm.chart
        .svg()
        .selectAll('.grouped')
        .each(function () {
          var el = this;

          d3.select(this)
            .selectAll('rect')
            .each(function (dat, index) {
              d3.select(el)
                .append('text')
                .attr('class', 'dbox-label')
                .attr('transform', function (d) {
                  var barReference = vm._scales.groupBy.bandwidth();
                  if (vm._config.x) {
                    //if (Math.abs(vm._scales.y(d[vm._config.groupBy[index]]) - vm._scales.y(0)) < 50) {
                    return (
                      'translate(' +
                      (vm._scales.groupBy(vm._config.groupBy[index]) +
                        barReference / 2) +
                      ',' +
                      (vm._scales.y(d[vm._config.groupBy[index]]) - 7) +
                      ')'
                    );
                    //}
                    //return 'translate(' + (vm._scales.groupBy(vm._config.groupBy[index]) + 30) + ',' + (vm._scales.y(d[vm._config.groupBy[index]]) + 20) + ')';
                  } else {
                    return (
                      'translate(' +
                      (vm._scales.x(d[vm._config.groupBy[index]]) + 26) +
                      ',' +
                      (vm._scales.groupBy(vm._config.groupBy[index]) +
                        barReference) +
                      ')'
                    );
                  }
                })
                .attr('text-anchor', 'middle')
                .text(function (d) {
                  return d[vm._config.groupBy[index]]
                    ? vm.utils.format(
                        undefined,
                        true
                      )(d[vm._config.groupBy[index]])
                    : '';
                });

              d3.select(el)
                .append('text')
                .attr('class', 'dbox-label-coefficient')
                .attr('transform', function (d) {
                  if (vm._config.x) {
                    if (
                      Math.abs(
                        vm._scales.y(d[vm._config.groupBy[index]]) -
                          vm._scales.y(0)
                      ) < 50
                    ) {
                      return (
                        'translate(' +
                        (vm._scales.groupBy(vm._config.groupBy[index]) + 30) +
                        ',' +
                        vm._scales.y(d[vm._config.groupBy[index]]) +
                        ')'
                      );
                    }
                    return (
                      'translate(' +
                      (vm._scales.groupBy(vm._config.groupBy[index]) + 30) +
                      ',' +
                      (vm._scales.y(d[vm._config.groupBy[index]]) + 40) +
                      ')'
                    );
                  } else {
                    return (
                      'translate(' +
                      (vm._scales.x(d[vm._config.groupBy[index]]) + 26) +
                      ',' +
                      (vm._scales.groupBy(vm._config.groupBy[index]) + 30) +
                      ')'
                    );
                  }
                })
                .attr('text-anchor', 'middle')
                .text(function (d) {
                  return d[vm._config.groupBy[index] + 'coefficient'] &&
                    !Number.isNaN(d[vm._config.groupBy[index] + 'coefficient'])
                    ? '(' +
                        d[vm._config.groupBy[index] + 'coefficient'].toFixed(
                          1
                        ) +
                        ')'
                    : '';
                });
            });
        });
    };

    Bars._drawGroupByXAxis = function () {
      var vm = this;
      vm._tip.html(
        vm._config.tip ||
          function (d) {
            var html = d.key + '<br>';
            if (d.axis !== d.key) {
              html += d.axis + '<br>';
            }
            html += vm.utils.format()(d.value);
            return html;
          }
      );

      vm.chart.svg().call(vm._tip);

      vm.chart
        .svg()
        .append('g')
        .selectAll('g')
        .data(vm._data)
        .enter()
        .append('g')
        .attr('class', 'grouped')
        .attr('transform', function (d) {
          return 'translate(' + vm._scales.x(d[vm._config.x]) + ',0)';
        })
        .selectAll('rect')
        .data(function (d) {
          return vm._config.groupBy.map(function (key) {
            return {
              key: key,
              value: d[key],
              axis: d[vm._config.x],
            };
          });
        })
        .enter()
        .append('rect')
        .attr('x', function (d) {
          return vm._scales.groupBy(d.key);
        })
        .attr('y', function (d) {
          if (d.value > 0) {
            return vm._scales.y(d.value);
          } else {
            return vm._scales.y(0);
          }
        })
        .attr('width', vm._scales.groupBy.bandwidth())
        .attr('height', function (d) {
          return Math.abs(vm._scales.y(d.value) - vm._scales.y(0));
        })
        .attr('fill', function (d) {
          return vm._scales.color(d.key);
        })
        .on('mouseover', function (d, i) {
          if (
            vm._config.hasOwnProperty('quantiles') &&
            vm._config.quantiles.hasOwnProperty('colorsOnHover')
          ) {
            //OnHover colors
            d3.select(this).attr('fill', function (d) {
              return vm._getQuantileColor(d[vm._config.fill], 'onHover');
            });
          }
          vm._tip.show(d, d3.select(this).node());

          if (vm._config.hasOwnProperty('onmouseover')) {
            //External function call. It must be after all the internal code; allowing the user to overide
            vm._config.onmouseover.call(this, d, i);
          }
        })
        .on('mouseout', function (d, i) {
          if (
            vm._config.hasOwnProperty('quantiles') &&
            vm._config.quantiles.hasOwnProperty('colorsOnHover')
          ) {
            // OnHover colors
            d3.select(this).attr('fill', function (d) {
              return vm._getQuantileColor(d[vm._config.fill], 'default');
            });
          }
          vm._tip.hide();

          if (vm._config.hasOwnProperty('onmouseout')) {
            // External function call, must be after all the internal code; allowing the user to overide
            vm._config.onmouseout.call(this, d, i);
          }
        })
        .on('click', function (d, i) {
          if (vm._config.hasOwnProperty('click')) {
            vm._config.onclick.call(this, d, i);
          }
        });

      Bars.drawGroupLabels();
    };

    Bars._drawGroupByYAxis = function () {
      var vm = this;
      vm._tip.html(
        vm._config.tip ||
          function (d) {
            var html = d.key + '<br>';
            if (d.axis !== d.key) {
              html += d.axis + '<br>';
            }
            html += vm.utils.format()(d.value);
            return html;
          }
      );

      vm.chart.svg().call(vm._tip);

      vm.chart
        .svg()
        .append('g')
        .selectAll('g')
        .data(vm._data)
        .enter()
        .append('g')
        .attr('class', 'grouped')
        .attr('transform', function (d) {
          return 'translate(0,' + vm._scales.y(d[vm._config.y]) + ' )';
        })
        .selectAll('rect')
        .data(function (d) {
          return vm._config.groupBy.map(function (key) {
            return {
              key: key,
              value: d[key],
              axis: d[vm._config.y],
            };
          });
        })
        .enter()
        .append('rect')
        .attr('y', function (d) {
          return vm._scales.groupBy(d.key);
        })
        .attr('x', function (d) {
          if (d < 0) {
            return vm._scales.x(d.value);
          } else {
            return vm._scales.x(0);
          }
        })
        .attr('width', function (d) {
          return Math.abs(vm._scales.x(d.value) - vm._scales.x(0));
        })
        .attr('height', vm._scales.groupBy.bandwidth())
        .attr('fill', function (d) {
          return vm._scales.color(d.key);
        })
        .on('mouseover', function (d, i) {
          if (
            vm._config.hasOwnProperty('quantiles') &&
            vm._config.quantiles.hasOwnProperty('colorsOnHover')
          ) {
            //OnHover colors
            d3.select(this).attr('fill', function (d) {
              return vm._getQuantileColor(d[vm._config.fill], 'onHover');
            });
          }
          vm._tip.show(d, d3.select(this).node());

          if (vm._config.hasOwnProperty('onmouseover')) {
            //External function call. It must be after all the internal code; allowing the user to overide
            vm._config.onmouseover.call(this, d, i);
          }
        })
        .on('mouseout', function (d, i) {
          if (
            vm._config.hasOwnProperty('quantiles') &&
            vm._config.quantiles.hasOwnProperty('colorsOnHover')
          ) {
            //OnHover reset default color
            d3.select(this).attr('fill', function (d) {
              return vm._getQuantileColor(d[vm._config.fill], 'default');
            });
          }
          vm._tip.hide();

          if (vm._config.hasOwnProperty('onmouseout')) {
            //External function call, must be after all the internal code; allowing the user to overide
            vm._config.onmouseout.call(this, d, i);
          }
        })
        .on('click', function (d, i) {
          if (vm._config.hasOwnProperty('click')) {
            vm._config.onclick.call(this, d, i);
          }
        });
      Bars.drawGroupLabels();
    };

    /**
     * Draw Stack Labels
     */
    Bars.drawStackLabels = function () {
      var vm = this;
      var groups = vm.chart.svg().selectAll('.division');
      var index = 0;
      groups.each(function (data) {
        var _this = this;

        var stacks = d3.select(this).selectAll('rect').nodes();
        // Get rect height to condition label drawing
        data.forEach(function (d) {
          var el = _this;
          var dat = d;
          var rect = stacks[index];
          index++;
          var rectH = rect.getBBox().height;
          //var rectW = rect.getBBox().width;
          if (rectH > 35) {
            d3.select(el)
              .append('text')
              .attr('class', 'dbox-label')
              .attr('text-anchor', 'middle')
              .attr('transform', function () {
                var barReference;
                if (vm._config.x) {
                  barReference = vm._scales.x.bandwidth();
                  return (
                    'translate(' +
                    (vm._scales.x(dat.data[vm._config.x]) + barReference / 2) +
                    ',' +
                    (vm._scales.y(dat[1]) + 20) +
                    ')'
                  );
                }
                barReference = vm._scales.y.bandwidth();
                return (
                  'translate(' +
                  (vm._scales.x(dat.data[1]) - 30) +
                  ',' +
                  (vm._scales.y(dat.data[vm._config.y]) + barReference / 2) +
                  ')'
                );
              })
              .text(function () {
                return dat.data[data.key]
                  ? vm.utils.format(null, true)(dat.data[data.key])
                  : '';
              });
          }
        });
        index = 0;
      });
    };

    /**
     * Draw bars stacked by x axis
     */
    Bars._drawStackByXAxis = function () {
      var vm = this;
      vm._tip.html(
        vm._config.tip ||
          function (d) {
            var html = '';
            for (var k in d.data) {
              if ((d[1] - d[0]).toFixed(12) === Number(d.data[k]).toFixed(12)) {
                html += k + '<br>';
              }
            }
            html += d.data[vm._config.x];
            return html + '<br>' + vm.utils.format()(d[1] - d[0]);
          }
      );

      vm.chart.svg().call(vm._tip);

      vm.chart
        .svg()
        .append('g')
        .selectAll('g')
        .data(vm._data)
        .enter()
        .append('g')
        .attr('class', 'division')
        .attr('fill', function (d) {
          return vm._scales.color(d.key);
        })
        //.attr('transform', function(d) { return 'translate(0,'+ vm._scales.y(d[vm._config.y]) +' )'; })
        .selectAll('rect')
        .data(function (d) {
          return d;
        })
        .enter()
        .append('rect')
        .attr('y', function (d) {
          return vm._scales.y(d[1]);
        })
        .attr('x', function (d) {
          return vm._scales.x(d.data[vm._config.x]);
        })
        .attr('width', function () {
          return vm._scales.x.bandwidth();
        })
        .attr('height', function (d) {
          return vm._scales.y(d[0]) - vm._scales.y(d[1]);
        })
        .on('mouseover', function (d, i) {
          if (
            vm._config.hasOwnProperty('quantiles') &&
            vm._config.quantiles.hasOwnProperty('colorsOnHover')
          ) {
            //OnHover colors
            d3.select(this).attr('fill', function (d) {
              return vm._getQuantileColor(d[vm._config.fill], 'onHover');
            });
          }
          vm._tip.show(d, d3.select(this).node());

          if (vm._config.hasOwnProperty('onmouseover')) {
            //External function call. It must be after all the internal code; allowing the user to overide
            vm._config.onmouseover.call(this, d, i);
          }
        })
        .on('mouseout', function (d, i) {
          if (
            vm._config.hasOwnProperty('quantiles') &&
            vm._config.quantiles.hasOwnProperty('colorsOnHover')
          ) {
            //OnHover reset default color
            d3.select(this).attr('fill', function (d) {
              return vm._getQuantileColor(d[vm._config.fill], 'default');
            });
          }
          vm._tip.hide();

          if (vm._config.hasOwnProperty('onmouseout')) {
            //External function call, must be after all the internal code; allowing the user to overide
            vm._config.onmouseout.call(this, d, i);
          }
        })
        .on('click', function (d, i) {
          if (vm._config.hasOwnProperty('click')) {
            vm._config.onclick.call(this, d, i);
          }
        });
      Bars.drawStackLabels();
    };

    /**
     * Draw bars stacked by y axis
     */
    Bars._drawStackByYAxis = function () {
      var vm = this;
      vm._tip.html(
        vm._config.tip ||
          function (d) {
            var html = '';
            for (var k in d.data) {
              if ((d[1] - d[0]).toFixed(12) === Number(d.data[k]).toFixed(12)) {
                html += k + '<br>';
              }
            }
            html += d.data[vm._config.y];
            return html + '<br>' + vm.utils.format()(d[1] - d[0]);
          }
      );

      vm.chart.svg().call(vm._tip);

      vm.chart
        .svg()
        .append('g')
        .selectAll('g')
        .data(vm._data)
        .enter()
        .append('g')
        .attr('class', 'division')
        .attr('fill', function (d) {
          return vm._scales.color(d.key);
        })
        .selectAll('rect')
        .data(function (d) {
          return d;
        })
        .enter()
        .append('rect')
        .attr('y', function (d) {
          return vm._scales.y(d.data[vm._config.y]);
        })
        .attr('x', function (d) {
          return vm._scales.x(d[0]);
        })
        .attr('height', function () {
          return vm._scales.y.bandwidth();
        })
        .attr('width', function (d) {
          return vm._scales.x(d[1]) - vm._scales.x(d[0]);
        })
        .on('mouseover', function (d, i) {
          if (
            vm._config.hasOwnProperty('quantiles') &&
            vm._config.quantiles.hasOwnProperty('colorsOnHover')
          ) {
            //OnHover colors
            d3.select(this).attr('fill', function (d) {
              return vm._getQuantileColor(d[vm._config.fill], 'onHover');
            });
          }
          vm._tip.show(d, d3.select(this).node());

          if (vm._config.hasOwnProperty('onmouseover')) {
            //External function call. It must be after all the internal code; allowing the user to overide
            vm._config.onmouseover.call(this, d, i);
          }
        })
        .on('mouseout', function (d, i) {
          if (
            vm._config.hasOwnProperty('quantiles') &&
            vm._config.quantiles.hasOwnProperty('colorsOnHover')
          ) {
            //OnHover reset default color
            d3.select(this).attr('fill', function (d) {
              return vm._getQuantileColor(d[vm._config.fill], 'default');
            });
          }
          vm._tip.hide();

          if (vm._config.hasOwnProperty('onmouseout')) {
            //External function call, must be after all the internal code; allowing the user to overide
            vm._config.onmouseout.call(this, d, i);
          }
        })
        .on('click', function (d, i) {
          if (vm._config.hasOwnProperty('click')) {
            vm._config.onclick.call(this, d, i);
          }
        });

      Bars.drawStackLabels();
    };

    Bars._setQuantile = function (data) {
      var vm = this;
      var values = [];
      var quantile = [];

      if (
        vm._config.quantiles &&
        vm._config.quantiles.predefinedQuantiles &&
        vm._config.quantiles.predefinedQuantiles.length > 0
      ) {
        return vm._config.quantiles.predefinedQuantiles;
      }

      data.forEach(function (d) {
        values.push(+d[vm._config.fill]);
      });

      values.sort(d3.ascending);

      //@TODO use quantile scale instead of manual calculations
      if (vm._config && vm._config.quantiles && vm._config.quantiles.buckets) {
        if (vm._config.quantiles.ignoreZeros === true) {
          var aux = _$1.dropWhile(values, function (o) {
            return o <= 0;
          });
          //aux.unshift(values[0]);

          quantile.push(values[0]);
          quantile.push(0);

          for (var i = 1; i <= vm._config.quantiles.buckets - 1; i++) {
            quantile.push(
              d3.quantile(aux, (i * 1) / (vm._config.quantiles.buckets - 1))
            );
          }
        } else {
          quantile.push(d3.quantile(values, 0));
          for (var j = 1; j <= vm._config.quantiles.buckets; j++) {
            quantile.push(
              d3.quantile(values, (j * 1) / vm._config.quantiles.buckets)
            );
          }
        }
      } else {
        quantile = [
          d3.quantile(values, 0),
          d3.quantile(values, 0.2),
          d3.quantile(values, 0.4),
          d3.quantile(values, 0.6),
          d3.quantile(values, 0.8),
          d3.quantile(values, 1),
        ];
      }

      //@TODO - VALIDATE WHEN ZEROS NEED TO BE PUT ON QUANTILE 1 AND RECALCULATE NON ZERO VALUES INTO THE REST OF THE BUCKETS
      if (
        vm._config.quantiles &&
        vm._config.quantiles.buckets &&
        vm._config.quantiles.buckets === 5
      ) {
        if (
          quantile[1] === quantile[2] &&
          quantile[2] === quantile[3] &&
          quantile[3] === quantile[4] &&
          quantile[4] === quantile[5]
        ) {
          quantile = [d3.quantile(values, 0), d3.quantile(values, 0.2)];
        }
      }

      return quantile;
    };

    Bars._getQuantileColor = function (d, type) {
      var vm = this;
      var total = parseFloat(d);

      //@TODO use quantile scale instead of manual calculations
      if (
        vm._config &&
        vm._config.bars.quantiles &&
        vm._config.bars.quantiles.colors
      ) {
        if (vm._quantiles.length > 2) {
          if (
            vm._config &&
            vm._config.bars.min !== undefined &&
            vm._config.bars.max !== undefined
          ) {
            if (total < vm._config.bars.min || total > vm._config.bars.max) {
              return vm._config.bars.quantiles.outOfRangeColor;
            }
          } else {
            if (total < vm._minMax[0] || total > vm._minMax[1]) {
              return vm._config.bars.quantiles.outOfRangeColor;
            }
          }

          if (type == 'default') {
            if (total <= vm._quantiles[1]) {
              return vm._config.bars.quantiles.colors[0]; //'#f7c7c5';
            } else if (total <= vm._quantiles[2]) {
              return vm._config.bars.quantiles.colors[1]; //'#e65158';
            } else if (total <= vm._quantiles[3]) {
              return vm._config.bars.quantiles.colors[2]; //'#c20216';
            } else if (total <= vm._quantiles[4]) {
              return vm._config.quantiles.colors[3]; //'#750000';
            } else if (total <= vm._quantiles[5]) {
              return vm._config.quantiles.colors[4]; //'#480000';
            }
          }

          if (
            type == 'onHover' &&
            vm._config.hasOwnProperty('quantiles') &&
            vm._config.quantiles.hasOwnProperty('colorsOnHover')
          ) {
            if (total <= vm._quantiles[1]) {
              return vm._config.quantiles.colorsOnHover[0]; //'#f7c7c5';
            } else if (total <= vm._quantiles[2]) {
              return vm._config.quantiles.colorsOnHover[1]; //'#e65158';
            } else if (total <= vm._quantiles[3]) {
              return vm._config.quantiles.colorsOnHover[2]; //'#c20216';
            } else if (total <= vm._quantiles[4]) {
              return vm._config.quantiles.colorsOnHover[3]; //'#750000';
            } else if (total <= vm._quantiles[5]) {
              return vm._config.quantiles.colorsOnHover[4]; //'#480000';
            }
          }
        }
      }

      if (vm._quantiles.length == 2) {
        /*if(total === 0 ){
          return d4theme.colors.quantiles[0];//return '#fff';
        }else if(total <= vm._quantiles[1]){
          return d4theme.colors.quantiles[1];//return '#f7c7c5';
        }*/
        if (total <= vm._quantiles[1]) {
          return vm._config.quantiles.colors[0]; //'#f7c7c5';
        }
      }
    };

    Bars.init(config);
    return Bars;
  }

  var _typeof =
    typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
      ? function (obj) {
          return typeof obj;
        }
      : function (obj) {
          return obj &&
            typeof Symbol === 'function' &&
            obj.constructor === Symbol &&
            obj !== Symbol.prototype
            ? 'symbol'
            : typeof obj;
        };

  /**
   * @fileOverview A D3 based distribution chart system. Supports: Box plots, Violin plots, Notched box plots, trend lines, beeswarm plot
   * @version 3.0
   */

  /**
   * Creates a box plot, violin plot, and or notched box plot
   * @param settings Configuration options for the base plot
   * @param settings.data The data for the plot
   * @param settings.xName The name of the column that should be used for the x groups
   * @param settings.yName The name of the column used for the y values
   * @param {string} settings.selector The selector string for the main chart div
   * @param [settings.axisLabels={}] Defaults to the xName and yName
   * @param [settings.yTicks = 1] 1 = default ticks. 2 =  double, 0.5 = half
   * @param [settings.scale='linear'] 'linear' or 'log' - y scale of the chart
   * @param [settings.chartSize={width:800, height:400}] The height and width of the chart itself (doesn't include the container)
   * @param [settings.margin={top: 15, right: 60, bottom: 40, left: 50}] The margins around the chart (inside the main div)
   * @param [settings.constrainExtremes=false] Should the y scale include outliers?
   * @returns {object} chart A chart object
   */
  function makeDistroChart(settings) {
    var chart = {};

    // Defaults
    chart.settings = {
      data: null,
      id: null,
      idName: null,
      events: null,
      xName: null,
      xSort: null,
      yName: null,
      selector: null,
      axisLables: null,
      yTicks: 1,
      scale: 'linear',
      chartSize: { width: 800, height: 400 },
      margin: { top: 15, right: 60, bottom: 40, left: 50 },
      constrainExtremes: false,
      color: d3.scaleOrdinal(d3.schemeCategory10),
    };
    for (var setting in settings) {
      chart.settings[setting] = settings[setting];
    }

    function formatAsFloat(d) {
      if (d % 1 !== 0) {
        return d3.format(',.2f')(d);
      } else {
        return d3.format(',.0f')(d);
      }
    }
    function formatNumber(d) {
      var value = '';
      if (d % 1 == 0) {
        value = d3.format(',.0f')(d);
      } else if (d < 1 && d > 0) {
        value = d3.format(',.2f')(d);
      } else {
        value = d3.format(',.1f')(d);
      }
      return value;
    }

    function formatRange(d) {
      var range = d.split(' - ');
      var value = '';
      for (var i = 0; i < range.length; i++) {
        if (range[i] % 1 == 0) {
          value += d3.format(',.0f')(range[i]);
        } else if (range[i] < 1 && range[i] > 0) {
          value += d3.format(',.2f')(range[i]);
        } else {
          value += d3.format(',.1f')(range[i]);
        }
        if (i === 0) {
          value += ' - ';
        }
      }
      return value;
    }

    function logFormatNumber(d) {
      var x = Math.log(d) / Math.log(10) + 1e-6;
      return Math.abs(x - Math.floor(x)) < 0.6 ? formatAsFloat(d) : '';
    }

    chart.yFormatter = formatNumber;
    chart.xFormatter = formatRange;

    chart.data = chart.settings.data;

    chart.groupObjs = {}; //The data organized by grouping and sorted as well as any metadata for the groups
    chart.objs = {
      mainDiv: null,
      chartDiv: null,
      g: null,
      xAxis: null,
      yAxis: null,
    };
    chart.colorFunct = null;

    /**
     * Takes an array, function, or object mapping and created a color function from it
     * @param {function|[]|object} colorOptions
     * @returns {function} Function to be used to determine chart colors
     */
    function getColorFunct(colorOptions) {
      if (typeof colorOptions == 'function') {
        return colorOptions;
      } else if (Array.isArray(colorOptions)) {
        //  If an array is provided, map it to the domain
        var colorMap = {};
        /* @TODO - REVIEW PREVIOUS CODE 
              for (var cName in chart.groupObjs) {
                  
                  colorMap[cName] = colorOptions[cColor];
                  cColor = (cColor + 1) % colorOptions.length;
              }*/
        if (Array.isArray(chart.settings.xSort)) {
          chart.settings.xSort.forEach(function (key, index) {
            colorMap[key] = colorOptions[index];
          });
        } else {
          Object.keys(chart.groupObjs)
            .sort(d3.ascending)
            .forEach(function (key, index) {
              colorMap[key] = colorOptions[index];
            });
        }
        return function (group) {
          return colorMap[group];
        };
      } else if (
        (typeof colorOptions === 'undefined'
          ? 'undefined'
          : _typeof(colorOptions)) == 'object'
      ) {
        // if an object is provided, assume it maps to  the colors
        return function (group) {
          return colorOptions[group];
        };
      } else {
        return d3.scaleOrdinal(d3.schemeCategory10);
      }
    }

    /**
     * Takes a percentage as returns the values that correspond to that percentage of the group range witdh
     * @param objWidth Percentage of range band
     * @param gName The bin name to use to get the x shift
     * @returns {{left: null, right: null, middle: null}}
     */
    function getObjWidth(objWidth, gName) {
      var objSize = { left: null, right: null, middle: null };
      var width = chart.xScale.bandwidth() * (objWidth / 100);
      var padding = (chart.xScale.bandwidth() - width) / 2;
      var gShift = chart.xScale(gName);
      objSize.middle = chart.xScale.bandwidth() / 2 + gShift;
      objSize.left = padding + gShift;
      objSize.right = objSize.left + width;
      return objSize;
    }

    /**
     * Adds jitter to the  scatter point plot
     * @param doJitter true or false, add jitter to the point
     * @param width percent of the range band to cover with the jitter
     * @returns {number}
     */
    function addJitter(doJitter, width) {
      if (doJitter !== true || width == 0) {
        return 0;
      }
      return Math.floor(Math.random() * width) - width / 2;
    }

    function shallowCopy(oldObj) {
      var newObj = {};
      for (var i in oldObj) {
        if (oldObj.hasOwnProperty(i)) {
          newObj[i] = oldObj[i];
        }
      }
      return newObj;
    }

    /**
     * Closure that creates the tooltip hover function
     * @param groupName Name of the x group
     * @param metrics Object to use to get values for the group
     * @returns {Function} A function that provides the values for the tooltip
     */
    function tooltipHover(groupName, metrics) {
      var pointName =
        arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
      var pointValue =
        arguments.length > 3 && arguments[3] !== undefined
          ? arguments[3]
          : undefined;
      var boxpart =
        arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : '';

      var tooltipString = pointName;
      tooltipString += pointValue
        ? '<br>' +
          pointValue.toLocaleString() +
          '<br><hr style="height: 1px; background-color: #ADADAE; border: none; margin: 0.5em;">'
        : '';
      tooltipString += groupName;
      tooltipString += boxpart
        ? ''
        : '<br>Max: ' + formatAsFloat(metrics.max, 0.1);
      tooltipString += boxpart
        ? ''
        : '<br>Q3: ' + formatAsFloat(metrics.quartile3);
      tooltipString += boxpart
        ? boxpart === 'mean'
          ? '<br>Media: ' + formatAsFloat(metrics.mean)
          : ''
        : '<br>Media: ' + formatAsFloat(metrics.mean);
      tooltipString += boxpart
        ? boxpart === 'median'
          ? '<br>Mediana: ' + formatAsFloat(metrics.median)
          : ''
        : '<br>Mediana: ' + formatAsFloat(metrics.median);
      tooltipString += boxpart
        ? ''
        : '<br>Q1: ' + formatAsFloat(metrics.quartile1);
      tooltipString += boxpart ? '' : '<br>Min: ' + formatAsFloat(metrics.min);
      return function () {
        chart.objs.tooltip.transition().duration(200).style('opacity', 0.8);
        chart.objs.tooltip.html(tooltipString);
      };
    }

    //chart.idSelect = idSelection;

    /**
     * Parse the data and calculates base values for the plots
     */
    !(function prepareData() {
      function calcMetrics(values) {
        var metrics = {
          //These are the original non�scaled values
          max: null,
          upperOuterFence: null,
          upperInnerFence: null,
          quartile3: null,
          median: null,
          mean: null,
          iqr: null,
          quartile1: null,
          lowerInnerFence: null,
          lowerOuterFence: null,
          min: null,
        };

        metrics.min = d3.min(values);
        metrics.quartile1 = d3.quantile(values, 0.25);
        metrics.median = d3.median(values);
        metrics.mean = d3.mean(values);
        metrics.quartile3 = d3.quantile(values, 0.75);
        metrics.max = d3.max(values);
        metrics.iqr = metrics.quartile3 - metrics.quartile1;

        //The inner fences are the closest value to the IQR without going past it (assumes sorted lists)
        var LIF = metrics.quartile1 - 1.5 * metrics.iqr;
        var UIF = metrics.quartile3 + 1.5 * metrics.iqr;
        for (var i = 0; i <= values.length; i++) {
          if (values[i] < LIF) {
            continue;
          }
          if (!metrics.lowerInnerFence && values[i] >= LIF) {
            metrics.lowerInnerFence = values[i];
            continue;
          }
          if (values[i] > UIF) {
            metrics.upperInnerFence = values[i - 1];
            break;
          }
        }

        metrics.lowerOuterFence = metrics.quartile1 - 3 * metrics.iqr;
        metrics.upperOuterFence = metrics.quartile3 + 3 * metrics.iqr;
        if (!metrics.lowerInnerFence) {
          metrics.lowerInnerFence = metrics.min;
        }
        if (!metrics.upperInnerFence) {
          metrics.upperInnerFence = metrics.max;
        }
        return metrics;
      }

      var current_x = null;
      var current_y = null;
      var current_id = null;
      var current_idName = null;
      var current_row;

      // Group the values
      for (current_row = 0; current_row < chart.data.length; current_row++) {
        current_x = chart.data[current_row][chart.settings.xName];
        current_y = chart.data[current_row][chart.settings.yName];
        current_id = chart.settings.id
          ? chart.data[current_row][chart.settings.id]
          : null;
        current_idName = chart.settings.idName
          ? chart.data[current_row][chart.settings.idName]
          : null;

        if (chart.groupObjs.hasOwnProperty(current_x)) {
          if (chart.settings.id) {
            chart.groupObjs[current_x].valuesInfo.push({
              value: current_y,
              id: current_id,
              idName: current_idName,
            });
          } else {
            chart.groupObjs[current_x].values.push(current_y);
          }
        } else {
          if (chart.settings.id) {
            chart.groupObjs[current_x] = {};
            chart.groupObjs[current_x].valuesInfo = [
              {
                value: current_y,
                id: current_id,
                idName: current_idName,
              },
            ];
          } else {
            chart.groupObjs[current_x] = {};
            chart.groupObjs[current_x].values = [current_y];
          }
        }

        //original
        /*if (chart.groupObjs.hasOwnProperty(current_x)) {
                  chart.groupObjs[current_x].values.push(current_y);
              } else {
                  chart.groupObjs[current_x] = {};
                  chart.groupObjs[current_x].values = [current_y];
              }*/
      }

      for (var cName in chart.groupObjs) {
        if (chart.settings.id) {
          chart.groupObjs[cName].values = [];
          //in order to keep the array chart.groupObjs[cName].values
          for (
            var index = 0;
            index < chart.groupObjs[cName].valuesInfo.length;
            index++
          ) {
            chart.groupObjs[cName].values.push(
              chart.groupObjs[cName].valuesInfo[index].value
            );
          }

          chart.groupObjs[cName].valuesInfo.sort(function (x, y) {
            return d3.ascending(x.value, y.value);
          });
        }

        //original
        chart.groupObjs[cName].values.sort(d3.ascending);
        chart.groupObjs[cName].metrics = {};
        chart.groupObjs[cName].metrics = calcMetrics(
          chart.groupObjs[cName].values
        );
      }
    })();

    /**
     * Prepare the chart settings and chart div and svg
     */
    !(function prepareSettings() {
      var domain = '';
      //Set base settings
      chart.margin = chart.settings.margin;
      chart.divWidth = chart.settings.chartSize.width;
      chart.divHeight = chart.settings.chartSize.height;
      chart.width = chart.divWidth - chart.margin.left - chart.margin.right;
      chart.height = chart.divHeight - chart.margin.top - chart.margin.bottom;

      if (chart.settings.axisLabels) {
        chart.xAxisLable = chart.settings.axisLabels.xAxis;
        chart.yAxisLable = chart.settings.axisLabels.yAxis;
      } else {
        chart.xAxisLable = chart.settings.xName;
        chart.yAxisLable = chart.settings.yName;
      }

      if (chart.settings.scale === 'log') {
        chart.yScale = d3.scaleLog();
        chart.yFormatter = logFormatNumber;
      } else {
        chart.yScale = d3.scaleLinear();
      }

      if (chart.settings.constrainExtremes === true) {
        var fences = [];
        for (var cName in chart.groupObjs) {
          fences.push(chart.groupObjs[cName].metrics.lowerInnerFence);
          fences.push(chart.groupObjs[cName].metrics.upperInnerFence);
        }
        chart.range = d3.extent(fences);
      } else {
        chart.range = d3.extent(chart.data, function (d) {
          return d[chart.settings.yName];
        });
      }

      chart.colorFunct = getColorFunct(chart.settings.colors);

      // Build Scale functions
      chart.yScale
        .range([chart.height, 0])
        .domain(chart.range)
        .nice()
        .clamp(true);

      if (chart.settings.xSort === null) {
        domain = Object.keys(chart.groupObjs);
      } else {
        domain = Array.isArray(chart.settings.xSort)
          ? chart.settings.xSort
          : Object.keys(chart.groupObjs).sort(d3.ascending);
      }
      chart.xScale = d3.scaleBand().domain(domain).rangeRound([0, chart.width]);

      //Build Axes Functions
      chart.objs.yAxis = d3
        .axisLeft()
        .scale(chart.yScale)
        .tickFormat(chart.yFormatter)
        .tickSizeOuter(0)
        .tickSizeInner(-chart.width + (chart.margin.right + chart.margin.left));
      //chart.objs.yAxis.ticks(chart.objs.yAxis.ticks()*chart.settings.yTicks);
      chart.objs.xAxis = d3
        .axisBottom()
        .scale(chart.xScale)
        //.tickFormat(chart.xFormatter)
        .tickSizeOuter(0)
        .tickSize(5);
    })();

    /**
     * Updates the chart based on the current settings and window size
     * @returns {*}
     */
    chart.update = function () {
      // Update chart size based on view port size
      chart.width =
        parseInt(chart.objs.chartDiv.style('width'), 10) -
        (chart.margin.left + chart.margin.right);
      chart.height =
        parseInt(chart.objs.chartDiv.style('height'), 10) -
        (chart.margin.top + chart.margin.bottom);
      // Update scale functions
      chart.xScale.rangeRound([0, chart.width]);
      chart.yScale.range([chart.height, 0]);

      // Update the yDomain if the Violin plot clamp is set to -1 meaning it will extend the violins to make nice points
      if (
        chart.violinPlots &&
        chart.violinPlots.options.show == true &&
        chart.violinPlots.options._yDomainVP != null
      ) {
        chart.yScale
          .domain(chart.violinPlots.options._yDomainVP)
          .nice()
          .clamp(true);
      } else {
        chart.yScale.domain(chart.range).nice().clamp(true);
      }

      //Update axes
      chart.objs.g
        .select('.x.axis')
        .attr('transform', 'translate(0,' + chart.height + ')')
        .call(chart.objs.xAxis)
        .selectAll('.tick text')
        .attr('y', 5)
        .attr('x', -5)
        .attr('transform', 'rotate(-40)')
        .style('text-anchor', 'end');
      chart.objs.g.select('.x.axis .label').attr('x', chart.width / 2);
      chart.objs.g
        .select('.y.axis')
        .call(chart.objs.yAxis.tickSizeInner(-chart.width));
      chart.objs.g.select('.y.axis .label').attr('x', -chart.height / 2);
      chart.objs.chartDiv
        .select('svg')
        .attr('width', chart.width + (chart.margin.left + chart.margin.right))
        .attr(
          'height',
          chart.height + (chart.margin.top + chart.margin.bottom)
        );

      return chart;
    };

    /**
     * Prepare the chart html elements
     */
    !(function prepareChart() {
      // Build main div and chart div
      chart.objs.mainDiv = d3
        .select(chart.settings.selector)
        .style('width', chart.divWidth + 'px')
        .style('height', chart.divHeight + 'px');
      // Add all the divs to make it centered and responsive
      chart.objs.mainDiv
        .append('div')
        .attr('class', 'inner-wrapper')
        .style('padding-bottom', '5%')
        .style('height', chart.divHeight + 'px')
        .append('div')
        .attr('class', 'outer-box')
        .append('div')
        .attr('class', 'inner-box');
      // Capture the inner div for the chart (where the chart actually is)
      chart.selector = chart.settings.selector + ' .inner-box';
      chart.objs.chartDiv = d3.select(chart.selector);
      d3.select(window).on('resize.' + chart.selector, chart.update);

      // Create the svg
      chart.objs.g = chart.objs.chartDiv
        .append('svg')
        .attr('class', 'chart-area')
        .attr('width', chart.width + (chart.margin.left + chart.margin.right))
        .attr('height', chart.height + (chart.margin.top + chart.margin.bottom))
        .append('g')
        .attr(
          'transform',
          'translate(' + chart.margin.left + ',' + chart.margin.top + ')'
        );

      // Create axes
      chart.objs.axes = chart.objs.g.append('g').attr('class', 'axis');
      chart.objs.axes
        .append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + chart.height + ')')
        .call(chart.objs.xAxis)
        .append('text')
        .attr('class', 'label')
        .attr('y', chart.margin.bottom - 20)
        .attr('x', -chart.width / 2)
        .attr('dy', '.71em')
        .attr('fill', '#fff')
        .style('text-anchor', 'middle')
        .text(chart.xAxisLable);

      chart.objs.axes
        .append('g')
        .attr('class', 'y axis')
        .call(chart.objs.yAxis)
        .append('text')
        .attr('class', 'label')
        .attr('transform', 'rotate(-90)')
        .attr('y', -chart.margin.left * 0.9)
        .attr('x', -chart.height / 2)
        .attr('dy', '.71em')
        .attr('fill', '#fff')
        .style('text-anchor', 'middle')
        .text(chart.yAxisLable);

      // Create tooltip div
      chart.objs.tooltip = chart.objs.mainDiv
        .append('div')
        .attr('class', 'tooltip')
        .style('display', 'none');
      for (var cName in chart.groupObjs) {
        chart.groupObjs[cName].g = chart.objs.g
          .append('g')
          .attr('class', 'group');
        /*chart.groupObjs[cName].g.on("mouseover", function () {
                  chart.objs.tooltip
                      .style("display", null)
                      .style("left", (d3.event.pageX) + "px")
                      .style("top", (d3.event.pageY - 28) + "px");
              }).on("mouseout", function () {
                chart.objs.tooltip.style("display", "none");
              }).on("mousemove", tooltipHover(cName, chart.groupObjs[cName].metrics));*/
      }
      chart.update();
    })();

    /**
     * Render a violin plot on the current chart
     * @param options
     * @param [options.showViolinPlot=true] True or False, show the violin plot
     * @param [options.resolution=100 default]
     * @param [options.bandwidth=10 default] May need higher bandwidth for larger data sets
     * @param [options.width=50] The max percent of the group rangeBand that the violin can be
     * @param [options.curve=''] How to render the violin
     * @param [options.clamp=0 default]
     *   0 = keep data within chart min and max, clamp once data = 0. May extend beyond data set min and max
     *   1 = clamp at min and max of data set. Possibly no tails
     *  -1 = extend chart axis to make room for data to interpolate to 0. May extend axis and data set min and max
     * @param [options.colors=chart default] The color mapping for the violin plot
     * @returns {*} The chart object
     */
    chart.renderViolinPlot = function (options) {
      chart.violinPlots = {};

      var defaultOptions = {
        show: true,
        showViolinPlot: true,
        resolution: 100,
        bandwidth: 20,
        width: 50,
        curve: d3.curveCardinal,
        clamp: 1,
        colors: chart.colorFunct,
        _yDomainVP: null, // If the Violin plot is set to close all violin plots, it may need to extend the domain, that extended domain is stored here
      };
      chart.violinPlots.options = shallowCopy(defaultOptions);
      for (var option in options) {
        chart.violinPlots.options[option] = options[option];
      }
      var vOpts = chart.violinPlots.options;

      // Create violin plot objects
      for (var cName in chart.groupObjs) {
        chart.groupObjs[cName].violin = {};
        chart.groupObjs[cName].violin.objs = {};
      }

      /**
       * Take a new set of options and redraw the violin
       * @param updateOptions
       */
      chart.violinPlots.change = function (updateOptions) {
        if (updateOptions) {
          for (var key in updateOptions) {
            vOpts[key] = updateOptions[key];
          }
        }

        for (var cName in chart.groupObjs) {
          chart.groupObjs[cName].violin.objs.g.remove();
        }

        chart.violinPlots.prepareViolin();
        chart.violinPlots.update();
      };

      chart.violinPlots.reset = function () {
        chart.violinPlots.change(defaultOptions);
      };
      chart.violinPlots.show = function (opts) {
        if (opts !== undefined) {
          opts.show = true;
          if (opts.reset) {
            chart.violinPlots.reset();
          }
        } else {
          opts = { show: true };
        }
        chart.violinPlots.change(opts);
      };

      chart.violinPlots.hide = function (opts) {
        if (opts !== undefined) {
          opts.show = false;
          if (opts.reset) {
            chart.violinPlots.reset();
          }
        } else {
          opts = { show: false };
        }
        chart.violinPlots.change(opts);
      };

      /**
       * Update the violin obj values
       */
      chart.violinPlots.update = function () {
        var cName, cViolinPlot;

        for (cName in chart.groupObjs) {
          cViolinPlot = chart.groupObjs[cName].violin;

          // Build the violins sideways, so use the yScale for the xScale and make a new yScale
          var xVScale = chart.yScale.copy();

          // Create the Kernel Density Estimator Function
          cViolinPlot.kde = kernelDensityEstimator(
            eKernel(vOpts.bandwidth),
            xVScale.ticks(vOpts.resolution)
          );
          cViolinPlot.kdedata = cViolinPlot.kde(chart.groupObjs[cName].values);

          var interpolateMax = chart.groupObjs[cName].metrics.max,
            interpolateMin = chart.groupObjs[cName].metrics.min;

          if (vOpts.clamp == 0 || vOpts.clamp == -1) {
            //
            // When clamp is 0, calculate the min and max that is needed to bring the violin plot to a point
            // interpolateMax = the Minimum value greater than the max where y = 0
            interpolateMax = d3.min(
              cViolinPlot.kdedata.filter(function (d) {
                return d.x > chart.groupObjs[cName].metrics.max && d.y == 0;
              }),
              function (d) {
                return d.x;
              }
            );
            // interpolateMin = the Maximum value less than the min where y = 0
            interpolateMin = d3.max(
              cViolinPlot.kdedata.filter(function (d) {
                return d.x < chart.groupObjs[cName].metrics.min && d.y == 0;
              }),
              function (d) {
                return d.x;
              }
            );
            // If clamp is -1 we need to extend the axises so that the violins come to a point
            if (vOpts.clamp == -1) {
              kdeTester = eKernelTest(
                eKernel(vOpts.bandwidth),
                chart.groupObjs[cName].values
              );
              if (!interpolateMax) {
                var interMaxY = kdeTester(chart.groupObjs[cName].metrics.max);
                var interMaxX = chart.groupObjs[cName].metrics.max;
                var count = 25; // Arbitrary limit to make sure we don't get an infinite loop
                while (count > 0 && interMaxY != 0) {
                  interMaxY = kdeTester(interMaxX);
                  interMaxX += 1;
                  count -= 1;
                }
                interpolateMax = interMaxX;
              }
              if (!interpolateMin) {
                var interMinY = kdeTester(chart.groupObjs[cName].metrics.min);
                var interMinX = chart.groupObjs[cName].metrics.min;
                var count = 25; // Arbitrary limit to make sure we don't get an infinite loop
                while (count > 0 && interMinY != 0) {
                  interMinY = kdeTester(interMinX);
                  interMinX -= 1;
                  count -= 1;
                }
                interpolateMin = interMinX;
              }
            }
            // Check to see if the new values are outside the existing chart range
            //   If they are assign them to the master _yDomainVP
            if (!vOpts._yDomainVP) vOpts._yDomainVP = chart.range.slice(0);
            if (interpolateMin && interpolateMin < vOpts._yDomainVP[0]) {
              vOpts._yDomainVP[0] = interpolateMin;
            }
            if (interpolateMax && interpolateMax > vOpts._yDomainVP[1]) {
              vOpts._yDomainVP[1] = interpolateMax;
            }
          }

          if (vOpts.showViolinPlot) {
            chart.update();
            xVScale = chart.yScale.copy();

            // Need to recalculate the KDE because the xVScale changed
            cViolinPlot.kde = kernelDensityEstimator(
              eKernel(vOpts.bandwidth),
              xVScale.ticks(vOpts.resolution)
            );
            cViolinPlot.kdedata = cViolinPlot.kde(
              chart.groupObjs[cName].values
            );
          }

          cViolinPlot.kdedata = cViolinPlot.kdedata
            .filter(function (d) {
              return !interpolateMin || d.x >= interpolateMin;
            })
            .filter(function (d) {
              return !interpolateMax || d.x <= interpolateMax;
            });
        }
        for (cName in chart.groupObjs) {
          cViolinPlot = chart.groupObjs[cName].violin;

          // Get the violin width
          var objBounds = getObjWidth(vOpts.width, cName);
          var width = (objBounds.right - objBounds.left) / 2;

          var yVScale = d3
            .scaleLinear()
            .range([width, 0])
            .domain([
              0,
              d3.max(cViolinPlot.kdedata, function (d) {
                return d.y;
              }),
            ])
            .clamp(true);

          var area = d3
            .area()
            .curve(vOpts.curve)
            .x(function (d) {
              return xVScale(d.x);
            })
            .y0(width)
            .y1(function (d) {
              return yVScale(d.y);
            });

          var line = d3
            .line()
            .curve(vOpts.curve)
            .x(function (d) {
              return xVScale(d.x);
            })
            .y(function (d) {
              return yVScale(d.y);
            });

          if (cViolinPlot.objs.left.area) {
            cViolinPlot.objs.left.area
              .datum(cViolinPlot.kdedata)
              .attr('d', area);
            cViolinPlot.objs.left.line
              .datum(cViolinPlot.kdedata)
              .attr('d', line);

            cViolinPlot.objs.right.area
              .datum(cViolinPlot.kdedata)
              .attr('d', area);
            cViolinPlot.objs.right.line
              .datum(cViolinPlot.kdedata)
              .attr('d', line);
          }

          // Rotate the violins
          cViolinPlot.objs.left.g.attr(
            'transform',
            'rotate(90,0,0)   translate(0,-' + objBounds.left + ')  scale(1,-1)'
          );
          cViolinPlot.objs.right.g.attr(
            'transform',
            'rotate(90,0,0)  translate(0,-' + objBounds.right + ')'
          );
        }
      };

      /**
       * Create the svg elements for the violin plot
       */
      chart.violinPlots.prepareViolin = function () {
        var cName, cViolinPlot;

        if (vOpts.colors) {
          chart.violinPlots.color = getColorFunct(vOpts.colors);
        } else {
          chart.violinPlots.color = chart.colorFunct;
        }

        if (vOpts.show == false) {
          return;
        }

        for (cName in chart.groupObjs) {
          cViolinPlot = chart.groupObjs[cName].violin;

          cViolinPlot.objs.g = chart.groupObjs[cName].g
            .append('g')
            .attr('class', 'violin-plot');
          cViolinPlot.objs.left = { area: null, line: null, g: null };
          cViolinPlot.objs.right = { area: null, line: null, g: null };

          cViolinPlot.objs.left.g = cViolinPlot.objs.g.append('g');
          cViolinPlot.objs.right.g = cViolinPlot.objs.g.append('g');

          if (vOpts.showViolinPlot !== false) {
            //Area
            cViolinPlot.objs.left.area = cViolinPlot.objs.left.g
              .append('path')
              .attr('class', 'area')
              .style('fill', chart.violinPlots.color(cName));
            cViolinPlot.objs.right.area = cViolinPlot.objs.right.g
              .append('path')
              .attr('class', 'area')
              .style('fill', chart.violinPlots.color(cName));

            //Lines
            cViolinPlot.objs.left.line = cViolinPlot.objs.left.g
              .append('path')
              .attr('class', 'line')
              .attr('fill', 'none')
              .style('stroke', chart.violinPlots.color(cName));
            cViolinPlot.objs.right.line = cViolinPlot.objs.right.g
              .append('path')
              .attr('class', 'line')
              .attr('fill', 'none')
              .style('stroke', chart.violinPlots.color(cName));
          }
        }
      };

      function kernelDensityEstimator(kernel, x) {
        return function (sample) {
          return x.map(function (x) {
            return {
              x: x,
              y: d3.mean(sample, function (v) {
                return kernel(x - v);
              }),
            };
          });
        };
      }

      function eKernel(scale) {
        return function (u) {
          return Math.abs((u /= scale)) <= 1 ? (0.75 * (1 - u * u)) / scale : 0;
        };
      }

      // Used to find the roots for adjusting violin axis
      // Given an array, find the value for a single point, even if it is not in the domain
      function eKernelTest(kernel, array) {
        return function (testX) {
          return d3.mean(array, function (v) {
            return kernel(testX - v);
          });
        };
      }

      chart.violinPlots.prepareViolin();

      d3.select(window).on(
        'resize.' + chart.selector + '.violinPlot',
        chart.violinPlots.update
      );
      chart.violinPlots.update();
      return chart;
    };

    /**
     * Render a box plot on the current chart
     * @param options
     * @param [options.show=true] Toggle the whole plot on and off
     * @param [options.showBox=true] Show the box part of the box plot
     * @param [options.showWhiskers=true] Show the whiskers
     * @param [options.showMedian=true] Show the median line
     * @param [options.showMean=false] Show the mean line
     * @param [options.medianCSize=3] The size of the circle on the median
     * @param [options.showOutliers=true] Plot outliers
     * @param [options.boxwidth=30] The max percent of the group rangeBand that the box can be
     * @param [options.lineWidth=boxWidth] The max percent of the group rangeBand that the line can be
     * @param [options.outlierScatter=false] Spread out the outliers so they don't all overlap (in development)
     * @param [options.outlierCSize=2] Size of the outliers
     * @param [options.colors=chart default] The color mapping for the box plot
     * @returns {*} The chart object
     */
    chart.renderBoxPlot = function (options) {
      chart.boxPlots = {};

      // Defaults
      var defaultOptions = {
        show: true,
        showBox: true,
        showWhiskers: true,
        showMedian: true,
        showMean: false,
        medianCSize: 3.5,
        showOutliers: true,
        boxWidth: 30,
        lineWidth: null,
        scatterOutliers: false,
        outlierCSize: 2.5,
        colors: chart.colorFunct,
      };
      chart.boxPlots.options = shallowCopy(defaultOptions);
      for (var option in options) {
        chart.boxPlots.options[option] = options[option];
      }
      var bOpts = chart.boxPlots.options;

      //Create box plot objects
      for (var cName in chart.groupObjs) {
        chart.groupObjs[cName].boxPlot = {};
        chart.groupObjs[cName].boxPlot.objs = {};
      }

      /**
       * Calculates all the outlier points for each group
       */
      !(function calcAllOutliers() {
        /**
         * Create lists of the outliers for each content group
         * @param cGroup The object to modify
         * @return null Modifies the object in place
         */
        function calcOutliers(cGroup) {
          var cExtremes = [];
          var cOutliers = [];
          var cOut, idx;
          for (idx = 0; idx <= cGroup.values.length; idx++) {
            cOut = { value: cGroup.values[idx] };

            if (cOut.value < cGroup.metrics.lowerInnerFence) {
              if (cOut.value < cGroup.metrics.lowerOuterFence) {
                cExtremes.push(cOut);
              } else {
                cOutliers.push(cOut);
              }
            } else if (cOut.value > cGroup.metrics.upperInnerFence) {
              if (cOut.value > cGroup.metrics.upperOuterFence) {
                cExtremes.push(cOut);
              } else {
                cOutliers.push(cOut);
              }
            }
          }
          cGroup.boxPlot.objs.outliers = cOutliers;
          cGroup.boxPlot.objs.extremes = cExtremes;
        }

        for (var cName in chart.groupObjs) {
          calcOutliers(chart.groupObjs[cName]);
        }
      })();

      /**
       * Take updated options and redraw the box plot
       * @param updateOptions
       */
      chart.boxPlots.change = function (updateOptions) {
        if (updateOptions) {
          for (var key in updateOptions) {
            bOpts[key] = updateOptions[key];
          }
        }

        for (var cName in chart.groupObjs) {
          chart.groupObjs[cName].boxPlot.objs.g.remove();
        }
        chart.boxPlots.prepareBoxPlot();
        chart.boxPlots.update();
      };

      chart.boxPlots.reset = function () {
        chart.boxPlots.change(defaultOptions);
      };
      chart.boxPlots.show = function (opts) {
        if (opts !== undefined) {
          opts.show = true;
          if (opts.reset) {
            chart.boxPlots.reset();
          }
        } else {
          opts = { show: true };
        }
        chart.boxPlots.change(opts);
      };
      chart.boxPlots.hide = function (opts) {
        if (opts !== undefined) {
          opts.show = false;
          if (opts.reset) {
            chart.boxPlots.reset();
          }
        } else {
          opts = { show: false };
        }
        chart.boxPlots.change(opts);
      };

      /**
       * Update the box plot obj values
       */
      chart.boxPlots.update = function () {
        var cName, cBoxPlot;

        for (cName in chart.groupObjs) {
          cBoxPlot = chart.groupObjs[cName].boxPlot;

          // Get the box width
          var objBounds = getObjWidth(bOpts.boxWidth, cName);
          var width = objBounds.right - objBounds.left;

          var sMetrics = {}; //temp var for scaled (plottable) metric values
          for (var attr in chart.groupObjs[cName].metrics) {
            sMetrics[attr] = null;
            sMetrics[attr] = chart.yScale(chart.groupObjs[cName].metrics[attr]);
          }

          // Box
          if (cBoxPlot.objs.box) {
            cBoxPlot.objs.box
              .attr('x', objBounds.left)
              .attr('width', width)
              .attr('y', sMetrics.quartile3)
              .attr('rx', 1)
              .attr('ry', 1)
              .attr('height', -sMetrics.quartile3 + sMetrics.quartile1);
          }

          // Lines
          var lineBounds = null;
          if (bOpts.lineWidth) {
            lineBounds = getObjWidth(bOpts.lineWidth, cName);
          } else {
            lineBounds = objBounds;
          }
          // --Whiskers
          if (cBoxPlot.objs.upperWhisker) {
            cBoxPlot.objs.upperWhisker.fence
              .attr('x1', lineBounds.left)
              .attr('x2', lineBounds.right)
              .attr('y1', sMetrics.upperInnerFence)
              .attr('y2', sMetrics.upperInnerFence);
            cBoxPlot.objs.upperWhisker.line
              .attr('x1', lineBounds.middle)
              .attr('x2', lineBounds.middle)
              .attr('y1', sMetrics.quartile3)
              .attr('y2', sMetrics.upperInnerFence);

            cBoxPlot.objs.lowerWhisker.fence
              .attr('x1', lineBounds.left)
              .attr('x2', lineBounds.right)
              .attr('y1', sMetrics.lowerInnerFence)
              .attr('y2', sMetrics.lowerInnerFence);
            cBoxPlot.objs.lowerWhisker.line
              .attr('x1', lineBounds.middle)
              .attr('x2', lineBounds.middle)
              .attr('y1', sMetrics.quartile1)
              .attr('y2', sMetrics.lowerInnerFence);
          }

          // --Median
          if (cBoxPlot.objs.median) {
            cBoxPlot.objs.median.line
              .attr('x1', lineBounds.left)
              .attr('x2', lineBounds.right)
              .attr('y1', sMetrics.median)
              .attr('y2', sMetrics.median);
            cBoxPlot.objs.median.circle
              .attr('cx', lineBounds.middle)
              .attr('cy', sMetrics.median);
          }

          // --Mean
          if (cBoxPlot.objs.mean) {
            cBoxPlot.objs.mean.line
              .attr('x1', lineBounds.left)
              .attr('x2', lineBounds.right)
              .attr('y1', sMetrics.mean)
              .attr('y2', sMetrics.mean);
            cBoxPlot.objs.mean.circle
              .attr('cx', lineBounds.middle)
              .attr('cy', sMetrics.mean);
          }

          // Outliers

          var pt;
          if (cBoxPlot.objs.outliers) {
            for (pt in cBoxPlot.objs.outliers) {
              cBoxPlot.objs.outliers[pt].point
                .attr(
                  'cx',
                  objBounds.middle + addJitter(bOpts.scatterOutliers, width)
                )
                .attr('cy', chart.yScale(cBoxPlot.objs.outliers[pt].value));
            }
          }
          if (cBoxPlot.objs.extremes) {
            for (pt in cBoxPlot.objs.extremes) {
              cBoxPlot.objs.extremes[pt].point
                .attr(
                  'cx',
                  objBounds.middle + addJitter(bOpts.scatterOutliers, width)
                )
                .attr('cy', chart.yScale(cBoxPlot.objs.extremes[pt].value));
            }
          }
        }
      };

      /**
       * Create the svg elements for the box plot
       */
      chart.boxPlots.prepareBoxPlot = function () {
        var cName, cBoxPlot;

        if (bOpts.colors) {
          chart.boxPlots.colorFunct = getColorFunct(bOpts.colors);
        } else {
          chart.boxPlots.colorFunct = chart.colorFunct;
        }

        if (bOpts.show == false) {
          return;
        }

        for (cName in chart.groupObjs) {
          cBoxPlot = chart.groupObjs[cName].boxPlot;

          cBoxPlot.objs.g = chart.groupObjs[cName].g
            .append('g')
            .attr('class', 'box-plot');

          //Plot Box (default show)
          if (bOpts.showBox) {
            cBoxPlot.objs.box = cBoxPlot.objs.g
              .append('rect')
              .attr('class', 'box')
              .style('fill', chart.boxPlots.colorFunct(cName))
              .style('stroke', chart.boxPlots.colorFunct(cName));
            //A stroke is added to the box with the group color, it is
            // hidden by default and can be shown through css with stroke-width
          }

          //Plot Median (default show)
          if (bOpts.showMedian) {
            cBoxPlot.objs.median = { line: null, circle: null };
            cBoxPlot.objs.median.line = cBoxPlot.objs.g
              .append('line')
              .attr('class', 'median');
            cBoxPlot.objs.median.circle = cBoxPlot.objs.g
              .append('circle')
              .attr('class', 'median')
              .attr('r', bOpts.medianCSize)
              .style('fill', chart.boxPlots.colorFunct(cName))
              .on('mouseover', function () {
                chart.objs.tooltip
                  .style('display', null)
                  .style('left', d3.event.pageX + 'px')
                  .style('top', d3.event.pageY - 28 + 'px');
              })
              .on('mouseout', function () {
                chart.objs.tooltip.style('display', 'none');
              })
              .on(
                'mousemove',
                tooltipHover(
                  cName,
                  chart.groupObjs[cName].metrics,
                  '',
                  '',
                  'median'
                )
              );
          }

          // Plot Mean (default no plot)
          if (bOpts.showMean) {
            cBoxPlot.objs.mean = { line: null, circle: null };
            cBoxPlot.objs.mean.line = cBoxPlot.objs.g
              .append('line')
              .attr('class', 'mean');
            cBoxPlot.objs.mean.circle = cBoxPlot.objs.g
              .append('circle')
              .attr('class', 'mean')
              .attr('r', bOpts.medianCSize)
              .style('fill', chart.boxPlots.colorFunct(cName))
              .on('mouseover', function () {
                chart.objs.tooltip
                  .style('display', null)
                  .style('left', d3.event.pageX + 'px')
                  .style('top', d3.event.pageY - 28 + 'px');
              })
              .on('mouseout', function () {
                chart.objs.tooltip.style('display', 'none');
              })
              .on(
                'mousemove',
                tooltipHover(
                  cName,
                  chart.groupObjs[cName].metrics,
                  '',
                  '',
                  'mean'
                )
              );
          }

          // Plot Whiskers (default show)
          if (bOpts.showWhiskers) {
            cBoxPlot.objs.upperWhisker = { fence: null, line: null };
            cBoxPlot.objs.lowerWhisker = { fence: null, line: null };
            cBoxPlot.objs.upperWhisker.fence = cBoxPlot.objs.g
              .append('line')
              .attr('class', 'upper whisker')
              .style('stroke', chart.boxPlots.colorFunct(cName));
            cBoxPlot.objs.upperWhisker.line = cBoxPlot.objs.g
              .append('line')
              .attr('class', 'upper whisker')
              .style('stroke', chart.boxPlots.colorFunct(cName));

            cBoxPlot.objs.lowerWhisker.fence = cBoxPlot.objs.g
              .append('line')
              .attr('class', 'lower whisker')
              .style('stroke', chart.boxPlots.colorFunct(cName));
            cBoxPlot.objs.lowerWhisker.line = cBoxPlot.objs.g
              .append('line')
              .attr('class', 'lower whisker')
              .style('stroke', chart.boxPlots.colorFunct(cName));
          }

          // Plot outliers (default show)
          if (bOpts.showOutliers) {
            if (!cBoxPlot.objs.outliers) calcAllOutliers();
            var pt;
            if (cBoxPlot.objs.outliers.length) {
              var outDiv = cBoxPlot.objs.g
                .append('g')
                .attr('class', 'boxplot outliers');
              for (pt in cBoxPlot.objs.outliers) {
                cBoxPlot.objs.outliers[pt].point = outDiv
                  .append('circle')
                  .attr('class', 'outlier')
                  .attr('r', bOpts.outlierCSize)
                  .style('fill', chart.boxPlots.colorFunct(cName));
              }
            }

            if (cBoxPlot.objs.extremes.length) {
              var extDiv = cBoxPlot.objs.g
                .append('g')
                .attr('class', 'boxplot extremes');
              for (pt in cBoxPlot.objs.extremes) {
                cBoxPlot.objs.extremes[pt].point = extDiv
                  .append('circle')
                  .attr('class', 'extreme')
                  .attr('r', bOpts.outlierCSize)
                  .style('stroke', chart.boxPlots.colorFunct(cName));
              }
            }
          }
        }
      };
      chart.boxPlots.prepareBoxPlot();

      d3.select(window).on(
        'resize.' + chart.selector + '.boxPlot',
        chart.boxPlots.update
      );
      chart.boxPlots.update();
      return chart;
    };

    /**
     * Render a notched box on the current chart
     * @param options
     * @param [options.show=true] Toggle the whole plot on and off
     * @param [options.showNotchBox=true] Show the notch box
     * @param [options.showLines=false] Show lines at the confidence intervals
     * @param [options.boxWidth=35] The width of the widest part of the box
     * @param [options.medianWidth=20] The width of the narrowist part of the box
     * @param [options.lineWidth=50] The width of the confidence interval lines
     * @param [options.notchStyle=null] null=traditional style, 'box' cuts out the whole notch in right angles
     * @param [options.colors=chart default] The color mapping for the notch boxes
     * @returns {*} The chart object
     */
    chart.renderNotchBoxes = function (options) {
      chart.notchBoxes = {};

      //Defaults
      var defaultOptions = {
        show: true,
        showNotchBox: true,
        showLines: false,
        boxWidth: 35,
        medianWidth: 20,
        lineWidth: 50,
        notchStyle: null,
        colors: null,
      };
      chart.notchBoxes.options = shallowCopy(defaultOptions);
      for (var option in options) {
        chart.notchBoxes.options[option] = options[option];
      }
      var nOpts = chart.notchBoxes.options;

      //Create notch objects
      for (var cName in chart.groupObjs) {
        chart.groupObjs[cName].notchBox = {};
        chart.groupObjs[cName].notchBox.objs = {};
      }

      /**
       * Makes the svg path string for a notched box
       * @param cNotch Current notch box object
       * @param notchBounds objBound object
       * @returns {string} A string in the proper format for a svg polygon
       */
      function makeNotchBox(cNotch, notchBounds) {
        var scaledValues = [];
        if (nOpts.notchStyle == 'box') {
          scaledValues = [
            [notchBounds.boxLeft, chart.yScale(cNotch.metrics.quartile1)],
            [notchBounds.boxLeft, chart.yScale(cNotch.metrics.lowerNotch)],
            [notchBounds.medianLeft, chart.yScale(cNotch.metrics.lowerNotch)],
            [notchBounds.medianLeft, chart.yScale(cNotch.metrics.median)],
            [notchBounds.medianLeft, chart.yScale(cNotch.metrics.upperNotch)],
            [notchBounds.boxLeft, chart.yScale(cNotch.metrics.upperNotch)],
            [notchBounds.boxLeft, chart.yScale(cNotch.metrics.quartile3)],
            [notchBounds.boxRight, chart.yScale(cNotch.metrics.quartile3)],
            [notchBounds.boxRight, chart.yScale(cNotch.metrics.upperNotch)],
            [notchBounds.medianRight, chart.yScale(cNotch.metrics.upperNotch)],
            [notchBounds.medianRight, chart.yScale(cNotch.metrics.median)],
            [notchBounds.medianRight, chart.yScale(cNotch.metrics.lowerNotch)],
            [notchBounds.boxRight, chart.yScale(cNotch.metrics.lowerNotch)],
            [notchBounds.boxRight, chart.yScale(cNotch.metrics.quartile1)],
          ];
        } else {
          scaledValues = [
            [notchBounds.boxLeft, chart.yScale(cNotch.metrics.quartile1)],
            [notchBounds.boxLeft, chart.yScale(cNotch.metrics.lowerNotch)],
            [notchBounds.medianLeft, chart.yScale(cNotch.metrics.median)],
            [notchBounds.boxLeft, chart.yScale(cNotch.metrics.upperNotch)],
            [notchBounds.boxLeft, chart.yScale(cNotch.metrics.quartile3)],
            [notchBounds.boxRight, chart.yScale(cNotch.metrics.quartile3)],
            [notchBounds.boxRight, chart.yScale(cNotch.metrics.upperNotch)],
            [notchBounds.medianRight, chart.yScale(cNotch.metrics.median)],
            [notchBounds.boxRight, chart.yScale(cNotch.metrics.lowerNotch)],
            [notchBounds.boxRight, chart.yScale(cNotch.metrics.quartile1)],
          ];
        }
        return scaledValues
          .map(function (d) {
            return [d[0], d[1]].join(',');
          })
          .join(' ');
      }

      /**
       * Calculate the confidence intervals
       */
      !(function calcNotches() {
        var cNotch, modifier;
        for (var cName in chart.groupObjs) {
          cNotch = chart.groupObjs[cName];
          modifier =
            1.57 * (cNotch.metrics.iqr / Math.sqrt(cNotch.values.length));
          cNotch.metrics.upperNotch = cNotch.metrics.median + modifier;
          cNotch.metrics.lowerNotch = cNotch.metrics.median - modifier;
        }
      })();

      /**
       * Take a new set of options and redraw the notch boxes
       * @param updateOptions
       */
      chart.notchBoxes.change = function (updateOptions) {
        if (updateOptions) {
          for (var key in updateOptions) {
            nOpts[key] = updateOptions[key];
          }
        }

        for (var cName in chart.groupObjs) {
          chart.groupObjs[cName].notchBox.objs.g.remove();
        }
        chart.notchBoxes.prepareNotchBoxes();
        chart.notchBoxes.update();
      };

      chart.notchBoxes.reset = function () {
        chart.notchBoxes.change(defaultOptions);
      };
      chart.notchBoxes.show = function (opts) {
        if (opts !== undefined) {
          opts.show = true;
          if (opts.reset) {
            chart.notchBoxes.reset();
          }
        } else {
          opts = { show: true };
        }
        chart.notchBoxes.change(opts);
      };
      chart.notchBoxes.hide = function (opts) {
        if (opts !== undefined) {
          opts.show = false;
          if (opts.reset) {
            chart.notchBoxes.reset();
          }
        } else {
          opts = { show: false };
        }
        chart.notchBoxes.change(opts);
      };

      /**
       * Update the notch box obj values
       */
      chart.notchBoxes.update = function () {
        var cName, cGroup;

        for (cName in chart.groupObjs) {
          cGroup = chart.groupObjs[cName];

          // Get the box size
          var boxBounds = getObjWidth(nOpts.boxWidth, cName);
          var medianBounds = getObjWidth(nOpts.medianWidth, cName);

          var notchBounds = {
            boxLeft: boxBounds.left,
            boxRight: boxBounds.right,
            middle: boxBounds.middle,
            medianLeft: medianBounds.left,
            medianRight: medianBounds.right,
          };

          // Notch Box
          if (cGroup.notchBox.objs.notch) {
            cGroup.notchBox.objs.notch.attr(
              'points',
              makeNotchBox(cGroup, notchBounds)
            );
          }
          if (cGroup.notchBox.objs.upperLine) {
            var lineBounds = null;
            if (nOpts.lineWidth) {
              lineBounds = getObjWidth(nOpts.lineWidth, cName);
            } else {
              lineBounds = objBounds;
            }

            var confidenceLines = {
              upper: chart.yScale(cGroup.metrics.upperNotch),
              lower: chart.yScale(cGroup.metrics.lowerNotch),
            };
            cGroup.notchBox.objs.upperLine
              .attr('x1', lineBounds.left)
              .attr('x2', lineBounds.right)
              .attr('y1', confidenceLines.upper)
              .attr('y2', confidenceLines.upper);
            cGroup.notchBox.objs.lowerLine
              .attr('x1', lineBounds.left)
              .attr('x2', lineBounds.right)
              .attr('y1', confidenceLines.lower)
              .attr('y2', confidenceLines.lower);
          }
        }
      };

      /**
       * Create the svg elements for the notch boxes
       */
      chart.notchBoxes.prepareNotchBoxes = function () {
        var cName, cNotch;

        if (nOpts && nOpts.colors) {
          chart.notchBoxes.colorFunct = getColorFunct(nOpts.colors);
        } else {
          chart.notchBoxes.colorFunct = chart.colorFunct;
        }

        if (nOpts.show == false) {
          return;
        }

        for (cName in chart.groupObjs) {
          cNotch = chart.groupObjs[cName].notchBox;

          cNotch.objs.g = chart.groupObjs[cName].g
            .append('g')
            .attr('class', 'notch-plot');

          // Plot Box (default show)
          if (nOpts.showNotchBox) {
            cNotch.objs.notch = cNotch.objs.g
              .append('polygon')
              .attr('class', 'notch')
              .style('fill', chart.notchBoxes.colorFunct(cName))
              .style('stroke', chart.notchBoxes.colorFunct(cName));
            //A stroke is added to the notch with the group color, it is
            // hidden by default and can be shown through css with stroke-width
          }

          //Plot Confidence Lines (default hide)
          if (nOpts.showLines) {
            cNotch.objs.upperLine = cNotch.objs.g
              .append('line')
              .attr('class', 'upper confidence line')
              .style('stroke', chart.notchBoxes.colorFunct(cName));

            cNotch.objs.lowerLine = cNotch.objs.g
              .append('line')
              .attr('class', 'lower confidence line')
              .style('stroke', chart.notchBoxes.colorFunct(cName));
          }
        }
      };
      chart.notchBoxes.prepareNotchBoxes();

      d3.select(window).on(
        'resize.' + chart.selector + '.notchBox',
        chart.notchBoxes.update
      );
      chart.notchBoxes.update();
      return chart;
    };

    /**
     * Render a raw data in various forms
     * @param options
     * @param [options.show=true] Toggle the whole plot on and off
     * @param [options.showPlot=false] True or false, show points
     * @param [options.plotType='none'] Options: no scatter = (false or 'none'); scatter points= (true or [amount=% of width (default=10)]); beeswarm points = ('beeswarm')
     * @param [options.pointSize=6] Diameter of the circle in pizels (not the radius)
     * @param [options.showLines=['median']] Can equal any of the metrics lines
     * @param [options.showbeanLines=false] Options: no lines = false
     * @param [options.beanWidth=20] % width
     * @param [options.colors=chart default]
     * @returns {*} The chart object
     *
     */
    chart.renderDataPlots = function (options) {
      chart.dataPlots = {};

      //Defaults
      var defaultOptions = {
        show: true,
        showPlot: false,
        plotType: 'none',
        pointSize: 7,
        showLines: false, //['median'],
        showBeanLines: false,
        beanWidth: 20,
        colors: null,
      };
      chart.dataPlots.options = shallowCopy(defaultOptions);
      for (var option in options) {
        chart.dataPlots.options[option] = options[option];
      }
      var dOpts = chart.dataPlots.options;

      //Create notch objects
      for (var cName in chart.groupObjs) {
        chart.groupObjs[cName].dataPlots = {};
        chart.groupObjs[cName].dataPlots.objs = {};
      }
      // The lines don't fit into a group bucket so they live under the dataPlot object
      chart.dataPlots.objs = {};

      /**
       * Take updated options and redraw the data plots
       * @param updateOptions
       */
      chart.dataPlots.change = function (updateOptions) {
        if (updateOptions) {
          for (var key in updateOptions) {
            dOpts[key] = updateOptions[key];
          }
        }

        chart.dataPlots.objs.g.remove();
        for (var cName in chart.groupObjs) {
          chart.groupObjs[cName].dataPlots.objs.g.remove();
        }
        chart.dataPlots.preparePlots();
        chart.dataPlots.update();
      };

      chart.dataPlots.reset = function () {
        chart.dataPlots.change(defaultOptions);
      };
      chart.dataPlots.show = function (opts) {
        if (opts !== undefined) {
          opts.show = true;
          if (opts.reset) {
            chart.dataPlots.reset();
          }
        } else {
          opts = { show: true };
        }
        chart.dataPlots.change(opts);
      };
      chart.dataPlots.hide = function (opts) {
        if (opts !== undefined) {
          opts.show = false;
          if (opts.reset) {
            chart.dataPlots.reset();
          }
        } else {
          opts = { show: false };
        }
        chart.dataPlots.change(opts);
      };

      /**
       * Update the data plot obj values
       */
      chart.dataPlots.update = function () {
        var cName, cGroup, cPlot;

        // Metrics lines
        if (chart.dataPlots.objs.g) {
          var halfBand = chart.xScale.bandwidth() / 2; // find the middle of each band
          for (var cMetric in chart.dataPlots.objs.lines) {
            chart.dataPlots.objs.lines[cMetric].line.x(function (d) {
              return chart.xScale(d.x) + halfBand;
            });
            chart.dataPlots.objs.lines[cMetric].g
              .datum(chart.dataPlots.objs.lines[cMetric].values)
              .attr('d', chart.dataPlots.objs.lines[cMetric].line);
          }
        }

        for (cName in chart.groupObjs) {
          cGroup = chart.groupObjs[cName];
          cPlot = cGroup.dataPlots;

          if (cPlot.objs.points) {
            if (dOpts.plotType == 'beeswarm') {
              var swarmBounds = getObjWidth(100, cName);
              var yPtScale = chart.yScale
                .copy()
                .range([
                  Math.floor(chart.yScale.range()[0] / dOpts.pointSize),
                  0,
                ])
                .interpolate(d3.interpolateRound)
                .domain(chart.yScale.domain());
              var maxWidth = Math.floor(
                chart.xScale.bandwidth() / dOpts.pointSize
              );
              var ptsObj = {};
              var cYBucket = null;
              //  Bucket points
              for (var pt = 0; pt < cGroup.values.length; pt++) {
                cYBucket = yPtScale(cGroup.values[pt]);
                if (ptsObj.hasOwnProperty(cYBucket) !== true) {
                  ptsObj[cYBucket] = [];
                }
                ptsObj[cYBucket].push(
                  cPlot.objs.points.pts[pt]
                    .attr('cx', swarmBounds.middle)
                    .attr('cy', yPtScale(cGroup.values[pt]) * dOpts.pointSize)
                );
              }
              //  Plot buckets
              var rightMax = Math.min(swarmBounds.right - dOpts.pointSize);
              for (var row in ptsObj) {
                var leftMin =
                  swarmBounds.left +
                  Math.max((maxWidth - ptsObj[row].length) / 2, 0) *
                    dOpts.pointSize;
                var col = 0;
                for (pt in ptsObj[row]) {
                  ptsObj[row][pt].attr(
                    'cx',
                    Math.min(leftMin + col * dOpts.pointSize, rightMax) +
                      dOpts.pointSize / 2
                  );
                  col++;
                }
              }
            } else {
              // For scatter points and points with no scatter
              var plotBounds = null,
                scatterWidth = 0,
                width = 0;
              if (
                dOpts.plotType == 'scatter' ||
                typeof dOpts.plotType == 'number'
              ) {
                //Default scatter percentage is 20% of box width
                scatterWidth =
                  typeof dOpts.plotType == 'number' ? dOpts.plotType : 20;
              }

              plotBounds = getObjWidth(scatterWidth, cName);
              width = plotBounds.right - plotBounds.left;

              for (var pt = 0; pt < cGroup.values.length; pt++) {
                cPlot.objs.points.pts[pt]
                  .attr('cx', plotBounds.middle + addJitter(true, width))
                  .attr('cy', chart.yScale(cGroup.values[pt]));
              }
            }
          }

          if (cPlot.objs.bean) {
            var beanBounds = getObjWidth(dOpts.beanWidth, cName);
            for (var pt = 0; pt < cGroup.values.length; pt++) {
              cPlot.objs.bean.lines[pt]
                .attr('x1', beanBounds.left)
                .attr('x2', beanBounds.right)
                .attr('y1', chart.yScale(cGroup.values[pt]))
                .attr('y2', chart.yScale(cGroup.values[pt]));
            }
          }
        }
      };

      /**
       * Create the svg elements for the data plots
       */
      chart.dataPlots.preparePlots = function () {
        var cName, cPlot;

        if (dOpts && dOpts.colors) {
          chart.dataPlots.colorFunct = getColorFunct(dOpts.colors);
        } else {
          chart.dataPlots.colorFunct = chart.colorFunct;
        }

        if (dOpts.show == false) {
          return;
        }

        // Metrics lines
        chart.dataPlots.objs.g = chart.objs.g
          .append('g')
          .attr('class', 'metrics-lines');
        if (dOpts.showLines && dOpts.showLines.length > 0) {
          chart.dataPlots.objs.lines = {};
          var cMetric;
          for (var line in dOpts.showLines) {
            cMetric = dOpts.showLines[line];
            chart.dataPlots.objs.lines[cMetric] = {};
            chart.dataPlots.objs.lines[cMetric].values = [];
            for (var cGroup in chart.groupObjs) {
              chart.dataPlots.objs.lines[cMetric].values.push({
                x: cGroup,
                y: chart.groupObjs[cGroup].metrics[cMetric],
              });
            }
            chart.dataPlots.objs.lines[cMetric].line = d3
              .line()
              .curve(d3.curveCardinal)
              .y(function (d) {
                return chart.yScale(d.y);
              });
            chart.dataPlots.objs.lines[cMetric].g = chart.dataPlots.objs.g
              .append('path')
              .attr('class', 'line ' + cMetric)
              .attr('data-metric', cMetric)
              .style('fill', 'none')
              .style('stroke', chart.colorFunct(cMetric));
          }
        }

        for (cName in chart.groupObjs) {
          cPlot = chart.groupObjs[cName].dataPlots;
          cPlot.objs.g = chart.groupObjs[cName].g
            .append('g')
            .attr('class', 'data-plot');
          // Points Plot
          if (dOpts.showPlot) {
            cPlot.objs.points = { g: null, pts: [] };
            cPlot.objs.points.g = cPlot.objs.g
              .append('g')
              .attr('class', 'points-plot');

            var _loop = function _loop() {
              var val = chart.groupObjs[cName].values[pt];
              var valInfo = chart.groupObjs[cName].valuesInfo[pt];
              cPlot.objs.points.pts.push(
                cPlot.objs.points.g
                  .append('circle')
                  .attr('class', 'point')
                  //class id so it can be selected
                  .attr('class', function () {
                    var id = chart.settings.id ? chart.settings.id : false;
                    return id ? 'distro-' + valInfo.id : '';
                  })
                  .attr('r', dOpts.pointSize / 2) // Options is diameter, r takes radius so divide by 2
                  .style('fill', chart.dataPlots.colorFunct(cName))
                  .style('fill-opacity', 0.6)
                  .style('stroke', chart.dataPlots.colorFunct(cName))
                  .style('stroke-width', '2px')
                  .on('mouseover', function () {
                    chart.objs.tooltip
                      .style('display', null)
                      .style('left', d3.event.pageX + 'px')
                      .style('top', d3.event.pageY - 28 + 'px');
                  })
                  .on('mouseout', function () {
                    chart.objs.tooltip.style('display', 'none');
                  })
                  .on(
                    'mousemove',
                    tooltipHover(
                      cName,
                      chart.groupObjs[cName].metrics,
                      valInfo.idName,
                      val
                    )
                  )
                  .on('click', function () {
                    if (chart.settings.events.onClickElement) {
                      chart.settings.events.onClickElement.call(this, valInfo);
                    }
                  })
              );
            };

            for (var pt = 0; pt < chart.groupObjs[cName].values.length; pt++) {
              _loop();
            }
          }

          // Bean lines
          if (dOpts.showBeanLines) {
            cPlot.objs.bean = { g: null, lines: [] };
            cPlot.objs.bean.g = cPlot.objs.g
              .append('g')
              .attr('class', 'bean-plot');
            for (var pt = 0; pt < chart.groupObjs[cName].values.length; pt++) {
              cPlot.objs.bean.lines.push(
                cPlot.objs.bean.g
                  .append('line')
                  .attr('class', 'bean line')
                  .style('stroke-width', '1')
                  .style('stroke', chart.dataPlots.colorFunct(cName))
              );
            }
          }
        }
      };
      chart.dataPlots.preparePlots();

      d3.select(window).on(
        'resize.' + chart.selector + '.dataPlot',
        chart.dataPlots.update
      );
      chart.dataPlots.update();
      return chart;
    };

    return chart;
  }

  /* Simple Distro example
   * Single and multiline Distros
   */
  function distro(config, helper) {
    var Distro = Object.create(helper);

    Distro.init = function (config) {
      var vm = this;
      vm._config = config ? config : {};
      vm._data = [];
      vm._scales = {};
      vm._axes = {};

      vm._tip = vm.utils.d3
        .tip()
        .attr('class', 'd3-tip')
        .html(
          vm._config.tip
            ? vm._config.tip
            : function (d) {
                var html = '';
                //html += d.x ? ('<span>' + (Number.isNaN(+d.x) ? d.x : vm.utils.format(vm._config.xAxis)(d.x)) + '</span></br>') : '';
                html += d.y
                  ? '<span>' +
                    (Number.isNaN(+d.y)
                      ? d.y
                      : vm.utils.format(vm._config.yAxis)(d.y)) +
                    '</span></br>'
                  : '';
                /* html += d.magnitude ? ('<span>' + (Number.isNaN(+d.magnitude) ? d.magnitude : vm.utils.format()(d.magnitude)) + '</span></br>') : '';
        html += d.color ? ('<span>' + (Number.isNaN(+d.color) ? d.color : vm.utils.format()(d.color)) + '</span>') : ''; */
                return html;
              }
        );
    };

    //-------------------------------
    //User config functions
    Distro.type = function (type) {
      var vm = this;
      vm._config.type = type;
      return vm;
    };

    Distro.x = function (col) {
      var vm = this;
      vm._config.x = col;
      return vm;
    };

    Distro.y = function (col) {
      var vm = this;
      vm._config.y = col;
      return vm;
    };

    Distro.sortBy = function (opt) {
      var vm = this;
      vm._config.sortBy = opt;
      return vm;
    };

    Distro.fill = function (col) {
      var vm = this;
      vm._config.fill = col;
      return vm;
    };

    Distro.id = function (col) {
      var vm = this;
      vm._config.id = col;
      return vm;
    };

    Distro.colors = function (colors) {
      var vm = this;
      if (Array.isArray(colors)) {
        //Using an array of colors for the range
        vm._config.colors = colors;
      } else {
        //Using a preconfigured d3.scale
        vm._scales.color = colors;
      }
      return vm;
    };

    Distro.tip = function (tip) {
      var vm = this;
      vm._config.tip = tip;
      vm._tip.html(vm._config.tip);
      return vm;
    };

    //-------------------------------
    //Triggered by the chart.js;
    Distro.data = function (data) {
      var vm = this;

      vm._data = [];
      data.forEach(function (d) {
        d.x = d[vm._config.x];
        d.y = +d[vm._config.y];
        d.color = vm._config.fill ? d[vm._config.fill] : 'red';
        delete d[vm._config.x];
        delete d[vm._config.y];
        if (vm._config.fill) delete d[vm._config.x];

        vm._data.push(d);
      });

      return vm;
    };

    Distro.scales = function () {
      var vm = this;

      return vm;
    };

    Distro.draw = function () {
      var vm = this;
      //Call the tip
      //vm.chart.svg().call(vm._tip);

      vm.chart.fullSvg().remove();

      var chart1 = makeDistroChart({
        chart: vm.chart,
        data: vm._data,
        id: vm._config.id,
        idName: vm._config.idName,
        events: vm._config.events,
        xName: 'x',
        xSort:
          _typeof(vm._config.sortBy) === 'object' && vm._config.sortBy.x
            ? vm._config.sortBy.x
            : null,
        yName: 'y',
        axisLabels: {
          xAxis: vm._config.axisLabels.xAxis,
          yAxis: vm._config.axisLabels.yAxis,
        },
        selector: '#distro',
        colors: ['#fff5ca', '#fbc43a', '#5cbd00', '#084c1f'],
        chartSize: {
          height: vm._config.size.height,
          width: vm._config.size.width,
        },
        margin: {
          top: vm._config.size.margin.top,
          right: vm._config.size.margin.right,
          bottom: vm._config.size.margin.bottom,
          left: vm._config.size.margin.left,
        },
        constrainExtremes: true,
      });

      if (vm.chart.config.styles) {
        d3.select('#distro .tooltip')
          .style('background-color', vm.chart.style.tooltip.backgroundColor)
          .style('line-height', 1)
          .style('font-weight', vm.chart.style.tooltip.text.fontWeight)
          .style('font-size', vm.chart.style.tooltip.text.fontSize)
          .style('color', vm.chart.style.tooltip.text.textColor)
          .style('font-family', vm.chart.style.tooltip.text.fontFamily)
          .style('background-color', vm.chart.style.tooltip.backgroundColor)
          .style('padding', vm.chart.style.tooltip.text.padding)
          .style(
            'border',
            vm.chart.style.tooltip.border.width +
              ' solid ' +
              vm.chart.style.tooltip.border.color
          )
          .style('border-radius', vm.chart.style.tooltip.border.radius);
      }

      chart1.renderBoxPlot();
      chart1.renderDataPlots();
      chart1.renderNotchBoxes({ showNotchBox: false });
      chart1.renderViolinPlot({ showViolinPlot: false });

      chart1.boxPlots.show({
        reset: true,
        showWhiskers: false,
        showOutliers: false,
        showMean: true,
        showMedian: true,
        showBox: false,
      });
      chart1.dataPlots.change({ showPlot: true });
      chart1.violinPlots.show({ reset: true, clamp: 0, width: 100 });
      //Box Plot
      /* chart1.violinPlots.hide();
      chart1.boxPlots.show({reset:true});
      chart1.notchBoxes.hide();
      chart1.dataPlots.change({showPlot:false,showBeanLines:false});  */

      //Notched Box Plot
      /*  chart1.violinPlots.hide();
      chart1.notchBoxes.show({reset:true});
      chart1.boxPlots.show({reset:true, showBox:false,showOutliers:true,boxWidth:20,scatterOutliers:true});
      chart1.dataPlots.change({showPlot:false,showBeanLines:false}); */

      //Violin Plot Unbound
      /* chart1.violinPlots.show({reset:true,clamp:0});
      chart1.boxPlots.show({reset:true, showWhiskers:false,showOutliers:false,boxWidth:10,lineWidth:15,colors:['#555']});
      chart1.notchBoxes.hide();
      chart1.dataPlots.change({showPlot:false,showBeanLines:false})  */

      //Violin Plot Clamp to Data
      if (vm._config.type === 'violin') {
        chart1.violinPlots.show({ reset: true, clamp: 1, width: 50 });
        chart1.boxPlots.show({
          reset: true,
          showWhiskers: false,
          showOutliers: false,
          boxWidth: 10,
          lineWidth: 15,
          colors: ['#555'],
        });
        chart1.notchBoxes.hide();
        chart1.dataPlots.change({ showPlot: false, showBeanLines: false });
      }

      //Bean Plot
      /* chart1.violinPlots.show({reset:true, width:75, clamp:0, resolution:30, bandwidth:50});
      chart1.dataPlots.show({showBeanLines:true,beanWidth:15,showPlot:false,colors:['#555']});
      chart1.boxPlots.hide();
      chart1.notchBoxes.hide(); */

      //Beeswarm Plot
      /* chart1.violinPlots.hide();
      chart1.dataPlots.show({showPlot:true, plotType:'beeswarm',showBeanLines:false, colors:null});
      chart1.notchBoxes.hide();
      chart1.boxPlots.hide(); */

      //Scatter Plot
      if (vm._config.type === 'scatter') {
        chart1.violinPlots.hide();
        chart1.dataPlots.show({
          showPlot: true,
          plotType: 40,
          showBeanLines: false,
          colors: null,
        });
        chart1.notchBoxes.hide();
        //chart1.boxPlots.hide();
      }

      //Trend Lines
      /* if(chart1.dataPlots.options.showLines){
          chart1.dataPlots.change({showLines:false});
      } else {
          chart1.dataPlots.change({showLines:['median','quartile1','quartile3']});
      } */

      return vm;
    };

    Distro.select = function (id) {
      return d3.select('#distro .distro-' + id);
    };

    Distro.selectAll = function (id) {
      return d3.selectAll('#distro ' + id);
    };

    Distro.init(config);
    return Distro;
  }

  /*
   * Heatmap Chart
   */
  function heatmap(config, helper) {
    var Heatmap = Object.create(helper);

    Heatmap.init = function (config) {
      var vm = this;
      vm._config = config ? config : {};
      if (!vm._config.size.legendTranslate) {
        vm._config.size.legendTranslate = 100;
      }
      vm._data = [];
      vm._scales = {};
      vm._axes = {};

      vm._legendElementWidth = vm._gridWidth;

      vm._tip = vm.utils.d3
        .tip()
        .attr(
          'class',
          'd3-tip ' +
            (vm._config.tooltip && vm._config.tooltip.classed
              ? vm._config.tooltip.classed
              : '')
        )
        .direction('n')
        .html(
          vm._config.tip ||
            function (d) {
              var html = d.x;
              if (d.x !== d.y) {
                html += '<br>' + d.y;
              }
              html += '<br>' + vm.utils.format()(d.value);
              return html;
            }
        );
    };

    //-------------------------------
    //User config functions
    Heatmap.x = function (column) {
      var vm = this;
      vm._config.x = column;
      return vm;
    };

    Heatmap.y = function (column) {
      var vm = this;
      vm._config.y = column;
      return vm;
    };

    Heatmap.fill = function (column) {
      var vm = this;
      vm._config.fill = column;
      return vm;
    };

    Heatmap.colors = function (colors) {
      var vm = this;
      vm._config.colors = colors;
      return vm;
    };

    Heatmap.colorLegend = function (legendTitle) {
      var vm = this;
      vm._config.legendTitle = legendTitle;
      return vm;
    };

    /**
     * Personalize border radius (rx, ry) for each rect
     * @param {number} radius - value to be set, default is 5
     */
    Heatmap.borderRadius = function (radius) {
      var vm = this;
      vm._config.borderRadius = radius;
      return vm;
    };

    Heatmap.sortBy = function (sortBy) {
      var vm = this;
      vm._config.sortBy = sortBy;
      return vm;
    };

    Heatmap.tip = function (tip) {
      var vm = this;
      vm._config.tip = tip;
      vm._tip.html(vm._config.tip);
      return vm;
    };

    //-------------------------------
    //Triggered by chart.js;
    Heatmap.data = function (data) {
      var vm = this;
      var xSort = vm.utils.sortAscending;
      var ySort = vm.utils.sortAscending;

      if (typeof vm._config.sortBy === 'string') {
        if (vm._config.hasOwnProperty('sortBy') && vm._config.sortBy === 'desc')
          xSort = vm.utils.sortDescending;
      }

      if (_typeof(vm._config.sortBy) === 'object') {
        if (
          vm._config.hasOwnProperty('sortBy') &&
          vm._config.sortBy.hasOwnProperty('x') &&
          vm._config.sortBy.x === 'desc'
        )
          xSort = vm.utils.sortDescending;
        if (
          vm._config.hasOwnProperty('sortBy') &&
          vm._config.sortBy.hasOwnProperty('y') &&
          vm._config.sortBy.y === 'desc'
        )
          ySort = vm.utils.sortDescending;
      }

      vm._config.xCategories = d3
        .nest()
        .key(function (d) {
          return d[vm._config.x];
        })
        .sortKeys(xSort)
        .entries(data)
        .map(function (d) {
          return d.key;
        });

      vm._config.yCategories = d3
        .nest()
        .key(function (d) {
          return d[vm._config.y];
        })
        .sortKeys(ySort)
        .entries(data)
        .map(function (d) {
          return d.key;
        });

      vm._config.fillValues = d3
        .nest()
        .key(function (d) {
          return d[vm._config.fill];
        })
        .entries(data)
        .map(function (d) {
          return Number(d.key);
        });

      /**
       * Calculate grid width and height according to chart size
       */
      vm._gridWidth = Math.floor(
        (vm._config.size.width -
          (vm._config.size.margin.left + vm._config.size.margin.right)) /
          vm._config.xCategories.length
      );

      vm._gridHeight = Math.floor(
        (vm._config.size.height -
          (vm._config.size.margin.top + vm._config.size.margin.bottom)) /
          vm._config.yCategories.length
      );

      vm._data = data.map(function (d) {
        var m = {
          y: d[vm._config.y],
          x: d[vm._config.x],
          value: +d[vm._config.fill],
        };
        if (d.coefficient) {
          m.coefficient = d.coefficient.toFixed(2);
        }
        return m;
      });

      return vm;
    };

    Heatmap.scales = function () {
      var vm = this;
      return vm;
    };

    Heatmap.drawColorLegend = function () {
      var vm = this;

      var domain = vm._config.colors;
      var quantilePosition = d3
        .scaleBand()
        .rangeRound([vm._config.size.height * 0.8, 0])
        .domain(domain);
      //Add gradient legend
      //defaults to right position
      var legend = d3
        .select(vm._config.bindTo)
        .select('svg')
        .append('g')
        .attr('class', 'legend quantized')
        .attr(
          'transform',
          'translate(' +
            (vm._config.size.width - vm._config.size.legendTranslate) +
            ',' +
            vm._config.size.height * 0.1 +
            ')'
        );

      // legend background
      legend
        .append('rect')
        .attr('x', -50)
        .attr('y', -35)
        .attr('width', 100)
        .attr('height', vm._config.size.height - 10)
        .attr('rx', 10)
        .attr('ry', 10)
        .attr('class', 'legend-background')
        .attr('fill', 'rgba(255,255,255,0.6)');

      // legend title
      legend
        .append('text')
        .attr('x', 0)
        .attr('y', -12)
        .attr('class', 'legend-title')
        .attr('text-anchor', 'middle')
        .text(vm._config.legendTitle);

      var quantiles = legend
        .selectAll('.quantile')
        .data(vm._config.colors)
        .enter()
        .append('g')
        .attr('class', 'quantile')
        .attr('transform', function (d) {
          return 'translate(-20, ' + quantilePosition(d) + ')';
        });

      // Rect
      quantiles
        .append('rect')
        .attr('x', -15)
        .attr('y', 0)
        .attr('width', 18)
        .attr('height', quantilePosition.bandwidth())
        .attr('fill', function (d) {
          return d;
        });

      //top text is the max value
      quantiles
        .append('text')
        .attr('x', 17)
        .attr('y', 5)
        .attr('class', 'top-label')
        .attr('text-anchor', 'left')
        .text(function (d) {
          var max = vm._scales.color.invertExtent(d)[1];
          if (vm._config.legendTitle === 'Porcentaje' && max > 100) {
            max = 100;
          }
          return vm.utils.format()(max);
        });

      //top text is the min value
      quantiles
        .append('text')
        .attr('x', 17)
        .attr('y', vm._config.size.height / 5 - 18)
        .attr('class', 'bottom-label')
        .attr('text-anchor', 'left')
        .text(function (d, i) {
          if (i === 0) {
            var min = vm._scales.color.invertExtent(d)[0];
            return vm.utils.format()(min);
          } else {
            return '';
          }
        });
    };

    Heatmap.drawLabels = function () {
      var vm = this;
      var cards = vm.chart
        .svg()
        .selectAll('.dbox-label')
        .data(vm._data, function (d) {
          return d.y + ':' + d.x;
        });
      // AXIS
      /*cards.enter().append('text')
        .attr('transform', 'translate(' + (-vm._gridWidth/2) + ', 10)')
        .attr('dx', function(d){ 
          return (((vm._config.xCategories.indexOf(String(d.x))) + 1) * vm._gridWidth);
        })
        .attr('dy', function(d) {
          return (vm._config.yCategories.indexOf(String(d.y))) * vm._gridHeight;
        })
        .attr('class', 'dbox-label')
        .text( function(d) { return d.x });
       cards.enter().append('text')
        .attr('transform', 'translate(' + (-vm._gridWidth/2) + ', 30)')
        .attr('dx', function(d){
          return (((vm._config.xCategories.indexOf(String(d.x))) + 1) * vm._gridWidth)
        })
        .attr('dy', function(d) {
          return (vm._config.yCategories.indexOf(String(d.y))) * vm._gridHeight;
        })
        .attr('class', 'dbox-label')
        .text( function(d) { return d.y });*/

      cards
        .enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + (-vm._gridWidth / 2 + 17) + ', 20)')
        .attr('dx', function (d) {
          return (
            (vm._config.xCategories.indexOf(String(d.x)) + 1) * vm._gridWidth
          );
        })
        .attr('dy', function (d) {
          return vm._config.yCategories.indexOf(String(d.y)) * vm._gridHeight;
        })
        .attr('class', 'dbox-label')
        .text(function (d) {
          return d.value ? vm.utils.format()(d.value) : '';
        });

      //COEFFICIENT
      cards
        .enter()
        .append('text')
        .attr('transform', 'translate(' + -vm._gridWidth / 2 + ', 40)')
        .attr('dx', function (d) {
          return (
            (vm._config.xCategories.indexOf(String(d.x)) + 1) * vm._gridWidth
          );
        })
        .attr('dy', function (d) {
          return vm._config.yCategories.indexOf(String(d.y)) * vm._gridHeight;
        })
        .attr('class', 'dbox-label-coefficient')
        .text(function (d) {
          return d.coefficient
            ? '(' + parseFloat(d.coefficient).toFixed(1) + ')'
            : '';
        });
    };

    Heatmap.draw = function () {
      var vm = this;

      //Call the tip
      vm.chart.svg().call(vm._tip);

      var axesTip = vm.utils.d3.tip().html(function (d) {
        return '<div class="title-tip">' + d + '</div>';
      });
      vm.chart.svg().call(axesTip);

      vm._yLabels = vm.chart
        .svg()
        .append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(17,0)')
        .selectAll('.tick')
        .data(vm._config.yCategories)
        .enter()
        .append('g')
        .attr('class', 'tick')
        .attr('transform', function (d, i) {
          return 'translate(0,' + i * vm._gridHeight + ')';
        })
        .append('text')
        .attr('text-anchor', 'end')
        .attr('transform', 'translate(-6,' + vm._gridHeight / 1.5 + ')')
        .text(function (d) {
          return d;
        });

      vm._yLabels.each(function (d) {
        var _this = this;

        if (this.getComputedTextLength() > vm._config.size.margin.left * 0.9) {
          (function () {
            d3.select(_this)
              .on('mouseover', axesTip.show)
              .on('mouseout', axesTip.hide);
            var i = 1;
            while (
              _this.getComputedTextLength() >
              vm._config.size.margin.left * 0.8
            ) {
              d3.select(_this)
                .text(function (d) {
                  return d.slice(0, -i) + '...';
                })
                .attr('title', d);
              ++i;
            }
          })();
        }
      });

      /** Y axis title */
      if (vm._config.yAxis && vm._config.yAxis.text) {
        var yAxis = vm.chart.svg().select('.y.axis');
        yAxis.selectAll('.y-title').remove();
        vm._yTitle = yAxis
          .append('g')
          .attr('class', 'y-title')
          .attr('transform', function (d, i) {
            return 'translate(0,' + i * vm._gridHeight + ')';
          })
          .append('text')
          .attr('class', 'axis-title')
          .attr('font-size', 17)
          .attr('font-weight', 600)
          .attr('text-anchor', 'middle')
          .attr(
            'transform',
            'translate(-' +
              (vm._config.size.margin.left - 3) +
              ', ' +
              (vm._config.size.height - vm._config.size.margin.bottom) / 2 +
              ' )rotate(-90)'
          )
          .text(vm._config.yAxis.text);
      }

      vm._xLabels = vm.chart
        .svg()
        .append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(23,0)')
        .selectAll('.tick')
        .data(vm._config.xCategories)
        .enter()
        .append('g')
        .attr('class', 'tick')
        .attr('transform', function (d, i) {
          return (
            'translate(' +
            (i * vm._gridWidth + vm._gridWidth / 2) +
            ',' +
            (vm._config.yCategories.length * vm._gridHeight + 20) +
            ')'
          );
        })
        .append('text')
        .attr('text-anchor', 'middle')
        .text(function (d) {
          return d;
        });

      var biggestLabelWidth = d3.max(
        d3
          .select('.x.axis')
          .selectAll('text')
          .nodes()
          .map(function (o) {
            return o.getComputedTextLength();
          })
      ); // Biggest label computed text length
      var xBandWidth = vm._gridWidth;
      var labelMaxWidth = xBandWidth;
      if (biggestLabelWidth > xBandWidth) {
        // Biggest label doesn't fit
        vm._xLabels.each(function (d) {
          var _this2 = this;

          d3.select(this)
            .attr('text-anchor', 'end')
            .attr('dy', 0)
            .attr('transform', 'translate(-5,-10)rotate(-90)');
          // Still doesn't fit!
          labelMaxWidth = 0.75 * vm._config.size.margin.bottom;
          if (this.getComputedTextLength() > labelMaxWidth) {
            (function () {
              d3.select(_this2)
                .on('mouseover', axesTip.show)
                .on('mouseout', axesTip.hide);
              var i = 1;
              while (_this2.getComputedTextLength() > labelMaxWidth) {
                d3.select(_this2)
                  .text(function (d) {
                    return d.slice(0, -i) + '...';
                  })
                  .attr('title', d);
                ++i;
              }
            })();
          } else {
            return d;
          }
        });
      }

      if (vm._config.xAxis && vm._config.xAxis.text) {
        var xAxis = vm.chart.svg().select('.x.axis');
        xAxis.selectAll('.x-title').remove();
        vm._xTitle = xAxis
          .append('g')
          .attr('class', 'x-title')
          .attr('transform', function (d, i) {
            return 'translate(0,' + i * vm._gridHeight + ')';
          })
          .append('text')
          .attr('class', 'axis-title')
          .attr('font-size', 17)
          .attr('font-weight', 600)
          .attr('text-anchor', 'middle')
          .attr(
            'transform',
            'translate(' +
              (vm._config.size.width -
                vm._config.size.margin.left -
                vm._config.size.margin.right) /
                2 +
              ', ' +
              (vm._config.size.height - 20) +
              ')'
          )
          .text(vm._config.xAxis.text);
      }

      vm._scales.color = d3
        .scaleQuantile()
        .domain(
          vm._data
            .map(function (d) {
              return d.value;
            })
            .sort()
        )
        .range(vm._config.colors);

      var cards = vm.chart
        .svg()
        .append('g')
        .attr('class', 'grid-container')
        .attr('transform', 'translate(17, 0)')
        .selectAll('.grid-cell')
        .data(vm._data, function (d) {
          return d.y + ':' + d.x;
        });

      cards
        .enter()
        .append('rect')
        .attr('x', function (d) {
          return vm._config.xCategories.indexOf(String(d.x)) * vm._gridWidth;
        })
        .attr('y', function (d) {
          return vm._config.yCategories.indexOf(String(d.y)) * vm._gridHeight;
        })
        .attr('rx', vm._config.borderRadius || 5)
        .attr('ry', vm._config.borderRadius || 5)
        .attr('class', 'grid-cell')
        .attr('stroke', '#fff')
        .attr('stroke-width', '2px')
        .attr('id', function (d) {
          return 'x' + d.x + 'y' + d.y;
        })
        .attr('width', vm._gridWidth)
        .attr('height', vm._gridHeight)
        .on('mouseover', function (d, i) {
          vm._tip.show(d, d3.select(this).node());
          if (vm._config.hasOwnProperty('mouseover')) {
            vm._config.mouseover.call(vm, d, i);
          }
        })
        .on('mouseout', function (d, i) {
          vm._tip.hide(d, d3.select(this).node());
          if (vm._config.hasOwnProperty('mouseout')) {
            vm._config.mouseout.call(this, d, i);
          }
        })
        .on('click', function (d, i) {
          if (vm._config.hasOwnProperty('onclick')) {
            vm._config.onclick.call(this, d, i);
          }
        })
        .attr('fill', function (d) {
          return vm._scales.color(d.value);
        });

      Heatmap.drawLabels();

      if (vm._config.hasOwnProperty('legendTitle')) {
        Heatmap.drawColorLegend();
      }

      /*
        var legend = vm.chart.svg().selectAll('.legend')
            .data([0].concat(colorScale.quantiles()), function(d) { return d; });
         var lgroup = legend.enter().append('g')
            .attr('class', 'legend');
         lgroup.append('rect')
            .attr('x', function(d, i) {  return vm._legendElementWidth * i; })
            .attr('y', vm._config.size.height - vm._config.size.margin.bottom*2)
            .attr('width', vm._legendElementWidth)
            .attr('height', vm._gridWidth / 2)
            .style('fill', function(d, i) { return vm._config.colors[i]; });
         lgroup.append('text')
            .attr('class', 'mono')
            .text(function(d) { return '≥ ' + Math.round(d); })
            .attr('x', function(d, i) { return vm._legendElementWidth * i; })
            .attr('y', vm._config.size.height - vm._config.size.margin.bottom*2 + vm._gridWidth);
         legend.exit().remove();*/
      return vm;
    };

    Heatmap.init(config);

    return Heatmap;
  }

  var L = require('leaflet');
  /**
   * Leaflet Chart
   * Creates a map using Leaflet.js
   */

  function leaflet(config, helper) {
    var Leaflet = Object.create(helper);

    Leaflet.init = function (config) {
      var vm = this;
      vm._config = config ? config : {};
      vm._scales = {};
      vm._axes = {};
      vm._data = [];

      vm._scales.color = d3
        .scaleQuantize()
        .range(['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15']);
    };

    Leaflet.id = function (col) {
      var vm = this;
      vm._config.id = col;
      return vm;
    };

    Leaflet.fill = function (col) {
      var vm = this;
      vm._config.fill = col;
      return vm;
    };

    Leaflet.opacity = function (value) {
      var vm = this;
      vm._config.opacity = value;
      return vm;
    };

    Leaflet.colors = function (colors) {
      var vm = this;
      vm._config.colors = colors;
      if (colors && Array.isArray(colors)) {
        vm._scales.color.range(colors);
      } else if (typeof colors === 'function') {
        vm._scales.color = colors;
      }
      return vm;
    };

    Leaflet.colorLegend = function (legendTitle) {
      var vm = this;
      vm._config.legendTitle = legendTitle;
      return vm;
    };

    // -------------------------------
    // Triggered by chart.js;
    Leaflet.data = function (data) {
      var vm = this;
      vm._topojson = data[1] ? data[1] : false; //Topojson
      data = data[0]; //User data

      if (vm._config.data.filter) {
        data = data.filter(vm._config.data.filter);
      }

      vm._data = data;
      //vm._quantiles = vm._setQuantile(data);
      vm._minMax = d3.extent(data, function (d) {
        return +d[vm._config.fill];
      });

      vm._scales.color.domain(vm._minMax);

      var objects = vm._config.map.topojson.objects;

      vm._nodes = [];
      if (Array.isArray(objects)) {
        for (var idx = 0; idx < objects.length; idx++) {
          var obj = objects[idx];
          vm._topojson.objects[obj].geometries.forEach(function (geom) {
            geom.id = vm._config.map.topojson.parser(geom);
            var found = vm._data.filter(function (o) {
              return o[vm._config.id] == geom.id;
            })[0];
            if (found) {
              geom.properties[vm._config.fill] = found[vm._config.fill];
            }
            vm._nodes.push(geom);
          });
        }
      } else if (objects) {
        vm._topojson.objects[objects].geometries.forEach(function (geom) {
          geom.id = vm._config.map.topojson.parser(geom);
          var found = vm._data.filter(function (o) {
            return o[vm._config.id] == geom.id;
          })[0];
          if (found) {
            geom.properties[vm._config.fill] = found[vm._config.fill];
          }
          vm._nodes.push(geom);
        });
      }

      // vm._config.map.min = vm._minMax[0];
      // vm._config.map.max = vm._minMax[1];
      return vm;
    };

    Leaflet.scales = function () {
      var vm = this;
      return vm;
    };

    Leaflet.drawColorLegend = function () {
      var vm = this;

      var range = vm._scales.color.range().length;
      var step = (vm._minMax[1] - vm._minMax[0]) / (range - 1);
      var domain = vm._config.colors;

      var quantilePosition = d3
        .scaleBand()
        .rangeRound([vm._config.size.height * 0.8, 0])
        .domain(domain);
      //Add gradient legend
      //defaults to right position
      var legend = d3
        .select('#' + vm._config.bindTo)
        .append('svg')
        .attr('width', 120)
        .attr('height', vm._config.size.height)
        .style('z-index', 401)
        .style('position', 'absolute')
        .style('top', '4px')
        .style('right', '2px')
        .append('g')
        .attr('class', 'legend quantized')
        .attr('transform', 'translate(50,25)');

      // legend background
      legend
        .append('rect')
        .attr('x', -50)
        .attr('y', -35)
        .attr('width', 100)
        .attr('height', vm._config.size.height - 10)
        .attr('rx', 10)
        .attr('ry', 10)
        .attr('class', 'legend-background')
        .attr('fill', 'rgba(255,255,255,0.6)');

      // legend title
      legend
        .append('text')
        .attr('x', 0)
        .attr('y', -12)
        .attr('class', 'legend-title')
        .attr('text-anchor', 'middle')
        .text(vm._config.legendTitle);

      var quantiles = legend
        .selectAll('.quantile')
        .data(vm._config.colors)
        .enter()
        .append('g')
        .attr('class', 'quantile')
        .attr('transform', function (d) {
          return 'translate(-20, ' + quantilePosition(d) + ')';
        });

      // Rect
      quantiles
        .append('rect')
        .attr('x', -10)
        .attr('y', 0)
        .attr('width', 18)
        .attr('height', quantilePosition.bandwidth())
        .attr('fill', function (d) {
          return d;
        });

      //top text is the max value
      quantiles
        .append('text')
        .attr('x', 17)
        .attr('y', 5)
        .attr('class', 'top-label')
        .attr('text-anchor', 'left')
        .text(function (d) {
          var max = vm._scales.color.invertExtent(d)[1];
          if (vm._config.legendTitle === 'Porcentaje' && max > 100) {
            max = 100;
          }
          if (vm._config.map.formatLegend) {
            return vm._config.map.formatLegend(max);
          } else {
            return vm.utils.format()(max);
          }
        });

      //bottom text is the min value
      quantiles
        .append('text')
        .attr('x', 17)
        .attr('y', vm._config.size.height / 5 - 11)
        .attr('class', 'bottom-label')
        .attr('text-anchor', 'left')
        .text(function (d, i) {
          if (i === 0) {
            var min = vm._scales.color.invertExtent(d)[0];
            if (vm._config.map.formatLegend) {
              return vm._config.map.formatLegend(min);
            } else {
              return vm.utils.format()(min);
            }
          } else {
            return '';
          }
        });
    };

    Leaflet.draw = function () {
      var vm = this;

      var urlTopojson = vm._config.map.topojson.url;
      var objects = vm._config.map.topojson.objects; //'states'
      var tran = vm._config.map.topojson.translate; //var tran = [2580, 700];
      var scale = vm._config.map.topojson.scale; //1300
      var parser = vm._config.map.topojson.parser;
      var id = vm._config.map.topojson.id;

      L.TopoJSON = L.GeoJSON.extend({
        addData: function addData(jsonData) {
          var geojson, key;
          if (jsonData.type === 'Topology') {
            if (objects) {
              if (Array.isArray(objects)) {
                for (var idx = 0; idx < objects.length; idx++) {
                  var obj = objects[idx];
                  geojson = topojson$1.feature(jsonData, jsonData.objects[obj]);
                  L.GeoJSON.prototype.addData.call(this, geojson);
                }
              } else {
                geojson = topojson$1.feature(
                  jsonData,
                  jsonData.objects[objects]
                );
                L.GeoJSON.prototype.addData.call(this, geojson);
              }
            } else {
              for (key in jsonData.objects) {
                geojson = topojson$1.feature(jsonData, jsonData.objects[key]);
                L.GeoJSON.prototype.addData.call(this, geojson);
              }
            }
          } else {
            L.GeoJSON.prototype.addData.call(this, jsonData);
          }
        },
      });

      var LatLng = {
        lat: 25.5629994,
        lon: -100.6405644,
      };
      if (
        vm._config.map.topojson.center &&
        vm._config.map.topojson.center.length === 2
      ) {
        LatLng.lat = vm._config.map.topojson.center[0];
        LatLng.lon = vm._config.map.topojson.center[1];
      }

      var bounds = new L.LatLngBounds(
        new L.LatLng(LatLng.lat + 5, LatLng.lon - 5),
        new L.LatLng(LatLng.lat - 5, LatLng.lon + 5)
      );

      vm._map = new L.Map(vm._config.bindTo, {
        center: bounds.getCenter(),
        zoom: vm._config.map.topojson.zoom || 7,
        maxZoom: vm._config.map.topojson.maxZoom || 10,
        minZoom: vm._config.map.topojson.minZoom || 3,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
      });

      var mapTiles = L.tileLayer(
        'http://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        {
          attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }
      );
      var topoLayer = new L.TopoJSON();

      mapTiles.addTo(vm._map);
      addTopoData(vm._topojson);

      // vm._map.on('zoomend', function() {
      //   d3.selectAll('.dbox-label').remove();
      //   Object.values(vm._map._layers)
      //     .filter(obj => obj.feature)
      //     .forEach(function(layer) {
      //     vm.drawLabel(layer);
      //   });
      // });

      function addTopoData(topoData) {
        topoLayer.addData(topoData);
        topoLayer.addTo(vm._map);
        topoLayer.eachLayer(handleLayer);
      }

      var tip = vm.utils.d3.tip().html(
        vm._config.tip
          ? vm._config.tip.bind(this)
          : function (d) {
              var html =
                '<div class="d3-tip" style="z-index: 99999;"><span>' +
                (d.feature.properties.NOM_ENT || d.feature.properties.NOM_MUN) +
                '</span><br/><span>' +
                vm.utils.format()(d.feature.properties[vm._config.fill]) +
                '</span></div>';
              return html;
            }
      );
      d3.select('#' + vm._config.bindTo)
        .select('svg.leaflet-zoom-animated')
        .call(tip);

      /**
       * Set each layer
       * @param {obj} layer
       */
      function handleLayer(layer) {
        var value = layer.feature.properties[vm._config.fill];
        if (!value) {
          // Remove polygons without data
          /** @todo validate what to do with NA's */
          d3.select(layer._path).remove();
        } else {
          var fillColor = vm._scales.color(value);

          layer.setStyle({
            fillColor: fillColor,
            fillOpacity: vm._config.opacity || 0.7,
            color: '#555',
            weight: 1,
            opacity: 0.5,
          });

          vm.drawLabel(layer);

          layer.on({
            mouseover: function mouseover() {
              enterLayer(layer);
            },
            mouseout: function mouseout() {
              leaveLayer(layer);
            },
          });
        }
      }

      function enterLayer(layer) {
        tip.show(layer, d3.select(layer._path).node());
      }

      function leaveLayer(layer) {
        tip.hide(layer);
      }

      /**
       * Draw Legend
       */
      if (typeof vm._config.legend === 'function') {
        vm._config.legend.call(this, vm._nodes);
      }

      Leaflet.drawColorLegend();

      return vm;
    };

    /**
     * Add labels for each path (layer) to display value
     */
    Leaflet.drawLabel = function (layer) {
      var vm = this;
      var props = layer.feature.properties;
      var path = d3.select(layer._path).node();
      var bbox = path.getBBox();
      var svg = d3
        .select('#' + vm._config.bindTo)
        .select('svg.leaflet-zoom-animated');

      if (props[vm._config.fill] !== undefined) {
        svg
          .append('text')
          .attr('class', 'dbox-label')
          .attr('x', bbox.x + bbox.width / 2)
          .attr('y', bbox.y + d3.min([bbox.height / 2, 30]))
          .attr('text-anchor', 'middle')
          .text(
            (props[vm._config.poly_name]
              ? props[vm._config.poly_name] + ': '
              : '') +
              '\n          ' +
              vm.utils.format()(props[vm._config.fill])
          );
      }
      return vm;
    };

    Leaflet.init(config);

    return Leaflet;
  }

  /*
   * Map
   */

  function map(config) {
    function Map(config) {
      var vm = this;
      vm._config = config ? config : {};
      vm._data = [];
      vm._scales = {};
      vm._axes = {};
      vm._tip = vm.utils.d3
        .tip()
        .attr(
          'class',
          'd3-tip ' +
            (vm._config.tooltip && vm._config.tooltip.classed
              ? vm._config.tooltip.classed
              : '')
        );

      vm._formatWithZeroDecimals = d3.format(',.0f');
      vm._formatWithOneDecimal = d3.format(',.1f');
      vm._formatWithTwoDecimals = d3.format(',.2f');
      vm._formatWithThreeDecimals = d3.format(',.3f');

      vm._format = {};
      vm._format.total = vm._formatWithZeroDecimals;
      vm._format.percentage = function (d) {
        return d3.format(',.1f')(d) + '%';
      };
      vm._format.change = d3.format(',.1f');
    }

    //-------------------------------
    //User config functions

    Map.prototype.id = function (col) {
      var vm = this;
      vm._config.id = col;
      return vm;
    };

    Map.prototype.color = function (col) {
      var vm = this;
      vm._config.color = col;
      return vm;
    };

    Map.prototype.tip = function (tip) {
      var vm = this;
      vm._config.tip = tip;
      vm._tip.html(vm._config.tip);
      return vm;
    };

    Map.prototype.onclick = function (onclick) {
      var vm = this;
      vm._config.onclick = onclick;
      return vm;
    };

    Map.prototype.end = function () {
      var vm = this;
      return vm._chart;
    };

    //-------------------------------
    //Triggered by the chart.js;
    Map.prototype.chart = function (chart) {
      var vm = this;
      vm._chart = chart;
      return vm;
    };

    Map.prototype.data = function (data) {
      var vm = this;

      vm._topojson = data[1] ? data[1] : false; //Topojson
      var data = data[0]; //User data

      if (vm._config.data.filter) {
        data = data[0].filter(vm._config.data.filter);
      }

      vm._data = data;
      vm._quantiles = vm._setQuantile(data);
      vm._minMax = d3.extent(data, function (d) {
        return +d[vm._config.color];
      });

      vm._config.map.min = vm._minMax[0];
      vm._config.map.max = vm._minMax[1];

      return vm;
    };

    Map.prototype.scales = function (s) {
      var vm = this;
      vm._scales = s;
      return vm;
    };

    Map.prototype.axes = function (a) {
      var vm = this;
      vm._axes = a;
      return vm;
    };

    Map.prototype.domains = function () {
      var vm = this;
      return vm;
    };

    Map.prototype.draw = function () {
      var vm = this;

      //@config
      var urlTopojson = vm._config.map.topojson.url;
      var objects = vm._config.map.topojson.objects; //'states'
      var tran = vm._config.map.topojson.translate; //var tran = [2580, 700];
      var scale = vm._config.map.topojson.scale; //1300

      var parser = vm._config.map.topojson.parser;

      var id = vm._config.map.topojson.id;

      //Call the tip
      vm._chart._svg.call(vm._tip);

      vm._projection = d3.geoMercator().scale(scale).translate(tran);

      vm.path = d3.geoPath().projection(vm._projection);

      vm._polygons = vm._chart._svg
        .append('g')
        .attr('id', 'dbox-map-polygons')
        .style('display', 'true')
        .attr('transform', function () {
          return (
            'translate(' +
            vm._config.size.translateX +
            ',100) scale(' +
            vm._config.size.scale +
            ')'
          );
        });

      var features = topojson.feature(
        vm._topojson,
        vm._topojson.objects[objects]
      ).features;

      if (typeof vm._config.map.topojson.filter != 'undefined') {
        var filter = vm._config.map.topojson.filter;
        Object.keys(filter).map(function (key) {
          features = features.filter(function (feature) {
            return feature.properties[key] === filter[key];
          });
        });
      }

      vm._polygons
        .selectAll('path')
        .data(features, parser)
        .enter()
        .append('path')
        .attr('d', d3.geoPath().projection(vm._projection))
        .attr('id', id)
        .attr('data-geotype', objects)
        .attr('fill', '#808080')
        .attr('stroke', '#a0a0a0')
        .style('stroke-width', '1px')
        .on('mouseover', function (d, i) {
          if (vm._config.map.quantiles.colorsOnHover) {
            //OnHover colors
            d3.select(this).attr('fill', function (d) {
              return vm._getQuantileColor(d[vm._config.color], 'onHover');
            });
          }

          //vm._tip.show(d, d3.select(this).node()) //Show TIP

          if (vm._config.data.onmouseover) {
            //External function call
            vm._config.data.onmouseover.call(this, d, i);
          }
        })
        .on('mouseout', function (d, i) {
          if (vm._config.map.quantiles.colorsOnHover) {
            //OnHover reset default color
            d3.select(this).attr('fill', function (d) {
              return vm._getQuantileColor(d[vm._config.color], 'default');
            });
          }
          //Hide tip
          //vm._tip.hide(d, d3.select(this).node())

          if (vm._config.data.onmouseout) {
            //External function call
            vm._config.data.onmouseout.call(this, d, i);
          }
        })
        .on('click', function (d, i) {
          if (vm._config.data.onclick) {
            vm._config.data.onclick.call(this, d, i);
          }
        });

      vm._polygonsDefault = vm._polygons.selectAll('path').data();

      vm._polygons
        .selectAll('path')
        .attr('stroke', '#333')
        .attr('stroke-width', 0.2);
      vm._polygons.selectAll('path').attr('fill', 'red');
      vm._polygons.selectAll('path').attr('data-total', null);
      vm._polygons
        .selectAll('path')
        .data(vm._data, function (d) {
          //@TODO WHY THE F..K IS D3 ITERATING OVER THE OLD DATA
          return d.id ? d.id : d[vm._config.id];
        })
        .attr('fill', function (d) {
          return vm._getQuantileColor(d[vm._config.color], 'default');
        })
        .attr('data-total', function (d) {
          return +d[vm._config.color];
        });

      //Resets the map paths data to topojson
      vm._polygons.selectAll('path').data(vm._polygonsDefault, function (d) {
        return d.id;
      });
    };

    Map.prototype._setQuantile = function (data) {
      var vm = this;
      var values = [];
      var quantile = [];

      if (
        vm._config.map.quantiles &&
        vm._config.map.quantiles.predefinedQuantiles &&
        vm._config.map.quantiles.predefinedQuantiles.length > 0
      ) {
        return vm._config.map.quantiles.predefinedQuantiles;
      }

      data.forEach(function (d) {
        values.push(+d[vm._config.color]);
      });

      values.sort(d3.ascending);

      //@TODO use quantile scale instead of manual calculations
      if (
        vm._config &&
        vm._config.map &&
        vm._config.map.quantiles &&
        vm._config.map.quantiles.buckets
      ) {
        if (vm._config.map.quantiles.ignoreZeros === true) {
          var aux = _.dropWhile(values, function (o) {
            return o <= 0;
          });
          //aux.unshift(values[0]);

          quantile.push(values[0]);
          quantile.push(0);

          for (var i = 1; i <= vm._config.map.quantiles.buckets - 1; i++) {
            quantile.push(
              d3.quantile(aux, (i * 1) / (vm._config.map.quantiles.buckets - 1))
            );
          }
        } else {
          quantile.push(d3.quantile(values, 0));
          for (var i = 1; i <= vm._config.map.quantiles.buckets; i++) {
            quantile.push(
              d3.quantile(values, (i * 1) / vm._config.map.quantiles.buckets)
            );
          }
        }
      } else {
        quantile = [
          d3.quantile(values, 0),
          d3.quantile(values, 0.2),
          d3.quantile(values, 0.4),
          d3.quantile(values, 0.6),
          d3.quantile(values, 0.8),
          d3.quantile(values, 1),
        ];
      }

      //@TODO - VALIDATE WHEN ZEROS NEED TO BE PUT ON QUANTILE 1 AND RECALCULATE NON ZERO VALUES INTO THE REST OF THE BUCKETS
      if (
        vm._config.map.quantiles &&
        vm._config.map.quantiles.buckets &&
        vm._config.map.quantiles.buckets === 5
      ) {
        if (
          quantile[1] === quantile[2] &&
          quantile[2] === quantile[3] &&
          quantile[3] === quantile[4] &&
          quantile[4] === quantile[5]
        ) {
          quantile = [d3.quantile(values, 0), d3.quantile(values, 0.2)];
        }
      }

      return quantile;
    };

    Map.prototype._getQuantileColor = function (d, type) {
      var vm = this;
      var total = parseFloat(d);

      //@TODO use quantile scale instead of manual calculations
      if (
        vm._config &&
        vm._config.map &&
        vm._config.map.quantiles &&
        vm._config.map.quantiles.colors
      ) {
        if (vm._quantiles.length > 2) {
          if (
            vm._config &&
            vm._config.map &&
            vm._config.map.min !== undefined &&
            vm._config.map.max !== undefined
          ) {
            if (total < vm._config.map.min || total > vm._config.map.max) {
              console.log(
                'outOfRangeColor',
                total,
                vm._config.map.min,
                vm._config.map.max
              );
              return vm._config.map.quantiles.outOfRangeColor;
            }
          } else {
            if (total < vm._minMax[0] || total > vm._minMax[1]) {
              console.log(
                'outOfRangeColor',
                total,
                vm._config.map.min,
                vm._config.map.max
              );
              return vm._config.map.quantiles.outOfRangeColor;
            }
          }

          if (type == 'default') {
            if (total <= vm._quantiles[1]) {
              return vm._config.map.quantiles.colors[0]; //"#f7c7c5";
            } else if (total <= vm._quantiles[2]) {
              return vm._config.map.quantiles.colors[1]; //"#e65158";
            } else if (total <= vm._quantiles[3]) {
              return vm._config.map.quantiles.colors[2]; //"#c20216";
            } else if (total <= vm._quantiles[4]) {
              return vm._config.map.quantiles.colors[3]; //"#750000";
            } else if (total <= vm._quantiles[5]) {
              return vm._config.map.quantiles.colors[4]; //"#480000";
            }
          }

          if (type == 'onHover' && vm._config.map.quantiles.colorsOnHover) {
            if (total <= vm._quantiles[1]) {
              return vm._config.map.quantiles.colorsOnHover[0]; //"#f7c7c5";
            } else if (total <= vm._quantiles[2]) {
              return vm._config.map.quantiles.colorsOnHover[1]; //"#e65158";
            } else if (total <= vm._quantiles[3]) {
              return vm._config.map.quantiles.colorsOnHover[2]; //"#c20216";
            } else if (total <= vm._quantiles[4]) {
              return vm._config.map.quantiles.colorsOnHover[3]; //"#750000";
            } else if (total <= vm._quantiles[5]) {
              return vm._config.map.quantiles.colorsOnHover[4]; //"#480000";
            }
          }
        }
      }

      if (vm._quantiles.length == 2) {
        /*if(total === 0 ){
          return d4theme.colors.quantiles[0];//return '#fff';
        }else if(total <= vm._quantiles[1]){
          return d4theme.colors.quantiles[1];//return "#f7c7c5";
        }*/
        if (total <= vm._quantiles[1]) {
          return vm._config.map.quantiles.colors[0]; //"#f7c7c5";
        }
      }
    };

    return new Map(config);
  }

  /*
   * Build a radar chart.
   */
  function radar(config) {
    function Radar(config) {
      var vm = this,
        size;

      vm.CIRCLE_RADIANS = 2 * Math.PI;

      // The first axis must be at the circle's top.
      vm.RADIANS_TO_ROTATE = vm.CIRCLE_RADIANS / -4;

      vm._config = config ? config : {};
      vm._data = [];
      vm._scales = {};
      vm._axes = {};
      vm._axesData = {};
      vm._filter = null;
      vm._minMax = [0, 0];
      vm._viewData = [];
      vm._colorMap = {};
      vm._ticks = 0;
      vm._scale = null;
      vm._excludedPolygons = [];

      // Set defaults.
      if (!vm._config.ticks) {
        vm._config.ticks = 10;
      }

      if (!vm._config.transitionDuration) {
        vm._config.transitionDuration = 400;
      }

      if (!vm._config.axisLabelMargin) {
        vm._config.axisLabelMargin = 24;
      }

      if (!vm._config.legend) {
        vm._config.legend = {
          enable: true,
        };
      }

      if (!vm._config.legend.at) {
        vm._config.legend.at = {
          x: 20,
          y: 20,
        };
      }

      if ('undefined' == typeof vm._config.styleDefaults) {
        vm._config.styleDefaults = true;
      }

      // Calculate basic data.
      size = vm._config.size;

      vm._center = {
        x: size.width / 2 - size.margin.left,
        y: size.height / 2 - size.margin.top,
      };

      vm._radius = Math.min(
        (size.width - size.margin.left - size.margin.right) / 2,
        (size.height - size.margin.top - size.margin.bottom) / 2
      );
    }

    // User API.

    Radar.prototype.polygonsFrom = function (column) {
      var vm = this;
      vm._config.polygonsFrom = column;
      return vm;
    };

    Radar.prototype.axesFrom = function (column) {
      var vm = this;
      vm._config.axesFrom = column;
      return vm;
    };

    Radar.prototype.valuesFrom = function (column) {
      var vm = this;
      vm._config.valuesFrom = column;
      return vm;
    };

    Radar.prototype.ticks = function (ticks) {
      var vm = this;
      vm._config.ticks = ticks;
      return vm;
    };

    Radar.prototype.colors = function (colors) {
      var vm = this;
      vm._config.colors = colors;
      return vm;
    };

    Radar.prototype.end = function () {
      var vm = this;
      return vm._chart;
    };

    // Internal helpers.

    Radar.prototype.drawTicks = function () {
      var vm = this,
        svg = vm._chart._svg,
        dur = vm._config.transitionDuration,
        sel;

      sel = svg.select('g.ticks');

      if (sel.empty()) {
        sel = svg.append('g').attr('class', 'ticks');
      }

      sel = sel.selectAll('circle.tick').data(
        // Add an explicit index for keying the chart with their original array
        // indexes, then reverse it so rendering occurs from bigger to smaller
        // circles, allowing to set a fill color to the concentric cirlces
        // without getting the more external cirlce capping all the others.
        vm._ticks
          .map(function (val, idx) {
            return [idx, val];
          })
          .reverse(),
        function (d) {
          return d[0];
        }
      );

      sel
        .transition()
        .duration(dur)
        .attr('r', function (d) {
          return vm._scale(d[1]);
        });

      sel
        .enter()
        .append('circle')
        .classed('tick', true)
        .attr('cx', vm._center.x)
        .attr('cy', vm._center.y)
        .style('fill', vm._ifStyleDefaults('none'))
        .style('stroke', vm._ifStyleDefaults('gray'))
        .attr('r', function (d) {
          return vm._scale(d[1]);
        })
        .attr('opacity', 0)
        .transition()
        .duration(dur)
        .attr('opacity', 1);

      sel.exit().transition().duration(dur).attr('opacity', 0).remove();
    };

    Radar.prototype.drawTicksLabels = function () {
      var vm = this,
        svg = vm._chart._svg,
        margin = 2,
        dur = vm._config.transitionDuration,
        sel;

      sel = svg.select('g.ticks-labels');

      if (sel.empty()) {
        sel = svg.append('g').attr('class', 'ticks-labels');
      }

      sel = sel.selectAll('text.tick-label').data(vm._ticks);

      sel
        .transition()
        .duration(dur)
        .text(function (d) {
          return d;
        })
        .attr('y', function (d) {
          return vm._center.y - margin - vm._scale(d);
        });

      sel
        .enter()
        .append('text')
        .text(function (d) {
          return d.toFixed(1);
        })
        .attr('class', 'tick-label')
        .attr('x', vm._center.x + margin)
        .attr('y', function (d) {
          return vm._center.y - margin - vm._scale(d);
        })
        .attr('fill', vm._ifStyleDefaults('gray'))
        .style('font-family', vm._ifStyleDefaults('sans-serif'))
        .attr('opacity', 0)
        .transition()
        .duration(dur)
        .attr('opacity', 1);

      sel.exit().transition().duration(dur).attr('opacity', 0).remove();
    };

    Radar.prototype.extractAxes = function (data) {
      var result,
        vm = this,
        axes = vm._config.axesFrom,
        radiansPerAxis;

      result = data.reduce(function (prev, item) {
        return prev.indexOf(item[axes]) > -1 ? prev : prev.concat(item[axes]);
      }, []);

      radiansPerAxis = vm.CIRCLE_RADIANS / result.length;

      result = result.map(function (item, idx) {
        return {
          axis: item,
          rads: idx * radiansPerAxis + vm.RADIANS_TO_ROTATE,
        };
      });

      return {
        list: result,
        hash: result.reduce(function (hashed, el) {
          hashed[el.axis] = el;
          return hashed;
        }, {}),
      };
    };

    Radar.prototype.buildColorMap = function (data) {
      var vm = this,
        colors = vm._config.colors;
      return data.reduce(
        function (cMap, row) {
          var polyg = row[vm._config.polygonsFrom],
            cIdx = cMap.index.indexOf(polyg);

          if (cIdx == -1) {
            cIdx = cMap.index.push(polyg) - 1;
            cMap.hash[polyg] = colors[cIdx];
            cMap.list.push({ polygon: polyg, color: colors[cIdx] });
          }
          return cMap;
        },
        { index: [], hash: {}, list: [] }
      );
    };

    Radar.prototype.drawAxes = function () {
      var vm = this,
        svg = vm._chart._svg,
        duration = vm._config.transitionDuration,
        selection;

      selection = svg
        .selectAll('line.axis')
        .data(vm._axesData.list, function (d) {
          return d.axis;
        });

      selection
        .enter()
        .append('line')
        .classed('axis', true)
        .attr('x1', vm._center.x)
        .attr('y1', vm._center.y)
        .style('stroke', vm._ifStyleDefaults('gray'))
        .attr('x2', vm._center.x)
        .attr('y2', vm._center.y)
        .transition()
        .duration(duration)
        .attr('x2', function (d) {
          return vm.xOf(d.rads, vm._radius + 8);
        })
        .attr('y2', function (d) {
          return vm.yOf(d.rads, vm._radius + 8);
        });

      selection
        .transition()
        .duration(duration)
        .attr('x2', function (d) {
          return vm.xOf(d.rads, vm._radius + 8);
        })
        .attr('y2', function (d) {
          return vm.yOf(d.rads, vm._radius + 8);
        });

      selection
        .exit()
        .transition()
        .duration(duration)
        .attr('x2', vm._center.x)
        .attr('y2', vm._center.y)
        .remove();
    };

    Radar.prototype.drawAxesLabels = function () {
      var vm = this,
        svg = vm._chart._svg,
        duration = vm._config.transitionDuration,
        fromCenter = vm._radius + vm._config.axisLabelMargin,
        labels,
        rects;

      rects = svg
        .selectAll('rect.axis-label')
        .data(vm._axesData.list, function (d) {
          return d.axis;
        });

      rects
        .enter()
        .append('rect')
        .attr('class', 'axis-label')
        .attr('x', function (d) {
          return vm.xOf(d.rads, fromCenter) - 50;
        })
        .attr('y', function (d) {
          return vm.yOf(d.rads, fromCenter) - 20;
        })
        .attr('rx', '5px')
        .attr('ry', '5px')
        .attr('width', '100px')
        .attr('height', '40px')
        .attr('fill', '#A3A3AF')
        .attr('opacity', 0)
        .transition()
        .duration(duration)
        .attr('opacity', 1);

      rects.exit().transition().duration(duration).attr('opacity', 0).remove();

      labels = svg
        .selectAll('text.axis-label')
        .data(vm._axesData.list, function (d) {
          return d.axis;
        });

      labels
        .transition()
        .duration(duration)
        .attr('x', function (d) {
          return vm.xOf(d.rads, fromCenter + 5);
        })
        .attr('y', function (d) {
          return vm.yOf(d.rads, fromCenter + 5);
        });

      labels
        .enter()
        .append('text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('fill', 'white') //vm._ifStyleDefaults('gray'))
        .style('font-family', vm._ifStyleDefaults('sans-serif'))
        .text(function (d) {
          return d.axis;
        })
        .attr('x', function (d) {
          return vm.xOf(d.rads, fromCenter + 5);
        })
        .attr('y', function (d) {
          return vm.yOf(d.rads, fromCenter + 5);
        })
        .attr('opacity', 0)
        .transition()
        .duration(duration)
        .attr('opacity', 1);

      labels.exit().transition().duration(duration).attr('opacity', 0).remove();
    };

    Radar.prototype.drawPolygons = function () {
      var vm = this,
        data = vm._viewData,
        svg = vm._chart._svg,
        duration = vm._config.transitionDuration,
        groupedData,
        gs,
        gsExit,
        gsEnter;

      // Prepare the data.
      groupedData = data.reduce(
        function (bundle, row) {
          var polygIdx = bundle.keys.indexOf(row.polygon);
          if (polygIdx == -1) {
            polygIdx = bundle.keys.push(row.polygon) - 1;
            bundle.polygons.push({
              polygon: row.polygon,
              color: row.color,
              points: [],
              values: [],
              rawData: row.rawData,
            });
          }
          bundle.polygons[polygIdx].values.push(row);
          bundle.polygons[polygIdx].points.push(row.xy.join(','));
          return bundle;
        },
        { keys: [], polygons: [] }
      ).polygons;

      gs = svg.selectAll('g.polygon-container').data(groupedData, function (d) {
        return d.polygon + '-container';
      });

      gsEnter = gs
        .enter()
        .append('g')
        .attr('class', 'polygon-container')
        .attr('id', function (d) {
          return 'radar-id-' + d.rawData.CVE_ENT;
        });

      gsExit = gs.exit();
      gsExit.transition().duration(duration).remove();

      vm._buildNestedPolygons(gs, gsEnter, gsExit);
      vm._buildNestedVertexes(gs, gsEnter, gsExit);
    };

    Radar.prototype._buildNestedVertexes = function (update, enter, exit) {
      var vm = this,
        duration = vm._config.transitionDuration,
        selector = 'circle.vertex',
        toUpdate;

      function appendHelper(selection) {
        selection
          .append('circle')
          .attr('class', 'vertex')
          .attr('cx', vm._center.x)
          .attr('cy', vm._center.y)
          .attr('r', 4)
          .attr('fill', function (d) {
            return d.color;
          })
          .call(updateHelper)
          .on('mouseover', function (d) {
            var x = d.xy[0] + 10,
              y = d.xy[1] - 10;
            vm._showTooltip(x, y, d.polygon, d.value);
          })
          .on('mouseout', function () {
            vm._hideTooltip();
          });
      }

      function removeHelper(selection) {
        selection
          .transition()
          .duration(duration)
          .attr('cx', vm._center.x)
          .attr('cy', vm._center.y)
          .remove();
      }

      function updateHelper(selection) {
        selection
          .transition()
          .duration(duration)
          .attr('cx', function (d) {
            return d.xy[0];
          })
          .attr('cy', function (d) {
            return d.xy[1];
          });
      }

      function dataFunc(d) {
        return d.values;
      }

      function keyFunc(d) {
        return d.polygon + '-' + d.axis;
      }

      toUpdate = update.selectAll(selector).data(dataFunc, keyFunc);

      toUpdate.call(updateHelper);

      toUpdate.enter().call(appendHelper);

      toUpdate.exit().call(removeHelper);

      enter
        .selectAll(selector)
        .data(dataFunc, keyFunc)
        .enter()
        .call(appendHelper);

      exit.selectAll(selector).call(removeHelper);
    };

    /**
     * Draw a tooltip at the given X, Y possition.
     * @param  {int} x       The X coordinate
     * @param  {int} y       The Y coordinate
     * @param  {string} val1 The value to show as the first line
     * @param  {string} val2 The value to show in the second line
     * @return {selection}   Return the created tooltip as a D3 selection
     */
    Radar.prototype._showTooltip = function (x, y, val1, val2) {
      var tt,
        subtt,
        bg,
        bbox,
        padding = 2,
        vm = this,
        svg = vm._chart._svg;

      tt = svg.append('g').attr('class', 'tooltip').attr('opacity', 0);

      bg = tt.append('rect').attr('class', 'tooltip-background');

      subtt = tt
        .append('text')
        .attr('y', y)
        .attr('x', x)
        .style('fill', vm._ifStyleDefaults('white'))
        .style('font-family', vm._ifStyleDefaults('sans-serif'));

      subtt.append('tspan').text(Number(val2).toFixed(1));

      subtt.append('tspan').attr('dy', '-1.2em').attr('x', x).text(val1);

      bbox = tt.node().getBBox();

      bg.attr('x', bbox.x - padding)
        .attr('y', bbox.y - padding)
        .attr('width', bbox.width + padding * 2)
        .attr('height', bbox.height + (padding + 2))
        .style('fill', vm._ifStyleDefaults('gray'));

      tt.transition().duration(200).attr('opacity', 0.9);

      return tt;
    };

    /**
     * Remove the tooltip created by _showTooltip()
     * @return {undefined}
     */
    Radar.prototype._hideTooltip = function () {
      this._chart._svg
        .selectAll('g.tooltip')
        .transition()
        .duration(200)
        .attr('opacity', 0)
        .remove();
    };

    Radar.prototype._buildNestedPolygons = function (update, enter, exit) {
      var vm = this,
        duration = vm._config.transitionDuration,
        selector = 'polygon.category',
        toUpdate;

      // Used for the transitions where the polygons expand from
      // or shrink to the center.
      function centerPoints(data) {
        var center = [vm._center.x, vm._center.y].join(',');
        return data.points
          .map(function () {
            // All polygon's points move to the center.
            return center;
          })
          .join(' ');
      }

      function appendHelper(selection) {
        selection
          .append('polygon')
          .attr('class', 'category')
          .attr('points', centerPoints)
          .style('stroke', function (d) {
            return d.color;
          })
          .style('fill', function (d) {
            return d.color;
          })
          .style('fill-opacity', 0.4)
          .style('stroke-width', vm._ifStyleDefaults('1px'))
          .call(updateHelper);
      }

      function removeHelper(selection) {
        selection
          .transition()
          .duration(duration)
          .attr('points', centerPoints)
          .remove();
      }

      function updateHelper(selection) {
        selection
          .transition()
          .duration(duration)
          .attr('points', function (d) {
            return d.points.join(' ');
          });
      }

      function dataFunc(d) {
        return [d];
      }

      function keyFunc(d) {
        return d.polygon;
      }

      toUpdate = update.selectAll(selector).data(dataFunc, keyFunc);

      toUpdate.call(updateHelper);

      toUpdate.enter().call(appendHelper);

      toUpdate.exit().call(removeHelper);

      enter
        .selectAll(selector)
        .data(dataFunc, keyFunc)
        .enter()
        .call(appendHelper);

      exit.selectAll(selector).call(removeHelper);
    };

    Radar.prototype.drawLegend = function () {
      var vm = this,
        cMap = vm._colorMap.list,
        svg = vm._chart._svg,
        at = vm._config.legend.at,
        side = 14,
        margin = 4,
        legend,
        newLegend;

      legend = svg
        .selectAll('g.legend-item')
        .data(cMap, function (d) {
          return d.polygon;
        })
        .attr('opacity', function (d) {
          return vm._excludedPolygons.indexOf(d.polygon) > -1 ? 0.4 : 1;
        });

      newLegend = legend
        .enter()
        .append('g')
        .on('click', function (d) {
          vm._excludedPolygons = vm._toggleList(vm._excludedPolygons, [
            d.polygon,
          ]);
          vm.draw();
        })
        .attr('class', 'legend-item');

      newLegend
        .append('text')
        .text(function (d) {
          return d.polygon;
        })
        .attr('x', at.x + side + margin)
        .attr('y', function (d, i) {
          return (side + margin) * i + at.y + side;
        })
        .style('font-family', vm._ifStyleDefaults('sans-serif'));

      newLegend
        .append('rect')
        .attr('fill', function (d) {
          return d.color;
        })
        .attr('width', side)
        .attr('height', side)
        .attr('x', at.x)
        .attr('y', function (d, i) {
          return (side + margin) * i + at.y;
        });
    };

    /**
     * Return value if config styleDefaults is true, else null.
     * @param  {string} value The value to use as default
     * @return {string}       The value itself or null
     */
    Radar.prototype._ifStyleDefaults = function (value) {
      return this._config.styleDefaults ? value : null;
    };

    /**
     * Append items not present in base from items and pop those which are.
     * @param  {array} base   Array to append to remove from.
     * @param  {array} items  Items to be toogled (appended or removed).
     * @return {array}        A new array.
     */
    Radar.prototype._toggleList = function (base, items) {
      var newItems = items.filter(function (it) {
        return base.indexOf(it) == -1;
      });
      return base
        .filter(function (it) {
          return items.indexOf(it) == -1;
        })
        .concat(newItems);
    };

    Radar.prototype.xOf = function (rads, value) {
      var vm = this;
      return vm._center.x + value * Math.cos(rads);
    };

    Radar.prototype.yOf = function (rads, value) {
      var vm = this;
      return vm._center.y + value * Math.sin(rads);
    };

    Radar.prototype.minMax = function (data) {
      var vm = this;
      return data.reduce(function (minMax, row) {
        var val = parseInt(row[vm._config.valuesFrom]);
        if (minMax.length == 0) {
          return [val, val];
        }
        return [
          val < minMax[0] ? val : minMax[0],
          val > minMax[1] ? val : minMax[1],
        ];
      }, []);
    };

    // Build the data with coords.
    Radar.prototype.dataForVisualization = function (data) {
      var vm = this,
        scale = vm._scale,
        axisKey = vm._config.axesFrom,
        valKey = vm._config.valuesFrom,
        polygKey = vm._config.polygonsFrom,
        axesHash = vm._axesData.hash;

      return data.map(function (row) {
        var axis = row[axisKey],
          rads = axesHash[axis].rads,
          polygon = row[polygKey],
          val = row[valKey],
          scVal = scale(val);
        return {
          xy: [vm.xOf(rads, scVal), vm.yOf(rads, scVal)],
          value: val,
          polygon: polygon,
          axis: axis,
          color: vm._colorMap.hash[polygon],
          rawData: row,
        };
      });
    };

    Radar.prototype.filter = function (fun) {
      var vm = this;
      vm._filter = fun;
      return vm;
    };

    // DBOX internals.

    Radar.prototype.chart = function (chart) {
      var vm = this;
      vm._chart = chart;
      return vm;
    };

    Radar.prototype.data = function (data) {
      var vm = this;
      //In case we want to filter observations
      if (vm._config.data.filter) {
        data = data.filter(vm._config.data.filter);
      }

      vm._data = data;
      return vm;
    };

    Radar.prototype.scales = function (scales) {
      var vm = this;
      vm._scales = scales;
      // We only need one scale.
      vm._scale = vm._scales.x;
      vm._scale.range([0, vm._radius]);
      return vm;
    };

    Radar.prototype.axes = function (axes) {
      var vm = this;
      // TODO Do nothing?
      return vm;
    };

    Radar.prototype.domains = function () {
      var vm = this;
      vm._calcDomains(vm._data);
      return vm;
    };

    Radar.prototype._calcDomains = function (data) {
      var vm = this;
      vm._minMax = vm.minMax(data);
      vm._scale.domain(
        vm._config.scales &&
          vm._config.scales.x &&
          vm._config.scales.x.domain &&
          Array.isArray(vm._config.scales.x.domain)
          ? vm._config.scales.x.domain
          : [0, vm._minMax[1]]
      );

      vm._ticks = vm._scale.ticks(vm._config.ticks);
      // Exclude 0 from ticks if it is the first element.
      // We don't need to have the 0 actually rendered.
      if (vm._ticks.length > 0 && vm._ticks[0] === 0) {
        vm._ticks = vm._ticks.slice(1);
      }
    };

    Radar.prototype.draw = function () {
      var vm = this,
        data = vm._data;

      // Build the color map previusly to filtering in order to keep the
      // association between colors and polygons even when some of them (the
      // polygons) have been filtered out.
      vm._colorMap = vm.buildColorMap(data);

      // Apply the filter function, if it's present.
      if (typeof vm._filter === 'function') {
        data = data.filter(vm._filter);
      }

      // Filter out excluded polygons from.
      if (vm._excludedPolygons.length > 0) {
        data = data.filter(function (it) {
          return (
            vm._excludedPolygons.indexOf(it[vm._config.polygonsFrom]) == -1
          );
        });
      }

      vm._calcDomains(data);
      vm._axesData = vm.extractAxes(data);
      vm._viewData = vm.dataForVisualization(data);

      vm.drawTicks();
      vm.drawAxes();
      vm.drawAxesLabels();
      vm.drawTicksLabels();
      vm.drawPolygons();
      vm.drawLegend();
    };

    return new Radar(config);
  }

  /*
   * Simple Scatter chart
   */

  function scatter(config, helper) {
    var Scatter = Object.create(helper);

    Scatter.init = function (config) {
      var vm = this;
      vm._config = config ? config : {};
      vm._data = [];
      vm._scales = {};
      vm._axes = {};

      var defaultTip = function defaultTip(d) {
        var html;
        if (vm.chart.config.styles) {
          html =
            "<div style='\n        line-height: 1; \n        opacity: " +
            vm.chart.style.tooltip.opacity +
            '; \n        font-weight: ' +
            vm.chart.style.tooltip.text.fontWeight +
            '; \n        font-size: ' +
            vm.chart.style.tooltip.text.fontSize +
            '; \n        color: ' +
            vm.chart.style.tooltip.text.textColor +
            ';\n        font-family: ' +
            vm.chart.style.tooltip.text.fontFamily +
            ';\n        background-color: ' +
            vm.chart.style.tooltip.backgroundColor +
            '; \n        padding: ' +
            vm.chart.style.tooltip.text.padding +
            ';   \n        border: ' +
            vm.chart.style.tooltip.border.width +
            ' solid ' +
            vm.chart.style.tooltip.border.color +
            ';  \n        border-radius:  ' +
            vm.chart.style.tooltip.border.radius +
            ";'>";
          html +=
            "<strong style='color:" +
            vm.chart.style.tooltip.text.fontColor +
            ";'>";
        } else {
          html = '<div> <strong>';
        }
        html += vm._config.idName
          ? d.datum[vm._config.idName]
            ? d.datum[vm._config.idName] + '<br>'
            : ''
          : '';
        html += d.x
          ? '<span>(' +
            (Number.isNaN(+d.x) || vm._config.xAxis.scale !== 'linear'
              ? d.x
              : vm.utils.format(vm._config.xAxis)(d.x)) +
            '</span>'
          : '(NA';
        html += d.y
          ? '<span>, &nbsp;' +
            (Number.isNaN(+d.y) || vm._config.yAxis.scale !== 'linear'
              ? d.y
              : vm.utils.format(vm._config.yAxis)(d.y)) +
            ')</span>'
          : ', NA)';
        html += ' </strong><br>';
        if (
          vm._config.magnitude &&
          d.magnitude !== d.x &&
          d.magnitude !== d.y
        ) {
          html += d.magnitude
            ? '<span>' +
              (Number.isNaN(+d.magnitude) ||
              (+d.magnitude >= 1993 && +d.magnitude <= 2019)
                ? d.magnitude
                : vm.utils.format()(d.magnitude)) +
              '</span>'
            : '';
        }
        if (d.color !== d.x && d.color !== d.y && d.color !== d.magnitude) {
          html += d.color
            ? '<span> ' +
              (Number.isNaN(+d.color) || (+d.color >= 1993 && +d.color <= 2019)
                ? d.color
                : vm.utils.format()(d.color)) +
              '</span>'
            : '';
        }
        html += '</div>';
        return html;
      };

      vm._tip = this.utils.d3
        .tip()
        .attr('class', 'd3-tip')
        .html(
          vm._config.tip && vm._config.tip.html
            ? vm._config.tip.html
            : defaultTip
        );
    };

    //-------------------------------
    //User config functions

    Scatter.id = function (col) {
      var vm = this;
      vm._config.id = col;
      return vm;
    };

    Scatter.idName = function (col) {
      var vm = this;
      vm._config.idName = col;
      return vm;
    };

    Scatter.x = function (col) {
      var vm = this;
      vm._config.x = col;
      return vm;
    };

    Scatter.y = function (col) {
      var vm = this;
      vm._config.y = col;
      return vm;
    };

    Scatter.radius = function (radius) {
      var vm = this;
      vm._config.radius = radius;
      return vm;
    };

    Scatter.magnitude = function (magnitude) {
      var vm = this;
      vm._config.magnitude = magnitude;
      return vm;
    };

    Scatter.radiusRange = function (radiusRange) {
      var vm = this;
      vm._config.radiusRange = radiusRange;
      return vm;
    };

    Scatter.magnitudeRange = function (magnitudeRange) {
      var vm = this;
      vm._config.magnitudeRange = magnitudeRange;
      return vm;
    };

    Scatter.properties = function (properties) {
      var vm = this;
      vm._config.properties = properties;
      return vm;
    };

    Scatter.figure = function (figureType) {
      var vm = this;
      vm._config.figureType = figureType;
      return vm;
    };

    Scatter.colors = function (colors) {
      var vm = this;
      if (Array.isArray(colors)) {
        //Using an array of colors for the range
        vm._config.colors = colors;
      } else {
        //Using a preconfigured d3.scale
        vm._scales.color = colors;
      }
      return vm;
    };

    Scatter.fill = function (col) {
      var vm = this;
      vm._config.fill = col;
      return vm;
    };

    Scatter.opacity = function (opacity) {
      var vm = this;
      vm._config.opacity = opacity;
      return vm;
    };

    Scatter.regression = function (regression) {
      var vm = this;
      vm._config.regression = regression;
      return vm;
    };

    Scatter.tip = function (tip) {
      var vm = this;
      vm._config.tip = tip;
      vm._tip.html(vm._config.tip);
      return vm;
    };

    Scatter.data = function (data) {
      var vm = this;
      var xr, yr, xMean, yMean, b1, b0, term1, term2;
      vm._data = [];

      data.forEach(function (d) {
        var m = {};
        m.datum = d;
        m.x =
          vm._config.xAxis.scale == 'linear'
            ? +d[vm._config.x]
            : d[vm._config.x];
        m.y =
          vm._config.yAxis.scale == 'linear'
            ? +d[vm._config.y]
            : d[vm._config.y];
        if (vm._config.xAxis.scale == 'linear' && Number.isNaN(m.x)) {
          m.x = 0;
        }
        if (vm._config.yAxis.scale == 'linear' && Number.isNaN(m.y)) {
          m.y = 0;
        }
        m.color =
          vm._config.fill.slice(0, 1) !== '#'
            ? d[vm._config.fill]
            : vm._config.fill;
        m.radius =
          vm._config.radius !== undefined
            ? isNaN(vm._config.radius)
              ? +d[vm._config.radius]
              : vm._config.radius
            : 7;

        //vm._config.magnitude = 'FACTOR_HOG'; For testing

        m.magnitude =
          vm._config.magnitude !== undefined
            ? isNaN(vm._config.magnitude)
              ? +d[vm._config.magnitude]
              : vm._config.magnitude
            : 7;

        if (
          vm._config.properties !== undefined &&
          Array.isArray(vm._config.properties) &&
          vm._config.properties.length > 0
        ) {
          vm._config.properties.forEach(function (p) {
            m[p] = d[p];
          });
        }

        vm._data.push(m);
      });

      if (
        vm._config.regression === true &&
        vm._config.yAxis.scale === 'linear' &&
        vm._config.xAxis.scale === 'linear'
      ) {
        xMean = d3.mean(
          data.map(function (d) {
            return !Number.isNaN(+d[vm._config.x]) ? +d[vm._config.x] : 0;
          })
        );
        yMean = d3.mean(
          data.map(function (d) {
            return !Number.isNaN(+d[vm._config.y]) ? +d[vm._config.y] : 0;
          })
        );
        xr = 0;
        yr = 0;
        term1 = 0;
        term2 = 0;

        vm._data.forEach(function (m) {
          xr = Number.isNaN(+m.x) ? -xMean : +m.x - xMean;
          yr = Number.isNaN(+m.y) ? -yMean : +m.y - yMean;
          term1 += xr * yr;
          term2 += xr * xr;
        });

        b1 = term1 / term2;
        b0 = yMean - b1 * xMean;

        vm._data.forEach(function (m) {
          m.yhat = b0 + Number(m.x) * b1;
        });
      }

      if (vm._config.yAxis.scale !== 'linear') {
        vm._data.sort(function (a, b) {
          return vm.utils.sortAscending(a.y, b.y);
        });
      }
      if (vm._config.xAxis.scale !== 'linear') {
        vm._data.sort(function (a, b) {
          return vm.utils.sortAscending(a.x, b.x);
        });
      }

      return vm;
    };

    Scatter.scales = function () {
      var vm = this;

      if (vm._config.hasOwnProperty('x') && vm._config.hasOwnProperty('y')) {
        config = {
          column: 'x',
          type: vm._config.xAxis.scale,
          range: [0, vm.chart.width],
          minZero: vm._config.xAxis.minZero ? vm._config.xAxis.minZero : false,
        };
        vm._scales.x = vm.utils.generateScale(vm._data, config);

        config = {
          column: 'y',
          type: vm._config.yAxis.scale,
          range: [vm.chart.height, 0],
          minZero: vm._config.yAxis.minZero ? vm._config.yAxis.minZero : false,
        };
        vm._scales.y = vm.utils.generateScale(vm._data, config);
      }

      if (vm._config.hasOwnProperty('colors')) {
        vm._scales.color = d3.scaleOrdinal(vm._config.colors);
      } else {
        vm._scales.color = d3.scaleOrdinal(d3.schemeCategory20c);
      }

      var radiusMinMax = d3.extent(vm._data, function (d) {
        return d.radius;
      });

      var magnitudeMinMax = d3.extent(vm._data, function (d) {
        return d.magnitude;
      });

      vm._scales.radius = d3
        .scaleLinear()
        .range(
          vm._config.radiusRange != undefined ? vm._config.radiusRange : [7, 20]
        )
        .domain(radiusMinMax)
        .nice();

      vm._scales.magnitude = d3
        .scaleLinear()
        .range(
          vm._config.magnitudeRange != undefined
            ? vm._config.magnitudeRange
            : [7, 20]
        )
        .domain(magnitudeMinMax)
        .nice();

      if (
        vm._config.xAxis.scaleDomain &&
        Array.isArray(vm._config.xAxis.scaleDomain)
      ) {
        vm._scales.x.domain(vm._config.xAxis.scaleDomain);
      }
      if (
        vm._config.yAxis.scaleDomain &&
        Array.isArray(vm._config.yAxis.scaleDomain)
      ) {
        vm._scales.y.domain(vm._config.yAxis.scaleDomain);
      }
      return vm;
    };

    Scatter.drawLabels = function () {
      var vm = this;
      var yCoords = [];
      var xCoords = [];
      var repeat = [];

      vm.chart
        .svg()
        .selectAll('.dbox-label')
        .data(vm._data)
        .enter()
        .append('text')
        .attr('class', 'dbox-label')
        .attr('transform', function (d, index) {
          var xCoord;
          if (
            vm._config.xAxis.scale == 'ordinal' ||
            vm._config.xAxis.scale == 'band'
          ) {
            xCoord =
              vm._scales.x(d.x) +
              vm._scales.x.bandwidth() / 2 -
              vm._scales.magnitude(d.magnitude) / 2;
          } else {
            xCoord = vm._scales.x(d.x);
          }
          xCoords.push(d.datum[vm._config.x]);

          var yCoord;
          var space = 15;
          if (
            vm._config.yAxis.scale == 'ordinal' ||
            vm._config.yAxis.scale == 'band'
          ) {
            yCoord =
              vm._scales.y(d.y) +
              vm._scales.y.bandwidth() / 2 -
              vm._scales.magnitude(d.magnitude) / 2;
            if (yCoords.indexOf(Math.ceil(yCoord)) !== -1) {
              repeat.push(Math.ceil(yCoord));
              var current = null;
              var cnt = 0;
              for (var i = 0; i < repeat.length; i++) {
                if (repeat[i] != current) {
                  current = repeat[i];
                  cnt = 1;
                } else {
                  cnt++;
                }

                space = space * cnt;
              }
              yCoord = yCoord + space;
            }
          } else {
            yCoord = vm._scales.y(d.y);
            if (yCoords.indexOf(Math.ceil(yCoord)) !== -1) {
              repeat.push(Math.ceil(yCoord));
              var _current = null;
              var _cnt = 0;
              for (var _i = 0; _i < repeat.length; _i++) {
                if (repeat[_i] != _current) {
                  _current = repeat[_i];
                  _cnt = 1;
                } else {
                  _cnt++;
                }

                space = space * _cnt;
              }
              yCoord = yCoord + space;
            }
          }
          yCoords.push(Math.ceil(yCoord));

          if (xCoords[index - 1] !== d.datum[vm._config.x]) {
            yCoords = [];
            repeat = [];
          }

          return 'translate(' + (xCoord + 10) + ',' + (yCoord - 20) + ')';
        })
        .text(function (d) {
          var allText = '';
          allText += d.color ? d.color : '';
          allText += ' ';
          allText += d.datum[vm._config.magnitude]
            ? vm.utils.format(null, true)(d.datum[vm._config.magnitude])
            : '';
          return allText;
        });
    };

    Scatter.draw = function () {
      var vm = this;
      // Call the tip
      vm.chart.svg().call(vm._tip);

      // Squares
      if (vm._config.figureType === 'square') {
        vm.chart
          .svg()
          .selectAll('square')
          .data(vm._data)
          .enter()
          .append('rect')
          .attr('class', 'square')
          .attr('class', function (d, i) {
            //Backward compability with d.properties
            var id =
              d.properties !== undefined && d.properties.id !== undefined
                ? d.properties.id
                : false;
            id = vm._config.id ? vm._config.id : false;
            return id ? 'scatter-' + d.datum[id] : 'scatter-' + i;
          })
          .attr('width', function (d) {
            return vm._scales.magnitude(d.magnitude);
          })
          .attr('height', function (d) {
            return vm._scales.magnitude(d.magnitude);
          })
          .attr('x', function (d) {
            if (
              vm._config.xAxis.scale == 'ordinal' ||
              vm._config.xAxis.scale == 'band'
            ) {
              return (
                vm._scales.x(d.x) +
                vm._scales.x.bandwidth() / 2 -
                vm._scales.magnitude(d.magnitude) / 2
              );
            } else {
              return vm._scales.x(d.x);
            }
          })
          .attr('y', function (d) {
            if (
              vm._config.yAxis.scale == 'ordinal' ||
              vm._config.yAxis.scale == 'band'
            ) {
              return (
                vm._scales.y(d.y) +
                vm._scales.y.bandwidth() / 2 -
                vm._scales.magnitude(d.magnitude) / 2
              );
            } else {
              return vm._scales.y(d.y);
            }
          })
          .style('fill', function (d) {
            return String(d.color).slice(0, 1) !== '#'
              ? vm._scales.color(d.color)
              : d.color;
          })
          .style(
            'opacity',
            vm._config.opacity !== undefined ? vm._config.opacity : 1
          )
          .on('mouseover', function (d, i) {
            if (vm._config.events.mouseover) {
              vm._config.events.mouseover.call(vm, d, i);
            }
            vm._tip.show(d, d3.select(this).node());
          })
          .on('mouseout', function (d, i) {
            if (vm._config.events.mouseout) {
              vm._config.events.mouseout.call(this, d, i);
            }
            vm._tip.hide(d, d3.select(this).node());
          })
          .on('click', function (d, i) {
            if (vm._config.events.onClickElement) {
              vm._config.events.onClickElement.call(this, d, i);
            }
          });
      }
      // Circles
      else {
        vm.chart
          .svg()
          .selectAll('.dot')
          .data(vm._data)
          //.data(vm._data, function(d){ return d.key})
          .enter()
          .append('circle')
          .attr('class', 'dot')
          .attr('class', function (d, i) {
            //Backward compability with d.properties
            var id =
              d.properties !== undefined && d.properties.id !== undefined
                ? d.properties.id
                : false;
            id = vm._config.id ? vm._config.id : false;
            return id ? 'scatter-' + d.datum[id] : 'scatter-' + i;
          })
          .attr('r', function (d) {
            return vm._scales.radius(d.radius);
          })
          .attr('cx', function (d) {
            if (
              vm._config.xAxis.scale == 'ordinal' ||
              vm._config.xAxis.scale == 'band'
            )
              return vm._scales.x(d.x) + vm._scales.x.bandwidth() / 2;
            else return vm._scales.x(d.x);

            /*  if(vm._config.xAxis.scale == 'ordinal' || vm._config.xAxis.scale == 'band')
              return vm._scales.x(d.x) + (Math.random() * (vm._scales.x.bandwidth() - (d.size * 2)));
            else 
              return vm._scales.x(d.x); */
          })
          .attr('cy', function (d) {
            if (
              vm._config.yAxis.scale == 'ordinal' ||
              vm._config.yAxis.scale == 'band'
            )
              return vm._scales.y(d.y) + vm._scales.y.bandwidth() / 2;
            else return vm._scales.y(d.y);

            /* if(vm._config.yAxis.scale == 'ordinal' || vm._config.yAxis.scale == 'band')
              return vm._scales.y(d.y) + (Math.random() * (vm._scales.y.bandwidth() - (d.size * 2)));
            else 
              return vm._scales.y(d.y); */
          })
          .style('fill', function (d) {
            return String(d.color).slice(0, 1) !== '#'
              ? vm._scales.color(d.color)
              : d.color;
          })
          .style(
            'opacity',
            vm._config.opacity !== undefined ? vm._config.opacity : 1
          )
          .on('mouseover', function (d, i) {
            if (vm._config.events.mouseover) {
              vm._config.events.mouseover.call(vm, d, i);
            }
            vm._tip.show(d, d3.select(this).node());
          })
          .on('mouseout', function (d, i) {
            if (vm._config.events.mouseout) {
              vm._config.events.mouseout.call(this, d, i);
            }
            vm._tip.hide(d, d3.select(this).node());
          })
          .on('click', function (d, i) {
            if (vm._config.events.onClickElement) {
              vm._config.events.onClickElement.call(this, d, i);
            }
          });
      }

      if (vm._config.regression === true) {
        var line = d3
          .line()
          .x(function (d) {
            return vm._scales.x(d.x);
          })
          .y(function (d) {
            return vm._scales.y(d.yhat);
          });

        vm.chart
          .svg()
          .append('path')
          .datum(vm._data)
          .attr('class', 'line')
          .attr('d', line)
          .style('stroke', 'rgb(251, 196, 58)');
      }

      Scatter.drawLabels();

      return vm;
    };

    Scatter.select = function (id) {
      var vm = this;
      return vm.chart.svg().select('circle.scatter-' + id);
    };

    Scatter.selectAll = function () {
      var vm = this;
      return vm.chart.svg().selectAll('circle');
    };

    Scatter.init(config);
    return Scatter;
  }

  /*
   * Simple Spineplot
   */
  function spineplot(config, helper) {
    //Link Spineplot to the helper object in helper.js
    var Spineplot = Object.create(helper);

    Spineplot.init = function (config) {
      var vm = this;

      vm._config = config ? config : {};
      vm._config.orientation = 'horizontal';
      vm._data = [];
      vm._scales = {};
      vm._tip = vm.utils.d3
        .tip()
        .attr(
          'class',
          'd3-tip ' +
            (vm._config.tooltip && vm._config.tooltip.classed
              ? vm._config.tooltip.classed
              : '')
        )
        .direction('n')
        .html(
          vm._config.tip ||
            function (d) {
              var html = '<div>';
              html += '<span>' + d[vm._config.category] + '</span>';
              html +=
                '</br><span>' +
                vm.utils.format()(d[vm._config.value]) +
                '</span>';
              html += '</div>';
              return html;
            }
        );
    };

    //-------------------------------
    //User config functions
    Spineplot.id = function (columnName) {
      var vm = this;
      vm._config.id = columnName;
      return vm;
    };

    Spineplot.category = function (columnName) {
      var vm = this;
      vm._config.category = columnName;
      return vm;
    };

    Spineplot.value = function (columnName) {
      var vm = this;
      vm._config.value = columnName;
      return vm;
    };

    Spineplot.orientation = function (orientation) {
      var vm = this;
      vm._config.orientation = orientation;
      return vm;
    };

    /**
     * Used to draw a bar chart stacked with multiple bars per group
     * @param {array} columns
     */
    Spineplot.stackBy = function (columnName) {
      var vm = this;
      vm._config.stackBy = columnName;
      return vm;
    };

    /**
     * column name used for the domain values
     * @param {string} columnName
     */
    Spineplot.fill = function (columnName) {
      var vm = this;
      vm._config.fill = columnName;
      return vm;
    };

    /**
     * array of values used
     * @param {array or scale} columnName
     */
    Spineplot.colors = function (colors) {
      var vm = this;
      if (Array.isArray(colors)) {
        //Using an array of colors for the range
        vm._config.colors = colors;
      } else {
        //Using a preconfigured d3.scale
        vm._scales.color = colors;
      }
      return vm;
    };

    Spineplot.sortBy = function (option) {
      //option = string [asc,desc]
      //option = array for groupBy and stackBy
      var vm = this;
      vm._config.sortBy = option;
      return vm;
    };

    Spineplot.format = function (format) {
      var vm = this;
      if (typeof format == 'function' || format instanceof Function)
        vm.utils.format = format;
      else vm.utils.format = d3.format(format);
      return vm;
    };

    Spineplot.tip = function (tip) {
      var vm = this;
      vm._config.tip = tip;
      return vm;
    };

    Spineplot.legend = function (legend) {
      var vm = this;
      vm._config.legend = legend;
      return vm;
    };

    //-------------------------------
    //Triggered by the chart.js;
    Spineplot.data = function (data) {
      var vm = this;

      if (vm._config.filter) {
        // In case we want to filter observations
        data = data.filter(vm._config.filter);
      }
      //@TODO - ALLOW MULITPLE SORTS
      if (vm._config.sortBy) {
        if (vm._config.sortBy.category) {
          data = data.sort(function (a, b) {
            return vm._config.sortBy.category === 'desc'
              ? vm.utils.sortDescending(
                  a[vm._config.category],
                  b[vm._config.category]
                )
              : vm.utils.sortAscending(
                  a[vm._config.category],
                  b[vm._config.category]
                );
          });
        }
        if (vm._config.sortBy.value) {
          data = data.sort(function (a, b) {
            return vm._config.sortBy.value === 'desc'
              ? vm.utils.sortDescending(
                  a[vm._config.value],
                  b[vm._config.value]
                )
              : vm.utils.sortAscending(
                  a[vm._config.value],
                  b[vm._config.value]
                );
          });
        }
      } else {
        data = data.sort(function (a, b) {
          return vm.utils.sortAscending(
            a[vm._config.category],
            b[vm._config.category]
          );
        });
      }

      var total = 0;
      vm._data = data.map(function (d) {
        d.x0 = total;
        d.x1 = total + d[vm._config.value];
        total += +d[vm._config.value];
        if (
          vm._config.hasOwnProperty('stackBy') &&
          Array.isArray(vm._config.stackBy) &&
          vm._config.stackBy.length > 0
        ) {
          d.stackValues = d3.stack().keys(vm._config.stackBy)([d]);
          d.totalCollapse = d3.sum(d.stackValues, function (stack) {
            return stack[0][1] - stack[0][0];
          });
        }
        return d;
      });

      if (vm._config.hasOwnProperty('quantiles')) {
        vm._quantiles = vm._setQuantile(data);
        vm._minMax = d3.extent(data, function (d) {
          return +d[vm._config.fill];
        });
      }

      return vm;
    };

    Spineplot.scales = function () {
      var vm = this;
      var config;
      //vm._scales = s;
      /* Use
       * vm._config.category
       * vm._config.categoryAxis.scale
       * vm._config.value
       * vm._config.valueAxis.scale
       * vm._data
       */
      // Normal bars
      if (
        vm._config.hasOwnProperty('category') &&
        vm._config.hasOwnProperty('value')
      ) {
        config = {
          column: 'x1',
          type: 'linear',
          range: [0, vm.chart.width],
          minZero: true,
        };
        vm._scales.x = vm.utils.generateScale(vm._data, config);

        config = {
          column: vm._config.value,
          type: 'linear',
          range: [vm.chart.height, 0],
          minZero: true,
        };
        vm._scales.y = vm.utils.generateScale(vm._data, config);
      }

      //Stack bars on the xAxis
      if (
        vm._config.orientation === 'horizontal' &&
        vm._config.hasOwnProperty('stackBy')
      ) {
        /* Generate x scale */
        config = {
          column: 'x1',
          type: 'linear',
          range: [0, vm.chart.width],
          minZero: true,
        };
        vm._scales.x = vm.utils.generateScale(vm._data, config);

        /* Generate y scale */
        config = {
          column: '',
          type: 'linear',
          range: [vm.chart.height, 0],
          minZero: true,
        };
        vm._scales.y = d3.scaleLinear().range(config.range).domain([0, 1]);
      }

      //Stack bars on the yAxis
      if (
        vm._config.orientation === 'vertical' &&
        vm._config.hasOwnProperty('stackBy')
      ) {
        /* Generate x scale */
        config = {
          column: '',
          txpe: 'linear',
          range: [vm.chart.height, 0],
          minZero: true,
        };
        vm._scales.x = d3.scaleLinear().range(config.range).domain([0, 1]);

        /* Generate y scale */
        config = {
          column: vm._config.value,
          type: 'linear',
          range: [0, vm.chart.width],
          minZero: true,
        };
        vm._scales.y = vm.utils.generateScale(vm._data, config);
      }
      //vm.chart.scales.x = vm._scales.x;
      //vm.chart.scales.y = vm._scales.y;

      if (vm._config.hasOwnProperty('colors'))
        vm._scales.color = d3.scaleOrdinal(vm._config.colors);
      else vm._scales.color = d3.scaleOrdinal(d3.schemeCategory10);

      return vm;
    };

    Spineplot.drawLabels = function () {
      var vm = this;
      var groups = vm.chart.svg().selectAll('.division');
      groups.each(function (dat) {
        var el = this;
        dat.stackValues.forEach(function (sv) {
          var rectW = vm._scales.x(sv[0].data[vm._config.value]);
          var rectH =
            vm._scales.y(sv[0][0] / sv[0].data.totalCollapse) -
            vm._scales.y(sv[0][1] / sv[0].data.totalCollapse);
          if (rectH > 25 && rectW > 112) {
            d3.select(el)
              .append('text')
              .attr('class', 'dbox-label')
              .attr('text-anchor', 'middle')
              .attr('transform', function () {
                return (
                  'translate(' +
                  (vm._scales.x(sv[0].data.x0) + rectW / 2) +
                  ',' +
                  (sv[0][1]
                    ? vm._scales.y(sv[0][1] / sv[0].data.totalCollapse) + 20
                    : vm._scales.y(0) + 20) +
                  ')'
                );
              })
              .text(function () {
                return (
                  'X: ' +
                  vm.utils.format(vm._config.xAxis)(
                    sv[0].data[vm._config.value]
                  ) +
                  ', Y: ' +
                  vm.utils.format(vm._config.yAxis)(sv[0].data[sv.key])
                );
              });
          }
        });
      });
    };

    Spineplot.draw = function () {
      var vm = this;
      if (vm._config.hasOwnProperty('stackBy')) {
        if (vm._config.orientation === 'horizontal') vm._drawStackByXAxis();
        if (vm._config.orientation === 'vertical') vm._drawStackByYAxis();
        return vm;
      }

      vm.chart.svg().call(vm._tip);

      var axesTip = vm.utils.d3
        .tip()
        .attr('class', 'title-tip')
        .html(function (d) {
          return d[vm._config.category];
        });
      vm.chart.svg().call(axesTip);

      if (vm._config.orientation === 'horizontal') {
        /**
         * x axis tick labels
         */
        var posX = [];
        vm._xLabels = vm.chart
          .svg()
          .append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + (vm.chart.height + 20) + ')')
          .selectAll('.tick')
          .data(vm._data)
          .enter()
          .append('g')
          .attr('class', 'tick')
          .attr('transform', function (d) {
            var x = vm._scales.x(d.x0) + vm._scales.x(d.x1 - d.x0) / 2;
            posX.push(x);
            return 'translate(' + x + ', 8)';
          })
          .append('text')
          .attr('text-anchor', 'middle')
          .text(function (d) {
            return d[vm._config.category];
          });

        var labelMaxWidth = d3.min(vm._data, function (d) {
          return (vm._scales.x(d.x1) - vm._scales.x(d.x0)) * 0.9;
        });
        var largestLabelWidth = d3.max(vm._xLabels.nodes(), function (node) {
          return node.getComputedTextLength();
        });

        vm._xLabels.each(function (d, index, el) {
          var _this = this;

          //const currentWidth = this.getComputedTextLength();
          //let labelMaxWidth = (vm._scales.x(d.x1) - vm._scales.x(d.x0)) * 0.9;
          if (largestLabelWidth < labelMaxWidth * 2) {
            d3.select(this).call(vm.utils.wrap, labelMaxWidth, axesTip);
          } else {
            d3.select(this)
              .attr('text-anchor', 'end')
              .attr('dy', 0)
              .attr('transform', 'translate(3,-8)rotate(-90)');
            var newLabelMaxWidth = vm._config.size.margin.bottom * 0.9;
            if (this.getComputedTextLength() > newLabelMaxWidth) {
              (function () {
                d3.select(_this)
                  .on('mouseover', axesTip.show)
                  .on('mouseout', axesTip.hide);
                var i = 1;
                while (_this.getComputedTextLength() > newLabelMaxWidth) {
                  d3.select(_this)
                    .text(function (d) {
                      return (d[vm._config.category] + '').slice(0, -i) + '...';
                    })
                    .attr('title', d);
                  ++i;
                }
              })();
            }
          }

          var textSize = window
            .getComputedStyle(this, null)
            .getPropertyValue('font-size');
          var numSize = Number(textSize.replace(/\D/g, ''));

          if (index !== 0 && index !== vm._data.length - 1) {
            var diffPos1 = posX[index] - posX[index - 1];
            var diffPos2 = posX[index + 1] - posX[index];

            var lessThanPrev = d.value < vm._data[index - 1].value;
            var lessThanPost = d.value < vm._data[index + 1].value;

            if (diffPos1 < numSize - 2 || diffPos2 < numSize - 2) {
              if (lessThanPrev || lessThanPost) {
                d3.select(this).remove();
              }
            }
          }
        });

        vm.chart
          .svg()
          .selectAll('.bar')
          .data(vm._data)
          .enter()
          .append('rect')
          .attr('class', 'bar')
          .attr('id', function (d, i) {
            var id = 'spineplot-' + i;
            if (vm._config.id) {
              id = 'spineplot-' + d[vm._config.id];
            }
            return id;
          })
          .attr('x', function (d) {
            return vm._scales.x(d.x0);
          })
          .attr('y', 0)
          .attr('width', function (d) {
            return vm._scales.x(d[vm._config.value]);
          })
          .attr('height', vm.chart.height ? vm.chart.height : 100)
          .attr('fill', function (d) {
            return vm._scales.color !== false
              ? vm._scales.color(d[vm._config.fill])
              : vm._getQuantileColor(d[vm._config.fill], 'default');
          })
          .attr('stroke', 'white')
          .attr('stroke-width', 1)
          .style('opacity', 0.9)
          .on('mouseover', function (d, i) {
            if (
              vm._config.hasOwnProperty('quantiles') &&
              vm._config.quantiles.hasOwnProperty('colorsOnHover')
            ) {
              //OnHover colors
              d3.select(this).attr('fill', function (d) {
                return vm._getQuantileColor(d[vm._config.fill], 'onHover');
              });
            }
            vm._tip.show(d, d3.select(this).node());

            if (vm._config.hasOwnProperty('onmouseover')) {
              //External function call, must be after all the internal code; allowing the user to overide
              vm._config.onmouseover.call(this, d, i);
            }
          })
          .on('mouseout', function (d, i) {
            if (
              vm._config.hasOwnProperty('quantiles') &&
              vm._config.quantiles.hasOwnProperty('colorsOnHover')
            ) {
              //OnHover reset default color
              d3.select(this).attr('fill', function (d) {
                return vm._getQuantileColor(d[vm._config.fill], 'default');
              });
            }
            vm._tip.hide();

            if (vm._config.hasOwnProperty('onmouseout')) {
              //External function call, must be after all the internal code; allowing the user to overide
              vm._config.onmouseout.call(this, d, i);
            }
          })
          .on('click', function (d, i) {
            if (vm._config.hasOwnProperty('click')) {
              vm._config.onclick.call(this, d, i);
            }
          });
      }
      return vm;
    };

    //
    /**
     * Draw bars grouped by
     */
    Spineplot._drawStackByXAxis = function () {
      var vm = this;
      vm._tip.html(
        vm._config.tip ||
          function (d) {
            var cat = '';
            cat += '<span>' + d.key + '</span>';
            if (d.key !== d[0].data[vm._config.category]) {
              cat +=
                '<br><span>Y: ' +
                vm.utils.format(vm._config.yAxis)(d[0].data[d.key]) +
                '</span>';
              cat += '<br><span>' + d[0].data[vm._config.category] + '</span>';
              cat +=
                '<br><span>X: ' +
                vm.utils.format(vm._config.xAxis)(d[0].data[vm._config.value]) +
                '</span>';
            } else {
              cat +=
                '<br><span>' + vm.utils.format()(d[0].data[d.key]) + '</span>';
            }
            return cat;
          }
      );
      vm.chart.svg().call(vm._tip);

      var axesTip = vm.utils.d3
        .tip()
        .attr('class', 'title-tip')
        .html(function (d) {
          return d[vm._config.category];
        });
      vm.chart.svg().call(axesTip);

      /**
       * x axis labels
       */
      vm._xLabels = vm.chart
        .svg()
        .append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (vm.chart.height + 20) + ')')
        .selectAll('g')
        .data(vm._data)
        .enter()
        .append('g')
        .attr('class', 'tick')
        .attr('transform', function (d) {
          var x = vm._scales.x(d.x0) + vm._scales.x(d.x1 - d.x0) / 2;
          return 'translate(' + x + ', 0)';
        })
        .append('text')
        .attr('text-anchor', 'middle')
        .text(function (d) {
          return d[vm._config.category];
        });

      var labelMaxWidth = d3.min(vm._data, function (d) {
        return (vm._scales.x(d.x1) - vm._scales.x(d.x0)) * 0.9;
      });
      var largestLabelWidth = d3.max(vm._xLabels.nodes(), function (node) {
        return node.getComputedTextLength();
      });

      vm._xLabels.each(function (d) {
        var _this2 = this;

        //const currentWidth = this.getComputedTextLength();
        //let labelMaxWidth = (vm._scales.x(d.x1) - vm._scales.x(d.x0)) * 0.9;
        if (largestLabelWidth < labelMaxWidth * 2) {
          d3.select(this).call(vm.utils.wrap, labelMaxWidth, axesTip);
        } else {
          d3.select(this)
            .attr('text-anchor', 'end')
            .attr('dy', 0)
            .attr('transform', 'translate(3,-8)rotate(-90)');
          var newLabelMaxWidth = vm._config.size.margin.bottom * 0.9;
          if (this.getComputedTextLength() > newLabelMaxWidth) {
            (function () {
              d3.select(_this2)
                .on('mouseover', axesTip.show)
                .on('mouseout', axesTip.hide);
              var i = 1;
              while (_this2.getComputedTextLength() > newLabelMaxWidth) {
                d3.select(_this2)
                  .text(function (d) {
                    return (d[vm._config.category] + '').slice(0, -i) + '...';
                  })
                  .attr('title', d);
                ++i;
              }
            })();
          }
        }
      });

      var groups = vm.chart
        .svg()
        .append('g')
        .selectAll('g')
        .data(vm._data)
        .enter()
        .append('g')
        .attr('class', 'division');

      groups
        .selectAll('rect')
        .data(function (d) {
          return d.stackValues;
        })
        .enter()
        .append('rect')
        .attr('y', function (d) {
          return d[0][1]
            ? vm._scales.y(d[0][1] / d[0].data.totalCollapse)
            : vm._scales.y(0);
        })
        .attr('x', function (d) {
          return vm._scales.x(d[0].data.x0);
        })
        .attr('width', function (d) {
          return vm._scales.x(d[0].data[vm._config.value]);
        })
        .attr('height', function (d) {
          var h =
            vm._scales.y(d[0][0] / d[0].data.totalCollapse) -
            vm._scales.y(d[0][1] / d[0].data.totalCollapse);
          return h;
        })
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('fill', function (d) {
          return vm._scales.color(d[vm._config.fill]);
        })
        .on('mouseover', function (d, i) {
          if (
            vm._config.hasOwnProperty('quantiles') &&
            vm._config.quantiles.hasOwnProperty('colorsOnHover')
          ) {
            //OnHover colors
            d3.select(this).attr('fill', function (d) {
              return vm._getQuantileColor(d[vm._config.fill], 'onHover');
            });
          }
          vm._tip.show(d, d3.select(this).node());

          if (vm._config.hasOwnProperty('onmouseover')) {
            //External function call. It must be after all the internal code; allowing the user to overide
            vm._config.onmouseover.call(this, d, i);
          }
        })
        .on('mouseout', function (d, i) {
          if (
            vm._config.hasOwnProperty('quantiles') &&
            vm._config.quantiles.hasOwnProperty('colorsOnHover')
          ) {
            //OnHover reset default color
            d3.select(this).attr('fill', function (d) {
              return vm._getQuantileColor(d[vm._config.fill], 'default');
            });
          }
          vm._tip.hide();

          if (vm._config.hasOwnProperty('onmouseout')) {
            //External function call, must be after all the internal code; allowing the user to overide
            vm._config.onmouseout.call(this, d, i);
          }
        })
        .on('click', function (d, i) {
          if (vm._config.hasOwnProperty('click')) {
            vm._config.onclick.call(this, d, i);
          }
        });

      Spineplot.drawLabels();
    };

    Spineplot._drawStackByYAxis = function () {
      var vm = this;

      vm._tip.html(
        vm._config.tip ||
          function (d) {
            var html = '<div><span>' + d[vm._config.category] + '<span><br>';
            for (var k in d.data) {
              if (d[1] - d[0] == d.data[k]) {
                html += '<span>' + k + '</span>';
              }
            }
            html += '<br>' + vm.utils.format()(d[1] - d[0]);
            return html;
          }
      );

      vm.chart.svg().call(vm._tip);

      vm.chart
        .svg()
        .append('g')
        .selectAll('g')
        .data(vm._data)
        .enter()
        .append('g')
        .attr('class', 'division')
        .attr('fill', function (d) {
          return vm._scales.color(d.key);
        })
        .selectAll('rect')
        .data(function (d) {
          return d;
        })
        .enter()
        .append('rect')
        .attr('y', function (d) {
          return vm._scales.y(d.data[vm._config.value]);
        })
        .attr('x', function (d) {
          return vm._scales.x(d[0]);
        })
        .attr('height', vm._scales.y.bandwidth())
        .attr('width', function (d) {
          return vm._scales.x(d[1]) - vm._scales.x(d[0]);
        })
        .on('mouseover', function (d, i) {
          if (
            vm._config.hasOwnProperty('quantiles') &&
            vm._config.quantiles.hasOwnProperty('colorsOnHover')
          ) {
            //OnHover colors
            d3.select(this).attr('fill', function (d) {
              return vm._getQuantileColor(d[vm._config.fill], 'onHover');
            });
          }
          vm._tip.show(d, d3.select(this).node());

          if (vm._config.hasOwnProperty('onmouseover')) {
            //External function call. It must be after all the internal code; allowing the user to overide
            vm._config.onmouseover.call(this, d, i);
          }
        })
        .on('mouseout', function (d, i) {
          if (
            vm._config.hasOwnProperty('quantiles') &&
            vm._config.quantiles.hasOwnProperty('colorsOnHover')
          ) {
            //OnHover reset default color
            d3.select(this).attr('fill', function (d) {
              return vm._getQuantileColor(d[vm._config.fill], 'default');
            });
          }
          vm._tip.hide();

          if (vm._config.hasOwnProperty('onmouseout')) {
            //External function call, must be after all the internal code; allowing the user to overide
            vm._config.onmouseout.call(this, d, i);
          }
        })
        .on('click', function (d, i) {
          if (vm._config.hasOwnProperty('click')) {
            vm._config.onclick.call(this, d, i);
          }
        });
    };

    Spineplot._setQuantile = function (data) {
      var vm = this;
      var values = [];
      var quantile = [];

      if (
        vm._config.quantiles &&
        vm._config.quantiles.predefinedQuantiles &&
        vm._config.quantiles.predefinedQuantiles.length > 0
      ) {
        return vm._config.quantiles.predefinedQuantiles;
      }

      data.forEach(function (d) {
        values.push(+d[vm._config.fill]);
      });

      values.sort(vm.utils.sortAscending);

      //@TODO use quantile scale instead of manual calculations
      if (vm._config && vm._config.quantiles && vm._config.quantiles.buckets) {
        if (vm._config.quantiles.ignoreZeros === true) {
          var aux = _$1.dropWhile(values, function (o) {
            return o <= 0;
          });
          //aux.unshift(values[0]);

          quantile.push(values[0]);
          quantile.push(0);

          for (var i = 1; i <= vm._config.quantiles.buckets - 1; i++) {
            quantile.push(
              d3.quantile(aux, (i * 1) / (vm._config.quantiles.buckets - 1))
            );
          }
        } else {
          quantile.push(d3.quantile(values, 0));
          for (var j = 1; j <= vm._config.quantiles.buckets; j++) {
            quantile.push(
              d3.quantile(values, (j * 1) / vm._config.quantiles.buckets)
            );
          }
        }
      } else {
        quantile = [
          d3.quantile(values, 0),
          d3.quantile(values, 0.2),
          d3.quantile(values, 0.4),
          d3.quantile(values, 0.6),
          d3.quantile(values, 0.8),
          d3.quantile(values, 1),
        ];
      }

      //@TODO - VALIDATE WHEN ZEROS NEED TO BE PUT ON QUANTILE 1 AND RECALCULATE NON ZERO VALUES INTO THE REST OF THE BUCKETS
      if (
        vm._config.quantiles &&
        vm._config.quantiles.buckets &&
        vm._config.quantiles.buckets === 5
      ) {
        if (
          quantile[1] === quantile[2] &&
          quantile[2] === quantile[3] &&
          quantile[3] === quantile[4] &&
          quantile[4] === quantile[5]
        ) {
          quantile = [d3.quantile(values, 0), d3.quantile(values, 0.2)];
        }
      }

      return quantile;
    };

    Spineplot._getQuantileColor = function (d, type) {
      var vm = this;
      var total = parseFloat(d);

      //@TODO use quantile scale instead of manual calculations
      if (
        vm._config &&
        vm._config.bars.quantiles &&
        vm._config.bars.quantiles.colors
      ) {
        if (vm._quantiles.length > 2) {
          if (
            vm._config &&
            vm._config.bars.min !== undefined &&
            vm._config.bars.max !== undefined
          ) {
            if (total < vm._config.bars.min || total > vm._config.bars.max) {
              return vm._config.bars.quantiles.outOfRangeColor;
            }
          } else {
            if (total < vm._minMax[0] || total > vm._minMax[1]) {
              return vm._config.bars.quantiles.outOfRangeColor;
            }
          }

          if (type == 'default') {
            if (total <= vm._quantiles[1]) {
              return vm._config.bars.quantiles.colors[0]; //'#f7c7c5';
            } else if (total <= vm._quantiles[2]) {
              return vm._config.bars.quantiles.colors[1]; //'#e65158';
            } else if (total <= vm._quantiles[3]) {
              return vm._config.bars.quantiles.colors[2]; //'#c20216';
            } else if (total <= vm._quantiles[4]) {
              return vm._config.quantiles.colors[3]; //'#750000';
            } else if (total <= vm._quantiles[5]) {
              return vm._config.quantiles.colors[4]; //'#480000';
            }
          }

          if (
            type == 'onHover' &&
            vm._config.hasOwnProperty('quantiles') &&
            vm._config.quantiles.hasOwnProperty('colorsOnHover')
          ) {
            if (total <= vm._quantiles[1]) {
              return vm._config.quantiles.colorsOnHover[0]; //'#f7c7c5';
            } else if (total <= vm._quantiles[2]) {
              return vm._config.quantiles.colorsOnHover[1]; //'#e65158';
            } else if (total <= vm._quantiles[3]) {
              return vm._config.quantiles.colorsOnHover[2]; //'#c20216';
            } else if (total <= vm._quantiles[4]) {
              return vm._config.quantiles.colorsOnHover[3]; //'#750000';
            } else if (total <= vm._quantiles[5]) {
              return vm._config.quantiles.colorsOnHover[4]; //'#480000';
            }
          }
        }
      }

      if (vm._quantiles.length == 2) {
        /*if(total === 0 ){
          return d4theme.colors.quantiles[0];//return '#fff';
        }else if(total <= vm._quantiles[1]){
          return d4theme.colors.quantiles[1];//return '#f7c7c5';
        }*/
        if (total <= vm._quantiles[1]) {
          return vm._config.quantiles.colors[0]; //'#f7c7c5';
        }
      }
    };

    Spineplot.init(config);
    return Spineplot;
  }

  /* Simple timeline example
   * Single and multiline timelines
   */
  function timeline(config, helper) {
    var Timeline = Object.create(helper);

    Timeline.init = function (config) {
      var vm = this;
      vm._config = config ? config : {};
      vm._data = [];
      vm._scales = {};
      vm._axes = {};

      vm._config.parseDate = d3.timeParse('%Y-%m-%d');
      vm._config.curve = d3.curveLinear;

      vm._tip = vm.utils.d3
        .tip()
        .attr(
          'class',
          'd3-tip ' +
            (vm._config.tooltip && vm._config.tooltip.classed
              ? vm._config.tooltip.classed
              : '')
        )
        .html(
          vm._config.tip && vm._config.tip.html
            ? vm._config.tip.html
            : function (d) {
                var scaleColor =
                  vm._scales.color !== false
                    ? vm._scales.color(d.name)
                    : vm._getQuantileColor(d.name, 'default');
                if (vm.chart.config.styles) {
                  var html =
                    "<div style='\n            line-height: 1; \n            opacity: " +
                    vm.chart.style.tooltip.opacity +
                    '; \n            font-weight: ' +
                    vm.chart.style.tooltip.text.fontWeight +
                    '; \n            font-size: ' +
                    vm.chart.style.tooltip.text.fontSize +
                    '; \n            color: ' +
                    vm.chart.style.tooltip.text.textColor +
                    ';\n            font-family: ' +
                    vm.chart.style.tooltip.text.fontFamily +
                    ';\n            background-color: ' +
                    vm.chart.style.tooltip.backgroundColor +
                    '; \n            padding: ' +
                    vm.chart.style.tooltip.text.padding +
                    ';   \n            border: ' +
                    vm.chart.style.tooltip.border.width +
                    ' solid ' +
                    vm.chart.style.tooltip.border.color +
                    ';  \n            border-radius:  ' +
                    vm.chart.style.tooltip.border.radius +
                    ";'>";
                  html +=
                    "<strong style='color:" +
                    vm.chart.style.tooltip.text.fontColor +
                    ";'>";
                } else {
                  var html = '<div> <strong>';
                }
                html +=
                  "<strong style='color:" +
                  scaleColor +
                  "'>" +
                  d.name +
                  ': </strong>';
                html += d.y
                  ? '<span >' +
                    (Number.isNaN(+d.y)
                      ? d.y
                      : vm.utils.format(vm._config.yAxis)(d.y)) +
                    '</span>'
                  : '';
                html += '</div>';

                return html;
              }
        );
    };

    //-------------------------------
    //User config functions
    Timeline.x = function (col) {
      var vm = this;
      vm._config.x = col;
      return vm;
    };

    Timeline.parseDate = function (format) {
      var vm = this;
      vm._config.parseDate = d3.timeParse(format);
      return vm;
    };

    Timeline.y = function (col) {
      var vm = this;
      vm._config.y = col;
      return vm;
    };

    Timeline.series = function (arr) {
      var vm = this;
      vm._config.series = arr;
      return vm;
    };

    Timeline.curve = function (curve) {
      var vm = this;
      vm._config.curve = curve;
      return vm;
    };

    Timeline.fill = function (col) {
      var vm = this;
      vm._config.fill = col;
      return vm;
    };

    Timeline.colors = function (colors) {
      var vm = this;
      if (Array.isArray(colors)) {
        //Using an array of colors for the range
        vm._config.colors = colors;
      } else {
        //Using a preconfigured d3.scale
        vm._scales.color = colors;
      }
      return vm;
    };

    Timeline.tip = function (tip) {
      var vm = this;
      vm._config.tip = tip;
      vm._tip.html(vm._config.tip);
      return vm;
    };

    //-------------------------------
    //Triggered by the chart.js;
    Timeline.data = function (data) {
      var vm = this;

      vm._data = [];
      data.forEach(function (d) {
        var tmp = Object.assign({}, d);
        if (d[vm._config.x]) {
          try {
            d[vm._config.x].getTime();
            if (!Number.isNaN(d[vm._config.x].getTime())) {
              tmp.x = d[vm._config.x];
            }
          } catch (err) {
            tmp.x = vm._config.parseDate(d[vm._config.x]);
          }
        }

        tmp.color = d[vm._config.fill];
        delete tmp[vm._config.x];
        vm._data.push(tmp);
      });

      //Sort the data by d.x
      vm._data = vm._data.sort(function (a, b) {
        return d3.ascending(a.x, b.x);
      });

      vm._lines = vm._config.y ? vm._config.y : vm._config.series;

      vm._lines = vm._lines.map(function (name) {
        return {
          name: name,
          values: vm._data.map(function (d) {
            return { x: d.x, y: +d[name] };
          }),
        };
      });

      vm._lines.forEach(function (n) {
        n.values = n.values.filter(function (v) {
          return !isNaN(v.y);
        });
      });

      vm._line = d3
        .line()
        .curve(vm._config.curve)
        .defined(function (d) {
          return d.y !== undefined;
        })
        .x(function (d) {
          return vm._scales.x(d.x);
        })
        .y(function (d) {
          return vm._scales.y(d.y);
        });

      vm._area = d3
        .area()
        .curve(vm._config.curve)
        .x(function (d) {
          if (d.alreadyScaled && d.alreadyScaled === true) {
            return d.x;
          } else {
            return vm._scales.x(d.x);
          }
        })
        .y1(function (d) {
          if (d.alreadyScaled && d.alreadyScaled === true) {
            return d.y;
          } else {
            return vm._scales.y(d.y);
          }
        });

      return vm;
    };

    Timeline.scales = function () {
      var vm = this;

      vm._xMinMax = d3.extent(vm._data, function (d) {
        return d.x;
      });

      vm._yMinMax = [
        vm._config.yAxis.minZero
          ? 0
          : d3.min(vm._lines, function (c) {
              return d3.min(c.values, function (v) {
                return v.y;
              });
            }),
        d3.max(vm._lines, function (c) {
          return d3.max(c.values, function (v) {
            return v.y;
          });
        }),
      ];

      config = {
        column: vm._config.x,
        type: vm._config.xAxis.scale,
        range: [0, vm.chart.width],
        minZero: false,
      };
      vm._scales.x = vm.utils.generateScale(vm._data, config);

      config = {
        column: vm._config.y,
        type: vm._config.yAxis.scale,
        range: [vm.chart.height, 0],
        minZero: vm._config.yAxis.minZero,
      };
      vm._scales.y = vm.utils.generateScale(vm._data, config);

      vm._scales.x.domain(vm._xMinMax);
      vm._scales.y.domain(vm._yMinMax).nice();

      if (vm._config.hasOwnProperty('colors'))
        vm._scales.color = d3.scaleOrdinal(vm._config.colors);
      else vm._scales.color = d3.scaleOrdinal(d3.schemeCategory10);

      if (
        vm._scales.x.domain()[0].getTime() == vm._scales.x.domain()[1].getTime()
      ) {
        // max and min are the same, there's only one datum
        var oldDomain = vm._scales.x.domain();
        var oldRange = vm._scales.x.range();

        vm._scales.x
          .domain([
            new Date(oldDomain[0].getTime() - 1),
            oldDomain[0],
            oldDomain[1],
          ])
          .range([
            0,
            oldRange[0] + (oldRange[1] - oldRange[0]) / 2,
            oldRange[1],
          ]);
      }

      return vm;
    };

    Timeline.drawLabels = function () {
      var vm = this;
      var chartW = vm.chart.width;

      vm.chart
        .svg()
        .selectAll('.dots')
        .each(function (dat) {
          var el = this;
          dat.values.forEach(function (c, index) {
            d3.select(el)
              .append('text')
              .attr('class', 'dbox-label')
              .attr('text-anchor', 'start')
              .attr('transform', function (d) {
                if (vm._scales.x(d.values[index].x) >= chartW) {
                  d3.select(this).attr('text-anchor', 'end');
                  return (
                    'translate (' +
                    (vm._scales.x(d.values[index].x) - 10) +
                    ',' +
                    (vm._scales.y(d.values[index].y) + 4) +
                    ')'
                  );
                }
                d3.select(this).attr('text-anchor', 'start');
                return (
                  'translate (' +
                  (vm._scales.x(d.values[index].x) + 10) +
                  ',' +
                  (vm._scales.y(d.values[index].y) + 4) +
                  ')'
                );
              })
              .text(function () {
                return c.y ? vm.utils.format(vm._config.yAxis, true)(c.y) : '';
              });
          });
        });
    };

    Timeline.draw = function () {
      var vm = this;
      //Call the tip
      vm.chart.svg().call(vm._tip);

      if (vm._scales.x.domain().length === 3) {
        vm.chart.svg().select('.x.axis .tick').remove();
      }

      var lines = vm.chart
        .svg()
        .selectAll('.lines')
        .data(vm._lines)
        .enter()
        .append('g')
        .attr('class', 'lines');

      var path = vm.chart
        .svg()
        .selectAll('.lines')
        .append('path')
        .attr('class', 'line')
        .attr('d', function (d) {
          return vm._line(d.values);
        })
        .attr('stroke', function (d) {
          return vm._scales.color !== false
            ? vm._scales.color(d.name)
            : vm._getQuantileColor(d.name, 'default');
        })
        .attr('stroke-width', 4)
        .attr('fill', 'none');

      /**By default it draws dots on data points with 4px radius*/
      var dots = vm.chart
        .svg()
        .selectAll('.dots')
        .data(vm._lines)
        .enter()
        .append('g')
        .attr('class', 'dots')
        .selectAll('.circle')
        .data(function (d) {
          d.values.forEach(function (el) {
            el.name = d.name;
          });
          return d.values;
        })
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', function (d, i) {
          return vm._scales.x(d.x);
        })
        .attr('cy', function (d) {
          return vm._scales.y(d.y);
        })
        .attr('r', 4)
        .style('stroke', function (d) {
          return vm._scales.color !== false
            ? vm._scales.color(d.name)
            : vm._getQuantileColor(d.name, 'default');
        })
        .style('stroke-width', 2)
        .style('fill', '#fff')
        .style('fill-opacity', 0.5)
        .on('mouseover', function (d, i) {
          if (vm._config.mouseover) {
            //vm._config.mouseover.call(vm, d, i);
          }
          vm._tip.show(d, d3.select(this).node());
        })
        .on('mouseout', function (d, i) {
          if (vm._config.mouseout) {
            //vm._config.mouseout.call(this, d, i);
          }
          vm._tip.hide(d, d3.select(this).node());
        });

      Timeline.drawLabels();
      //var t = textures.lines().thicker();

      //vm.chart.svg().call(t);

      /* vm._area.y0(vm._scales.y(vm._yMinMax[0]));
       var areas = vm.chart.svg().selectAll(".areas")
        .data(vm._lines)
      .enter().append("g")
        .attr("class", "areas");
       var pathArea  = vm.chart.svg().selectAll(".areas").append("path")
        .attr("class", "area")
        .attr("d", function(d) {
          return vm._area(d.values);
        }) */
      //.attr("fill", t.url());

      return vm;
    };

    Timeline.init(config);
    return Timeline;
  }

  /*
   * Simple SVG Treemap Chart
   */
  function treemap(config, helper) {
    var Treemap = Object.create(helper);

    Treemap.init = function (config) {
      var vm = this;
      vm._config = config ? config : {};
      vm._config._padding = 3;
      vm._config._labels = false;
      vm._config.tip = function (d) {
        var html = '<div>';
        if (d.parent.data.name && d.parent.data.name !== 'data') {
          html += '<span>' + d.parent.data.name + '</span><br>';
        }
        html += '<span>' + d.data.name + '</span><br>';
        html += '<span>' + vm.utils.format()(d.value) + '</span>';
        html += '</div>';
        return html;
      };
      vm._data = [];
      vm._scales = {
        color: d3.scaleOrdinal(d3.schemeCategory20c),
      };
      vm._axes = {};
      vm._tip = vm.utils.d3
        .tip()
        .attr('class', 'd3-tip tip-treemap')
        .direction('n')
        .html(vm._config.tip);
    };

    Treemap.size = function (col) {
      var vm = this;
      vm._config._size = col;
      return vm;
    };

    Treemap.colors = function (arrayOfColors, domain) {
      var vm = this;
      vm._scales.color = d3.scaleOrdinal(arrayOfColors);
      if (domain) {
        vm._scales.color.domain(domain);
      }
      return vm;
    };

    Treemap.padding = function (padding) {
      var vm = this;
      vm._config._padding = padding;
      return vm;
    };

    Treemap.nestBy = function (keys) {
      var vm = this;
      if (Array.isArray(keys)) {
        if (keys.length == 0) throw 'Error: nestBy() array is empty';
        vm._config._keys = keys;
      } else if (typeof keys === 'string' || keys instanceof String) {
        vm._config._keys = [keys];
      } else {
        if (keys == undefined || keys == null)
          throw 'Error: nestBy() expects column names to deaggregate data';
        vm._config._keys = [keys.toString()];
        console.warning(
          'nestBy() expected name of columns. Argument will be forced to string version .toString()'
        );
      }
      vm._config._labelName = vm._config._keys[vm._config._keys.length - 1]; //label will be last key
      return vm;
    };

    Treemap.format = function (format) {
      var vm = this;
      if (typeof format == 'function' || format instanceof Function)
        vm.utils.format = format;
      else vm.utils.format = d3.format(format, vm._config.decimals);
      return vm;
    };

    Treemap.labels = function (bool) {
      var vm = this;
      vm._config._labels = Boolean(bool);
      return vm;
    };

    Treemap.tip = function (tip) {
      var vm = this;
      vm._config.tip = tip;
      vm._tip.html(vm._config.tip);
      return vm;
    };

    Treemap.scales = function (scales) {
      var vm = this;
      return vm;
    };

    Treemap.axes = function () {
      var vm = this;
      return vm;
    };

    Treemap.domains = function () {
      var vm = this;
      return vm;
    };

    Treemap.isValidStructure = function (datum) {
      var vm = this;
      if (
        (typeof datum.name === 'string' || datum.name instanceof String) &&
        Array.isArray(datum.children)
      ) {
        var res = true;
        datum.children.forEach(function (child) {
          res = res && vm.isValidStructure(child);
        });
        return res;
      } else if (
        (typeof datum.name === 'string' || datum.name instanceof String) &&
        Number(datum[vm._config._size]) == datum[vm._config._size]
      ) {
        return true;
      } else {
        return false;
      }
    };

    Treemap.formatNestedData = function (data) {
      var vm = this;
      if (data.key) {
        data.name = data.key;
        delete data.key;
      } else {
        if (!Array.isArray(data.values)) {
          data.name = data[vm._config._labelName];
        }
      }
      if (Array.isArray(data.values)) {
        var children = [];
        data.values.forEach(function (v) {
          children.push(vm.formatNestedData(v));
        });
        data.children = children;
        delete data.values;
      }
      if (!data[vm._config._size] && data.value) {
        data[vm._config._size] = data.value;
      }
      return data;
    };

    function nestKey(nest, key, callback) {
      callback(
        null,
        nest.key(function (d) {
          return d[key];
        })
      );
    }

    Treemap.data = function (data) {
      var vm = this;
      // Validate structure like [{name: '', children: [{},{}]}]
      if (data) {
        if (Array.isArray(data) && data.length > 0) {
          if (!vm.isValidStructure(data[0])) {
            data.forEach(function (d) {
              d[vm._config._size] = +d[vm._config._size];
            });
            try {
              if (!vm._config._keys)
                throw 'nestBy() in layer was not configured';
              var nested = d3.nest();
              var queue = d3.queue();
              for (var i = 0; i < vm._config._keys.length; i++) {
                queue.defer(nestKey, nested, vm._config._keys[i]);
              }
              queue.awaitAll(function (error, nested) {
                var nestedData = nested[0]
                  .rollup(function (leaves) {
                    return d3.sum(leaves, function (d) {
                      return d[vm._config._size];
                    });
                  })
                  .entries(data);
                var aux = {};
                aux.key = 'data';
                aux.values = _.cloneDeep(nestedData); // WARN: Lodash dependency
                data = vm.formatNestedData(aux);
                vm._data = data;
              });
            } catch (err) {
              console.error(err);
            }
          }
        } else {
          if (!vm.isValidStructure(data)) {
            try {
              if (!data.key) throw "Property 'key' not found";
              if (data[vm._config._size] !== Number(data[vm._config._size]))
                throw 'Value used for treemap rect size is not a number';
              data = vm.formatNestedData(data);
              vm._data = data;
            } catch (err) {
              console.error(err);
            }
          }
        }
      }
      return vm;
    };

    Treemap.draw = function () {
      var vm = this;
      vm.chart.svg().call(vm._tip);

      var treemap = d3
        .treemap()
        .tile(d3.treemapResquarify)
        .size([vm.chart.width, vm.chart.height])
        .round(true)
        .paddingInner(vm._config._padding);

      var root = d3
        .hierarchy(vm._data)
        .eachBefore(function (d) {
          d.data.id = (d.parent ? d.parent.data.id + '.' : '') + d.data.name;
        })
        .sum(function (d) {
          return d[vm._config._size];
        })
        .sort(function (a, b) {
          return b.height - a.height || b.value - a.value;
        });

      treemap(root);

      var cell = vm.chart
        .svg()
        .selectAll('g')
        .data(root.leaves())
        .enter()
        .append('g')
        .attr('transform', function (d) {
          return 'translate(' + d.x0 + ',' + d.y0 + ')';
        });

      var rect = cell
        .append('rect')
        .attr('id', function (d) {
          return d.data.id;
        })
        .attr('width', function (d) {
          return d.x1 - d.x0;
        })
        .attr('height', function (d) {
          return d.y1 - d.y0;
        })
        .attr('fill', function (d) {
          return vm._scales.color(d.data.name);
        });

      cell
        .append('clipPath')
        .attr('id', function (d) {
          return 'clip-' + d.data.id;
        })
        .append('use')
        .attr('xlink:href', function (d) {
          return '#' + d.data.id;
        });

      if (vm._config._labels) {
        var text = cell.append('text').attr('clip-path', function (d) {
          return 'url(#clip-' + d.data.id + ')';
        });
        text
          .append('tspan')
          .attr('class', 'capitalize')
          .attr('x', 8)
          .attr('y', 25)
          .text(function (d) {
            if (d.value > 2) {
              var arr = d.data.id.replace('data.', '').split('.');
              return arr.length > 1
                ? arr.slice(arr.length - 2, arr.length).join(' / ')
                : arr[arr.length - 1].toString();
            } else return '';
          });
        text
          .append('tspan')
          .attr('class', 'capitalize')
          .attr('x', 8)
          .attr('y', 45)
          .text(function (d) {
            return d.value > 2 ? vm.utils.format(null, true)(d.value) : '';
          });
      }

      rect
        .on('mouseover', function (d) {
          /*if(vm._config.data.mouseover){
          vm._config.data.mouseover.call(vm, d,i);
        }*/
          vm._tip.show(d, d3.select(this).node());
        })
        .on('mouseout', function (d) {
          /*if(vm._config.data.mouseout){
          vm._config.data.mouseout.call(this, d,i);
        }*/
          vm._tip.hide(d, d3.select(this).node());
        });

      return vm;
    };

    Treemap.init(config);
    return Treemap;
  }

  /*
   * Dboxjs
   *
   * You can import other modules here, including external packages. When
   * bundling using rollup you can mark those modules as external and have them
   * excluded or, if they have a jsnext:main entry in their package.json (like
   * this package does), let rollup bundle them into your dist file.
   */

  exports.chart = Chart;
  exports.bars = bars;
  exports.distro = distro;
  exports.heatmap = heatmap;
  exports.leaflet = leaflet;
  exports.map = map;
  exports.radar = radar;
  exports.scatter = scatter;
  exports.spineplot = spineplot;
  exports.timeline = timeline;
  exports.treemap = treemap;

  Object.defineProperty(exports, '__esModule', { value: true });
});
//# sourceMappingURL=dbox.js.map
