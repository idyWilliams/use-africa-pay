# Contributing to use-africa-pay

Thank you for your interest in contributing to `use-africa-pay`! We welcome contributions from the community.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- pnpm (v9 or later)

### Installation

1.  **Fork the repository** on GitHub.
2.  **Clone your fork**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/use-africa-pay.git
    cd use-africa-pay
    ```
3.  **Install dependencies**:
    ```bash
    pnpm install
    ```

## Development Workflow

This project uses [Turborepo](https://turbo.build/) to manage the monorepo.

### Building the Project

To build all packages:

```bash
pnpm build
```

### Running in Development Mode

To run the project in watch mode:

```bash
pnpm dev
```

### Linting and Formatting

Ensure your code is linted and formatted before submitting:

```bash
pnpm lint
pnpm format
```

## Pull Request Process

1.  Create a new branch for your feature or fix:
    ```bash
    git checkout -b feature/my-new-feature
    ```
2.  Make your changes.
3.  Run tests and ensure the build passes:
    ```bash
    pnpm build
    ```
4.  Commit your changes with a descriptive message.
5.  Push to your fork and submit a Pull Request to the `main` branch.

## Coding Standards

- We use **TypeScript** for type safety.
- We use **Prettier** for code formatting.
- We use **ESLint** for linting.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
