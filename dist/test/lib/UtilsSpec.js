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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvbGliL2FwcC5qcyIsInNyYy90ZXN0L2xpYi9VdGlsc1NwZWMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUFFQTs7Ozs7Ozs7OztRQU1nQixHLEdBQUEsRztRQWFBLEcsR0FBQSxHO1FBaUtBLE8sR0FBQSxPO1FBeUJBLE8sR0FBQSxPO1FBa0JBLEssR0FBQSxLOzs7Ozs7QUE1TmhCLElBQU0sVUFBVSxFQUFoQjtBQUNBLElBQUksaUJBQUo7QUFBQSxJQUFjLGtCQUFkOztBQUVPLFNBQVMsR0FBVCxDQUFhLFVBQWIsRUFBeUIsQ0FBekIsRUFBNEIsQ0FBNUIsRUFBK0IsQ0FBL0IsRUFBa0M7QUFDckMsUUFBTSxPQUFPLFdBQVcsSUFBSSxDQUFKLEVBQXhCO0FBQ0EsUUFBTSxRQUFRLFlBQVksSUFBSSxDQUFKLEVBQTFCO0FBQ0EsUUFBTSxhQUFhLElBQUksQ0FBSixFQUFuQjtBQUNBLFVBQU0sSUFBTjs7QUFFQSxXQUFRLFFBQVEsVUFBUixJQUFzQjtBQUMxQixlQUFPLEtBRG1CO0FBRTFCLGNBQU0sSUFGb0I7QUFHMUIsb0JBQVk7QUFIYyxLQUE5QjtBQUtIOztBQUVNLFNBQVMsR0FBVCxDQUFhLFVBQWIsRUFBeUI7QUFDNUIsV0FBTyxRQUFRLFVBQVIsQ0FBUDtBQUNIOztBQUVEOzs7O0lBR2EsSyxXQUFBLEs7QUFFVCxxQkFBYztBQUFBOztBQUNWLGFBQUssSUFBTCxHQUFZLEVBQVo7QUFDQSxhQUFLLFNBQUwsR0FBaUI7QUFDYixvQkFBUSxFQURLO0FBRWIscUJBQVMsRUFGSTtBQUdiLG9CQUFRO0FBSEssU0FBakI7QUFLSDs7OzsrQkFFTTtBQUNQO0FBQ0ksaUJBQUssSUFBSSxDQUFULElBQWMsS0FBSyxTQUFuQixFQUE4QjtBQUMxQixvQkFBSSxLQUFLLFNBQUwsQ0FBZSxjQUFmLENBQThCLENBQTlCLENBQUosRUFBc0M7QUFDbEMseUJB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QUFsQixDQUF1QixLQUF2QjtBQUNILGFBRkQ7O0FBSUEsa0JBQU0sSUFBTixFQUFZLFlBQVUsQ0FBRSxDQUF4QixFQUEwQixVQUFTLFNBQVQsRUFBbUI7QUFDekMsdUJBQU8sU0FBUCxFQUFrQixJQUFsQixDQUF1QixLQUF2QjtBQUNILGFBRkQ7O0FBSUEsa0JBQU0sRUFBTixFQUFVLElBQVYsRUFBZ0IsS0FBaEIsRUFBdUIsVUFBUyxTQUFULEVBQW1CO0FBQ3RDLHVCQUFPLFNBQVAsRUFBa0IsSUFBbEIsQ0FBdUIsSUFBdkI7QUFDSCxhQUZEOztBQUlBLGtCQUFNLEVBQUMsR0FBRyxFQUFKLEVBQU4sRUFBZSxJQUFmLEVBQXFCLFVBQVMsU0FBVCxFQUFtQjtBQUNwQyx1QkFBTyxTQUFQLEVBQWtCLElBQWxCLENBQXVCLElBQXZCO0FBQ0gsYUFGRDs7QUFJQSxrQkFBTSxFQUFDLEdBQUcsRUFBQyxHQUFHLEVBQUMsR0FBRyxFQUFKLEVBQUosRUFBSixFQUFOLEVBQXlCLEVBQUMsR0FBRyxFQUFDLEdBQUcsRUFBQyxHQUFHLEVBQUosRUFBSixFQUFKLEVBQXpCLEVBQTRDLFVBQVMsU0FBVCxFQUFtQjtBQUMzRCx1QkFBTyxTQUFQLEVBQWtCLElBQWxCLENBQXVCLElBQXZCO0FBQ0gsYUFGRDtBQUdILFNBNUJEO0FBOEJILEtBeEdEO0FBMEdILENBeE1EIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xuXG4vKlxuICBBcHBcbiovXG5jb25zdCBtb2R1bGVzID0gW107XG5sZXQgY3VyclZpZXcsIGN1cnJNb2RlbDtcblxuZXhwb3J0IGZ1bmN0aW9uIGFkZChtb2R1bGVOYW1lLCBNLCBWLCBDKSB7XG4gICAgY29uc3QgdmlldyA9IGN1cnJWaWV3ID0gbmV3IFYoKTtcbiAgICBjb25zdCBtb2RlbCA9IGN1cnJNb2RlbCA9IG5ldyBNKCk7XG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBDKCk7XG4gICAgbW9kZWwuaW5pdCgpO1xuXG4gICAgcmV0dXJuIChtb2R1bGVzW21vZHVsZU5hbWVdID0ge1xuICAgICAgICBtb2RlbDogbW9kZWwsXG4gICAgICAgIHZpZXc6IHZpZXcsXG4gICAgICAgIGNvbnRyb2xsZXI6IGNvbnRyb2xsZXJcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldChtb2R1bGVOYW1lKSB7XG4gICAgcmV0dXJuIG1vZHVsZXNbbW9kdWxlTmFtZV07XG59XG5cbi8qXG4gIE1vZGVsXG4qL1xuZXhwb3J0IGNsYXNzIE1vZGVse1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMudHJlZSA9IHt9O1xuICAgICAgICB0aGlzLmNhbGxiYWNrcyA9IHtcbiAgICAgICAgICAgIHNldFByZTogW10sXG4gICAgICAgICAgICBzZXRQb3N0OiBbXSxcbiAgICAgICAgICAgIGNoYW5nZTogW11cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpbml0KCkge1xuICAgIC8vIFJ1biBhbnkgY2FsbGJhY2tzIHJlZ2lzdGVyZWQgZHVyaW5nIGluc3RhbnRpYXRpb25cbiAgICAgICAgZm9yICh2YXIgcCBpbiB0aGlzLmNhbGxiYWNrcykge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2FsbGJhY2tzLmhhc093blByb3BlcnR5KHApKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ydW5DYWxsYmFja3MocCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRQcmUocHJvcHMpIHtcbiAgICAvLyBBbGxvd3MgdmFsaWRhdGlvbiBldGMuIGJlZm9yZSBzZXR0aW5nIHByb3BzXG4gICAgLy8gYHByb3BzYCBpcyBhIGNvcHkgdGhhdCBjYW4gYmUgc2FmZWx5IG11dGF0ZWRcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gdGhpcy5jYWxsYmFja3NbXCJzZXRQcmVcIl07XG4gICAgICAgIGxldCBpID0gY2FsbGJhY2tzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgcHJvcHMgPSBjYWxsYmFja3NbaV0uY2FsbCh0aGlzLCBwcm9wcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb3BzO1xuICAgIH1cblxuICAgIHNldFBvc3QocHJvcHMpIHtcbiAgICAvLyBSdW5zIGNhbGxiYWNrcyBhZnRlciBgc2V0KClgIHdoZXRoZXIgbW9kZWwgY2hhbmdlZCBvciBub3RcbiAgICAgICAgdGhpcy5ydW5DYWxsYmFja3MoXCJzZXRQb3N0XCIpO1xuICAgIH1cblxuICAgIGNoYW5nZSgpIHtcbiAgICAvLyBSdW5zIGNhbGxiYWNrcyBhZnRlciBgc2V0KClgIGlmIG1vZGVsIGNoYW5nZWRcbiAgICAgICAgdGhpcy5ydW5DYWxsYmFja3MoXCJjaGFuZ2VcIik7XG4gICAgfVxuXG4gICAgc2V0KHByb3BzT3JQYXRoLCB2YWx1ZSkge1xuICAgIC8vIEFjY2VwdHMgcHJvcHMgb2JqZWN0IGB7Li4ufWAgT1IgJ3BhdGgnLCAndmFsdWUnXG4gICAgICAgIGxldCBjaGFuZ2VFdmVudDtcblxuICAgICAgICBpZiAoaXNPYmplY3QocHJvcHNPclBhdGgpKSB7XG4gICAgICAgICAgICAvLyBSdW4gYW55IFwic2V0UHJlXCIgY2FsbGJhY2tzIG9uIGEgY29weSBvZiBgcHJvcHNgXG4gICAgICAgICAgICBjb25zdCBwcm9wcyA9IHRoaXMuc2V0UHJlKG1lcmdlKHt9LCBwcm9wc09yUGF0aCkpO1xuICAgICAgICAgICAgbWVyZ2UodGhpcy50cmVlLCBwcm9wcywgaXNDaGFuZ2VkID0+IGNoYW5nZUV2ZW50ID0gaXNDaGFuZ2VkKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBwcm9wc09yUGF0aDtcbiAgICAgICAgICAgIC8vIFJ1biBhbnkgXCJzZXRQcmVcIiBjYWxsYmFja3NcbiAgICAgICAgICAgIHZhbHVlID0gdGhpcy5zZXRQcmUoe1twYXRoXTogdmFsdWV9KVtwYXRoXTtcbiAgICAgICAgICAgIGNoYW5nZUV2ZW50ID0gc2V0Tm9kZSh0aGlzLnRyZWUsIHBhdGgsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhbmdlRXZlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRQb3N0KCk7XG4gICAgICAgIHJldHVybiB0aGlzOyAvLyBGb3IgY2hhaW5pbmdcbiAgICB9XG5cbiAgICBnZXQocGF0aCkge1xuICAgICAgICByZXR1cm4gZ2V0Tm9kZSh0aGlzLnRyZWUsIHBhdGgpO1xuICAgIH1cblxuICAgIG9uKGxhYmVsLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBjYWxsYmFja3MgPSB0aGlzLmNhbGxiYWNrc1tsYWJlbF07XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrcy51bnNoaWZ0KGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpczsgLy8gRm9yIGNoYWluaW5nXG4gICAgfVxuXG4gICAgcnVuQ2FsbGJhY2tzKGxhYmVsKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW2xhYmVsXTtcbiAgICAgICAgbGV0IGkgPSBjYWxsYmFja3MubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBjYWxsYmFja3NbaV0uY2FsbCh0aGlzLCB0aGlzLnRyZWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdG9KU09OKCkge1xuICAgIC8vIFJldHVybiB0cmVlIGZvciBKU09OLnN0cmluZ2lmeSgpXG4gICAgICAgIHJldHVybiB0aGlzLnRyZWU7XG4gICAgfVxufVxuXG4vKlxuICBWaWV3XG4qL1xuZXhwb3J0IGNsYXNzIFZpZXcge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIC8vIERlcml2ZWQgY2xhc3MgbXVzdCBhc3NpZ24gYGVsYCBwcm9wZXJ0eVxuICAgIH1cblxuICAgIGdldChzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICB9XG5cbiAgICBnZXRBbGwoc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWwucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgfVxufVxuXG4vKlxuICBDb250cm9sbGVyXG4qL1xuZXhwb3J0IGNsYXNzIENvbnRyb2xsZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubW9kZWwgPSBjdXJyTW9kZWw7XG4gICAgICAgIGlmIChjdXJyVmlldy5lbCkge1xuICAgICAgICAgICAgdGhpcy52aWV3ID0gY3VyclZpZXc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyhuZXcgRXJyb3IoJ1ZpZXcuZWwgcmVxdWlyZWQhJykpO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJNb2RlbCA9IG51bGw7XG4gICAgICAgIGN1cnJWaWV3ID0gbnVsbDtcbiAgICB9XG5cbiAgICBiaW5kKGJpbmRpbmdzKSB7XG4gICAgLy8gUnVuIGJpbmRpbmcgZnVuY3Rpb25zIGZvciBzZWxlY3RvcnMgKHdpdGhpbiB2aWV3LmVsKVxuICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIGluIGJpbmRpbmdzKSB7XG4gICAgICAgICAgICBpZiAoYmluZGluZ3MuaGFzT3duUHJvcGVydHkoc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZG9tRWxzID0gdGhpcy52aWV3LmVsLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgIGxldCBpID0gZG9tRWxzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIGJpbmRpbmdzW3NlbGVjdG9yXS5jYWxsKHRoaXMsIGRvbUVsc1tpXSwgdGhpcy5tb2RlbCwgdGhpcy52aWV3LCB0aGlzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7IC8vIEZvciBjaGFpbmluZ1xuICAgIH1cbn1cblxuLypcbiAgVXRpbHNcbiovXG5mdW5jdGlvbiBpc09iamVjdChvKSB7XG4gICAgcmV0dXJuIG8gPT09IE9iamVjdChvKSAmJlxuICAgICAgICAgICAhby5ub2RlVHlwZSAmJlxuICAgICAgICAgICAhQXJyYXkuaXNBcnJheShvKSAmJlxuICAgICAgICAgICAhKHR5cGVvZiBvID09PSAnZnVuY3Rpb24nKSAmJlxuICAgICAgICAgICAhKG8gaW5zdGFuY2VvZiBSZWdFeHApO1xufVxuXG5mdW5jdGlvbiBpc051bWVyaWModmFsKSB7XG4gICAgcmV0dXJuIE51bWJlcihwYXJzZUZsb2F0KHZhbCkpID09IHZhbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE5vZGUodHJlZSwgcGF0aFN0ciwgdmFsdWUpIHtcbi8vIFNldCBub2RlIGF0IHBhdGggc3RyaW5nIHRvIHZhbHVlXG4vLyBBbnkgbWlzc2luZyBub2RlcyBhcmUgY3JlYXRlZFxuLy8gTk9URTogYWxsIG51bWVyaWMgbm9kZXMgYmVsb3cgcm9vdCBhcmUgYXNzdW1lZCB0byBiZSBhcnJheSBpbmRleGVzXG4vLyBSZXR1cm5zIGJvb2xlYW4gYHRydWVgIGlmIHZhbHVlIHdhcyBjaGFuZ2VkXG4gICAgbGV0IGlzQ2hhbmdlZCA9IGZhbHNlO1xuXG4gICAgZ2V0Tm9kZSh0cmVlLCBwYXRoU3RyLCAoY3Vyck5vZGUsIHByb3AsIG5leHRQcm9wKSA9PiB7XG4gICAgICAgIC8vIExhc3Qgc2VnbWVudCBvZiBwYXRoIHN0cmluZywgc2V0IHZhbHVlIGlmIGRpZmZlcmVudFxuICAgICAgICBpZiAobmV4dFByb3AgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc3QgY3VyclZhbCA9IGN1cnJOb2RlW3Byb3BdO1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBjdXJyVmFsKSB7XG4gICAgICAgICAgICAgICAgY3Vyck5vZGVbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBpc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIEVsc2UgY3JlYXRlIGFueSBtaXNzaW5nIG5vZGVzIGluIHBhdGhcbiAgICAgICAgZWxzZSBpZiAoY3Vyck5vZGVbcHJvcF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIGFuIGFycmF5IGlmIG5leHRQcm9wIGlzIG51bWVyaWMsIG90aGVyd2lzZSBhbiBvYmplY3RcbiAgICAgICAgICAgIGN1cnJOb2RlW3Byb3BdID0gaXNOdW1lcmljKG5leHRQcm9wKSA/IFtdIDoge307XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gaXNDaGFuZ2VkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZSh0cmVlLCBwYXRoU3RyLCBlYWNoQ2FsbGJhY2spIHtcbi8vIEdldCBub2RlIGZyb20gcGF0aCBzdHJpbmdcbi8vIE9wdGlvbmFsIGBlYWNoQ2FsbGJhY2tgIGlzIHBhc3NlZCAoY3Vyck5vZGUsIHByb3AsIG5leHRQcm9wKVxuLy8gVGhpcyBhbGxvd3MgdGhlIG5leHQgbm9kZSB0byBiZSBjcmVhdGVkIG9yIGNoYW5nZWQgYmVmb3JlIGVhY2ggdHJhdmVyc2FsXG4gICAgY29uc3QgcGF0aEFyciA9IHBhdGhTdHIuc3BsaXQoXCIuXCIpO1xuICAgIGxldCBjdXJyTm9kZSA9IHRyZWU7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gcGF0aEFyci5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBjb25zdCBwcm9wID0gcGF0aEFycltpXTtcbiAgICAgICAgaWYgKGVhY2hDYWxsYmFjaykge1xuICAgICAgICAgICAgZWFjaENhbGxiYWNrKGN1cnJOb2RlLCBwcm9wLCBwYXRoQXJyW2kgKyAxXSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGN1cnJOb2RlID09PSB1bmRlZmluZWQpIGJyZWFrO1xuICAgICAgICBlbHNlIGN1cnJOb2RlID0gY3Vyck5vZGVbcHJvcF07XG4gICAgfVxuICAgIHJldHVybiBjdXJyTm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlKCAvKiBbbWVyZ2VDaGlsZE9icyxdIHt9LCB7fSBbLCAuLi5dIFssIGNhbGxiYWNrXSAqLyApIHtcbi8vIEFkZCBvciBvdmVyd3JpdGUgYWxsIHByb3BlcnRpZXMgcmlnaHQgdG8gbGVmdFxuLy8gQnkgZGVmYXVsdCBjaGlsZCBvYmplY3RzIGFyZSBtZXJnZWQgcmVjdXJzaXZlbHkgKGJ1dCBub3QgYXJyYXlzKVxuLy8gSWYgYSBib29sZWFuIGlzIHN1cHBsaWVkLCBpdCBiZWNvbWVzIGBtZXJnZUNoaWxkT2JzYCB2YWx1ZSB1bnRpbCBhbm90aGVyIGJvb2xlYW4gaXMgZm91bmRcbi8vIElmIGEgY2FsbGJhY2sgaXMgc3VwcGxpZWQsIGl0IHdpbGwgcmVjZWl2ZSBhIGJvb2xlYW4gYXJndW1lbnQgYGlzQ2hhbmdlZGBcbiAgICBsZXQgbGV2ZWwgPSAwLFxuICAgICAgICBjaGFuZ2VDb3VudCA9IDAsXG4gICAgICAgIG1lcmdlQ2hpbGRPYnMgPSB0cnVlLFxuICAgICAgICBjYWxsYmFjayxcbiAgICAgICAgcmVzdWx0ID0gcnVuLmFwcGx5KHRoaXMsIFswLCBhcmd1bWVudHNdKTtcblxuICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soISFjaGFuZ2VDb3VudCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcblxuICAgIGZ1bmN0aW9uIHJ1bihsZXZlbCwgcGFyYW1zKSB7XG4gICAgICAgIGxldCBwYXJhbSxcbiAgICAgICAgICAgIHJldE9iLFxuICAgICAgICAgICAgcGFyYW1zQ291bnQgPSBwYXJhbXMubGVuZ3RoO1xuXG4gICAgICAgIC8vIENoaWxkIG9iamVjdHNcbiAgICAgICAgLy8gTWVyZ2UgaW50byBsZWZ0bW9zdCBwYXJhbSBpZiBhbiBvYmplY3QsIG9yIGNyZWF0ZSBvYmplY3QgdG8gbWVyZ2UgaW50b1xuICAgICAgICBpZiAobGV2ZWwpIHtcbiAgICAgICAgICAgIHJldE9iID0gaXNPYmplY3QocGFyYW1zWzBdKSA/IHBhcmFtc1swXSA6IHt9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmFtc0NvdW50OyBpKyspIHtcbiAgICAgICAgICAgIHBhcmFtID0gcGFyYW1zW2ldO1xuXG4gICAgICAgICAgICAvLyBUb3AgbGV2ZWwgcGFyYW1zIG1heSBjb250YWluIG90aGVyIGFyZ3VtZW50c1xuICAgICAgICAgICAgaWYgKCFsZXZlbCAmJiBwYXJhbSAhPSBudWxsKSB7IC8vIGB1bmRlZmluZWRgIG9yIGBudWxsYFxuICAgICAgICAgICAgICAgIC8vIEZpcnN0IG9iamVjdCBiZWNvbWVzIHJldHVybmVkIG9iamVjdFxuICAgICAgICAgICAgICAgIC8vIEFsc28gYWxsb3cgYSBET00gbm9kZSBmb3IgbWVyZ2luZyBpbnRvXG4gICAgICAgICAgICAgICAgaWYgKCFyZXRPYiAmJiBpc09iamVjdChwYXJhbSkgfHwgcGFyYW0ubm9kZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0T2IgPSBwYXJhbTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGBtZXJnZUNoaWxkT2JzYCBib29sZWFuIGFyZ3VtZW50c1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyYW0gPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lcmdlQ2hpbGRPYnMgPSBwYXJhbTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIExhc3QgcGFzc2VkIGluIGZ1bmN0aW9uIGJlY29tZXMgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBwYXJhbTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghcmV0T2IpIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChjb25zdCBwIGluIHBhcmFtKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmFtLmhhc093blByb3BlcnR5KHApKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IHBhcmFtW3BdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIE1lcmdlIGNoaWxkIG9iamVjdHMgKHJlY3Vyc2l2ZSlcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1lcmdlQ2hpbGRPYnMgJiYgaXNPYmplY3QodmFsKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0T2JbcF0gPSBydW4obGV2ZWwrMSwgW3JldE9iW3BdLCB2YWxdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh2YWwgIT09IHJldE9iW3BdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0T2JbcF0gPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldE9iIHx8IHt9O1xuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIGFwcCBmcm9tIFwiLi4vLi4vanMvbGliL2FwcFwiO1xuXG5kZXNjcmliZShcIk9iamVjdCB1dGlsIHRlc3RzXCIsIGZ1bmN0aW9uKCl7XG5cbiAgICBkZXNjcmliZShcInNldE5vZGVcIiwgZnVuY3Rpb24oKXtcblxuICAgICAgICB2YXIgc2V0Tm9kZSA9IGFwcC5zZXROb2RlO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGFkZCBhIG5ldyBwcm9wZXJ0eVwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToxLCBiOjJ9O1xuICAgICAgICAgICAgc2V0Tm9kZSh0cmVlLCBcImhcIiwgNzcpO1xuXG4gICAgICAgICAgICBleHBlY3QodHJlZSkudG9FcXVhbCh7YToxLCBiOjIsIGg6Nzd9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgYWRkIGEgcHJvcGVydHkgYXQgYSBuZXcgcGF0aFwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToxLCBiOjJ9O1xuICAgICAgICAgICAgc2V0Tm9kZSh0cmVlLCBcImgualwiLCA3Nyk7XG5cbiAgICAgICAgICAgIGV4cGVjdCh0cmVlKS50b0VxdWFsKHthOjEsIGI6MiwgaDoge2o6IDc3fX0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBhZGQgYSBwcm9wZXJ0eSBhdCBhIG5ldyBkZWVwIHBhdGhcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6MSwgYjoyfTtcbiAgICAgICAgICAgIHNldE5vZGUodHJlZSwgXCJoLmouay5sXCIsIDc3KTtcblxuICAgICAgICAgICAgZXhwZWN0KHRyZWUpLnRvRXF1YWwoe2E6MSwgYjoyLCBoOiB7ajoge2s6IHtsOiA3N319fX0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBhZGQgYSBwcm9wZXJ0eSBhdCBhIHBhcnRpYWwgZGVlcCBwYXRoXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOiB7Yjoge2M6IHtkOiA3N319fX07XG4gICAgICAgICAgICBzZXROb2RlKHRyZWUsIFwiYS5iXCIsIDc3KTtcblxuICAgICAgICAgICAgZXhwZWN0KHRyZWUpLnRvRXF1YWwoe2E6IHtiOjc3fX0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBhZGQgYSBuZXcgbnVtZXJpY2FsIHByb3BlcnR5IGF0IHJvb3RcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6MSwgYjoyfTtcbiAgICAgICAgICAgIHNldE5vZGUodHJlZSwgXCIyXCIsIDc3KTtcblxuICAgICAgICAgICAgZXhwZWN0KHRyZWUpLnRvRXF1YWwoe2E6MSwgYjoyLCBcIjJcIjo3N30pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBhZGQgYW4gYXJyYXkgYXQgYSBudW1lcmljYWwgcGF0aFwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToxLCBiOjJ9O1xuICAgICAgICAgICAgc2V0Tm9kZSh0cmVlLCBcImMuMlwiLCA3Nyk7XG5cbiAgICAgICAgICAgIC8vU3RyaW5naWZ5IHRvIGFsbG93IGNoaWxkIG9iamVjdCBjb21wYXJpc29uXG4gICAgICAgICAgICBleHBlY3QoSlNPTi5zdHJpbmdpZnkodHJlZSkpLnRvRXF1YWwoXG4gICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe2E6MSwgYjoyLCBjOlt1bmRlZmluZWQsIHVuZGVmaW5lZCwgNzddfSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGFkZCBhbiBhcnJheSBhdCBhIGRlZXAgbnVtZXJpY2FsIHBhdGhcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6MSwgYjoyfTtcbiAgICAgICAgICAgIHNldE5vZGUodHJlZSwgXCJjLjIuYS4xLjJcIiwgNzcpO1xuXG4gICAgICAgICAgICAvL1N0cmluZ2lmeSB0byBhbGxvdyBjaGlsZCBvYmplY3QgY29tcGFyaXNvblxuICAgICAgICAgICAgZXhwZWN0KEpTT04uc3RyaW5naWZ5KHRyZWUpKS50b0VxdWFsKFxuICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHthOjEsIGI6MiwgYzpbdW5kZWZpbmVkLCB1bmRlZmluZWQsIHthOiBbdW5kZWZpbmVkLCBbdW5kZWZpbmVkLCB1bmRlZmluZWQsIDc3XV19XX0pXG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoXCJnZXROb2RlXCIsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgdmFyIGdldE5vZGUgPSBhcHAuZ2V0Tm9kZTtcblxuICAgICAgICBpdChcIlNob3VsZCBnZXQgYSBwcm9wZXJ0eSB2YWx1ZVwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToxLCBiOjJ9O1xuICAgICAgICAgICAgZXhwZWN0KGdldE5vZGUodHJlZSwgXCJhXCIpKS50b0JlKDEpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBnZXQgYSBkZWVwIHByb3BlcnR5IHZhbHVlXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOntiOntjOjc3fX0sIGI6Mn07XG4gICAgICAgICAgICBleHBlY3QoZ2V0Tm9kZSh0cmVlLCBcImEuYi5jXCIpKS50b0JlKDc3KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgZ2V0IGEgcHJvcGVydHkgY29udGFpbmluZyBhIG51bWVyaWNhbCBpbmRleFwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YTp7Yjpbe2M6IDc3fV19LCBiOjJ9O1xuICAgICAgICAgICAgZXhwZWN0KGdldE5vZGUodHJlZSwgXCJhLmIuMC5jXCIpKS50b0JlKDc3KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgcmV0dXJuIHVuZGVmaW5lZCBmb3IgYW4gaW52YWxpZCBwYXRoXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOntiOlt7YzogNzd9XX0sIGI6Mn07XG4gICAgICAgICAgICBleHBlY3QoZ2V0Tm9kZSh0cmVlLCBcImEuYi43LmMuNS42XCIpKS50b0JlKHVuZGVmaW5lZCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGFsbG93IGZhbHN5IHZhbHVlcyBpbiBwYXRoXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHswOnswOlt7MDogMH1dfX07XG4gICAgICAgICAgICBleHBlY3QoZ2V0Tm9kZSh0cmVlLCBcIjAuMC4wLjBcIikpLnRvQmUoMCk7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgICBkZXNjcmliZShcIm1lcmdlXCIsIGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgdmFyIG1lcmdlID0gYXBwLm1lcmdlO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGFkZCBvYmplY3QgcHJvcGVydGllc1wiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToxLCBiOlsyLCAzXX0sXG4gICAgICAgICAgICAgICAgdHJlZTIgPSB7YzozLCBkOjR9LFxuICAgICAgICAgICAgICAgIHRyZWUzID0ge2U6NSwgZjo2fTtcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZSh0cmVlLCB0cmVlMiwgdHJlZTMpKS50b0VxdWFsKHthOjEsIGI6WzIsIDNdLCBjOjMsIGQ6NCwgZTo1LCBmOjZ9KTtcblxuICAgICAgICAgICAgLy9FZGdlIGNhc2VzXG4gICAgICAgICAgICBleHBlY3QobWVyZ2UoKSkudG9FcXVhbCh7fSk7XG4gICAgICAgICAgICBleHBlY3QobWVyZ2UodHJlZSkpLnRvQmUodHJlZSk7XG4gICAgICAgICAgICBleHBlY3QobWVyZ2UoXCIyM1wiKSkudG9FcXVhbCh7fSk7XG4gICAgICAgICAgICBleHBlY3QobWVyZ2UoXCIyM1wiLCBcIjM0XCIpKS50b0VxdWFsKHt9KTtcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZSh7MjogXCI1XCJ9LCBcIjM0XCIpKS50b0VxdWFsKHswOiBcIjNcIiwgMTogXCI0XCIsIDI6XCI1XCJ9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgb3ZlcndyaXRlIHByb3BlcnRpZXMgcmlnaHQgdG8gbGVmdFwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToxLCBiOlsyLCAzXX0sXG4gICAgICAgICAgICAgICAgdHJlZTIgPSB7YzozLCBiOls0XX0sXG4gICAgICAgICAgICAgICAgdHJlZTMgPSB7YTo1LCBkOjZ9O1xuICAgICAgICAgICAgZXhwZWN0KG1lcmdlKHRyZWUsIHRyZWUyLCB0cmVlMykpLnRvRXF1YWwoe2E6NSwgYjpbNF0sIGM6MywgZDo2fSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIG1lcmdlIGNoaWxkIG9iamVjdHMgcmlnaHQgdG8gbGVmdFwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToge2E6MSwgYjpbMiwgM119fSxcbiAgICAgICAgICAgICAgICB0cmVlMiA9IHthOiB7YzozLCBiOls0XX19LFxuICAgICAgICAgICAgICAgIHRyZWUzID0ge2E6IHthOjUsIGQ6Nn19O1xuICAgICAgICAgICAgZXhwZWN0KG1lcmdlKHRyZWUsIHRyZWUyLCB0cmVlMykpLnRvRXF1YWwoe2E6IHthOjUsIGI6WzRdLCBjOjMsIGQ6Nn19KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgbWVyZ2UgZGVlcCBjaGlsZCBvYmplY3RzIHJpZ2h0IHRvIGxlZnRcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6IHthOiBbNywgOF0sIGI6e2M6e2Q6e2U6Nzd9fX19fSxcbiAgICAgICAgICAgICAgICB0cmVlMiA9IHthOiB7YToxLCBiOntjOntkOntlOjg4fX19fX0sXG4gICAgICAgICAgICAgICAgdHJlZTMgPSB7YToge2E6IFs2XX19O1xuICAgICAgICAgICAgZXhwZWN0KG1lcmdlKHRyZWUsIHRyZWUyLCB0cmVlMykpLnRvRXF1YWwoe2E6IHthOls2XSwgYjp7Yzp7ZDp7ZTo4OH19fX19KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgbm90IG1lcmdlIGNoaWxkIG9iamVjdHMgd2hlbiBib29sZWFuIGZhbHNlIGlzIHBhc3NlZCBpblwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHJlZk9iID0ge2FhOjEsIGJiOjJ9LFxuICAgICAgICAgICAgICAgIHRyZWUgPSB7YToxLCBiOjIsIGM6e319LFxuICAgICAgICAgICAgICAgIHRyZWUyID0ge2M6IHJlZk9ifTtcbiAgICAgICAgICAgIC8vIEJvb2xlYW4gaXMgYG1lcmdlQ2hpbGRPYnNgXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gbWVyZ2UoZmFsc2UsIHRyZWUsIHRyZWUyKTtcbiAgICAgICAgICAgIGV4cGVjdChyZXN1bHQuYykudG9CZShyZWZPYik7XG4gICAgICAgICAgICBleHBlY3QocmVzdWx0KS50b0VxdWFsKHthOiAxLCBiOjIsIGM6e2FhOjEsIGJiOjJ9fSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIHN3aXRjaCBvbiBhbmQgb2ZmIG1lcmdpbmcgY2hpbGQgb2JqZWN0cyB3aGVuIGJvb2xlYW5zIGFyZSBwYXNzZWQgaW5cIiwgZnVuY3Rpb24oZG9uZSl7XG4gICAgICAgICAgICB2YXIgcmVmT2IgPSB7YWE6MSwgYmI6Mn0sXG4gICAgICAgICAgICAgICAgdHJlZSA9IHthOjEsIGI6MiwgYzp7fX0sXG4gICAgICAgICAgICAgICAgdHJlZTIgPSB7YzogcmVmT2J9LFxuICAgICAgICAgICAgICAgIHRyZWUzID0ge2Q6IHJlZk9ifSxcbiAgICAgICAgICAgICAgICB0cmVlNCA9IHtlOiByZWZPYn07XG4gICAgICAgICAgICAvLyBCb29sZWFuIHN3aXRjaGVzIGBtZXJnZUNoaWxkT2JzYCAoYWxzbyB0ZXN0IG11bHRpcGxlIHVudXNlZCBhcmd1bWVudHMsIGFuZCBjYWxsYmFjayBhcmd1bWVudClcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBtZXJnZSh0cnVlLCB0cnVlLCBmYWxzZSwgZmFsc2UsIHRyZWUsIHRyZWUyLCB0cnVlLCBmYWxzZSwgZG9uZSwgdHJ1ZSwgdHJlZTMsIGZhbHNlLCB0cmVlNCwgdHJ1ZSk7XG4gICAgICAgICAgICBleHBlY3QocmVzdWx0LmMpLnRvQmUocmVmT2IpO1xuICAgICAgICAgICAgZXhwZWN0KHJlc3VsdC5kKS5ub3QudG9CZShyZWZPYik7XG4gICAgICAgICAgICBleHBlY3QocmVzdWx0LmUpLnRvQmUocmVmT2IpO1xuICAgICAgICAgICAgZXhwZWN0KHJlc3VsdCkudG9FcXVhbCh7YTogMSwgYjoyLCBjOnthYToxLCBiYjoyfSwgZDp7YWE6MSwgYmI6Mn0sIGU6e2FhOjEsIGJiOjJ9fSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGlnbm9yZSBhcmd1bWVudHMgb2Ygd3JvbmcgdHlwZVwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToge2E6IDEsIGI6WzIsIDNdfX0sXG4gICAgICAgICAgICAgICAgdHJlZTIgPSB7YToge2I6IDZ9fTtcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZShcIlwiLCBcIlwiLCBcIlwiLCBcIlwiLCB0cmVlLCB0cmVlMikpLnRvRXF1YWwoe2E6IHthOiAxLCBiOjZ9fSk7XG5cbiAgICAgICAgICAgIHRyZWUgPSB7YToxLCBiOlsyLCAzXX07XG4gICAgICAgICAgICBleHBlY3QobWVyZ2UoXCJcIiwgOTksIHRyZWUsIFwiXCIsIDg4KSkudG9FcXVhbCh0cmVlKTtcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZSh0cmVlLCA5OSwgXCJcIiwgXCJcIiwgXCJcIikpLnRvRXF1YWwodHJlZSk7XG4gICAgICAgICAgICBleHBlY3QobWVyZ2UoOTksIHRyZWUsIFwiXCIsIDg4LCA3NykpLnRvRXF1YWwodHJlZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIHJlcG9ydCBjaGFuZ2VzXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOiB7YToxLCBiOlsyLCAzXX19LFxuICAgICAgICAgICAgICAgIHRyZWUyID0ge2E6IHtjOjMsIGI6WzRdfX0sXG4gICAgICAgICAgICAgICAgdHJlZTMgPSB7YToge2E6IFs2XX19O1xuXG4gICAgICAgICAgICBtZXJnZSh0cmVlLCB0cmVlMiwgZnVuY3Rpb24oaXNDaGFuZ2VkKXtcbiAgICAgICAgICAgICAgICBleHBlY3QoaXNDaGFuZ2VkKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIG1lcmdlKHRyZWUsIHRyZWUsIGZ1bmN0aW9uKGlzQ2hhbmdlZCl7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGlzQ2hhbmdlZCkudG9CZShmYWxzZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbWVyZ2UodHJlZSwgZnVuY3Rpb24oKXt9LCBmdW5jdGlvbihpc0NoYW5nZWQpe1xuICAgICAgICAgICAgICAgIGV4cGVjdChpc0NoYW5nZWQpLnRvQmUoZmFsc2UpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIG1lcmdlKFwiXCIsIHRyZWUsIHRyZWUzLCBmdW5jdGlvbihpc0NoYW5nZWQpe1xuICAgICAgICAgICAgICAgIGV4cGVjdChpc0NoYW5nZWQpLnRvQmUodHJ1ZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbWVyZ2Uoe3o6IDg4fSwgdHJlZSwgZnVuY3Rpb24oaXNDaGFuZ2VkKXtcbiAgICAgICAgICAgICAgICBleHBlY3QoaXNDaGFuZ2VkKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIG1lcmdlKHt6OiB7eToge3g6IDU1fX19LCB7ejoge3k6IHt4OiA1Nn19fSwgZnVuY3Rpb24oaXNDaGFuZ2VkKXtcbiAgICAgICAgICAgICAgICBleHBlY3QoaXNDaGFuZ2VkKS50b0JlKHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn0pO1xuXG4iXX0=
