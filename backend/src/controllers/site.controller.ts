import { Request, Response } from "express";
import { createSite, getSites } from "../services/site.service";

export function createSiteController(req: Request, res: Response) {

    
    const siteId = createSite(req.body);

res.status(201).json({
    success: true,
    id: siteId
});
}

export function getSitesController(req: Request, res: Response) {

    res.json(getSites());

}