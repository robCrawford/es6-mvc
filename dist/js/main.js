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

    if (model.init) {
        model.init();
    }
    if (view.init) {
        view.init();
    }
    if (controller.init) {
        controller.init();
    }

    // Run initial 'change' callbacks
    model.change();

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
            set: [],
            change: []
        };
        this.init = init && init.bind(this);
    }

    _createClass(Model, [{
        key: "change",
        value: function change() {
            var changeCallbacks = this.callbacks["change"];
            var i = changeCallbacks.length;
            while (i--) {
                changeCallbacks[i].call(this, this);
            }
        }
    }, {
        key: "beforeSet",
        value: function beforeSet(props) {
            // Allows validation etc. before setting props
            // `props` is a copy that can be safely mutated
            var setCallbacks = this.callbacks["set"];
            var i = setCallbacks.length;
            while (i--) {
                props = setCallbacks[i].call(this, props);
            }
            return props;
        }
    }, {
        key: "set",
        value: function set(props, atPath) {
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
            // Run any "set" callbacks on a copy of `props`
            props = this.beforeSet(merge({}, props));
            merge(currNode, props, function (isChanged) {
                // Run any "change" callbacks
                if (isChanged) model.change();
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
            if (callbacks) callbacks.unshift(callback);
            return this; // For chaining
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
        //Else create any missing nodes in path
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

// Initialise
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

var _class = function _class() {
    _classCallCheck(this, _class);

    app.add("userForm",

    /*
      Model
      set()` & `get()` for data, `on()` for listeners
    */
    new app.Model(function () {
        var _this = this;

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
        this.on('set', function (props) {
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

        // Set DOM ref
        this.el = document.getElementById('userForm');

        // Populate view
        this.el.innerHTML = 'First name: <input id="firstName">' + 'Surname: <input id="lastName">';
    }),

    /*
      Controller
      `bind()` supplies all refs for setting behaviour per DOM selector
    */
    new app.Controller(function (model, view, controller) {

        // Example 2 way bindings
        this.bind({

            '#firstName': function firstName(el, model, view, controller) {
                el.onkeyup = function () {
                    model.set('firstName', this.value);
                };
                model.on('change', function () {
                    el.value = this.get('firstName');
                });
            },

            '#lastName': function lastName(el, model, view, controller) {
                el.onkeyup = function () {
                    model.set('lastName', this.value);
                };
                model.on('change', function () {
                    el.value = this.get('lastName');
                    document.getElementById('userModel').innerHTML = JSON.stringify(model);
                });
            }

        });
    }));
};

exports.default = _class;
;

},{"../lib/app":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvbGliL2FwcC5qcyIsInNyYy9qcy9tYWluLmpzIiwic3JjL2pzL21vZHVsZXMvQm9vdC5qcyIsInNyYy9qcy9tb2R1bGVzL1VzZXJGb3JtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7UUNLZ0IsRyxHQUFBLEc7UUF3QkEsRyxHQUFBLEc7UUFnSUEsTyxHQUFBLE87UUFpQkEsTyxHQUFBLE87UUFrQkEsSyxHQUFBLEs7Ozs7QUFoTWhCOzs7QUFHQSxJQUFNLFVBQVUsRUFBaEI7O0FBRU8sU0FBUyxHQUFULENBQWEsSUFBYixFQUFtQixLQUFuQixFQUEwQixJQUExQixFQUFnQyxVQUFoQyxFQUE0QztBQUMvQyxlQUFXLEtBQVgsR0FBbUIsS0FBbkI7QUFDQSxlQUFXLElBQVgsR0FBa0IsSUFBbEI7O0FBRUEsUUFBSSxNQUFNLElBQVYsRUFBZ0I7QUFDWixjQUFNLElBQU47QUFDSDtBQUNELFFBQUksS0FBSyxJQUFULEVBQWU7QUFDWCxhQUFLLElBQUw7QUFDSDtBQUNELFFBQUksV0FBVyxJQUFmLEVBQXFCO0FBQ2pCLG1CQUFXLElBQVg7QUFDSDs7QUFFRDtBQUNBLFVBQU0sTUFBTjs7QUFFQSxXQUFRLFFBQVEsSUFBUixJQUFnQjtBQUNwQixlQUFPLEtBRGE7QUFFcEIsY0FBTSxJQUZjO0FBR3BCLG9CQUFZO0FBSFEsS0FBeEI7QUFLSDs7QUFFTSxTQUFTLEdBQVQsQ0FBYSxJQUFiLEVBQW1CO0FBQ3RCLFdBQU8sUUFBUSxJQUFSLENBQVA7QUFDSDs7QUFFRDs7OztJQUdhLEssV0FBQSxLO0FBRVQsbUJBQWEsSUFBYixFQUFtQjtBQUFBOztBQUNmLGFBQUssSUFBTCxHQUFZLEVBQVo7QUFDQSxhQUFLLFNBQUwsR0FBaUI7QUFDYixpQkFBSyxFQURRO0FBRWIsb0JBQVE7QUFGSyxTQUFqQjtBQUlBLGFBQUssSUFBTCxHQUFZLFFBQVEsS0FBSyxJ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QVcsS0FBSyxHQUFMLENBQVMsV0FBVCxDQUFYO0FBQ0gsaUJBRkQ7QUFHSCxhQVRLOztBQVdOLHlCQUFhLGtCQUFDLEVBQUQsRUFBSyxLQUFMLEVBQVksSUFBWixFQUFrQixVQUFsQixFQUFpQztBQUMxQyxtQkFBRyxPQUFILEdBQWEsWUFBVztBQUNwQiwwQkFBTSxHQUFOLENBQVUsVUFBVixFQUFzQixLQUFLLEtBQTNCO0FBQ0gsaUJBRkQ7QUFHQSxzQkFBTSxFQUFOLENBQVMsUUFBVCxFQUFtQixZQUFXO0FBQzFCLHVCQUFHLEtBQUgsR0FBVyxLQUFLLEdBQUwsQ0FBUyxVQUFULENBQVg7QUFDQSw2QkFBUyxjQUFULENBQXdCLFdBQXhCLEVBQXFDLFNBQXJDLEdBQWlELEtBQUssU0FBTCxDQUFlLEtBQWYsQ0FBakQ7QUFDSCxpQkFIRDtBQUlIOztBQW5CSyxTQUFWO0FBdUJILEtBMUJELENBakRKO0FBNkVILEM7OztBQUVKIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qXG4gIEFwcFxuKi9cbmNvbnN0IG1vZHVsZXMgPSBbXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFkZChuYW1lLCBtb2RlbCwgdmlldywgY29udHJvbGxlcikge1xuICAgIGNvbnRyb2xsZXIubW9kZWwgPSBtb2RlbDtcbiAgICBjb250cm9sbGVyLnZpZXcgPSB2aWV3O1xuXG4gICAgaWYgKG1vZGVsLmluaXQpIHtcbiAgICAgICAgbW9kZWwuaW5pdCgpO1xuICAgIH1cbiAgICBpZiAodmlldy5pbml0KSB7XG4gICAgICAgIHZpZXcuaW5pdCgpO1xuICAgIH1cbiAgICBpZiAoY29udHJvbGxlci5pbml0KSB7XG4gICAgICAgIGNvbnRyb2xsZXIuaW5pdCgpO1xuICAgIH1cblxuICAgIC8vIFJ1biBpbml0aWFsICdjaGFuZ2UnIGNhbGxiYWNrc1xuICAgIG1vZGVsLmNoYW5nZSgpO1xuXG4gICAgcmV0dXJuIChtb2R1bGVzW25hbWVdID0ge1xuICAgICAgICBtb2RlbDogbW9kZWwsXG4gICAgICAgIHZpZXc6IHZpZXcsXG4gICAgICAgIGNvbnRyb2xsZXI6IGNvbnRyb2xsZXJcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldChuYW1lKSB7XG4gICAgcmV0dXJuIG1vZHVsZXNbbmFtZV07XG59XG5cbi8qXG4gIE1vZGVsXG4qL1xuZXhwb3J0IGNsYXNzIE1vZGVse1xuXG4gICAgY29uc3RydWN0b3IgKGluaXQpIHtcbiAgICAgICAgdGhpcy50cmVlID0ge307XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzID0ge1xuICAgICAgICAgICAgc2V0OiBbXSxcbiAgICAgICAgICAgIGNoYW5nZTogW11cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5pbml0ID0gaW5pdCAmJiBpbml0LmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgY2hhbmdlICgpIHtcbiAgICAgICAgY29uc3QgY2hhbmdlQ2FsbGJhY2tzID0gdGhpcy5jYWxsYmFja3NbXCJjaGFuZ2VcIl07XG4gICAgICAgIGxldCBpID0gY2hhbmdlQ2FsbGJhY2tzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgY2hhbmdlQ2FsbGJhY2tzW2ldLmNhbGwodGhpcywgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBiZWZvcmVTZXQgKHByb3BzKSB7XG4gICAgICAgIC8vIEFsbG93cyB2YWxpZGF0aW9uIGV0Yy4gYmVmb3JlIHNldHRpbmcgcHJvcHNcbiAgICAgICAgLy8gYHByb3BzYCBpcyBhIGNvcHkgdGhhdCBjYW4gYmUgc2FmZWx5IG11dGF0ZWRcbiAgICAgICAgY29uc3Qgc2V0Q2FsbGJhY2tzID0gdGhpcy5jYWxsYmFja3NbXCJzZXRcIl07XG4gICAgICAgIGxldCBpID0gc2V0Q2FsbGJhY2tzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgcHJvcHMgPSBzZXRDYWxsYmFja3NbaV0uY2FsbCh0aGlzLCBwcm9wcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb3BzO1xuICAgIH1cblxuICAgIHNldCAocHJvcHMsIGF0UGF0aCkge1xuICAgICAgICAvLyBgYXRQYXRoYCBpcyBvcHRpb25hbCAoZGVmYXVsdHMgdG8gcm9vdClcbiAgICAgICAgLy8gQWx0ZXJuYXRpdmUgYXJndW1lbnRzOiAoa2V5LCB2YWx1ZSwgYXRQYXRoKVxuICAgICAgICBjb25zdCBtb2RlbCA9IHRoaXM7XG4gICAgICAgIGlmICh0eXBlb2YgcHJvcHMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BzT2IgPSB7fTtcbiAgICAgICAgICAgIHByb3BzT2JbYXJndW1lbnRzWzBdXSA9IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgICAgIHByb3BzID0gcHJvcHNPYjtcbiAgICAgICAgICAgIGF0UGF0aCA9IGFyZ3VtZW50c1syXTtcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IGN1cnJOb2RlID0gKGF0UGF0aCA/IHRoaXMudHJlZVthdFBhdGhdIDogdGhpcy50cmVlKTtcbiAgICAgICAgLy8gUnVuIGFueSBcInNldFwiIGNhbGxiYWNrcyBvbiBhIGNvcHkgb2YgYHByb3BzYFxuICAgICAgICBwcm9wcyA9IHRoaXMuYmVmb3JlU2V0KG1lcmdlKHt9LCBwcm9wcykpO1xuICAgICAgICBtZXJnZShjdXJyTm9kZSwgcHJvcHMsIGlzQ2hhbmdlZCA9PiB7XG4gICAgICAgICAgICAvLyBSdW4gYW55IFwiY2hhbmdlXCIgY2FsbGJhY2tzXG4gICAgICAgICAgICBpZiAoaXNDaGFuZ2VkKSBtb2RlbC5jaGFuZ2UoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzOyAvLyBGb3IgY2hhaW5pbmdcbiAgICB9XG5cbiAgICBnZXQgKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIGdldE5vZGUodGhpcy50cmVlLCBwYXRoKTtcbiAgICB9XG5cbiAgICBvbiAobGFiZWwsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW2xhYmVsXTtcbiAgICAgICAgaWYgKGNhbGxiYWNrcykgY2FsbGJhY2tzLnVuc2hpZnQoY2FsbGJhY2spO1xuICAgICAgICByZXR1cm4gdGhpczsgLy8gRm9yIGNoYWluaW5nXG4gICAgfVxuXG4gICAgdG9KU09OICgpIHtcbiAgICAgICAgLy8gUmV0dXJuIHRyZWUgZm9yIEpTT04uc3RyaW5naWZ5KClcbiAgICAgICAgcmV0dXJuIHRoaXMudHJlZTtcbiAgICB9XG59XG5cbi8qXG4gIFZpZXdcbiovXG5leHBvcnQgY2xhc3MgVmlldyB7XG5cbiAgICBjb25zdHJ1Y3RvciAoaW5pdCkge1xuICAgICAgICB0aGlzLmluaXQgPSBpbml0ICYmIGluaXQuYmluZCh0aGlzKTtcblxuICAgICAgICBpZiAoIXRoaXMuZWwpIHtcbiAgICAgICAgICAgIHRoaXMuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5lbC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZWwpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKlxuICBDb250cm9sbGVyXG4qL1xuZXhwb3J0IGNsYXNzIENvbnRyb2xsZXIge1xuXG4gICAgY29uc3RydWN0b3IgKGluaXQpIHtcbiAgICAgICAgdGhpcy5pbml0ID0gaW5pdCAmJiBpbml0LmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgYmluZCAoYmluZGluZ3MpIHtcbiAgICAgICAgLy8gUnVuIGJpbmRpbmcgZnVuY3Rpb25zIGZvciBzZWxlY3RvcnNcbiAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBpbiBiaW5kaW5ncykge1xuICAgICAgICAgICAgaWYgKGJpbmRpbmdzLmhhc093blByb3BlcnR5KHNlbGVjdG9yKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRvbUVscyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgIGxldCBpID0gZG9tRWxzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIGJpbmRpbmdzW3NlbGVjdG9yXS5jYWxsKHRoaXMsIGRvbUVsc1tpXSwgdGhpcy5tb2RlbCwgdGhpcy52aWV3LCB0aGlzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qXG4gIFV0aWxzXG4qL1xuZnVuY3Rpb24gaXNGdW5jdGlvbihvKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBvID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChvKSB7XG4gICAgcmV0dXJuIG8gPT09IE9iamVjdChvKSAmJlxuICAgICAgICAgICAhby5ub2RlVHlwZSAmJlxuICAgICAgICAgICAhQXJyYXkuaXNBcnJheShvKSAmJlxuICAgICAgICAgICAhaXNGdW5jdGlvbihvKSAmJlxuICAgICAgICAgICAhKG8gaW5zdGFuY2VvZiBSZWdFeHApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Tm9kZSh0cmVlLCBwYXRoU3RyLCB2YWx1ZSkge1xuLy8gU2V0IG5vZGUgYXQgcGF0aCBzdHJpbmcgdG8gdmFsdWVcbi8vIEFueSBtaXNzaW5nIG5vZGVzIGFyZSBjcmVhdGVkXG4vLyBOT1RFOiBhbGwgbnVtZXJpYyBub2RlcyBiZWxvdyByb290IGFyZSBhc3N1bWVkIHRvIGJlIGFycmF5IGluZGV4ZXNcbiAgICBnZXROb2RlKHRyZWUsIHBhdGhTdHIsIChjdXJyTm9kZSwgcHJvcCwgbmV4dFByb3ApID0+IHtcbiAgICAgICAgLy8gTGFzdCBzZWdtZW50IG9mIHBhdGggc3RyaW5nLCBqdXN0IHNldCB2YWx1ZVxuICAgICAgICBpZiAobmV4dFByb3AgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY3Vyck5vZGVbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICAvL0Vsc2UgY3JlYXRlIGFueSBtaXNzaW5nIG5vZGVzIGluIHBhdGhcbiAgICAgICAgZWxzZSBpZiAoY3Vyck5vZGVbcHJvcF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIGFuIGFycmF5IGlmIG5leHRQcm9wIGlzIG51bWVyaWMsIG90aGVyd2lzZSBhbiBvYmplY3RcbiAgICAgICAgICAgIGN1cnJOb2RlW3Byb3BdID0gaXNOYU4obmV4dFByb3ApID8ge30gOiBbXTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZSh0cmVlLCBwYXRoU3RyLCBlYWNoQ2FsbGJhY2spIHtcbi8vIEdldCBub2RlIGZyb20gcGF0aCBzdHJpbmdcbi8vIE9wdGlvbmFsIGBlYWNoQ2FsbGJhY2tgIGlzIHBhc3NlZCAoY3Vyck5vZGUsIHByb3AsIG5leHRQcm9wKVxuLy8gVGhpcyBhbGxvd3MgdGhlIG5leHQgbm9kZSB0byBiZSBjcmVhdGVkIG9yIGNoYW5nZWQgYmVmb3JlIGVhY2ggdHJhdmVyc2FsXG4gICAgY29uc3QgcGF0aEFyciA9IHBhdGhTdHIuc3BsaXQoXCIuXCIpO1xuICAgIGxldCBjdXJyTm9kZSA9IHRyZWU7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gcGF0aEFyci5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBjb25zdCBwcm9wID0gcGF0aEFycltpXTtcbiAgICAgICAgaWYgKGVhY2hDYWxsYmFjaykge1xuICAgICAgICAgICAgZWFjaENhbGxiYWNrKGN1cnJOb2RlLCBwcm9wLCBwYXRoQXJyW2kgKyAxXSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGN1cnJOb2RlID09PSB1bmRlZmluZWQpIGJyZWFrO1xuICAgICAgICBlbHNlIGN1cnJOb2RlID0gY3Vyck5vZGVbcHJvcF07XG4gICAgfVxuICAgIHJldHVybiBjdXJyTm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlKCAvKiBbbWVyZ2VDaGlsZE9icyxdIHt9LCB7fSBbLCAuLi5dIFssIGNhbGxiYWNrXSAqLyApIHtcbi8vIEFkZCBvciBvdmVyd3JpdGUgYWxsIHByb3BlcnRpZXMgcmlnaHQgdG8gbGVmdFxuLy8gQnkgZGVmYXVsdCBjaGlsZCBvYmplY3RzIGFyZSBtZXJnZWQgcmVjdXJzaXZlbHkgKGJ1dCBub3QgYXJyYXlzKVxuLy8gSWYgYSBib29sZWFuIGlzIHN1cHBsaWVkLCBpdCBiZWNvbWVzIGBtZXJnZUNoaWxkT2JzYCB2YWx1ZSB1bnRpbCBhbm90aGVyIGJvb2xlYW4gaXMgZm91bmRcbi8vIElmIGEgY2FsbGJhY2sgaXMgc3VwcGxpZWQsIGl0IHdpbGwgcmVjZWl2ZSBhIGJvb2xlYW4gYXJndW1lbnQgYGlzQ2hhbmdlZGBcbiAgICBsZXQgbGV2ZWwgPSAwLFxuICAgICAgICBjaGFuZ2VDb3VudCA9IDAsXG4gICAgICAgIG1lcmdlQ2hpbGRPYnMgPSB0cnVlLFxuICAgICAgICBjYWxsYmFjayxcbiAgICAgICAgcmVzdWx0ID0gcnVuLmFwcGx5KHRoaXMsIFswLCBhcmd1bWVudHNdKTtcblxuICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soISFjaGFuZ2VDb3VudCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcblxuICAgIGZ1bmN0aW9uIHJ1bihsZXZlbCwgcGFyYW1zKSB7XG4gICAgICAgIGxldCBwYXJhbSxcbiAgICAgICAgICAgIHJldE9iLFxuICAgICAgICAgICAgcGFyYW1zQ291bnQgPSBwYXJhbXMubGVuZ3RoO1xuXG4gICAgICAgIC8vIENoaWxkIG9iamVjdHNcbiAgICAgICAgLy8gTWVyZ2UgaW50byBsZWZ0bW9zdCBwYXJhbSBpZiBhbiBvYmplY3QsIG9yIGNyZWF0ZSBvYmplY3QgdG8gbWVyZ2UgaW50b1xuICAgICAgICBpZiAobGV2ZWwpIHtcbiAgICAgICAgICAgIHJldE9iID0gaXNPYmplY3QocGFyYW1zWzBdKSA/IHBhcmFtc1swXSA6IHt9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmFtc0NvdW50OyBpKyspIHtcbiAgICAgICAgICAgIHBhcmFtID0gcGFyYW1zW2ldO1xuXG4gICAgICAgICAgICAvLyBUb3AgbGV2ZWwgcGFyYW1zIG1heSBjb250YWluIG90aGVyIGFyZ3VtZW50c1xuICAgICAgICAgICAgaWYgKCFsZXZlbCAmJiBwYXJhbSAhPSBudWxsKSB7IC8vIGB1bmRlZmluZWRgIG9yIGBudWxsYFxuICAgICAgICAgICAgICAgIC8vIEZpcnN0IG9iamVjdCBiZWNvbWVzIHJldHVybmVkIG9iamVjdFxuICAgICAgICAgICAgICAgIC8vIEFsc28gYWxsb3cgYSBET00gbm9kZSBmb3IgbWVyZ2luZyBpbnRvXG4gICAgICAgICAgICAgICAgaWYgKCFyZXRPYiAmJiBpc09iamVjdChwYXJhbSkgfHwgcGFyYW0ubm9kZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0T2IgPSBwYXJhbTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGBtZXJnZUNoaWxkT2JzYCBib29sZWFuIGFyZ3VtZW50c1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyYW0gPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lcmdlQ2hpbGRPYnMgPSBwYXJhbTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIExhc3QgcGFzc2VkIGluIGZ1bmN0aW9uIGJlY29tZXMgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBwYXJhbTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghcmV0T2IpIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgcCBpbiBwYXJhbSkge1xuICAgICAgICAgICAgICAgIGlmIChwYXJhbS5oYXNPd25Qcm9wZXJ0eShwKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBwYXJhbVtwXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBNZXJnZSBjaGlsZCBvYmplY3RzIChyZWN1cnNpdmUpXG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXJnZUNoaWxkT2JzICYmIGlzT2JqZWN0KHZhbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldE9iW3BdID0gcnVuKGxldmVsKzEsIFtyZXRPYltwXSwgdmFsXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodmFsICE9PSByZXRPYltwXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlQ291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldE9iW3BdID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXRPYiB8fCB7fTtcbiAgICB9XG59XG4iLCJpbXBvcnQgQm9vdCBmcm9tIFwiLi9tb2R1bGVzL0Jvb3RcIjtcbmltcG9ydCBVc2VyRm9ybSBmcm9tIFwiLi9tb2R1bGVzL1VzZXJGb3JtXCI7XG5cbi8vIEluaXRpYWxpc2Vcbm5ldyBCb290KClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIG5ldyBVc2VyRm9ybSgpO1xuICAgIH0pO1xuIiwiLypcbiAgQm9vdCBvcGVyYXRpb25zXG4qL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3Mge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWR5KCk7XG4gICAgfVxuXG4gICAgcmVhZHkoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKC9cXHcvLnRlc3QobG9jYXRpb24uaHJlZikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHJlamVjdCgnRXJyb3InKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbn07XG4iLCJpbXBvcnQgKiBhcyBhcHAgZnJvbSBcIi4uL2xpYi9hcHBcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3Mge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgYXBwLmFkZChcbiAgICAgICAgICAgIFwidXNlckZvcm1cIixcblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgTW9kZWxcbiAgICAgICAgICAgICAgc2V0KClgICYgYGdldCgpYCBmb3IgZGF0YSwgYG9uKClgIGZvciBsaXN0ZW5lcnNcbiAgICAgICAgICAgICovXG4gICAgICAgICAgICBuZXcgYXBwLk1vZGVsKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgLy8gQWRkIGFueSBidXNpbmVzcyBsb2dpY1xuICAgICAgICAgICAgICAgIHRoaXMuc2FuaXRpemUgPSBwcm9wcyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcHJvcHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wcy5oYXNPd25Qcm9wZXJ0eShwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzW3BdID0gcHJvcHNbcF0ucmVwbGFjZSgvJVxcd1xcd3xbXFx1MDA4MC1cXHVGRkZGXSt8XFxXL2csICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvcHM7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gU2V0IGFueSBsaXN0ZW5lcnNcbiAgICAgICAgICAgICAgICB0aGlzLm9uKCdzZXQnLCBwcm9wcyA9PiB0aGlzLnNhbml0aXplKHByb3BzKSk7XG5cbiAgICAgICAgICAgICAgICAvLyBQb3B1bGF0ZSBtb2RlbFxuICAgICAgICAgICAgICAgIHRoaXMuc2V0KHtcbiAgICAgICAgICAgICAgICAgICAgZmlyc3ROYW1lOiAnUGhpbGlwJyxcbiAgICAgICAgICAgICAgICAgICAgbGFzdE5hbWU6ICdGcnknXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KSxcblxuXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgICBWaWV3XG4gICAgICAgICAgICAgIGBlbGAgZGl2IGlzIGNyZWF0ZWQgYXV0b21hdGljYWxseSBpZiB1bnNldFxuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG5ldyBhcHAuVmlldyhmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgICAgIC8vIFNldCBET00gcmVmXG4gICAgICAgICAgICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1c2VyRm9ybScpO1xuXG4gICAgICAgICAgICAgICAgLy8gUG9wdWxhdGUgdmlld1xuICAgICAgICAgICAgICAgIHRoaXMuZWwuaW5uZXJIVE1MID0gJ0ZpcnN0IG5hbWU6IDxpbnB1dCBpZD1cImZpcnN0TmFtZVwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnU3VybmFtZTogPGlucHV0IGlkPVwibGFzdE5hbWVcIj4nO1xuICAgICAgICAgICAgfSksXG5cblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgQ29udHJvbGxlclxuICAgICAgICAgICAgICBgYmluZCgpYCBzdXBwbGllcyBhbGwgcmVmcyBmb3Igc2V0dGluZyBiZWhhdmlvdXIgcGVyIERPTSBzZWxlY3RvclxuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG5ldyBhcHAuQ29udHJvbGxlcihmdW5jdGlvbihtb2RlbCwgdmlldywgY29udHJvbGxlcikge1xuXG4gICAgICAgICAgICAgICAgLy8gRXhhbXBsZSAyIHdheSBiaW5kaW5nc1xuICAgICAgICAgICAgICAgIHRoaXMuYmluZCh7XG5cbiAgICAgICAgICAgICAgICAgICAgJyNmaXJzdE5hbWUnOiAoZWwsIG1vZGVsLCB2aWV3LCBjb250cm9sbGVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5vbmtleXVwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwuc2V0KCdmaXJzdE5hbWUnLCB0aGlzLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RlbC5vbignY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwudmFsdWUgPSB0aGlzLmdldCgnZmlyc3ROYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICAnI2xhc3ROYW1lJzogKGVsLCBtb2RlbCwgdmlldywgY29udHJvbGxlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWwub25rZXl1cCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLnNldCgnbGFzdE5hbWUnLCB0aGlzLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RlbC5vbignY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwudmFsdWUgPSB0aGlzLmdldCgnbGFzdE5hbWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXNlck1vZGVsJykuaW5uZXJIVE1MID0gSlNPTi5zdHJpbmdpZnkobW9kZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgIH1cblxufTtcbiJdfQ==
