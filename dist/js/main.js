(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

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

/*
  App
*/
var modules = [];

function add(name, model, view, controller) {
    controller.model = model;
    controller.view = view;

    if (view.init) {
        view.init();
    }
    if (controller.init) {
        controller.init(model, view, controller);
    }
    if (model.init) {
        model.init();
    }

    return modules[name] = {
        model: model,
        view: view,
        controller: controller
    };
}

function get(name) {
    return modules[name];
}

/*
  Model
*/

var Model = exports.Model = function () {
    function Model(init) {
        _classCallCheck(this, Model);

        this.tree = {};
        this.callbacks = {
            setPre: [],
            setPost: [],
            change: []
        };
        this.init = init && init.bind(this);
    }

    _createClass(Model, [{
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
        value: function set(propsOrKey, value) {
            var _this = this;

            // Accepts props object `{...}` OR 'key', 'value'
            var props = isObject(propsOrKey) ? propsOrKey : _defineProperty({}, propsOrKey, value);
            // Run any "setPre" callbacks on a copy of `props`
            props = this.setPre(merge({}, props));

            merge(this.tree, props, function (isChanged) {
                if (isChanged) {
                    _this.change();
                }
                _this.setPost();
            });
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


var View = exports.View = function View(init) {
    _classCallCheck(this, View);

    this.init = init && init.bind(this);

    if (!this.el) {
        this.el = document.createElement("div");
    }
    if (!this.el.parentNode) {
        document.body.appendChild(this.el);
    }
};

/*
  Controller
*/


var Controller = exports.Controller = function () {
    function Controller(init) {
        _classCallCheck(this, Controller);

        this.init = init && init.bind(this);
    }

    _createClass(Controller, [{
        key: "bind",
        value: function bind(bindings) {
            // Run binding functions for selectors
            for (var selector in bindings) {
                if (bindings.hasOwnProperty(selector)) {
                    var domEls = document.querySelectorAll(selector);
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

function setNode(tree, pathStr, value) {
    // Set node at path string to value
    // Any missing nodes are created
    // NOTE: all numeric nodes below root are assumed to be array indexes
    getNode(tree, pathStr, function (currNode, prop, nextProp) {
        // Last segment of path string, just set value
        if (nextProp === undefined) {
            currNode[prop] = value;
        }
        // Else create any missing nodes in path
        else if (currNode[prop] === undefined) {
                // Create an array if nextProp is numeric, otherwise an object
                currNode[prop] = isNaN(nextProp) ? {} : [];
            }
    });
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

var _Boot = require("./modules/Boot");

var _Boot2 = _interopRequireDefault(_Boot);

var _UserForm = require("./modules/UserForm");

var _UserForm2 = _interopRequireDefault(_UserForm);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

new _Boot2.default().then(function () {
    new _UserForm2.default();
});

},{"./modules/Boot":3,"./modules/UserForm":4}],3:[function(require,module,exports){
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

var _app = require("../lib/app");

var app = _interopRequireWildcard(_app);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
  Example module for a web form
*/
var _class = function _class() {
    _classCallCheck(this, _class);

    app.add("userForm",

    /*
      Model - `set()`, `get()` & `on()` methods
    */
    new app.Model(function () {
        var _this = this;

        // Add any business logic
        this.sanitize = function (props) {
            for (var p in props) {
                if (props.hasOwnProperty(p)) {
                    props[p] = props[p].replace(/\W/g, '');
                }
            }
            return props;
        };

        // Set any listeners
        this.on('setPre', function (props) {
            return _this.sanitize(props);
        });

        // Populate model
        this.set({
            firstName: 'Philip',
            lastName: 'Fry'
        });
    }),

    /*
      View - `el` property
    */
    new app.View(function () {

        // Set DOM ref
        this.el = document.getElementById('userForm');

        // Populate view (just a simple example)
        this.el.innerHTML = 'First name: <input id="firstName">' + 'Surname: <input id="lastName">';
    }),

    /*
      Controller - MVC arguments, `bind()` method
    */
    new app.Controller(function (model, view, controller) {

        // Render on change
        model.on('change', function () {
            document.getElementById('userModel').innerHTML = JSON.stringify(model);
        });

        // Example 2 way bindings
        this.bind({

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
    }));
};

exports.default = _class;
;

},{"../lib/app":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvbGliL2FwcC5qcyIsInNyYy9qcy9tYWluLmpzIiwic3JjL2pzL21vZHVsZXMvQm9vdC5qcyIsInNyYy9qcy9tb2R1bGVzL1VzZXJGb3JtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7UUNLZ0IsRyxHQUFBLEc7UUFxQkEsRyxHQUFBLEc7UUF1SUEsTyxHQUFBLE87UUFpQkEsTyxHQUFBLE87UUFrQkEsSyxHQUFBLEs7Ozs7OztBQXBNaEI7OztBQUdBLElBQU0sVUFBVSxFQUFoQjs7QUFFTyxTQUFTLEdBQVQsQ0FBYSxJQUFiLEVBQW1CLEtBQW5CLEVBQTBCLElBQTFCLEVBQWdDLFVBQWhDLEVBQTRDO0FBQy9DLGVBQVcsS0FBWCxHQUFtQixLQUFuQjtBQUNBLGVBQVcsSUFBWCxHQUFrQixJQUFsQjs7QUFFQSxRQUFJLEtBQUssSUFBVCxFQUFlO0FBQ1gsYUFBSyxJQUFMO0FBQ0g7QUFDRCxRQUFJLFdBQVcsSUFBZixFQUFxQjtBQUNqQixtQkFBVyxJQUFYLENBQWdCLEtBQWhCLEVBQXVCLElBQXZCLEVBQTZCLFVBQTdCO0FBQ0g7QUFDRCxRQUFJLE1BQU0sSUFBVixFQUFnQjtBQUNaLGNBQU0sSUFBTjtBQUNIOztBQUVELFdBQVEsUUFBUSxJQUFSLElBQWdCO0FBQ3BCLGVBQU8sS0FEYTtBQUVwQixjQUFNLElBRmM7QUFHcEIsb0JBQVk7QUFIUSxLQUF4QjtBQUtIOztBQUVNLFNBQVMsR0FBVCxDQUFhLElBQWIsRUFBbUI7QUFDdEIsV0FBTyxRQUFRLElBQVIsQ0FBUDtBQUNIOztBQUVEOzs7O0lBR2EsSyxXQUFBLEs7QUFFVCxtQkFBYSxJQUFiLEVBQW1CO0FBQUE7O0FBQ2YsYUFBSyxJQUFMLEdBQVksRUFBWjtBQUNBLGFBQUssU0FBTCxHQUFpQjtBQUNiLG9CQUFRLEVBREs7QUFFYixxQkFBUyxFQUZJO0FBR2Isb0JBQVE7QUFISyxTQUFq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QU4sQ0FBVSxXQUFWLEVBQXVCLEtBQUssS0FBNUI7QUFDSCxpQkFGRDtBQUdBLHNCQUFNLEVBQU4sQ0FBUyxTQUFULEVBQW9CLFlBQVc7QUFDM0IsdUJBQUcsS0FBSCxHQUFXLEtBQUssR0FBTCxDQUFTLFdBQVQsQ0FBWDtBQUNILGlCQUZEO0FBR0gsYUFUSzs7QUFXTix5QkFBYSxrQkFBQyxFQUFELEVBQUssS0FBTCxFQUFZLElBQVosRUFBa0IsVUFBbEIsRUFBaUM7QUFDMUMsbUJBQUcsT0FBSCxHQUFhLFlBQVc7QUFDcEIsMEJBQU0sR0FBTixDQUFVLFVBQVYsRUFBc0IsS0FBSyxLQUEzQjtBQUNILGlCQUZEO0FBR0Esc0JBQU0sRUFBTixDQUFTLFNBQVQsRUFBb0IsWUFBVztBQUMzQix1QkFBRyxLQUFILEdBQVcsS0FBSyxHQUFMLENBQVMsVUFBVCxDQUFYO0FBQ0gsaUJBRkQ7QUFHSDs7QUFsQkssU0FBVjtBQXNCSCxLQTlCRCxDQS9DSjtBQStFSCxDOzs7QUFFSiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxuICBBcHBcbiovXG5jb25zdCBtb2R1bGVzID0gW107XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGQobmFtZSwgbW9kZWwsIHZpZXcsIGNvbnRyb2xsZXIpIHtcbiAgICBjb250cm9sbGVyLm1vZGVsID0gbW9kZWw7XG4gICAgY29udHJvbGxlci52aWV3ID0gdmlldztcblxuICAgIGlmICh2aWV3LmluaXQpIHtcbiAgICAgICAgdmlldy5pbml0KCk7XG4gICAgfVxuICAgIGlmIChjb250cm9sbGVyLmluaXQpIHtcbiAgICAgICAgY29udHJvbGxlci5pbml0KG1vZGVsLCB2aWV3LCBjb250cm9sbGVyKTtcbiAgICB9XG4gICAgaWYgKG1vZGVsLmluaXQpIHtcbiAgICAgICAgbW9kZWwuaW5pdCgpO1xuICAgIH1cblxuICAgIHJldHVybiAobW9kdWxlc1tuYW1lXSA9IHtcbiAgICAgICAgbW9kZWw6IG1vZGVsLFxuICAgICAgICB2aWV3OiB2aWV3LFxuICAgICAgICBjb250cm9sbGVyOiBjb250cm9sbGVyXG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXQobmFtZSkge1xuICAgIHJldHVybiBtb2R1bGVzW25hbWVdO1xufVxuXG4vKlxuICBNb2RlbFxuKi9cbmV4cG9ydCBjbGFzcyBNb2RlbHtcblxuICAgIGNvbnN0cnVjdG9yIChpbml0KSB7XG4gICAgICAgIHRoaXMudHJlZSA9IHt9O1xuICAgICAgICB0aGlzLmNhbGxiYWNrcyA9IHtcbiAgICAgICAgICAgIHNldFByZTogW10sXG4gICAgICAgICAgICBzZXRQb3N0OiBbXSxcbiAgICAgICAgICAgIGNoYW5nZTogW11cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5pbml0ID0gaW5pdCAmJiBpbml0LmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgc2V0UHJlIChwcm9wcykge1xuICAgIC8vIEFsbG93cyB2YWxpZGF0aW9uIGV0Yy4gYmVmb3JlIHNldHRpbmcgcHJvcHNcbiAgICAvLyBgcHJvcHNgIGlzIGEgY29weSB0aGF0IGNhbiBiZSBzYWZlbHkgbXV0YXRlZFxuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSB0aGlzLmNhbGxiYWNrc1tcInNldFByZVwiXTtcbiAgICAgICAgbGV0IGkgPSBjYWxsYmFja3MubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBwcm9wcyA9IGNhbGxiYWNrc1tpXS5jYWxsKHRoaXMsIHByb3BzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvcHM7XG4gICAgfVxuXG4gICAgc2V0UG9zdCAocHJvcHMpIHtcbiAgICAvLyBSdW5zIGNhbGxiYWNrcyBhZnRlciBgc2V0KClgIHdoZXRoZXIgbW9kZWwgY2hhbmdlZCBvciBub3RcbiAgICAgICAgdGhpcy5ydW5DYWxsYmFja3MoXCJzZXRQb3N0XCIpO1xuICAgIH1cblxuICAgIGNoYW5nZSAoKSB7XG4gICAgLy8gUnVucyBjYWxsYmFja3MgYWZ0ZXIgYHNldCgpYCBpZiBtb2RlbCBjaGFuZ2VkXG4gICAgICAgIHRoaXMucnVuQ2FsbGJhY2tzKFwiY2hhbmdlXCIpO1xuICAgIH1cblxuICAgIHNldCAocHJvcHNPcktleSwgdmFsdWUpIHtcbiAgICAvLyBBY2NlcHRzIHByb3BzIG9iamVjdCBgey4uLn1gIE9SICdrZXknLCAndmFsdWUnXG4gICAgICAgIGxldCBwcm9wcyA9IGlzT2JqZWN0KHByb3BzT3JLZXkpID8gcHJvcHNPcktleSA6IHtcbiAgICAgICAgICAgIFtwcm9wc09yS2V5XTogdmFsdWVcbiAgICAgICAgfTtcbiAgICAgICAgLy8gUnVuIGFueSBcInNldFByZVwiIGNhbGxiYWNrcyBvbiBhIGNvcHkgb2YgYHByb3BzYFxuICAgICAgICBwcm9wcyA9IHRoaXMuc2V0UHJlKG1lcmdlKHt9LCBwcm9wcykpO1xuXG4gICAgICAgIG1lcmdlKHRoaXMudHJlZSwgcHJvcHMsIGlzQ2hhbmdlZCA9PiB7XG4gICAgICAgICAgICBpZiAoaXNDaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2V0UG9zdCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7IC8vIEZvciBjaGFpbmluZ1xuICAgIH1cblxuICAgIGdldCAocGF0aCkge1xuICAgICAgICByZXR1cm4gZ2V0Tm9kZSh0aGlzLnRyZWUsIHBhdGgpO1xuICAgIH1cblxuICAgIG9uIChsYWJlbCwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gdGhpcy5jYWxsYmFja3NbbGFiZWxdO1xuICAgICAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgICAgICBjYWxsYmFja3MudW5zaGlmdChjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7IC8vIEZvciBjaGFpbmluZ1xuICAgIH1cblxuICAgIHJ1bkNhbGxiYWNrcyAobGFiZWwpIHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gdGhpcy5jYWxsYmFja3NbbGFiZWxdO1xuICAgICAgICBsZXQgaSA9IGNhbGxiYWNrcy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIGNhbGxiYWNrc1tpXS5jYWxsKHRoaXMsIHRoaXMudHJlZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0b0pTT04gKCkge1xuICAgIC8vIFJldHVybiB0cmVlIGZvciBKU09OLnN0cmluZ2lmeSgpXG4gICAgICAgIHJldHVybiB0aGlzLnRyZWU7XG4gICAgfVxufVxuXG4vKlxuICBWaWV3XG4qL1xuZXhwb3J0IGNsYXNzIFZpZXcge1xuXG4gICAgY29uc3RydWN0b3IgKGluaXQpIHtcbiAgICAgICAgdGhpcy5pbml0ID0gaW5pdCAmJiBpbml0LmJpbmQodGhpcyk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmVsKSB7XG4gICAgICAgICAgICB0aGlzLmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuZWwucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmVsKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLypcbiAgQ29udHJvbGxlclxuKi9cbmV4cG9ydCBjbGFzcyBDb250cm9sbGVyIHtcblxuICAgIGNvbnN0cnVjdG9yIChpbml0KSB7XG4gICAgICAgIHRoaXMuaW5pdCA9IGluaXQgJiYgaW5pdC5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIGJpbmQgKGJpbmRpbmdzKSB7XG4gICAgLy8gUnVuIGJpbmRpbmcgZnVuY3Rpb25zIGZvciBzZWxlY3RvcnNcbiAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBpbiBiaW5kaW5ncykge1xuICAgICAgICAgICAgaWYgKGJpbmRpbmdzLmhhc093blByb3BlcnR5KHNlbGVjdG9yKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRvbUVscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgIGxldCBpID0gZG9tRWxzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIGJpbmRpbmdzW3NlbGVjdG9yXS5jYWxsKHRoaXMsIGRvbUVsc1tpXSwgdGhpcy5tb2RlbCwgdGhpcy52aWV3LCB0aGlzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7IC8vIEZvciBjaGFpbmluZ1xuICAgIH1cbn1cblxuLypcbiAgVXRpbHNcbiovXG5mdW5jdGlvbiBpc09iamVjdChvKSB7XG4gICAgcmV0dXJuIG8gPT09IE9iamVjdChvKSAmJlxuICAgICAgICAgICAhby5ub2RlVHlwZSAmJlxuICAgICAgICAgICAhQXJyYXkuaXNBcnJheShvKSAmJlxuICAgICAgICAgICAhKHR5cGVvZiBvID09PSAnZnVuY3Rpb24nKSAmJlxuICAgICAgICAgICAhKG8gaW5zdGFuY2VvZiBSZWdFeHApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Tm9kZSh0cmVlLCBwYXRoU3RyLCB2YWx1ZSkge1xuLy8gU2V0IG5vZGUgYXQgcGF0aCBzdHJpbmcgdG8gdmFsdWVcbi8vIEFueSBtaXNzaW5nIG5vZGVzIGFyZSBjcmVhdGVkXG4vLyBOT1RFOiBhbGwgbnVtZXJpYyBub2RlcyBiZWxvdyByb290IGFyZSBhc3N1bWVkIHRvIGJlIGFycmF5IGluZGV4ZXNcbiAgICBnZXROb2RlKHRyZWUsIHBhdGhTdHIsIChjdXJyTm9kZSwgcHJvcCwgbmV4dFByb3ApID0+IHtcbiAgICAgICAgLy8gTGFzdCBzZWdtZW50IG9mIHBhdGggc3RyaW5nLCBqdXN0IHNldCB2YWx1ZVxuICAgICAgICBpZiAobmV4dFByb3AgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY3Vyck5vZGVbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBFbHNlIGNyZWF0ZSBhbnkgbWlzc2luZyBub2RlcyBpbiBwYXRoXG4gICAgICAgIGVsc2UgaWYgKGN1cnJOb2RlW3Byb3BdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBhbiBhcnJheSBpZiBuZXh0UHJvcCBpcyBudW1lcmljLCBvdGhlcndpc2UgYW4gb2JqZWN0XG4gICAgICAgICAgICBjdXJyTm9kZVtwcm9wXSA9IGlzTmFOKG5leHRQcm9wKSA/IHt9IDogW107XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGUodHJlZSwgcGF0aFN0ciwgZWFjaENhbGxiYWNrKSB7XG4vLyBHZXQgbm9kZSBmcm9tIHBhdGggc3RyaW5nXG4vLyBPcHRpb25hbCBgZWFjaENhbGxiYWNrYCBpcyBwYXNzZWQgKGN1cnJOb2RlLCBwcm9wLCBuZXh0UHJvcClcbi8vIFRoaXMgYWxsb3dzIHRoZSBuZXh0IG5vZGUgdG8gYmUgY3JlYXRlZCBvciBjaGFuZ2VkIGJlZm9yZSBlYWNoIHRyYXZlcnNhbFxuICAgIGNvbnN0IHBhdGhBcnIgPSBwYXRoU3RyLnNwbGl0KFwiLlwiKTtcbiAgICBsZXQgY3Vyck5vZGUgPSB0cmVlO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHBhdGhBcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgY29uc3QgcHJvcCA9IHBhdGhBcnJbaV07XG4gICAgICAgIGlmIChlYWNoQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIGVhY2hDYWxsYmFjayhjdXJyTm9kZSwgcHJvcCwgcGF0aEFycltpICsgMV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjdXJyTm9kZSA9PT0gdW5kZWZpbmVkKSBicmVhaztcbiAgICAgICAgZWxzZSBjdXJyTm9kZSA9IGN1cnJOb2RlW3Byb3BdO1xuICAgIH1cbiAgICByZXR1cm4gY3Vyck5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZSggLyogW21lcmdlQ2hpbGRPYnMsXSB7fSwge30gWywgLi4uXSBbLCBjYWxsYmFja10gKi8gKSB7XG4vLyBBZGQgb3Igb3ZlcndyaXRlIGFsbCBwcm9wZXJ0aWVzIHJpZ2h0IHRvIGxlZnRcbi8vIEJ5IGRlZmF1bHQgY2hpbGQgb2JqZWN0cyBhcmUgbWVyZ2VkIHJlY3Vyc2l2ZWx5IChidXQgbm90IGFycmF5cylcbi8vIElmIGEgYm9vbGVhbiBpcyBzdXBwbGllZCwgaXQgYmVjb21lcyBgbWVyZ2VDaGlsZE9ic2AgdmFsdWUgdW50aWwgYW5vdGhlciBib29sZWFuIGlzIGZvdW5kXG4vLyBJZiBhIGNhbGxiYWNrIGlzIHN1cHBsaWVkLCBpdCB3aWxsIHJlY2VpdmUgYSBib29sZWFuIGFyZ3VtZW50IGBpc0NoYW5nZWRgXG4gICAgbGV0IGxldmVsID0gMCxcbiAgICAgICAgY2hhbmdlQ291bnQgPSAwLFxuICAgICAgICBtZXJnZUNoaWxkT2JzID0gdHJ1ZSxcbiAgICAgICAgY2FsbGJhY2ssXG4gICAgICAgIHJlc3VsdCA9IHJ1bi5hcHBseSh0aGlzLCBbMCwgYXJndW1lbnRzXSk7XG5cbiAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKCEhY2hhbmdlQ291bnQpO1xuICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICBmdW5jdGlvbiBydW4obGV2ZWwsIHBhcmFtcykge1xuICAgICAgICBsZXQgcGFyYW0sXG4gICAgICAgICAgICByZXRPYixcbiAgICAgICAgICAgIHBhcmFtc0NvdW50ID0gcGFyYW1zLmxlbmd0aDtcblxuICAgICAgICAvLyBDaGlsZCBvYmplY3RzXG4gICAgICAgIC8vIE1lcmdlIGludG8gbGVmdG1vc3QgcGFyYW0gaWYgYW4gb2JqZWN0LCBvciBjcmVhdGUgb2JqZWN0IHRvIG1lcmdlIGludG9cbiAgICAgICAgaWYgKGxldmVsKSB7XG4gICAgICAgICAgICByZXRPYiA9IGlzT2JqZWN0KHBhcmFtc1swXSkgPyBwYXJhbXNbMF0gOiB7fVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJhbXNDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBwYXJhbSA9IHBhcmFtc1tpXTtcblxuICAgICAgICAgICAgLy8gVG9wIGxldmVsIHBhcmFtcyBtYXkgY29udGFpbiBvdGhlciBhcmd1bWVudHNcbiAgICAgICAgICAgIGlmICghbGV2ZWwgJiYgcGFyYW0gIT0gbnVsbCkgeyAvLyBgdW5kZWZpbmVkYCBvciBgbnVsbGBcbiAgICAgICAgICAgICAgICAvLyBGaXJzdCBvYmplY3QgYmVjb21lcyByZXR1cm5lZCBvYmplY3RcbiAgICAgICAgICAgICAgICAvLyBBbHNvIGFsbG93IGEgRE9NIG5vZGUgZm9yIG1lcmdpbmcgaW50b1xuICAgICAgICAgICAgICAgIGlmICghcmV0T2IgJiYgaXNPYmplY3QocGFyYW0pIHx8IHBhcmFtLm5vZGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldE9iID0gcGFyYW07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBgbWVyZ2VDaGlsZE9ic2AgYm9vbGVhbiBhcmd1bWVudHNcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtID09PSBcImJvb2xlYW5cIikge1xuICAgICAgICAgICAgICAgICAgICBtZXJnZUNoaWxkT2JzID0gcGFyYW07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBMYXN0IHBhc3NlZCBpbiBmdW5jdGlvbiBiZWNvbWVzIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhbSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gcGFyYW07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXJldE9iKSBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3QgcCBpbiBwYXJhbSkge1xuICAgICAgICAgICAgICAgIGlmIChwYXJhbS5oYXNPd25Qcm9wZXJ0eShwKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBwYXJhbVtwXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBNZXJnZSBjaGlsZCBvYmplY3RzIChyZWN1cnNpdmUpXG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXJnZUNoaWxkT2JzICYmIGlzT2JqZWN0KHZhbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldE9iW3BdID0gcnVuKGxldmVsKzEsIFtyZXRPYltwXSwgdmFsXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodmFsICE9PSByZXRPYltwXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlQ291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldE9iW3BdID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXRPYiB8fCB7fTtcbiAgICB9XG59XG4iLCJpbXBvcnQgQm9vdCBmcm9tIFwiLi9tb2R1bGVzL0Jvb3RcIjtcbmltcG9ydCBVc2VyRm9ybSBmcm9tIFwiLi9tb2R1bGVzL1VzZXJGb3JtXCI7XG5cbm5ldyBCb290KClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIG5ldyBVc2VyRm9ybSgpO1xuICAgIH0pO1xuIiwiLypcbiAgQm9vdCBvcGVyYXRpb25zXG4qL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3Mge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWR5KCk7XG4gICAgfVxuXG4gICAgcmVhZHkoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gSnVzdCBhIGR1bW15IGNvbmRpdGlvblxuICAgICAgICAgICAgICAgIGlmICgvXFx3Ly50ZXN0KGxvY2F0aW9uLmhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSByZWplY3QoJ0Vycm9yJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59O1xuIiwiaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi9saWIvYXBwXCI7XG5cbi8qXG4gIEV4YW1wbGUgbW9kdWxlIGZvciBhIHdlYiBmb3JtXG4qL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3Mge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgYXBwLmFkZChcbiAgICAgICAgICAgIFwidXNlckZvcm1cIixcblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgTW9kZWwgLSBgc2V0KClgLCBgZ2V0KClgICYgYG9uKClgIG1ldGhvZHNcbiAgICAgICAgICAgICovXG4gICAgICAgICAgICBuZXcgYXBwLk1vZGVsKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgLy8gQWRkIGFueSBidXNpbmVzcyBsb2dpY1xuICAgICAgICAgICAgICAgIHRoaXMuc2FuaXRpemUgPSBwcm9wcyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcCBpbiBwcm9wcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BzLmhhc093blByb3BlcnR5KHApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHNbcF0gPSBwcm9wc1twXS5yZXBsYWNlKC9cXFcvZywgJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wcztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBTZXQgYW55IGxpc3RlbmVyc1xuICAgICAgICAgICAgICAgIHRoaXMub24oJ3NldFByZScsIHByb3BzID0+IHRoaXMuc2FuaXRpemUocHJvcHMpKTtcblxuICAgICAgICAgICAgICAgIC8vIFBvcHVsYXRlIG1vZGVsXG4gICAgICAgICAgICAgICAgdGhpcy5zZXQoe1xuICAgICAgICAgICAgICAgICAgICBmaXJzdE5hbWU6ICdQaGlsaXAnLFxuICAgICAgICAgICAgICAgICAgICBsYXN0TmFtZTogJ0ZyeSdcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSksXG5cblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgVmlldyAtIGBlbGAgcHJvcGVydHlcbiAgICAgICAgICAgICovXG4gICAgICAgICAgICBuZXcgYXBwLlZpZXcoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBTZXQgRE9NIHJlZlxuICAgICAgICAgICAgICAgIHRoaXMuZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXNlckZvcm0nKTtcblxuICAgICAgICAgICAgICAgIC8vIFBvcHVsYXRlIHZpZXcgKGp1c3QgYSBzaW1wbGUgZXhhbXBsZSlcbiAgICAgICAgICAgICAgICB0aGlzLmVsLmlubmVySFRNTCA9ICdGaXJzdCBuYW1lOiA8aW5wdXQgaWQ9XCJmaXJzdE5hbWVcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJ1N1cm5hbWU6IDxpbnB1dCBpZD1cImxhc3ROYW1lXCI+JztcbiAgICAgICAgICAgIH0pLFxuXG5cbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgIENvbnRyb2xsZXIgLSBNVkMgYXJndW1lbnRzLCBgYmluZCgpYCBtZXRob2RcbiAgICAgICAgICAgICovXG4gICAgICAgICAgICBuZXcgYXBwLkNvbnRyb2xsZXIoZnVuY3Rpb24obW9kZWwsIHZpZXcsIGNvbnRyb2xsZXIpIHtcblxuICAgICAgICAgICAgICAgIC8vIFJlbmRlciBvbiBjaGFuZ2VcbiAgICAgICAgICAgICAgICBtb2RlbC5vbignY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c2VyTW9kZWwnKS5pbm5lckhUTUwgPSBKU09OLnN0cmluZ2lmeShtb2RlbCk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBFeGFtcGxlIDIgd2F5IGJpbmRpbmdzXG4gICAgICAgICAgICAgICAgdGhpcy5iaW5kKHtcblxuICAgICAgICAgICAgICAgICAgICAnI2ZpcnN0TmFtZSc6IChlbCwgbW9kZWwsIHZpZXcsIGNvbnRyb2xsZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLm9ua2V5dXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbC5zZXQoJ2ZpcnN0TmFtZScsIHRoaXMudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLm9uKCdzZXRQb3N0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwudmFsdWUgPSB0aGlzLmdldCgnZmlyc3ROYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAnI2xhc3ROYW1lJzogKGVsLCBtb2RlbCwgdmlldywgY29udHJvbGxlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWwub25rZXl1cCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLnNldCgnbGFzdE5hbWUnLCB0aGlzLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RlbC5vbignc2V0UG9zdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnZhbHVlID0gdGhpcy5nZXQoJ2xhc3ROYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgfVxuXG59O1xuIl19
