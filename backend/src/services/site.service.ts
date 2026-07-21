import { SiteRepository, Site } from "../repositories/site.repository";

const repository = new SiteRepository();

export function createSite(site: Site): void {
    repository.create(site);
}

export function getSites(): Site[] {
    return repository.getAll();
}