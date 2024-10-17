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

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Chainable<Subject> {
    login(email: string, password: string): void;
    loginAs(role: string): void;
    loginAsOwner(): void;
  }
}

// -- This is a parent command --
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-cy=email-input]').type(email);
  cy.get('[data-cy=password-input]').type(password);
  cy.get('[data-cy=submit-button]').click();
  // Add a check to ensure login was successful
  cy.wait(5000);
  cy.url().should('include', '/home');
});

Cypress.Commands.add('loginAs', (role) => {
  // Implement role-based login logic here
  // This is a placeholder implementation
  cy.login(`${role}@example.com`, 'password');
});

Cypress.Commands.add('loginAsOwner', () => {
  const email = 'a@b.com';
  const password = '12345678';
  cy.login(email, password);
});
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
