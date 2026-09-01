import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { Link, useParams } from "react-router-dom";
import { ApiResponseError } from "../api/client";
import { useLocalization } from "../localization/useLocalization";
import {
  useCreatePlatformCustomer,
  usePlatformOperationsOverview,
} from "../platform-operations/queries";

const copy = {
  en: {
    title: "Customer fleet",
    subtitle: "SYSTEM_OWNER customer and installation identity",
    back: "Back to owner console",
    create: "Add customer",
    loading: "Loading customer fleet…",
    loadError: "Customer fleet could not be loaded.",
    retry: "Retry",
    empty: "No platform customers have been recorded yet.",
    code: "Code",
    name: "Name",
    status: "Status",
    createdAt: "Created",
    details: "Details",
    createdBy: "Recorded by",
    linkedSites: "Linked Sites / installations",
    noSites: "No Site binding is currently recorded for this customer.",
    evidence: "Commercial provenance",
    noEvidence: "No customer provenance event is available.",
    relatedLicenses: "Related licenses",
    relatedService: "Related service records",
    cancel: "Cancel",
    save: "Create customer",
    createTitle: "Create platform customer",
    createFailed: "Customer could not be created.",
    duplicate: "Customer code may already exist.",
    missing: "Customer was not found in the current fleet overview.",
    readOnly:
      "Customer lifecycle updates are not exposed because the current backend contract authorizes customer creation only.",
  },
  ar: {
    title: "العملاء والمواقع",
    subtitle: "هوية العملاء والتركيبات لمستوى مالك النظام",
    back: "العودة إلى لوحة مالك النظام",
    create: "إضافة عميل",
    loading: "جارٍ تحميل العملاء…",
    loadError: "تعذر تحميل بيانات العملاء.",
    retry: "إعادة المحاولة",
    empty: "لم يتم تسجيل عملاء على المنصة حتى الآن.",
    code: "الكود",
    name: "الاسم",
    status: "الحالة",
    createdAt: "تاريخ التسجيل",
    details: "التفاصيل",
    createdBy: "سُجل بواسطة",
    linkedSites: "المواقع / التركيبات المرتبطة",
    noSites: "لا يوجد ربط بموقع مسجل لهذا العميل حالياً.",
    evidence: "دليل المصدر التجاري",
    noEvidence: "لا يوجد حدث مصدر خاص بالعميل متاح حالياً.",
    relatedLicenses: "التراخيص المرتبطة",
    relatedService: "سجلات الخدمة المرتبطة",
    cancel: "إلغاء",
    save: "إنشاء العميل",
    createTitle: "إنشاء عميل على المنصة",
    createFailed: "تعذر إنشاء العميل.",
    duplicate: "قد يكون كود العميل مستخدماً بالفعل.",
    missing: "العميل غير موجود في بيانات الأسطول الحالية.",
    readOnly:
      "تعديل دورة حياة العميل غير معروض لأن عقد الـbackend الحالي يصرح بإنشاء العميل فقط.",
  },
} as const;

const statusValues = ["ACTIVE", "SUSPENDED", "CLOSED"] as const;

export function SystemOwnerCustomerFleetPage() {
  const { language } = useLocalization();
  const text = copy[language];
  const { customerId } = useParams();
  const overview = usePlatformOperationsOverview();
  const createCustomer = useCreatePlatformCustomer();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<(typeof statusValues)[number]>("ACTIVE");
  const [createError, setCreateError] = useState<string>();

  const selectedId = customerId ? Number(customerId) : undefined;
  const selected = overview.data?.customers.find((item) => item.id === selectedId);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setCreateError(undefined);
    try {
      await createCustomer.mutateAsync({
        code: code.trim(),
        name: name.trim(),
        status,
        createdAt: new Date().toISOString(),
      });
      setCode("");
      setName("");
      setStatus("ACTIVE");
      setDialogOpen(false);
    } catch (error) {
      setCreateError(
        error instanceof ApiResponseError && error.status === 500
          ? text.duplicate
          : text.createFailed,
      );
    }
  };

  if (overview.isPending) {
    return (
      <Box component="main" sx={{ display: "grid", minHeight: "100vh", placeItems: "center" }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>{text.loading}</Typography>
        </Box>
      </Box>
    );
  }

  if (overview.isError || !overview.data) {
    return (
      <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
        <Alert
          severity="error"
          action={<Button onClick={() => void overview.refetch()}>{text.retry}</Button>}
        >
          {text.loadError}
        </Alert>
      </Container>
    );
  }

  const data = overview.data;
  const relatedLicenseSiteIds = data.licenses
    .filter((license) => license.customerId === selected?.id && license.siteId !== null)
    .map((license) => license.siteId);
  const relatedServiceSiteIds = data.serviceEvents
    .filter((event) => event.customerId === selected?.id && event.siteId !== null)
    .map((event) => event.siteId);
  const linkedSiteIds = new Set([...relatedLicenseSiteIds, ...relatedServiceSiteIds]);
  const linkedSites = data.sites.filter((site) => linkedSiteIds.has(site.id));
  const customerEvidence = selected
    ? data.commercialEvents.filter(
        (event) => event.entityType === "CUSTOMER" && event.entityId === selected.id,
      )
    : [];

  return (
    <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
      <Button component={Link} to="/system-owner" sx={{ mb: 2 }}>
        {text.back}
      </Button>
      <Box sx={{ alignItems: "center", display: "flex", gap: 2, mb: 3 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography component="h1" variant="h4">
            {text.title}
          </Typography>
          <Typography color="text.secondary">{text.subtitle}</Typography>
        </Box>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          {text.create}
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        {text.readOnly}
      </Alert>

      {customerId ? (
        selected ? (
          <Box sx={{ display: "grid", gap: 2 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography component="h2" variant="h5">
                  {selected.name}
                </Typography>
                <Typography>{`${text.code}: ${selected.code}`}</Typography>
                <Typography>{`${text.status}: ${selected.status}`}</Typography>
                <Typography>{`${text.createdAt}: ${selected.createdAt}`}</Typography>
                <Typography>{`${text.createdBy}: ${selected.createdBy}`}</Typography>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent>
                <Typography component="h2" variant="h6" sx={{ mb: 1 }}>
                  {text.linkedSites}
                </Typography>
                {linkedSites.length === 0 ? (
                  <Typography color="text.secondary">{text.noSites}</Typography>
                ) : (
                  linkedSites.map((site) => (
                    <Typography key={site.id}>
                      {site.code} — {site.name}
                      {site.location ? ` — ${site.location}` : ""}
                    </Typography>
                  ))
                )}
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent>
                <Typography component="h2" variant="h6">
                  {text.relatedLicenses}: {data.licenses.filter((item) => item.customerId === selected.id).length}
                </Typography>
                <Typography component="h2" variant="h6">
                  {text.relatedService}: {data.serviceEvents.filter((item) => item.customerId === selected.id).length}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent>
                <Typography component="h2" variant="h6" sx={{ mb: 1 }}>
                  {text.evidence}
                </Typography>
                {customerEvidence.length === 0 ? (
                  <Typography color="text.secondary">{text.noEvidence}</Typography>
                ) : (
                  customerEvidence.map((event) => (
                    <Typography key={event.id}>
                      {event.eventType} — {event.occurredAt} — {event.actorIdentity}
                    </Typography>
                  ))
                )}
              </CardContent>
            </Card>
          </Box>
        ) : (
          <Alert severity="warning">{text.missing}</Alert>
        )
      ) : data.customers.length === 0 ? (
        <Alert severity="info">{text.empty}</Alert>
      ) : (
        <TableContainer component={Card} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{text.code}</TableCell>
                <TableCell>{text.name}</TableCell>
                <TableCell>{text.status}</TableCell>
                <TableCell>{text.createdAt}</TableCell>
                <TableCell>{text.details}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.code}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.status}</TableCell>
                  <TableCell>{customer.createdAt}</TableCell>
                  <TableCell>
                    <Button component={Link} to={`/system-owner/customers/${customer.id}`}>
                      {text.details}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={(event) => void submit(event)}>
          <DialogTitle>{text.createTitle}</DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
            {createError ? <Alert severity="error">{createError}</Alert> : null}
            <TextField
              required
              label={text.code}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputProps={{ maxLength: 64 }}
            />
            <TextField
              required
              label={text.name}
              value={name}
              onChange={(event) => setName(event.target.value)}
              inputProps={{ maxLength: 200 }}
            />
            <FormControl required>
              <InputLabel id="platform-customer-status-label">{text.status}</InputLabel>
              <Select
                labelId="platform-customer-status-label"
                label={text.status}
                value={status}
                onChange={(event) => setStatus(event.target.value as (typeof statusValues)[number])}
              >
                {statusValues.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>{text.cancel}</Button>
            <Button type="submit" variant="contained" disabled={createCustomer.isPending}>
              {text.save}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Container>
  );
}
