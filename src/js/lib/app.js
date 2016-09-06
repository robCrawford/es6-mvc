"use strict";

/*
  App
*/
const modules = [];
let currView, currModel;

export function add(moduleName, M, V, C) {
    const view = currView = new V();
    const model = currModel = new M();
    const controller = new C();
    model.init();

    return (modules[moduleName] = {
        model: model,
        view: view,
        controller: controller
    });
}

export function get(moduleName) {
    return modules[moduleName];
}

/*
  Model
*/
export class Model{

    constructor() {
        this.tree = {};
        this.callbacks = {
            setPre: [],
            setPost: [],
            change: []
        };
    }

    init() {
    // Run any callbacks registered during instantiation
        for (var p in this.callbacks) {
            if (this.callbacks.hasOwnProperty(p)) {
                this.runCallbacks(p);
            }
        }
    }

    setPre(props) {
    // Allows validation etc. before setting props
    // `props` is a copy that can be safely mutated
        const callbacks = this.callbacks["setPre"];
        let i = callbacks.length;
        while (i--) {
            props = callbacks[i].call(this, props);
        }
        return props;
    }

    setPost(props) {
    // Runs callbacks after `set()` whether model changed or not
        this.runCallbacks("setPost");
    }

    change() {
    // Runs callbacks after `set()` if model changed
        this.runCallbacks("change");
    }

    set(propsOrPath, value) {
    // Accepts props object `{...}` OR 'path', 'value'
        let changeEvent;

        if (isObject(propsOrPath)) {
            // Run any "setPre" callbacks on a copy of `props`
            const props = this.setPre(merge({}, propsOrPath));
            merge(this.tree, props, isChanged => changeEvent = isChanged);
        }
        else {
            const path = propsOrPath;
            // Run any "setPre" callbacks
            value = this.setPre({[path]: value})[path];
            changeEvent = setNode(this.tree, path, value);
        }
        if (changeEvent) {
            this.change();
        }
        this.setPost();
        return this; // For chaining
    }

    get(path) {
        return getNode(this.tree, path);
    }

    on(label, callback) {
        const callbacks = this.callbacks[label];
        if (callbacks) {
            callbacks.unshift(callback);
        }
        return this; // For chaining
    }

    runCallbacks(label) {
        const callbacks = this.callbacks[label];
        let i = callbacks.length;
        while (i--) {
            callbacks[i].call(this, this.tree);
        }
    }

    toJSON() {
    // Return tree for JSON.stringify()
        return this.tree;
    }
}

/*
  View
*/
export class View {

    constructor() {
        // Derived class must assign `el` property
    }

    get(selector) {
        return this.el.querySelector(selector);
    }

    getAll(selector) {
        return this.el.querySelectorAll(selector);
    }
}

/*
  Controller
*/
export class Controller {

    constructor() {
        this.model = currModel;
        if (currView.el) {
            this.view = currView;
        }
        else {
            throw(new Error('View.el required!'));
        }
        currModel = null;
        currView = null;
    }

    bind(bindings) {
    // Run binding functions for selectors (within view.el)
        for (const selector in bindings) {
            if (bindings.hasOwnProperty(selector)) {
                const domEls = this.view.el.querySelectorAll(selector);
                let i = domEls.length;
                while (i--) {
                    bindings[selector].call(this, domEls[i], this.model, this.view, this);
                }
            }
        }
        return this; // For chaining
    }
}

/*
  Utils
*/
function isObject(o) {
    return o === Object(o) &&
           !o.nodeType &&
           !Array.isArray(o) &&
           !(typeof o === 'function') &&
           !(o instanceof RegExp);
}

function isNumeric(val) {
    return Number(parseFloat(val)) == val;
}

export function setNode(tree, pathStr, value) {
// Set node at path string to value
// Any missing nodes are created
// NOTE: all numeric nodes below root are assumed to be array indexes
// Returns boolean `true` if value was changed
    let isChanged = false;

    getNode(tree, pathStr, (currNode, prop, nextProp) => {
        // Last segment of path string, set value if different
        if (nextProp === undefined) {
            const currVal = currNode[prop];
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

export function getNode(tree, pathStr, eachCallback) {
// Get node from path string
// Optional `eachCallback` is passed (currNode, prop, nextProp)
// This allows the next node to be created or changed before each traversal
    const pathArr = pathStr.split(".");
    let currNode = tree;

    for (let i = 0, len = pathArr.length; i < len; i++) {
        const prop = pathArr[i];
        if (eachCallback) {
            eachCallback(currNode, prop, pathArr[i + 1]);
        }
        if (currNode === undefined) break;
        else currNode = currNode[prop];
    }
    return currNode;
}

export function merge( /* [mergeChildObs,] {}, {} [, ...] [, callback] */ ) {
// Add or overwrite all properties right to left
// By default child objects are merged recursively (but not arrays)
// If a boolean is supplied, it becomes `mergeChildObs` value until another boolean is found
// If a callback is supplied, it will receive a boolean argument `isChanged`
    let level = 0,
        changeCount = 0,
        mergeChildObs = true,
        callback,
        result = run.apply(this, [0, arguments]);

    if (callback) callback(!!changeCount);
    return result;

    function run(level, params) {
        let param,
            retOb,
            paramsCount = params.length;

        // Child objects
        // Merge into leftmost param if an object, or create object to merge into
        if (level) {
            retOb = isObject(params[0]) ? params[0] : {}
        }

        for (let i = 0; i < paramsCount; i++) {
            param = params[i];

            // Top level params may contain other arguments
            if (!level && param != null) { // `undefined` or `null`
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
            for (const p in param) {
                if (param.hasOwnProperty(p)) {
                    const val = param[p];

                    // Merge child objects (recursive)
                    if (mergeChildObs && isObject(val)) {
                        retOb[p] = run(level+1, [retOb[p], val]);
                    }
                    else if (val !== retOb[p]) {
                        changeCount++;
                        retOb[p] = val;
                    }
                }
            }
        }
        return retOb || {};
    }
}
