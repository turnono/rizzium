export const getGreeting = () => cy.get('h1');

export const getBusinessList = () => cy.get('[data-cy=business-item]');
export const getCreateBusinessButton = () =>
  cy.get('[data-cy=create-business-button]');
export const getLogoutButton = () => cy.get('[data-cy=logout-button]');

// Business Setup Page
export const getBusinessNameInput = () =>
  cy.get('[data-cy=business-name-input]');
export const getBusinessTypeInput = () =>
  cy.get('[data-cy=business-type-input]');
export const getBusinessAddressInput = () =>
  cy.get('[data-cy=business-address-input]');
export const getBusinessPhoneInput = () =>
  cy.get('[data-cy=business-phone-input]');
export const getCreateBusinessSubmitButton = () =>
  cy.get('[data-cy=create-business-submit]');
export const getBusinessSetupErrorMessage = () =>
  cy.get('[data-cy=business-setup-error-message]');
export const getBusinessSetupSuccessMessage = () =>
  cy.get('[data-cy=business-setup-success-message]');

// Business User Management Page
export const getUserList = () => cy.get('[data-cy=user-list]');
export const getAddUserButton = () => cy.get('[data-cy=add-user-button]');
export const getUserNameInput = () => cy.get('[data-cy=user-name-input]');
export const getUserEmailInput = () => cy.get('[data-cy=user-email-input]');
export const getUserRoleSelect = () => cy.get('[data-cy=user-role-select]');
export const getSubmitUserButton = () => cy.get('[data-cy=submit-user-button]');
export const getUserItem = (email: string) =>
  cy.get(`[data-cy=user-item-${email}]`);
export const getUserRoleSelectByEmail = (email: string) =>
  cy.get(`[data-cy=user-role-select-${email}]`);
export const getRemoveUserButton = (email: string) =>
  cy.get(`[data-cy=remove-user-button-${email}]`);
