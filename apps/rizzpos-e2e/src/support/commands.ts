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
  interface Chainable<Subject> {
    login(email: string, password: string): Chainable<Subject>;
    loginAs(role: string): Chainable<Subject>;
    loginAsOwner(): Chainable<Subject>;
    fillBusinessSetupForm(
      businessName: string,
      businessType: string,
      address: string,
      phoneNumber: string
    ): void;
    addBusinessUser(name: string, email: string, role: string): void;
    editUserRole(email: string, newRole: string): void;
    removeUser(email: string): void;
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

Cypress.Commands.add(
  'fillBusinessSetupForm',
  (
    businessName: string,
    businessType: string,
    address: string,
    phoneNumber: string
  ) => {
    cy.get('[data-cy=business-name-input]').type(businessName);
    cy.get('[data-cy=business-type-input]').type(businessType);
    cy.get('[data-cy=business-address-input]').type(address);
    cy.get('[data-cy=business-phone-input]').type(phoneNumber);
  }
);

Cypress.Commands.add(
  'addBusinessUser',
  (name: string, email: string, role: string) => {
    cy.get('[data-cy=add-user-button]').click();
    cy.get('[data-cy=user-name-input]').type(name);
    cy.get('[data-cy=user-email-input]').type(email);
    cy.get('[data-cy=user-role-select]').click();

    cy.get(
      `.alert-button-inner > .alert-radio-label:contains("${role}")`
    ).click();
    cy.get('button.alert-button:contains("OK")').click();
    cy.get('[data-cy=submit-user-button]').click();
  }
);

Cypress.Commands.add('editUserRole', (email: string, newRole: string) => {
  cy.get(`[data-cy=user-role-select-${email}]`).click();

  cy.get(
    `.alert-button-inner > .alert-radio-label:contains("${newRole}")`
  ).click();
  cy.get('button.alert-button:contains("OK")').click();
});

Cypress.Commands.add('removeUser', (email: string) => {
  cy.get(`[data-cy=remove-user-button-${email}]`).click();
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
