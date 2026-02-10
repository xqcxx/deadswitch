# Contributing to DeadSwitch

Thank you for your interest in contributing to DeadSwitch! We welcome contributions from the community.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/deadswitch.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites

- Node.js 18+
- Clarinet (for Clarity smart contract development)
- Git

### Installation

```bash
# Install dependencies
npm install

# Install frontend dependencies
cd web && npm install
```

## Making Changes

### Code Style

- Follow existing code patterns
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and small

### Testing

Before submitting a PR:

```bash
# Run contract tests
clarinet test

# Run frontend tests
cd web && npm test
```

## Submitting Changes

1. Commit your changes with clear, descriptive messages
2. Push to your fork
3. Open a Pull Request against the `main` branch

### Commit Message Guidelines

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and PRs where appropriate

## Code Review

All submissions require review. We aim to respond within 48 hours.

## Questions?

Open an issue for discussion before major changes.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
