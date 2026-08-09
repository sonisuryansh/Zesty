# 🤝 Contributing to Zesty

Thank you for contributing to Zesty! Please follow these development standards and code guidelines.

---

## 🛠️ Local Development Setup

1. **Fork & Clone repository**:
   ```bash
   git clone https://github.com/your-username/Zesty.git
   cd Zesty
   ```

2. **Backend Configuration**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npx nodemon server.js
   ```

3. **Frontend Configuration**:
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

---

## 🎨 Code Style Guidelines

- **Frontend**: Use functional React components with hooks. Maintain design tokens in `src/App.css`. Do not add TailwindCSS unless explicitly instructed.
- **Backend**: Use CommonJS module exports (`require`/`module.exports`). Ensure all async controller functions use try-catch blocks and return descriptive JSON error responses.
- **Data Integrity**: Never hardcode dummy or mock user strings into production flows. Always test builds with `npm run build` in `frontend/` before committing.
