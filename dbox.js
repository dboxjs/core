(function (window) {
    'use strict';

    /*global define, module, exports, require */

    var dbox = { version: "0.1" };

    dbox.draw = function (config) {
        return new Chart(config);
    };

    dbbox.scatter = function(config){
    }


 	if (typeof define === 'function' && define.amd) {
        define("dbox", ["d3"], function () { return dbox; });
    } else if ('undefined' !== typeof exports && 'undefined' !== typeof module) {
        module.exports = dbox;
    } else {
        window.dbox = dbox;
    }


    //Functions
    function Chart(config) {
		var $dbox = this;	
		$dbox.d3 = window.d3 ? window.d3 : typeof require !== 'undefined' ? require("d3") : undefined;
    }
    


})(window);

console.log(dbox);

/*angular.module('dbox',[]); 


	angular
	    .module('dbox')
	    .directive('myExample', myExample);

	function myExample() {
	    var directive = {
	        restrict: 'E',
	        template: '<div>Blanca por que ella manda</div>',
	        scope: {
	       
	        },
	        controller: myExampleController,
	        controllerAs: 'vm',
	        bindToController: true // because the scope is isolated
	    };

	    return directive;
	}



	function myExampleController() {
	  var vm = this;

	  //---------------------------------------
	  alert('Funcionó');
	}
*/



