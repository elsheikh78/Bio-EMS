# ADR-020

## Title

Professional Responsive Frontend Application Shell

## Status

Accepted

## Date

2026-08-11

## Context

S14-01 established the React application, providers, design tokens, localization
contract, and quality gates. S14-02 needs a professional responsive shell and stable
navigation structure before authentication and operational features are introduced.

## Decision

The application uses an `AppShell` route layout with React Router nested routes and an
`Outlet`. Navigation is defined in one presentational registry containing only route
identity, path, localization label key, and visibility. It contains no roles,
permissions, or authorization decisions.

The shell provides a semantic header, desktop persistent navigation, a temporary
tablet/mobile drawer, a skip link, one main landmark, active-route state, and explicit
feature placeholders. The runtime remains English/LTR while all visible shell copy is
served through the replaceable localization resources established in S14-01.

S14-02 performs no Backend API requests and implements no authentication, session,
token storage, protected routes, or not-authorized behavior. Authorization-aware
navigation is deferred in full to S14-03. The `/users` route is therefore absent.

`Monitored Areas` is presentation terminology for the currently implemented Room
contracts only. Assets and Monitoring Points have no implemented Backend contract and
receive no route.

The approved routes are `/`, `/dashboard`, `/monitored-areas`, `/alarms`, `/devices`,
and `/configuration`. `/foundation` redirects to `/`, and unmatched routes render Not
Found inside the shell. Placeholder pages state that their operational feature is not
part of S14-02 and never display fabricated operational or identity data.

Accessibility is part of the shell contract: semantic landmarks, one main region,
keyboard-operable navigation, visible focus, `aria-current`, menu control names,
Escape dismissal, focus restoration, a functional skip link, reduced-motion support,
and a layout that does not overflow at 320 CSS pixels.

## Consequences

- Layout and navigation can be reviewed independently from authentication security.
- S14-03 can introduce principal-aware route protection without replacing the shell.
- Feature routes remain honest placeholders until their consuming stories implement
  the corresponding Backend contracts.
- The frontend has no security authority in S14-02; the Backend remains authoritative.

## Explicit Exclusions

Login, logout, JWT parsing, session storage, authorization, roles, permissions, User
Management, Backend API consumption, Arabic translations, language switching, full
RTL styling, dark mode, Assets, Monitoring Points, deployment, tags, and releases are
outside S14-02.

## References

- `docs/adr/ADR-019-frontend-foundation.md`
- `frontend/src/app/AppShell.tsx`
- `frontend/src/navigation/navigationConfig.ts`
