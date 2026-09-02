import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { installationService } from "../modules/installation/installation.service";

const platformActor = (req:Request) => `${req.platformPrincipal!.username}#${req.platformPrincipal!.id}`;
const installationId = (req:Request) => String(req.params.installationId);
export const listInstallations = asyncHandler(async (req:Request,res:Response)=>res.json(installationService.list(req.query.customerId?Number(req.query.customerId):undefined)));
export const getPlatformInstallation = asyncHandler(async (req:Request,res:Response)=>res.json(installationService.get(installationId(req))));
export const createInstallation = asyncHandler(async (req:Request,res:Response)=>res.status(201).json(installationService.create(Number(req.params.customerId),req.body.snapshot,platformActor(req))));
export const reviseInstallation = asyncHandler(async (req:Request,res:Response)=>res.status(201).json(installationService.revise(installationId(req),req.body.snapshot,req.body.reason,platformActor(req))));
export const validateInstallation = asyncHandler(async (req:Request,res:Response)=>res.json(installationService.validate(installationId(req),platformActor(req))));
export const queueInstallation = asyncHandler(async (req:Request,res:Response)=>res.json(installationService.queue(installationId(req),platformActor(req))));
export const sendInstallation = asyncHandler(async (req:Request,res:Response)=>res.json(installationService.send(installationId(req),platformActor(req))));
export const receiveInstallation = asyncHandler(async (req:Request,res:Response)=>res.json(installationService.receipt(installationId(req),req.body)));
export const technicalInstallationDecision = asyncHandler(async (req:Request,res:Response)=>res.json(installationService.technicalDecision(installationId(req),req.body.decision,req.body.note,platformActor(req))));
export const getCustomerInstallation = asyncHandler(async (req:Request,res:Response)=>res.json(installationService.getForCustomerUser(installationId(req),req.user!.id)));
export const customerInstallationDecision = asyncHandler(async (req:Request,res:Response)=>res.json(installationService.customerDecision(installationId(req),req.user!.id,req.body.decision,req.body.note)));
