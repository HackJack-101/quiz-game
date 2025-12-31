# Project

- The project is a Next.js app to play quiz games.
- The specifications are in the specs.md file in the root directory.

# Coding

- Use Tailwind CSS
- Use TypeScript
- Define types and interfaces
- Execute ESLint with `npm run lint`
- Execute Prettier with `npm run format:fix`
- Use Jest
- Define components
- Avoid duplicating code
- Try to avoid long TS/TSX files
- English is the coding and comment language

# Design

- All action buttons or links must have a pointer cursor on hover

# i18n

- Always use i18n
- Generate and update all translations
- English is the default language

# Testing

- Write unit tests

# Documentation

- Write documentation in README.md
- Check the line associated to the task in TODO.md
- If necessary, update the specs.md file

# Docker & Deployment

- When adding a new package to package.json, check if it needs to be included in the `outputFileTracingIncludes` configuration in next.config.ts
- Packages that are runtime dependencies (not devDependencies) and their transitive dependencies may need to be explicitly listed
- Test the Docker build after adding packages to ensure the standalone output includes all necessary files
- Use specific package paths instead of wildcards to keep the Docker image size minimal
