(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
  Boot operations
*/
var _class = function () {
    function _class() {
        _classCallCheck(this, _class);

        return this.ready();
    }

    _createClass(_class, [{
        key: "ready",
        value: function ready() {
            return new Promise(function (resolve, reject) {
                document.addEventListener("DOMContentLoaded", function () {
                    // Just a dummy condition
                    if (/\w/.test(location.href)) {
                        resolve();
                    } else reject('Error');
                });
            });
        }
    }]);

    return _class;
}();

exports.default = _class;
;

},{}],2:[function(require,module,exports){
"use strict";

var _Boot = require("../../js/modules/Boot/Boot");

var _Boot2 = _interopRequireDefault(_Boot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe("Boot module", function () {

    it("should be defined", function () {
        var boot = new _Boot2.default();
        expect(boot.then).toBeDefined();
    });
});

},{"../../js/modules/Boot/Boot":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvbW9kdWxlcy9Cb290L0Jvb3QuanMiLCJzcmMvdGVzdC9tb2R1bGVzL0Jvb3RTcGVjLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7OztBQ0FBOzs7O0FBS0ksc0JBQWM7QUFBQTs7QUFDVixlQUFPLEtBQUssS0FBTCxFQUFQO0FBQ0g7Ozs7Z0NBRU87QUFDSixtQkFBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3BDLHlCQUFTLGdCQUFULENBQTBCLGtCQUExQixFQUE4QyxZQUFNO0FBQ2hEO0FBQ0Esd0JBQUksS0FBSyxJQUFMLENBQVUsU0FBUyxJQUFuQixDQUFKLEVBQThCO0FBQzFCO0FBQ0gscUJBRkQsTUFHSyxPQUFPLE9BQVA7QUFDUixpQkFORDtBQU9ILGFBUk0sQ0FBUDtBQVNIOzs7Ozs7O0FBRUo7Ozs7O0FDckJEOzs7Ozs7QUFFQSxTQUFTLGFBQVQsRUFBd0IsWUFBVTs7QUFFOUIsT0FBRyxtQkFBSCxFQUF3QixZQUFVO0FBQzlCLFlBQUksT0FBTyxvQkFBWDtBQUNBLGVBQU8sS0FBSyxJQUFaLEVBQWtCLFdBQWxCO0FBQ0gsS0FIRDtBQUtILENBUEQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypcbiAgQm9vdCBvcGVyYXRpb25zXG4qL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3Mge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWR5KCk7XG4gICAgfVxuXG4gICAgcmVhZHkoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gSnVzdCBhIGR1bW15IGNvbmRpdGlvblxuICAgICAgICAgICAgICAgIGlmICgvXFx3Ly50ZXN0KGxvY2F0aW9uLmhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSByZWplY3QoJ0Vycm9yJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59O1xuIiwiaW1wb3J0IEJvb3QgZnJvbSBcIi4uLy4uL2pzL21vZHVsZXMvQm9vdC9Cb290XCI7XG5cbmRlc2NyaWJlKFwiQm9vdCBtb2R1bGVcIiwgZnVuY3Rpb24oKXtcblxuICAgIGl0KFwic2hvdWxkIGJlIGRlZmluZWRcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgbGV0IGJvb3QgPSBuZXcgQm9vdCgpO1xuICAgICAgICBleHBlY3QoYm9vdC50aGVuKS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuXG59KTtcbiJdfQ==
