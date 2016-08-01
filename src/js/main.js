import Boot from "./modules/Boot";
import UserForm from "./modules/UserForm";

new Boot()
    .then(() => {
        new UserForm();
    });
