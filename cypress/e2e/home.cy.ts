describe("Test Plan Generator - Home Page", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should load the home page successfully", () => {
    cy.get("h1").should("exist");
    cy.contains("Create New Test Plan").should("be.visible");
  });

  it("should display create new test plan card", () => {
    cy.contains("Create New Test Plan").should("be.visible");
    cy.contains("Start from scratch and create a brand new test plan").should(
      "be.visible"
    );
  });

  it("should display load existing test plan card", () => {
    cy.contains("Load Existing Test Plan").should("be.visible");
  });

  it("should navigate to login when accessing protected routes without login", () => {
    cy.visit("/dashboard");
    cy.url().should("include", "/login");
  });

  it("should allow creating a new test plan", () => {
    cy.contains("Create New Test Plan").click();
    cy.get("input[placeholder*='Test Plan Name']").should("be.visible");
  });
});
