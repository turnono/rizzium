import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

describe('Login Flow', () => {
  let testEnv: RulesTestEnvironment;

  beforeEach(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-rizzpos',
    });

    // Set up a test user in Firebase Auth
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('users/testUser').set({
        email: 'test@example.com',
        role: 'owner',
      });
    });

    cy.visit('/login');
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  it('should log in successfully and redirect to the appropriate dashboard', () => {
    cy.get('[data-cy=email-input]').type('test@example.com');
    cy.get('[data-cy=password-input]').type('testpassword');
    cy.get('[data-cy=login-button]').click();

    // Assert redirection to the owner dashboard
    cy.url().should('include', '/business');
    cy.get('[data-cy=owner-dashboard]').should('exist');

    // Assert correct content based on owner role
    cy.get('[data-cy=business-overview]').should('exist');
    cy.get('[data-cy=add-employee-button]').should('exist');
    cy.get('[data-cy=sales-report]').should('exist');
  });

  it('should attempt to login with valid credentials', () => {
    cy.get('input[type="email"]').type(Cypress.env('TEST_USER_EMAIL'));
    cy.get('input[type="password"]').type(Cypress.env('TEST_USER_PASSWORD'));
    cy.get('button[type="submit"]').click();

    // Check for redirection or successful login indicator
    cy.url().should('not.include', '/login');

    // Add assertions here to check for successful login indicators
    // For example:
    // cy.get('[data-cy=user-menu]').should('be.visible');
  });

  it('should show error message for invalid credentials', () => {
    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Check for error message
    // Adjust the selector based on how your app displays error messages
    cy.get('.error-message')
      .should('be.visible')
      .and('contain', 'Invalid email or password');
  });

  // Placeholder test for Google Sign-In (to be implemented later)
  it.skip('should have option for Google Sign-In', () => {
    cy.get('[data-cy=google-signin-button]').should('exist');
    // Additional Google Sign-In tests will be added here once implemented
  });
});
