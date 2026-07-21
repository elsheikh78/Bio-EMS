import { Router } from "express";
import {
    createSiteController,
    getSitesController
} from "../controllers/site.controller";

const router = Router();

router.post("/", createSiteController);

router.get("/", getSitesController);

export default router;