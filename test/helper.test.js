import * as dbox from '../';
import * as assert from 'assert';

describe('Helper.utils', function() {
  describe('format()', function() {
    it('Should format 5450000 to 5.5 millones', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(5450000, true);
      assert.equal(result, '5.5 millones');
    });
    it('Should format 430958 to 431.0 mil', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(430958, true);
      assert.equal(result, '431.0 mil');
    });
    it('Should format 6234 to 6.2 mil', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(6234, true);
      assert.equal(result, '6.2 mil');
    });
    it('Should format 345.23 to 345.2', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(345.23, true);
      assert.equal(result, '345.2');
    });
    it('Should format 5.2093 to 5.2', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(5.2093, true);
      assert.equal(result, '5.2');
    });
    it('Should format 12.0 to 12', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(12.0, true);
      assert.equal(result, '12');
    });
    it('Should format 1.4904 to 1.5', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(1.4904, true);
      assert.equal(result, '1.5');
    });
    it('Should format 0.4935 to 0.5 ', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(0.4935, true);
      assert.equal(result, '0.5');
    });
    it('Should format 0.00435 to 0.004 ', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(0.00435, true);
      assert.equal(result, '0.004');
    });
  });
});