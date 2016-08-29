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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvbGliL2FwcC5qcyIsInNyYy90ZXN0L2xpYi9VdGlsc1NwZWMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUFFQTs7Ozs7Ozs7OztRQUtnQixHLEdBQUEsRztRQXFCQSxHLEdBQUEsRztRQWdKQSxPLEdBQUEsTztRQXlCQSxPLEdBQUEsTztRQWtCQSxLLEdBQUEsSzs7Ozs7O0FBbE5oQixJQUFNLFVBQVUsRUFBaEI7O0FBRU8sU0FBUyxHQUFULENBQWEsSUFBYixFQUFtQixLQUFuQixFQUEwQixJQUExQixFQUFnQyxVQUFoQyxFQUE0QztBQUMvQyxlQUFXLEtBQVgsR0FBbUIsS0FBbkI7QUFDQSxlQUFXLElBQVgsR0FBa0IsSUFBbEI7O0FBRUEsUUFBSSxLQUFLLElBQVQsRUFBZTtBQUNYLGFBQUssSUFBTDtBQUNIO0FBQ0QsUUFBSSxXQUFXLElBQWYsRUFBcUI7QUFDakIsbUJBQVcsSUFBWCxDQUFnQixLQUFoQixFQUF1QixJQUF2QixFQUE2QixVQUE3QjtBQUNIO0FBQ0QsUUFBSSxNQUFNLElBQVYsRUFBZ0I7QUFDWixjQUFNLElBQU47QUFDSDs7QUFFRCxXQUFRLFFBQVEsSUFBUixJQUFnQjtBQUNwQixlQUFPLEtBRGE7QUFFcEIsY0FBTSxJQUZjO0FBR3BCLG9CQUFZO0FBSFEsS0FBeEI7QUFLSDs7QUFFTSxTQUFTLEdBQVQsQ0FBYSxJQUFiLEVBQW1CO0FBQ3RCLFdBQU8sUUFBUSxJQUFSLENBQVA7QUFDSDs7QUFFRDs7OztJQUdhLEssV0FBQSxLO0FBRVQsbUJBQWEsSUFBYixFQUFtQjtBQUFBOztBQUNmLGFBQUssSUFBTCxHQUFZLEVBQVo7QUFDQSxhQUFLLFNBQUwsR0FBaUI7QUFDYixvQkFBUSxFQURLO0FBRWIscUJBQVMsRUFGSTtBQUdiLG9CQUFRO0FBSEssU0FBakI7QUFLQSxhQUFLLElBQUwsR0FBWSxRQUFRLEtBQUssSUFBTCxD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WSxZQUFVLENBQUUsQ0FBeEIsRUFBMEIsVUFBUyxTQUFULEVBQW1CO0FBQ3pDLHVCQUFPLFNBQVAsRUFBa0IsSUFBbEIsQ0FBdUIsS0FBdkI7QUFDSCxhQUZEOztBQUlBLGtCQUFNLEVBQU4sRUFBVSxJQUFWLEVBQWdCLEtBQWhCLEVBQXVCLFVBQVMsU0FBVCxFQUFtQjtBQUN0Qyx1QkFBTyxTQUFQLEVBQWtCLElBQWxCLENBQXVCLElBQXZCO0FBQ0gsYUFGRDs7QUFJQSxrQkFBTSxFQUFDLEdBQUcsRUFBSixFQUFOLEVBQWUsSUFBZixFQUFxQixVQUFTLFNBQVQsRUFBbUI7QUFDcEMsdUJBQU8sU0FBUCxFQUFrQixJQUFsQixDQUF1QixJQUF2QjtBQUNILGFBRkQ7O0FBSUEsa0JBQU0sRUFBQyxHQUFHLEVBQUMsR0FBRyxFQUFDLEdBQUcsRUFBSixFQUFKLEVBQUosRUFBTixFQUF5QixFQUFDLEdBQUcsRUFBQyxHQUFHLEVBQUMsR0FBRyxFQUFKLEVBQUosRUFBSixFQUF6QixFQUE0QyxVQUFTLFNBQVQsRUFBbUI7QUFDM0QsdUJBQU8sU0FBUCxFQUFrQixJQUFsQixDQUF1QixJQUF2QjtBQUNILGFBRkQ7QUFHSCxTQTVCRDtBQThCSCxLQXhHRDtBQTBHSCxDQXhNRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcblxuLypcbiAgQXBwXG4qL1xuY29uc3QgbW9kdWxlcyA9IFtdO1xuXG5leHBvcnQgZnVuY3Rpb24gYWRkKG5hbWUsIG1vZGVsLCB2aWV3LCBjb250cm9sbGVyKSB7XG4gICAgY29udHJvbGxlci5tb2RlbCA9IG1vZGVsO1xuICAgIGNvbnRyb2xsZXIudmlldyA9IHZpZXc7XG5cbiAgICBpZiAodmlldy5pbml0KSB7XG4gICAgICAgIHZpZXcuaW5pdCgpO1xuICAgIH1cbiAgICBpZiAoY29udHJvbGxlci5pbml0KSB7XG4gICAgICAgIGNvbnRyb2xsZXIuaW5pdChtb2RlbCwgdmlldywgY29udHJvbGxlcik7XG4gICAgfVxuICAgIGlmIChtb2RlbC5pbml0KSB7XG4gICAgICAgIG1vZGVsLmluaXQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gKG1vZHVsZXNbbmFtZV0gPSB7XG4gICAgICAgIG1vZGVsOiBtb2RlbCxcbiAgICAgICAgdmlldzogdmlldyxcbiAgICAgICAgY29udHJvbGxlcjogY29udHJvbGxlclxuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0KG5hbWUpIHtcbiAgICByZXR1cm4gbW9kdWxlc1tuYW1lXTtcbn1cblxuLypcbiAgTW9kZWxcbiovXG5leHBvcnQgY2xhc3MgTW9kZWx7XG5cbiAgICBjb25zdHJ1Y3RvciAoaW5pdCkge1xuICAgICAgICB0aGlzLnRyZWUgPSB7fTtcbiAgICAgICAgdGhpcy5jYWxsYmFja3MgPSB7XG4gICAgICAgICAgICBzZXRQcmU6IFtdLFxuICAgICAgICAgICAgc2V0UG9zdDogW10sXG4gICAgICAgICAgICBjaGFuZ2U6IFtdXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaW5pdCA9IGluaXQgJiYgaW5pdC5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIHNldFByZSAocHJvcHMpIHtcbiAgICAvLyBBbGxvd3MgdmFsaWRhdGlvbiBldGMuIGJlZm9yZSBzZXR0aW5nIHByb3BzXG4gICAgLy8gYHByb3BzYCBpcyBhIGNvcHkgdGhhdCBjYW4gYmUgc2FmZWx5IG11dGF0ZWRcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gdGhpcy5jYWxsYmFja3NbXCJzZXRQcmVcIl07XG4gICAgICAgIGxldCBpID0gY2FsbGJhY2tzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgcHJvcHMgPSBjYWxsYmFja3NbaV0uY2FsbCh0aGlzLCBwcm9wcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb3BzO1xuICAgIH1cblxuICAgIHNldFBvc3QgKHByb3BzKSB7XG4gICAgLy8gUnVucyBjYWxsYmFja3MgYWZ0ZXIgYHNldCgpYCB3aGV0aGVyIG1vZGVsIGNoYW5nZWQgb3Igbm90XG4gICAgICAgIHRoaXMucnVuQ2FsbGJhY2tzKFwic2V0UG9zdFwiKTtcbiAgICB9XG5cbiAgICBjaGFuZ2UgKCkge1xuICAgIC8vIFJ1bnMgY2FsbGJhY2tzIGFmdGVyIGBzZXQoKWAgaWYgbW9kZWwgY2hhbmdlZFxuICAgICAgICB0aGlzLnJ1bkNhbGxiYWNrcyhcImNoYW5nZVwiKTtcbiAgICB9XG5cbiAgICBzZXQgKHByb3BzT3JQYXRoLCB2YWx1ZSkge1xuICAgIC8vIEFjY2VwdHMgcHJvcHMgb2JqZWN0IGB7Li4ufWAgT1IgJ3BhdGgnLCAndmFsdWUnXG4gICAgICAgIGxldCBjaGFuZ2VFdmVudDtcblxuICAgICAgICBpZiAoaXNPYmplY3QocHJvcHNPclBhdGgpKSB7XG4gICAgICAgICAgICAvLyBSdW4gYW55IFwic2V0UHJlXCIgY2FsbGJhY2tzIG9uIGEgY29weSBvZiBgcHJvcHNgXG4gICAgICAgICAgICBjb25zdCBwcm9wcyA9IHRoaXMuc2V0UHJlKG1lcmdlKHt9LCBwcm9wc09yUGF0aCkpO1xuICAgICAgICAgICAgbWVyZ2UodGhpcy50cmVlLCBwcm9wcywgaXNDaGFuZ2VkID0+IGNoYW5nZUV2ZW50ID0gaXNDaGFuZ2VkKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBwcm9wc09yUGF0aDtcbiAgICAgICAgICAgIC8vIFJ1biBhbnkgXCJzZXRQcmVcIiBjYWxsYmFja3NcbiAgICAgICAgICAgIHZhbHVlID0gdGhpcy5zZXRQcmUoe1twYXRoXTogdmFsdWV9KVtwYXRoXTtcbiAgICAgICAgICAgIGNoYW5nZUV2ZW50ID0gc2V0Tm9kZSh0aGlzLnRyZWUsIHBhdGgsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhbmdlRXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRQb3N0KCk7XG4gICAgICAgIHJldHVybiB0aGlzOyAvLyBGb3IgY2hhaW5pbmdcbiAgICB9XG5cbiAgICBnZXQgKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIGdldE5vZGUodGhpcy50cmVlLCBwYXRoKTtcbiAgICB9XG5cbiAgICBvbiAobGFiZWwsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW2xhYmVsXTtcbiAgICAgICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICAgICAgY2FsbGJhY2tzLnVuc2hpZnQoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzOyAvLyBGb3IgY2hhaW5pbmdcbiAgICB9XG5cbiAgICBydW5DYWxsYmFja3MgKGxhYmVsKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW2xhYmVsXTtcbiAgICAgICAgbGV0IGkgPSBjYWxsYmFja3MubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBjYWxsYmFja3NbaV0uY2FsbCh0aGlzLCB0aGlzLnRyZWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdG9KU09OICgpIHtcbiAgICAvLyBSZXR1cm4gdHJlZSBmb3IgSlNPTi5zdHJpbmdpZnkoKVxuICAgICAgICByZXR1cm4gdGhpcy50cmVlO1xuICAgIH1cbn1cblxuLypcbiAgVmlld1xuKi9cbmV4cG9ydCBjbGFzcyBWaWV3IHtcblxuICAgIGNvbnN0cnVjdG9yIChpbml0KSB7XG4gICAgICAgIHRoaXMuaW5pdCA9IGluaXQgJiYgaW5pdC5iaW5kKHRoaXMpO1xuXG4gICAgICAgIGlmICghdGhpcy5lbCkge1xuICAgICAgICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmVsLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5lbCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qXG4gIENvbnRyb2xsZXJcbiovXG5leHBvcnQgY2xhc3MgQ29udHJvbGxlciB7XG5cbiAgICBjb25zdHJ1Y3RvciAoaW5pdCkge1xuICAgICAgICB0aGlzLmluaXQgPSBpbml0ICYmIGluaXQuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBiaW5kIChiaW5kaW5ncykge1xuICAgIC8vIFJ1biBiaW5kaW5nIGZ1bmN0aW9ucyBmb3Igc2VsZWN0b3JzXG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3IgaW4gYmluZGluZ3MpIHtcbiAgICAgICAgICAgIGlmIChiaW5kaW5ncy5oYXNPd25Qcm9wZXJ0eShzZWxlY3RvcikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkb21FbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICBsZXQgaSA9IGRvbUVscy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICBiaW5kaW5nc1tzZWxlY3Rvcl0uY2FsbCh0aGlzLCBkb21FbHNbaV0sIHRoaXMubW9kZWwsIHRoaXMudmlldywgdGhpcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzOyAvLyBGb3IgY2hhaW5pbmdcbiAgICB9XG59XG5cbi8qXG4gIFV0aWxzXG4qL1xuZnVuY3Rpb24gaXNPYmplY3Qobykge1xuICAgIHJldHVybiBvID09PSBPYmplY3QobykgJiZcbiAgICAgICAgICAgIW8ubm9kZVR5cGUgJiZcbiAgICAgICAgICAgIUFycmF5LmlzQXJyYXkobykgJiZcbiAgICAgICAgICAgISh0eXBlb2YgbyA9PT0gJ2Z1bmN0aW9uJykgJiZcbiAgICAgICAgICAgIShvIGluc3RhbmNlb2YgUmVnRXhwKTtcbn1cblxuZnVuY3Rpb24gaXNOdW1lcmljKHZhbCkge1xuICAgIHJldHVybiBOdW1iZXIocGFyc2VGbG9hdCh2YWwpKSA9PSB2YWw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXROb2RlKHRyZWUsIHBhdGhTdHIsIHZhbHVlKSB7XG4vLyBTZXQgbm9kZSBhdCBwYXRoIHN0cmluZyB0byB2YWx1ZVxuLy8gQW55IG1pc3Npbmcgbm9kZXMgYXJlIGNyZWF0ZWRcbi8vIE5PVEU6IGFsbCBudW1lcmljIG5vZGVzIGJlbG93IHJvb3QgYXJlIGFzc3VtZWQgdG8gYmUgYXJyYXkgaW5kZXhlc1xuLy8gUmV0dXJucyBib29sZWFuIGB0cnVlYCBpZiB2YWx1ZSB3YXMgY2hhbmdlZFxuICAgIGxldCBpc0NoYW5nZWQgPSBmYWxzZTtcblxuICAgIGdldE5vZGUodHJlZSwgcGF0aFN0ciwgKGN1cnJOb2RlLCBwcm9wLCBuZXh0UHJvcCkgPT4ge1xuICAgICAgICAvLyBMYXN0IHNlZ21lbnQgb2YgcGF0aCBzdHJpbmcsIHNldCB2YWx1ZSBpZiBkaWZmZXJlbnRcbiAgICAgICAgaWYgKG5leHRQcm9wID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJWYWwgPSBjdXJyTm9kZVtwcm9wXTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gY3VyclZhbCkge1xuICAgICAgICAgICAgICAgIGN1cnJOb2RlW3Byb3BdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgaXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBFbHNlIGNyZWF0ZSBhbnkgbWlzc2luZyBub2RlcyBpbiBwYXRoXG4gICAgICAgIGVsc2UgaWYgKGN1cnJOb2RlW3Byb3BdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBhbiBhcnJheSBpZiBuZXh0UHJvcCBpcyBudW1lcmljLCBvdGhlcndpc2UgYW4gb2JqZWN0XG4gICAgICAgICAgICBjdXJyTm9kZVtwcm9wXSA9IGlzTnVtZXJpYyhuZXh0UHJvcCkgPyBbXSA6IHt9O1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGlzQ2hhbmdlZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGUodHJlZSwgcGF0aFN0ciwgZWFjaENhbGxiYWNrKSB7XG4vLyBHZXQgbm9kZSBmcm9tIHBhdGggc3RyaW5nXG4vLyBPcHRpb25hbCBgZWFjaENhbGxiYWNrYCBpcyBwYXNzZWQgKGN1cnJOb2RlLCBwcm9wLCBuZXh0UHJvcClcbi8vIFRoaXMgYWxsb3dzIHRoZSBuZXh0IG5vZGUgdG8gYmUgY3JlYXRlZCBvciBjaGFuZ2VkIGJlZm9yZSBlYWNoIHRyYXZlcnNhbFxuICAgIGNvbnN0IHBhdGhBcnIgPSBwYXRoU3RyLnNwbGl0KFwiLlwiKTtcbiAgICBsZXQgY3Vyck5vZGUgPSB0cmVlO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHBhdGhBcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgY29uc3QgcHJvcCA9IHBhdGhBcnJbaV07XG4gICAgICAgIGlmIChlYWNoQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIGVhY2hDYWxsYmFjayhjdXJyTm9kZSwgcHJvcCwgcGF0aEFycltpICsgMV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjdXJyTm9kZSA9PT0gdW5kZWZpbmVkKSBicmVhaztcbiAgICAgICAgZWxzZSBjdXJyTm9kZSA9IGN1cnJOb2RlW3Byb3BdO1xuICAgIH1cbiAgICByZXR1cm4gY3Vyck5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZSggLyogW21lcmdlQ2hpbGRPYnMsXSB7fSwge30gWywgLi4uXSBbLCBjYWxsYmFja10gKi8gKSB7XG4vLyBBZGQgb3Igb3ZlcndyaXRlIGFsbCBwcm9wZXJ0aWVzIHJpZ2h0IHRvIGxlZnRcbi8vIEJ5IGRlZmF1bHQgY2hpbGQgb2JqZWN0cyBhcmUgbWVyZ2VkIHJlY3Vyc2l2ZWx5IChidXQgbm90IGFycmF5cylcbi8vIElmIGEgYm9vbGVhbiBpcyBzdXBwbGllZCwgaXQgYmVjb21lcyBgbWVyZ2VDaGlsZE9ic2AgdmFsdWUgdW50aWwgYW5vdGhlciBib29sZWFuIGlzIGZvdW5kXG4vLyBJZiBhIGNhbGxiYWNrIGlzIHN1cHBsaWVkLCBpdCB3aWxsIHJlY2VpdmUgYSBib29sZWFuIGFyZ3VtZW50IGBpc0NoYW5nZWRgXG4gICAgbGV0IGxldmVsID0gMCxcbiAgICAgICAgY2hhbmdlQ291bnQgPSAwLFxuICAgICAgICBtZXJnZUNoaWxkT2JzID0gdHJ1ZSxcbiAgICAgICAgY2FsbGJhY2ssXG4gICAgICAgIHJlc3VsdCA9IHJ1bi5hcHBseSh0aGlzLCBbMCwgYXJndW1lbnRzXSk7XG5cbiAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKCEhY2hhbmdlQ291bnQpO1xuICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICBmdW5jdGlvbiBydW4obGV2ZWwsIHBhcmFtcykge1xuICAgICAgICBsZXQgcGFyYW0sXG4gICAgICAgICAgICByZXRPYixcbiAgICAgICAgICAgIHBhcmFtc0NvdW50ID0gcGFyYW1zLmxlbmd0aDtcblxuICAgICAgICAvLyBDaGlsZCBvYmplY3RzXG4gICAgICAgIC8vIE1lcmdlIGludG8gbGVmdG1vc3QgcGFyYW0gaWYgYW4gb2JqZWN0LCBvciBjcmVhdGUgb2JqZWN0IHRvIG1lcmdlIGludG9cbiAgICAgICAgaWYgKGxldmVsKSB7XG4gICAgICAgICAgICByZXRPYiA9IGlzT2JqZWN0KHBhcmFtc1swXSkgPyBwYXJhbXNbMF0gOiB7fVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJhbXNDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBwYXJhbSA9IHBhcmFtc1tpXTtcblxuICAgICAgICAgICAgLy8gVG9wIGxldmVsIHBhcmFtcyBtYXkgY29udGFpbiBvdGhlciBhcmd1bWVudHNcbiAgICAgICAgICAgIGlmICghbGV2ZWwgJiYgcGFyYW0gIT0gbnVsbCkgeyAvLyBgdW5kZWZpbmVkYCBvciBgbnVsbGBcbiAgICAgICAgICAgICAgICAvLyBGaXJzdCBvYmplY3QgYmVjb21lcyByZXR1cm5lZCBvYmplY3RcbiAgICAgICAgICAgICAgICAvLyBBbHNvIGFsbG93IGEgRE9NIG5vZGUgZm9yIG1lcmdpbmcgaW50b1xuICAgICAgICAgICAgICAgIGlmICghcmV0T2IgJiYgaXNPYmplY3QocGFyYW0pIHx8IHBhcmFtLm5vZGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldE9iID0gcGFyYW07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBgbWVyZ2VDaGlsZE9ic2AgYm9vbGVhbiBhcmd1bWVudHNcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtID09PSBcImJvb2xlYW5cIikge1xuICAgICAgICAgICAgICAgICAgICBtZXJnZUNoaWxkT2JzID0gcGFyYW07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBMYXN0IHBhc3NlZCBpbiBmdW5jdGlvbiBiZWNvbWVzIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhbSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gcGFyYW07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXJldE9iKSBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoY29uc3QgcCBpbiBwYXJhbSkge1xuICAgICAgICAgICAgICAgIGlmIChwYXJhbS5oYXNPd25Qcm9wZXJ0eShwKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBwYXJhbVtwXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBNZXJnZSBjaGlsZCBvYmplY3RzIChyZWN1cnNpdmUpXG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXJnZUNoaWxkT2JzICYmIGlzT2JqZWN0KHZhbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldE9iW3BdID0gcnVuKGxldmVsKzEsIFtyZXRPYltwXSwgdmFsXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodmFsICE9PSByZXRPYltwXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlQ291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldE9iW3BdID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXRPYiB8fCB7fTtcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBhcHAgZnJvbSBcIi4uLy4uL2pzL2xpYi9hcHBcIjtcblxuZGVzY3JpYmUoXCJPYmplY3QgdXRpbCB0ZXN0c1wiLCBmdW5jdGlvbigpe1xuXG4gICAgZGVzY3JpYmUoXCJzZXROb2RlXCIsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgdmFyIHNldE5vZGUgPSBhcHAuc2V0Tm9kZTtcblxuICAgICAgICBpdChcIlNob3VsZCBhZGQgYSBuZXcgcHJvcGVydHlcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6MSwgYjoyfTtcbiAgICAgICAgICAgIHNldE5vZGUodHJlZSwgXCJoXCIsIDc3KTtcblxuICAgICAgICAgICAgZXhwZWN0KHRyZWUpLnRvRXF1YWwoe2E6MSwgYjoyLCBoOjc3fSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGFkZCBhIHByb3BlcnR5IGF0IGEgbmV3IHBhdGhcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6MSwgYjoyfTtcbiAgICAgICAgICAgIHNldE5vZGUodHJlZSwgXCJoLmpcIiwgNzcpO1xuXG4gICAgICAgICAgICBleHBlY3QodHJlZSkudG9FcXVhbCh7YToxLCBiOjIsIGg6IHtqOiA3N319KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgYWRkIGEgcHJvcGVydHkgYXQgYSBuZXcgZGVlcCBwYXRoXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOjEsIGI6Mn07XG4gICAgICAgICAgICBzZXROb2RlKHRyZWUsIFwiaC5qLmsubFwiLCA3Nyk7XG5cbiAgICAgICAgICAgIGV4cGVjdCh0cmVlKS50b0VxdWFsKHthOjEsIGI6MiwgaDoge2o6IHtrOiB7bDogNzd9fX19KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgYWRkIGEgcHJvcGVydHkgYXQgYSBwYXJ0aWFsIGRlZXAgcGF0aFwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToge2I6IHtjOiB7ZDogNzd9fX19O1xuICAgICAgICAgICAgc2V0Tm9kZSh0cmVlLCBcImEuYlwiLCA3Nyk7XG5cbiAgICAgICAgICAgIGV4cGVjdCh0cmVlKS50b0VxdWFsKHthOiB7Yjo3N319KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgYWRkIGEgbmV3IG51bWVyaWNhbCBwcm9wZXJ0eSBhdCByb290XCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOjEsIGI6Mn07XG4gICAgICAgICAgICBzZXROb2RlKHRyZWUsIFwiMlwiLCA3Nyk7XG5cbiAgICAgICAgICAgIGV4cGVjdCh0cmVlKS50b0VxdWFsKHthOjEsIGI6MiwgXCIyXCI6Nzd9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgYWRkIGFuIGFycmF5IGF0IGEgbnVtZXJpY2FsIHBhdGhcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6MSwgYjoyfTtcbiAgICAgICAgICAgIHNldE5vZGUodHJlZSwgXCJjLjJcIiwgNzcpO1xuXG4gICAgICAgICAgICAvL1N0cmluZ2lmeSB0byBhbGxvdyBjaGlsZCBvYmplY3QgY29tcGFyaXNvblxuICAgICAgICAgICAgZXhwZWN0KEpTT04uc3RyaW5naWZ5KHRyZWUpKS50b0VxdWFsKFxuICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHthOjEsIGI6MiwgYzpbdW5kZWZpbmVkLCB1bmRlZmluZWQsIDc3XX0pXG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBhZGQgYW4gYXJyYXkgYXQgYSBkZWVwIG51bWVyaWNhbCBwYXRoXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOjEsIGI6Mn07XG4gICAgICAgICAgICBzZXROb2RlKHRyZWUsIFwiYy4yLmEuMS4yXCIsIDc3KTtcblxuICAgICAgICAgICAgLy9TdHJpbmdpZnkgdG8gYWxsb3cgY2hpbGQgb2JqZWN0IGNvbXBhcmlzb25cbiAgICAgICAgICAgIGV4cGVjdChKU09OLnN0cmluZ2lmeSh0cmVlKSkudG9FcXVhbChcbiAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7YToxLCBiOjIsIGM6W3VuZGVmaW5lZCwgdW5kZWZpbmVkLCB7YTogW3VuZGVmaW5lZCwgW3VuZGVmaW5lZCwgdW5kZWZpbmVkLCA3N11dfV19KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKFwiZ2V0Tm9kZVwiLCBmdW5jdGlvbigpe1xuXG4gICAgICAgIHZhciBnZXROb2RlID0gYXBwLmdldE5vZGU7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgZ2V0IGEgcHJvcGVydHkgdmFsdWVcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6MSwgYjoyfTtcbiAgICAgICAgICAgIGV4cGVjdChnZXROb2RlKHRyZWUsIFwiYVwiKSkudG9CZSgxKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgZ2V0IGEgZGVlcCBwcm9wZXJ0eSB2YWx1ZVwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YTp7Yjp7Yzo3N319LCBiOjJ9O1xuICAgICAgICAgICAgZXhwZWN0KGdldE5vZGUodHJlZSwgXCJhLmIuY1wiKSkudG9CZSg3Nyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGdldCBhIHByb3BlcnR5IGNvbnRhaW5pbmcgYSBudW1lcmljYWwgaW5kZXhcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6e2I6W3tjOiA3N31dfSwgYjoyfTtcbiAgICAgICAgICAgIGV4cGVjdChnZXROb2RlKHRyZWUsIFwiYS5iLjAuY1wiKSkudG9CZSg3Nyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIHJldHVybiB1bmRlZmluZWQgZm9yIGFuIGludmFsaWQgcGF0aFwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YTp7Yjpbe2M6IDc3fV19LCBiOjJ9O1xuICAgICAgICAgICAgZXhwZWN0KGdldE5vZGUodHJlZSwgXCJhLmIuNy5jLjUuNlwiKSkudG9CZSh1bmRlZmluZWQpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBhbGxvdyBmYWxzeSB2YWx1ZXMgaW4gcGF0aFwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7MDp7MDpbezA6IDB9XX19O1xuICAgICAgICAgICAgZXhwZWN0KGdldE5vZGUodHJlZSwgXCIwLjAuMC4wXCIpKS50b0JlKDApO1xuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoXCJtZXJnZVwiLCBmdW5jdGlvbigpe1xuXG4gICAgICAgIHZhciBtZXJnZSA9IGFwcC5tZXJnZTtcblxuICAgICAgICBpdChcIlNob3VsZCBhZGQgb2JqZWN0IHByb3BlcnRpZXNcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6MSwgYjpbMiwgM119LFxuICAgICAgICAgICAgICAgIHRyZWUyID0ge2M6MywgZDo0fSxcbiAgICAgICAgICAgICAgICB0cmVlMyA9IHtlOjUsIGY6Nn07XG4gICAgICAgICAgICBleHBlY3QobWVyZ2UodHJlZSwgdHJlZTIsIHRyZWUzKSkudG9FcXVhbCh7YToxLCBiOlsyLCAzXSwgYzozLCBkOjQsIGU6NSwgZjo2fSk7XG5cbiAgICAgICAgICAgIC8vRWRnZSBjYXNlc1xuICAgICAgICAgICAgZXhwZWN0KG1lcmdlKCkpLnRvRXF1YWwoe30pO1xuICAgICAgICAgICAgZXhwZWN0KG1lcmdlKHRyZWUpKS50b0JlKHRyZWUpO1xuICAgICAgICAgICAgZXhwZWN0KG1lcmdlKFwiMjNcIikpLnRvRXF1YWwoe30pO1xuICAgICAgICAgICAgZXhwZWN0KG1lcmdlKFwiMjNcIiwgXCIzNFwiKSkudG9FcXVhbCh7fSk7XG4gICAgICAgICAgICBleHBlY3QobWVyZ2UoezI6IFwiNVwifSwgXCIzNFwiKSkudG9FcXVhbCh7MDogXCIzXCIsIDE6IFwiNFwiLCAyOlwiNVwifSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIG92ZXJ3cml0ZSBwcm9wZXJ0aWVzIHJpZ2h0IHRvIGxlZnRcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6MSwgYjpbMiwgM119LFxuICAgICAgICAgICAgICAgIHRyZWUyID0ge2M6MywgYjpbNF19LFxuICAgICAgICAgICAgICAgIHRyZWUzID0ge2E6NSwgZDo2fTtcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZSh0cmVlLCB0cmVlMiwgdHJlZTMpKS50b0VxdWFsKHthOjUsIGI6WzRdLCBjOjMsIGQ6Nn0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBtZXJnZSBjaGlsZCBvYmplY3RzIHJpZ2h0IHRvIGxlZnRcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6IHthOjEsIGI6WzIsIDNdfX0sXG4gICAgICAgICAgICAgICAgdHJlZTIgPSB7YToge2M6MywgYjpbNF19fSxcbiAgICAgICAgICAgICAgICB0cmVlMyA9IHthOiB7YTo1LCBkOjZ9fTtcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZSh0cmVlLCB0cmVlMiwgdHJlZTMpKS50b0VxdWFsKHthOiB7YTo1LCBiOls0XSwgYzozLCBkOjZ9fSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIG1lcmdlIGRlZXAgY2hpbGQgb2JqZWN0cyByaWdodCB0byBsZWZ0XCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOiB7YTogWzcsIDhdLCBiOntjOntkOntlOjc3fX19fX0sXG4gICAgICAgICAgICAgICAgdHJlZTIgPSB7YToge2E6MSwgYjp7Yzp7ZDp7ZTo4OH19fX19LFxuICAgICAgICAgICAgICAgIHRyZWUzID0ge2E6IHthOiBbNl19fTtcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZSh0cmVlLCB0cmVlMiwgdHJlZTMpKS50b0VxdWFsKHthOiB7YTpbNl0sIGI6e2M6e2Q6e2U6ODh9fX19fSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIG5vdCBtZXJnZSBjaGlsZCBvYmplY3RzIHdoZW4gYm9vbGVhbiBmYWxzZSBpcyBwYXNzZWQgaW5cIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByZWZPYiA9IHthYToxLCBiYjoyfSxcbiAgICAgICAgICAgICAgICB0cmVlID0ge2E6MSwgYjoyLCBjOnt9fSxcbiAgICAgICAgICAgICAgICB0cmVlMiA9IHtjOiByZWZPYn07XG4gICAgICAgICAgICAvLyBCb29sZWFuIGlzIGBtZXJnZUNoaWxkT2JzYFxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG1lcmdlKGZhbHNlLCB0cmVlLCB0cmVlMik7XG4gICAgICAgICAgICBleHBlY3QocmVzdWx0LmMpLnRvQmUocmVmT2IpO1xuICAgICAgICAgICAgZXhwZWN0KHJlc3VsdCkudG9FcXVhbCh7YTogMSwgYjoyLCBjOnthYToxLCBiYjoyfX0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBzd2l0Y2ggb24gYW5kIG9mZiBtZXJnaW5nIGNoaWxkIG9iamVjdHMgd2hlbiBib29sZWFucyBhcmUgcGFzc2VkIGluXCIsIGZ1bmN0aW9uKGRvbmUpe1xuICAgICAgICAgICAgdmFyIHJlZk9iID0ge2FhOjEsIGJiOjJ9LFxuICAgICAgICAgICAgICAgIHRyZWUgPSB7YToxLCBiOjIsIGM6e319LFxuICAgICAgICAgICAgICAgIHRyZWUyID0ge2M6IHJlZk9ifSxcbiAgICAgICAgICAgICAgICB0cmVlMyA9IHtkOiByZWZPYn0sXG4gICAgICAgICAgICAgICAgdHJlZTQgPSB7ZTogcmVmT2J9O1xuICAgICAgICAgICAgLy8gQm9vbGVhbiBzd2l0Y2hlcyBgbWVyZ2VDaGlsZE9ic2AgKGFsc28gdGVzdCBtdWx0aXBsZSB1bnVzZWQgYXJndW1lbnRzLCBhbmQgY2FsbGJhY2sgYXJndW1lbnQpXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gbWVyZ2UodHJ1ZSwgdHJ1ZSwgZmFsc2UsIGZhbHNlLCB0cmVlLCB0cmVlMiwgdHJ1ZSwgZmFsc2UsIGRvbmUsIHRydWUsIHRyZWUzLCBmYWxzZSwgdHJlZTQsIHRydWUpO1xuICAgICAgICAgICAgZXhwZWN0KHJlc3VsdC5jKS50b0JlKHJlZk9iKTtcbiAgICAgICAgICAgIGV4cGVjdChyZXN1bHQuZCkubm90LnRvQmUocmVmT2IpO1xuICAgICAgICAgICAgZXhwZWN0KHJlc3VsdC5lKS50b0JlKHJlZk9iKTtcbiAgICAgICAgICAgIGV4cGVjdChyZXN1bHQpLnRvRXF1YWwoe2E6IDEsIGI6MiwgYzp7YWE6MSwgYmI6Mn0sIGQ6e2FhOjEsIGJiOjJ9LCBlOnthYToxLCBiYjoyfX0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBpZ25vcmUgYXJndW1lbnRzIG9mIHdyb25nIHR5cGVcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6IHthOiAxLCBiOlsyLCAzXX19LFxuICAgICAgICAgICAgICAgIHRyZWUyID0ge2E6IHtiOiA2fX07XG4gICAgICAgICAgICBleHBlY3QobWVyZ2UoXCJcIiwgXCJcIiwgXCJcIiwgXCJcIiwgdHJlZSwgdHJlZTIpKS50b0VxdWFsKHthOiB7YTogMSwgYjo2fX0pO1xuXG4gICAgICAgICAgICB0cmVlID0ge2E6MSwgYjpbMiwgM119O1xuICAgICAgICAgICAgZXhwZWN0KG1lcmdlKFwiXCIsIDk5LCB0cmVlLCBcIlwiLCA4OCkpLnRvRXF1YWwodHJlZSk7XG4gICAgICAgICAgICBleHBlY3QobWVyZ2UodHJlZSwgOTksIFwiXCIsIFwiXCIsIFwiXCIpKS50b0VxdWFsKHRyZWUpO1xuICAgICAgICAgICAgZXhwZWN0KG1lcmdlKDk5LCB0cmVlLCBcIlwiLCA4OCwgNzcpKS50b0VxdWFsKHRyZWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCByZXBvcnQgY2hhbmdlc1wiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToge2E6MSwgYjpbMiwgM119fSxcbiAgICAgICAgICAgICAgICB0cmVlMiA9IHthOiB7YzozLCBiOls0XX19LFxuICAgICAgICAgICAgICAgIHRyZWUzID0ge2E6IHthOiBbNl19fTtcblxuICAgICAgICAgICAgbWVyZ2UodHJlZSwgdHJlZTIsIGZ1bmN0aW9uKGlzQ2hhbmdlZCl7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGlzQ2hhbmdlZCkudG9CZSh0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBtZXJnZSh0cmVlLCB0cmVlLCBmdW5jdGlvbihpc0NoYW5nZWQpe1xuICAgICAgICAgICAgICAgIGV4cGVjdChpc0NoYW5nZWQpLnRvQmUoZmFsc2UpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIG1lcmdlKHRyZWUsIGZ1bmN0aW9uKCl7fSwgZnVuY3Rpb24oaXNDaGFuZ2VkKXtcbiAgICAgICAgICAgICAgICBleHBlY3QoaXNDaGFuZ2VkKS50b0JlKGZhbHNlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBtZXJnZShcIlwiLCB0cmVlLCB0cmVlMywgZnVuY3Rpb24oaXNDaGFuZ2VkKXtcbiAgICAgICAgICAgICAgICBleHBlY3QoaXNDaGFuZ2VkKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIG1lcmdlKHt6OiA4OH0sIHRyZWUsIGZ1bmN0aW9uKGlzQ2hhbmdlZCl7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGlzQ2hhbmdlZCkudG9CZSh0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBtZXJnZSh7ejoge3k6IHt4OiA1NX19fSwge3o6IHt5OiB7eDogNTZ9fX0sIGZ1bmN0aW9uKGlzQ2hhbmdlZCl7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGlzQ2hhbmdlZCkudG9CZSh0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcblxuIl19
