describe('Product Management', () => {
  beforeEach(() => {
    cy.loginAs('manager');
    cy.visit('/product-management');
  });

  it('should add, edit, and delete a product', () => {
    cy.get('[data-cy=add-product-button]').click();
    cy.get('[data-cy=product-name-input]').type('Test Product');
    cy.get('[data-cy=product-price-input]').type('9.99');
    cy.get('[data-cy=product-stock-input]').type('100');
    cy.get('[data-cy=save-product-button]').click();

    cy.get('[data-cy=product-list]').should('contain', 'Test Product');

    cy.get('[data-cy=edit-product-button]').first().click();
    cy.get('[data-cy=product-name-input]').clear();
    cy.get('[data-cy=product-name-input]').type('Updated Test Product');
    cy.get('[data-cy=save-product-button]').click();

    cy.get('[data-cy=product-list]').should('contain', 'Updated Test Product');

    cy.get('[data-cy=delete-product-button]').first().click();
    cy.get('[data-cy=confirm-delete-button]').click();

    cy.get('[data-cy=product-list]').should(
      'not.contain',
      'Updated Test Product'
    );
  });
});
