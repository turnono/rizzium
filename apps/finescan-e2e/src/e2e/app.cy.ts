import { getGreeting } from '../support/app.po';

describe('finescan-e2e', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {
    getGreeting().contains(/Welcome/);
  });
});
