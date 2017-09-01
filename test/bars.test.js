import * as dbox from '../';
import * as assert from 'assert';

describe('Bar chart', () => {
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
    assert.ok(dbox.bars);
  });

  it('Should create a bar chart', () => {
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
        scale: 'ordinal'
      },
      yAxis: {
        enabled: true,
        scale: 'linear'
      },
      events: {
        load: onLoad
      }
    };
    var data = [{name: 'female', value: 35},{name: 'male', value: 24},{name: 'NA', value: 4}];

    var chart = dbox.chart(config)
                  .bindTo(this)
                  .data({'raw': data})
                  .layer(dbox.bars)
                    .x('name')
                    .y('value')
                  .end()
                  .draw();
    function onLoad(chart){
      setTimeout(function(){
        console.log(chart.getLayer(0));
        assert.ok(chart.getLayer(0)._scales.x);
        assert.ok(chart.getLayer(0)._scales.y);
      }, 2000);
    }
  })
});
