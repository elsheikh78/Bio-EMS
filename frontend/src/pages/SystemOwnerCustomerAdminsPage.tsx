import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLocalization } from "../localization/useLocalization";
import { CustomerAdminsPanel } from "../platform-operations/CustomerAdminsPanel";
import { usePlatformOperationsOverview } from "../platform-operations/queries";

const copy = {
  en: {
    title: "Customer ADMIN management",
    subtitle:
      "Create and manage each customer's authorized administrator accounts.",
    back: "Back to owner console",
    customer: "Customer",
    choose: "Choose a customer",
    loading: "Loading customers…",
    loadError: "Customers could not be loaded.",
    retry: "Retry",
    empty: "Create a customer before adding an ADMIN account.",
    customers: "Open customer fleet",
  },
  ar: {
    title: "إدارة حسابات Admin",
    subtitle: "إنشاء وإدارة حسابات المسؤولين المعتمدين لكل عميل.",
    back: "العودة إلى لوحة مالك النظام",
    customer: "العميل",
    choose: "اختر العميل",
    loading: "جارٍ تحميل العملاء…",
    loadError: "تعذر تحميل بيانات العملاء.",
    retry: "إعادة المحاولة",
    empty: "أنشئ العميل أولًا قبل إضافة حساب Admin.",
    customers: "فتح العملاء والمواقع",
  },
} as const;

export function SystemOwnerCustomerAdminsPage() {
  const { language } = useLocalization();
  const text = copy[language];
  const overview = usePlatformOperationsOverview();
  const [customerId, setCustomerId] = useState<number | "">("");

  if (overview.isPending) {
    return (
      <Box
        component="main"
        sx={{ display: "grid", minHeight: "100vh", placeItems: "center" }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>{text.loading}</Typography>
        </Box>
      </Box>
    );
  }

  if (overview.isError || !overview.data) {
    return (
      <Container component="main" maxWidth="md" sx={{ py: 4 }}>
        <Alert
          severity="error"
          action={
            <Button onClick={() => void overview.refetch()}>
              {text.retry}
            </Button>
          }
        >
          {text.loadError}
        </Alert>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
      <Button component={Link} to="/system-owner" sx={{ mb: 2 }}>
        {text.back}
      </Button>
      <Typography component="h1" variant="h4">
        {text.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {text.subtitle}
      </Typography>

      {overview.data.customers.length === 0 ? (
        <Alert
          severity="info"
          action={
            <Button component={Link} to="/system-owner/customers">
              {text.customers}
            </Button>
          }
        >
          {text.empty}
        </Alert>
      ) : (
        <>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="customer-admin-customer-label">
              {text.customer}
            </InputLabel>
            <Select
              labelId="customer-admin-customer-label"
              label={text.customer}
              value={customerId}
              onChange={(event) => setCustomerId(Number(event.target.value))}
            >
              <MenuItem value="" disabled>
                {text.choose}
              </MenuItem>
              {overview.data.customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.code} — {customer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {customerId ? <CustomerAdminsPanel customerId={customerId} /> : null}
        </>
      )}
    </Container>
  );
}
