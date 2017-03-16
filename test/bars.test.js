import * as dbox from '../';
import * as assert from 'assert';

describe('Bars column chart', () => {
  it('Should create a base chart', () => {
    var config = {
      size: {
        width: 600,
        height: 400,
        margin: {
          top: 5,
          right: 5,
          bottom: 20,
          left: 20
        }
      },
      xAxis: {
        enabled:true,
        scale: 'linear'
      },
      yAxis: {
        enabled: true,
        scale: 'linear'
      }
    };

    var chart = dbox.chart(config)
                  .bindTo('body')
                  .data({'raw': [{name: 'female', value: 35},{name: 'male', value: 24},{name: 'NA', value: 4}]})
    assert.equal(chart._config.bindTo, 'body');
  });

  it('Should be defined in dbox', () => {
    assert.ok(dbox.columnChart);
  });
});
