import type { NextFunction, Request, Response } from "express";
import { sendOk } from "@/lib/http";
import { aiService } from "@/modules/ai/ai.service";

/** Receive, delegate, respond (Rule 2.3). No AI logic lives here. */
export const aiController = {
  async status(_req: Request, res: Response): Promise<void> {
    sendOk(res, await aiService.status());
  },

  async analyseText(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendOk(res, await aiService.analyseText(req.body, req.user?.id), "AI analysis complete.");
    } catch (error) {
      next(error);
    }
  },

  async analyseImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendOk(res, await aiService.analyseImage(req.body, req.user?.id), "AI image analysis complete.");
    } catch (error) {
      next(error);
    }
  },

  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendOk(res, await aiService.chat(req.body, req.user?.id));
    } catch (error) {
      next(error);
    }
  },

  async usage(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendOk(res, await aiService.usage());
    } catch (error) {
      next(error);
    }
  },
};
