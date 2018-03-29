
# ES6 App

A minimal MVC pattern for ES6 applications.  
This should provide the wiring for data binding and SOC, with no additional features. *[(app.js)](https://github.com/robCrawford/es6-app/blob/master/src/js/lib/app.js)*  
Set up for ES6 modules with sourcemaps, Karma, and Less.  


### Set up  
Install: `npm install`  
Build: `gulp` *(or `gulp dev`/`gulp prod`)*  
Test: `npm test`  
Run: `dist/index.html`  


### Example syntax  
*commentForm/CommentForm.js - ([demo here](http://robcrawford.github.io/demos/es6-app/))*
```javascript
import * as app from "../../lib/app";
import Model from "./Model"
import View from "./View"
import Controller from "./Controller"

"use strict"

/*
  Example module
*/
export default class {

    constructor() {
        return app.add("commentForm", Model, View, Controller);
    }

};
```

*commentForm/Model.js*
```javascript
import * as app from "../../lib/app";

"use strict"

/*
  Extends app.Model
      Methods: `set()`, `get()`, `on('setPre'|'setPost'|'change')`
*/
export default class extends app.Model {

    constructor() {
        super();

        // Arbitrary method
        this.sanitize = props => {
            for (const p in props) {
                if (props.hasOwnProperty(p) && typeof props[p] === "string") {
                    props[p] = props[p].replace(/[^\w\s'!.,;]/g, '');
                }
            }
            return props;
        }

        // Set listener
        this.on('setPre', props => this.sanitize(props));

        // Populate model
        this.set({
            comment: '',
            date: Date.now()
        });

        // Set by path
        this.set('user.name', 'Guest');
    }

};
```

*commentForm/View.js*
```javascript
import * as app from "../../lib/app";

"use strict"

/*
  Extends app.View
      Properties: `el`
      Methods: `get()`, `getAll()` for DOM selectors
*/
export default class extends app.View {

    constructor() {
        super();

        // Set DOM ref
        this.el = document.getElementById("commentForm");
    }

};
```

*commentForm/Controller.js*
```javascript
import * as app from "../../lib/app";

"use strict"

/*
  Extends `app.Controller`
      Properties: `model`, `view`
      Methods: `bind()` for DOM selectors
*/
export default class extends app.Controller {

    constructor() {
        super();

        // Update view when model changes
        this.model.on('change', () => {
            let comment = this.model.get('comment');
            if (comment) {
                comment = `<div>${this.model.get('user.name')}: ${comment}</div>`;
            }
            this.view.get('.commentArea').innerHTML = comment;
        });

        // Example 2 way bindings
        this.bind({

            '#name': (el, model, view, controller) => {
                el.onkeyup = () => {
                    model.set('user.name', el.value);
                }
                model.on('setPost', () => {
                    el.value = model.get('user.name');
                });
            },

            '#comment': (el, model, view, controller) => {
                el.onkeyup = () => {
                    model.set('comment', el.value);
                }
                model.on('setPost', () => {
                    el.value = model.get('comment');
                });
            }

        });
    }

};
```
