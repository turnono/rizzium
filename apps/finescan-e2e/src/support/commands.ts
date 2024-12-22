/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare namespace Cypress {
  interface Chainable<Subject> {
    login(email: string, password: string): Chainable<Subject>;
    register(email: string, password: string): Chainable<Subject>;
    verifyFileUpload(fileName: string): Chainable<Subject>;
    logout(): Chainable<Subject>;
    toggleAuthMode(): Chainable<Subject>;
  }
}

// Test user credentials - should be in cypress.env.json in practice
const TEST_USER = {
  email: 'test@example.com',
  password: 'testPassword123',
};

Cypress.Commands.add('login', (email = TEST_USER.email, password = TEST_USER.password) => {
  cy.visit('/login');
  cy.get('app-login').should('not.have.class', 'ion-page-hidden');
  cy.get('[data-cy=email-input] input').type(email, { force: true });
  cy.get('[data-cy=password-input] input').type(password, { force: true });
  cy.get('[data-cy=submit-button]').click();
});

// Add custom command for file upload verification
Cypress.Commands.add('verifyFileUpload', (fileName: string) => {
  cy.get('[data-cy=upload-progress]').should('be.visible');
  cy.get('[data-cy=success-message]', { timeout: 10000 })
    .should('be.visible')
    .and('contain', 'File uploaded successfully');
});

// Update logout command to handle confirmation
Cypress.Commands.add('logout', () => {
  cy.get('[data-cy=logout-button]').click();
  // Click the confirm button in the alert
  cy.get('.alert-button').contains('Logout').click();
  cy.url().should('include', '/login');
});

Cypress.Commands.add('register', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-cy=auth-toggle]').click();
  cy.get('[data-cy=email-input] input').type(email, { force: true });
  cy.get('[data-cy=password-input] input').type(password, { force: true });
  cy.get('[data-cy=confirm-password-input] input').type(password, { force: true });
  cy.get('[data-cy=submit-button]').click();
});

Cypress.Commands.add('toggleAuthMode', () => {
  cy.get('[data-cy=auth-toggle]').click();
});
