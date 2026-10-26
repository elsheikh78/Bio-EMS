export const COMPANY_ORIGIN = "https://bioems-company.bioems-egypt.workers.dev";
export const COMPANY_HOME = `${COMPANY_ORIGIN}/`;

// Never pass an untrusted URL to WebView or the operating system's link handler.
export function isCompanyUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.origin === COMPANY_ORIGIN && !url.username && !url.password;
  } catch {
    return false;
  }
}

export const HOME_SCRIPT = `window.location.assign(${JSON.stringify(COMPANY_HOME)});true;`;

export function isDocumentFailure(
  documentUrl: string,
  requestUrl: string,
  status: number,
): boolean {
  if (status < 400 || !isCompanyUrl(requestUrl)) return false;
  try {
    const document = new URL(documentUrl);
    const request = new URL(requestUrl);
    document.hash = "";
    request.hash = "";
    return document.href === request.href;
  } catch {
    return false;
  }
}
