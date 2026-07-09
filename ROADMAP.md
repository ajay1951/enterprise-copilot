# Project Roadmap

The Enterprise AI Copilot is currently in **v2.0 Beta**. The following is a high-level overview of planned features and architectural upgrades.

## Phase 5: Authentication & Authorization
- [ ] Replace hardcoded Admin tokens with stateless JWT (JSON Web Tokens).
- [ ] Add bcrypt password hashing for Admin accounts.
- [ ] Implement Role-Based Access Control (RBAC) (e.g., Support Agent vs. Super Admin).

## Phase 6: Advanced RAG Optimization
- [ ] Implement Hybrid Search (Dense + Sparse vectors) in Qdrant.
- [ ] Add a Re-Ranking model (e.g., Cohere) to improve document retrieval accuracy.
- [ ] Support complex PDF table extraction using specialized OCR models.

## Phase 7: Observability & Monitoring
- [ ] Integrate Prometheus to scrape API metrics (latency, error rates).
- [ ] Build Grafana dashboards for visual monitoring.
- [ ] Implement distributed tracing using OpenTelemetry.

## Phase 8: Scalability
- [ ] Migrate from SQLite/PostgreSQL to a fully managed database cluster.
- [ ] Implement Redis caching for frequent knowledge base queries.
- [ ] Container orchestration using Kubernetes (Helm charts).
