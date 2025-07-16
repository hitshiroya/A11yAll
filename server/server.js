// a11y-insights-tool/server/server.js
const express = require('express');
const { exec } = require('child_process'); // To execute shell commands (like Cypress)
const fs = require('fs').promises; // Node.js File System module (for async operations)
const path = require('path'); // Node.js Path module for handling file paths
const cors = require('cors');
require('dotenv').config(); // Load environment variables

// --- AI/LLM Client Setup with Groq ---
const Groq = require('groq-sdk');
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});
// ------------------------------------

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all routes (important for frontend communication)
app.use(express.json()); // Parse JSON request bodies

// Helper function to generate AI analysis of accessibility violations using Groq
async function generateAccessibilityAnalysis(url, violations) {
    if (!process.env.GROQ_API_KEY) {
        return `I scanned **${url}** and found ${violations.reduce((sum, result) => sum + result.violations.length, 0)} accessibility ${violations.reduce((sum, result) => sum + result.violations.length, 0) === 1 ? 'issue' : 'issues'}. Please add your GROQ_API_KEY to get detailed AI analysis.`;
    }

    try {
        // Create a summary of violations by impact level
        const violationSummary = violations.reduce((acc, result) => {
            result.violations.forEach(violation => {
                const impact = violation.impact || 'unknown';
                if (!acc[impact]) acc[impact] = [];
                acc[impact].push({
                    id: violation.id,
                    description: violation.description,
                    help: violation.help,
                    nodeCount: violation.nodes.length
                });
            });
            return acc;
        }, {});

        const totalViolations = violations.reduce((sum, result) => sum + result.violations.length, 0);
        
        const prompt = `You are an expert accessibility consultant. Analyze the accessibility scan results for ${url} and provide a comprehensive, well-structured report.

**SCAN DATA:**
- Total violations: ${totalViolations}
- URL: ${url}
- Timestamp: ${violations[0]?.timestamp || 'N/A'}

**VIOLATIONS BY IMPACT:**
${Object.entries(violationSummary).map(([impact, issues]) => `
${impact.toUpperCase()} (${issues.length} issues):
${issues.slice(0, 3).map(issue => `• ${issue.description} (${issue.nodeCount} elements)`).join('\n')}
`).join('\n')}

**FORMAT YOUR RESPONSE EXACTLY LIKE THIS STRUCTURE:**

# 🔍 Accessibility Analysis Report

## 📊 Executive Summary
[Write 2-3 sentences about the overall accessibility state and compliance level]

## 🚨 Critical Issues to Fix First

### 1. [Most Critical Issue Name]
**Impact Level:** High/Medium/Low  
**Elements Affected:** [Number] elements  
**Quick Fix:** [Specific, actionable solution in 1-2 sentences]

### 2. [Second Critical Issue]
**Impact Level:** High/Medium/Low  
**Elements Affected:** [Number] elements  
**Quick Fix:** [Specific, actionable solution in 1-2 sentences]

### 3. [Third Critical Issue]  
**Impact Level:** High/Medium/Low  
**Elements Affected:** [Number] elements  
**Quick Fix:** [Specific, actionable solution in 1-2 sentences]

## 📈 Accessibility Score
**Overall Score:** [X]/10  
**WCAG Grade:** [A, AA, or AAA compliance level]  
**Status:** [Pass/Needs Work/Critical Issues]

## 🎯 Priority Action Plan
1. **Immediate (This Week):** [Most urgent fix]
2. **Short Term (This Month):** [Important improvements]  
3. **Long Term (Next Quarter):** [Comprehensive enhancements]

## 💡 Pro Tips for Better Accessibility
• [Practical tip 1]
• [Practical tip 2]  
• [Practical tip 3]

---
*Report generated for ${url}*

**IMPORTANT:** Use proper markdown formatting with headers (# ## ###), bold text (**text**), bullet points (•), and emojis. Make it visually appealing and easy to scan like ChatGPT responses.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert accessibility consultant. ALWAYS respond with well-formatted markdown using headers (# ## ###), bold text (**text**), bullet points (•), numbered lists (1. 2. 3.), and relevant emojis. Follow the exact format structure provided in the prompt. Make responses visually appealing and easy to scan like ChatGPT. Be specific, practical, and encouraging."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama3-8b-8192", // Fast and capable model
            temperature: 0.3,
            max_tokens: 1500,
        });

        return chatCompletion.choices[0]?.message?.content || 'Unable to generate analysis';
    } catch (error) {
        console.error('Error generating Groq analysis:', error);
        const totalViolations = violations.reduce((sum, result) => sum + result.violations.length, 0);
        return `I scanned **${url}** and found ${totalViolations} accessibility ${totalViolations === 1 ? 'issue' : 'issues'}. AI analysis failed: ${error.message}`;
    }
}

app.post('/api/scan-url', async (req, res) => {
    const { url } = req.body;
    console.log("body url is", url);

    if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required in the request body.' });
    }

    const resultsFilePath = path.join(__dirname, 'cypress-a11y-results.json');
    console.log(`Results file path: ${resultsFilePath}`);
    
    // Clean up any existing results file
    try {
        await fs.access(resultsFilePath);
        await fs.unlink(resultsFilePath);
        console.log('Cleaned up existing results file');
    } catch (cleanupError) {
        console.log('No existing results file to clean up');
    }
    
    const cypressCommand = `npx cypress run --config-file ./cypress.config.js --env targetUrl="${url}" --headless`;

    let aiResponseText;

    try {
        console.log(`[Backend] Starting accessibility scan for: ${url}`);

        const workingDir = path.resolve(__dirname, '..');
        console.log(`[Backend] Working directory: ${workingDir}`);
        
        // Run Cypress test
        await new Promise((resolve, reject) => {
            exec(cypressCommand, { 
                cwd: workingDir,
                timeout: 120000, // 2 minute timeout
                maxBuffer: 1024 * 1024 * 10, // 10MB buffer
                env: { ...process.env }
            }, (error, stdout, stderr) => {
                console.log(`[Backend] Cypress scan completed`);
                
                if (error) {
                    // For accessibility tests, "failure" often means violations were found (expected)
                    console.log(`[Backend] Cypress completed with violations found (this is normal)`);
                }
                resolve();
            });
        });

        // Read the accessibility violations from the results file
        let violations = [];
        try {
            const fileContent = await fs.readFile(resultsFilePath, 'utf8');
            violations = JSON.parse(fileContent);
            console.log(`[Backend] Found ${violations.length} violation entries in results file`);
            
            // Keep the file for reference - don't delete it
        } catch (fileError) {
            console.warn(`[Backend] Could not read violations file: ${fileError.message}`);
            violations = [];
        }

        // Generate AI analysis using Groq
        if (!aiResponseText) {
            if (violations.length === 0) {
                aiResponseText = `🎉 **Excellent!** I scanned **${url}** and found no accessibility violations.\n\nYour website passed all automated accessibility tests! However, remember that automated testing catches only about 30-40% of accessibility issues, so manual testing with screen readers is still recommended.`;
            } else {
                console.log(`[Backend] Generating Groq AI analysis for violations...`);
                aiResponseText = await generateAccessibilityAnalysis(url, violations);
            }
        }

        res.json({ success: true, answer: aiResponseText });

    } catch (err) {
        console.error('[Backend] Server error during accessibility test:', err);
        res.status(500).json({ 
            success: false, 
            message: 'An internal server error occurred during the accessibility test.',
            details: err.message 
        });
    }
});

// Test endpoint for Cypress
app.post('/api/test-cypress', async (req, res) => {
    const workingDir = path.resolve(__dirname, '..');
    const testCommand = 'npx cypress run --config-file ./cypress.config.js --env targetUrl="https://example.com" --headless';
    
    console.log(`[Test] Running: ${testCommand}`);
    
    exec(testCommand, { cwd: workingDir }, (error, stdout, stderr) => {
        res.json({
            error: error ? error.message : null,
            stdout: stdout.substring(0, 1000) + '...', // Truncate for readability
            stderr: stderr,
            workingDir: workingDir
        });
    });
});

// General chat endpoint using Groq
app.post('/api/chat-general', async (req, res) => {
    const { question } = req.body;

    if (!question || question.trim() === '') {
        return res.status(400).json({ success: false, message: 'Question cannot be empty.' });
    }

    console.log(`[Backend] Received general question: "${question}"`);

    if (process.env.GROQ_API_KEY) {
        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are an expert accessibility consultant. ALWAYS respond with well-formatted markdown using headers (## ###), bold text (**text**), bullet points (•), numbered lists (1. 2. 3.), and relevant emojis. Make responses visually appealing and easy to scan like ChatGPT. Be specific, practical, and encouraging. Use code blocks for code examples with ```html or ```css."
                    },
                    {
                        role: "user",
                        content: `Please answer this accessibility question with proper markdown formatting:\n\n${question}`
                    }
                ],
                model: "llama3-8b-8192",
                temperature: 0.3,
                max_tokens: 1500,
            });

            res.json({
                success: true,
                answer: chatCompletion.choices[0]?.message?.content || 'Unable to generate response'
            });
        } catch (error) {
            console.error('Error generating Groq response:', error);
            res.json({
                success: true,
                answer: `I received your question: "${question}". AI analysis failed: ${error.message}`
            });
        }
    } else {
        res.json({
            success: true,
            answer: `Hello! I received your question: "${question}". Please add your GROQ_API_KEY environment variable to get AI-powered responses.`
        });
    }
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('📝 Make sure your React frontend is running on http://localhost:5173');
    console.log('🔑 Add GROQ_API_KEY to your environment variables for AI features');
});