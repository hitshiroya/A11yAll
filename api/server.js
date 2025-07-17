// A11yAll - Live Accessibility Scanning API
const express = require('express');
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

// Helper function to provide URL analysis when Cypress is not available
async function generateUrlAnalysisWithoutScan(url) {
    if (!process.env.GROQ_API_KEY) {
        return `I received a request to analyze **${url}**, but I'm currently running in a serverless environment where I cannot perform live accessibility scans. Please add your GROQ_API_KEY to get AI-powered analysis and recommendations.`;
    }

    try {
        const prompt = `You are a senior accessibility expert. A user has requested analysis of ${url}, but live accessibility scanning is not available in this serverless environment. 

Provide helpful guidance about:
1. How to manually check accessibility
2. Common accessibility issues to look for on websites
3. Tools they can use to scan the website themselves
4. General best practices for the type of website they're analyzing

Format your response professionally with actionable advice.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a senior accessibility expert working within A11yAll, created by Hit Shiroya. Provide helpful, actionable accessibility guidance even when live scanning isn't available. Be encouraging and provide practical alternatives."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama3-8b-8192",
            temperature: 0.3,
            max_tokens: 1500,
        });

        return chatCompletion.choices[0]?.message?.content || 'Unable to generate analysis';
    } catch (error) {
        console.error('Error generating URL analysis:', error);
        return `I received a request to analyze **${url}**. In this serverless environment, I cannot perform live scans, but I can help you with accessibility best practices and manual testing guidance. AI analysis failed: ${error.message}`;
    }
}

app.post('/api/scan-url', async (req, res) => {
    const { url } = req.body;
    console.log("Received URL for analysis:", url);

    if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required in the request body.' });
    }

    try {
        console.log(`[Backend] Starting live accessibility scan for: ${url}`);
        
        // Import Playwright and axe-core dynamically
        const { chromium } = require('playwright');
        const AxeBuilder = require('@axe-core/playwright').default;

        // Launch browser with optimized settings for serverless
        const browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-extensions',
                '--no-first-run',
                '--disable-default-apps'
            ]
        });

        const context = await browser.newContext({
            userAgent: 'A11yAll-Bot/1.0 (+https://a11yagent.vercel.app) Accessibility Scanner'
        });
        
        const page = await context.newPage();

        // Set reasonable timeouts for serverless
        page.setDefaultTimeout(30000);
        page.setDefaultNavigationTimeout(30000);

        // Navigate to the URL
        await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });

        // Wait a bit for dynamic content to load
        await page.waitForTimeout(2000);

        // Run comprehensive accessibility scan
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
            .analyze();

        await browser.close();

        console.log(`[Backend] Scan completed. Found ${results.violations.length} violations`);

        // Convert axe results to our expected format for AI analysis
        const violationsData = [{
            violations: results.violations,
            timestamp: new Date().toISOString(),
            url: url,
            testEngine: 'axe-core + playwright'
        }];

        // Generate AI analysis using existing function
        const aiResponseText = await generateAccessibilityAnalysis(url, violationsData);

        res.json({
            success: true,
            answer: aiResponseText,
            scanDetails: {
                totalViolations: results.violations.length,
                passedRules: results.passes.length,
                incompleteRules: results.incomplete.length,
                engine: 'Playwright + axe-core',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error(`[Backend] Live scan error: ${error.message}`);
        
        // Fallback to helpful guidance if scan fails
        try {
            const analysis = await generateUrlAnalysisWithoutScan(url);
            return res.json({
                success: true,
                answer: `# ⚠️ Scan Error - Alternative Analysis for ${url}

## 🚨 Technical Issue
I encountered an error while performing the live accessibility scan: **${error.message}**

However, I can still provide you with comprehensive guidance!

${analysis}

## 🔧 **Recommended Tools for Live Scanning:**

### **Browser Extensions:**
• **axe DevTools** - Free browser extension by Deque
• **WAVE** - Web Accessibility Evaluation Tool  
• **Lighthouse** - Built into Chrome DevTools

### **Online Tools:**
• **WebAIM WAVE** - wave.webaim.org
• **axe Monitor** - Free tier available
• **Pa11y** - Command line accessibility tester

### **Manual Testing:**
• **Keyboard Navigation** - Tab through the entire site
• **Screen Reader** - Test with NVDA (free) or JAWS
• **Color Contrast** - Use WebAIM Contrast Checker

---
*Please try the scan again in a moment, or use the tools above for immediate analysis.*`
            });
        } catch (fallbackError) {
            return res.status(500).json({
                success: false,
                message: `Scan failed: ${error.message}. Fallback analysis also failed: ${fallbackError.message}`
            });
        }
    }
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

// Export the Express app for Vercel serverless functions
module.exports = app;

// For local development, start the server if not in Vercel environment
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log('📝 Make sure your React frontend is running on http://localhost:5173');
        console.log('🔑 Add GROQ_API_KEY to your environment variables for AI features');
    });
}