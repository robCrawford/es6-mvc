import Boot from "./modules/Boot/Boot";
import CommentForm from "./modules/CommentForm/CommentForm";

new Boot()
    .then(() => {
        new CommentForm();
    });
