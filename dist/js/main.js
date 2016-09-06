(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/*
  App
*/

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.add = add;
exports.get = get;
exports.setNode = setNode;
exports.getNode = getNode;
exports.merge = merge;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var modules = [];
var currView = void 0,
    currModel = void 0;

function add(moduleName, M, V, C) {
    var view = currView = new V();
    var model = currModel = new M();
    var controller = new C();
    model.init();

    return modules[moduleName] = {
        model: model,
        view: view,
        controller: controller
    };
}

function get(moduleName) {
    return modules[moduleName];
}

/*
  Model
*/

var Model = exports.Model = function () {
    function Model() {
        _classCallCheck(this, Model);

        this.tree = {};
        this.callbacks = {
            setPre: [],
            setPost: [],
            change: []
        };
    }

    _createClass(Model, [{
        key: "init",
        value: function init() {
            // Run any callbacks registered during instantiation
            for (var p in this.callbacks) {
                if (this.callbacks.hasOwnProperty(p)) {
                    this.runCallbacks(p);
                }
            }
        }
    }, {
        key: "setPre",
        value: function setPre(props) {
            // Allows validation etc. before setting props
            // `props` is a copy that can be safely mutated
            var callbacks = this.callbacks["setPre"];
            var i = callbacks.length;
            while (i--) {
                props = callbacks[i].call(this, props);
            }
            return props;
        }
    }, {
        key: "setPost",
        value: function setPost(props) {
            // Runs callbacks after `set()` whether model changed or not
            this.runCallbacks("setPost");
        }
    }, {
        key: "change",
        value: function change() {
            // Runs callbacks after `set()` if model changed
            this.runCallbacks("change");
        }
    }, {
        key: "set",
        value: function set(propsOrPath, value) {
            // Accepts props object `{...}` OR 'path', 'value'
            var changeEvent = void 0;

            if (isObject(propsOrPath)) {
                // Run any "setPre" callbacks on a copy of `props`
                var props = this.setPre(merge({}, propsOrPath));
                merge(this.tree, props, function (isChanged) {
                    return changeEvent = isChanged;
                });
            } else {
                var path = propsOrPath;
                // Run any "setPre" callbacks
                value = this.setPre(_defineProperty({}, path, value))[path];
                changeEvent = setNode(this.tree, path, value);
            }
            if (changeEvent) {
                this.change();
            }
            this.setPost();
            return this; // For chaining
        }
    }, {
        key: "get",
        value: function get(path) {
            return getNode(this.tree, path);
        }
    }, {
        key: "on",
        value: function on(label, callback) {
            var callbacks = this.callbacks[label];
            if (callbacks) {
                callbacks.unshift(callback);
            }
            return this; // For chaining
        }
    }, {
        key: "runCallbacks",
        value: function runCallbacks(label) {
            var callbacks = this.callbacks[label];
            var i = callbacks.length;
            while (i--) {
                callbacks[i].call(this, this.tree);
            }
        }
    }, {
        key: "toJSON",
        value: function toJSON() {
            // Return tree for JSON.stringify()
            return this.tree;
        }
    }]);

    return Model;
}();

/*
  View
*/


var View = exports.View = function () {
    function View() {
        // Derived class must assign `el` property

        _classCallCheck(this, View);
    }

    _createClass(View, [{
        key: "get",
        value: function get(selector) {
            return this.el.querySelector(selector);
        }
    }, {
        key: "getAll",
        value: function getAll(selector) {
            return this.el.querySelectorAll(selector);
        }
    }]);

    return View;
}();

/*
  Controller
*/


var Controller = exports.Controller = function () {
    function Controller() {
        _classCallCheck(this, Controller);

        this.model = currModel;
        if (currView.el) {
            this.view = currView;
        } else {
            throw new Error('View.el required!');
        }
        currModel = null;
        currView = null;
    }

    _createClass(Controller, [{
        key: "bind",
        value: function bind(bindings) {
            // Run binding functions for selectors (within view.el)
            for (var selector in bindings) {
                if (bindings.hasOwnProperty(selector)) {
                    var domEls = this.view.el.querySelectorAll(selector);
                    var i = domEls.length;
                    while (i--) {
                        bindings[selector].call(this, domEls[i], this.model, this.view, this);
                    }
                }
            }
            return this; // For chaining
        }
    }]);

    return Controller;
}();

/*
  Utils
*/


function isObject(o) {
    return o === Object(o) && !o.nodeType && !Array.isArray(o) && !(typeof o === 'function') && !(o instanceof RegExp);
}

function isNumeric(val) {
    return Number(parseFloat(val)) == val;
}

function setNode(tree, pathStr, value) {
    // Set node at path string to value
    // Any missing nodes are created
    // NOTE: all numeric nodes below root are assumed to be array indexes
    // Returns boolean `true` if value was changed
    var isChanged = false;

    getNode(tree, pathStr, function (currNode, prop, nextProp) {
        // Last segment of path string, set value if different
        if (nextProp === undefined) {
            var currVal = currNode[prop];
            if (value !== currVal) {
                currNode[prop] = value;
                isChanged = true;
            }
        }
        // Else create any missing nodes in path
        else if (currNode[prop] === undefined) {
                // Create an array if nextProp is numeric, otherwise an object
                currNode[prop] = isNumeric(nextProp) ? [] : {};
            }
    });
    return isChanged;
}

function getNode(tree, pathStr, eachCallback) {
    // Get node from path string
    // Optional `eachCallback` is passed (currNode, prop, nextProp)
    // This allows the next node to be created or changed before each traversal
    var pathArr = pathStr.split(".");
    var currNode = tree;

    for (var i = 0, len = pathArr.length; i < len; i++) {
        var prop = pathArr[i];
        if (eachCallback) {
            eachCallback(currNode, prop, pathArr[i + 1]);
        }
        if (currNode === undefined) break;else currNode = currNode[prop];
    }
    return currNode;
}

function merge() /* [mergeChildObs,] {}, {} [, ...] [, callback] */{
    // Add or overwrite all properties right to left
    // By default child objects are merged recursively (but not arrays)
    // If a boolean is supplied, it becomes `mergeChildObs` value until another boolean is found
    // If a callback is supplied, it will receive a boolean argument `isChanged`
    var level = 0,
        changeCount = 0,
        mergeChildObs = true,
        callback = void 0,
        result = run.apply(this, [0, arguments]);

    if (callback) callback(!!changeCount);
    return result;

    function run(level, params) {
        var param = void 0,
            retOb = void 0,
            paramsCount = params.length;

        // Child objects
        // Merge into leftmost param if an object, or create object to merge into
        if (level) {
            retOb = isObject(params[0]) ? params[0] : {};
        }

        for (var i = 0; i < paramsCount; i++) {
            param = params[i];

            // Top level params may contain other arguments
            if (!level && param != null) {
                // `undefined` or `null`
                // First object becomes returned object
                // Also allow a DOM node for merging into
                if (!retOb && isObject(param) || param.nodeName) {
                    retOb = param;
                    continue;
                }
                // `mergeChildObs` boolean arguments
                if (typeof param === "boolean") {
                    mergeChildObs = param;
                    continue;
                }
                // Last passed in function becomes callback
                if (typeof param === "function") {
                    callback = param;
                    continue;
                }
                if (!retOb) continue;
            }
            for (var p in param) {
                if (param.hasOwnProperty(p)) {
                    var val = param[p];

                    // Merge child objects (recursive)
                    if (mergeChildObs && isObject(val)) {
                        retOb[p] = run(level + 1, [retOb[p], val]);
                    } else if (val !== retOb[p]) {
                        changeCount++;
                        retOb[p] = val;
                    }
                }
            }
        }
        return retOb || {};
    }
}

},{}],2:[function(require,module,exports){
"use strict";

var _Boot = require("./modules/Boot/Boot");

var _Boot2 = _interopRequireDefault(_Boot);

var _UserForm = require("./modules/UserForm/UserForm");

var _UserForm2 = _interopRequireDefault(_UserForm);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

new _Boot2.default().then(function () {
    new _UserForm2.default();
});

},{"./modules/Boot/Boot":3,"./modules/UserForm/UserForm":6}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _app = require("../../lib/app");

var app = _interopRequireWildcard(_app);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

"use strict";

/*
  Extends `app.Controller`
      Properties: `model`, `view`
      Methods: `bind()` for DOM selectors
*/

var _class = function (_app$Controller) {
    _inherits(_class, _app$Controller);

    function _class() {
        _classCallCheck(this, _class);

        // Render model on change
        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(_class).call(this));

        _this.model.on('change', function () {
            _this.view.get('.model').innerHTML = JSON.stringify(_this.model);
        });

        // Example 2 way bindings
        _this.bind({

            '#firstName': function firstName(el, model, view, controller) {
                el.onkeyup = function () {
                    model.set('firstName', this.value);
                };
                model.on('setPost', function () {
                    el.value = this.get('firstName');
                });
            },

            '#lastName': function lastName(el, model, view, controller) {
                el.onkeyup = function () {
                    model.set('lastName', this.value);
                };
                model.on('setPost', function () {
                    el.value = this.get('lastName');
                });
            }

        });
        return _this;
    }

    return _class;
}(app.Controller);

exports.default = _class;
;

},{"../../lib/app":1}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _app = require("../../lib/app");

var app = _interopRequireWildcard(_app);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

"use strict";

/*
  Extends app.Model
      Methods: `set()`, `get()`, `on('setPre'|'setPost'|'change')`
*/

var _class = function (_app$Model) {
    _inherits(_class, _app$Model);

    function _class() {
        _classCallCheck(this, _class);

        // Arbitrary method
        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(_class).call(this));

        _this.sanitize = function (props) {
            for (var p in props) {
                if (props.hasOwnProperty(p) && typeof props[p] === "string") {
                    props[p] = props[p].replace(/\W/g, '');
                }
            }
            return props;
        };

        // Set listener
        _this.on('setPre', function (props) {
            return _this.sanitize(props);
        });

        // Populate model
        _this.set({
            firstName: 'Philip',
            lastName: 'Fry'
        });

        // Set by path
        _this.set('location.year', 2052);
        return _this;
    }

    return _class;
}(app.Model);

exports.default = _class;
;

},{"../../lib/app":1}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _app = require("../../lib/app");

var app = _interopRequireWildcard(_app);

var _Model = require("./Model");

var _Model2 = _interopRequireDefault(_Model);

var _View = require("./View");

var _View2 = _interopRequireDefault(_View);

var _Controller = require("./Controller");

var _Controller2 = _interopRequireDefault(_Controller);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

"use strict";

/*
  Example module for a web form
*/

var _class = function _class() {
    _classCallCheck(this, _class);

    return app.add("userForm", _Model2.default, _View2.default, _Controller2.default);
};

exports.default = _class;
;

},{"../../lib/app":1,"./Controller":4,"./Model":5,"./View":7}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _app = require("../../lib/app");

var app = _interopRequireWildcard(_app);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

"use strict";

/*
  Extends app.View
      Properties: `el`
      Methods: `get()`, `getAll()` for DOM selectors
*/

var _class = function (_app$View) {
    _inherits(_class, _app$View);

    function _class() {
        _classCallCheck(this, _class);

        // Set DOM ref
        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(_class).call(this));

        _this.el = document.getElementById("userForm");
        return _this;
    }

    return _class;
}(app.View);

exports.default = _class;
;

},{"../../lib/app":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvbGliL2FwcC5qcyIsInNyYy9qcy9tYWluLmpzIiwic3JjL2pzL21vZHVsZXMvQm9vdC9Cb290LmpzIiwic3JjL2pzL21vZHVsZXMvVXNlckZvcm0vQ29udHJvbGxlci5qcyIsInNyYy9qcy9tb2R1bGVzL1VzZXJGb3JtL01vZGVsLmpzIiwic3JjL2pzL21vZHVsZXMvVXNlckZvcm0vVXNlckZvcm0uanMiLCJzcmMvanMvbW9kdWxlcy9Vc2VyRm9ybS9WaWV3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FBRUE7Ozs7Ozs7Ozs7UUFNZ0IsRyxHQUFBLEc7UUFhQSxHLEdBQUEsRztRQWlLQSxPLEdBQUEsTztRQXlCQSxPLEdBQUEsTztRQWtCQSxLLEdBQUEsSzs7Ozs7O0FBNU5oQixJQUFNLFVBQVUsRUFBaEI7QUFDQSxJQUFJLGlCQUFKO0FBQUEsSUFBYyxrQkFBZDs7QUFFTyxTQUFTLEdBQVQsQ0FBYSxVQUFiLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLEVBQStCLENBQS9CLEVBQWtDO0FBQ3JDLFFBQU0sT0FBTyxXQUFXLElBQUksQ0FBSixFQUF4QjtBQUNBLFFBQU0sUUFBUSxZQUFZLElBQUksQ0FBSixFQUExQjtBQUNBLFFBQU0sYUFBYSxJQUFJLENBQUosRUFBbkI7QUFDQSxVQUFNLElBQU47O0FBRUEsV0FBUSxRQUFRLFVBQVIsSUFBc0I7QUFDMUIsZUFBTyxLQURtQjtBQUUxQixjQUFNLElBRm9CO0FBRzFCLG9CQUFZO0FBSGMsS0FBOUI7QUFLSDs7QUFFTSxTQUFTLEdBQVQsQ0FBYSxVQUFiLEVBQXlCO0FBQzVCLFdBQU8sUUFBUSxVQUFSLENBQVA7QUFDSDs7QUFFRDs7OztJQUdhLEssV0FBQSxLO0FBRVQscUJBQWM7QUFBQTs7QUFDVixhQUFLLElBQUwsR0FBWSxFQUFaO0FBQ0EsYUFBSyxTQUFMLEdBQWlCO0FBQ2Isb0JBQVEsRUFE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O0FDcENEOztJQUFZLEc7O0FBQ1o7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7O0FBRUE7O0FBRUE7Ozs7YUFLSSxrQkFBYztBQUFBOztBQUNWLFdBQU8sSUFBSSxHQUFKLENBQVEsVUFBUix3REFBUDtBQUNILEM7OztBQUVKOzs7Ozs7Ozs7QUNoQkQ7O0lBQVksRzs7Ozs7Ozs7OztBQUVaOztBQUVBOzs7Ozs7Ozs7QUFPSSxzQkFBYztBQUFBOztBQUdWO0FBSFU7O0FBSVYsY0FBSyxFQUFMLEdBQVUsU0FBUyxjQUFULENBQXdCLFVBQXhCLENBQVY7QUFKVTtBQUtiOzs7RUFQd0IsSUFBSSxJOzs7QUFTaEMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qXG4gIEFwcFxuKi9cbmNvbnN0IG1vZHVsZXMgPSBbXTtcbmxldCBjdXJyVmlldywgY3Vyck1vZGVsO1xuXG5leHBvcnQgZnVuY3Rpb24gYWRkKG1vZHVsZU5hbWUsIE0sIFYsIEMpIHtcbiAgICBjb25zdCB2aWV3ID0gY3VyclZpZXcgPSBuZXcgVigpO1xuICAgIGNvbnN0IG1vZGVsID0gY3Vyck1vZGVsID0gbmV3IE0oKTtcbiAgICBjb25zdCBjb250cm9sbGVyID0gbmV3IEMoKTtcbiAgICBtb2RlbC5pbml0KCk7XG5cbiAgICByZXR1cm4gKG1vZHVsZXNbbW9kdWxlTmFtZV0gPSB7XG4gICAgICAgIG1vZGVsOiBtb2RlbCxcbiAgICAgICAgdmlldzogdmlldyxcbiAgICAgICAgY29udHJvbGxlcjogY29udHJvbGxlclxuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0KG1vZHVsZU5hbWUpIHtcbiAgICByZXR1cm4gbW9kdWxlc1ttb2R1bGVOYW1lXTtcbn1cblxuLypcbiAgTW9kZWxcbiovXG5leHBvcnQgY2xhc3MgTW9kZWx7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy50cmVlID0ge307XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzID0ge1xuICAgICAgICAgICAgc2V0UHJlOiBbXSxcbiAgICAgICAgICAgIHNldFBvc3Q6IFtdLFxuICAgICAgICAgICAgY2hhbmdlOiBbXVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGluaXQoKSB7XG4gICAgLy8gUnVuIGFueSBjYWxsYmFja3MgcmVnaXN0ZXJlZCBkdXJpbmcgaW5zdGFudGlhdGlvblxuICAgICAgICBmb3IgKHZhciBwIGluIHRoaXMuY2FsbGJhY2tzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jYWxsYmFja3MuaGFzT3duUHJvcGVydHkocCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJ1bkNhbGxiYWNrcyhwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldFByZShwcm9wcykge1xuICAgIC8vIEFsbG93cyB2YWxpZGF0aW9uIGV0Yy4gYmVmb3JlIHNldHRpbmcgcHJvcHNcbiAgICAvLyBgcHJvcHNgIGlzIGEgY29weSB0aGF0IGNhbiBiZSBzYWZlbHkgbXV0YXRlZFxuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSB0aGlzLmNhbGxiYWNrc1tcInNldFByZVwiXTtcbiAgICAgICAgbGV0IGkgPSBjYWxsYmFja3MubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBwcm9wcyA9IGNhbGxiYWNrc1tpXS5jYWxsKHRoaXMsIHByb3BzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvcHM7XG4gICAgfVxuXG4gICAgc2V0UG9zdChwcm9wcykge1xuICAgIC8vIFJ1bnMgY2FsbGJhY2tzIGFmdGVyIGBzZXQoKWAgd2hldGhlciBtb2RlbCBjaGFuZ2VkIG9yIG5vdFxuICAgICAgICB0aGlzLnJ1bkNhbGxiYWNrcyhcInNldFBvc3RcIik7XG4gICAgfVxuXG4gICAgY2hhbmdlKCkge1xuICAgIC8vIFJ1bnMgY2FsbGJhY2tzIGFmdGVyIGBzZXQoKWAgaWYgbW9kZWwgY2hhbmdlZFxuICAgICAgICB0aGlzLnJ1bkNhbGxiYWNrcyhcImNoYW5nZVwiKTtcbiAgICB9XG5cbiAgICBzZXQocHJvcHNPclBhdGgsIHZhbHVlKSB7XG4gICAgLy8gQWNjZXB0cyBwcm9wcyBvYmplY3QgYHsuLi59YCBPUiAncGF0aCcsICd2YWx1ZSdcbiAgICAgICAgbGV0IGNoYW5nZUV2ZW50O1xuXG4gICAgICAgIGlmIChpc09iamVjdChwcm9wc09yUGF0aCkpIHtcbiAgICAgICAgICAgIC8vIFJ1biBhbnkgXCJzZXRQcmVcIiBjYWxsYmFja3Mgb24gYSBjb3B5IG9mIGBwcm9wc2BcbiAgICAgICAgICAgIGNvbnN0IHByb3BzID0gdGhpcy5zZXRQcmUobWVyZ2Uoe30sIHByb3BzT3JQYXRoKSk7XG4gICAgICAgICAgICBtZXJnZSh0aGlzLnRyZWUsIHByb3BzLCBpc0NoYW5nZWQgPT4gY2hhbmdlRXZlbnQgPSBpc0NoYW5nZWQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHByb3BzT3JQYXRoO1xuICAgICAgICAgICAgLy8gUnVuIGFueSBcInNldFByZVwiIGNhbGxiYWNrc1xuICAgICAgICAgICAgdmFsdWUgPSB0aGlzLnNldFByZSh7W3BhdGhdOiB2YWx1ZX0pW3BhdGhdO1xuICAgICAgICAgICAgY2hhbmdlRXZlbnQgPSBzZXROb2RlKHRoaXMudHJlZSwgcGF0aCwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGFuZ2VFdmVudCkge1xuICAgICAgICAgICAgdGhpcy5jaGFuZ2UoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldFBvc3QoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7IC8vIEZvciBjaGFpbmluZ1xuICAgIH1cblxuICAgIGdldChwYXRoKSB7XG4gICAgICAgIHJldHVybiBnZXROb2RlKHRoaXMudHJlZSwgcGF0aCk7XG4gICAgfVxuXG4gICAgb24obGFiZWwsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW2xhYmVsXTtcbiAgICAgICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICAgICAgY2FsbGJhY2tzLnVuc2hpZnQoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzOyAvLyBGb3IgY2hhaW5pbmdcbiAgICB9XG5cbiAgICBydW5DYWxsYmFja3MobGFiZWwpIHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gdGhpcy5jYWxsYmFja3NbbGFiZWxdO1xuICAgICAgICBsZXQgaSA9IGNhbGxiYWNrcy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIGNhbGxiYWNrc1tpXS5jYWxsKHRoaXMsIHRoaXMudHJlZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0b0pTT04oKSB7XG4gICAgLy8gUmV0dXJuIHRyZWUgZm9yIEpTT04uc3RyaW5naWZ5KClcbiAgICAgICAgcmV0dXJuIHRoaXMudHJlZTtcbiAgICB9XG59XG5cbi8qXG4gIFZpZXdcbiovXG5leHBvcnQgY2xhc3MgVmlldyB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgLy8gRGVyaXZlZCBjbGFzcyBtdXN0IGFzc2lnbiBgZWxgIHByb3BlcnR5XG4gICAgfVxuXG4gICAgZ2V0KHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgIH1cblxuICAgIGdldEFsbChzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5lbC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICB9XG59XG5cbi8qXG4gIENvbnRyb2xsZXJcbiovXG5leHBvcnQgY2xhc3MgQ29udHJvbGxlciB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5tb2RlbCA9IGN1cnJNb2RlbDtcbiAgICAgICAgaWYgKGN1cnJWaWV3LmVsKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcgPSBjdXJyVmlldztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRocm93KG5ldyBFcnJvcignVmlldy5lbCByZXF1aXJlZCEnKSk7XG4gICAgICAgIH1cbiAgICAgICAgY3Vyck1vZGVsID0gbnVsbDtcbiAgICAgICAgY3VyclZpZXcgPSBudWxsO1xuICAgIH1cblxuICAgIGJpbmQoYmluZGluZ3MpIHtcbiAgICAvLyBSdW4gYmluZGluZyBmdW5jdGlvbnMgZm9yIHNlbGVjdG9ycyAod2l0aGluIHZpZXcuZWwpXG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3IgaW4gYmluZGluZ3MpIHtcbiAgICAgICAgICAgIGlmIChiaW5kaW5ncy5oYXNPd25Qcm9wZXJ0eShzZWxlY3RvcikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkb21FbHMgPSB0aGlzLnZpZXcuZWwucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgbGV0IGkgPSBkb21FbHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgYmluZGluZ3Nbc2VsZWN0b3JdLmNhbGwodGhpcywgZG9tRWxzW2ldLCB0aGlzLm1vZGVsLCB0aGlzLnZpZXcsIHRoaXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpczsgLy8gRm9yIGNoYWluaW5nXG4gICAgfVxufVxuXG4vKlxuICBVdGlsc1xuKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KG8pIHtcbiAgICByZXR1cm4gbyA9PT0gT2JqZWN0KG8pICYmXG4gICAgICAgICAgICFvLm5vZGVUeXBlICYmXG4gICAgICAgICAgICFBcnJheS5pc0FycmF5KG8pICYmXG4gICAgICAgICAgICEodHlwZW9mIG8gPT09ICdmdW5jdGlvbicpICYmXG4gICAgICAgICAgICEobyBpbnN0YW5jZW9mIFJlZ0V4cCk7XG59XG5cbmZ1bmN0aW9uIGlzTnVtZXJpYyh2YWwpIHtcbiAgICByZXR1cm4gTnVtYmVyKHBhcnNlRmxvYXQodmFsKSkgPT0gdmFsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Tm9kZSh0cmVlLCBwYXRoU3RyLCB2YWx1ZSkge1xuLy8gU2V0IG5vZGUgYXQgcGF0aCBzdHJpbmcgdG8gdmFsdWVcbi8vIEFueSBtaXNzaW5nIG5vZGVzIGFyZSBjcmVhdGVkXG4vLyBOT1RFOiBhbGwgbnVtZXJpYyBub2RlcyBiZWxvdyByb290IGFyZSBhc3N1bWVkIHRvIGJlIGFycmF5IGluZGV4ZXNcbi8vIFJldHVybnMgYm9vbGVhbiBgdHJ1ZWAgaWYgdmFsdWUgd2FzIGNoYW5nZWRcbiAgICBsZXQgaXNDaGFuZ2VkID0gZmFsc2U7XG5cbiAgICBnZXROb2RlKHRyZWUsIHBhdGhTdHIsIChjdXJyTm9kZSwgcHJvcCwgbmV4dFByb3ApID0+IHtcbiAgICAgICAgLy8gTGFzdCBzZWdtZW50IG9mIHBhdGggc3RyaW5nLCBzZXQgdmFsdWUgaWYgZGlmZmVyZW50XG4gICAgICAgIGlmIChuZXh0UHJvcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyVmFsID0gY3Vyck5vZGVbcHJvcF07XG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IGN1cnJWYWwpIHtcbiAgICAgICAgICAgICAgICBjdXJyTm9kZVtwcm9wXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIGlzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gRWxzZSBjcmVhdGUgYW55IG1pc3Npbmcgbm9kZXMgaW4gcGF0aFxuICAgICAgICBlbHNlIGlmIChjdXJyTm9kZVtwcm9wXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgYW4gYXJyYXkgaWYgbmV4dFByb3AgaXMgbnVtZXJpYywgb3RoZXJ3aXNlIGFuIG9iamVjdFxuICAgICAgICAgICAgY3Vyck5vZGVbcHJvcF0gPSBpc051bWVyaWMobmV4dFByb3ApID8gW10gOiB7fTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBpc0NoYW5nZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2RlKHRyZWUsIHBhdGhTdHIsIGVhY2hDYWxsYmFjaykge1xuLy8gR2V0IG5vZGUgZnJvbSBwYXRoIHN0cmluZ1xuLy8gT3B0aW9uYWwgYGVhY2hDYWxsYmFja2AgaXMgcGFzc2VkIChjdXJyTm9kZSwgcHJvcCwgbmV4dFByb3ApXG4vLyBUaGlzIGFsbG93cyB0aGUgbmV4dCBub2RlIHRvIGJlIGNyZWF0ZWQgb3IgY2hhbmdlZCBiZWZvcmUgZWFjaCB0cmF2ZXJzYWxcbiAgICBjb25zdCBwYXRoQXJyID0gcGF0aFN0ci5zcGxpdChcIi5cIik7XG4gICAgbGV0IGN1cnJOb2RlID0gdHJlZTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBwYXRoQXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHByb3AgPSBwYXRoQXJyW2ldO1xuICAgICAgICBpZiAoZWFjaENhbGxiYWNrKSB7XG4gICAgICAgICAgICBlYWNoQ2FsbGJhY2soY3Vyck5vZGUsIHByb3AsIHBhdGhBcnJbaSArIDFdKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY3Vyck5vZGUgPT09IHVuZGVmaW5lZCkgYnJlYWs7XG4gICAgICAgIGVsc2UgY3Vyck5vZGUgPSBjdXJyTm9kZVtwcm9wXTtcbiAgICB9XG4gICAgcmV0dXJuIGN1cnJOb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2UoIC8qIFttZXJnZUNoaWxkT2JzLF0ge30sIHt9IFssIC4uLl0gWywgY2FsbGJhY2tdICovICkge1xuLy8gQWRkIG9yIG92ZXJ3cml0ZSBhbGwgcHJvcGVydGllcyByaWdodCB0byBsZWZ0XG4vLyBCeSBkZWZhdWx0IGNoaWxkIG9iamVjdHMgYXJlIG1lcmdlZCByZWN1cnNpdmVseSAoYnV0IG5vdCBhcnJheXMpXG4vLyBJZiBhIGJvb2xlYW4gaXMgc3VwcGxpZWQsIGl0IGJlY29tZXMgYG1lcmdlQ2hpbGRPYnNgIHZhbHVlIHVudGlsIGFub3RoZXIgYm9vbGVhbiBpcyBmb3VuZFxuLy8gSWYgYSBjYWxsYmFjayBpcyBzdXBwbGllZCwgaXQgd2lsbCByZWNlaXZlIGEgYm9vbGVhbiBhcmd1bWVudCBgaXNDaGFuZ2VkYFxuICAgIGxldCBsZXZlbCA9IDAsXG4gICAgICAgIGNoYW5nZUNvdW50ID0gMCxcbiAgICAgICAgbWVyZ2VDaGlsZE9icyA9IHRydWUsXG4gICAgICAgIGNhbGxiYWNrLFxuICAgICAgICByZXN1bHQgPSBydW4uYXBwbHkodGhpcywgWzAsIGFyZ3VtZW50c10pO1xuXG4gICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayghIWNoYW5nZUNvdW50KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgZnVuY3Rpb24gcnVuKGxldmVsLCBwYXJhbXMpIHtcbiAgICAgICAgbGV0IHBhcmFtLFxuICAgICAgICAgICAgcmV0T2IsXG4gICAgICAgICAgICBwYXJhbXNDb3VudCA9IHBhcmFtcy5sZW5ndGg7XG5cbiAgICAgICAgLy8gQ2hpbGQgb2JqZWN0c1xuICAgICAgICAvLyBNZXJnZSBpbnRvIGxlZnRtb3N0IHBhcmFtIGlmIGFuIG9iamVjdCwgb3IgY3JlYXRlIG9iamVjdCB0byBtZXJnZSBpbnRvXG4gICAgICAgIGlmIChsZXZlbCkge1xuICAgICAgICAgICAgcmV0T2IgPSBpc09iamVjdChwYXJhbXNbMF0pID8gcGFyYW1zWzBdIDoge31cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyYW1zQ291bnQ7IGkrKykge1xuICAgICAgICAgICAgcGFyYW0gPSBwYXJhbXNbaV07XG5cbiAgICAgICAgICAgIC8vIFRvcCBsZXZlbCBwYXJhbXMgbWF5IGNvbnRhaW4gb3RoZXIgYXJndW1lbnRzXG4gICAgICAgICAgICBpZiAoIWxldmVsICYmIHBhcmFtICE9IG51bGwpIHsgLy8gYHVuZGVmaW5lZGAgb3IgYG51bGxgXG4gICAgICAgICAgICAgICAgLy8gRmlyc3Qgb2JqZWN0IGJlY29tZXMgcmV0dXJuZWQgb2JqZWN0XG4gICAgICAgICAgICAgICAgLy8gQWxzbyBhbGxvdyBhIERPTSBub2RlIGZvciBtZXJnaW5nIGludG9cbiAgICAgICAgICAgICAgICBpZiAoIXJldE9iICYmIGlzT2JqZWN0KHBhcmFtKSB8fCBwYXJhbS5ub2RlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXRPYiA9IHBhcmFtO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gYG1lcmdlQ2hpbGRPYnNgIGJvb2xlYW4gYXJndW1lbnRzXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhbSA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVyZ2VDaGlsZE9icyA9IHBhcmFtO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gTGFzdCBwYXNzZWQgaW4gZnVuY3Rpb24gYmVjb21lcyBjYWxsYmFja1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyYW0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayA9IHBhcmFtO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFyZXRPYikgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHAgaW4gcGFyYW0pIHtcbiAgICAgICAgICAgICAgICBpZiAocGFyYW0uaGFzT3duUHJvcGVydHkocCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsID0gcGFyYW1bcF07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gTWVyZ2UgY2hpbGQgb2JqZWN0cyAocmVjdXJzaXZlKVxuICAgICAgICAgICAgICAgICAgICBpZiAobWVyZ2VDaGlsZE9icyAmJiBpc09iamVjdCh2YWwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXRPYltwXSA9IHJ1bihsZXZlbCsxLCBbcmV0T2JbcF0sIHZhbF0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbCAhPT0gcmV0T2JbcF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZUNvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXRPYltwXSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0T2IgfHwge307XG4gICAgfVxufVxuIiwiaW1wb3J0IEJvb3QgZnJvbSBcIi4vbW9kdWxlcy9Cb290L0Jvb3RcIjtcbmltcG9ydCBVc2VyRm9ybSBmcm9tIFwiLi9tb2R1bGVzL1VzZXJGb3JtL1VzZXJGb3JtXCI7XG5cbm5ldyBCb290KClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIG5ldyBVc2VyRm9ybSgpO1xuICAgIH0pO1xuIiwiLypcbiAgQm9vdCBvcGVyYXRpb25zXG4qL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3Mge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWR5KCk7XG4gICAgfVxuXG4gICAgcmVhZHkoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gSnVzdCBhIGR1bW15IGNvbmRpdGlvblxuICAgICAgICAgICAgICAgIGlmICgvXFx3Ly50ZXN0KGxvY2F0aW9uLmhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSByZWplY3QoJ0Vycm9yJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59O1xuIiwiaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi8uLi9saWIvYXBwXCI7XG5cblwidXNlIHN0cmljdFwiXG5cbi8qXG4gIEV4dGVuZHMgYGFwcC5Db250cm9sbGVyYFxuICAgICAgUHJvcGVydGllczogYG1vZGVsYCwgYHZpZXdgXG4gICAgICBNZXRob2RzOiBgYmluZCgpYCBmb3IgRE9NIHNlbGVjdG9yc1xuKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIGV4dGVuZHMgYXBwLkNvbnRyb2xsZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgLy8gUmVuZGVyIG1vZGVsIG9uIGNoYW5nZVxuICAgICAgICB0aGlzLm1vZGVsLm9uKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuZ2V0KCcubW9kZWwnKS5pbm5lckhUTUwgPSBKU09OLnN0cmluZ2lmeSh0aGlzLm1vZGVsKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gRXhhbXBsZSAyIHdheSBiaW5kaW5nc1xuICAgICAgICB0aGlzLmJpbmQoe1xuXG4gICAgICAgICAgICAnI2ZpcnN0TmFtZSc6IChlbCwgbW9kZWwsIHZpZXcsIGNvbnRyb2xsZXIpID0+IHtcbiAgICAgICAgICAgICAgICBlbC5vbmtleXVwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZGVsLnNldCgnZmlyc3ROYW1lJywgdGhpcy52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBtb2RlbC5vbignc2V0UG9zdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBlbC52YWx1ZSA9IHRoaXMuZ2V0KCdmaXJzdE5hbWUnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICcjbGFzdE5hbWUnOiAoZWwsIG1vZGVsLCB2aWV3LCBjb250cm9sbGVyKSA9PiB7XG4gICAgICAgICAgICAgICAgZWwub25rZXl1cCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBtb2RlbC5zZXQoJ2xhc3ROYW1lJywgdGhpcy52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBtb2RlbC5vbignc2V0UG9zdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBlbC52YWx1ZSA9IHRoaXMuZ2V0KCdsYXN0TmFtZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuICAgIH1cblxufTtcbiIsImltcG9ydCAqIGFzIGFwcCBmcm9tIFwiLi4vLi4vbGliL2FwcFwiO1xuXG5cInVzZSBzdHJpY3RcIlxuXG4vKlxuICBFeHRlbmRzIGFwcC5Nb2RlbFxuICAgICAgTWV0aG9kczogYHNldCgpYCwgYGdldCgpYCwgYG9uKCdzZXRQcmUnfCdzZXRQb3N0J3wnY2hhbmdlJylgXG4qL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgZXh0ZW5kcyBhcHAuTW9kZWwge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgLy8gQXJiaXRyYXJ5IG1ldGhvZFxuICAgICAgICB0aGlzLnNhbml0aXplID0gcHJvcHMgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBwIGluIHByb3BzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByb3BzLmhhc093blByb3BlcnR5KHApICYmIHR5cGVvZiBwcm9wc1twXSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICBwcm9wc1twXSA9IHByb3BzW3BdLnJlcGxhY2UoL1xcVy9nLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHByb3BzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IGxpc3RlbmVyXG4gICAgICAgIHRoaXMub24oJ3NldFByZScsIHByb3BzID0+IHRoaXMuc2FuaXRpemUocHJvcHMpKTtcblxuICAgICAgICAvLyBQb3B1bGF0ZSBtb2RlbFxuICAgICAgICB0aGlzLnNldCh7XG4gICAgICAgICAgICBmaXJzdE5hbWU6ICdQaGlsaXAnLFxuICAgICAgICAgICAgbGFzdE5hbWU6ICdGcnknXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFNldCBieSBwYXRoXG4gICAgICAgIHRoaXMuc2V0KCdsb2NhdGlvbi55ZWFyJywgMjA1Mik7XG4gICAgfVxuXG59O1xuIiwiaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi8uLi9saWIvYXBwXCI7XG5pbXBvcnQgTW9kZWwgZnJvbSBcIi4vTW9kZWxcIlxuaW1wb3J0IFZpZXcgZnJvbSBcIi4vVmlld1wiXG5pbXBvcnQgQ29udHJvbGxlciBmcm9tIFwiLi9Db250cm9sbGVyXCJcblxuXCJ1c2Ugc3RyaWN0XCJcblxuLypcbiAgRXhhbXBsZSBtb2R1bGUgZm9yIGEgd2ViIGZvcm1cbiovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgcmV0dXJuIGFwcC5hZGQoXCJ1c2VyRm9ybVwiLCBNb2RlbCwgVmlldywgQ29udHJvbGxlcik7XG4gICAgfVxuXG59O1xuIiwiaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi8uLi9saWIvYXBwXCI7XG5cblwidXNlIHN0cmljdFwiXG5cbi8qXG4gIEV4dGVuZHMgYXBwLlZpZXdcbiAgICAgIFByb3BlcnRpZXM6IGBlbGBcbiAgICAgIE1ldGhvZHM6IGBnZXQoKWAsIGBnZXRBbGwoKWAgZm9yIERPTSBzZWxlY3RvcnNcbiovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBleHRlbmRzIGFwcC5WaWV3IHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIC8vIFNldCBET00gcmVmXG4gICAgICAgIHRoaXMuZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInVzZXJGb3JtXCIpO1xuICAgIH1cblxufTtcbiJdfQ==
