export const getGreeting = () => cy.get('h1');

export const getBusinessList = () => cy.get('[data-cy=business-item]');
export const getCreateBusinessButton = () =>
  cy.get('[data-cy=create-business-button]');
export const getLogoutButton = () => cy.get('[data-cy=logout-button]');
