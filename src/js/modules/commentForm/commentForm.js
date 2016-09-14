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
