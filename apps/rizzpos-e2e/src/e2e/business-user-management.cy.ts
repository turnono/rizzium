import { faker } from '@faker-js/faker';
import * as AppPO from '../support/app.po';

describe('Business User Management Page', () => {
  beforeEach(() => {
    cy.loginAsOwner();
    // Click on the first business in the ion-list
    cy.get('ion-list ion-item').first().click();

    // click on the user management button
    cy.get('#user-management-button').click();
  });

  it('should allow adding, editing, and removing business users', () => {
    const userName = faker.person.fullName();
    const userEmail = faker.internet.email();
    const initialRole = 'Cashier';
    const newRole = 'Manager';

    // Add a new user
    cy.addBusinessUser(userName, userEmail, initialRole);

    // Wait for the user list to update and scroll into view
    cy.get('ion-content').scrollTo('bottom');
    cy.get('[data-cy=user-list]').should('be.visible');

    // Verify the user is added to the list
    cy.get('[data-cy=user-list]').within(() => {
      cy.contains(userName).should('be.visible');
      cy.contains(userEmail).should('be.visible');
    });

    // Edit the user's role
    cy.get('[data-cy^=user-role-select-]').last().click();
    cy.get(
      `ion-alert-radio-group ion-radio-group ion-item:contains("${newRole}")`
    ).click();
    cy.get('button.alert-button:contains("OK")').click();

    // Verify the role change
    cy.get('[data-cy^=user-role-select-]').last().should('contain', newRole);

    // Get the email of the last user in the list
    cy.get('[data-cy^="user-item-"] > .sc-ion-label-md-h > p.sc-ion-label-md')
      .last()
      .invoke('text')
      .as('lastUserEmail');

    // Remove the user
    cy.get('[data-cy^=remove-user-button-]').last().click();

    // Wait for the removal to complete
    cy.wait(2000);

    // Verify the user is removed from the list
    cy.get('@lastUserEmail').then((email) => {
      cy.log('Checking for removed user:', email);
      cy.get('[data-cy=user-list]').should('not.contain', email);
    });
  });

  it('should display an error message when adding a user fails', () => {
    const invalidEmail = 'invalid-email';

    cy.get('[data-cy=add-user-button]').click();
    cy.get('[data-cy=user-name-input]').type('Test User');
    cy.get('[data-cy=user-email-input]').type(invalidEmail);
    cy.get('[data-cy=user-role-select]').click();
    cy.get(
      '.alert-button-inner > .alert-radio-label:contains("Cashier")'
    ).click();
    cy.get('button.alert-button:contains("OK")').click();
    cy.get('[data-cy=submit-user-button]').click();

    // Check for error message
    cy.get('[data-cy=error-message]').should('be.visible');
  });

  it('should display an error message for invalid form submission', () => {
    cy.get('[data-cy=add-user-button]').click();
    cy.get('[data-cy=submit-user-button]').click();

    // Check for error message
    cy.get('[data-cy=error-message]').should('be.visible');
  });
});
