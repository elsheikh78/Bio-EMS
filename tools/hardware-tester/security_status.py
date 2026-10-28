"""Interpret read-only firmware status, without hardware attestation or approval."""
import re


def summarize(text):
    def field(name):
        values = re.findall(r'^\s*' + re.escape(name) + r':\s*(\S+)\s*$', text, re.M)
        return values[0] if len(values) == 1 else None

    uid = field('hardware-uid')
    if not uid or not re.fullmatch(r'[0-9a-fA-F]{12,64}', uid):
        uid = None
    boot = field('secure-boot-enabled')
    encryption = field('flash-encryption-enabled')
    tls = field('tls-identity-validation')
    flags = {
        name: (value == 'true' if value in ('true', 'false') else None)
        for name, value in [('secure_boot', boot), ('flash_encryption', encryption)]
    }
    reported = (uid is not None and flags['secure_boot'] is True
                and flags['flash_encryption'] is True and tls == 'REQUIRED')
    return {
        'hardware_uid': uid,
        'firmware': field('firmware'),
        **flags,
        'tls_identity_required': tls == 'REQUIRED' if tls else None,
        'hardware_controls': ('REPORTED_ENABLED_NOT_ATTESTED' if reported
                              else 'NOT_ENABLED_OR_UNKNOWN'),
        'production_accepted': False,
        'source': 'USB firmware status; verify with controlled ROM/eFuse and manufacturing evidence',
    }
