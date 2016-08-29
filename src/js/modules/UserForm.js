import * as app from "../lib/app";

/*
  Example module for a web form
*/
export default class {

    constructor() {

        app.add(
            "userForm",

            /*
              Model - `set()`, `get()` & `on()` methods
            */
            new app.Model(function() {

                // Add any business logic
                this.sanitize = props => {
                    for (const p in props) {
                        if (props.hasOwnProperty(p) && typeof props[p] === "string") {
                            props[p] = props[p].replace(/\W/g, '');
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

                // Set by path
                this.set('location.year', 2052);
            }),


            /*
              View - `el` property
            */
            new app.View(function() {

                // Set DOM ref
                this.el = document.getElementById('userForm');

                // Populate view (just a simple example)
                this.el.innerHTML = 'First name: <input id="firstName">' +
                    'Surname: <input id="lastName">';
            }),


            /*
              Controller - MVC arguments, `bind()` method
            */
            new app.Controller(function(model, view, controller) {

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
    }

};
