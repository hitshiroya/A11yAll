// cypress/support/e2e.js

// Import cypress-axe commands
import 'cypress-axe'

// Add custom commands or global configurations here
Cypress.Commands.add('waitForPageLoad', () => {
    cy.get('body', { timeout: 10000 }).should('be.visible');
});

// Handle uncaught exceptions to prevent tests from failing on external site errors
Cypress.on('uncaught:exception', (err, runnable) => {
    // Ignore certain errors that might occur on external sites
    if (err.message.includes('Script error') || 
        err.message.includes('Non-Error promise rejection captured') ||
        err.message.includes('ResizeObserver loop limit exceeded')) {
        return false;
    }
    // Return true to fail the test on other errors
    return true;
});