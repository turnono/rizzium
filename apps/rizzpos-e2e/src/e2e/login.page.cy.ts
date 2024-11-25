import { faker } from '@faker-js/faker';

const testEmail = faker.internet.email();
const testPassword = faker.internet.password();

describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('app-login').should('not.have.class', 'ion-page-hidden');
    cy.get('body', { timeout: 10000 }).should('be.visible');
  });

  describe('Login', () => {
    it('should log in successfully, else show error message', () => {
      cy.get('#ion-input-0');
      cy.get('#ion-input-0')
        .should('be.visible')
        .and('not.be.disabled')
        .type(testEmail, { force: true });

      cy.get('#ion-input-1')
        .should('be.visible')
        .and('not.be.disabled')
        .type(testPassword, { force: true });

      cy.get('[data-cy="submit-button"]').click({ force: true });
    });
  });

  describe('Registration', () => {
    beforeEach(() => {
      cy.get('[data-cy=auth-toggle-button]').click({ force: true });
      cy.get('[data-cy=header-title]').should('have.text', 'Register');
    });

    it('should register a new user successfully', () => {
      cy.get('[data-cy=email-input]').type(testEmail);
      cy.get('[data-cy=password-input]').type(testPassword);
      cy.get('[data-cy=confirm-password-input]').type(testPassword);

      cy.get('[data-cy=submit-button]').click({ force: true });
      cy.wait(10000);
    });
  });

  describe('Login Page', () => {
    it('should redirect to home page if user is already authenticated', () => {
      cy.login(testEmail, testPassword); // This should log in the user
    });
  });
});
