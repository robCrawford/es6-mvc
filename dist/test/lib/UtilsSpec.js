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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvbGliL2FwcC5qcyIsInNyYy90ZXN0L2xpYi9VdGlsc1NwZWMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OztRQ0tnQixHLEdBQUEsRztRQXFCQSxHLEdBQUEsRztRQXVJQSxPLEdBQUEsTztRQWlCQSxPLEdBQUEsTztRQWtCQSxLLEdBQUEsSzs7Ozs7O0FBcE1oQjs7O0FBR0EsSUFBTSxVQUFVLEVBQWhCOztBQUVPLFNBQVMsR0FBVCxDQUFhLElBQWIsRUFBbUIsS0FBbkIsRUFBMEIsSUFBMUIsRUFBZ0MsVUFBaEMsRUFBNEM7QUFDL0MsZUFBVyxLQUFYLEdBQW1CLEtBQW5CO0FBQ0EsZUFBVyxJQUFYLEdBQWtCLElBQWxCOztBQUVBLFFBQUksS0FBSyxJQUFULEVBQWU7QUFDWCxhQUFLLElBQUw7QUFDSDtBQUNELFFBQUksV0FBVyxJQUFmLEVBQXFCO0FBQ2pCLG1CQUFXLElBQVgsQ0FBZ0IsS0FBaEIsRUFBdUIsSUFBdkIsRUFBNkIsVUFBN0I7QUFDSDtBQUNELFFBQUksTUFBTSxJQUFWLEVBQWdCO0FBQ1osY0FBTSxJQUFOO0FBQ0g7O0FBRUQsV0FBUSxRQUFRLElBQVIsSUFBZ0I7QUFDcEIsZUFBTyxLQURhO0FBRXBCLGNBQU0sSUFGYztBQUdwQixvQkFBWTtBQUhRLEtBQXhCO0FBS0g7O0FBRU0sU0FBUyxHQUFULENBQWEsSUFBYixFQUFtQjtBQUN0QixXQUFPLFFBQVEsSUFBUixDQUFQO0FBQ0g7O0FBRUQ7Ozs7SUFHYSxLLFdBQUEsSztBQUVULG1CQUFhLElBQWIsRUFBbUI7QUFBQTs7QUFDZixhQUFLLElBQUwsR0FBWSxFQUFaO0FBQ0EsYUFBSyxTQUFMLEdBQWlCO0FBQ2Isb0JBQVEsRUFESztBQUViLHFCQUFTLEVBRkk7QUFHYixvQkFBUTtBQUhLLFNBQWpCO0FBS0EsYUFBSyxJQUFMLEdBQVksUUFBUSxLQUFLLElBQUwsQ0FBVSxJ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QU4sRUFBeUIsRUFBQyxHQUFHLEVBQUMsR0FBRyxFQUFDLEdBQUcsRUFBSixFQUFKLEVBQUosRUFBekIsRUFBNEMsVUFBUyxTQUFULEVBQW1CO0FBQzNELHVCQUFPLFNBQVAsRUFBa0IsSUFBbEIsQ0FBdUIsSUFBdkI7QUFDSCxhQUZEO0FBR0gsU0E1QkQ7QUE4QkgsS0F4R0Q7QUEwR0gsQ0F4TUQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypcbiAgQXBwXG4qL1xuY29uc3QgbW9kdWxlcyA9IFtdO1xuXG5leHBvcnQgZnVuY3Rpb24gYWRkKG5hbWUsIG1vZGVsLCB2aWV3LCBjb250cm9sbGVyKSB7XG4gICAgY29udHJvbGxlci5tb2RlbCA9IG1vZGVsO1xuICAgIGNvbnRyb2xsZXIudmlldyA9IHZpZXc7XG5cbiAgICBpZiAodmlldy5pbml0KSB7XG4gICAgICAgIHZpZXcuaW5pdCgpO1xuICAgIH1cbiAgICBpZiAoY29udHJvbGxlci5pbml0KSB7XG4gICAgICAgIGNvbnRyb2xsZXIuaW5pdChtb2RlbCwgdmlldywgY29udHJvbGxlcik7XG4gICAgfVxuICAgIGlmIChtb2RlbC5pbml0KSB7XG4gICAgICAgIG1vZGVsLmluaXQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gKG1vZHVsZXNbbmFtZV0gPSB7XG4gICAgICAgIG1vZGVsOiBtb2RlbCxcbiAgICAgICAgdmlldzogdmlldyxcbiAgICAgICAgY29udHJvbGxlcjogY29udHJvbGxlclxuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0KG5hbWUpIHtcbiAgICByZXR1cm4gbW9kdWxlc1tuYW1lXTtcbn1cblxuLypcbiAgTW9kZWxcbiovXG5leHBvcnQgY2xhc3MgTW9kZWx7XG5cbiAgICBjb25zdHJ1Y3RvciAoaW5pdCkge1xuICAgICAgICB0aGlzLnRyZWUgPSB7fTtcbiAgICAgICAgdGhpcy5jYWxsYmFja3MgPSB7XG4gICAgICAgICAgICBzZXRQcmU6IFtdLFxuICAgICAgICAgICAgc2V0UG9zdDogW10sXG4gICAgICAgICAgICBjaGFuZ2U6IFtdXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaW5pdCA9IGluaXQgJiYgaW5pdC5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIHNldFByZSAocHJvcHMpIHtcbiAgICAvLyBBbGxvd3MgdmFsaWRhdGlvbiBldGMuIGJlZm9yZSBzZXR0aW5nIHByb3BzXG4gICAgLy8gYHByb3BzYCBpcyBhIGNvcHkgdGhhdCBjYW4gYmUgc2FmZWx5IG11dGF0ZWRcbiAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gdGhpcy5jYWxsYmFja3NbXCJzZXRQcmVcIl07XG4gICAgICAgIGxldCBpID0gY2FsbGJhY2tzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgcHJvcHMgPSBjYWxsYmFja3NbaV0uY2FsbCh0aGlzLCBwcm9wcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb3BzO1xuICAgIH1cblxuICAgIHNldFBvc3QgKHByb3BzKSB7XG4gICAgLy8gUnVucyBjYWxsYmFja3MgYWZ0ZXIgYHNldCgpYCB3aGV0aGVyIG1vZGVsIGNoYW5nZWQgb3Igbm90XG4gICAgICAgIHRoaXMucnVuQ2FsbGJhY2tzKFwic2V0UG9zdFwiKTtcbiAgICB9XG5cbiAgICBjaGFuZ2UgKCkge1xuICAgIC8vIFJ1bnMgY2FsbGJhY2tzIGFmdGVyIGBzZXQoKWAgaWYgbW9kZWwgY2hhbmdlZFxuICAgICAgICB0aGlzLnJ1bkNhbGxiYWNrcyhcImNoYW5nZVwiKTtcbiAgICB9XG5cbiAgICBzZXQgKHByb3BzT3JLZXksIHZhbHVlKSB7XG4gICAgLy8gQWNjZXB0cyBwcm9wcyBvYmplY3QgYHsuLi59YCBPUiAna2V5JywgJ3ZhbHVlJ1xuICAgICAgICBsZXQgcHJvcHMgPSBpc09iamVjdChwcm9wc09yS2V5KSA/IHByb3BzT3JLZXkgOiB7XG4gICAgICAgICAgICBbcHJvcHNPcktleV06IHZhbHVlXG4gICAgICAgIH07XG4gICAgICAgIC8vIFJ1biBhbnkgXCJzZXRQcmVcIiBjYWxsYmFja3Mgb24gYSBjb3B5IG9mIGBwcm9wc2BcbiAgICAgICAgcHJvcHMgPSB0aGlzLnNldFByZShtZXJnZSh7fSwgcHJvcHMpKTtcblxuICAgICAgICBtZXJnZSh0aGlzLnRyZWUsIHByb3BzLCBpc0NoYW5nZWQgPT4ge1xuICAgICAgICAgICAgaWYgKGlzQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNldFBvc3QoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzOyAvLyBGb3IgY2hhaW5pbmdcbiAgICB9XG5cbiAgICBnZXQgKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIGdldE5vZGUodGhpcy50cmVlLCBwYXRoKTtcbiAgICB9XG5cbiAgICBvbiAobGFiZWwsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW2xhYmVsXTtcbiAgICAgICAgaWYgKGNhbGxiYWNrcykge1xuICAgICAgICAgICAgY2FsbGJhY2tzLnVuc2hpZnQoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzOyAvLyBGb3IgY2hhaW5pbmdcbiAgICB9XG5cbiAgICBydW5DYWxsYmFja3MgKGxhYmVsKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW2xhYmVsXTtcbiAgICAgICAgbGV0IGkgPSBjYWxsYmFja3MubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBjYWxsYmFja3NbaV0uY2FsbCh0aGlzLCB0aGlzLnRyZWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdG9KU09OICgpIHtcbiAgICAvLyBSZXR1cm4gdHJlZSBmb3IgSlNPTi5zdHJpbmdpZnkoKVxuICAgICAgICByZXR1cm4gdGhpcy50cmVlO1xuICAgIH1cbn1cblxuLypcbiAgVmlld1xuKi9cbmV4cG9ydCBjbGFzcyBWaWV3IHtcblxuICAgIGNvbnN0cnVjdG9yIChpbml0KSB7XG4gICAgICAgIHRoaXMuaW5pdCA9IGluaXQgJiYgaW5pdC5iaW5kKHRoaXMpO1xuXG4gICAgICAgIGlmICghdGhpcy5lbCkge1xuICAgICAgICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmVsLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5lbCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qXG4gIENvbnRyb2xsZXJcbiovXG5leHBvcnQgY2xhc3MgQ29udHJvbGxlciB7XG5cbiAgICBjb25zdHJ1Y3RvciAoaW5pdCkge1xuICAgICAgICB0aGlzLmluaXQgPSBpbml0ICYmIGluaXQuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBiaW5kIChiaW5kaW5ncykge1xuICAgIC8vIFJ1biBiaW5kaW5nIGZ1bmN0aW9ucyBmb3Igc2VsZWN0b3JzXG4gICAgICAgIGZvciAoY29uc3Qgc2VsZWN0b3IgaW4gYmluZGluZ3MpIHtcbiAgICAgICAgICAgIGlmIChiaW5kaW5ncy5oYXNPd25Qcm9wZXJ0eShzZWxlY3RvcikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkb21FbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICBsZXQgaSA9IGRvbUVscy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICBiaW5kaW5nc1tzZWxlY3Rvcl0uY2FsbCh0aGlzLCBkb21FbHNbaV0sIHRoaXMubW9kZWwsIHRoaXMudmlldywgdGhpcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzOyAvLyBGb3IgY2hhaW5pbmdcbiAgICB9XG59XG5cbi8qXG4gIFV0aWxzXG4qL1xuZnVuY3Rpb24gaXNPYmplY3Qobykge1xuICAgIHJldHVybiBvID09PSBPYmplY3QobykgJiZcbiAgICAgICAgICAgIW8ubm9kZVR5cGUgJiZcbiAgICAgICAgICAgIUFycmF5LmlzQXJyYXkobykgJiZcbiAgICAgICAgICAgISh0eXBlb2YgbyA9PT0gJ2Z1bmN0aW9uJykgJiZcbiAgICAgICAgICAgIShvIGluc3RhbmNlb2YgUmVnRXhwKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE5vZGUodHJlZSwgcGF0aFN0ciwgdmFsdWUpIHtcbi8vIFNldCBub2RlIGF0IHBhdGggc3RyaW5nIHRvIHZhbHVlXG4vLyBBbnkgbWlzc2luZyBub2RlcyBhcmUgY3JlYXRlZFxuLy8gTk9URTogYWxsIG51bWVyaWMgbm9kZXMgYmVsb3cgcm9vdCBhcmUgYXNzdW1lZCB0byBiZSBhcnJheSBpbmRleGVzXG4gICAgZ2V0Tm9kZSh0cmVlLCBwYXRoU3RyLCAoY3Vyck5vZGUsIHByb3AsIG5leHRQcm9wKSA9PiB7XG4gICAgICAgIC8vIExhc3Qgc2VnbWVudCBvZiBwYXRoIHN0cmluZywganVzdCBzZXQgdmFsdWVcbiAgICAgICAgaWYgKG5leHRQcm9wID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGN1cnJOb2RlW3Byb3BdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gRWxzZSBjcmVhdGUgYW55IG1pc3Npbmcgbm9kZXMgaW4gcGF0aFxuICAgICAgICBlbHNlIGlmIChjdXJyTm9kZVtwcm9wXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgYW4gYXJyYXkgaWYgbmV4dFByb3AgaXMgbnVtZXJpYywgb3RoZXJ3aXNlIGFuIG9iamVjdFxuICAgICAgICAgICAgY3Vyck5vZGVbcHJvcF0gPSBpc05hTihuZXh0UHJvcCkgPyB7fSA6IFtdO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2RlKHRyZWUsIHBhdGhTdHIsIGVhY2hDYWxsYmFjaykge1xuLy8gR2V0IG5vZGUgZnJvbSBwYXRoIHN0cmluZ1xuLy8gT3B0aW9uYWwgYGVhY2hDYWxsYmFja2AgaXMgcGFzc2VkIChjdXJyTm9kZSwgcHJvcCwgbmV4dFByb3ApXG4vLyBUaGlzIGFsbG93cyB0aGUgbmV4dCBub2RlIHRvIGJlIGNyZWF0ZWQgb3IgY2hhbmdlZCBiZWZvcmUgZWFjaCB0cmF2ZXJzYWxcbiAgICBjb25zdCBwYXRoQXJyID0gcGF0aFN0ci5zcGxpdChcIi5cIik7XG4gICAgbGV0IGN1cnJOb2RlID0gdHJlZTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBwYXRoQXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHByb3AgPSBwYXRoQXJyW2ldO1xuICAgICAgICBpZiAoZWFjaENhbGxiYWNrKSB7XG4gICAgICAgICAgICBlYWNoQ2FsbGJhY2soY3Vyck5vZGUsIHByb3AsIHBhdGhBcnJbaSArIDFdKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY3Vyck5vZGUgPT09IHVuZGVmaW5lZCkgYnJlYWs7XG4gICAgICAgIGVsc2UgY3Vyck5vZGUgPSBjdXJyTm9kZVtwcm9wXTtcbiAgICB9XG4gICAgcmV0dXJuIGN1cnJOb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2UoIC8qIFttZXJnZUNoaWxkT2JzLF0ge30sIHt9IFssIC4uLl0gWywgY2FsbGJhY2tdICovICkge1xuLy8gQWRkIG9yIG92ZXJ3cml0ZSBhbGwgcHJvcGVydGllcyByaWdodCB0byBsZWZ0XG4vLyBCeSBkZWZhdWx0IGNoaWxkIG9iamVjdHMgYXJlIG1lcmdlZCByZWN1cnNpdmVseSAoYnV0IG5vdCBhcnJheXMpXG4vLyBJZiBhIGJvb2xlYW4gaXMgc3VwcGxpZWQsIGl0IGJlY29tZXMgYG1lcmdlQ2hpbGRPYnNgIHZhbHVlIHVudGlsIGFub3RoZXIgYm9vbGVhbiBpcyBmb3VuZFxuLy8gSWYgYSBjYWxsYmFjayBpcyBzdXBwbGllZCwgaXQgd2lsbCByZWNlaXZlIGEgYm9vbGVhbiBhcmd1bWVudCBgaXNDaGFuZ2VkYFxuICAgIGxldCBsZXZlbCA9IDAsXG4gICAgICAgIGNoYW5nZUNvdW50ID0gMCxcbiAgICAgICAgbWVyZ2VDaGlsZE9icyA9IHRydWUsXG4gICAgICAgIGNhbGxiYWNrLFxuICAgICAgICByZXN1bHQgPSBydW4uYXBwbHkodGhpcywgWzAsIGFyZ3VtZW50c10pO1xuXG4gICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayghIWNoYW5nZUNvdW50KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgZnVuY3Rpb24gcnVuKGxldmVsLCBwYXJhbXMpIHtcbiAgICAgICAgbGV0IHBhcmFtLFxuICAgICAgICAgICAgcmV0T2IsXG4gICAgICAgICAgICBwYXJhbXNDb3VudCA9IHBhcmFtcy5sZW5ndGg7XG5cbiAgICAgICAgLy8gQ2hpbGQgb2JqZWN0c1xuICAgICAgICAvLyBNZXJnZSBpbnRvIGxlZnRtb3N0IHBhcmFtIGlmIGFuIG9iamVjdCwgb3IgY3JlYXRlIG9iamVjdCB0byBtZXJnZSBpbnRvXG4gICAgICAgIGlmIChsZXZlbCkge1xuICAgICAgICAgICAgcmV0T2IgPSBpc09iamVjdChwYXJhbXNbMF0pID8gcGFyYW1zWzBdIDoge31cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyYW1zQ291bnQ7IGkrKykge1xuICAgICAgICAgICAgcGFyYW0gPSBwYXJhbXNbaV07XG5cbiAgICAgICAgICAgIC8vIFRvcCBsZXZlbCBwYXJhbXMgbWF5IGNvbnRhaW4gb3RoZXIgYXJndW1lbnRzXG4gICAgICAgICAgICBpZiAoIWxldmVsICYmIHBhcmFtICE9IG51bGwpIHsgLy8gYHVuZGVmaW5lZGAgb3IgYG51bGxgXG4gICAgICAgICAgICAgICAgLy8gRmlyc3Qgb2JqZWN0IGJlY29tZXMgcmV0dXJuZWQgb2JqZWN0XG4gICAgICAgICAgICAgICAgLy8gQWxzbyBhbGxvdyBhIERPTSBub2RlIGZvciBtZXJnaW5nIGludG9cbiAgICAgICAgICAgICAgICBpZiAoIXJldE9iICYmIGlzT2JqZWN0KHBhcmFtKSB8fCBwYXJhbS5ub2RlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXRPYiA9IHBhcmFtO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gYG1lcmdlQ2hpbGRPYnNgIGJvb2xlYW4gYXJndW1lbnRzXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhbSA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVyZ2VDaGlsZE9icyA9IHBhcmFtO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gTGFzdCBwYXNzZWQgaW4gZnVuY3Rpb24gYmVjb21lcyBjYWxsYmFja1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyYW0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayA9IHBhcmFtO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFyZXRPYikgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHAgaW4gcGFyYW0pIHtcbiAgICAgICAgICAgICAgICBpZiAocGFyYW0uaGFzT3duUHJvcGVydHkocCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsID0gcGFyYW1bcF07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gTWVyZ2UgY2hpbGQgb2JqZWN0cyAocmVjdXJzaXZlKVxuICAgICAgICAgICAgICAgICAgICBpZiAobWVyZ2VDaGlsZE9icyAmJiBpc09iamVjdCh2YWwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXRPYltwXSA9IHJ1bihsZXZlbCsxLCBbcmV0T2JbcF0sIHZhbF0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbCAhPT0gcmV0T2JbcF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZUNvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXRPYltwXSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0T2IgfHwge307XG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi8uLi9qcy9saWIvYXBwXCI7XG5cbmRlc2NyaWJlKFwiT2JqZWN0IHV0aWwgdGVzdHNcIiwgZnVuY3Rpb24oKXtcblxuICAgIGRlc2NyaWJlKFwic2V0Tm9kZVwiLCBmdW5jdGlvbigpe1xuXG4gICAgICAgIHZhciBzZXROb2RlID0gYXBwLnNldE5vZGU7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgYWRkIGEgbmV3IHByb3BlcnR5XCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOjEsIGI6Mn07XG4gICAgICAgICAgICBzZXROb2RlKHRyZWUsIFwiaFwiLCA3Nyk7XG5cbiAgICAgICAgICAgIGV4cGVjdCh0cmVlKS50b0VxdWFsKHthOjEsIGI6MiwgaDo3N30pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBhZGQgYSBwcm9wZXJ0eSBhdCBhIG5ldyBwYXRoXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOjEsIGI6Mn07XG4gICAgICAgICAgICBzZXROb2RlKHRyZWUsIFwiaC5qXCIsIDc3KTtcblxuICAgICAgICAgICAgZXhwZWN0KHRyZWUpLnRvRXF1YWwoe2E6MSwgYjoyLCBoOiB7ajogNzd9fSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGFkZCBhIHByb3BlcnR5IGF0IGEgbmV3IGRlZXAgcGF0aFwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToxLCBiOjJ9O1xuICAgICAgICAgICAgc2V0Tm9kZSh0cmVlLCBcImguai5rLmxcIiwgNzcpO1xuXG4gICAgICAgICAgICBleHBlY3QodHJlZSkudG9FcXVhbCh7YToxLCBiOjIsIGg6IHtqOiB7azoge2w6IDc3fX19fSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGFkZCBhIHByb3BlcnR5IGF0IGEgcGFydGlhbCBkZWVwIHBhdGhcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6IHtiOiB7Yzoge2Q6IDc3fX19fTtcbiAgICAgICAgICAgIHNldE5vZGUodHJlZSwgXCJhLmJcIiwgNzcpO1xuXG4gICAgICAgICAgICBleHBlY3QodHJlZSkudG9FcXVhbCh7YToge2I6Nzd9fSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGFkZCBhIG5ldyBudW1lcmljYWwgcHJvcGVydHkgYXQgcm9vdFwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToxLCBiOjJ9O1xuICAgICAgICAgICAgc2V0Tm9kZSh0cmVlLCBcIjJcIiwgNzcpO1xuXG4gICAgICAgICAgICBleHBlY3QodHJlZSkudG9FcXVhbCh7YToxLCBiOjIsIFwiMlwiOjc3fSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGFkZCBhbiBhcnJheSBhdCBhIG51bWVyaWNhbCBwYXRoXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOjEsIGI6Mn07XG4gICAgICAgICAgICBzZXROb2RlKHRyZWUsIFwiYy4yXCIsIDc3KTtcblxuICAgICAgICAgICAgLy9TdHJpbmdpZnkgdG8gYWxsb3cgY2hpbGQgb2JqZWN0IGNvbXBhcmlzb25cbiAgICAgICAgICAgIGV4cGVjdChKU09OLnN0cmluZ2lmeSh0cmVlKSkudG9FcXVhbChcbiAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7YToxLCBiOjIsIGM6W3VuZGVmaW5lZCwgdW5kZWZpbmVkLCA3N119KVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgYWRkIGFuIGFycmF5IGF0IGEgZGVlcCBudW1lcmljYWwgcGF0aFwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToxLCBiOjJ9O1xuICAgICAgICAgICAgc2V0Tm9kZSh0cmVlLCBcImMuMi5hLjEuMlwiLCA3Nyk7XG5cbiAgICAgICAgICAgIC8vU3RyaW5naWZ5IHRvIGFsbG93IGNoaWxkIG9iamVjdCBjb21wYXJpc29uXG4gICAgICAgICAgICBleHBlY3QoSlNPTi5zdHJpbmdpZnkodHJlZSkpLnRvRXF1YWwoXG4gICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe2E6MSwgYjoyLCBjOlt1bmRlZmluZWQsIHVuZGVmaW5lZCwge2E6IFt1bmRlZmluZWQsIFt1bmRlZmluZWQsIHVuZGVmaW5lZCwgNzddXX1dfSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgICBkZXNjcmliZShcImdldE5vZGVcIiwgZnVuY3Rpb24oKXtcblxuICAgICAgICB2YXIgZ2V0Tm9kZSA9IGFwcC5nZXROb2RlO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGdldCBhIHByb3BlcnR5IHZhbHVlXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOjEsIGI6Mn07XG4gICAgICAgICAgICBleHBlY3QoZ2V0Tm9kZSh0cmVlLCBcImFcIikpLnRvQmUoMSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGl0KFwiU2hvdWxkIGdldCBhIGRlZXAgcHJvcGVydHkgdmFsdWVcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6e2I6e2M6Nzd9fSwgYjoyfTtcbiAgICAgICAgICAgIGV4cGVjdChnZXROb2RlKHRyZWUsIFwiYS5iLmNcIikpLnRvQmUoNzcpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBnZXQgYSBwcm9wZXJ0eSBjb250YWluaW5nIGEgbnVtZXJpY2FsIGluZGV4XCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOntiOlt7YzogNzd9XX0sIGI6Mn07XG4gICAgICAgICAgICBleHBlY3QoZ2V0Tm9kZSh0cmVlLCBcImEuYi4wLmNcIikpLnRvQmUoNzcpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCByZXR1cm4gdW5kZWZpbmVkIGZvciBhbiBpbnZhbGlkIHBhdGhcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6e2I6W3tjOiA3N31dfSwgYjoyfTtcbiAgICAgICAgICAgIGV4cGVjdChnZXROb2RlKHRyZWUsIFwiYS5iLjcuYy41LjZcIikpLnRvQmUodW5kZWZpbmVkKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgYWxsb3cgZmFsc3kgdmFsdWVzIGluIHBhdGhcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0gezA6ezA6W3swOiAwfV19fTtcbiAgICAgICAgICAgIGV4cGVjdChnZXROb2RlKHRyZWUsIFwiMC4wLjAuMFwiKSkudG9CZSgwKTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKFwibWVyZ2VcIiwgZnVuY3Rpb24oKXtcblxuICAgICAgICB2YXIgbWVyZ2UgPSBhcHAubWVyZ2U7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgYWRkIG9iamVjdCBwcm9wZXJ0aWVzXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOjEsIGI6WzIsIDNdfSxcbiAgICAgICAgICAgICAgICB0cmVlMiA9IHtjOjMsIGQ6NH0sXG4gICAgICAgICAgICAgICAgdHJlZTMgPSB7ZTo1LCBmOjZ9O1xuICAgICAgICAgICAgZXhwZWN0KG1lcmdlKHRyZWUsIHRyZWUyLCB0cmVlMykpLnRvRXF1YWwoe2E6MSwgYjpbMiwgM10sIGM6MywgZDo0LCBlOjUsIGY6Nn0pO1xuXG4gICAgICAgICAgICAvL0VkZ2UgY2FzZXNcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZSgpKS50b0VxdWFsKHt9KTtcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZSh0cmVlKSkudG9CZSh0cmVlKTtcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZShcIjIzXCIpKS50b0VxdWFsKHt9KTtcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZShcIjIzXCIsIFwiMzRcIikpLnRvRXF1YWwoe30pO1xuICAgICAgICAgICAgZXhwZWN0KG1lcmdlKHsyOiBcIjVcIn0sIFwiMzRcIikpLnRvRXF1YWwoezA6IFwiM1wiLCAxOiBcIjRcIiwgMjpcIjVcIn0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBvdmVyd3JpdGUgcHJvcGVydGllcyByaWdodCB0byBsZWZ0XCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOjEsIGI6WzIsIDNdfSxcbiAgICAgICAgICAgICAgICB0cmVlMiA9IHtjOjMsIGI6WzRdfSxcbiAgICAgICAgICAgICAgICB0cmVlMyA9IHthOjUsIGQ6Nn07XG4gICAgICAgICAgICBleHBlY3QobWVyZ2UodHJlZSwgdHJlZTIsIHRyZWUzKSkudG9FcXVhbCh7YTo1LCBiOls0XSwgYzozLCBkOjZ9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgbWVyZ2UgY2hpbGQgb2JqZWN0cyByaWdodCB0byBsZWZ0XCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOiB7YToxLCBiOlsyLCAzXX19LFxuICAgICAgICAgICAgICAgIHRyZWUyID0ge2E6IHtjOjMsIGI6WzRdfX0sXG4gICAgICAgICAgICAgICAgdHJlZTMgPSB7YToge2E6NSwgZDo2fX07XG4gICAgICAgICAgICBleHBlY3QobWVyZ2UodHJlZSwgdHJlZTIsIHRyZWUzKSkudG9FcXVhbCh7YToge2E6NSwgYjpbNF0sIGM6MywgZDo2fX0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBtZXJnZSBkZWVwIGNoaWxkIG9iamVjdHMgcmlnaHQgdG8gbGVmdFwiLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyZWUgPSB7YToge2E6IFs3LCA4XSwgYjp7Yzp7ZDp7ZTo3N319fX19LFxuICAgICAgICAgICAgICAgIHRyZWUyID0ge2E6IHthOjEsIGI6e2M6e2Q6e2U6ODh9fX19fSxcbiAgICAgICAgICAgICAgICB0cmVlMyA9IHthOiB7YTogWzZdfX07XG4gICAgICAgICAgICBleHBlY3QobWVyZ2UodHJlZSwgdHJlZTIsIHRyZWUzKSkudG9FcXVhbCh7YToge2E6WzZdLCBiOntjOntkOntlOjg4fX19fX0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdChcIlNob3VsZCBub3QgbWVyZ2UgY2hpbGQgb2JqZWN0cyB3aGVuIGJvb2xlYW4gZmFsc2UgaXMgcGFzc2VkIGluXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcmVmT2IgPSB7YWE6MSwgYmI6Mn0sXG4gICAgICAgICAgICAgICAgdHJlZSA9IHthOjEsIGI6MiwgYzp7fX0sXG4gICAgICAgICAgICAgICAgdHJlZTIgPSB7YzogcmVmT2J9O1xuICAgICAgICAgICAgLy8gQm9vbGVhbiBpcyBgbWVyZ2VDaGlsZE9ic2BcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBtZXJnZShmYWxzZSwgdHJlZSwgdHJlZTIpO1xuICAgICAgICAgICAgZXhwZWN0KHJlc3VsdC5jKS50b0JlKHJlZk9iKTtcbiAgICAgICAgICAgIGV4cGVjdChyZXN1bHQpLnRvRXF1YWwoe2E6IDEsIGI6MiwgYzp7YWE6MSwgYmI6Mn19KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgc3dpdGNoIG9uIGFuZCBvZmYgbWVyZ2luZyBjaGlsZCBvYmplY3RzIHdoZW4gYm9vbGVhbnMgYXJlIHBhc3NlZCBpblwiLCBmdW5jdGlvbihkb25lKXtcbiAgICAgICAgICAgIHZhciByZWZPYiA9IHthYToxLCBiYjoyfSxcbiAgICAgICAgICAgICAgICB0cmVlID0ge2E6MSwgYjoyLCBjOnt9fSxcbiAgICAgICAgICAgICAgICB0cmVlMiA9IHtjOiByZWZPYn0sXG4gICAgICAgICAgICAgICAgdHJlZTMgPSB7ZDogcmVmT2J9LFxuICAgICAgICAgICAgICAgIHRyZWU0ID0ge2U6IHJlZk9ifTtcbiAgICAgICAgICAgIC8vIEJvb2xlYW4gc3dpdGNoZXMgYG1lcmdlQ2hpbGRPYnNgIChhbHNvIHRlc3QgbXVsdGlwbGUgdW51c2VkIGFyZ3VtZW50cywgYW5kIGNhbGxiYWNrIGFyZ3VtZW50KVxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG1lcmdlKHRydWUsIHRydWUsIGZhbHNlLCBmYWxzZSwgdHJlZSwgdHJlZTIsIHRydWUsIGZhbHNlLCBkb25lLCB0cnVlLCB0cmVlMywgZmFsc2UsIHRyZWU0LCB0cnVlKTtcbiAgICAgICAgICAgIGV4cGVjdChyZXN1bHQuYykudG9CZShyZWZPYik7XG4gICAgICAgICAgICBleHBlY3QocmVzdWx0LmQpLm5vdC50b0JlKHJlZk9iKTtcbiAgICAgICAgICAgIGV4cGVjdChyZXN1bHQuZSkudG9CZShyZWZPYik7XG4gICAgICAgICAgICBleHBlY3QocmVzdWx0KS50b0VxdWFsKHthOiAxLCBiOjIsIGM6e2FhOjEsIGJiOjJ9LCBkOnthYToxLCBiYjoyfSwgZTp7YWE6MSwgYmI6Mn19KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgaWdub3JlIGFyZ3VtZW50cyBvZiB3cm9uZyB0eXBlXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJlZSA9IHthOiB7YTogMSwgYjpbMiwgM119fSxcbiAgICAgICAgICAgICAgICB0cmVlMiA9IHthOiB7YjogNn19O1xuICAgICAgICAgICAgZXhwZWN0KG1lcmdlKFwiXCIsIFwiXCIsIFwiXCIsIFwiXCIsIHRyZWUsIHRyZWUyKSkudG9FcXVhbCh7YToge2E6IDEsIGI6Nn19KTtcblxuICAgICAgICAgICAgdHJlZSA9IHthOjEsIGI6WzIsIDNdfTtcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZShcIlwiLCA5OSwgdHJlZSwgXCJcIiwgODgpKS50b0VxdWFsKHRyZWUpO1xuICAgICAgICAgICAgZXhwZWN0KG1lcmdlKHRyZWUsIDk5LCBcIlwiLCBcIlwiLCBcIlwiKSkudG9FcXVhbCh0cmVlKTtcbiAgICAgICAgICAgIGV4cGVjdChtZXJnZSg5OSwgdHJlZSwgXCJcIiwgODgsIDc3KSkudG9FcXVhbCh0cmVlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoXCJTaG91bGQgcmVwb3J0IGNoYW5nZXNcIiwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmVlID0ge2E6IHthOjEsIGI6WzIsIDNdfX0sXG4gICAgICAgICAgICAgICAgdHJlZTIgPSB7YToge2M6MywgYjpbNF19fSxcbiAgICAgICAgICAgICAgICB0cmVlMyA9IHthOiB7YTogWzZdfX07XG5cbiAgICAgICAgICAgIG1lcmdlKHRyZWUsIHRyZWUyLCBmdW5jdGlvbihpc0NoYW5nZWQpe1xuICAgICAgICAgICAgICAgIGV4cGVjdChpc0NoYW5nZWQpLnRvQmUodHJ1ZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbWVyZ2UodHJlZSwgdHJlZSwgZnVuY3Rpb24oaXNDaGFuZ2VkKXtcbiAgICAgICAgICAgICAgICBleHBlY3QoaXNDaGFuZ2VkKS50b0JlKGZhbHNlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBtZXJnZSh0cmVlLCBmdW5jdGlvbigpe30sIGZ1bmN0aW9uKGlzQ2hhbmdlZCl7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGlzQ2hhbmdlZCkudG9CZShmYWxzZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbWVyZ2UoXCJcIiwgdHJlZSwgdHJlZTMsIGZ1bmN0aW9uKGlzQ2hhbmdlZCl7XG4gICAgICAgICAgICAgICAgZXhwZWN0KGlzQ2hhbmdlZCkudG9CZSh0cnVlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBtZXJnZSh7ejogODh9LCB0cmVlLCBmdW5jdGlvbihpc0NoYW5nZWQpe1xuICAgICAgICAgICAgICAgIGV4cGVjdChpc0NoYW5nZWQpLnRvQmUodHJ1ZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbWVyZ2Uoe3o6IHt5OiB7eDogNTV9fX0sIHt6OiB7eToge3g6IDU2fX19LCBmdW5jdGlvbihpc0NoYW5nZWQpe1xuICAgICAgICAgICAgICAgIGV4cGVjdChpc0NoYW5nZWQpLnRvQmUodHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG5cbiJdfQ==
