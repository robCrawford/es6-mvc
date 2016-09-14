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

var _CommentForm = require("./modules/CommentForm/CommentForm");

var _CommentForm2 = _interopRequireDefault(_CommentForm);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

new _Boot2.default().then(function () {
    new _CommentForm2.default();
});

},{"./modules/Boot/Boot":3,"./modules/CommentForm/CommentForm":4}],3:[function(require,module,exports){
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
  Example module
*/

var _class = function _class() {
    _classCallCheck(this, _class);

    return app.add("commentForm", _Model2.default, _View2.default, _Controller2.default);
};

exports.default = _class;
;

},{"../../lib/app":1,"./Controller":5,"./Model":6,"./View":7}],5:[function(require,module,exports){
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

        // Update view when model changes
        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(_class).call(this));

        _this.model.on('change', function () {
            var comment = _this.model.get('comment');
            if (comment) {
                comment = "<div>" + _this.model.get('user.name') + ": " + comment + "</div>";
            }
            _this.view.get('.commentArea').innerHTML = comment;
        });

        // Example 2 way bindings
        _this.bind({

            '#name': function name(el, model, view, controller) {
                el.onkeyup = function () {
                    model.set('user.name', el.value);
                };
                model.on('setPost', function () {
                    el.value = model.get('user.name');
                });
            },

            '#comment': function comment(el, model, view, controller) {
                el.onkeyup = function () {
                    model.set('comment', el.value);
                };
                model.on('setPost', function () {
                    el.value = model.get('comment');
                });
            }

        });
        return _this;
    }

    return _class;
}(app.Controller);

exports.default = _class;
;

},{"../../lib/app":1}],6:[function(require,module,exports){
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
                    props[p] = props[p].replace(/[^\w\s'!.,;]/g, '');
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
            comment: '',
            date: Date.now()
        });

        // Set by path
        _this.set('user.name', 'Guest');
        return _this;
    }

    return _class;
}(app.Model);

exports.default = _class;
;

},{"../../lib/app":1}],7:[function(require,module,exports){
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

        _this.el = document.getElementById("commentForm");
        return _this;
    }

    return _class;
}(app.View);

exports.default = _class;
;

},{"../../lib/app":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvbGliL2FwcC5qcyIsInNyYy9qcy9tYWluLmpzIiwic3JjL2pzL21vZHVsZXMvQm9vdC9Cb290LmpzIiwic3JjL2pzL21vZHVsZXMvQ29tbWVudEZvcm0vQ29tbWVudEZvcm0uanMiLCJzcmMvanMvbW9kdWxlcy9Db21tZW50Rm9ybS9Db250cm9sbGVyLmpzIiwic3JjL2pzL21vZHVsZXMvQ29tbWVudEZvcm0vTW9kZWwuanMiLCJzcmMvanMvbW9kdWxlcy9Db21tZW50Rm9ybS9WaWV3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FBRUE7Ozs7Ozs7Ozs7UUFNZ0IsRyxHQUFBLEc7UUFhQSxHLEdBQUEsRztRQWlLQSxPLEdBQUEsTztRQXlCQSxPLEdBQUEsTztRQWtCQSxLLEdBQUEsSzs7Ozs7O0FBNU5oQixJQUFNLFVBQVUsRUFBaEI7QUFDQSxJQUFJLGlCQUFKO0FBQUEsSUFBYyxrQkFBZDs7QUFFTyxTQUFTLEdBQVQsQ0FBYSxVQUFiLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLEVBQStCLENBQS9CLEVBQWtDO0FBQ3JDLFFBQU0sT0FBTyxXQUFXLElBQUksQ0FBSixFQUF4QjtBQUNBLFFBQU0sUUFBUSxZQUFZLElBQUksQ0FBSixFQUExQjtBQUNBLFFBQU0sYUFBYSxJQUFJLENBQUosRUFBbkI7QUFDQSxVQUFNLElBQU47O0FBRUEsV0FBUSxRQUFRLFVBQVIsSUFBc0I7QUFDMUIsZUFBTyxLQURtQjtBQUUxQixjQUFNLElBRm9CO0FBRzFCLG9CQUFZO0FBSGMsS0FBOUI7QUFLSDs7QUFFTSxTQUFTLEdBQVQsQ0FBYSxVQUFiLEVBQXlCO0FBQzVCLFdBQU8sUUFBUSxVQUFSLENBQVA7QUFDSDs7QUFFRDs7OztJQUdhLEssV0FBQSxLO0FBRVQscUJBQWM7QUFBQTs7QUFDVixhQUFLLElBQUwsR0FBWSxFQUFaO0FBQ0EsYUFBSyxTQUFMLEdBQWlC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RCxtQkFBTyxLQUFQO0FBQ0gsU0FQRDs7QUFTQTtBQUNBLGNBQUssRUFBTCxDQUFRLFFBQVIsRUFBa0I7QUFBQSxtQkFBUyxNQUFLLFFBQUwsQ0FBYyxLQUFkLENBQVQ7QUFBQSxTQUFsQjs7QUFFQTtBQUNBLGNBQUssR0FBTCxDQUFTO0FBQ0wscUJBQVMsRUFESjtBQUVMLGtCQUFNLEtBQUssR0FBTDtBQUZELFNBQVQ7O0FBS0E7QUFDQSxjQUFLLEdBQUwsQ0FBUyxXQUFULEVBQXNCLE9BQXRCO0FBdkJVO0FBd0JiOzs7RUExQndCLElBQUksSzs7O0FBNEJoQzs7Ozs7Ozs7O0FDcENEOztJQUFZLEc7Ozs7Ozs7Ozs7QUFFWjs7QUFFQTs7Ozs7Ozs7O0FBT0ksc0JBQWM7QUFBQTs7QUFHVjtBQUhVOztBQUlWLGNBQUssRUFBTCxHQUFVLFNBQVMsY0FBVCxDQUF3QixhQUF4QixDQUFWO0FBSlU7QUFLYjs7O0VBUHdCLElBQUksSTs7O0FBU2hDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xuXG4vKlxuICBBcHBcbiovXG5jb25zdCBtb2R1bGVzID0gW107XG5sZXQgY3VyclZpZXcsIGN1cnJNb2RlbDtcblxuZXhwb3J0IGZ1bmN0aW9uIGFkZChtb2R1bGVOYW1lLCBNLCBWLCBDKSB7XG4gICAgY29uc3QgdmlldyA9IGN1cnJWaWV3ID0gbmV3IFYoKTtcbiAgICBjb25zdCBtb2RlbCA9IGN1cnJNb2RlbCA9IG5ldyBNKCk7XG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBDKCk7XG4gICAgbW9kZWwuaW5pdCgpO1xuXG4gICAgcmV0dXJuIChtb2R1bGVzW21vZHVsZU5hbWVdID0ge1xuICAgICAgICBtb2RlbDogbW9kZWwsXG4gICAgICAgIHZpZXc6IHZpZXcsXG4gICAgICAgIGNvbnRyb2xsZXI6IGNvbnRyb2xsZXJcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldChtb2R1bGVOYW1lKSB7XG4gICAgcmV0dXJuIG1vZHVsZXNbbW9kdWxlTmFtZV07XG59XG5cbi8qXG4gIE1vZGVsXG4qL1xuZXhwb3J0IGNsYXNzIE1vZGVse1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMudHJlZSA9IHt9O1xuICAgICAgICB0aGlzLmNhbGxiYWNrcyA9IHtcbiAgICAgICAgICAgIHNldFByZTogW10sXG4gICAgICAgICAgICBzZXRQb3N0OiBbXSxcbiAgICAgICAgICAgIGNoYW5nZTogW11cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpbml0KCkge1xuICAgIC8vIFJ1biBhbnkgY2FsbGJhY2tzIHJlZ2lzdGVyZWQgZHVyaW5nIGluc3RhbnRpYXRpb25cbiAgICAgICAgZm9yICh2YXIgcCBpbiB0aGlzLmNhbGxiYWNrcykge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2FsbGJhY2tzLmhhc093blByb3BlcnR5KHApKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ydW5DYWxsYmFja3MocCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRQcmUocHJvcHMpIHtcbiAgICAvLyBBbGxvd3MgdmFsaWRhdGlvbiBldGMuIGJlZm9yZSBzZXR0aW5nIHByb3BzXG4gICAgLy8gYHByb3BzYCBpcyBhIGNvcHkgdGhhdCBjYW4gYmUgc2FmZWx5IG11dGF0ZWRcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gdGhpcy5jYWxsYmFja3NbXCJzZXRQcmVcIl07XG4gICAgICAgIGxldCBpID0gY2FsbGJhY2tzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgcHJvcHMgPSBjYWxsYmFja3NbaV0uY2FsbCh0aGlzLCBwcm9wcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb3BzO1xuICAgIH1cblxuICAgIHNldFBvc3QocHJvcHMpIHtcbiAgICAvLyBSdW5zIGNhbGxiYWNrcyBhZnRlciBgc2V0KClgIHdoZXRoZXIgbW9kZWwgY2hhbmdlZCBvciBub3RcbiAgICAgICAgdGhpcy5ydW5DYWxsYmFja3MoXCJzZXRQb3N0XCIpO1xuICAgIH1cblxuICAgIGNoYW5nZSgpIHtcbiAgICAvLyBSdW5zIGNhbGxiYWNrcyBhZnRlciBgc2V0KClgIGlmIG1vZGVsIGNoYW5nZWRcbiAgICAgICAgdGhpcy5ydW5DYWxsYmFja3MoXCJjaGFuZ2VcIik7XG4gICAgfVxuXG4gICAgc2V0KHByb3BzT3JQYXRoLCB2YWx1ZSkge1xuICAgIC8vIEFjY2VwdHMgcHJvcHMgb2JqZWN0IGB7Li4ufWAgT1IgJ3BhdGgnLCAndmFsdWUnXG4gICAgICAgIGxldCBjaGFuZ2VFdmVudDtcblxuICAgICAgICBpZiAoaXNPYmplY3QocHJvcHNPclBhdGgpKSB7XG4gICAgICAgICAgICAvLyBSdW4gYW55IFwic2V0UHJlXCIgY2FsbGJhY2tzIG9uIGEgY29weSBvZiBgcHJvcHNgXG4gICAgICAgICAgICBjb25zdCBwcm9wcyA9IHRoaXMuc2V0UHJlKG1lcmdlKHt9LCBwcm9wc09yUGF0aCkpO1xuICAgICAgICAgICAgbWVyZ2UodGhpcy50cmVlLCBwcm9wcywgaXNDaGFuZ2VkID0+IGNoYW5nZUV2ZW50ID0gaXNDaGFuZ2VkKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBwcm9wc09yUGF0aDtcbiAgICAgICAgICAgIC8vIFJ1biBhbnkgXCJzZXRQcmVcIiBjYWxsYmFja3NcbiAgICAgICAgICAgIHZhbHVlID0gdGhpcy5zZXRQcmUoe1twYXRoXTogdmFsdWV9KVtwYXRoXTtcbiAgICAgICAgICAgIGNoYW5nZUV2ZW50ID0gc2V0Tm9kZSh0aGlzLnRyZWUsIHBhdGgsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhbmdlRXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRQb3N0KCk7XG4gICAgICAgIHJldHVybiB0aGlzOyAvLyBGb3IgY2hhaW5pbmdcbiAgICB9XG5cbiAgICBnZXQocGF0aCkge1xuICAgICAgICByZXR1cm4gZ2V0Tm9kZSh0aGlzLnRyZWUsIHBhdGgpO1xuICAgIH1cblxuICAgIG9uKGxhYmVsLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSB0aGlzLmNhbGxiYWNrc1tsYWJlbF07XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrcy51bnNoaWZ0KGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpczsgLy8gRm9yIGNoYWluaW5nXG4gICAgfVxuXG4gICAgcnVuQ2FsbGJhY2tzKGxhYmVsKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW2xhYmVsXTtcbiAgICAgICAgbGV0IGkgPSBjYWxsYmFja3MubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBjYWxsYmFja3NbaV0uY2FsbCh0aGlzLCB0aGlzLnRyZWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdG9KU09OKCkge1xuICAgIC8vIFJldHVybiB0cmVlIGZvciBKU09OLnN0cmluZ2lmeSgpXG4gICAgICAgIHJldHVybiB0aGlzLnRyZWU7XG4gICAgfVxufVxuXG4vKlxuICBWaWV3XG4qL1xuZXhwb3J0IGNsYXNzIFZpZXcge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIC8vIERlcml2ZWQgY2xhc3MgbXVzdCBhc3NpZ24gYGVsYCBwcm9wZXJ0eVxuICAgIH1cblxuICAgIGdldChzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICB9XG5cbiAgICBnZXRBbGwoc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWwucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgfVxufVxuXG4vKlxuICBDb250cm9sbGVyXG4qL1xuZXhwb3J0IGNsYXNzIENvbnRyb2xsZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubW9kZWwgPSBjdXJyTW9kZWw7XG4gICAgICAgIGlmIChjdXJyVmlldy5lbCkge1xuICAgICAgICAgICAgdGhpcy52aWV3ID0gY3VyclZpZXc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyhuZXcgRXJyb3IoJ1ZpZXcuZWwgcmVxdWlyZWQhJykpO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJNb2RlbCA9IG51bGw7XG4gICAgICAgIGN1cnJWaWV3ID0gbnVsbDtcbiAgICB9XG5cbiAgICBiaW5kKGJpbmRpbmdzKSB7XG4gICAgLy8gUnVuIGJpbmRpbmcgZnVuY3Rpb25zIGZvciBzZWxlY3RvcnMgKHdpdGhpbiB2aWV3LmVsKVxuICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIGluIGJpbmRpbmdzKSB7XG4gICAgICAgICAgICBpZiAoYmluZGluZ3MuaGFzT3duUHJvcGVydHkoc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZG9tRWxzID0gdGhpcy52aWV3LmVsLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgIGxldCBpID0gZG9tRWxzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIGJpbmRpbmdzW3NlbGVjdG9yXS5jYWxsKHRoaXMsIGRvbUVsc1tpXSwgdGhpcy5tb2RlbCwgdGhpcy52aWV3LCB0aGlzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7IC8vIEZvciBjaGFpbmluZ1xuICAgIH1cbn1cblxuLypcbiAgVXRpbHNcbiovXG5mdW5jdGlvbiBpc09iamVjdChvKSB7XG4gICAgcmV0dXJuIG8gPT09IE9iamVjdChvKSAmJlxuICAgICAgICAgICAhby5ub2RlVHlwZSAmJlxuICAgICAgICAgICAhQXJyYXkuaXNBcnJheShvKSAmJlxuICAgICAgICAgICAhKHR5cGVvZiBvID09PSAnZnVuY3Rpb24nKSAmJlxuICAgICAgICAgICAhKG8gaW5zdGFuY2VvZiBSZWdFeHApO1xufVxuXG5mdW5jdGlvbiBpc051bWVyaWModmFsKSB7XG4gICAgcmV0dXJuIE51bWJlcihwYXJzZUZsb2F0KHZhbCkpID09IHZhbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE5vZGUodHJlZSwgcGF0aFN0ciwgdmFsdWUpIHtcbi8vIFNldCBub2RlIGF0IHBhdGggc3RyaW5nIHRvIHZhbHVlXG4vLyBBbnkgbWlzc2luZyBub2RlcyBhcmUgY3JlYXRlZFxuLy8gTk9URTogYWxsIG51bWVyaWMgbm9kZXMgYmVsb3cgcm9vdCBhcmUgYXNzdW1lZCB0byBiZSBhcnJheSBpbmRleGVzXG4vLyBSZXR1cm5zIGJvb2xlYW4gYHRydWVgIGlmIHZhbHVlIHdhcyBjaGFuZ2VkXG4gICAgbGV0IGlzQ2hhbmdlZCA9IGZhbHNlO1xuXG4gICAgZ2V0Tm9kZSh0cmVlLCBwYXRoU3RyLCAoY3Vyck5vZGUsIHByb3AsIG5leHRQcm9wKSA9PiB7XG4gICAgICAgIC8vIExhc3Qgc2VnbWVudCBvZiBwYXRoIHN0cmluZywgc2V0IHZhbHVlIGlmIGRpZmZlcmVudFxuICAgICAgICBpZiAobmV4dFByb3AgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc3QgY3VyclZhbCA9IGN1cnJOb2RlW3Byb3BdO1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBjdXJyVmFsKSB7XG4gICAgICAgICAgICAgICAgY3Vyck5vZGVbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBpc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIEVsc2UgY3JlYXRlIGFueSBtaXNzaW5nIG5vZGVzIGluIHBhdGhcbiAgICAgICAgZWxzZSBpZiAoY3Vyck5vZGVbcHJvcF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIGFuIGFycmF5IGlmIG5leHRQcm9wIGlzIG51bWVyaWMsIG90aGVyd2lzZSBhbiBvYmplY3RcbiAgICAgICAgICAgIGN1cnJOb2RlW3Byb3BdID0gaXNOdW1lcmljKG5leHRQcm9wKSA/IFtdIDoge307XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gaXNDaGFuZ2VkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZSh0cmVlLCBwYXRoU3RyLCBlYWNoQ2FsbGJhY2spIHtcbi8vIEdldCBub2RlIGZyb20gcGF0aCBzdHJpbmdcbi8vIE9wdGlvbmFsIGBlYWNoQ2FsbGJhY2tgIGlzIHBhc3NlZCAoY3Vyck5vZGUsIHByb3AsIG5leHRQcm9wKVxuLy8gVGhpcyBhbGxvd3MgdGhlIG5leHQgbm9kZSB0byBiZSBjcmVhdGVkIG9yIGNoYW5nZWQgYmVmb3JlIGVhY2ggdHJhdmVyc2FsXG4gICAgY29uc3QgcGF0aEFyciA9IHBhdGhTdHIuc3BsaXQoXCIuXCIpO1xuICAgIGxldCBjdXJyTm9kZSA9IHRyZWU7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gcGF0aEFyci5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBjb25zdCBwcm9wID0gcGF0aEFycltpXTtcbiAgICAgICAgaWYgKGVhY2hDYWxsYmFjaykge1xuICAgICAgICAgICAgZWFjaENhbGxiYWNrKGN1cnJOb2RlLCBwcm9wLCBwYXRoQXJyW2kgKyAxXSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGN1cnJOb2RlID09PSB1bmRlZmluZWQpIGJyZWFrO1xuICAgICAgICBlbHNlIGN1cnJOb2RlID0gY3Vyck5vZGVbcHJvcF07XG4gICAgfVxuICAgIHJldHVybiBjdXJyTm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlKCAvKiBbbWVyZ2VDaGlsZE9icyxdIHt9LCB7fSBbLCAuLi5dIFssIGNhbGxiYWNrXSAqLyApIHtcbi8vIEFkZCBvciBvdmVyd3JpdGUgYWxsIHByb3BlcnRpZXMgcmlnaHQgdG8gbGVmdFxuLy8gQnkgZGVmYXVsdCBjaGlsZCBvYmplY3RzIGFyZSBtZXJnZWQgcmVjdXJzaXZlbHkgKGJ1dCBub3QgYXJyYXlzKVxuLy8gSWYgYSBib29sZWFuIGlzIHN1cHBsaWVkLCBpdCBiZWNvbWVzIGBtZXJnZUNoaWxkT2JzYCB2YWx1ZSB1bnRpbCBhbm90aGVyIGJvb2xlYW4gaXMgZm91bmRcbi8vIElmIGEgY2FsbGJhY2sgaXMgc3VwcGxpZWQsIGl0IHdpbGwgcmVjZWl2ZSBhIGJvb2xlYW4gYXJndW1lbnQgYGlzQ2hhbmdlZGBcbiAgICBsZXQgbGV2ZWwgPSAwLFxuICAgICAgICBjaGFuZ2VDb3VudCA9IDAsXG4gICAgICAgIG1lcmdlQ2hpbGRPYnMgPSB0cnVlLFxuICAgICAgICBjYWxsYmFjayxcbiAgICAgICAgcmVzdWx0ID0gcnVuLmFwcGx5KHRoaXMsIFswLCBhcmd1bWVudHNdKTtcblxuICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soISFjaGFuZ2VDb3VudCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcblxuICAgIGZ1bmN0aW9uIHJ1bihsZXZlbCwgcGFyYW1zKSB7XG4gICAgICAgIGxldCBwYXJhbSxcbiAgICAgICAgICAgIHJldE9iLFxuICAgICAgICAgICAgcGFyYW1zQ291bnQgPSBwYXJhbXMubGVuZ3RoO1xuXG4gICAgICAgIC8vIENoaWxkIG9iamVjdHNcbiAgICAgICAgLy8gTWVyZ2UgaW50byBsZWZ0bW9zdCBwYXJhbSBpZiBhbiBvYmplY3QsIG9yIGNyZWF0ZSBvYmplY3QgdG8gbWVyZ2UgaW50b1xuICAgICAgICBpZiAobGV2ZWwpIHtcbiAgICAgICAgICAgIHJldE9iID0gaXNPYmplY3QocGFyYW1zWzBdKSA/IHBhcmFtc1swXSA6IHt9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmFtc0NvdW50OyBpKyspIHtcbiAgICAgICAgICAgIHBhcmFtID0gcGFyYW1zW2ldO1xuXG4gICAgICAgICAgICAvLyBUb3AgbGV2ZWwgcGFyYW1zIG1heSBjb250YWluIG90aGVyIGFyZ3VtZW50c1xuICAgICAgICAgICAgaWYgKCFsZXZlbCAmJiBwYXJhbSAhPSBudWxsKSB7IC8vIGB1bmRlZmluZWRgIG9yIGBudWxsYFxuICAgICAgICAgICAgICAgIC8vIEZpcnN0IG9iamVjdCBiZWNvbWVzIHJldHVybmVkIG9iamVjdFxuICAgICAgICAgICAgICAgIC8vIEFsc28gYWxsb3cgYSBET00gbm9kZSBmb3IgbWVyZ2luZyBpbnRvXG4gICAgICAgICAgICAgICAgaWYgKCFyZXRPYiAmJiBpc09iamVjdChwYXJhbSkgfHwgcGFyYW0ubm9kZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0T2IgPSBwYXJhbTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGBtZXJnZUNoaWxkT2JzYCBib29sZWFuIGFyZ3VtZW50c1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyYW0gPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lcmdlQ2hpbGRPYnMgPSBwYXJhbTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIExhc3QgcGFzc2VkIGluIGZ1bmN0aW9uIGJlY29tZXMgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBwYXJhbTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghcmV0T2IpIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBwIGluIHBhcmFtKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmFtLmhhc093blByb3BlcnR5KHApKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IHBhcmFtW3BdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIE1lcmdlIGNoaWxkIG9iamVjdHMgKHJlY3Vyc2l2ZSlcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1lcmdlQ2hpbGRPYnMgJiYgaXNPYmplY3QodmFsKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0T2JbcF0gPSBydW4obGV2ZWwrMSwgW3JldE9iW3BdLCB2YWxdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh2YWwgIT09IHJldE9iW3BdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0T2JbcF0gPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldE9iIHx8IHt9O1xuICAgIH1cbn1cbiIsImltcG9ydCBCb290IGZyb20gXCIuL21vZHVsZXMvQm9vdC9Cb290XCI7XG5pbXBvcnQgQ29tbWVudEZvcm0gZnJvbSBcIi4vbW9kdWxlcy9Db21tZW50Rm9ybS9Db21tZW50Rm9ybVwiO1xuXG5uZXcgQm9vdCgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBuZXcgQ29tbWVudEZvcm0oKTtcbiAgICB9KTtcbiIsIi8qXG4gIEJvb3Qgb3BlcmF0aW9uc1xuKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkeSgpO1xuICAgIH1cblxuICAgIHJlYWR5KCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIEp1c3QgYSBkdW1teSBjb25kaXRpb25cbiAgICAgICAgICAgICAgICBpZiAoL1xcdy8udGVzdChsb2NhdGlvbi5ocmVmKSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgcmVqZWN0KCdFcnJvcicpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxufTtcbiIsImltcG9ydCAqIGFzIGFwcCBmcm9tIFwiLi4vLi4vbGliL2FwcFwiO1xuaW1wb3J0IE1vZGVsIGZyb20gXCIuL01vZGVsXCJcbmltcG9ydCBWaWV3IGZyb20gXCIuL1ZpZXdcIlxuaW1wb3J0IENvbnRyb2xsZXIgZnJvbSBcIi4vQ29udHJvbGxlclwiXG5cblwidXNlIHN0cmljdFwiXG5cbi8qXG4gIEV4YW1wbGUgbW9kdWxlXG4qL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3Mge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHJldHVybiBhcHAuYWRkKFwiY29tbWVudEZvcm1cIiwgTW9kZWwsIFZpZXcsIENvbnRyb2xsZXIpO1xuICAgIH1cblxufTtcbiIsImltcG9ydCAqIGFzIGFwcCBmcm9tIFwiLi4vLi4vbGliL2FwcFwiO1xuXG5cInVzZSBzdHJpY3RcIlxuXG4vKlxuICBFeHRlbmRzIGBhcHAuQ29udHJvbGxlcmBcbiAgICAgIFByb3BlcnRpZXM6IGBtb2RlbGAsIGB2aWV3YFxuICAgICAgTWV0aG9kczogYGJpbmQoKWAgZm9yIERPTSBzZWxlY3RvcnNcbiovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBleHRlbmRzIGFwcC5Db250cm9sbGVyIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIC8vIFVwZGF0ZSB2aWV3IHdoZW4gbW9kZWwgY2hhbmdlc1xuICAgICAgICB0aGlzLm1vZGVsLm9uKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgICAgICBsZXQgY29tbWVudCA9IHRoaXMubW9kZWwuZ2V0KCdjb21tZW50Jyk7XG4gICAgICAgICAgICBpZiAoY29tbWVudCkge1xuICAgICAgICAgICAgICAgIGNvbW1lbnQgPSBgPGRpdj4ke3RoaXMubW9kZWwuZ2V0KCd1c2VyLm5hbWUnKX06ICR7Y29tbWVudH08L2Rpdj5gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy52aWV3LmdldCgnLmNvbW1lbnRBcmVhJykuaW5uZXJIVE1MID0gY29tbWVudDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gRXhhbXBsZSAyIHdheSBiaW5kaW5nc1xuICAgICAgICB0aGlzLmJpbmQoe1xuXG4gICAgICAgICAgICAnI25hbWUnOiAoZWwsIG1vZGVsLCB2aWV3LCBjb250cm9sbGVyKSA9PiB7XG4gICAgICAgICAgICAgICAgZWwub25rZXl1cCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwuc2V0KCd1c2VyLm5hbWUnLCBlbC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG1vZGVsLm9uKCdzZXRQb3N0JywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBlbC52YWx1ZSA9IG1vZGVsLmdldCgndXNlci5uYW1lJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAnI2NvbW1lbnQnOiAoZWwsIG1vZGVsLCB2aWV3LCBjb250cm9sbGVyKSA9PiB7XG4gICAgICAgICAgICAgICAgZWwub25rZXl1cCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbW9kZWwuc2V0KCdjb21tZW50JywgZWwudmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBtb2RlbC5vbignc2V0UG9zdCcsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZWwudmFsdWUgPSBtb2RlbC5nZXQoJ2NvbW1lbnQnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcbiAgICB9XG5cbn07XG4iLCJpbXBvcnQgKiBhcyBhcHAgZnJvbSBcIi4uLy4uL2xpYi9hcHBcIjtcblxuXCJ1c2Ugc3RyaWN0XCJcblxuLypcbiAgRXh0ZW5kcyBhcHAuTW9kZWxcbiAgICAgIE1ldGhvZHM6IGBzZXQoKWAsIGBnZXQoKWAsIGBvbignc2V0UHJlJ3wnc2V0UG9zdCd8J2NoYW5nZScpYFxuKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIGV4dGVuZHMgYXBwLk1vZGVsIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIC8vIEFyYml0cmFyeSBtZXRob2RcbiAgICAgICAgdGhpcy5zYW5pdGl6ZSA9IHByb3BzID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcCBpbiBwcm9wcykge1xuICAgICAgICAgICAgICAgIGlmIChwcm9wcy5oYXNPd25Qcm9wZXJ0eShwKSAmJiB0eXBlb2YgcHJvcHNbcF0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcHNbcF0gPSBwcm9wc1twXS5yZXBsYWNlKC9bXlxcd1xccychLiw7XS9nLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHByb3BzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IGxpc3RlbmVyXG4gICAgICAgIHRoaXMub24oJ3NldFByZScsIHByb3BzID0+IHRoaXMuc2FuaXRpemUocHJvcHMpKTtcblxuICAgICAgICAvLyBQb3B1bGF0ZSBtb2RlbFxuICAgICAgICB0aGlzLnNldCh7XG4gICAgICAgICAgICBjb21tZW50OiAnJyxcbiAgICAgICAgICAgIGRhdGU6IERhdGUubm93KClcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gU2V0IGJ5IHBhdGhcbiAgICAgICAgdGhpcy5zZXQoJ3VzZXIubmFtZScsICdHdWVzdCcpO1xuICAgIH1cblxufTtcbiIsImltcG9ydCAqIGFzIGFwcCBmcm9tIFwiLi4vLi4vbGliL2FwcFwiO1xuXG5cInVzZSBzdHJpY3RcIlxuXG4vKlxuICBFeHRlbmRzIGFwcC5WaWV3XG4gICAgICBQcm9wZXJ0aWVzOiBgZWxgXG4gICAgICBNZXRob2RzOiBgZ2V0KClgLCBgZ2V0QWxsKClgIGZvciBET00gc2VsZWN0b3JzXG4qL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgZXh0ZW5kcyBhcHAuVmlldyB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICAvLyBTZXQgRE9NIHJlZlxuICAgICAgICB0aGlzLmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb21tZW50Rm9ybVwiKTtcbiAgICB9XG5cbn07XG4iXX0=
