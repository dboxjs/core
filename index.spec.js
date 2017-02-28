var expect = require('chai').expect;
var dbox = require('./build/dbox.js');

describe('dbox', function(){
  it('Should set a chart base 800px 600px', function(){
    var chart = dbox.chart();
    expect(chart._width).to.be.equal(800);
    expect(chart._height).to.be.equal(600);
  });
});
