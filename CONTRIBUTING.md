# Contributing to Enterprise AI Copilot

First off, thank you for considering contributing to Enterprise AI Copilot! It's people like you that make open source such a great community.

## Development Workflow

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/your-username/enterprise-copilot.git
    cd enterprise-copilot
    ```
3.  **Create a new branch** for your feature or bugfix:
    ```bash
    git checkout -b feature/amazing-new-feature
    ```
    *Use `feature/` for new features, `fix/` for bug fixes, and `docs/` for documentation updates.*
4.  **Run the local development environment** using Docker:
    ```bash
    docker-compose up --build
    ```
5.  **Make your changes** and test them thoroughly. Make sure you run the automated tests:
    ```bash
    pytest tests/
    ```
6.  **Commit your changes** using conventional commit messages:
    ```bash
    git commit -m "feat: add amazing new feature"
    ```
7.  **Push your branch** to your fork:
    ```bash
    git push origin feature/amazing-new-feature
    ```
8.  **Open a Pull Request** against the `main` branch of this repository.

## Code Style

- **Python**: Follow PEP 8 guidelines. Use type hints for all function arguments and return types.
- **React**: Use functional components and Hooks. Follow the ESLint configuration provided. Style with Tailwind CSS.

## Getting Help

If you need help or have questions about contributing, please open an issue with the tag `question`.
