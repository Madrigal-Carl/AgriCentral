import express from "express";
import { timingSafeEqual } from "node:crypto";
import { autoDenyStaleRequests } from "../services/request.service.js";

const router = express.Router();
let isRunning = false;

router.post("/auto-deny-requests", (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret) return res.status(503).json({ message: "CRON_SECRET is not configured" });

    const suppliedSecret = req.get("x-cron-secret");
    const expected = Buffer.from(secret);
    const supplied = Buffer.from(suppliedSecret || "");
    if (!suppliedSecret || expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (isRunning) return res.status(202).json({ status: "already-running" });
    isRunning = true;
    res.status(202).json({ status: "started" });

    autoDenyStaleRequests()
        .then((summary) => console.log("Request auto-deny sweep:", summary))
        .catch((error) => console.error("Request auto-deny sweep failed:", error))
        .finally(() => { isRunning = false; });
});

export default router;
