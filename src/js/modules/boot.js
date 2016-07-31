/*
  Boot operations
*/
export default class {

    constructor() {
        return this.ready();
    }

    ready() {
        return new Promise((resolve, reject) => {
            document.addEventListener("DOMContentLoaded", () => {
                // Just a dummy condition
                if (/\w/.test(location.href)) {
                    resolve();
                }
                else reject('Error');
            });
        });
    }

};
