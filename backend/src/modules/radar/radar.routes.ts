import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { sendOk } from "@/lib/http";
import { parseQuery } from "@/middleware/validate";
import { radarService } from "@/modules/radar/radar.service";

/** The scam radar. Mounted inside the council routes, so staff-only already. */
export const radarRoutes = Router();

const query = z.object({ days: z.coerce.number().int().refine((n) => [7, 14, 30, 90].includes(n), "Choose 7, 14, 30 or 90 days.").default(14) }).strict();

radarRoutes.get("/", (req: Request, res: Response, next: NextFunction) => {
  radarService
    .campaigns(parseQuery(query, req).days)
    .then((result) => sendOk(res, result))
    .catch(next);
});
