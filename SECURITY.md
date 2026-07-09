# Security Policy

## Supported Versions

Currently, only the latest release of Enterprise AI Copilot is supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

We take the security of this platform very seriously. If you discover a security vulnerability, please do NOT open a public issue.

Instead, please email the maintainer directly at **security@example.com** with the following information:
- A description of the vulnerability.
- Steps to reproduce the issue.
- Potential impact.

You should receive a response within 48 hours. If the issue is confirmed, we will release a patch as quickly as possible and credit you in the release notes.

## Security Features Implemented
- Rate Limiting via custom middleware
- Prompt Injection filtering
- CORS Origin enforcement
- JWT stateless authentication (Planned for Phase 5)
