# Company pilot license synchronization

> Documentation review: 2026-10-28. Retained specification/policy; requirements are not proof of implementation. [Current implementation guide](<current/SECURITY-AND-IDENTITY.md>) describes the reviewed source baseline; [Project state](<../PROJECT_STATE.md>) controls current status. [Original pre-audit document](<archive/2026-10-28-pre-audit/docs/COMPANY-PILOT-LICENSE-SYNC.md>) preserves the unmodified earlier text. Claims below retain their original evidence date and do not establish current deployment or acceptance.


Company license records are returned on authenticated agent heartbeats (approximately once per minute), scoped to the enrolled company site. The client validates the response and stores the latest snapshot locally. Renewals replace the snapshot; an empty list clears old records. Network failures preserve the last successful snapshot and its timestamp. Changing company origin/site or disabling the connection clears the snapshot. A generation check prevents an old request from repopulating it after disconnect or reconfiguration.

System Owner > Licenses & installations displays these records under Company licenses — pilot tracking, with their identifiers, status, start/expiry dates, sensor/device limits, and last synchronization time. These records are read-only and separate from signed activation evidence. They do not enable licensing enforcement or change local monitoring.

Deploy both the company Worker and the updated client Setup. Existing central license records require no recreation and are synchronized with the next heartbeat. Before repair/update, obtain a successful backup. Verify the same license ID and dates centrally and locally; renew centrally and verify within two minutes; disconnect and verify the last sync time remains unchanged; reconnect and verify it advances. Changing an enrollment must clear the previous site's records.

Automated validation covers authenticated site isolation, renewal, empty snapshots, persisted client receipt, and existing remote owner authentication. Real Windows update and live synchronization remain deployment acceptance checks.

## Company portal presentation

The company portal uses the existing frontend BIO-EMS horizontal logo and mark copied during the cloud build. Arabic/English switching covers static content, connection/license status, summaries, forms, dates, confirmation messages and activity labels. Language persists locally, and document direction switches RTL/LTR. Switching preserves in-progress form values. Site selectors and license rows show connection status and a short connection ID to distinguish revoked enrollments with the same name. Full connection IDs are available on site cards. This is a company-cloud-only update; existing client Setup does not need rebuilding. Build and redeploy the Worker once, then refresh the portal.
