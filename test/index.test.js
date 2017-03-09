import * as dbox from '../';
import * as assert from 'assert';

describe('chart core', () => {
  it('Creates a default chart config template', () => {
    var chart = dbox.chart();
    assert.deepEqual(chart._config, {size: {width: 800, height: 600, margin: {left: 0, right: 0, top: 0, bottom: 0}}});
  });

  it('Should set size options using chained method', () => {
    var size = {
      width: 400,
      height: 400,
      margin: {
        top: 0,
        right: 10,
        bottom: 5,
        left: 10
      }
    };
    var chart = dbox.chart()
            .size(size);

    assert.deepEqual(chart._config.size, size);
    assert.deepEqual(chart._width, size.width);
    assert.deepEqual(chart._height, size.height);
    assert.deepEqual(chart._margin, size.margin);
  });

  it('Should bind chart to element', () => {
    var chart = dbox.chart()
                .bindTo('body')
    assert.strictEqual(chart._config.bindTo, 'body');
  });
});
