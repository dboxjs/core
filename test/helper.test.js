import * as dbox from '../';
import * as assert from 'assert';

describe('Helper.utils', function() {
  describe('format()', function() {
    it('Should format ', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(5450000);
      assert.equal(result, '5.5 millones');
    });
    it('Should format ', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(430958);
      assert.equal(result, '430.9 mil');
    });
    it('Should format ', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(6234);
      assert.equal(result, '6.2 mil');
    });
    it('Should format ', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(345.23);
      assert.equal(result, '345.2');
    });
    it('Should format ', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(5.2093);
      assert.equal(result, '5.2');
    });
    it('Should format ', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(12);
      assert.equal(result, '12');
    });
    it('Should format ', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(1.4904);
      assert.equal(result, '1.5');
    });
    it('Should format ', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(0.4935);
      assert.equal(result, '0.5');
    });
    it('Should format ', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(0.00435);
      assert.equal(result, '0.004');
    });
  });
});