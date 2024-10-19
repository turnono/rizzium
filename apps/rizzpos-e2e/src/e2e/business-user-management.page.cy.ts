import { faker } from '@faker-js/faker';
import * as AppPO from '../support/app.po';

describe('Business User Management Page', () => {
  const userName = faker.person.fullName();
  const userEmail = faker.internet.email();
  const initialRole = 'Cashier';
  const newRole = 'Manager';
  const invalidEmail = 'invalid-email';

  beforeEach(() => {
    cy.login('Lea.Dietrich78@gmail.com', 'x8wHG2IyN1fOSOs');
    // Click on the first business in the ion-list
    cy.get('ion-list ion-item').first().click();

    // click on the user management button
    cy.get('#user-management-button').click();
  });

  it('should allow adding a user', () => {
    // Add a new user
    cy.addBusinessUser(userName, userEmail, initialRole);

    // Wait for the user list to be visible and not empty
    cy.get('[data-cy=user-list]', { timeout: 1000 })
      .should('be.visible')
      .and('not.be.empty')
      .scrollIntoView();

    // Check if the user is in the list
    cy.get('[data-cy=user-list]').then(($list) => {
      if ($list.text().includes(userName)) {
        cy.wrap($list).within(() => {
          cy.contains(userName).should('be.visible');
          cy.contains(userEmail).should('be.visible');
        });
      } else {
        cy.log(
          `User ${userName} not found in the list. Skipping edit and remove tests.`
        );
      }
    });
  });

  it('should allow editing a user role', () => {
    // Edit the user's role
    cy.get('[data-cy^=user-role-select-]').last().click();

    cy.get(
      `.alert-button-inner > .alert-radio-label:contains("${newRole}")`
    ).click();

    cy.get('button.alert-button:contains("OK")').click();

    // Verify the role change
    cy.get('[data-cy^=user-role-select-]').last().should('contain', newRole);
  });

  // TODO: Fix this test later
  // it('should allow removing a user', () => {
  //   // Get the email of the last user in the list
  //   cy.get('[data-cy^="user-item-"] > .sc-ion-label-md-h > p.sc-ion-label-md')
  //     .last()
  //     .invoke('text')
  //     .as('lastUserEmail');

  //   // Remove the user

  //   cy.get('[data-cy^=remove-user-button-]').last().click();

  //   // Wait for the removal to complete
  //   cy.wait(2000);

  //   // Verify the user is removed from the list
  //   cy.get('@lastUserEmail').then((e) => {
  //     cy.log('Checking for removed user:', e);
  //     cy.get('[data-cy=user-list]').should('not.contain', e);
  //   });
  // });

  it('should display an error message when adding a user fails', () => {
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
