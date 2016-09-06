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
