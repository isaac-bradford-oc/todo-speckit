import { Router } from "express";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], (req, res) => {
  res.status(200).send([]);
});

export default router;
