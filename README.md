
#ES6 App

A minimal MVC pattern for ES6 applications.  
This should provide the wiring for data binding and SOC, with no additional features. *[(app.js)](https://github.com/robCrawford/es6-app/blob/master/src/js/lib/app.js)*  
Set up for ES6 modules with sourcemaps, Karma, and Less.  


### Set up  
Install: `npm install`  
Build: `gulp` *(or `gulp dev`/`gulp prod`)*  
Test: `npm test`  
Run: `dist/index.html`  


### Example syntax  
*userForm/UserForm.js - ([demo here](http://robcrawford.github.io/demos/es6-app/))*
```javascript
import * as app from "../../lib/app";
import Model from "./Model"
import View from "./View"
import Controller from "./Controller"

"use strict"

/*
  Example module for a web form
*/
export default class {

    constructor() {
        return app.add("userForm", Model, View, Controller);
    }

};
```

*userForm/Model.js*
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
                    props[p] = props[p].replace(/\W/g, '');
                }
            }
            return props;
        }

        // Set listener
        this.on('setPre', props => this.sanitize(props));

        // Populate model
        this.set({
            firstName: 'Philip',
            lastName: 'Fry'
        });

        // Set by path
        this.set('location.year', 2052);
    }

};
```

*userForm/View.js*
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
        this.el = document.getElementById("userForm");
    }

};
```

*userForm/Controller.js*
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

        // Render model on change
        this.model.on('change', () => {
            this.view.get('.model').innerHTML = JSON.stringify(this.model);
        });

        // Example 2 way bindings
        this.bind({

            '#firstName': (el, model, view, controller) => {
                el.onkeyup = function() {
                    model.set('firstName', this.value);
                };
                model.on('setPost', function() {
                    el.value = this.get('firstName');
                });
            },

            '#lastName': (el, model, view, controller) => {
                el.onkeyup = function() {
                    model.set('lastName', this.value);
                };
                model.on('setPost', function() {
                    el.value = this.get('lastName');
                });
            }

        });
    }

};
```
