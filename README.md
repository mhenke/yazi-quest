<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Yazi Quest

Yazi Quest is an interactive, terminal-style game designed to teach the keybindings and workflows of the Yazi file manager. Through a cyberpunk narrative where you play as a sentient AI, you'll learn to navigate, manipulate files, and master advanced commands in a sandboxed environment.

View your app in AI Studio: https://ai.studio/apps/drive/1ceZ1bv8DUISsPb5Ysa83PHU8qdxov1U8

## Run Locally

**Prerequisites:** Node.js

1.  **Install dependencies:**
    `npm install`
2.  **Set up your environment:**
    Create a new file named `.env.local` in the project root.
    Add your Gemini API key to the file:
    `GEMINI_API_KEY=YOUR_API_KEY`
3.  **Run the app:**
    `npm run dev`

---

Security & Local Dev Notes

- Create a `.env.local` from `.env.local.template` (if present) and add any optional API keys such as `GEMINI_API_KEY` there. Do NOT commit secrets to the repository—ensure `.env.local` is listed in `.gitignore`.
- The Gemini key is optional for local development; the app includes fallbacks when the key is not provided. Use a dedicated dev key and rotate it regularly.
husky-test 2025-12-31T22:22:33Z
