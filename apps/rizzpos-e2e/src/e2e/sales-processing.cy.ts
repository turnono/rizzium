describe('Sales Processing (Cashier Flow)', () => {
  beforeEach(() => {
    cy.loginAs('cashier');
    cy.visit('/cashier-dashboard');
  });

  it('should process a sale and update inventory', () => {
    cy.get('[data-cy=product-search]').type('Test Product');
    cy.get('[data-cy=add-to-cart-button]').click();
    cy.get('[data-cy=quantity-input]').clear();
    cy.get('[data-cy=quantity-input]').type('2');

    cy.get('[data-cy=complete-sale-button]').click();
    cy.get('[data-cy=payment-method-select]').select('Cash');
    cy.get('[data-cy=confirm-payment-button]').click();

    cy.visit('/reports');
    cy.get('[data-cy=sales-report]').should('contain', 'Test Product');
    cy.get('[data-cy=sales-report]').should('contain', '2');

    cy.visit('/inventory');
    cy.get('[data-cy=inventory-list]').should('contain', 'Test Product');
    cy.get('[data-cy=inventory-list]').should('contain', '98');
  });
});
