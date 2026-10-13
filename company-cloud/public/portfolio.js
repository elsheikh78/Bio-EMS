// Revoked enrollments and their licenses remain in the audit data, not the current portfolio.
export function currentPortfolio(state) {
  const sites = state.sites.filter((site) => !site.revoked);
  const ids = new Set(sites.map((site) => site.id));
  return {
    sites,
    licenses: state.licenses.filter((license) => ids.has(license.site_id)),
  };
}
