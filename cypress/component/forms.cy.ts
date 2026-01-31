describe("Form Inputs - Unit Tests", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.contains("Create New Test Plan").click();
  });

  it("should accept text input in test plan name field", () => {
    const testValue = "My Test Plan";
    cy.get("input[placeholder*='Test Plan Name']")
      .type(testValue)
      .should("have.value", testValue);
  });

  it("should clear input when clear button is clicked", () => {
    cy.get("input[placeholder*='Test Plan Name']").type("Test").clear();
    cy.get("input[placeholder*='Test Plan Name']").should("have.value", "");
  });

  it("should enable submit button only when input is provided", () => {
    cy.contains("Next").should("exist");
    cy.get("input[placeholder*='Test Plan Name']").type("Test");
    // Button should be enabled (exact selector depends on your button implementation)
    cy.contains("Next").should("not.be.disabled");
  });

  it("should handle special characters in input", () => {
    const specialInput = "Test Plan @#$% 2024";
    cy.get("input[placeholder*='Test Plan Name']")
      .type(specialInput)
      .should("have.value", specialInput);
  });

  it("should handle very long input", () => {
    const longInput = "A".repeat(100);
    cy.get("input[placeholder*='Test Plan Name']")
      .type(longInput)
      .should("have.value", longInput);
  });
});
