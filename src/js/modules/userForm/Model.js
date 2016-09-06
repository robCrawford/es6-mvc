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
