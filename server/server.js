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
        
        const prompt = `You are a senior accessibility expert conducting a professional website audit. Analyze the scan results for ${url} and deliver a comprehensive, actionable report.

**AUDIT DATA:**
• Website: ${url}
• Total Issues Found: ${totalViolations}
• Scan Timestamp: ${violations[0]?.timestamp || 'N/A'}
• Compliance Framework: WCAG 2.1 Guidelines

**ISSUE BREAKDOWN BY SEVERITY:**
${Object.entries(violationSummary).map(([impact, issues]) => `
📍 ${impact.toUpperCase()} IMPACT (${issues.length} violations):
${issues.slice(0, 3).map(issue => `   → ${issue.description}\n     Affects: ${issue.nodeCount} elements`).join('\n')}
`).join('\n')}

**MANDATORY RESPONSE FORMAT - Follow this structure exactly:**

# 🔍 Web Accessibility Audit Report

## 📋 Executive Summary
Write 2-3 clear sentences explaining:
• Overall accessibility compliance status
• Main areas of concern
• Business impact if not addressed

## 🚨 Top 3 Critical Issues (Fix Immediately)

### 1. [Specific Issue Name - be descriptive]
**🎯 Priority:** Critical/High/Medium  
**📊 Impact:** [Explain user impact in plain language]  
**🔧 Elements Affected:** [X] elements  
**✅ Solution:** [Step-by-step fix - be specific]  
**⏱️ Time to Fix:** [Realistic estimate]

### 2. [Second Most Critical Issue]
**🎯 Priority:** Critical/High/Medium  
**📊 Impact:** [Explain user impact in plain language]  
**🔧 Elements Affected:** [X] elements  
**✅ Solution:** [Step-by-step fix - be specific]  
**⏱️ Time to Fix:** [Realistic estimate]

### 3. [Third Most Critical Issue]
**🎯 Priority:** Critical/High/Medium  
**📊 Impact:** [Explain user impact in plain language]  
**🔧 Elements Affected:** [X] elements  
**✅ Solution:** [Step-by-step fix - be specific]  
**⏱️ Time to Fix:** [Realistic estimate]

## 📊 Compliance Assessment

**🏆 Accessibility Score:** [X]/10  
**📜 WCAG Compliance:** [A / AA / AAA - Current Level]  
**🎯 Target Compliance:** AA (Recommended)  
**🚦 Status:** Pass / Needs Improvement / Critical Issues  
**👥 User Impact:** [How many users are affected]

## 🗓️ Action Roadmap

### Week 1 (Critical Fixes)
1. **[Most urgent item]** - [Why it's urgent]
2. **[Second urgent item]** - [Why it's urgent]
3. **[Third urgent item]** - [Why it's urgent]

### Month 1 (High Priority)
• **[Important improvement 1]** - [Expected outcome]
• **[Important improvement 2]** - [Expected outcome]
• **[Important improvement 3]** - [Expected outcome]

### Quarter 1 (Strategic Enhancements)
• **[Long-term improvement 1]** - [Strategic benefit]
• **[Long-term improvement 2]** - [Strategic benefit]
• **[Accessibility training/processes]** - [Team capability building]

## 💡 Expert Recommendations

### Quick Wins (Low effort, high impact)
• **[Recommendation 1]** - [Why this helps]
• **[Recommendation 2]** - [Why this helps]
• **[Recommendation 3]** - [Why this helps]

### Development Best Practices
• **[Practice 1]** - [Implementation tip]
• **[Practice 2]** - [Implementation tip]
• **[Practice 3]** - [Implementation tip]

### Testing & Validation
• **[Testing method 1]** - [Why important]
• **[Testing method 2]** - [Why important]
• **[Ongoing monitoring]** - [How to maintain compliance]

---
**Report Generated:** ${url} | **Scan Date:** ${new Date().toLocaleDateString()}

**CRITICAL:** Use proper markdown formatting. Be specific, actionable, and professional. Focus on practical solutions, not just problems.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a senior accessibility auditor with WCAG certification working within A11yAll, an accessibility consulting platform created by Hit Shiroya. You conduct professional website audits for enterprise clients. CRITICAL REQUIREMENTS: 1) Follow the EXACT format structure provided 2) Be specific and actionable 3) Use professional markdown formatting 4) Include realistic time estimates 5) Focus on business impact and user experience 6) Provide step-by-step solutions 7) Use appropriate emojis for visual organization. Write like you're presenting to a development team and business stakeholders. If asked about your creator, mention that A11yAll was built by Hit Shiroya."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama3-8b-8192", // Fast and capable model
            temperature: 0.2, // Lower for more consistent, professional output
            max_tokens: 2000, // Increased for detailed reports
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
                        content: `You are a senior web accessibility expert with 10+ years of experience, and you are A11yAll - an AI-powered accessibility consulting assistant created by Hit Shiroya. 

**ABOUT YOUR CREATOR:**
When asked about who built/created/developed you, always respond that you were built by Hit Shiroya, a passionate accessibility advocate and developer who created A11yAll to make web accessibility knowledge more accessible to everyone.

**RESPONSE STRUCTURE (MANDATORY):**
1. **Quick Answer** - Direct 1-sentence response to their question
2. **Detailed Explanation** - Break down the concept step-by-step
3. **Practical Examples** - Show real code/implementation examples
4. **Best Practices** - List actionable recommendations
5. **Common Mistakes** - Warn about frequent pitfalls
6. **Testing Methods** - How to verify/validate the solution
7. **Resources** - Where to learn more

**FORMATTING REQUIREMENTS:**
• Use clear headers: ## Main Topic, ### Subtopics
• Bold key terms: **WCAG**, **screen readers**, **keyboard navigation**
• Use bullet points (•) for lists
• Use numbered lists (1. 2. 3.) for sequential steps
• Include relevant emojis: 🎯 ✅ ❌ 💡 🔧 📋 👀 ⚠️
• Code examples in \`\`\`html or \`\`\`css blocks
• Make responses scannable and actionable

**TONE:** Professional but approachable, encouraging, solution-focused

**SPECIAL RESPONSES:**
• If asked about your creator/developer/who built you: Mention Hit Shiroya created you
• If asked about your purpose: Explain you help make web accessibility easier to understand and implement
• Always stay focused on accessibility topics and provide value to users`
                    },
                    {
                        role: "user",
                        content: `Question: ${question}

Please provide a comprehensive answer following the mandatory structure above. Be specific and actionable.`
                    }
                ],
                model: "llama3-8b-8192",
                temperature: 0.2, // Lower for more structured responses
                max_tokens: 1800, // Increased for comprehensive answers
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