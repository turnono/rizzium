describe('Role-Based Dashboard Access', () => {
  const roles = ['owner', 'manager', 'cashier', 'customer'];

  roles.forEach((role) => {
    it(`should show correct dashboard for ${role} role`, () => {
      cy.loginAs(role);
      cy.visit('/dashboard');

      switch (role) {
        case 'owner':
          cy.get('[data-cy=owner-dashboard]').should('exist');
          cy.get('[data-cy=business-overview]').should('exist');
          cy.get('[data-cy=add-employee-button]').should('exist');
          break;
        case 'manager':
          cy.get('[data-cy=manager-dashboard]').should('exist');
          cy.get('[data-cy=inventory-management]').should('exist');
          cy.get('[data-cy=sales-report]').should('exist');
          break;
        case 'cashier':
          cy.get('[data-cy=cashier-dashboard]').should('exist');
          cy.get('[data-cy=sales-interface]').should('exist');
          break;
        case 'customer':
          cy.get('[data-cy=customer-dashboard]').should('exist');
          cy.get('[data-cy=purchase-history]').should('exist');
          cy.get('[data-cy=loyalty-points]').should('exist');
          break;
      }
    });
  });

  it('should redirect unauthorized roles from restricted areas', () => {
    cy.loginAs('cashier');
    cy.visit('/inventory-management');
    cy.url().should('include', '/dashboard');
    cy.get('[data-cy=access-denied-message]').should('exist');
  });
});
