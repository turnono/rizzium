export const getGreeting = () => cy.get('h1');
export const getFileUploadPage = () => cy.get('[data-cy=file-upload-page]');
export const getReportsList = () => cy.get('[data-cy=reports-list]');
export const getReportItem = () => cy.get('[data-cy=report-item]');
export const getErrorMessage = () => cy.get('[data-cy=error-message]');
export const getSuccessMessage = () => cy.get('[data-cy=success-message]');
export const getEmailInput = () => cy.get('[data-cy=email-input] input');
export const getPasswordInput = () => cy.get('[data-cy=password-input] input');
export const getLoginButton = () => cy.get('[data-cy=submit-button]');

export const login = (email: string, password: string) => {
  getEmailInput().type(email, { force: true });
  getPasswordInput().type(password, { force: true });
  getLoginButton().click();
};
