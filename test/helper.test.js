import * as dbox from '../';
import * as assert from 'assert';

describe('Helper.utils', function() {
  describe('format()', function() {
    it('Should format 5450000 to 5.5 millones', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(null, true)(5450000);
      assert.equal(result, '5.5 millones');
    });
    it('Should format 430958 to 431.0 mil', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(null, true)(430958);
      assert.equal(result, '431.0 mil');
    });
    it('Should format 6234 to 6,234', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(null, true)(6234);
      assert.equal(result, '6,234');
    });
    it('Should format 345.23 to 345.2', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(null, true)(345.23);
      assert.equal(result, '345.2');
    });
    it('Should format 5.2093 to 5.2', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(null, true)(5.2093);
      assert.equal(result, '5.2');
    });
    it('Should format 12.0 to 12', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(null, true)(12.0);
      assert.equal(result, '12');
    });
    it('Should format 1.4904 to 1.5', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(null, true)(1.4904);
      assert.equal(result, '1.5');
    });
    it('Should format 0.4935 to 0.5 ', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(null, true)(0.4935);
      assert.equal(result, '0.5');
    });
    it('Should format 0.00435 to 0.004 ', function() {
      var chart = dbox.chart();
      var result = chart.helper.utils.format(null, true)(0.00435);
      assert.equal(result, '0.004');
    });
  });
});
