"use strict";

/*
  App
*/
const modules = [];

export function add(name, model, view, controller) {
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

    return (modules[name] = {
        model: model,
        view: view,
        controller: controller
    });
}

export function get(name) {
    return modules[name];
}

/*
  Model
*/
export class Model{

    constructor (init) {
        this.tree = {};
        this.callbacks = {
            setPre: [],
            setPost: [],
            change: []
        };
        this.init = init && init.bind(this);
    }

    setPre (props) {
    // Allows validation etc. before setting props
    // `props` is a copy that can be safely mutated
        const callbacks = this.callbacks["setPre"];
        let i = callbacks.length;
        while (i--) {
            props = callbacks[i].call(this, props);
        }
        return props;
    }

    setPost (props) {
    // Runs callbacks after `set()` whether model changed or not
        this.runCallbacks("setPost");
    }

    change () {
    // Runs callbacks after `set()` if model changed
        this.runCallbacks("change");
    }

    set (propsOrPath, value) {
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

    get (path) {
        return getNode(this.tree, path);
    }

    on (label, callback) {
        const callbacks = this.callbacks[label];
        if (callbacks) {
            callbacks.unshift(callback);
        }
        return this; // For chaining
    }

    runCallbacks (label) {
        const callbacks = this.callbacks[label];
        let i = callbacks.length;
        while (i--) {
            callbacks[i].call(this, this.tree);
        }
    }

    toJSON () {
    // Return tree for JSON.stringify()
        return this.tree;
    }
}

/*
  View
*/
export class View {

    constructor (init) {
        this.init = init && init.bind(this);

        if (!this.el) {
            this.el = document.createElement("div");
        }
        if (!this.el.parentNode) {
            document.body.appendChild(this.el);
        }
    }
}

/*
  Controller
*/
export class Controller {

    constructor (init) {
        this.init = init && init.bind(this);
    }

    bind (bindings) {
    // Run binding functions for selectors
        for (const selector in bindings) {
            if (bindings.hasOwnProperty(selector)) {
                const domEls = document.querySelectorAll(selector);
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
