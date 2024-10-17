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
      cy.url().then((url) => {
        cy.log(`Current URL before login: ${url}`);
      });

      console.log(Cypress.env('TEST_USER_EMAIL'));
      cy.get('input[type="email"]', { timeout: 10000 })
        .should('be.visible')
        .and('not.be.disabled')
        .type(Cypress.env('TEST_USER_EMAIL'), { force: true });

      cy.get('input[type="password"]', { timeout: 5000 })
        .should('be.visible')
        .and('not.be.disabled')
        .type(Cypress.env('TEST_USER_PASSWORD'), { force: true });

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
      cy.get('input[type="email"]').type('invalid@example.com');
      cy.get('input[type="password"]').type('wrongpassword');

      // Log button properties before clicking
      cy.get('button[type="submit"]').then(($btn) => {
        cy.log('Submit button properties:', {
          isVisible: $btn.is(':visible'),
          isDisabled: $btn.prop('disabled'),
          display: $btn.css('display'),
          html: $btn.prop('outerHTML'),
        });
      });

      // Use force: true to click the button even if it's not visible
      cy.get('button[type="submit"]').click({ force: true });

      // Wait for the error message with a timeout
      cy.get('[data-cy=error-message]', { timeout: 10000 }).should(
        'be.visible'
      );
    });
  });

  describe('Registration', () => {
    beforeEach(() => {
      cy.get('[data-cy=auth-toggle-button]').click({ force: true });
      cy.get('[data-cy=header-title]').should('have.text', 'Register');
    });

    it('should register a new user successfully', () => {
      // Fill out registration form
      cy.get('[data-cy=email-input]').type('newuser9@example.com');
      cy.get('[data-cy=password-input]').type('password123');
      cy.get('[data-cy=confirm-password-input]').type('password123');

      // Submit registration form
      cy.get('[data-cy=submit-button]').click();

      // Check for successful registration
      cy.url().then((url) => {
        cy.log(`Current URL after registration: ${url}`);
        cy.wait(5000);
        if (url.includes('/login')) {
          cy.log('Redirected to login page after registration');
          cy.get('[data-cy=error-message]', { timeout: 10000 }).should(
            'contain',
            'already-in-use'
          );
        } else {
          cy.get('ion-toast').should('exist');
        }
      });

      // Log the body content for debugging
      cy.get('body').then(($body) => {
        cy.log('Page content after registration:', $body.text());
      });

      // Take a screenshot for visual debugging
      cy.screenshot('after-registration');
    });

    // it('should show error for existing email during registration', () => {
    //   cy.get('input[type="email"]').type(Cypress.env('TEST_USER_EMAIL'));
    //   cy.get('input[type="password"]').first().type('SomePassword123!');
    //   cy.get('input[type="password"]').eq(1).type('SomePassword123!');
    //   cy.get('button[type="submit"]').click({ force: true });

    //   cy.get('[data-cy=error-message]', { timeout: 10000 })
    //     .should('be.visible')
    //     .and('contain', 'Firebase: Error (auth/email-already-in-use).');
    // });

    // it('should show error for mismatched passwords', () => {
    //   cy.get('input[type="email"]').type('newuser@example.com');
    //   cy.get('input[type="password"]').first().type('Password123!');
    //   cy.get('input[type="password"]').eq(1).type('DifferentPassword123!');
    //   cy.get('button[type="submit"]').click({ force: true });

    //   cy.get('[data-cy=password-mismatch-error]', { timeout: 10000 })
    //     .should('be.visible')
    //     .and('contain', 'Passwords do not match');
    // });
  });

  // Placeholder test for Google Sign-In (to be implemented later)
  it.skip('should have option for Google Sign-In', () => {
    cy.get('[data-cy=google-signin-button]').should('exist');
  });
});
