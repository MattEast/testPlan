describe("Test Plan - Storage and Persistence", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should save test plan to localStorage", () => {
    cy.contains("Create New Test Plan").click();
    cy.get("input[placeholder*='Test Plan Name']").type("Saved Test Plan");

    // Verify that data is saved
    cy.window().then((win) => {
      const savedPlans = localStorage.getItem("savedTestPlans");
      expect(savedPlans).to.not.be.null;
    });
  });

  it("should load saved test plans", () => {
    // First create a test plan
    cy.contains("Create New Test Plan").click();
    cy.get("input[placeholder*='Test Plan Name']").type("First Plan");
    cy.contains("Next").click();

    // Navigate back to home
    cy.visit("/");

    // Load should show saved plans
    cy.contains("Load Existing Test Plan").click();
    cy.contains("First Plan").should("be.visible");
  });

  it("should clear storage on new test plan", () => {
    cy.contains("Create New Test Plan").click();
    cy.get("input[placeholder*='Test Plan Name']").type("Test Plan 1");

    // Create new test plan should clear previous data
    cy.contains("New").click();
    cy.window().then((win) => {
      const currentPlanName = localStorage.getItem("currentTestPlanName");
      expect(currentPlanName).to.equal("");
    });
  });
});
