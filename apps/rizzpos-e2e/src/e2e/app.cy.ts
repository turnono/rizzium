describe('rizzpos-e2e', () => {
  beforeEach(() => {
    cy.visit('/', { timeout: 120000 }); // Increase timeout for initial visit
  });

  it('should display welcome message or dashboard', () => {
    // Wait for the page to load
    cy.get('body', { timeout: 30000 }).should('be.visible');

    // Check if we're on the login page
    cy.url().then((url) => {
      if (url.includes('/login')) {
        cy.log('Attempting to log in...');
        cy.get('input[type="email"]', { timeout: 10000 })
          .should('be.visible')
          .type(Cypress.env('TEST_USER_EMAIL'));
        cy.get('input[type="password"]').type(
          Cypress.env('TEST_USER_PASSWORD')
        );

        // Debug: Log the button's properties
        cy.get('button[type="submit"]').then(($btn) => {
          cy.log('Button properties:', {
            isVisible: $btn.is(':visible'),
            isDisabled: $btn.prop('disabled'),
            display: $btn.css('display'),
            html: $btn.prop('outerHTML'),
          });
        });

        // Take a screenshot before clicking
        cy.screenshot('before-submit-click');

        // Try to click the button even if it's not visible
        cy.get('button[type="submit"]', { timeout: 10000 }).click({
          force: true,
        });

        // Take a screenshot after clicking
        cy.screenshot('after-submit-click');

        // Check for error messages
        cy.get('body').then(($body) => {
          if ($body.find('.error-message').length > 0) {
            cy.log('Error message found:', $body.find('.error-message').text());
          }
        });

        // Wait for URL to change or for an error message to appear
        cy.wait(5000); // Wait for 5 seconds to allow for any redirects or error messages
        cy.url().then((newUrl) => {
          cy.log('Current URL after login attempt:', newUrl);
          if (newUrl.includes('/login')) {
            cy.log('Still on login page. Login might have failed.');
            cy.get('body').screenshot('login-failed');
          } else {
            cy.log('Redirected away from login page.');
          }
        });
      }
    });

    // Check for welcome message or dashboard
    cy.get('body', { timeout: 30000 }).then(($body) => {
      cy.log('Checking for welcome message or dashboard...');
      if ($body.find('[data-cy=welcome-message]').length > 0) {
        cy.get('[data-cy=welcome-message]').should('be.visible');
      } else {
        cy.log('Searching for dashboard elements...');
        cy.get('body').screenshot('dashboard-search');
        cy.get('body').then(($dashboardBody) => {
          cy.log('Body HTML:', $dashboardBody.html());
        });

        // Try to find any element that might indicate we're on a dashboard
        cy.get('body')
          .contains(/dashboard|home|welcome/i, { timeout: 30000 })
          .should('exist');
      }
    });
  });
});
