/// <reference types="cypress" />

describe('Accessibility Test Run', () => {
    it('Check accessibility', () => {
        // Get the URL from environment variable passed by the server
        const visitUrl = Cypress.env('targetUrl') || "https://facebook.com";
        const pageName = "Accessibility Test Page";
        
        console.log(`Testing URL: ${visitUrl}`);
        
        // Visit the URL with error handling
        cy.visit(visitUrl, {
            failOnStatusCode: false,
            timeout: 30000
        });
        
        // Wait for page to load
        cy.waitForPageLoad();
        
        // Inject axe-core
        cy.injectAxe();
        
        // Wait a bit for any dynamic content
        cy.wait(2000);
        
        // Run accessibility check
        cy.checkA11y(null, {
            // Configure axe options if needed
            includedImpacts: ['minor', 'moderate', 'serious', 'critical']
        }, (violations) => {
            console.log(`Found ${violations.length} accessibility violations`);
            cy.task("saveA11yViolations", { visitUrl, pageName, violations });
        });
    });
});