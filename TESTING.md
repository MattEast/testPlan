# Cypress Testing Setup

This project includes comprehensive testing with Cypress.io for both E2E and Component testing.

## Installation

Cypress is already configured. If you need to install/reinstall it:

```bash
npm install cypress
```

## Running Tests

### E2E Tests

E2E tests verify the entire user workflow:

```bash
# Run all E2E tests in headless mode
npm run test:e2e

# Run E2E tests with interactive Cypress UI
npm run test:e2e:open
```

E2E test files are located in `cypress/e2e/`:
- `home.cy.ts` - Home page and navigation tests
- `forms.cy.ts` - Form submission tests
- `storage.cy.ts` - Data persistence tests

### Component Tests

Component tests verify individual component behavior:

```bash
# Run all component tests in headless mode
npm run test:component

# Run component tests with interactive Cypress UI
npm run test:component:open
```

Component test files are located in `cypress/component/`:
- `home.cy.ts` - Home component unit tests
- `forms.cy.ts` - Form input component tests

### Run All Tests

```bash
npm test
```

## Test Structure

```
cypress/
├── e2e/                    # End-to-end tests
│   ├── home.cy.ts
│   ├── forms.cy.ts
│   └── storage.cy.ts
├── component/              # Component unit tests
│   ├── home.cy.ts
│   └── forms.cy.ts
├── support/
│   ├── commands.ts         # Custom Cypress commands
│   └── e2e.ts              # E2E setup and hooks
└── cypress.config.ts       # Cypress configuration
```

## Configuration

The main Cypress configuration is in `cypress.config.ts`:

- **baseUrl**: `http://localhost:3001` (adjust if your dev server uses a different port)
- **Component Framework**: Next.js
- **Component Bundler**: Webpack
- **Spec Pattern**: `cypress/**/*.cy.ts`

## Before Running Tests

Make sure your development server is running:

```bash
npm run dev
```

The server should be running on `http://localhost:3001` for E2E tests to work properly.

## Writing New Tests

### E2E Test Example

```typescript
describe("Feature Name", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should perform user action", () => {
    cy.contains("Button Text").click();
    cy.get(".element").should("be.visible");
  });
});
```

### Component Test Example

```typescript
describe("Component Name", () => {
  it("should render correctly", () => {
    cy.visit("/");
    cy.get("[data-testid='component']").should("exist");
  });
});
```

## Useful Cypress Commands

- `cy.visit(url)` - Visit a page
- `cy.get(selector)` - Get element(s)
- `cy.contains(text)` - Find element by text
- `cy.click()` - Click element
- `cy.type(text)` - Type text
- `cy.should(assertion)` - Assert conditions
- `cy.window()` - Access window object
- `cy.localStorage()` - Access localStorage

## Debugging Tests

1. Use `cy.pause()` to pause test execution
2. Use the Cypress UI (`npm run test:e2e:open`) for step-by-step debugging
3. Use `cy.screenshot()` to capture screenshots
4. Check Cypress logs in the Command Log panel

## CI/CD Integration

To run tests in CI/CD pipelines:

```bash
npm run test:e2e -- --record  # Record test results
npm run test -- --headless    # Run all tests headlessly
```

## Resources

- [Cypress Documentation](https://docs.cypress.io)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Next.js + Cypress](https://docs.cypress.io/guides/references/best-practices#Using-Cy-Commands-Without-Get)
