const { defineConfig } = require("cypress");
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Results file should be in the server directory
      const filePath = path.join(__dirname, 'server', 'cypress-a11y-results.json');
      
      console.log(`[Cypress Config] Results file path: ${filePath}`);
      console.log(`[Cypress Config] Current working directory: ${process.cwd()}`);
      console.log(`[Cypress Config] Config file directory: ${__dirname}`);

      on('task', {
        saveA11yViolations({ visitUrl, pageName, violations }) {
          console.log(`[Cypress Task] Saving ${violations.length} violations for ${visitUrl}`);
          
          let existingData = [];

          // Ensure the directory exists
          const dirPath = path.dirname(filePath);
          if (!fs.existsSync(dirPath)) {
            console.log(`[Cypress Task] Creating directory: ${dirPath}`);
            fs.mkdirSync(dirPath, { recursive: true });
          }

          // Check if the results file already exists
          if (fs.existsSync(filePath)) {
            try {
              const fileContent = fs.readFileSync(filePath, 'utf-8');
              existingData = JSON.parse(fileContent);
              if (!Array.isArray(existingData)) {
                console.warn(`[Cypress Task] Existing data file is not an array. Starting fresh.`);
                existingData = [];
              }
            } catch (err) {
              console.error(`[Cypress Task] Failed to parse existing JSON from ${filePath}:`, err);
              existingData = [];
            }
          }

          // Append the new accessibility test result
          const newResult = {
            visitUrl: visitUrl,
            pageName: pageName,
            timestamp: new Date().toISOString(),
            violations: violations
          };

          existingData.push(newResult);

          // Write the updated data back to the file
          try {
            fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
            console.log(`[Cypress Task] Successfully wrote ${existingData.length} results to: ${filePath}`);
          } catch (writeError) {
            console.error(`[Cypress Task] Failed to write to ${filePath}:`, writeError);
            throw writeError;
          }

          return null;
        },
      });

      return config;
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    video: false,
    screenshots: false,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    chromeWebSecurity: false, // Disable web security for testing external sites
    experimentalSessionAndOrigin: false
  },
});