import { Request, Response } from "express";
import { createSite, getSites } from "../services/site.service";

export function createSiteController(req: Request, res: Response) {

    console.log("===== CREATE SITE =====");
    console.log(req.body);

    createSite(req.body);

    res.status(201).json({
        success: true
    });
}

export function getSitesController(req: Request, res: Response) {

    res.json(getSites());

}