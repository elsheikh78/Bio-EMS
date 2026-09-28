import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLocalization } from "../localization/useLocalization";
import {
  useCreatePlatformLicense,
  useCreatePlatformService,
  usePlatformOperationsOverview,
  useUpdatePlatformLicense,
  useUpdatePlatformService,
} from "../platform-operations/queries";

const copy = {
  en: {
    back: "Back to owner console",
    licenses: "Licenses & installation bindings",
    updates: "Update entitlements",
    service: "Maintenance, calibration & support",
    loading: "Loading commercial operations…",
    error: "Commercial operations could not be loaded.",
    retry: "Retry",
    empty: "No records have been recorded yet.",
    addLicense: "Record commercial license",
    addService: "Record service obligation",
    commercialRecordHelp:
      "Commercial license records describe customer/Site entitlement. Signed Site-bound licenses are issued separately through the controlled activation workflow.",
    signedEvidenceTitle: "Signed Site-bound licensing evidence",
    signedLicensesTitle: "Effective signed licenses",
    noSignedLicenses: "No signed Site-bound licenses have been activated.",
    activationRequestsTitle: "Activation requests",
    certificatesTitle: "Signed certificates",
    noActivationRequests: "No activation requests have been recorded.",
    noCertificates: "No signed certificates have been issued.",
    signingBoundary:
      "Activation approval and Ed25519 signing remain manufacturer-controlled. This customer-host screen displays evidence only and never receives the private signing key.",
    saveChanges: "Save changes",
    never: "No expiry",
    commercialAuditTitle: "Recent commercial license audit",
    customer: "Customer",
    site: "Recorded Site binding",
    unbound: "Not bound",
    reference: "Reference",
    edition: "Edition",
    status: "Status",
    starts: "Starts",
    expires: "Expires",
    entitlement: "Entitlement",
    type: "Type",
    due: "Due",
    note: "Note",
    save: "Save",
    update: "Update",
    siteBoundTitle: "Site-bound licensing governance",
    installationsCount: "Installations",
    certificatesCount: "Licenses",
    devicesCount: "Authorized devices",
    auditTitle: "Recent licensing audit",
    licenseBoundary:
      "A recorded Site binding is not evidence of physical installation or commissioning. License state does not represent billing or payment settlement.",
    updateBoundary:
      "Eligibility records authorize access only; they do not execute or prove a remote update. Changing this commercial record never rewrites an immutable signed Site-bound certificate; changed signed entitlement requires controlled re-issuance.",
    serviceBoundary:
      "These are platform obligations. Completion must be backed by genuine field/service evidence; this screen does not fabricate it.",
  },
  ar: {
    back: "العودة إلى لوحة مالك النظام",
    licenses: "التراخيص وربط التركيبات",
    updates: "استحقاقات التحديث",
    service: "الصيانة والمعايرة والدعم",
    loading: "جارٍ تحميل العمليات التجارية…",
    error: "تعذر تحميل العمليات التجارية.",
    retry: "إعادة المحاولة",
    empty: "لا توجد سجلات حتى الآن.",
    addLicense: "تسجيل ترخيص تجاري",
    addService: "تسجيل التزام خدمة",
    commercialRecordHelp:
      "سجل الترخيص التجاري يحدد استحقاق العميل/الموقع. أما الترخيص الموقّع المرتبط بالموقع فيصدر منفصلاً من خلال مسار التفعيل المحكوم.",
    signedEvidenceTitle: "أدلة الترخيص الموقّع المرتبط بالموقع",
    signedLicensesTitle: "التراخيص الموقعة الفعالة",
    noSignedLicenses: "لا توجد تراخيص موقعة مرتبطة بالموقع تم تفعيلها.",
    activationRequestsTitle: "طلبات التفعيل",
    certificatesTitle: "الشهادات الموقعة",
    noActivationRequests: "لا توجد طلبات تفعيل مسجلة.",
    noCertificates: "لم يتم إصدار شهادات موقعة.",
    signingBoundary:
      "تظل الموافقة على التفعيل وتوقيع Ed25519 تحت سيطرة الشركة/المصنع. تعرض هذه الشاشة على جهاز العميل الأدلة فقط ولا تستقبل المفتاح الخاص بالتوقيع.",
    saveChanges: "حفظ التغييرات",
    never: "بدون تاريخ انتهاء",
    commercialAuditTitle: "أحدث تدقيق للترخيص التجاري",
    customer: "العميل",
    site: "ربط الموقع المسجل",
    unbound: "غير مرتبط",
    reference: "المرجع",
    edition: "الإصدار",
    status: "الحالة",
    starts: "البداية",
    expires: "الانتهاء",
    entitlement: "الاستحقاق",
    type: "النوع",
    due: "موعد الاستحقاق",
    note: "ملاحظة",
    save: "حفظ",
    update: "تحديث",
    siteBoundTitle: "حوكمة التراخيص المرتبطة بالموقع",
    installationsCount: "التركيبات",
    certificatesCount: "التراخيص",
    devicesCount: "الأجهزة المعتمدة",
    auditTitle: "أحدث سجل تدقيق للتراخيص",
    licenseBoundary:
      "ربط الموقع المسجل ليس دليلاً على التركيب الفعلي أو التكليف. حالة الترخيص لا تمثل الفوترة أو سداد المدفوعات.",
    updateBoundary:
      "سجل الاستحقاق يحدد الأهلية فقط؛ ولا ينفذ أو يثبت تحديثاً عن بُعد. تغيير هذا السجل التجاري لا يعيد كتابة شهادة الترخيص الموقعة غير القابلة للتعديل؛ تغيير الاستحقاق الموقّع يحتاج إعادة إصدار محكومة.",
    serviceBoundary:
      "هذه التزامات على مستوى المنصة. الإكمال يحتاج دليلاً ميدانياً/خدمياً حقيقياً ولا تنشئ هذه الشاشة دليلاً مصطنعاً.",
  },
} as const;

const isoOrNull = (value: string) =>
  value ? new Date(value).toISOString() : null;

type LicenseStatus = "ACTIVE" | "SUSPENDED" | "EXPIRED" | "REVOKED";
type UpdateEntitlement = "NONE" | "FREE" | "PAID";
type LicenseDraft = {
  status: LicenseStatus;
  updateEntitlement: UpdateEntitlement;
  expiresAt: string;
};

const localDateTimeValue = (value: string | null) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";

export function SystemOwnerCommercialOperationsPage() {
  const { language } = useLocalization();
  const text = copy[language];
  const section = useLocation().pathname.split("/").at(-1) as
    "licenses" | "updates" | "service";
  const overview = usePlatformOperationsOverview();
  const createLicense = useCreatePlatformLicense();
  const updateLicense = useUpdatePlatformLicense();
  const createService = useCreatePlatformService();
  const updateService = useUpdatePlatformService();
  const [customerId, setCustomerId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [reference, setReference] = useState("");
  const [edition, setEdition] = useState("STANDARD");
  const [status, setStatus] = useState<LicenseStatus>("ACTIVE");
  const [entitlement, setEntitlement] = useState<UpdateEntitlement>("NONE");
  const [expiresAt, setExpiresAt] = useState("");
  const [licenseDrafts, setLicenseDrafts] = useState<
    Record<number, LicenseDraft>
  >({});
  const [eventType, setEventType] = useState("MAINTENANCE");
  const [dueAt, setDueAt] = useState("");
  const [note, setNote] = useState("");
  if (overview.isPending)
    return (
      <Box
        component="main"
        sx={{ display: "grid", minHeight: "100vh", placeItems: "center" }}
      >
        <CircularProgress aria-label={text.loading} />
      </Box>
    );
  if (overview.isError || !overview.data)
    return (
      <Container component="main" sx={{ py: 4 }}>
        <Alert
          severity="error"
          action={
            <Button onClick={() => void overview.refetch()}>
              {text.retry}
            </Button>
          }
        >
          {text.error}
        </Alert>
      </Container>
    );
  const data = overview.data;
  const customerName = (id: number) =>
    data.customers.find((x) => x.id === id)?.name ?? `#${id}`;
  const siteName = (id: number | null) =>
    id ? (data.sites.find((x) => x.id === id)?.name ?? `#${id}`) : text.unbound;
  const licenseDraft = (
    license: (typeof data.licenses)[number],
  ): LicenseDraft =>
    licenseDrafts[license.id] ?? {
      status: license.status,
      updateEntitlement: license.updateEntitlement,
      expiresAt: localDateTimeValue(license.expiresAt),
    };
  const patchLicenseDraft = (
    license: (typeof data.licenses)[number],
    patch: Partial<LicenseDraft>,
  ) =>
    setLicenseDrafts((current) => ({
      ...current,
      [license.id]: {
        ...(current[license.id] ?? {
          status: license.status,
          updateEntitlement: license.updateEntitlement,
          expiresAt: localDateTimeValue(license.expiresAt),
        }),
        ...patch,
      },
    }));
  const submitLicense = async (event: FormEvent) => {
    event.preventDefault();
    await createLicense.mutateAsync({
      customerId: Number(customerId),
      siteId: siteId ? Number(siteId) : null,
      licenseKeyReference: reference,
      edition,
      status,
      startsAt: new Date().toISOString(),
      expiresAt: isoOrNull(expiresAt),
      updateEntitlement: entitlement,
      recordedAt: new Date().toISOString(),
    });
    setReference("");
    setExpiresAt("");
  };
  const submitService = async (event: FormEvent) => {
    event.preventDefault();
    await createService.mutateAsync({
      customerId: Number(customerId),
      siteId: siteId ? Number(siteId) : null,
      eventType: eventType as "MAINTENANCE",
      dueAt: isoOrNull(dueAt),
      status: "OPEN",
      reference,
      note: note || null,
      recordedAt: new Date().toISOString(),
    });
    setReference("");
  };
  const title = text[section];
  const boundary =
    section === "licenses"
      ? text.licenseBoundary
      : section === "updates"
        ? text.updateBoundary
        : text.serviceBoundary;
  return (
    <Container component="main" maxWidth="xl" sx={{ py: 4 }}>
      <Button component={Link} to="/system-owner" sx={{ mb: 2 }}>
        {text.back}
      </Button>
      <Typography component="h1" variant="h4">
        {title}
      </Typography>
      <Alert severity="info" sx={{ my: 2 }}>
        {boundary}
      </Alert>
      {(section === "licenses" || section === "updates") && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography component="h2" variant="h6" gutterBottom>
              {text.siteBoundTitle}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {text.signedEvidenceTitle}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" },
              }}
            >
              <Typography>
                {text.installationsCount}:{" "}
                <strong>{data.siteBoundLicensing.installations.length}</strong>
              </Typography>
              <Typography>
                {text.certificatesCount}:{" "}
                <strong>{data.siteBoundLicensing.licenses.length}</strong>
              </Typography>
              <Typography>
                {text.devicesCount}:{" "}
                <strong>
                  {
                    data.siteBoundLicensing.devices.filter(
                      (item) => item.status === "AUTHORIZED",
                    ).length
                  }
                </strong>
              </Typography>
            </Box>
            <Typography component="h3" variant="subtitle1" sx={{ mt: 2 }}>
              {text.signedLicensesTitle}
            </Typography>
            {data.siteBoundLicensing.licenses.length === 0 ? (
              <Typography variant="body2">{text.noSignedLicenses}</Typography>
            ) : (
              data.siteBoundLicensing.licenses.slice(0, 10).map((license) => (
                <Typography key={license.id} variant="body2">
                  {license.licenseId} · {license.licenseType} · {license.status}{" "}
                  · {license.updateEntitlement} ·{" "}
                  {license.expiresAt
                    ? new Date(license.expiresAt).toLocaleString(language)
                    : text.never}
                </Typography>
              ))
            )}
            <Alert severity="info" sx={{ mt: 2 }}>
              {text.signingBoundary}
            </Alert>
            <Typography component="h3" variant="subtitle1" sx={{ mt: 2 }}>
              {text.activationRequestsTitle}
            </Typography>
            {data.siteBoundLicensing.activationRequests.length === 0 ? (
              <Typography variant="body2">
                {text.noActivationRequests}
              </Typography>
            ) : (
              data.siteBoundLicensing.activationRequests
                .slice(0, 5)
                .map((request) => (
                  <Typography key={request.id} variant="body2">
                    {request.requestId} · {request.status} ·{" "}
                    {new Date(request.requestedAt).toLocaleString(language)}
                  </Typography>
                ))
            )}
            <Typography component="h3" variant="subtitle1" sx={{ mt: 2 }}>
              {text.certificatesTitle}
            </Typography>
            {data.siteBoundLicensing.certificates.length === 0 ? (
              <Typography variant="body2">{text.noCertificates}</Typography>
            ) : (
              data.siteBoundLicensing.certificates
                .slice(0, 5)
                .map((certificate) => (
                  <Typography key={certificate.id} variant="body2">
                    License #{certificate.licenseDatabaseId} ·{" "}
                    {certificate.algorithm} · {certificate.keyId} · SHA-256{" "}
                    {certificate.certificateSha256.slice(0, 16)}… ·{" "}
                    {new Date(certificate.issuedAt).toLocaleString(language)}
                  </Typography>
                ))
            )}
            <Typography component="h3" variant="subtitle1" sx={{ mt: 2 }}>
              {text.auditTitle}
            </Typography>
            {data.siteBoundLicensing.events.slice(0, 5).map((event) => (
              <Typography key={event.id} variant="body2">
                {event.eventType} · {event.actorIdentity} ·{" "}
                {new Date(event.occurredAt).toLocaleString(language)}
              </Typography>
            ))}
          </CardContent>
        </Card>
      )}
      {section === "licenses" || section === "updates" ? (
        <>
          {section === "licenses" && (
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography component="h2" variant="h6">
                  {text.addLicense}
                </Typography>
                <Alert severity="info" sx={{ mt: 2 }}>
                  {text.commercialRecordHelp}
                </Alert>
                <Box
                  component="form"
                  onSubmit={(e) => void submitLicense(e)}
                  sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" },
                    mt: 2,
                  }}
                >
                  <FormControl required>
                    <InputLabel>{text.customer}</InputLabel>
                    <Select
                      label={text.customer}
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                    >
                      {data.customers.map((x) => (
                        <MenuItem key={x.id} value={String(x.id)}>
                          {x.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <InputLabel>{text.site}</InputLabel>
                    <Select
                      label={text.site}
                      value={siteId}
                      onChange={(e) => setSiteId(e.target.value)}
                    >
                      <MenuItem value="">{text.unbound}</MenuItem>
                      {data.sites.map((x) => (
                        <MenuItem key={x.id} value={String(x.id)}>
                          {x.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    required
                    label={text.reference}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                  <TextField
                    required
                    label={text.edition}
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                  />
                  <FormControl>
                    <InputLabel>{text.status}</InputLabel>
                    <Select
                      label={text.status}
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      {["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED"].map(
                        (x) => (
                          <MenuItem key={x} value={x}>
                            {x}
                          </MenuItem>
                        ),
                      )}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <InputLabel>{text.entitlement}</InputLabel>
                    <Select
                      label={text.entitlement}
                      value={entitlement}
                      onChange={(e) => setEntitlement(e.target.value)}
                    >
                      {["NONE", "FREE", "PAID"].map((x) => (
                        <MenuItem key={x} value={x}>
                          {x}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label={text.expires}
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <Button type="submit" variant="contained">
                    {text.save}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
          {data.licenses.length === 0 ? (
            <Typography>{text.empty}</Typography>
          ) : (
            <>
              <TableContainer component={Card} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{text.reference}</TableCell>
                      <TableCell>{text.customer}</TableCell>
                      <TableCell>{text.site}</TableCell>
                      <TableCell>{text.starts}</TableCell>
                      <TableCell>{text.status}</TableCell>
                      <TableCell>{text.expires}</TableCell>
                      <TableCell>{text.entitlement}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.licenses.map((x) => {
                      const draft = licenseDraft(x);
                      return (
                        <TableRow key={x.id}>
                          <TableCell>{x.licenseKeyReference}</TableCell>
                          <TableCell>{customerName(x.customerId)}</TableCell>
                          <TableCell>{siteName(x.siteId)}</TableCell>
                          <TableCell>
                            {new Date(x.startsAt).toLocaleString(language)}
                          </TableCell>
                          <TableCell>
                            {section === "licenses" ? (
                              <Select
                                size="small"
                                value={draft.status}
                                onChange={(event) =>
                                  patchLicenseDraft(x, {
                                    status: event.target.value,
                                  })
                                }
                              >
                                {[
                                  "ACTIVE",
                                  "SUSPENDED",
                                  "EXPIRED",
                                  "REVOKED",
                                ].map((value) => (
                                  <MenuItem key={value} value={value}>
                                    {value}
                                  </MenuItem>
                                ))}
                              </Select>
                            ) : (
                              x.status
                            )}
                          </TableCell>
                          <TableCell>
                            {section === "licenses" ? (
                              <TextField
                                size="small"
                                type="datetime-local"
                                value={draft.expiresAt}
                                onChange={(event) =>
                                  patchLicenseDraft(x, {
                                    expiresAt: event.target.value,
                                  })
                                }
                                slotProps={{ inputLabel: { shrink: true } }}
                              />
                            ) : x.expiresAt ? (
                              new Date(x.expiresAt).toLocaleString(language)
                            ) : (
                              text.never
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              size="small"
                              value={draft.updateEntitlement}
                              onChange={(event) =>
                                patchLicenseDraft(x, {
                                  updateEntitlement: event.target.value,
                                })
                              }
                            >
                              {["NONE", "FREE", "PAID"].map((value) => (
                                <MenuItem key={value} value={value}>
                                  {value}
                                </MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              disabled={updateLicense.isPending}
                              onClick={() =>
                                void updateLicense
                                  .mutateAsync({
                                    id: x.id,
                                    siteId: x.siteId,
                                    status: draft.status,
                                    expiresAt: isoOrNull(draft.expiresAt),
                                    updateEntitlement: draft.updateEntitlement,
                                  })
                                  .then(() =>
                                    setLicenseDrafts((current) => {
                                      const next = { ...current };
                                      delete next[x.id];
                                      return next;
                                    }),
                                  )
                              }
                            >
                              {text.saveChanges}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography component="h2" variant="h6" sx={{ mt: 3 }}>
                {text.commercialAuditTitle}
              </Typography>
              {data.commercialEvents
                .filter((event) => event.entityType === "LICENSE")
                .slice(0, 5)
                .map((event) => (
                  <Typography key={event.id} variant="body2">
                    {event.eventType} · {event.actorIdentity} ·{" "}
                    {new Date(event.occurredAt).toLocaleString(language)}
                  </Typography>
                ))}
            </>
          )}
        </>
      ) : (
        <>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography component="h2" variant="h6">
                {text.addService}
              </Typography>
              <Box
                component="form"
                onSubmit={(e) => void submitService(e)}
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" },
                  mt: 2,
                }}
              >
                <FormControl required>
                  <InputLabel>{text.customer}</InputLabel>
                  <Select
                    label={text.customer}
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                  >
                    {data.customers.map((x) => (
                      <MenuItem key={x.id} value={String(x.id)}>
                        {x.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <InputLabel>{text.type}</InputLabel>
                  <Select
                    label={text.type}
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                  >
                    {["MAINTENANCE", "CALIBRATION", "SUPPORT", "UPDATE"].map(
                      (x) => (
                        <MenuItem key={x} value={x}>
                          {x}
                        </MenuItem>
                      ),
                    )}
                  </Select>
                </FormControl>
                <TextField
                  required
                  label={text.reference}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
                <TextField
                  label={text.due}
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label={text.note}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <Button type="submit" variant="contained">
                  {text.save}
                </Button>
              </Box>
            </CardContent>
          </Card>
          {data.serviceEvents.length === 0 ? (
            <Typography>{text.empty}</Typography>
          ) : (
            <TableContainer component={Card} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{text.reference}</TableCell>
                    <TableCell>{text.customer}</TableCell>
                    <TableCell>{text.type}</TableCell>
                    <TableCell>{text.due}</TableCell>
                    <TableCell>{text.status}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.serviceEvents.map((x) => (
                    <TableRow key={x.id}>
                      <TableCell>{x.reference}</TableCell>
                      <TableCell>{customerName(x.customerId)}</TableCell>
                      <TableCell>{x.eventType}</TableCell>
                      <TableCell>{x.dueAt ?? "—"}</TableCell>
                      <TableCell>{x.status}</TableCell>
                      <TableCell>
                        <Button
                          disabled={x.status === "COMPLETE"}
                          onClick={() =>
                            void updateService.mutateAsync({
                              id: x.id,
                              dueAt: x.dueAt,
                              status: "COMPLETE",
                              note: x.note,
                            })
                          }
                        >
                          {text.update}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Container>
  );
}
