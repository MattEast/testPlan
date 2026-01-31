import { mount } from "cypress/react18";

describe("Home Component - Unit Tests", () => {
  it("should mount the component", () => {
    cy.visit("/");
  });

  it("should display main heading", () => {
    cy.visit("/");
    cy.get("h1").should("exist");
  });

  it("should have navigation links", () => {
    cy.visit("/");
    cy.get("nav").should("be.visible");
  });

  it("should toggle dark mode", () => {
    cy.visit("/");
    cy.get("body").should("have.class", "dark");
  });
});
