# BIO-EMS Backend

## Browser Development

The backend and frontend run as separate development processes. Outside production,
the backend CORS default allows exactly `http://localhost:5173`. Configure a different
or production origin with a comma-separated exact allowlist:

```dotenv
BIOEMS_CORS_ALLOWED_ORIGINS=https://ems.example.com
```

Wildcard origins, origins containing paths or credentials, and malformed URLs are
rejected during configuration loading. Production with no value uses an empty
allowlist. Helmet secures JSON API responses; the separate frontend hosting layer is
responsible for the effective frontend Content Security Policy.
