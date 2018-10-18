import * as d3 from 'd3';

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

  Helper.utils.d3.tip = d3.tip;

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
      domains = d3.extent(data, function (d) {
        return +d[config.column];
      });
    } else {
      // Axis of type band
      domains = data.map(function (d) {
        return d[config.column];
      });
    }

    if (config.minZero) {
      domains = [0, d3.max(data, function (d) {
        return +d[config.column];
      })];
    }
    if (config.domains && Array.isArray(config.domains)) {
      domains = config.domains;
    }

    if (config.type) {
      switch (config.type) {
      case 'linear':
        scale = d3.scaleLinear()
          .rangeRound(config.range)
          .domain(domains);
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
          .domain(domains);
        break;
      }
    } else {
      scale = d3.scaleLinear()
        .rangeRound(config.range)
        .domain(domains);
    }

    return scale;
  };

  Helper.utils.format = function (d) {
    var value = '';
    if (vm._config.formatPreffix) {
      value += vm._config.formatPreffix;
    }
    if (d === 0 || d % 1 == 0) {
      value += d3.format(',.0f')(d);
    } else if (d < 1 && d > 0) {
      value += d3.format(',.2f')(d);
    } else {
      value += d3.format(',.1f')(d);
    }
    if (vm._config.formatSuffix) {
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

  return Helper;
}
