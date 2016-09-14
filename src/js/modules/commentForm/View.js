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
