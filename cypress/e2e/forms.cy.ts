describe("Test Plan - Form Submissions", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.contains("Create New Test Plan").click();
  });

  it("should submit test plan name form", () => {
    cy.get("input[placeholder*='Test Plan Name']").type("My Test Plan");
    cy.contains("Next").click();
    cy.contains("Introduction").should("be.visible");
  });

  it("should submit introduction form", () => {
    cy.get("input[placeholder*='Test Plan Name']").type("My Test Plan");
    cy.contains("Next").click();

    cy.get("textarea").type("This is a test introduction");
    cy.contains("Next").click();

    cy.contains("Project Discovery").should("be.visible");
  });

  it("should handle form validation", () => {
    // Try to submit empty form
    cy.contains("Next").click();
    // Should still be on the same form or show error
    cy.get("input[placeholder*='Test Plan Name']").should("be.visible");
  });
});
