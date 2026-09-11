import { Router } from "express";
import { prisma } from "@/lib/prisma";
import { sendOk } from "@/lib/http";

export const referenceRoutes = Router();

/**
 * FR69 categories and the municipality's suburbs, for the report form's
 * pickers. One request for both, since the form needs both before it can
 * render, and public and cacheable because neither says anything about anyone.
 */
referenceRoutes.get("/", async (_req, res, next) => {
  try {
    const [categories, suburbs] = await Promise.all([
      prisma.scamCategory.findMany({
        where: { archivedAt: null },
        select: { id: true, slug: true, name: true, description: true },
        orderBy: { name: "asc" },
      }),
      prisma.suburb.findMany({
        select: { id: true, name: true, postcode: true },
        orderBy: { name: "asc" },
      }),
    ]);

    res.setHeader("Cache-Control", "public, max-age=3600");
    sendOk(res, { categories, suburbs });
  } catch (error) {
    next(error);
  }
});
