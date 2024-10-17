describe('Business Onboarding', () => {
  beforeEach(() => {
    cy.loginAsOwner();
    cy.visit('/business-setup');
  });

  it('should create a new business and redirect to the business dashboard', () => {
    cy.get('[data-cy=business-name-input]').type('Test Business');
    cy.get('[data-cy=business-type-select]').select('Retail');
    cy.get('[data-cy=business-address-input]').type(
      '123 Test St, Test City, TS 12345'
    );
    cy.get('[data-cy=business-phone-input]').type('1234567890');
    cy.get('[data-cy=create-business-button]').click();

    cy.url().should('include', '/business/');
    cy.get('[data-cy=business-dashboard]').should('exist');
    cy.get('[data-cy=business-list]').should('contain', 'Test Business');
  });
});
