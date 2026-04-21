# Security Policy

## Supported Versions

Security fixes are handled on the `master` branch until the project publishes versioned releases.

## Reporting a Vulnerability

Please do not open public issues for suspected vulnerabilities.

Report security issues privately through GitHub's private vulnerability reporting if it is enabled on the repository. If that is unavailable, contact the maintainer through the GitHub profile linked from the repository.

Include:

- A clear description of the issue
- Steps to reproduce
- Affected routes, APIs, or dependencies
- Any known mitigation

## Secrets

Never commit `.env.local`, OAuth credentials, Redis passwords, auth secrets, database files, or production logs. Use `.env.local.example` for placeholder configuration only.
