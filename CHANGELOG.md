# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0-beta] - 2026-07-05
### Added
- **Dockerization**: Full stack is now containerized using Docker and `docker-compose`.
- **Integration Tests**: Added `pytest` integration tests for health checks and security validation.
- **Repository Pattern**: Extracted all raw database logic into a dedicated `TicketRepository`.
- **Dependency Injection**: Implemented FastAPI dependency injection for the `TicketService`.
- **Custom Exceptions**: Standardized error handling using global custom exceptions (`AIProcessingError`, `DatabaseError`).

### Changed
- **UI Rewrite**: Completely overhauled the React frontend from a consumer UI to a strict, B2B Enterprise dashboard layout.
- **Service Layer**: Upgraded the `TicketService` to handle core business logic instead of raw database queries.

### Security
- **Prompt Injection Filter**: Added rigorous filtering to the LangChain agent to block malicious overrides.
- **Rate Limiting**: Added global rate limiting to prevent API abuse.
- **CORS Lockdown**: Secured CORS origins for production deployment.

## [1.0.0] - Initial Prototype
### Added
- Basic FastAPI Backend
- Basic React Frontend
- Naive Qdrant Vector Search
- SQLite Database
