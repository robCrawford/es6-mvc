import Boot from "./modules/Boot/Boot";
import UserForm from "./modules/UserForm/UserForm";

new Boot()
    .then(() => {
        new UserForm();
    });
