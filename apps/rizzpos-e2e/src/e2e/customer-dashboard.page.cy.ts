import * as AppPO from '../support/app.po';

describe('Customer Dashboard', () => {
  beforeEach(() => {
    cy.loginAs('customer');
    cy.visit('/business/123/customer-dashboard'); // Replace '123' with an actual business ID
    cy.url().should('include', '/customer-dashboard');
  });

  it('should display customer dashboard elements', () => {
    // Check if the customer dashboard is visible
    AppPO.getCustomerDashboard().should('be.visible');

    // Verify loyalty points are displayed
    AppPO.getLoyaltyPoints().should('be.visible').and('contain.text', 'points');

    // Check for promotions
    AppPO.getPromotionsList().then(($promotions) => {
      if ($promotions.find('[data-cy=promotion-item]').length > 0) {
        cy.get('[data-cy=promotion-item]').first().should('be.visible');
      } else {
        cy.contains('No current promotions').should('be.visible');
      }
    });

    // Verify purchase history
    AppPO.getPurchaseHistory().then(($history) => {
      if ($history.find('[data-cy=purchase-item]').length > 0) {
        cy.get('[data-cy=purchase-item]').first().should('be.visible');
      } else {
        cy.contains('No purchase history available').should('be.visible');
      }
    });
  });
});
