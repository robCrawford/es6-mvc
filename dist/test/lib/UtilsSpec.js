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

var _app = require("../../js/lib/app");

var app = _interopRequireWildcard(_app);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

describe("Object util tests", function () {

    describe("setNode", function () {

        var setNode = app.setNode;

        it("Should add a new property", function () {
            var tree = { a: 1, b: 2 };
            setNode(tree, "h", 77);

            expect(tree).toEqual({ a: 1, b: 2, h: 77 });
        });

        it("Should add a property at a new path", function () {
            var tree = { a: 1, b: 2 };
            setNode(tree, "h.j", 77);

            expect(tree).toEqual({ a: 1, b: 2, h: { j: 77 } });
        });

        it("Should add a property at a new deep path", function () {
            var tree = { a: 1, b: 2 };
            setNode(tree, "h.j.k.l", 77);

            expect(tree).toEqual({ a: 1, b: 2, h: { j: { k: { l: 77 } } } });
        });

        it("Should add a property at a partial deep path", function () {
            var tree = { a: { b: { c: { d: 77 } } } };
            setNode(tree, "a.b", 77);

            expect(tree).toEqual({ a: { b: 77 } });
        });

        it("Should add a new numerical property at root", function () {
            var tree = { a: 1, b: 2 };
            setNode(tree, "2", 77);

            expect(tree).toEqual({ a: 1, b: 2, "2": 77 });
        });

        it("Should add an array at a numerical path", function () {
            var tree = { a: 1, b: 2 };
            setNode(tree, "c.2", 77);

            //Stringify to allow child object comparison
            expect(JSON.stringify(tree)).toEqual(JSON.stringify({ a: 1, b: 2, c: [undefined, undefined, 77] }));
        });

        it("Should add an array at a deep numerical path", function () {
            var tree = { a: 1, b: 2 };
            setNode(tree, "c.2.a.1.2", 77);

            //Stringify to allow child object comparison
            expect(JSON.stringify(tree)).toEqual(JSON.stringify({ a: 1, b: 2, c: [undefined, undefined, { a: [undefined, [undefined, undefined, 77]] }] }));
        });
    });

    describe("getNode", function () {

        var getNode = app.getNode;

        it("Should get a property value", function () {
            var tree = { a: 1, b: 2 };
            expect(getNode(tree, "a")).toBe(1);
        });

        it("Should get a deep property value", function () {
            var tree = { a: { b: { c: 77 } }, b: 2 };
            expect(getNode(tree, "a.b.c")).toBe(77);
        });

        it("Should get a property containing a numerical index", function () {
            var tree = { a: { b: [{ c: 77 }] }, b: 2 };
            expect(getNode(tree, "a.b.0.c")).toBe(77);
        });

        it("Should return undefined for an invalid path", function () {
            var tree = { a: { b: [{ c: 77 }] }, b: 2 };
            expect(getNode(tree, "a.b.7.c.5.6")).toBe(undefined);
        });

        it("Should allow falsy values in path", function () {
            var tree = { 0: { 0: [{ 0: 0 }] } };
            expect(getNode(tree, "0.0.0.0")).toBe(0);
        });
    });

    describe("merge", function () {

        var merge = app.merge;

        it("Should add object properties", function () {
            var tree = { a: 1, b: [2, 3] },
                tree2 = { c: 3, d: 4 },
                tree3 = { e: 5, f: 6 };
            expect(merge(tree, tree2, tree3)).toEqual({ a: 1, b: [2, 3], c: 3, d: 4, e: 5, f: 6 });

            //Edge cases
            expect(merge()).toEqual({});
            expect(merge(tree)).toBe(tree);
            expect(merge("23")).toEqual({});
            expect(merge("23", "34")).toEqual({});
            expect(merge({ 2: "5" }, "34")).toEqual({ 0: "3", 1: "4", 2: "5" });
        });

        it("Should overwrite properties right to left", function () {
            var tree = { a: 1, b: [2, 3] },
                tree2 = { c: 3, b: [4] },
                tree3 = { a: 5, d: 6 };
            expect(merge(tree, tree2, tree3)).toEqual({ a: 5, b: [4], c: 3, d: 6 });
        });

        it("Should merge child objects right to left", function () {
            var tree = { a: { a: 1, b: [2, 3] } },
                tree2 = { a: { c: 3, b: [4] } },
                tree3 = { a: { a: 5, d: 6 } };
            expect(merge(tree, tree2, tree3)).toEqual({ a: { a: 5, b: [4], c: 3, d: 6 } });
        });

        it("Should merge deep child objects right to left", function () {
            var tree = { a: { a: [7, 8], b: { c: { d: { e: 77 } } } } },
                tree2 = { a: { a: 1, b: { c: { d: { e: 88 } } } } },
                tree3 = { a: { a: [6] } };
            expect(merge(tree, tree2, tree3)).toEqual({ a: { a: [6], b: { c: { d: { e: 88 } } } } });
        });

        it("Should not merge child objects when boolean false is passed in", function () {
            var refOb = { aa: 1, bb: 2 },
                tree = { a: 1, b: 2, c: {} },
                tree2 = { c: refOb };
            // Boolean is `mergeChildObs`
            var result = merge(false, tree, tree2);
            expect(result.c).toBe(refOb);
            expect(result).toEqual({ a: 1, b: 2, c: { aa: 1, bb: 2 } });
        });

        it("Should switch on and off merging child objects when booleans are passed in", function (done) {
            var refOb = { aa: 1, bb: 2 },
                tree = { a: 1, b: 2, c: {} },
                tree2 = { c: refOb },
                tree3 = { d: refOb },
                tree4 = { e: refOb };
            // Boolean switches `mergeChildObs` (also test multiple unused arguments, and callback argument)
            var result = merge(true, true, false, false, tree, tree2, true, false, done, true, tree3, false, tree4, true);
            expect(result.c).toBe(refOb);
            expect(result.d).not.toBe(refOb);
            expect(result.e).toBe(refOb);
            expect(result).toEqual({ a: 1, b: 2, c: { aa: 1, bb: 2 }, d: { aa: 1, bb: 2 }, e: { aa: 1, bb: 2 } });
        });

        it("Should ignore arguments of wrong type", function () {
            var tree = { a: { a: 1, b: [2, 3] } },
                tree2 = { a: { b: 6 } };
            expect(merge("", "", "", "", tree, tree2)).toEqual({ a: { a: 1, b: 6 } });

            tree = { a: 1, b: [2, 3] };
            expect(merge("", 99, tree, "", 88)).toEqual(tree);
            expect(merge(tree, 99, "", "", "")).toEqual(tree);
            expect(merge(99, tree, "", 88, 77)).toEqual(tree);
        });

        it("Should report changes", function () {
            var tree = { a: { a: 1, b: [2, 3] } },
                tree2 = { a: { c: 3, b: [4] } },
                tree3 = { a: { a: [6] } };

            merge(tree, tree2, function (isChanged) {
                expect(isChanged).toBe(true);
            });

            merge(tree, tree, function (isChanged) {
                expect(isChanged).toBe(false);
            });

            merge(tree, function () {}, function (isChanged) {
                expect(isChanged).toBe(false);
            });

            merge("", tree, tree3, function (isChanged) {
                expect(isChanged).toBe(true);
            });

            merge({ z: 88 }, tree, function (isChanged) {
                expect(isChanged).toBe(true);
            });

            merge({ z: { y: { x: 55 } } }, { z: { y: { x: 56 } } }, function (isChanged) {
                expect(isChanged).toBe(true);
            });
        });
    });
});

},{"../../js/lib/app":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvbGliL2FwcC5qcyIsInNyYy90ZXN0L2xpYi9VdGlsc1NwZWMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OztRQ0tnQixHLEdBQUEsRztRQXdCQSxHLEdBQUEsRztRQWdJQSxPLEdBQUEsTztRQWlCQSxPLEdBQUEsTztRQWtCQSxLLEdBQUEsSzs7OztBQWhNaEI7OztBQUdBLElBQU0sVUFBVSxFQUFoQjs7QUFFTyxTQUFTLEdBQVQsQ0FBYSxJQUFiLEVBQW1CLEtBQW5CLEVBQTBCLElBQTFCLEVBQWdDLFVBQWhDLEVBQTRDO0FBQy9DLGVBQVcsS0FBWCxHQUFtQixLQUFuQjtBQUNBLGVBQVcsSUFBWCxHQUFrQixJQUFsQjs7QUFFQSxRQUFJLE1BQU0sSUFBVixFQUFnQjtBQUNaLGNBQU0sSUFBTjtBQUNIO0FBQ0QsUUFBSSxLQUFLLElBQVQsRUFBZTtBQUNYLGFBQUssSUFBTDtBQUNIO0FBQ0QsUUFBSSxXQUFXLElBQWYsRUFBcUI7QUFDakIsbUJBQVcsSUFBWDtBQUNIOztBQUVEO0FBQ0EsVUFBTSxNQUFOOztBQUVBLFdBQVEsUUFBUSxJQUFSLElBQWdCO0FBQ3BCLGVBQU8sS0FEYTtBQUVwQixjQUFNLElBRmM7QUFHcEIsb0JBQVk7QUFIUSxLQUF4QjtBQUtIOztBQUVNLFNBQVMsR0FBVCxDQUFhLElBQWIsRUFBbUI7QUFDdEIsV0FBTyxRQUFRLElBQVIsQ0FBUDtBQUNIOztBQUVEOzs7O0lBR2EsSyxXQUFBLEs7QUFFVCxtQkFBYSxJQUFiLEVBQW1CO0FBQUE7O0FBQ2YsYUFBSyxJQUFMLEdBQVksRUFBWjtBQUNBLGFBQUssU0FBTCxHQUFpQjtBQUNiLGlCQUFLLEVBRFE7QUFFYixvQkFBUTtBQUZLLFNBQWpCO0FBSUEsYUFBSyxJQUFMLEdBQVksUUFBUSxLQUFLLElBQUwsQ0FBVSxJQUFWLENBQXBCO0FBQ0g7Ozs7aUNBRVM7QUFDTixnQkFB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QUMsR0FBRyxFQUFDLEdBQUcsRUFBSixFQUFKLEVBQUosRUFBTixFQUF5QixFQUFDLEdBQUcsRUFBQyxHQUFHLEVBQUMsR0FBRyxFQUFKLEVBQUosRUFBSixFQUF6QixFQUE0QyxVQUFTLFNBQVQsRUFBbUI7QUFDM0QsdUJBQU8sU0FBUCxFQUFrQixJQUFsQixDQUF1QixJQUF2QjtBQUNILGFBRkQ7QUFHSCxTQTVCRDtBQThCSCxLQXhHRDtBQTBHSCxDQXhNRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxuICBBcHBcbiovXG5jb25zdCBtb2R1bGVzID0gW107XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGQobmFtZSwgbW9kZWwsIHZpZXcsIGNvbnRyb2xsZXIpIHtcbiAgICBjb250cm9sbGVyLm1vZGVsID0gbW9kZWw7XG4gICAgY29udHJvbGxlci52aWV3ID0gdmlldztcblxuICAgIGlmIChtb2RlbC5pbml0KSB7XG4gICAgICAgIG1vZGVsLmluaXQoKTtcbiAgICB9XG4gICAgaWYgKHZpZXcuaW5pdCkge1xuICAgICAgICB2aWV3LmluaXQoKTtcbiAgICB9XG4gICAgaWYgKGNvbnRyb2xsZXIuaW5pdCkge1xuICAgICAgICBjb250cm9sbGVyLmluaXQoKTtcbiAgICB9XG5cbiAgICAvLyBSdW4gaW5pdGlhbCAnY2hhbmdlJyBjYWxsYmFja3NcbiAgICBtb2RlbC5jaGFuZ2UoKTtcblxuICAgIHJldHVybiAobW9kdWxlc1tuYW1lXSA9IHtcbiAgICAgICAgbW9kZWw6IG1vZGVsLFxuICAgICAgICB2aWV3OiB2aWV3LFxuICAgICAgICBjb250cm9sbGVyOiBjb250cm9sbGVyXG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXQobmFtZSkge1xuICAgIHJldHVybiBtb2R1bGVzW25hbWVdO1xufVxuXG4vKlxuICBNb2RlbFxuKi9cbmV4cG9ydCBjbGFzcyBNb2RlbHtcblxuICAgIGNvbnN0cnVjdG9yIChpbml0KSB7XG4gICAgICAgIHRoaXMudHJlZSA9IHt9O1xuICAgICAgICB0aGlzLmNhbGxiYWNrcyA9IHtcbiAgICAgICAgICAgIHNldDogW10sXG4gICAgICAgICAgICBjaGFuZ2U6IFtdXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaW5pdCA9IGluaXQgJiYgaW5pdC5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIGNoYW5nZSAoKSB7XG4gICAgICAgIGNvbnN0IGNoYW5nZUNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW1wiY2hhbmdlXCJdO1xuICAgICAgICBsZXQgaSA9IGNoYW5nZUNhbGxiYWNrcy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIGNoYW5nZUNhbGxiYWNrc1tpXS5jYWxsKHRoaXMsIHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYmVmb3JlU2V0IChwcm9wcykge1xuICAgICAgICAvLyBBbGxvd3MgdmFsaWRhdGlvbiBldGMuIGJlZm9yZSBzZXR0aW5nIHByb3BzXG4gICAgICAgIC8vIGBwcm9wc2AgaXMgYSBjb3B5IHRoYXQgY2FuIGJlIHNhZmVseSBtdXRhdGVkXG4gICAgICAgIGNvbnN0IHNldENhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW1wic2V0XCJdO1xuICAgICAgICBsZXQgaSA9IHNldENhbGxiYWNrcy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIHByb3BzID0gc2V0Q2FsbGJhY2tzW2ldLmNhbGwodGhpcywgcHJvcHMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm9wcztcbiAgICB9XG5cbiAgICBzZXQgKHByb3BzLCBhdFBhdGgpIHtcbiAgICAgICAgLy8gYGF0UGF0aGAgaXMgb3B0aW9uYWwgKGRlZmF1bHRzIHRvIHJvb3QpXG4gICAgICAgIC8vIEFsdGVybmF0aXZlIGFyZ3VtZW50czogKGtleSwgdmFsdWUsIGF0UGF0aClcbiAgICAgICAgY29uc3QgbW9kZWwgPSB0aGlzO1xuICAgICAgICBpZiAodHlwZW9mIHByb3BzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9wc09iID0ge307XG4gICAgICAgICAgICBwcm9wc09iW2FyZ3VtZW50c1swXV0gPSBhcmd1bWVudHNbMV07XG4gICAgICAgICAgICBwcm9wcyA9IHByb3BzT2I7XG4gICAgICAgICAgICBhdFBhdGggPSBhcmd1bWVudHNbMl07XG4gICAgICAgIH07XG4gICAgICAgIGxldCBjdXJyTm9kZSA9IChhdFBhdGggPyB0aGlzLnRyZWVbYXRQYXRoXSA6IHRoaXMudHJlZSk7XG4gICAgICAgIC8vIFJ1biBhbnkgXCJzZXRcIiBjYWxsYmFja3Mgb24gYSBjb3B5IG9mIGBwcm9wc2BcbiAgICAgICAgcHJvcHMgPSB0aGlzLmJlZm9yZVNldChtZXJnZSh7fSwgcHJvcHMpKTtcbiAgICAgICAgbWVyZ2UoY3Vyck5vZGUsIHByb3BzLCBpc0NoYW5nZWQgPT4ge1xuICAgICAgICAgICAgLy8gUnVuIGFueSBcImNoYW5nZVwiIGNhbGxiYWNrc1xuICAgICAgICAgICAgaWYgKGlzQ2hhbmdlZCkgbW9kZWwuY2hhbmdlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpczsgLy8gRm9yIGNoYWluaW5nXG4gICAgfVxuXG4gICAgZ2V0IChwYXRoKSB7XG4gICAgICAgIHJldHVybiBnZXROb2RlKHRoaXMudHJlZSwgcGF0aCk7XG4gICAgfVxuXG4gICAgb24gKGxhYmVsLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSB0aGlzLmNhbGxiYWNrc1tsYWJlbF07XG4gICAgICAgIGlmIChjYWxsYmFja3MpIGNhbGxiYWNrcy51bnNoaWZ0KGNhbGxiYWNrKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7IC8vIEZvciBjaGFpbmluZ1xuICAgIH1cblxuICAgIHRvSlNPTiAoKSB7XG4gICAgICAgIC8vIFJldHVybiB0cmVlIGZvciBKU09OLnN0cmluZ2lmeSgpXG4gICAgICAgIHJldHVybiB0aGlzLnRyZWU7XG4gICAgfVxufVxuXG4vKlxuICBWaWV3XG4qL1xuZXhwb3J0IGNsYXNzIFZpZXcge1xuXG4gICAgY29uc3RydWN0b3IgKGluaXQpIHtcbiAgICAgICAgdGhpcy5pbml0ID0gaW5pdCAmJiBpbml0LmJpbmQodGhpcyk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmVsKSB7XG4gICAgICAgICAgICB0aGlzLmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuZWwucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmVsKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLypcbiAgQ29udHJvbGxlclxuKi9cbmV4cG9ydCBjbGFzcyBDb250cm9sbGVyIHtcblxuICAgIGNvbnN0cnVjdG9yIChpbml0KSB7XG4gICAgICAgIHRoaXMuaW5pdCA9IGluaXQgJiYgaW5pdC5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIGJpbmQgKGJpbmRpbmdzKSB7XG4gICAgICAgIC8vIFJ1biBiaW5kaW5nIGZ1bmN0aW9ucyBmb3Igc2VsZWN0b3JzXG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3IgaW4gYmluZGluZ3MpIHtcbiAgICAgICAgICAgIGlmIChiaW5kaW5ncy5oYXNPd25Qcm9wZXJ0eShzZWxlY3RvcikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkb21FbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICBsZXQgaSA9IGRvbUVscy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICBiaW5kaW5nc1tzZWxlY3Rvcl0uY2FsbCh0aGlzLCBkb21FbHNbaV0sIHRoaXMubW9kZWwsIHRoaXMudmlldywgdGhpcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vKlxuICBVdGlsc1xuKi9cbmZ1bmN0aW9uIGlzRnVuY3Rpb24obykge1xuICAgIHJldHVybiB0eXBlb2YgbyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3Qobykge1xuICAgIHJldHVybiBvID09PSBPYmplY3QobykgJiZcbiAgICAgICAgICAgIW8ubm9kZVR5cGUgJiZcbiAgICAgICAgICAgIUFycmF5LmlzQXJyYXkobykgJiZcbiAgICAgICAgICAgIWlzRnVuY3Rpb24obykgJiZcbiAgICAgICAgICAgIShvIGluc3RhbmNlb2YgUmVnRXhwKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE5vZGUodHJlZSwgcGF0aFN0ciwgdmFsdWUpIHtcbi8vIFNldCBub2RlIGF0IHBhdGggc3RyaW5nIHRvIHZhbHVlXG4vLyBBbnkgbWlzc2luZyBub2RlcyBhcmUgY3JlYXRlZFxuLy8gTk9URTogYWxsIG51bWVyaWMgbm9kZXMgYmVsb3cgcm9vdCBhcmUgYXNzdW1lZCB0byBiZSBhcnJheSBpbmRleGVzXG4gICAgZ2V0Tm9kZSh0cmVlLCBwYXRoU3RyLCAoY3Vyck5vZGUsIHByb3AsIG5leHRQcm9wKSA9PiB7XG4gICAgICAgIC8vIExhc3Qgc2VnbWVudCBvZiBwYXRoIHN0cmluZywganVzdCBzZXQgdmFsdWVcbiAgICAgICAgaWYgKG5leHRQcm9wID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGN1cnJOb2RlW3Byb3BdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgLy9FbHNlIGNyZWF0ZSBhbnkgbWlzc2luZyBub2RlcyBpbiBwYXRoXG4gICAgICAgIGVsc2UgaWYgKGN1cnJOb2RlW3Byb3BdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBhbiBhcnJheSBpZiBuZXh0UHJvcCBpcyBudW1lcmljLCBvdGhlcndpc2UgYW4gb2JqZWN0XG4gICAgICAgICAgICBjdXJyTm9kZVtwcm9wXSA9IGlzTmFOKG5leHRQcm9wKSA/IHt9IDogW107XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGUodHJlZSwgcGF0aFN0ciwgZWFjaENhbGxiYWNrKSB7XG4vLyBHZXQgbm9kZSBmcm9tIHBhdGggc3RyaW5nXG4vLyBPcHRpb25hbCBgZWFjaENhbGxiYWNrYCBpcyBwYXNzZWQgKGN1cnJOb2RlLCBwcm9wLCBuZXh0UHJvcClcbi8vIFRoaXMgYWxsb3dzIHRoZSBuZXh0IG5vZGUgdG8gYmUgY3JlYXRlZCBvciBjaGFuZ2VkIGJlZm9yZSBlYWNoIHRyYXZlcnNhbFxuICAgIGNvbnN0IHBhdGhBcnIgPSBwYXRoU3RyLnNwbGl0KFwiLlwiKTtcbiAgICBsZXQgY3Vyck5vZGUgPSB0cmVlO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHBhdGhBcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgY29uc3QgcHJvcCA9IHBhdGhBcnJbaV07XG4gICAgICAgIGlmIChlYWNoQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIGVhY2hDYWxsYmFjayhjdXJyTm9kZSwgcHJvcCwgcGF0aEFycltpICsgMV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjdXJyTm9kZSA9PT0gdW5kZWZpbmVkKSBicmVhaztcbiAgICAgICAgZWxzZSBjdXJyTm9kZSA9IGN1cnJOb2RlW3Byb3BdO1xuICAgIH1cbiAgICByZXR1cm4gY3Vyck5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZSggLyogW21lcmdlQ2hpbGRPYnMsXSB7fSwge30gWywgLi4uXSBbLCBjYWxsYmFja10gKi8gKSB7XG4vLyBBZGQgb3Igb3ZlcndyaXRlIGFsbCBwcm9wZXJ0aWVzIHJpZ2h0IHRvIGxlZnRcbi8vIEJ5IGRlZmF1bHQgY2hpbGQgb2JqZWN0cyBhcmUgbWVyZ2VkIHJlY3Vyc2l2ZWx5IChidXQgbm90IGFycmF5cylcbi8vIElmIGEgYm9vbGVhbiBpcyBzdXBwbGllZCwgaXQgYmVjb21lcyBgbWVyZ2VDaGlsZE9ic2AgdmFsdWUgdW50aWwgYW5vdGhlciBib29sZWFuIGlzIGZvdW5kXG4vLyBJZiBhIGNhbGxiYWNrIGlzIHN1cHBsaWVkLCBpdCB3aWxsIHJlY2VpdmUgYSBib29sZWFuIGFyZ3VtZW50IGBpc0NoYW5nZWRgXG4gICAgbGV0IGxldmVsID0gMCxcbiAgICAgICAgY2hhbmdlQ291bnQgPSAwLFxuICAgICAgICBtZXJnZUNoaWxkT2JzID0gdHJ1ZSxcbiAgICAgICAgY2FsbGJhY2ssXG4gICAgICAgIHJlc3VsdCA9IHJ1bi5hcHBseSh0aGlzLCBbMCwgYXJndW1lbnRzXSk7XG5cbiAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKCEhY2hhbmdlQ291bnQpO1xuICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICBmdW5jdGlvbiBydW4obGV2ZWwsIHBhcmFtcykge1xuICAgICAgICBsZXQgcGFyYW0sXG4gICAgICAgICAgICByZXRPYixcbiAgICAgICAgICAgIHBhcmFtc0NvdW50ID0gcGFyYW1zLmxlbmd0aDtcblxuICAgICAgICAvLyBDaGlsZCBvYmplY3RzXG4gICAgICAgIC8vIE1lcmdlIGludG8gbGVmdG1vc3QgcGFyYW0gaWYgYW4gb2JqZWN0LCBvciBjcmVhdGUgb2JqZWN0IHRvIG1lcmdlIGludG9cbiAgICAgICAgaWYgKGxldmVsKSB7XG4gICAgICAgICAgICByZXRPYiA9IGlzT2JqZWN0KHBhcmFtc1swXSkgPyBwYXJhbXNbMF0gOiB7fVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJhbXNDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBwYXJhbSA9IHBhcmFtc1tpXTtcblxuICAgICAgICAgICAgLy8gVG9wIGxldmVsIHBhcmFtcyBtYXkgY29udGFpbiBvdGhlciBhcmd1bWVudHNcbiAgICAgICAgICAgIGlmICghbGV2ZWwgJiYgcGFyYW0gIT0gbnVsbCkgeyAvLyBgdW5kZWZpbmVkYCBvciBgbnVsbGBcbiAgICAgICAgICAgICAgICAvLyBGaXJzdCBvYmplY3QgYmVjb21lcyByZXR1cm5lZCBvYmplY3RcbiAgICAgICAgICAgICAgICAvLyBBbHNvIGFsbG93IGEgRE9NIG5vZGUgZm9yIG1lcmdpbmcgaW50b1xuICAgICAgICAgICAgICAgIGlmICghcmV0T2IgJiYgaXNPYmplY3QocGFyYW0pIHx8IHBhcmFtLm5vZGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldE9iID0gcGFyYW07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBgbWVyZ2VDaGlsZE9ic2AgYm9vbGVhbiBhcmd1bWVudHNcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtID09PSBcImJvb2xlYW5cIikge1xuICAgICAgICAgICAgICAgICAgICBtZXJnZUNoaWxkT2JzID0gcGFyYW07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBMYXN0IHBhc3NlZCBpbiBmdW5jdGlvbiBiZWNvbWVzIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhbSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gcGFyYW07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXJldE9iKSBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAobGV0IHAgaW4gcGFyYW0pIHtcbiAgICAgICAgICAgICAgICBpZiAocGFyYW0uaGFzT3duUHJvcGVydHkocCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsID0gcGFyYW1bcF07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gTWVyZ2UgY2hpbGQgb2JqZWN0cyAocmVjdXJzaXZlKVxuICAgICAgICAgICAgICAgICAgICBpZiAobWVyZ2VDaGlsZE9icyAmJiBpc09iamVjdCh2YWwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXRPYltwXSA9IHJ1bihsZXZlbCsxLCBbcmV0T2JbcF0sIHZhbF0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbCAhPT0gcmV0T2JbcF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZUNvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXRPYltwXSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0T2IgfHwge307XG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi8uLi9qcy9saWIvYXBwXCI7XG5cbmRlc2NyaWJlKFwiT2JqZWN0IHV0aWwgdGVzdHNcIiwgZnVuY3Rpb24oKXtcblxuICAgIGRlc2NyaWJlKFwic2V0Tm9kZVwiLCBmdW5jdGlvbigpe1xuXG4gICAgICAgIHZhciBzZXROb2RlID0gYXBwLnNldE5vZGU7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgYWRkIGEgbmV3IHByb3BlcnR5XCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOjEsIGI6Mn07XG4gICAgICAgICAgICBzZXROb2RlKHRyZWUsIFwiaFwiLCA3Nyk7XG5cbiAgICAgICAgICAgIGV4cGVjdCh0cmVlKS50b0VxdWFsKHthOjEsIGI6MiwgaDo3N30pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBhZGQgYSBwcm9wZXJ0eSBhdCBhIG5ldyBwYXRoXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOjEsIGI6Mn07XG4gICAgICAgICAgICBzZXROb2RlKHRyZWUsIFwiaC5qXCIsIDc3KTtcblxuICAgICAgICAgICAgZXhwZWN0KHRyZWUpLnRvRXF1YWwoe2E6MSwgYjoyLCBoOiB7ajogNzd9fSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGFkZCBhIHByb3BlcnR5IGF0IGEgbmV3IGRlZXAgcGF0aFwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToxLCBiOjJ9O1xuICAgICAgICAgICAgc2V0Tm9kZSh0cmVlLCBcImguai5rLmxcIiwgNzcpO1xuXG4gICAgICAgICAgICBleHBlY3QodHJlZSkudG9FcXVhbCh7YToxLCBiOjIsIGg6IHtqOiB7azoge2w6IDc3fX19fSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGFkZCBhIHByb3BlcnR5IGF0IGEgcGFydGlhbCBkZWVwIHBhdGhcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6IHtiOiB7Yzoge2Q6IDc3fX19fTtcbiAgICAgICAgICAgIHNldE5vZGUodHJlZSwgXCJhLmJcIiwgNzcpO1xuXG4gICAgICAgICAgICBleHBlY3QodHJlZSkudG9FcXVhbCh7YToge2I6Nzd9fSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGFkZCBhIG5ldyBudW1lcmljYWwgcHJvcGVydHkgYXQgcm9vdFwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToxLCBiOjJ9O1xuICAgICAgICAgICAgc2V0Tm9kZSh0cmVlLCBcIjJcIiwgNzcpO1xuXG4gICAgICAgICAgICBleHBlY3QodHJlZSkudG9FcXVhbCh7YToxLCBiOjIsIFwiMlwiOjc3fSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGFkZCBhbiBhcnJheSBhdCBhIG51bWVyaWNhbCBwYXRoXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOjEsIGI6Mn07XG4gICAgICAgICAgICBzZXROb2RlKHRyZWUsIFwiYy4yXCIsIDc3KTtcblxuICAgICAgICAgICAgLy9TdHJpbmdpZnkgdG8gYWxsb3cgY2hpbGQgb2JqZWN0IGNvbXBhcmlzb25cbiAgICAgICAgICAgIGV4cGVjdChKU09OLnN0cmluZ2lmeSh0cmVlKSkudG9FcXVhbChcbiAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7YToxLCBiOjIsIGM6W3VuZGVmaW5lZCwgdW5kZWZpbmVkLCA3N119KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgYWRkIGFuIGFycmF5IGF0IGEgZGVlcCBudW1lcmljYWwgcGF0aFwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToxLCBiOjJ9O1xuICAgICAgICAgICAgc2V0Tm9kZSh0cmVlLCBcImMuMi5hLjEuMlwiLCA3Nyk7XG5cbiAgICAgICAgICAgIC8vU3RyaW5naWZ5IHRvIGFsbG93IGNoaWxkIG9iamVjdCBjb21wYXJpc29uXG4gICAgICAgICAgICBleHBlY3QoSlNPTi5zdHJpbmdpZnkodHJlZSkpLnRvRXF1YWwoXG4gICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe2E6MSwgYjoyLCBjOlt1bmRlZmluZWQsIHVuZGVmaW5lZCwge2E6IFt1bmRlZmluZWQsIFt1bmRlZmluZWQsIHVuZGVmaW5lZCwgNzddXX1dfSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgICBkZXNjcmliZShcImdldE5vZGVcIiwgZnVuY3Rpb24oKXtcblxuICAgICAgICB2YXIgZ2V0Tm9kZSA9IGFwcC5nZXROb2RlO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGdldCBhIHByb3BlcnR5IHZhbHVlXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOjEsIGI6Mn07XG4gICAgICAgICAgICBleHBlY3QoZ2V0Tm9kZSh0cmVlLCBcImFcIikpLnRvQmUoMSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGdldCBhIGRlZXAgcHJvcGVydHkgdmFsdWVcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6e2I6e2M6Nzd9fSwgYjoyfTtcbiAgICAgICAgICAgIGV4cGVjdChnZXROb2RlKHRyZWUsIFwiYS5iLmNcIikpLnRvQmUoNzcpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBnZXQgYSBwcm9wZXJ0eSBjb250YWluaW5nIGEgbnVtZXJpY2FsIGluZGV4XCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOntiOlt7YzogNzd9XX0sIGI6Mn07XG4gICAgICAgICAgICBleHBlY3QoZ2V0Tm9kZSh0cmVlLCBcImEuYi4wLmNcIikpLnRvQmUoNzcpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCByZXR1cm4gdW5kZWZpbmVkIGZvciBhbiBpbnZhbGlkIHBhdGhcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6e2I6W3tjOiA3N31dfSwgYjoyfTtcbiAgICAgICAgICAgIGV4cGVjdChnZXROb2RlKHRyZWUsIFwiYS5iLjcuYy41LjZcIikpLnRvQmUodW5kZWZpbmVkKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgYWxsb3cgZmFsc3kgdmFsdWVzIGluIHBhdGhcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0gezA6ezA6W3swOiAwfV19fTtcbiAgICAgICAgICAgIGV4cGVjdChnZXROb2RlKHRyZWUsIFwiMC4wLjAuMFwiKSkudG9CZSgwKTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKFwibWVyZ2VcIiwgZnVuY3Rpb24oKXtcblxuICAgICAgICB2YXIgbWVyZ2UgPSBhcHAubWVyZ2U7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgYWRkIG9iamVjdCBwcm9wZXJ0aWVzXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOjEsIGI6WzIsIDNdfSxcbiAgICAgICAgICAgICAgICB0cmVlMiA9IHtjOjMsIGQ6NH0sXG4gICAgICAgICAgICAgICAgdHJlZTMgPSB7ZTo1LCBmOjZ9O1xuICAgICAgICAgICAgZXhwZWN0KG1lcmdlKHRyZWUsIHRyZWUyLCB0cmVlMykpLnRvRXF1YWwoe2E6MSwgYjpbMiwgM10sIGM6MywgZDo0LCBlOjUsIGY6Nn0pO1xuXG4gICAgICAgICAgICAvL0VkZ2UgY2FzZXNcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZSgpKS50b0VxdWFsKHt9KTtcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZSh0cmVlKSkudG9CZSh0cmVlKTtcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZShcIjIzXCIpKS50b0VxdWFsKHt9KTtcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZShcIjIzXCIsIFwiMzRcIikpLnRvRXF1YWwoe30pO1xuICAgICAgICAgICAgZXhwZWN0KG1lcmdlKHsyOiBcIjVcIn0sIFwiMzRcIikpLnRvRXF1YWwoezA6IFwiM1wiLCAxOiBcIjRcIiwgMjpcIjVcIn0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBvdmVyd3JpdGUgcHJvcGVydGllcyByaWdodCB0byBsZWZ0XCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOjEsIGI6WzIsIDNdfSxcbiAgICAgICAgICAgICAgICB0cmVlMiA9IHtjOjMsIGI6WzRdfSxcbiAgICAgICAgICAgICAgICB0cmVlMyA9IHthOjUsIGQ6Nn07XG4gICAgICAgICAgICBleHBlY3QobWVyZ2UodHJlZSwgdHJlZTIsIHRyZWUzKSkudG9FcXVhbCh7YTo1LCBiOls0XSwgYzozLCBkOjZ9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgbWVyZ2UgY2hpbGQgb2JqZWN0cyByaWdodCB0byBsZWZ0XCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOiB7YToxLCBiOlsyLCAzXX19LFxuICAgICAgICAgICAgICAgIHRyZWUyID0ge2E6IHtjOjMsIGI6WzRdfX0sXG4gICAgICAgICAgICAgICAgdHJlZTMgPSB7YToge2E6NSwgZDo2fX07XG4gICAgICAgICAgICBleHBlY3QobWVyZ2UodHJlZSwgdHJlZTIsIHRyZWUzKSkudG9FcXVhbCh7YToge2E6NSwgYjpbNF0sIGM6MywgZDo2fX0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBtZXJnZSBkZWVwIGNoaWxkIG9iamVjdHMgcmlnaHQgdG8gbGVmdFwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToge2E6IFs3LCA4XSwgYjp7Yzp7ZDp7ZTo3N319fX19LFxuICAgICAgICAgICAgICAgIHRyZWUyID0ge2E6IHthOjEsIGI6e2M6e2Q6e2U6ODh9fX19fSxcbiAgICAgICAgICAgICAgICB0cmVlMyA9IHthOiB7YTogWzZdfX07XG4gICAgICAgICAgICBleHBlY3QobWVyZ2UodHJlZSwgdHJlZTIsIHRyZWUzKSkudG9FcXVhbCh7YToge2E6WzZdLCBiOntjOntkOntlOjg4fX19fX0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBub3QgbWVyZ2UgY2hpbGQgb2JqZWN0cyB3aGVuIGJvb2xlYW4gZmFsc2UgaXMgcGFzc2VkIGluXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcmVmT2IgPSB7YWE6MSwgYmI6Mn0sXG4gICAgICAgICAgICAgICAgdHJlZSA9IHthOjEsIGI6MiwgYzp7fX0sXG4gICAgICAgICAgICAgICAgdHJlZTIgPSB7YzogcmVmT2J9O1xuICAgICAgICAgICAgLy8gQm9vbGVhbiBpcyBgbWVyZ2VDaGlsZE9ic2BcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBtZXJnZShmYWxzZSwgdHJlZSwgdHJlZTIpO1xuICAgICAgICAgICAgZXhwZWN0KHJlc3VsdC5jKS50b0JlKHJlZk9iKTtcbiAgICAgICAgICAgIGV4cGVjdChyZXN1bHQpLnRvRXF1YWwoe2E6IDEsIGI6MiwgYzp7YWE6MSwgYmI6Mn19KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgc3dpdGNoIG9uIGFuZCBvZmYgbWVyZ2luZyBjaGlsZCBvYmplY3RzIHdoZW4gYm9vbGVhbnMgYXJlIHBhc3NlZCBpblwiLCBmdW5jdGlvbihkb25lKXtcbiAgICAgICAgICAgIHZhciByZWZPYiA9IHthYToxLCBiYjoyfSxcbiAgICAgICAgICAgICAgICB0cmVlID0ge2E6MSwgYjoyLCBjOnt9fSxcbiAgICAgICAgICAgICAgICB0cmVlMiA9IHtjOiByZWZPYn0sXG4gICAgICAgICAgICAgICAgdHJlZTMgPSB7ZDogcmVmT2J9LFxuICAgICAgICAgICAgICAgIHRyZWU0ID0ge2U6IHJlZk9ifTtcbiAgICAgICAgICAgIC8vIEJvb2xlYW4gc3dpdGNoZXMgYG1lcmdlQ2hpbGRPYnNgIChhbHNvIHRlc3QgbXVsdGlwbGUgdW51c2VkIGFyZ3VtZW50cywgYW5kIGNhbGxiYWNrIGFyZ3VtZW50KVxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG1lcmdlKHRydWUsIHRydWUsIGZhbHNlLCBmYWxzZSwgdHJlZSwgdHJlZTIsIHRydWUsIGZhbHNlLCBkb25lLCB0cnVlLCB0cmVlMywgZmFsc2UsIHRyZWU0LCB0cnVlKTtcbiAgICAgICAgICAgIGV4cGVjdChyZXN1bHQuYykudG9CZShyZWZPYik7XG4gICAgICAgICAgICBleHBlY3QocmVzdWx0LmQpLm5vdC50b0JlKHJlZk9iKTtcbiAgICAgICAgICAgIGV4cGVjdChyZXN1bHQuZSkudG9CZShyZWZPYik7XG4gICAgICAgICAgICBleHBlY3QocmVzdWx0KS50b0VxdWFsKHthOiAxLCBiOjIsIGM6e2FhOjEsIGJiOjJ9LCBkOnthYToxLCBiYjoyfSwgZTp7YWE6MSwgYmI6Mn19KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgaWdub3JlIGFyZ3VtZW50cyBvZiB3cm9uZyB0eXBlXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOiB7YTogMSwgYjpbMiwgM119fSxcbiAgICAgICAgICAgICAgICB0cmVlMiA9IHthOiB7YjogNn19O1xuICAgICAgICAgICAgZXhwZWN0KG1lcmdlKFwiXCIsIFwiXCIsIFwiXCIsIFwiXCIsIHRyZWUsIHRyZWUyKSkudG9FcXVhbCh7YToge2E6IDEsIGI6Nn19KTtcblxuICAgICAgICAgICAgdHJlZSA9IHthOjEsIGI6WzIsIDNdfTtcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZShcIlwiLCA5OSwgdHJlZSwgXCJcIiwgODgpKS50b0VxdWFsKHRyZWUpO1xuICAgICAgICAgICAgZXhwZWN0KG1lcmdlKHRyZWUsIDk5LCBcIlwiLCBcIlwiLCBcIlwiKSkudG9FcXVhbCh0cmVlKTtcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZSg5OSwgdHJlZSwgXCJcIiwgODgsIDc3KSkudG9FcXVhbCh0cmVlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgcmVwb3J0IGNoYW5nZXNcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6IHthOjEsIGI6WzIsIDNdfX0sXG4gICAgICAgICAgICAgICAgdHJlZTIgPSB7YToge2M6MywgYjpbNF19fSxcbiAgICAgICAgICAgICAgICB0cmVlMyA9IHthOiB7YTogWzZdfX07XG5cbiAgICAgICAgICAgIG1lcmdlKHRyZWUsIHRyZWUyLCBmdW5jdGlvbihpc0NoYW5nZWQpe1xuICAgICAgICAgICAgICAgIGV4cGVjdChpc0NoYW5nZWQpLnRvQmUodHJ1ZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbWVyZ2UodHJlZSwgdHJlZSwgZnVuY3Rpb24oaXNDaGFuZ2VkKXtcbiAgICAgICAgICAgICAgICBleHBlY3QoaXNDaGFuZ2VkKS50b0JlKGZhbHNlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBtZXJnZSh0cmVlLCBmdW5jdGlvbigpe30sIGZ1bmN0aW9uKGlzQ2hhbmdlZCl7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGlzQ2hhbmdlZCkudG9CZShmYWxzZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbWVyZ2UoXCJcIiwgdHJlZSwgdHJlZTMsIGZ1bmN0aW9uKGlzQ2hhbmdlZCl7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGlzQ2hhbmdlZCkudG9CZSh0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBtZXJnZSh7ejogODh9LCB0cmVlLCBmdW5jdGlvbihpc0NoYW5nZWQpe1xuICAgICAgICAgICAgICAgIGV4cGVjdChpc0NoYW5nZWQpLnRvQmUodHJ1ZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbWVyZ2Uoe3o6IHt5OiB7eDogNTV9fX0sIHt6OiB7eToge3g6IDU2fX19LCBmdW5jdGlvbihpc0NoYW5nZWQpe1xuICAgICAgICAgICAgICAgIGV4cGVjdChpc0NoYW5nZWQpLnRvQmUodHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG5cbiJdfQ==
