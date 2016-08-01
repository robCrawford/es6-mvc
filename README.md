
#ES6 App

A minimal MVC pattern for ES6 applications.  
This should provide the wiring for data binding and SOC, with no additional features.  

Set up for ES6 modules with sourcemaps, Karma tests, and Less CSS.  

Install: `npm install`  
Build: `gulp`  
Test: `npm test`  
Run: `dist/index.html`  


### Example syntax  
*UserForm.js - ([demo here](http://robcrawford.github.io/demos/es6-app/))*
```javascript

app.add(
    "userForm",

    /*
      Model
      set()` & `get()` for data, `on()` for listeners
    */
    new app.Model(function() { // Runs once MVC is bound

        // Add any business logic
        this.sanitize = props => {
            for (var p in props) {
                if (props.hasOwnProperty(p)) {
                    props[p] = props[p].replace(/%\w\w|[\u0080-\uFFFF]+|\W/g, '');
                }
            }
            return props;
        }

        // Set any listeners
        this.on('setPre', props => this.sanitize(props));

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
    new app.View(function() { // Runs once MVC is bound

        // Set DOM ref
        this.el = document.getElementById('userForm');

        // Populate view (just a simple example)
        this.el.innerHTML = 'First name: <input id="firstName">' +
            'Surname: <input id="lastName">';
    }),


    /*
      Controller
      `bind({...})` allows easy wiring per DOM selector by supplying MVC arguments
    */
    new app.Controller(function(model, view, controller) { // Runs once MVC is bound

        // Render on change
        model.on('change', function() {
            document.getElementById('userModel').innerHTML = JSON.stringify(model);
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

    })
);

```
