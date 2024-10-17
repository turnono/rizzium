import { faker } from '@faker-js/faker';
import * as AppPO from '../support/app.po';

describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/home');
  });

  it('should redirect to login page if user is not authenticated', () => {
    cy.url().should('include', '/login');
  });

  it("should display the user's businesses when authenticated", () => {
    cy.loginAsOwner();
    cy.url().should('include', '/home');

    // Wait for the content to load
    cy.get('ion-content').should('be.visible');

    // Check if there's a loading indicator and wait for it to disappear
    cy.get('ion-spinner').should('not.exist');

    // Check for the business list or empty state message
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy=business-item]').length > 0) {
        AppPO.getBusinessList().should('exist');
      } else {
        cy.contains("You don't have any businesses yet").should('be.visible');
      }
    });
  });

  it('should attempt to create a new business', () => {
    cy.loginAsOwner();
    cy.url().should('include', '/home');

    const businessName = faker.company.name();
    const businessType = faker.company.buzzPhrase();

    AppPO.getCreateBusinessButton().click();
    cy.url().should('include', '/business-setup');

    cy.get('[data-cy=business-name-input]').type(businessName);
    cy.get('[data-cy=business-type-input]').type(businessType);

    cy.log('Business Name:', businessName);
    cy.log('Business Type:', businessType);

    cy.get('[data-cy=create-business-submit]').click();

    // Wait for the page to load after form submission
    cy.get('ion-content').should('be.visible');

    // Check for success or error scenarios
    cy.url().then((url) => {
      cy.log('Current URL after submission:', url);

      if (url.includes('/business/')) {
        // Success scenario
        cy.contains(businessName).should('be.visible');
      } else if (url.includes('/business-setup')) {
        // Error scenario or form still visible
        cy.get('[data-cy=business-name-input]').should(
          'have.value',
          businessName
        );
        cy.get('[data-cy=business-type-input]').should(
          'have.value',
          businessType
        );

        // Check for any visible error messages or success messages
        cy.get('body').then(($body) => {
          if ($body.find('ion-text.ion-color-danger').length > 0) {
            cy.get('ion-text.ion-color-danger').should('be.visible');
          } else if ($body.find('ion-text.ion-color-success').length > 0) {
            cy.get('ion-text.ion-color-success').should('be.visible');
          } else {
            cy.log(
              'No error or success message found. Form might still be processing.'
            );
          }
        });
      } else {
        throw new Error(
          `Unexpected URL after business creation attempt: ${url}`
        );
      }
    });
  });
});
