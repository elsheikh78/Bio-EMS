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
    addLicense: "Record license",
    addService: "Record service obligation",
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
    licenseBoundary:
      "A recorded Site binding is not evidence of physical installation or commissioning. License state does not represent billing or payment settlement.",
    updateBoundary:
      "Eligibility records authorize access only; they do not execute or prove a remote update.",
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
    addLicense: "تسجيل ترخيص",
    addService: "تسجيل التزام خدمة",
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
    licenseBoundary:
      "ربط الموقع المسجل ليس دليلاً على التركيب الفعلي أو التكليف. حالة الترخيص لا تمثل الفوترة أو سداد المدفوعات.",
    updateBoundary:
      "سجل الاستحقاق يحدد الأهلية فقط؛ ولا ينفذ أو يثبت تحديثاً عن بُعد.",
    serviceBoundary:
      "هذه التزامات على مستوى المنصة. الإكمال يحتاج دليلاً ميدانياً/خدمياً حقيقياً ولا تنشئ هذه الشاشة دليلاً مصطنعاً.",
  },
} as const;

const isoOrNull = (value: string) =>
  value ? new Date(value).toISOString() : null;

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
  const [status, setStatus] = useState("ACTIVE");
  const [entitlement, setEntitlement] = useState("NONE");
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
  const submitLicense = async (event: FormEvent) => {
    event.preventDefault();
    await createLicense.mutateAsync({
      customerId: Number(customerId),
      siteId: siteId ? Number(siteId) : null,
      licenseKeyReference: reference,
      edition,
      status: status as "ACTIVE",
      startsAt: new Date().toISOString(),
      expiresAt: null,
      updateEntitlement: entitlement as "NONE",
      recordedAt: new Date().toISOString(),
    });
    setReference("");
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
      {section === "licenses" || section === "updates" ? (
        <>
          {section === "licenses" && (
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography component="h2" variant="h6">
                  {text.addLicense}
                </Typography>
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
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{text.reference}</TableCell>
                  <TableCell>{text.customer}</TableCell>
                  <TableCell>{text.site}</TableCell>
                  <TableCell>{text.status}</TableCell>
                  <TableCell>{text.entitlement}</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.licenses.map((x) => (
                  <TableRow key={x.id}>
                    <TableCell>{x.licenseKeyReference}</TableCell>
                    <TableCell>{customerName(x.customerId)}</TableCell>
                    <TableCell>{siteName(x.siteId)}</TableCell>
                    <TableCell>{x.status}</TableCell>
                    <TableCell>{x.updateEntitlement}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() =>
                          void updateLicense.mutateAsync({
                            id: x.id,
                            siteId: x.siteId,
                            status: x.status,
                            expiresAt: x.expiresAt,
                            updateEntitlement:
                              section === "updates"
                                ? x.updateEntitlement === "NONE"
                                  ? "FREE"
                                  : "NONE"
                                : x.updateEntitlement,
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
          )}
        </>
      )}
    </Container>
  );
}
