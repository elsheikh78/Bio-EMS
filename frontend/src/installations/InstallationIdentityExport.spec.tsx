import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InstallationBuilder } from "./InstallationBuilder";
import { installationIdentityExport } from "./installationIdentityExport";
import type { InstallationContext } from "./contracts";

const context: InstallationContext = {
  installationId: "11111111-1111-4111-8111-111111111111",
  source: "INSTALLER_PROVISIONING_RECEIPT",
  customer: { id: 1, code: "BIO-EGYPT", name: "Bio Egypt" },
  site: {
    id: 2,
    code: "elmanial-001",
    name: "El Manial",
    location: null,
    timezone: null,
  },
};
function show(language: "en" | "ar" = "en") {
  const submit = vi.fn();
  render(
    <InstallationBuilder
      context={context}
      language={language}
      submitting={false}
      onSubmit={submit}
    />,
  );
  return submit;
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("Installation identity customer record", () => {
  it("copies the authoritative host identity without submitting a draft", async () => {
    const writeText = vi
      .fn<(text: string) => Promise<void>>()
      .mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const submit = show();
    fireEvent.click(
      screen.getByRole("button", { name: "Copy installation details" }),
    );
    await screen.findByText("Installation details copied.");
    expect(JSON.parse(writeText.mock.calls[0][0])).toMatchObject({
      installationId: context.installationId,
      customer: context.customer,
      site: { id: 2, code: "elmanial-001", name: "El Manial" },
    });
    expect(submit).not.toHaveBeenCalled();
  });
  it("provides export guidance when clipboard permission is denied", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    show();
    fireEvent.click(
      screen.getByRole("button", { name: "Copy installation details" }),
    );
    await screen.findByText(
      "Could not copy. Use Export installation details instead.",
    );
  });
  it("downloads a JSON record from the Arabic UI with a UUID filename", async () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:identity");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    let downloadName: string | undefined;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadName = this.download;
    });
    const submit = show("ar");
    fireEvent.click(
      screen.getByRole("button", { name: "تصدير بيانات التثبيت" }),
    );
    expect(downloadName).toBe(
      `BIO-EMS-Installation-${context.installationId}.json`,
    );
    expect(document.querySelector("a[download]")).toBeNull();
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(submit).not.toHaveBeenCalled();
    await waitFor(
      () => expect(revokeObjectURL).toHaveBeenCalledWith("blob:identity"),
      { timeout: 2000 },
    );
  });
  it("does not include extra receipt fields or accept malformed identity", () => {
    expect(() =>
      installationIdentityExport({
        ...context,
        secret: "not-for-export",
      } as InstallationContext),
    ).toThrow();
    expect(() =>
      installationIdentityExport({
        ...context,
        installationId: "lifecycle-id",
      }),
    ).toThrow();
    expect(Object.keys(installationIdentityExport(context))).toEqual([
      "schemaVersion",
      "product",
      "exportedAt",
      "installationId",
      "source",
      "customer",
      "site",
    ]);
  });
});
