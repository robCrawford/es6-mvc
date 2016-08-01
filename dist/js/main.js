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
        value: function set(props, atPath) {
            var _this = this;

            // `atPath` is optional (defaults to root)
            // Alternative arguments: (key, value, atPath)
            var model = this;
            if (typeof props === "string") {
                var propsOb = {};
                propsOb[arguments[0]] = arguments[1];
                props = propsOb;
                atPath = arguments[2];
            };
            var currNode = atPath ? this.tree[atPath] : this.tree;
            // Run any "setPre" callbacks on a copy of `props`
            props = this.setPre(merge({}, props));
            merge(currNode, props, function (isChanged) {
                if (isChanged) {
                    model.change();
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


function isFunction(o) {
    return typeof o === 'function';
}

function isObject(o) {
    return o === Object(o) && !o.nodeType && !Array.isArray(o) && !isFunction(o) && !(o instanceof RegExp);
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
  See comments
*/
var _class = function _class() {
    _classCallCheck(this, _class);

    app.add("userForm",

    /*
      Model
      set()` & `get()` for data, `on()` for listeners
    */
    new app.Model(function () {
        var _this = this;

        // Runs once MVC is bound

        // Add any business logic
        this.sanitize = function (props) {
            for (var p in props) {
                if (props.hasOwnProperty(p)) {
                    props[p] = props[p].replace(/%\w\w|[\u0080-\uFFFF]+|\W/g, '');
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
      View
      `el` div is created automatically if unset
    */
    new app.View(function () {
        // Runs once MVC is bound

        // Set DOM ref
        this.el = document.getElementById('userForm');

        // Populate view (just a simple example)
        this.el.innerHTML = 'First name: <input id="firstName">' + 'Surname: <input id="lastName">';
    }),

    /*
      Controller
      `bind({...})` allows easy wiring per DOM selector by supplying MVC arguments
    */
    new app.Controller(function (model, view, controller) {
        // Runs once MVC is bound

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvbGliL2FwcC5qcyIsInNyYy9qcy9tYWluLmpzIiwic3JjL2pzL21vZHVsZXMvQm9vdC5qcyIsInNyYy9qcy9tb2R1bGVzL1VzZXJGb3JtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7UUNLZ0IsRyxHQUFBLEc7UUFxQkEsRyxHQUFBLEc7UUFnSkEsTyxHQUFBLE87UUFpQkEsTyxHQUFBLE87UUFrQkEsSyxHQUFBLEs7Ozs7QUE3TWhCOzs7QUFHQSxJQUFNLFVBQVUsRUFBaEI7O0FBRU8sU0FBUyxHQUFULENBQWEsSUFBYixFQUFtQixLQUFuQixFQUEwQixJQUExQixFQUFnQyxVQUFoQyxFQUE0QztBQUMvQyxlQUFXLEtBQVgsR0FBbUIsS0FBbkI7QUFDQSxlQUFXLElBQVgsR0FBa0IsSUFBbEI7O0FBRUEsUUFBSSxLQUFLLElBQVQsRUFBZTtBQUNYLGFBQUssSUFBTDtBQUNIO0FBQ0QsUUFBSSxXQUFXLElBQWYsRUFBcUI7QUFDakIsbUJBQVcsSUFBWCxDQUFnQixLQUFoQixFQUF1QixJQUF2QixFQUE2QixVQUE3QjtBQUNIO0FBQ0QsUUFBSSxNQUFNLElBQVYsRUFBZ0I7QUFDWixjQUFNLElBQU47QUFDSDs7QUFFRCxXQUFRLFFBQVEsSUFBUixJQUFnQjtBQUNwQixlQUFPLEtBRGE7QUFFcEIsY0FBTSxJQUZjO0FBR3BCLG9CQUFZO0FBSFEsS0FBeEI7QUFLSDs7QUFFTSxTQUFTLEdBQVQsQ0FBYSxJQUFiLEVBQW1CO0FBQ3RCLFdBQU8sUUFBUSxJQUFSLENBQVA7QUFDSDs7QUFFRDs7OztJQUdhLEssV0FBQSxLO0FBRVQsbUJBQWEsSUFBYixFQUFtQjtBQUFBOztBQUNmLGFBQUssSUFBTCxHQUFZLEVBQVo7QUFDQSxhQUFLLFNBQUwsR0FBaUI7QUFDYixvQkFBUSxFQURLO0FBRWIscUJBQVMsRUFGSTtBQUdiLG9CQUFRO0FBSEssU0FBakI7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QUVuRDtBQUNBLGNBQU0sRUFBTixDQUFTLFFBQVQsRUFBbUIsWUFBVztBQUMxQixxQkFBUyxjQUFULENBQXdCLFdBQXhCLEVBQXFDLFNBQXJDLEdBQWlELEtBQUssU0FBTCxDQUFlLEtBQWYsQ0FBakQ7QUFDSCxTQUZEOztBQUlBO0FBQ0EsYUFBSyxJQUFMLENBQVU7O0FBRU4sMEJBQWMsbUJBQUMsRUFBRCxFQUFLLEtBQUwsRUFBWSxJQUFaLEVBQWtCLFVBQWxCLEVBQWlDO0FBQzNDLG1CQUFHLE9BQUgsR0FBYSxZQUFXO0FBQ3BCLDBCQUFNLEdBQU4sQ0FBVSxXQUFWLEVBQXVCLEtBQUssS0FBNUI7QUFDSCxpQkFGRDtBQUdBLHNCQUFNLEVBQU4sQ0FBUyxTQUFULEVBQW9CLFlBQVc7QUFDM0IsdUJBQUcsS0FBSCxHQUFXLEtBQUssR0FBTCxDQUFTLFdBQVQsQ0FBWDtBQUNILGlCQUZEO0FBR0gsYUFUSzs7QUFXTix5QkFBYSxrQkFBQyxFQUFELEVBQUssS0FBTCxFQUFZLElBQVosRUFBa0IsVUFBbEIsRUFBaUM7QUFDMUMsbUJBQUcsT0FBSCxHQUFhLFlBQVc7QUFDcEIsMEJBQU0sR0FBTixDQUFVLFVBQVYsRUFBc0IsS0FBSyxLQUEzQjtBQUNILGlCQUZEO0FBR0Esc0JBQU0sRUFBTixDQUFTLFNBQVQsRUFBb0IsWUFBVztBQUMzQix1QkFBRyxLQUFILEdBQVcsS0FBSyxHQUFMLENBQVMsVUFBVCxDQUFYO0FBQ0gsaUJBRkQ7QUFHSDs7QUFsQkssU0FBVjtBQXNCSCxLQTlCRCxDQWpESjtBQWlGSCxDOzs7QUFFSiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxuICBBcHBcbiovXG5jb25zdCBtb2R1bGVzID0gW107XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGQobmFtZSwgbW9kZWwsIHZpZXcsIGNvbnRyb2xsZXIpIHtcbiAgICBjb250cm9sbGVyLm1vZGVsID0gbW9kZWw7XG4gICAgY29udHJvbGxlci52aWV3ID0gdmlldztcblxuICAgIGlmICh2aWV3LmluaXQpIHtcbiAgICAgICAgdmlldy5pbml0KCk7XG4gICAgfVxuICAgIGlmIChjb250cm9sbGVyLmluaXQpIHtcbiAgICAgICAgY29udHJvbGxlci5pbml0KG1vZGVsLCB2aWV3LCBjb250cm9sbGVyKTtcbiAgICB9XG4gICAgaWYgKG1vZGVsLmluaXQpIHtcbiAgICAgICAgbW9kZWwuaW5pdCgpO1xuICAgIH1cblxuICAgIHJldHVybiAobW9kdWxlc1tuYW1lXSA9IHtcbiAgICAgICAgbW9kZWw6IG1vZGVsLFxuICAgICAgICB2aWV3OiB2aWV3LFxuICAgICAgICBjb250cm9sbGVyOiBjb250cm9sbGVyXG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXQobmFtZSkge1xuICAgIHJldHVybiBtb2R1bGVzW25hbWVdO1xufVxuXG4vKlxuICBNb2RlbFxuKi9cbmV4cG9ydCBjbGFzcyBNb2RlbHtcblxuICAgIGNvbnN0cnVjdG9yIChpbml0KSB7XG4gICAgICAgIHRoaXMudHJlZSA9IHt9O1xuICAgICAgICB0aGlzLmNhbGxiYWNrcyA9IHtcbiAgICAgICAgICAgIHNldFByZTogW10sXG4gICAgICAgICAgICBzZXRQb3N0OiBbXSxcbiAgICAgICAgICAgIGNoYW5nZTogW11cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5pbml0ID0gaW5pdCAmJiBpbml0LmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgc2V0UHJlIChwcm9wcykge1xuICAgICAgICAvLyBBbGxvd3MgdmFsaWRhdGlvbiBldGMuIGJlZm9yZSBzZXR0aW5nIHByb3BzXG4gICAgICAgIC8vIGBwcm9wc2AgaXMgYSBjb3B5IHRoYXQgY2FuIGJlIHNhZmVseSBtdXRhdGVkXG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW1wic2V0UHJlXCJdO1xuICAgICAgICBsZXQgaSA9IGNhbGxiYWNrcy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIHByb3BzID0gY2FsbGJhY2tzW2ldLmNhbGwodGhpcywgcHJvcHMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm9wcztcbiAgICB9XG5cbiAgICBzZXRQb3N0IChwcm9wcykge1xuICAgICAgICAvLyBSdW5zIGNhbGxiYWNrcyBhZnRlciBgc2V0KClgIHdoZXRoZXIgbW9kZWwgY2hhbmdlZCBvciBub3RcbiAgICAgICAgdGhpcy5ydW5DYWxsYmFja3MoXCJzZXRQb3N0XCIpO1xuICAgIH1cblxuICAgIGNoYW5nZSAoKSB7XG4gICAgICAgIC8vIFJ1bnMgY2FsbGJhY2tzIGFmdGVyIGBzZXQoKWAgaWYgbW9kZWwgY2hhbmdlZFxuICAgICAgICB0aGlzLnJ1bkNhbGxiYWNrcyhcImNoYW5nZVwiKTtcbiAgICB9XG5cbiAgICBzZXQgKHByb3BzLCBhdFBhdGgpIHtcbiAgICAgICAgLy8gYGF0UGF0aGAgaXMgb3B0aW9uYWwgKGRlZmF1bHRzIHRvIHJvb3QpXG4gICAgICAgIC8vIEFsdGVybmF0aXZlIGFyZ3VtZW50czogKGtleSwgdmFsdWUsIGF0UGF0aClcbiAgICAgICAgY29uc3QgbW9kZWwgPSB0aGlzO1xuICAgICAgICBpZiAodHlwZW9mIHByb3BzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9wc09iID0ge307XG4gICAgICAgICAgICBwcm9wc09iW2FyZ3VtZW50c1swXV0gPSBhcmd1bWVudHNbMV07XG4gICAgICAgICAgICBwcm9wcyA9IHByb3BzT2I7XG4gICAgICAgICAgICBhdFBhdGggPSBhcmd1bWVudHNbMl07XG4gICAgICAgIH07XG4gICAgICAgIGxldCBjdXJyTm9kZSA9IChhdFBhdGggPyB0aGlzLnRyZWVbYXRQYXRoXSA6IHRoaXMudHJlZSk7XG4gICAgICAgIC8vIFJ1biBhbnkgXCJzZXRQcmVcIiBjYWxsYmFja3Mgb24gYSBjb3B5IG9mIGBwcm9wc2BcbiAgICAgICAgcHJvcHMgPSB0aGlzLnNldFByZShtZXJnZSh7fSwgcHJvcHMpKTtcbiAgICAgICAgbWVyZ2UoY3Vyck5vZGUsIHByb3BzLCBpc0NoYW5nZWQgPT4ge1xuICAgICAgICAgICAgaWYgKGlzQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgIG1vZGVsLmNoYW5nZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zZXRQb3N0KCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpczsgLy8gRm9yIGNoYWluaW5nXG4gICAgfVxuXG4gICAgZ2V0IChwYXRoKSB7XG4gICAgICAgIHJldHVybiBnZXROb2RlKHRoaXMudHJlZSwgcGF0aCk7XG4gICAgfVxuXG4gICAgb24gKGxhYmVsLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSB0aGlzLmNhbGxiYWNrc1tsYWJlbF07XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrcy51bnNoaWZ0KGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpczsgLy8gRm9yIGNoYWluaW5nXG4gICAgfVxuXG4gICAgcnVuQ2FsbGJhY2tzIChsYWJlbCkge1xuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSB0aGlzLmNhbGxiYWNrc1tsYWJlbF07XG4gICAgICAgIGxldCBpID0gY2FsbGJhY2tzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgY2FsbGJhY2tzW2ldLmNhbGwodGhpcywgdGhpcy50cmVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRvSlNPTiAoKSB7XG4gICAgICAgIC8vIFJldHVybiB0cmVlIGZvciBKU09OLnN0cmluZ2lmeSgpXG4gICAgICAgIHJldHVybiB0aGlzLnRyZWU7XG4gICAgfVxufVxuXG4vKlxuICBWaWV3XG4qL1xuZXhwb3J0IGNsYXNzIFZpZXcge1xuXG4gICAgY29uc3RydWN0b3IgKGluaXQpIHtcbiAgICAgICAgdGhpcy5pbml0ID0gaW5pdCAmJiBpbml0LmJpbmQodGhpcyk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmVsKSB7XG4gICAgICAgICAgICB0aGlzLmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuZWwucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmVsKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLypcbiAgQ29udHJvbGxlclxuKi9cbmV4cG9ydCBjbGFzcyBDb250cm9sbGVyIHtcblxuICAgIGNvbnN0cnVjdG9yIChpbml0KSB7XG4gICAgICAgIHRoaXMuaW5pdCA9IGluaXQgJiYgaW5pdC5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIGJpbmQgKGJpbmRpbmdzKSB7XG4gICAgICAgIC8vIFJ1biBiaW5kaW5nIGZ1bmN0aW9ucyBmb3Igc2VsZWN0b3JzXG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3IgaW4gYmluZGluZ3MpIHtcbiAgICAgICAgICAgIGlmIChiaW5kaW5ncy5oYXNPd25Qcm9wZXJ0eShzZWxlY3RvcikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkb21FbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICBsZXQgaSA9IGRvbUVscy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICBiaW5kaW5nc1tzZWxlY3Rvcl0uY2FsbCh0aGlzLCBkb21FbHNbaV0sIHRoaXMubW9kZWwsIHRoaXMudmlldywgdGhpcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzOyAvLyBGb3IgY2hhaW5pbmdcbiAgICB9XG59XG5cbi8qXG4gIFV0aWxzXG4qL1xuZnVuY3Rpb24gaXNGdW5jdGlvbihvKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBvID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChvKSB7XG4gICAgcmV0dXJuIG8gPT09IE9iamVjdChvKSAmJlxuICAgICAgICAgICAhby5ub2RlVHlwZSAmJlxuICAgICAgICAgICAhQXJyYXkuaXNBcnJheShvKSAmJlxuICAgICAgICAgICAhaXNGdW5jdGlvbihvKSAmJlxuICAgICAgICAgICAhKG8gaW5zdGFuY2VvZiBSZWdFeHApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Tm9kZSh0cmVlLCBwYXRoU3RyLCB2YWx1ZSkge1xuLy8gU2V0IG5vZGUgYXQgcGF0aCBzdHJpbmcgdG8gdmFsdWVcbi8vIEFueSBtaXNzaW5nIG5vZGVzIGFyZSBjcmVhdGVkXG4vLyBOT1RFOiBhbGwgbnVtZXJpYyBub2RlcyBiZWxvdyByb290IGFyZSBhc3N1bWVkIHRvIGJlIGFycmF5IGluZGV4ZXNcbiAgICBnZXROb2RlKHRyZWUsIHBhdGhTdHIsIChjdXJyTm9kZSwgcHJvcCwgbmV4dFByb3ApID0+IHtcbiAgICAgICAgLy8gTGFzdCBzZWdtZW50IG9mIHBhdGggc3RyaW5nLCBqdXN0IHNldCB2YWx1ZVxuICAgICAgICBpZiAobmV4dFByb3AgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY3Vyck5vZGVbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBFbHNlIGNyZWF0ZSBhbnkgbWlzc2luZyBub2RlcyBpbiBwYXRoXG4gICAgICAgIGVsc2UgaWYgKGN1cnJOb2RlW3Byb3BdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBhbiBhcnJheSBpZiBuZXh0UHJvcCBpcyBudW1lcmljLCBvdGhlcndpc2UgYW4gb2JqZWN0XG4gICAgICAgICAgICBjdXJyTm9kZVtwcm9wXSA9IGlzTmFOKG5leHRQcm9wKSA/IHt9IDogW107XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGUodHJlZSwgcGF0aFN0ciwgZWFjaENhbGxiYWNrKSB7XG4vLyBHZXQgbm9kZSBmcm9tIHBhdGggc3RyaW5nXG4vLyBPcHRpb25hbCBgZWFjaENhbGxiYWNrYCBpcyBwYXNzZWQgKGN1cnJOb2RlLCBwcm9wLCBuZXh0UHJvcClcbi8vIFRoaXMgYWxsb3dzIHRoZSBuZXh0IG5vZGUgdG8gYmUgY3JlYXRlZCBvciBjaGFuZ2VkIGJlZm9yZSBlYWNoIHRyYXZlcnNhbFxuICAgIGNvbnN0IHBhdGhBcnIgPSBwYXRoU3RyLnNwbGl0KFwiLlwiKTtcbiAgICBsZXQgY3Vyck5vZGUgPSB0cmVlO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHBhdGhBcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgY29uc3QgcHJvcCA9IHBhdGhBcnJbaV07XG4gICAgICAgIGlmIChlYWNoQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIGVhY2hDYWxsYmFjayhjdXJyTm9kZSwgcHJvcCwgcGF0aEFycltpICsgMV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjdXJyTm9kZSA9PT0gdW5kZWZpbmVkKSBicmVhaztcbiAgICAgICAgZWxzZSBjdXJyTm9kZSA9IGN1cnJOb2RlW3Byb3BdO1xuICAgIH1cbiAgICByZXR1cm4gY3Vyck5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZSggLyogW21lcmdlQ2hpbGRPYnMsXSB7fSwge30gWywgLi4uXSBbLCBjYWxsYmFja10gKi8gKSB7XG4vLyBBZGQgb3Igb3ZlcndyaXRlIGFsbCBwcm9wZXJ0aWVzIHJpZ2h0IHRvIGxlZnRcbi8vIEJ5IGRlZmF1bHQgY2hpbGQgb2JqZWN0cyBhcmUgbWVyZ2VkIHJlY3Vyc2l2ZWx5IChidXQgbm90IGFycmF5cylcbi8vIElmIGEgYm9vbGVhbiBpcyBzdXBwbGllZCwgaXQgYmVjb21lcyBgbWVyZ2VDaGlsZE9ic2AgdmFsdWUgdW50aWwgYW5vdGhlciBib29sZWFuIGlzIGZvdW5kXG4vLyBJZiBhIGNhbGxiYWNrIGlzIHN1cHBsaWVkLCBpdCB3aWxsIHJlY2VpdmUgYSBib29sZWFuIGFyZ3VtZW50IGBpc0NoYW5nZWRgXG4gICAgbGV0IGxldmVsID0gMCxcbiAgICAgICAgY2hhbmdlQ291bnQgPSAwLFxuICAgICAgICBtZXJnZUNoaWxkT2JzID0gdHJ1ZSxcbiAgICAgICAgY2FsbGJhY2ssXG4gICAgICAgIHJlc3VsdCA9IHJ1bi5hcHBseSh0aGlzLCBbMCwgYXJndW1lbnRzXSk7XG5cbiAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKCEhY2hhbmdlQ291bnQpO1xuICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICBmdW5jdGlvbiBydW4obGV2ZWwsIHBhcmFtcykge1xuICAgICAgICBsZXQgcGFyYW0sXG4gICAgICAgICAgICByZXRPYixcbiAgICAgICAgICAgIHBhcmFtc0NvdW50ID0gcGFyYW1zLmxlbmd0aDtcblxuICAgICAgICAvLyBDaGlsZCBvYmplY3RzXG4gICAgICAgIC8vIE1lcmdlIGludG8gbGVmdG1vc3QgcGFyYW0gaWYgYW4gb2JqZWN0LCBvciBjcmVhdGUgb2JqZWN0IHRvIG1lcmdlIGludG9cbiAgICAgICAgaWYgKGxldmVsKSB7XG4gICAgICAgICAgICByZXRPYiA9IGlzT2JqZWN0KHBhcmFtc1swXSkgPyBwYXJhbXNbMF0gOiB7fVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJhbXNDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBwYXJhbSA9IHBhcmFtc1tpXTtcblxuICAgICAgICAgICAgLy8gVG9wIGxldmVsIHBhcmFtcyBtYXkgY29udGFpbiBvdGhlciBhcmd1bWVudHNcbiAgICAgICAgICAgIGlmICghbGV2ZWwgJiYgcGFyYW0gIT0gbnVsbCkgeyAvLyBgdW5kZWZpbmVkYCBvciBgbnVsbGBcbiAgICAgICAgICAgICAgICAvLyBGaXJzdCBvYmplY3QgYmVjb21lcyByZXR1cm5lZCBvYmplY3RcbiAgICAgICAgICAgICAgICAvLyBBbHNvIGFsbG93IGEgRE9NIG5vZGUgZm9yIG1lcmdpbmcgaW50b1xuICAgICAgICAgICAgICAgIGlmICghcmV0T2IgJiYgaXNPYmplY3QocGFyYW0pIHx8IHBhcmFtLm5vZGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldE9iID0gcGFyYW07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBgbWVyZ2VDaGlsZE9ic2AgYm9vbGVhbiBhcmd1bWVudHNcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtID09PSBcImJvb2xlYW5cIikge1xuICAgICAgICAgICAgICAgICAgICBtZXJnZUNoaWxkT2JzID0gcGFyYW07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBMYXN0IHBhc3NlZCBpbiBmdW5jdGlvbiBiZWNvbWVzIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhbSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gcGFyYW07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXJldE9iKSBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAobGV0IHAgaW4gcGFyYW0pIHtcbiAgICAgICAgICAgICAgICBpZiAocGFyYW0uaGFzT3duUHJvcGVydHkocCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsID0gcGFyYW1bcF07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gTWVyZ2UgY2hpbGQgb2JqZWN0cyAocmVjdXJzaXZlKVxuICAgICAgICAgICAgICAgICAgICBpZiAobWVyZ2VDaGlsZE9icyAmJiBpc09iamVjdCh2YWwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXRPYltwXSA9IHJ1bihsZXZlbCsxLCBbcmV0T2JbcF0sIHZhbF0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbCAhPT0gcmV0T2JbcF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZUNvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXRPYltwXSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0T2IgfHwge307XG4gICAgfVxufVxuIiwiaW1wb3J0IEJvb3QgZnJvbSBcIi4vbW9kdWxlcy9Cb290XCI7XG5pbXBvcnQgVXNlckZvcm0gZnJvbSBcIi4vbW9kdWxlcy9Vc2VyRm9ybVwiO1xuXG5uZXcgQm9vdCgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBuZXcgVXNlckZvcm0oKTtcbiAgICB9KTtcbiIsIi8qXG4gIEJvb3Qgb3BlcmF0aW9uc1xuKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkeSgpO1xuICAgIH1cblxuICAgIHJlYWR5KCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIEp1c3QgYSBkdW1teSBjb25kaXRpb25cbiAgICAgICAgICAgICAgICBpZiAoL1xcdy8udGVzdChsb2NhdGlvbi5ocmVmKSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgcmVqZWN0KCdFcnJvcicpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxufTtcbiIsImltcG9ydCAqIGFzIGFwcCBmcm9tIFwiLi4vbGliL2FwcFwiO1xuXG4vKlxuICBFeGFtcGxlIG1vZHVsZSBmb3IgYSB3ZWIgZm9ybVxuICBTZWUgY29tbWVudHNcbiovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICBhcHAuYWRkKFxuICAgICAgICAgICAgXCJ1c2VyRm9ybVwiLFxuXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgICBNb2RlbFxuICAgICAgICAgICAgICBzZXQoKWAgJiBgZ2V0KClgIGZvciBkYXRhLCBgb24oKWAgZm9yIGxpc3RlbmVyc1xuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG5ldyBhcHAuTW9kZWwoZnVuY3Rpb24oKSB7IC8vIFJ1bnMgb25jZSBNVkMgaXMgYm91bmRcblxuICAgICAgICAgICAgICAgIC8vIEFkZCBhbnkgYnVzaW5lc3MgbG9naWNcbiAgICAgICAgICAgICAgICB0aGlzLnNhbml0aXplID0gcHJvcHMgPT4ge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwIGluIHByb3BzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkocCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wc1twXSA9IHByb3BzW3BdLnJlcGxhY2UoLyVcXHdcXHd8W1xcdTAwODAtXFx1RkZGRl0rfFxcVy9nLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb3BzO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFNldCBhbnkgbGlzdGVuZXJzXG4gICAgICAgICAgICAgICAgdGhpcy5vbignc2V0UHJlJywgcHJvcHMgPT4gdGhpcy5zYW5pdGl6ZShwcm9wcykpO1xuXG4gICAgICAgICAgICAgICAgLy8gUG9wdWxhdGUgbW9kZWxcbiAgICAgICAgICAgICAgICB0aGlzLnNldCh7XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0TmFtZTogJ1BoaWxpcCcsXG4gICAgICAgICAgICAgICAgICAgIGxhc3ROYW1lOiAnRnJ5J1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSksXG5cblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgVmlld1xuICAgICAgICAgICAgICBgZWxgIGRpdiBpcyBjcmVhdGVkIGF1dG9tYXRpY2FsbHkgaWYgdW5zZXRcbiAgICAgICAgICAgICovXG4gICAgICAgICAgICBuZXcgYXBwLlZpZXcoZnVuY3Rpb24oKSB7IC8vIFJ1bnMgb25jZSBNVkMgaXMgYm91bmRcblxuICAgICAgICAgICAgICAgIC8vIFNldCBET00gcmVmXG4gICAgICAgICAgICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c2VyRm9ybScpO1xuXG4gICAgICAgICAgICAgICAgLy8gUG9wdWxhdGUgdmlldyAoanVzdCBhIHNpbXBsZSBleGFtcGxlKVxuICAgICAgICAgICAgICAgIHRoaXMuZWwuaW5uZXJIVE1MID0gJ0ZpcnN0IG5hbWU6IDxpbnB1dCBpZD1cImZpcnN0TmFtZVwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnU3VybmFtZTogPGlucHV0IGlkPVwibGFzdE5hbWVcIj4nO1xuICAgICAgICAgICAgfSksXG5cblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgQ29udHJvbGxlclxuICAgICAgICAgICAgICBgYmluZCh7Li4ufSlgIGFsbG93cyBlYXN5IHdpcmluZyBwZXIgRE9NIHNlbGVjdG9yIGJ5IHN1cHBseWluZyBNVkMgYXJndW1lbnRzXG4gICAgICAgICAgICAqL1xuICAgICAgICAgICAgbmV3IGFwcC5Db250cm9sbGVyKGZ1bmN0aW9uKG1vZGVsLCB2aWV3LCBjb250cm9sbGVyKSB7IC8vIFJ1bnMgb25jZSBNVkMgaXMgYm91bmRcblxuICAgICAgICAgICAgICAgIC8vIFJlbmRlciBvbiBjaGFuZ2VcbiAgICAgICAgICAgICAgICBtb2RlbC5vbignY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c2VyTW9kZWwnKS5pbm5lckhUTUwgPSBKU09OLnN0cmluZ2lmeShtb2RlbCk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBFeGFtcGxlIDIgd2F5IGJpbmRpbmdzXG4gICAgICAgICAgICAgICAgdGhpcy5iaW5kKHtcblxuICAgICAgICAgICAgICAgICAgICAnI2ZpcnN0TmFtZSc6IChlbCwgbW9kZWwsIHZpZXcsIGNvbnRyb2xsZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLm9ua2V5dXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbC5zZXQoJ2ZpcnN0TmFtZScsIHRoaXMudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLm9uKCdzZXRQb3N0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwudmFsdWUgPSB0aGlzLmdldCgnZmlyc3ROYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAnI2xhc3ROYW1lJzogKGVsLCBtb2RlbCwgdmlldywgY29udHJvbGxlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWwub25rZXl1cCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLnNldCgnbGFzdE5hbWUnLCB0aGlzLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RlbC5vbignc2V0UG9zdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnZhbHVlID0gdGhpcy5nZXQoJ2xhc3ROYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgfVxuXG59O1xuIl19
