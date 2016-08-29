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
                if (props.hasOwnProperty(p) && typeof props[p] === "string") {
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

        // Set by path
        this.set('location.year', 2052);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvbGliL2FwcC5qcyIsInNyYy9qcy9tYWluLmpzIiwic3JjL2pzL21vZHVsZXMvQm9vdC5qcyIsInNyYy9qcy9tb2R1bGVzL1VzZXJGb3JtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FBRUE7Ozs7Ozs7Ozs7UUFLZ0IsRyxHQUFBLEc7UUFxQkEsRyxHQUFBLEc7UUFnSkEsTyxHQUFBLE87UUF5QkEsTyxHQUFBLE87UUFrQkEsSyxHQUFBLEs7Ozs7OztBQWxOaEIsSUFBTSxVQUFVLEVBQWhCOztBQUVPLFNBQVMsR0FBVCxDQUFhLElBQWIsRUFBbUIsS0FBbkIsRUFBMEIsSUFBMUIsRUFBZ0MsVUFBaEMsRUFBNEM7QUFDL0MsZUFBVyxLQUFYLEdBQW1CLEtBQW5CO0FBQ0EsZUFBVyxJQUFYLEdBQWtCLElBQWxCOztBQUVBLFFBQUksS0FBSyxJQUFULEVBQWU7QUFDWCxhQUFLLElBQUw7QUFDSDtBQUNELFFBQUksV0FBVyxJQUFmLEVBQXFCO0FBQ2pCLG1CQUFXLElBQVgsQ0FBZ0IsS0FBaEIsRUFBdUIsSUFBdkIsRUFBNkIsVUFBN0I7QUFDSDtBQUNELFFBQUksTUFBTSxJQUFWLEVBQWdCO0FBQ1osY0FBTSxJQUFOO0FBQ0g7O0FBRUQsV0FBUSxRQUFRLElBQVIsSUFBZ0I7QUFDcEIsZUFBTyxLQURhO0FBRXBCLGNBQU0sSUFGYztBQUdwQixvQkFBWTtBQUhRLEtBQXhCO0FBS0g7O0FBRU0sU0FBUyxHQUFULENBQWEsSUFBYixFQUFtQjtBQUN0QixXQUFPLFFBQVEsSUFBUixDQUFQO0FBQ0g7O0FBRUQ7Ozs7SUFHYSxLLFdBQUEsSztBQUVULG1CQUFhLElBQWIsRUFBbUI7QUFBQTs7QUFDZixhQUFLLElBQUwsR0FBWSxFQUFaO0FBQ0EsYUFBSyxTQUFMLEdBQWlCO0FBQ2Isb0JBQVEsRUFESztBQUViLHFCQUFTLEVBRkk7QUFHYixvQkFBUTtBQUhL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cmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcblxuLypcbiAgQXBwXG4qL1xuY29uc3QgbW9kdWxlcyA9IFtdO1xuXG5leHBvcnQgZnVuY3Rpb24gYWRkKG5hbWUsIG1vZGVsLCB2aWV3LCBjb250cm9sbGVyKSB7XG4gICAgY29udHJvbGxlci5tb2RlbCA9IG1vZGVsO1xuICAgIGNvbnRyb2xsZXIudmlldyA9IHZpZXc7XG5cbiAgICBpZiAodmlldy5pbml0KSB7XG4gICAgICAgIHZpZXcuaW5pdCgpO1xuICAgIH1cbiAgICBpZiAoY29udHJvbGxlci5pbml0KSB7XG4gICAgICAgIGNvbnRyb2xsZXIuaW5pdChtb2RlbCwgdmlldywgY29udHJvbGxlcik7XG4gICAgfVxuICAgIGlmIChtb2RlbC5pbml0KSB7XG4gICAgICAgIG1vZGVsLmluaXQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gKG1vZHVsZXNbbmFtZV0gPSB7XG4gICAgICAgIG1vZGVsOiBtb2RlbCxcbiAgICAgICAgdmlldzogdmlldyxcbiAgICAgICAgY29udHJvbGxlcjogY29udHJvbGxlclxuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0KG5hbWUpIHtcbiAgICByZXR1cm4gbW9kdWxlc1tuYW1lXTtcbn1cblxuLypcbiAgTW9kZWxcbiovXG5leHBvcnQgY2xhc3MgTW9kZWx7XG5cbiAgICBjb25zdHJ1Y3RvciAoaW5pdCkge1xuICAgICAgICB0aGlzLnRyZWUgPSB7fTtcbiAgICAgICAgdGhpcy5jYWxsYmFja3MgPSB7XG4gICAgICAgICAgICBzZXRQcmU6IFtdLFxuICAgICAgICAgICAgc2V0UG9zdDogW10sXG4gICAgICAgICAgICBjaGFuZ2U6IFtdXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaW5pdCA9IGluaXQgJiYgaW5pdC5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIHNldFByZSAocHJvcHMpIHtcbiAgICAvLyBBbGxvd3MgdmFsaWRhdGlvbiBldGMuIGJlZm9yZSBzZXR0aW5nIHByb3BzXG4gICAgLy8gYHByb3BzYCBpcyBhIGNvcHkgdGhhdCBjYW4gYmUgc2FmZWx5IG11dGF0ZWRcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gdGhpcy5jYWxsYmFja3NbXCJzZXRQcmVcIl07XG4gICAgICAgIGxldCBpID0gY2FsbGJhY2tzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgcHJvcHMgPSBjYWxsYmFja3NbaV0uY2FsbCh0aGlzLCBwcm9wcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb3BzO1xuICAgIH1cblxuICAgIHNldFBvc3QgKHByb3BzKSB7XG4gICAgLy8gUnVucyBjYWxsYmFja3MgYWZ0ZXIgYHNldCgpYCB3aGV0aGVyIG1vZGVsIGNoYW5nZWQgb3Igbm90XG4gICAgICAgIHRoaXMucnVuQ2FsbGJhY2tzKFwic2V0UG9zdFwiKTtcbiAgICB9XG5cbiAgICBjaGFuZ2UgKCkge1xuICAgIC8vIFJ1bnMgY2FsbGJhY2tzIGFmdGVyIGBzZXQoKWAgaWYgbW9kZWwgY2hhbmdlZFxuICAgICAgICB0aGlzLnJ1bkNhbGxiYWNrcyhcImNoYW5nZVwiKTtcbiAgICB9XG5cbiAgICBzZXQgKHByb3BzT3JQYXRoLCB2YWx1ZSkge1xuICAgIC8vIEFjY2VwdHMgcHJvcHMgb2JqZWN0IGB7Li4ufWAgT1IgJ3BhdGgnLCAndmFsdWUnXG4gICAgICAgIGxldCBjaGFuZ2VFdmVudDtcblxuICAgICAgICBpZiAoaXNPYmplY3QocHJvcHNPclBhdGgpKSB7XG4gICAgICAgICAgICAvLyBSdW4gYW55IFwic2V0UHJlXCIgY2FsbGJhY2tzIG9uIGEgY29weSBvZiBgcHJvcHNgXG4gICAgICAgICAgICBjb25zdCBwcm9wcyA9IHRoaXMuc2V0UHJlKG1lcmdlKHt9LCBwcm9wc09yUGF0aCkpO1xuICAgICAgICAgICAgbWVyZ2UodGhpcy50cmVlLCBwcm9wcywgaXNDaGFuZ2VkID0+IGNoYW5nZUV2ZW50ID0gaXNDaGFuZ2VkKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBwcm9wc09yUGF0aDtcbiAgICAgICAgICAgIC8vIFJ1biBhbnkgXCJzZXRQcmVcIiBjYWxsYmFja3NcbiAgICAgICAgICAgIHZhbHVlID0gdGhpcy5zZXRQcmUoe1twYXRoXTogdmFsdWV9KVtwYXRoXTtcbiAgICAgICAgICAgIGNoYW5nZUV2ZW50ID0gc2V0Tm9kZSh0aGlzLnRyZWUsIHBhdGgsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhbmdlRXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRQb3N0KCk7XG4gICAgICAgIHJldHVybiB0aGlzOyAvLyBGb3IgY2hhaW5pbmdcbiAgICB9XG5cbiAgICBnZXQgKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIGdldE5vZGUodGhpcy50cmVlLCBwYXRoKTtcbiAgICB9XG5cbiAgICBvbiAobGFiZWwsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW2xhYmVsXTtcbiAgICAgICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICAgICAgY2FsbGJhY2tzLnVuc2hpZnQoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzOyAvLyBGb3IgY2hhaW5pbmdcbiAgICB9XG5cbiAgICBydW5DYWxsYmFja3MgKGxhYmVsKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW2xhYmVsXTtcbiAgICAgICAgbGV0IGkgPSBjYWxsYmFja3MubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBjYWxsYmFja3NbaV0uY2FsbCh0aGlzLCB0aGlzLnRyZWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdG9KU09OICgpIHtcbiAgICAvLyBSZXR1cm4gdHJlZSBmb3IgSlNPTi5zdHJpbmdpZnkoKVxuICAgICAgICByZXR1cm4gdGhpcy50cmVlO1xuICAgIH1cbn1cblxuLypcbiAgVmlld1xuKi9cbmV4cG9ydCBjbGFzcyBWaWV3IHtcblxuICAgIGNvbnN0cnVjdG9yIChpbml0KSB7XG4gICAgICAgIHRoaXMuaW5pdCA9IGluaXQgJiYgaW5pdC5iaW5kKHRoaXMpO1xuXG4gICAgICAgIGlmICghdGhpcy5lbCkge1xuICAgICAgICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmVsLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5lbCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qXG4gIENvbnRyb2xsZXJcbiovXG5leHBvcnQgY2xhc3MgQ29udHJvbGxlciB7XG5cbiAgICBjb25zdHJ1Y3RvciAoaW5pdCkge1xuICAgICAgICB0aGlzLmluaXQgPSBpbml0ICYmIGluaXQuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBiaW5kIChiaW5kaW5ncykge1xuICAgIC8vIFJ1biBiaW5kaW5nIGZ1bmN0aW9ucyBmb3Igc2VsZWN0b3JzXG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3IgaW4gYmluZGluZ3MpIHtcbiAgICAgICAgICAgIGlmIChiaW5kaW5ncy5oYXNPd25Qcm9wZXJ0eShzZWxlY3RvcikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkb21FbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICBsZXQgaSA9IGRvbUVscy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICBiaW5kaW5nc1tzZWxlY3Rvcl0uY2FsbCh0aGlzLCBkb21FbHNbaV0sIHRoaXMubW9kZWwsIHRoaXMudmlldywgdGhpcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzOyAvLyBGb3IgY2hhaW5pbmdcbiAgICB9XG59XG5cbi8qXG4gIFV0aWxzXG4qL1xuZnVuY3Rpb24gaXNPYmplY3Qobykge1xuICAgIHJldHVybiBvID09PSBPYmplY3QobykgJiZcbiAgICAgICAgICAgIW8ubm9kZVR5cGUgJiZcbiAgICAgICAgICAgIUFycmF5LmlzQXJyYXkobykgJiZcbiAgICAgICAgICAgISh0eXBlb2YgbyA9PT0gJ2Z1bmN0aW9uJykgJiZcbiAgICAgICAgICAgIShvIGluc3RhbmNlb2YgUmVnRXhwKTtcbn1cblxuZnVuY3Rpb24gaXNOdW1lcmljKHZhbCkge1xuICAgIHJldHVybiBOdW1iZXIocGFyc2VGbG9hdCh2YWwpKSA9PSB2YWw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXROb2RlKHRyZWUsIHBhdGhTdHIsIHZhbHVlKSB7XG4vLyBTZXQgbm9kZSBhdCBwYXRoIHN0cmluZyB0byB2YWx1ZVxuLy8gQW55IG1pc3Npbmcgbm9kZXMgYXJlIGNyZWF0ZWRcbi8vIE5PVEU6IGFsbCBudW1lcmljIG5vZGVzIGJlbG93IHJvb3QgYXJlIGFzc3VtZWQgdG8gYmUgYXJyYXkgaW5kZXhlc1xuLy8gUmV0dXJucyBib29sZWFuIGB0cnVlYCBpZiB2YWx1ZSB3YXMgY2hhbmdlZFxuICAgIGxldCBpc0NoYW5nZWQgPSBmYWxzZTtcblxuICAgIGdldE5vZGUodHJlZSwgcGF0aFN0ciwgKGN1cnJOb2RlLCBwcm9wLCBuZXh0UHJvcCkgPT4ge1xuICAgICAgICAvLyBMYXN0IHNlZ21lbnQgb2YgcGF0aCBzdHJpbmcsIHNldCB2YWx1ZSBpZiBkaWZmZXJlbnRcbiAgICAgICAgaWYgKG5leHRQcm9wID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJWYWwgPSBjdXJyTm9kZVtwcm9wXTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gY3VyclZhbCkge1xuICAgICAgICAgICAgICAgIGN1cnJOb2RlW3Byb3BdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgaXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBFbHNlIGNyZWF0ZSBhbnkgbWlzc2luZyBub2RlcyBpbiBwYXRoXG4gICAgICAgIGVsc2UgaWYgKGN1cnJOb2RlW3Byb3BdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBhbiBhcnJheSBpZiBuZXh0UHJvcCBpcyBudW1lcmljLCBvdGhlcndpc2UgYW4gb2JqZWN0XG4gICAgICAgICAgICBjdXJyTm9kZVtwcm9wXSA9IGlzTnVtZXJpYyhuZXh0UHJvcCkgPyBbXSA6IHt9O1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGlzQ2hhbmdlZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGUodHJlZSwgcGF0aFN0ciwgZWFjaENhbGxiYWNrKSB7XG4vLyBHZXQgbm9kZSBmcm9tIHBhdGggc3RyaW5nXG4vLyBPcHRpb25hbCBgZWFjaENhbGxiYWNrYCBpcyBwYXNzZWQgKGN1cnJOb2RlLCBwcm9wLCBuZXh0UHJvcClcbi8vIFRoaXMgYWxsb3dzIHRoZSBuZXh0IG5vZGUgdG8gYmUgY3JlYXRlZCBvciBjaGFuZ2VkIGJlZm9yZSBlYWNoIHRyYXZlcnNhbFxuICAgIGNvbnN0IHBhdGhBcnIgPSBwYXRoU3RyLnNwbGl0KFwiLlwiKTtcbiAgICBsZXQgY3Vyck5vZGUgPSB0cmVlO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHBhdGhBcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgY29uc3QgcHJvcCA9IHBhdGhBcnJbaV07XG4gICAgICAgIGlmIChlYWNoQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIGVhY2hDYWxsYmFjayhjdXJyTm9kZSwgcHJvcCwgcGF0aEFycltpICsgMV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjdXJyTm9kZSA9PT0gdW5kZWZpbmVkKSBicmVhaztcbiAgICAgICAgZWxzZSBjdXJyTm9kZSA9IGN1cnJOb2RlW3Byb3BdO1xuICAgIH1cbiAgICByZXR1cm4gY3Vyck5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZSggLyogW21lcmdlQ2hpbGRPYnMsXSB7fSwge30gWywgLi4uXSBbLCBjYWxsYmFja10gKi8gKSB7XG4vLyBBZGQgb3Igb3ZlcndyaXRlIGFsbCBwcm9wZXJ0aWVzIHJpZ2h0IHRvIGxlZnRcbi8vIEJ5IGRlZmF1bHQgY2hpbGQgb2JqZWN0cyBhcmUgbWVyZ2VkIHJlY3Vyc2l2ZWx5IChidXQgbm90IGFycmF5cylcbi8vIElmIGEgYm9vbGVhbiBpcyBzdXBwbGllZCwgaXQgYmVjb21lcyBgbWVyZ2VDaGlsZE9ic2AgdmFsdWUgdW50aWwgYW5vdGhlciBib29sZWFuIGlzIGZvdW5kXG4vLyBJZiBhIGNhbGxiYWNrIGlzIHN1cHBsaWVkLCBpdCB3aWxsIHJlY2VpdmUgYSBib29sZWFuIGFyZ3VtZW50IGBpc0NoYW5nZWRgXG4gICAgbGV0IGxldmVsID0gMCxcbiAgICAgICAgY2hhbmdlQ291bnQgPSAwLFxuICAgICAgICBtZXJnZUNoaWxkT2JzID0gdHJ1ZSxcbiAgICAgICAgY2FsbGJhY2ssXG4gICAgICAgIHJlc3VsdCA9IHJ1bi5hcHBseSh0aGlzLCBbMCwgYXJndW1lbnRzXSk7XG5cbiAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKCEhY2hhbmdlQ291bnQpO1xuICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICBmdW5jdGlvbiBydW4obGV2ZWwsIHBhcmFtcykge1xuICAgICAgICBsZXQgcGFyYW0sXG4gICAgICAgICAgICByZXRPYixcbiAgICAgICAgICAgIHBhcmFtc0NvdW50ID0gcGFyYW1zLmxlbmd0aDtcblxuICAgICAgICAvLyBDaGlsZCBvYmplY3RzXG4gICAgICAgIC8vIE1lcmdlIGludG8gbGVmdG1vc3QgcGFyYW0gaWYgYW4gb2JqZWN0LCBvciBjcmVhdGUgb2JqZWN0IHRvIG1lcmdlIGludG9cbiAgICAgICAgaWYgKGxldmVsKSB7XG4gICAgICAgICAgICByZXRPYiA9IGlzT2JqZWN0KHBhcmFtc1swXSkgPyBwYXJhbXNbMF0gOiB7fVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJhbXNDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBwYXJhbSA9IHBhcmFtc1tpXTtcblxuICAgICAgICAgICAgLy8gVG9wIGxldmVsIHBhcmFtcyBtYXkgY29udGFpbiBvdGhlciBhcmd1bWVudHNcbiAgICAgICAgICAgIGlmICghbGV2ZWwgJiYgcGFyYW0gIT0gbnVsbCkgeyAvLyBgdW5kZWZpbmVkYCBvciBgbnVsbGBcbiAgICAgICAgICAgICAgICAvLyBGaXJzdCBvYmplY3QgYmVjb21lcyByZXR1cm5lZCBvYmplY3RcbiAgICAgICAgICAgICAgICAvLyBBbHNvIGFsbG93IGEgRE9NIG5vZGUgZm9yIG1lcmdpbmcgaW50b1xuICAgICAgICAgICAgICAgIGlmICghcmV0T2IgJiYgaXNPYmplY3QocGFyYW0pIHx8IHBhcmFtLm5vZGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldE9iID0gcGFyYW07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBgbWVyZ2VDaGlsZE9ic2AgYm9vbGVhbiBhcmd1bWVudHNcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtID09PSBcImJvb2xlYW5cIikge1xuICAgICAgICAgICAgICAgICAgICBtZXJnZUNoaWxkT2JzID0gcGFyYW07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBMYXN0IHBhc3NlZCBpbiBmdW5jdGlvbiBiZWNvbWVzIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhbSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gcGFyYW07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXJldE9iKSBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3QgcCBpbiBwYXJhbSkge1xuICAgICAgICAgICAgICAgIGlmIChwYXJhbS5oYXNPd25Qcm9wZXJ0eShwKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBwYXJhbVtwXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBNZXJnZSBjaGlsZCBvYmplY3RzIChyZWN1cnNpdmUpXG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXJnZUNoaWxkT2JzICYmIGlzT2JqZWN0KHZhbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldE9iW3BdID0gcnVuKGxldmVsKzEsIFtyZXRPYltwXSwgdmFsXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodmFsICE9PSByZXRPYltwXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlQ291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldE9iW3BdID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXRPYiB8fCB7fTtcbiAgICB9XG59XG4iLCJpbXBvcnQgQm9vdCBmcm9tIFwiLi9tb2R1bGVzL0Jvb3RcIjtcbmltcG9ydCBVc2VyRm9ybSBmcm9tIFwiLi9tb2R1bGVzL1VzZXJGb3JtXCI7XG5cbm5ldyBCb290KClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIG5ldyBVc2VyRm9ybSgpO1xuICAgIH0pO1xuIiwiLypcbiAgQm9vdCBvcGVyYXRpb25zXG4qL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3Mge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWR5KCk7XG4gICAgfVxuXG4gICAgcmVhZHkoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gSnVzdCBhIGR1bW15IGNvbmRpdGlvblxuICAgICAgICAgICAgICAgIGlmICgvXFx3Ly50ZXN0KGxvY2F0aW9uLmhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSByZWplY3QoJ0Vycm9yJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59O1xuIiwiaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi9saWIvYXBwXCI7XG5cbi8qXG4gIEV4YW1wbGUgbW9kdWxlIGZvciBhIHdlYiBmb3JtXG4qL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3Mge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgYXBwLmFkZChcbiAgICAgICAgICAgIFwidXNlckZvcm1cIixcblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgTW9kZWwgLSBgc2V0KClgLCBgZ2V0KClgICYgYG9uKClgIG1ldGhvZHNcbiAgICAgICAgICAgICovXG4gICAgICAgICAgICBuZXcgYXBwLk1vZGVsKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgLy8gQWRkIGFueSBidXNpbmVzcyBsb2dpY1xuICAgICAgICAgICAgICAgIHRoaXMuc2FuaXRpemUgPSBwcm9wcyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcCBpbiBwcm9wcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BzLmhhc093blByb3BlcnR5KHApICYmIHR5cGVvZiBwcm9wc1twXSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzW3BdID0gcHJvcHNbcF0ucmVwbGFjZSgvXFxXL2csICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvcHM7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gU2V0IGFueSBsaXN0ZW5lcnNcbiAgICAgICAgICAgICAgICB0aGlzLm9uKCdzZXRQcmUnLCBwcm9wcyA9PiB0aGlzLnNhbml0aXplKHByb3BzKSk7XG5cbiAgICAgICAgICAgICAgICAvLyBQb3B1bGF0ZSBtb2RlbFxuICAgICAgICAgICAgICAgIHRoaXMuc2V0KHtcbiAgICAgICAgICAgICAgICAgICAgZmlyc3ROYW1lOiAnUGhpbGlwJyxcbiAgICAgICAgICAgICAgICAgICAgbGFzdE5hbWU6ICdGcnknXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBTZXQgYnkgcGF0aFxuICAgICAgICAgICAgICAgIHRoaXMuc2V0KCdsb2NhdGlvbi55ZWFyJywgMjA1Mik7XG4gICAgICAgICAgICB9KSxcblxuXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgICBWaWV3IC0gYGVsYCBwcm9wZXJ0eVxuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG5ldyBhcHAuVmlldyhmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgICAgIC8vIFNldCBET00gcmVmXG4gICAgICAgICAgICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c2VyRm9ybScpO1xuXG4gICAgICAgICAgICAgICAgLy8gUG9wdWxhdGUgdmlldyAoanVzdCBhIHNpbXBsZSBleGFtcGxlKVxuICAgICAgICAgICAgICAgIHRoaXMuZWwuaW5uZXJIVE1MID0gJ0ZpcnN0IG5hbWU6IDxpbnB1dCBpZD1cImZpcnN0TmFtZVwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnU3VybmFtZTogPGlucHV0IGlkPVwibGFzdE5hbWVcIj4nO1xuICAgICAgICAgICAgfSksXG5cblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgQ29udHJvbGxlciAtIE1WQyBhcmd1bWVudHMsIGBiaW5kKClgIG1ldGhvZFxuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG5ldyBhcHAuQ29udHJvbGxlcihmdW5jdGlvbihtb2RlbCwgdmlldywgY29udHJvbGxlcikge1xuXG4gICAgICAgICAgICAgICAgLy8gUmVuZGVyIG9uIGNoYW5nZVxuICAgICAgICAgICAgICAgIG1vZGVsLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3VzZXJNb2RlbCcpLmlubmVySFRNTCA9IEpTT04uc3RyaW5naWZ5KG1vZGVsKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIEV4YW1wbGUgMiB3YXkgYmluZGluZ3NcbiAgICAgICAgICAgICAgICB0aGlzLmJpbmQoe1xuXG4gICAgICAgICAgICAgICAgICAgICcjZmlyc3ROYW1lJzogKGVsLCBtb2RlbCwgdmlldywgY29udHJvbGxlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWwub25rZXl1cCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLnNldCgnZmlyc3ROYW1lJywgdGhpcy52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwub24oJ3NldFBvc3QnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbC52YWx1ZSA9IHRoaXMuZ2V0KCdmaXJzdE5hbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgICcjbGFzdE5hbWUnOiAoZWwsIG1vZGVsLCB2aWV3LCBjb250cm9sbGVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5vbmtleXVwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwuc2V0KCdsYXN0TmFtZScsIHRoaXMudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLm9uKCdzZXRQb3N0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwudmFsdWUgPSB0aGlzLmdldCgnbGFzdE5hbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICB9XG5cbn07XG4iXX0=
