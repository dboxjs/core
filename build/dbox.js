(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.dbox = global.dbox || {})));
}(this, function (exports) { 'use strict';

  function Chart(config) {
    console.log('Blanca Rocks!!!!!!!')
  }

  function chart(config) {
    return new Chart(config);
  }

  exports.chart = chart;

  Object.defineProperty(exports, '__esModule', { value: true });

}));