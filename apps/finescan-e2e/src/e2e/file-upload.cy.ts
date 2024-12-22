import { getFileUploadPage } from '../support/app.po';

describe('File Upload Flow', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
    cy.visit('/file-upload');
    // Wait for the page to load
    cy.get('[data-cy=file-upload-page]').should('be.visible');
  });

  it('should successfully upload a valid file', () => {
    // Create a test file
    cy.get('[data-cy=file-input]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.4\ntest content'),
        fileName: 'test.pdf',
        lastModified: Date.now(),
      },
      { force: true }
    );

    // Verify upload progress appears
    cy.get('[data-cy=upload-progress]').should('be.visible');

    // Wait for success message
    cy.get('[data-cy=success-message]').should('be.visible').and('contain', 'File uploaded successfully');

    // Verify download URL is generated
    cy.get('[data-cy=download-url]').should('not.be.empty');
  });

  it('should show error for oversized file', () => {
    // Create large test file (>5MB)
    const largeContent = Buffer.alloc(6 * 1024 * 1024, 'x');
    cy.get('[data-cy=file-input]').selectFile(
      {
        contents: largeContent,
        fileName: 'large-file.pdf',
        lastModified: Date.now(),
      },
      { force: true }
    );

    cy.get('[data-cy=error-message]').should('be.visible').and('contain', 'File size exceeds 5MB limit');
  });

  it('should reject invalid file types', () => {
    cy.get('[data-cy=file-input]').selectFile(
      {
        contents: Cypress.Buffer.from('MZ'),
        fileName: 'invalid.exe',
        lastModified: Date.now(),
      },
      { force: true }
    );

    cy.get('[data-cy=error-message]').should('be.visible').and('contain', 'Invalid file type');
  });
});
