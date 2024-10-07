import { Router } from "express";
import { getFilteredContractsBuffer } from "./contracts.controller";
const router = Router();

router.post("/:misServiceRequestId/filtered", getFilteredContractsBuffer);
export default router;
