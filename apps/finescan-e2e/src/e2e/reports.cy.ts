describe('Analysis Reports', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');

    // Ensure we're logged in before visiting reports
    cy.url()
      .should('not.include', '/login')
      .then(() => {
        cy.visit('/reports');
        // Wait for the page to fully load
        cy.get('ion-content', { timeout: 10000 }).should('be.visible');
        cy.url().should('include', '/reports');
      });
  });

  it('should display analysis reports list', () => {
    // First check if we're properly on the reports page
    cy.get('ion-title').should('contain', 'Analysis Reports');

    cy.get('[data-cy=reports-list]', { timeout: 10000 }).should('be.visible');

    // Check if reports are loaded
    cy.get('[data-cy=report-item]', { timeout: 10000 }).then(($items) => {
      if ($items.length > 0) {
        // If reports exist, verify their structure
        cy.get('[data-cy=report-item]')
          .first()
          .within(() => {
            cy.get('[data-cy=report-date]').should('be.visible');
            cy.get('[data-cy=report-status]').should('be.visible');
            cy.get('[data-cy=report-details]').should('be.visible');
          });
      } else {
        // If no reports, verify empty state message
        cy.get('[data-cy=no-reports-message]').should('be.visible').and('contain', 'No reports available yet');
      }
    });
  });

  it('should open report details when clicked', () => {
    // First ensure we have a report to click
    cy.get('[data-cy=report-item]', { timeout: 10000 }).should('be.visible').first().click();

    // Verify the detail view components are visible
    cy.get('[data-cy=report-detail-view]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy=analysis-results]').should('be.visible');
    cy.get('[data-cy=document-preview]').should('be.visible');
  });
});
