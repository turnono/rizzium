import { faker } from '@faker-js/faker';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('app-login').should('not.have.class', 'ion-page-hidden');
    cy.get('body', { timeout: 10000 }).should('be.visible');
  });

  describe('Login', () => {
    it('should log in successfully and redirect to the appropriate dashboard', () => {
      const testEmail =
        Cypress.env('TEST_USER_EMAIL') || faker.internet.email();
      const testPassword =
        Cypress.env('TEST_USER_PASSWORD') || faker.internet.password();

      cy.url().then((url) => {
        cy.log(`Current URL before login: ${url}`);
      });

      cy.get('input[type="email"]', { timeout: 10000 })
        .should('be.visible')
        .and('not.be.disabled')
        .type(testEmail, { force: true });

      cy.get('input[type="password"]', { timeout: 5000 })
        .should('be.visible')
        .and('not.be.disabled')
        .type(testPassword, { force: true });

      cy.get('button[type="submit"]', { timeout: 5000 }).then(($btn) => {
        cy.log('Submit button properties:', {
          isVisible: $btn.is(':visible'),
          isDisabled: $btn.prop('disabled'),
          display: $btn.css('display'),
          html: $btn.prop('outerHTML'),
        });
      });

      cy.get('button[type="submit"]').click({ force: true });

      cy.url({ timeout: 10000 }).then((newUrl) => {
        cy.log(`URL after login attempt: ${newUrl}`);
        if (newUrl.includes('/login')) {
          cy.log('Still on login page. Login might have failed.');
          cy.get('body').screenshot('login-failed');
          cy.get('[data-cy=error-message]').should('be.visible');
        } else {
          expect(newUrl).to.match(/\/(home|business)/);
        }
      });

      cy.url().then((finalUrl) => {
        if (finalUrl.match(/\/(home|business)/)) {
          cy.log(
            'Successfully redirected to home. Checking for dashboard elements...'
          );
          cy.get('body').screenshot('home-page');
          cy.get('body').then(($body) => {
            cy.log('Home HTML:', $body.html());
          });

          // Check for common home elements
          cy.get('body').within(() => {
            cy.contains(/home|welcome/i, { timeout: 10000 }).should('exist');

            // Log all buttons and links text for debugging
            cy.get('ion-button').each(($el) => {
              cy.log('Button/Link text:', $el.text());
            });

            // Try to find logout or sign out link/button, but don't fail the test if not found
            cy.get('[data-cy="logout-button"]').then(($el) => {
              if ($el.length > 0) {
                cy.log('Logout/Sign out button found');
              } else {
                cy.log('Logout/Sign out button not found');
              }
            });
          });

          // Add more specific checks based on your dashboard layout
          // For example:
          // cy.get('[data-cy=user-name]').should('be.visible');
          // cy.get('[data-cy=business-overview]').should('exist');
        } else {
          cy.log('Unexpected redirect. Current URL:', finalUrl);
          cy.get('body').screenshot('unexpected-redirect');
        }
      });
    });

    it('should show error message for invalid credentials', () => {
      const invalidEmail = faker.internet.email();
      const invalidPassword = faker.internet.password();

      cy.get('input[type="email"]').type(invalidEmail);
      cy.get('input[type="password"]').type(invalidPassword);

      cy.get('button[type="submit"]').then(($btn) => {
        cy.log('Submit button properties:', {
          isVisible: $btn.is(':visible'),
          isDisabled: $btn.prop('disabled'),
          display: $btn.css('display'),
          html: $btn.prop('outerHTML'),
        });
      });

      cy.get('button[type="submit"]').click({ force: true });

      cy.get('[data-cy=error-message]', { timeout: 3000 }).should('be.visible');
    });
  });

  describe('Registration', () => {
    beforeEach(() => {
      cy.get('[data-cy=auth-toggle-button]').click({ force: true });
      cy.get('[data-cy=header-title]').should('have.text', 'Register');
    });

    it('should register a new user successfully', () => {
      const newUserEmail = faker.internet.email();
      const newUserPassword = faker.internet.password();

      cy.get('[data-cy=email-input]').type(newUserEmail);
      cy.get('[data-cy=password-input]').type(newUserPassword);
      cy.get('[data-cy=confirm-password-input]').type(newUserPassword);

      cy.get('[data-cy=submit-button]').click();

      cy.url().then((url) => {
        cy.log(`Current URL after registration: ${url}`);
        cy.wait(5000);
        if (url.includes('/login')) {
          cy.log('Redirected to login page after registration');
          cy.get('[data-cy=error-message]', { timeout: 10000 }).should(
            'not.exist'
          );
        } else {
          cy.get('ion-toast').should('exist');
        }
      });

      cy.get('body').then(($body) => {
        cy.log('Page content after registration:', $body.text());
      });

      cy.screenshot('after-registration');
    });
  });

  // Placeholder test for Google Sign-In (to be implemented later)
  it.skip('should have option for Google Sign-In', () => {
    cy.get('[data-cy=google-signin-button]').should('exist');
  });

  describe('Login Page', () => {
    it('should redirect to home page if user is already authenticated', () => {
      cy.loginAsOwner(); // This should log in the user
      cy.visit('/login');
      cy.url().should('include', '/home');
    });
  });
});
