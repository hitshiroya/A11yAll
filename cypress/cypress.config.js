// cypress/cypress.config.js
const { defineConfig } = require("cypress");
const fs = require('fs'); // Correctly imported: Node.js File System module
const path = require('path'); // Correctly imported: Node.js Path module

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Define the path for the accessibility results file.
      // This path should be relative to where your 'server.js' is,
      // as the server will read this file.
      // __dirname here refers to 'a11y-insights-tool/cypress/'
      // '../server/' navigates up one level to 'a11y-insights-tool/'
      // then into the 'server/' directory.
      const filePath = path.join(__dirname, '../server/cypress-a11y-results.json');

      // Register Cypress tasks. Tasks allow communication from Cypress tests (browser context)
      // to the Node.js environment where Cypress itself is running.
      on('task', {
        // Define the 'saveA11yViolations' task.
        // It expects a single argument, which is an object containing
        // 'visitUrl', 'pageName', and 'violations'.
        // We use object destructuring here to easily access these properties.
        saveA11yViolations({ visitUrl, pageName, violations }) { // <-- CORRECTED SIGNATURE HERE
          let existingData = [];

          // Check if the results file already exists
          if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            try {
              // Parse existing JSON data. Ensure it's an array.
              existingData = JSON.parse(fileContent);
              if (!Array.isArray(existingData)) {
                console.warn(`[Cypress Task] Existing data file is not an array. Starting fresh.`);
                existingData = []; // Reset if content is malformed or not an array
              }
            } catch (err) {
              // Handle parsing errors (e.g., malformed JSON) gracefully
              console.error(`[Cypress Task] Failed to parse existing JSON from ${filePath}:`, err);
              existingData = []; // Start with an empty array if parsing fails
            }
          }

          // Append the new accessibility test result to the existing data
          existingData.push({
            visitUrl: visitUrl, // Now correctly populated from the task argument
            pageName: pageName, // Now correctly populated from the task argument
            timestamp: new Date().toISOString(), // Adds a timestamp for when the scan was done
            violations: violations // The array of axe-core violation objects
          });

          // Write the updated data back to the file
          fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2)); // null, 2 for pretty-printing JSON
          console.log(`[Cypress Task] Appended a11y result for "${pageName}" (${visitUrl}) to: ${filePath}`);

          return null; // Cypress tasks must return a value or a Promise. Returning null is fine for side effects.
        },
      });

      return config; // Always return the modified config object from setupNodeEvents
    },
    // Other e2e specific configurations
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}', // Pattern to find your test files
    supportFile: 'cypress/support/e2e.js',             // Global support file for Cypress commands
    video: false,      // Set to true if you want video recordings of runs (can be large files)
    screenshots: false // Set to true if you want screenshots on test failure
  },
});