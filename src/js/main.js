import Boot from "./modules/Boot";
import UserForm from "./modules/UserForm";

// Initialise
new Boot()
    .then(() => {
        new UserForm();
    });
