import { Router } from "express";
import { authenticate } from "../authorization/authorization.js";
import userController from "../controllers/user.controller.js";

const router = Router();

router.get("/:id", [authenticate], userController.getUser);
router.put("/:id", [authenticate], userController.updateUser);

export default router;
