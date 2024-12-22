import { getEmailInput, getPasswordInput, getLoginButton, getErrorMessage, login } from '../support/app.po';

describe('Authentication and Authorization', () => {
  beforeEach(() => {
    cy.visit('/login');
    // Wait for Ionic page to be fully visible
    cy.get('app-login').should('be.visible');
  });

  it('should toggle between login and register modes', () => {
    // Initially in login mode
    cy.get('ion-title').should('contain', 'Login');

    // Switch to register mode
    cy.toggleAuthMode();
    cy.get('ion-title').should('contain', 'Register');

    // Switch back to login mode
    cy.toggleAuthMode();
    cy.get('ion-title').should('contain', 'Login');
  });

  it('should register a new user successfully', () => {
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'testPassword123';

    cy.register(testEmail, testPassword);
    cy.url().should('not.include', '/login');
  });

  it('should navigate to home on successful login', () => {
    // Using test account that exists in Firebase
    getEmailInput().type('test@example.com');
    getPasswordInput().type('testpass123');
    cy.get('[data-cy=submit-button]').click();

    // Should redirect to home
    cy.url().should('not.include', '/login');
  });

  it('should successfully logout when clicking logout button', () => {
    // First login
    cy.login('test@example.com', 'testPassword123');

    // Verify we're logged in
    cy.url().should('not.include', '/login');

    // Click logout
    cy.logout();

    // Verify we're redirected to login
    cy.url().should('include', '/login');

    // Verify we can't access protected routes
    cy.visit('/home');
    cy.url().should('include', '/login');
  });
});
