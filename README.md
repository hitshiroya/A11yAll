# 🚀 A11yAll - AI-Powered Accessibility Consultant

> Your intelligent accessibility companion for building inclusive web experiences

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)
[![React](https://img.shields.io/badge/React-18+-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)

## ✨ Features

🎯 **AI-Powered Guidance** - Get expert accessibility advice powered by Groq AI  
🔍 **URL Analysis** - Comprehensive accessibility scanning with actionable recommendations  
🎨 **Accessible Design** - Beautiful dark theme with WCAG AA compliance  
📚 **Educational Content** - Learn accessibility best practices with real examples  
🛠️ **Tool Recommendations** - Curated list of accessibility testing tools  
⚡ **Fast & Modern** - Built with React, Vite, and modern web standards  

## 🌟 Live Demo

🚀 **[Try A11yAll Live](https://your-deployment-url.vercel.app)**

## 🛠️ Tech Stack

**Frontend:**
- React 19+ with Vite
- CSS Custom Properties (Dark Theme)
- React Markdown for rich content
- Axios for API communication

**Backend:**
- Node.js with Express
- Groq AI API integration
- Cypress for accessibility testing (local development)
- CORS enabled for cross-origin requests

**Deployment:**
- Vercel (recommended) or Netlify
- Serverless functions for API endpoints
- Environment-based configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- [Groq API key](https://console.groq.com) (free)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hitshiroya/A11yAll.git
   cd A11yAll
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies (Cypress)
   npm install
   
   # Install client dependencies
   cd client && npm install && cd ..
   
   # Install server dependencies  
   cd server && npm install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in the root directory
   echo "GROQ_API_KEY=your_groq_api_key_here" > .env
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Start the backend server
   cd server && npm start
   
   # Terminal 2: Start the frontend
   cd client && npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variable: `GROQ_API_KEY`
   - Deploy! 🚀

3. **Alternative: One-click deploy**
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hitshiroya/A11yAll)

For detailed deployment instructions, see [deploy.md](./deploy.md)

## 🎯 Usage

### General Accessibility Questions
```
Q: "How do I make my buttons accessible?"
A: Comprehensive guide with code examples and best practices
```

### URL Analysis
```
Paste any URL: "https://example.com"
→ Get detailed accessibility analysis and recommendations
```

### Who Built This?
```
Q: "Who created A11yAll?"
A: Built by Hit Shiroya, a passionate accessibility advocate
```

## 🧪 Testing

### Run Accessibility Tests (Local Development)
```bash
# Run Cypress accessibility tests
npm run test:cypress

# Run accessibility scan on specific URL
npx cypress run --env targetUrl="https://example.com"
```

### Manual Testing Tools
- **axe DevTools** - Browser extension
- **WAVE** - Web accessibility evaluation
- **Lighthouse** - Built into Chrome DevTools

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** for AI API services
- **axe-core** for accessibility testing engine
- **Cypress** for end-to-end testing framework
- **React** and **Vite** for frontend development
- **Accessibility community** for inspiration and guidance

## 👨‍💻 Author

**Hit Shiroya**
- Email: hitp363530@gmail.com
- GitHub: [@hitshiroya](https://github.com/hitshiroya)

## 🎯 Mission

Making web accessibility knowledge accessible to everyone, one consultation at a time.

---

⭐ **Star this project** if you find it helpful for building more accessible web experiences! 