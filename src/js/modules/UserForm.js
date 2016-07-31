import * as app from "../lib/app";

/*
  Example module for a web form
  See comments
*/
export default class {

    constructor() {

        app.add(
            "userForm",

            /*
              Model
              set()` & `get()` for data, `on()` for listeners
            */
            new app.Model(function() {

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
                this.on('set', props => this.sanitize(props));

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
            new app.View(function() {

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
            new app.Controller(function(model, view, controller) {

                // Example 2 way bindings
                this.bind({

                    '#firstName': (el, model, view, controller) => {
                        el.onkeyup = function() {
                            model.set('firstName', this.value);
                        };
                        model.on('change', function() {
                            el.value = this.get('firstName');
                        });
                    },

                    '#lastName': (el, model, view, controller) => {
                        el.onkeyup = function() {
                            model.set('lastName', this.value);
                        };
                        model.on('change', function() {
                            el.value = this.get('lastName');
                            document.getElementById('userModel').innerHTML = JSON.stringify(model);
                        });
                    }

                });

            })
        );
    }

};