describe('Customer Dashboard', () => {
  beforeEach(() => {
    cy.loginAs('customer');
    cy.visit('/customer-dashboard');
  });

  it('should display correct purchase history, loyalty points, and promotions', () => {
    cy.get('[data-cy=purchase-history]').should('exist');
    cy.get('[data-cy=purchase-history-item]').should('have.length.gt', 0);

    cy.get('[data-cy=loyalty-points]').should('exist');
    cy.get('[data-cy=loyalty-points-value]').should('not.be.empty');

    cy.get('[data-cy=active-promotions]').should('exist');
    cy.get('[data-cy=promotion-item]').should('have.length.gt', 0);
  });
});
