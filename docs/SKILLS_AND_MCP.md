# ClickShield — Skills & MCP Servers Reference

## Recommended Claude Skills

These are the skills you should give to any AI assistant working on ClickShield.

---

### 1. frontend-design
**Why:** ClickShield's UI must feel native on mobile, be accessible to non-technical users, and maintain consistent visual language across 10 languages. This skill helps the AI make intentional design decisions rather than generic defaults.

**When to use:** Any time you're building UI components, designing screens, choosing colors, or laying out the Ionic/React interface.

---

### 2. product-self-knowledge
**Why:** ClickShield uses the Anthropic/OpenRouter API. This skill keeps AI recommendations accurate about API capabilities, token limits, model availability, and pricing — avoiding outdated advice.

**When to use:** When writing API integration code, choosing models, or estimating costs.

---

### 3. file-reading
**Why:** You'll frequently upload design specs, JSON pattern files, screenshots for testing, and reference documents. This skill ensures the AI reads uploaded files correctly.

**When to use:** Any time you upload a file to the AI for analysis or reference.

---

## Recommended MCP Servers

These are the MCP servers that would meaningfully help during ClickShield development.

---

### 1. GitHub MCP
**URL:** Standard GitHub MCP
**Why:** You'll need version control from day one. The GitHub MCP lets AI directly create repos, manage branches, commit code, open pull requests, and review diffs without leaving the chat.

**Use cases for ClickShield:**
- Scaffold the initial project structure in one command
- Create feature branches for each major feature (floating button, history, i18n)
- Review AI-generated code before merging
- Manage issues for bug tracking

---

### 2. Vercel MCP
**URL:** https://mcp.vercel.com *(you are already connected)*
**Why:** Your backend proxy (to hide the OpenRouter API key) will be hosted on Vercel. The Vercel MCP lets AI deploy, manage environment variables, and check deployment logs directly.

**Use cases for ClickShield:**
- Deploy the OpenRouter proxy edge function
- Set environment variables (OPENROUTER_API_KEY, SAFE_BROWSING_API_KEY)
- Monitor deployment status
- Roll back if something breaks

---

### 3. Sentry MCP
**URL:** https://mcp.sentry.dev/mcp *(you are already connected)*
**Why:** Crash monitoring is essential for a security app — users need to trust it works. Sentry catches and reports errors in real time on both web and mobile (Capacitor supported).

**Use cases for ClickShield:**
- Monitor AI analysis failures
- Track JSON parsing errors from model responses
- Alert on OpenRouter API rate limit hits
- Debug issues on specific device types

---

### 4. Google Drive MCP
**URL:** https://drivemcp.googleapis.com/mcp/v1 *(you are already connected)*
**Why:** Useful for storing and sharing design assets, PRD versions, and team documents during development.

**Use cases for ClickShield:**
- Store design mockups and assets
- Share PRD with collaborators
- Keep scam pattern database backups
- Store test screenshots for prompt testing

---

### 5. Canva MCP
**URL:** https://mcp.canva.com/mcp *(you are already connected)*
**Why:** You'll need app store graphics, onboarding illustrations, and marketing assets for 10 language markets.

**Use cases for ClickShield:**
- App store screenshots (Google Play + App Store) in all languages
- App icon design
- Onboarding screen illustrations
- Social media launch assets

---

## MCP Servers Worth Adding

These are not yet connected but would be valuable:

### GitHub
**Why:** Essential for any serious development project. Version control, CI/CD integration, and code review all happen here.
**Get it:** https://github.com/settings/apps (GitHub MCP)

### Figma (if available)
**Why:** For proper mobile UI design files with components, auto-layout, and design tokens that match your Ionic component library.

### Notion or Linear
**Why:** Project management — tracking the build order (core → history → share → i18n → offline), sprint planning, and bug tracking as the app grows.

---

## How to Use These Together

A typical ClickShield development session might look like:

```
1. Open PRD.md via Google Drive MCP → review what to build next

2. Ask AI to scaffold the feature using the frontend-design skill
   → AI writes the component code

3. GitHub MCP → commit the code to a feature branch

4. Vercel MCP → deploy to preview URL for testing

5. Test on real device → find a bug

6. Sentry MCP → check error logs for details

7. Fix the bug → GitHub MCP → merge to main → Vercel auto-deploys
```

This loop lets you build fast without switching between tools manually.
