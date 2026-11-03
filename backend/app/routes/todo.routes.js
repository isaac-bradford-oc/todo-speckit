import { Router } from "express";
import { authenticate } from "../authorization/authorization.js";
import todoController from "../controllers/todo.controller.js";

const router = Router();

router.put("/:id", [authenticate], todoController.update);
router.delete("/:id", [authenticate], todoController.delete);

export default router;
