import * as dbox from '../';
import * as assert from 'assert';

describe('dbox', () => {
  it('creates a chart template', () => {
    var chart = dbox.chart();
    assert.deepEqual(chart._config, {size: {}});
  });
});
