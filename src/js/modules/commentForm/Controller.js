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
