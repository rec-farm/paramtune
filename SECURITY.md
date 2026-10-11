# Security Policy

## Supported Versions

Security fixes are handled on the `master` branch until the project publishes versioned releases.

## Reporting a Vulnerability

Please do not open public issues for suspected vulnerabilities.

Report security issues privately through GitHub's private vulnerability reporting: https://github.com/rec-farm/paramtune/security/advisories/new

Include:

- A clear description of the issue
- Steps to reproduce
- Affected routes, APIs, or dependencies
- Any known mitigation

## Secrets

Never commit `.env.local`, OAuth credentials, Redis passwords, auth secrets, database files, or production logs. Use `.env.local.example` for placeholder configuration only.
