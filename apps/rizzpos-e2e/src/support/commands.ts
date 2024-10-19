/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  interface Chainable<Subject> {
    login(email: string, password: string): Chainable<Subject>;
    loginAs(role: string): Chainable<Subject>;
    loginAsOwner(): Chainable<Subject>;
    fillBusinessSetupForm(
      businessName: string,
      businessType: string,
      address: string,
      phoneNumber: string
    ): void;
    addBusinessUser(name: string, email: string, role: string): void;
    editUserRole(email: string, newRole: string): void;
    removeUser(email: string): void;
    addItemToCart(itemName: string, quantity: number): Chainable<Subject>;
    checkInventoryUpdate(itemName: string, expectedChange: number): void;
    addTestProducts(productNames: string[]): Chainable<Subject>;
  }
}

// -- This is a parent command --
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-cy=email-input]').type(email);
  cy.get('[data-cy=password-input]').type(password);
  cy.get('[data-cy=submit-button]').click();
  // Add a check to ensure login was successful
  cy.url().should('include', '/home');
});

Cypress.Commands.add('loginAs', (role) => {
  // Implement role-based login logic here
  // This is a placeholder implementation

  if (role === 'customer') {
    cy.login(`${role}@example.com`, 'jggeytr@hj32');
  } else {
    cy.login(`${role}@example.com`, 'password');
  }
});

Cypress.Commands.add(
  'fillBusinessSetupForm',
  (
    businessName: string,
    businessType: string,
    address: string,
    phoneNumber: string
  ) => {
    cy.get('[data-cy=business-name-input]').type(businessName);
    cy.get('[data-cy=business-type-input]').type(businessType);
    cy.get('[data-cy=business-address-input]').type(address);
    cy.get('[data-cy=business-phone-input]').type(phoneNumber);
  }
);

Cypress.Commands.add(
  'addBusinessUser',
  (name: string, email: string, role: string) => {
    cy.get('[data-cy=add-user-button]').click();
    cy.get('[data-cy=user-name-input]').type(name);
    cy.get('[data-cy=user-email-input]').type(email);
    cy.get('[data-cy=user-role-select]').click();

    cy.get(
      `.alert-button-inner > .alert-radio-label:contains("${role}")`
    ).click();
    cy.get('button.alert-button:contains("OK")').click();
    cy.get('[data-cy=submit-user-button]').click();
  }
);

Cypress.Commands.add('editUserRole', (email: string, newRole: string) => {
  cy.get(`[data-cy=user-role-select-${email}]`).click();

  cy.get(
    `.alert-button-inner > .alert-radio-label:contains("${newRole}")`
  ).click();
  cy.get('button.alert-button:contains("OK")').click();
});

Cypress.Commands.add('removeUser', (email: string) => {
  cy.get(`[data-cy=remove-user-button-${email}]`).click();
});

Cypress.Commands.add('addItemToCart', (itemName: string, quantity: number) => {
  // Search for the item
  cy.get('[data-cy=item-search]', { timeout: 10000 })
    .should('exist')
    .then(($searchbar) => {
      // Check if the searchbar is visible
      if (!Cypress.dom.isVisible($searchbar)) {
        cy.log('Searchbar is not visible. Attempting to scroll into view.');
        cy.wrap($searchbar).scrollIntoView({ offset: { top: -100, left: 0 } });
      }

      // Clear the searchbar using JavaScript
      const input = $searchbar[0].querySelector('input');
      if (input) {
        cy.wrap(input).clear().type(itemName);
      } else {
        // If we can't find the input, try to set the value directly on the ion-searchbar
        cy.wrap($searchbar).invoke('val', '').type(itemName);
      }
    });

  // Wait for the item list to update and log its content
  cy.get('[data-cy=item-list]', { timeout: 20000 })
    .should('exist')
    .then(($list) => {
      cy.log('Item list content:', $list.text());

      if (Cypress.dom.isVisible($list)) {
        // Wait for the list to contain the item name with increased timeout
        cy.contains(itemName, { timeout: 30000 })
          .should('exist')
          .then(($item) => {
            cy.log(`Item "${itemName}" found in the list: ${$item.text()}`);
          });
      } else {
        cy.log('Item list is not visible. Attempting to scroll into view.');
        cy.wrap($list).scrollIntoView().should('be.visible');
      }
    });

  // If the item is not found, log the entire body content
  cy.get('body').then(($body) => {
    if (!$body.text().includes(itemName)) {
      cy.log(`Item "${itemName}" not found. Full page content:`);
      cy.log($body.html());
    }
  });

  // Attempt to find the item and add it to the cart
  cy.get('[data-cy=item-list]')
    .contains(itemName, { timeout: 30000 })
    .should('be.visible')
    .closest('ion-item')
    .find('[data-cy=add-to-cart-button]')
    .click()
    .then(() => {
      cy.log(`Clicked add to cart button for ${itemName}`);
    });

  // Verify the item is in the cart
  cy.get('[data-cy=cart-items]', { timeout: 10000 })
    .should('exist')
    .then(($el) => {
      if (!$el.text().includes(itemName)) {
        cy.log(`Error: "${itemName}" not found in cart after adding`);
        cy.get('[data-cy=item-list]').then(($list) => {
          cy.log('Current item list content:');
          cy.log($list.text());
        });
        throw new Error(`Item "${itemName}" not found in cart after adding`);
      } else {
        cy.log(`Item "${itemName}" found in cart`);
      }
    });

  // If quantity is more than 1, we need to add it multiple times
  if (quantity > 1) {
    for (let i = 1; i < quantity; i++) {
      cy.get('[data-cy=item-list]')
        .contains(itemName)
        .closest('ion-item')
        .find('[data-cy=add-to-cart-button]')
        .click();
    }
  }

  // Verify the total quantity in the cart
  cy.get('[data-cy=cart-items]')
    .contains(itemName)
    .closest('ion-item')
    .should(($el) => {
      expect($el.text()).to.include(`x ${quantity}`);
    });

  // Log the entire body content for debugging
  cy.get('body').then(($body) => {
    cy.log('Full page content after adding item:');
    cy.log($body.html());
  });

  // Take a screenshot of the current state
  cy.screenshot(`after-adding-${itemName}-to-cart`);
});

Cypress.Commands.add(
  'checkInventoryUpdate',
  (itemName: string, expectedChange: number) => {
    // This is a placeholder implementation. You'll need to adjust this based on how you're storing and retrieving inventory data.
    cy.get('[data-cy=inventory-list]')
      .contains(itemName)
      .within(() => {
        cy.get('[data-cy=item-quantity]')
          .invoke('text')
          .then((text) => {
            const currentQuantity = parseInt(text, 10);
            cy.get('[data-cy=item-previous-quantity]')
              .invoke('text')
              .then((prevText) => {
                const previousQuantity = parseInt(prevText, 10);
                expect(currentQuantity).to.equal(
                  previousQuantity + expectedChange
                );
              });
          });
      });
  }
);

Cypress.Commands.add('addTestProducts', (productNames: string[]) => {
  cy.log('Starting addTestProducts command');

  cy.get('[data-cy="inventory-button"]').click();
  cy.log('Clicked inventory button');

  cy.get('[data-cy="inventory-page"]', { timeout: 20000 }).should('be.visible');
  cy.log('Inventory page is visible');

  productNames.forEach((name) => {
    cy.log(`Adding product: ${name}`);

    cy.get('[data-cy="add-product-button"]').click();
    cy.get('[data-cy="product-name-input"]').should('be.visible').type(name);
    cy.get('[data-cy="product-price-input"]').should('be.visible').type('10');
    cy.get('[data-cy="product-quantity-input"]')
      .should('be.visible')
      .type('100');
    cy.get('[data-cy="submit-product-button"]').should('be.visible').click();

    // Wait for the modal to close or timeout after 15 seconds
    cy.get('ion-modal', { timeout: 15000 })
      .should('not.be.visible')
      .then(($modal) => {
        if ($modal.length > 0) {
          cy.log('Modal is still in the DOM but not visible');
        }
      });

    // Check if the product was added successfully
    cy.get('body').then(($body) => {
      if ($body.text().includes(name)) {
        cy.log(`Product "${name}" found in the body text`);
      } else {
        cy.log(
          `Product "${name}" not found in the body text. Current body content:`
        );
        cy.log($body.text());
      }
    });

    // Try to find the product in the list
    return cy.get('body').then(($body) => {
      if ($body.find('[data-cy="inventory-list"]').length > 0) {
        cy.get('[data-cy="inventory-list"]', { timeout: 10000 })
          .should('exist')
          .then(($list) => {
            if ($list.text().includes(name)) {
              cy.log(`Product "${name}" found in the inventory list`);
            } else {
              cy.log(
                `Product "${name}" not found in the inventory list. Current list content:`
              );
              cy.log($list.text());
            }
          });
      } else {
        cy.log('Inventory list not found. Current page content:');
        cy.log($body.html());
      }
    });
  });

  // Log the current URL and page content
  cy.url().then((url) => {
    cy.log(`Current URL after adding products: ${url}`);
  });
  cy.get('body').then(($body) => {
    cy.log('Page content after adding products:');
    cy.log($body.html());
  });

  // Navigate to the business dashboard
  cy.log('Navigating to business dashboard');
  cy.visit('/business-dashboard', { timeout: 3000 });

  // Log the current URL after navigation
  cy.url().then((url) => {
    cy.log(`Current URL after navigation: ${url}`);
  });

  // Wait for any content to load
  cy.get('body', { timeout: 3000 }).should('not.be.empty');

  // Log the body content
  cy.get('body').then(($body) => {
    cy.log('Body content after navigation:');
    cy.log($body.html());
  });

  // Check for common elements that should be present on the dashboard
  cy.get('body').within(() => {
    cy.contains(/dashboard|business/i, { timeout: 3000 }).should('exist');
  });

  // click on the first business in the ion-list
  cy.get('ion-list ion-item').first().click();

  // Try to find the sales button directly
  cy.get('[data-cy="sales-button"]', { timeout: 3000 }).then(($button) => {
    if ($button.length > 0) {
      cy.wrap($button).should('be.visible').click();
    } else {
      cy.log('Sales button not found, attempting to navigate to sales page');
      cy.visit('/sales');
    }
  });

  // Wait for the sales page to be visible
  cy.get('[data-cy="sales-page"]', { timeout: 3000 }).should('be.visible');
});

//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.on('window:before:load', (win) => {
  cy.stub(win, 'open').as('windowOpen');
});

before(() => {
  const style = document.createElement('style');
  style.innerHTML = `
    .toolbar-container { position: absolute !important; }
    ion-content { overflow: visible !important; height: auto !important; }
  `;
  document.head.appendChild(style);
});
