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
});
