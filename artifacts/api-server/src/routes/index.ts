import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scraperRouter from "./scraper";
import keywordsRouter from "./keywords";
import jobsRouter from "./jobs";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/scraper", scraperRouter);
router.use("/keywords", keywordsRouter);
router.use("/jobs", jobsRouter);
router.use("/settings", settingsRouter);

export default router;
