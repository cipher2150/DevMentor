# DevMentor

> **An AI-powered mentor for understanding unfamiliar codebases.**

DevMentor helps developers **explore, analyze, and understand repositories** through an interactive code explorer, visual Knowledge Map, and AI-powered mentor.

## Architecture

DevMentor follows a **full-stack JavaScript monorepo architecture** with separate client and server applications.

```text
Developer
    │
    ▼
React Frontend
    │
    ├── CodebaseExplorer
    ├── KnowledgeMap
    ├── CodeViewerModal
    └── AIMentorPanel
    │
    ▼
services/api.js
    │
    ▼
Node.js / Express Backend
    │
    ├── routes/analyze.js
    ├── routes/mentor.js
    │
    └── services/
         ├── githubService.js
         ├── codeParser.js
         ├── repositoryAnalyzer.js
         └── aiService.js
              │
              ├── GitHub
              └── LLM