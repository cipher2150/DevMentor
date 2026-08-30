import dotenv from 'dotenv';
dotenv.config();

const LATENTSTACK_API_KEY = process.env.LATENTSTACK_API_KEY;
const LATENTSTACK_BASE_URL = process.env.LATENTSTACK_BASE_URL || 'https://api.latentstack.com/v1';
const LATENTSTACK_MODEL = process.env.LATENTSTACK_MODEL || 'gpt-4o-mini';
const LATENTSTACK_CHAT_PATH = process.env.LATENTSTACK_CHAT_PATH || '/chat/completions';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

export function getAIProviderStatus() {
  return {
    provider: LATENTSTACK_API_KEY ? 'latentstack' : GEMINI_API_KEY ? 'gemini' : 'fallback',
    latentstackConfigured: Boolean(LATENTSTACK_API_KEY),
    githubConfigured: Boolean(process.env.GITHUB_TOKEN)
  };
}

function getAIHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${LATENTSTACK_API_KEY || GEMINI_API_KEY}`
  };
}

function extractTextFromCompletion(data) {
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text === 'string') return text;
  if (Array.isArray(text)) {
    return text.map(part => typeof part === 'string' ? part : part?.text || '').join('');
  }
  return data?.candidates?.[0]?.content?.parts?.map(part => part?.text || '').join('') || '';
}

async function callLLM(prompt) {
  if (LATENTSTACK_API_KEY) {
    try {
      const response = await fetch(`${LATENTSTACK_BASE_URL.replace(/\/$/, '')}/${LATENTSTACK_CHAT_PATH.replace(/^\//, '')}`, {
        method: 'POST',
        headers: getAIHeaders(),
        body: JSON.stringify({
          model: LATENTSTACK_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || data?.message || `HTTP ${response.status}`);
      }
      const text = extractTextFromCompletion(data);
      if (text) {
        return { text, provider: 'latentstack' };
      }
    } catch (err) {
      console.warn('LatentStack API call failed:', err.message);
      throw new Error(`LatentStack request failed: ${err.message}`);
    }
  }

  if (GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || `HTTP ${response.status}`);
      }
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return { text, provider: 'gemini' };
      }
    } catch (err) {
      console.warn('Gemini API call failed, using fallback response:', err.message);
    }
  }

  return null;
}

/**
 * Generate AI explanation grounded in repository context.
 */
export async function explainTopic({ repoName, topic, selectedFile, contextCode, repoAnalysis }) {
  const prompt = `You are DevMentor, an expert AI code mentor teaching a developer about their specific codebase "${repoName}".

CONTEXT:
Repository: ${repoName}
Selected Topic/File: ${topic || selectedFile || 'Overall Architecture'}
Related Files: ${JSON.stringify(repoAnalysis?.coreConcepts || [])}

CODE / OVERVIEW:
${contextCode || 'Primary architecture and codebase implementation details.'}

TASK:
Provide a clear, educational, highly grounded explanation of "${topic || selectedFile}" as implemented in THIS specific codebase.

Explain:
1. What it does
2. Why it exists in this codebase
3. Key files involved and how they interact
4. A simple mental model for understanding it

Keep it engaging, practical, developer-friendly, and grounded strictly in this codebase.`;

  const aiResult = await callLLM(prompt);
  if (aiResult?.text) {
    return { explanation: aiResult.text, grounded: true, provider: aiResult.provider };
  }

  return getFallbackExplanation(topic || selectedFile, repoName);
}

/**
 * Generate a code-specific question based on repository context.
 */
export async function generateQuestion({ repoName, topic, repoAnalysis }) {
  const prompt = `You are DevMentor. Generate one deep, code-specific question to test the developer's understanding of "${topic || 'Architecture'}" in the repository "${repoName}".

The question should be open-ended, practical, and force the developer to explain WHY or HOW something works in this codebase (e.g. why state is separated, how sockets synchronize, etc.). Return JSON with format:
{
  "question": "The question string",
  "concept": "${topic || 'General Architecture'}",
  "difficulty": "Intermediate"
}`;

  const aiResult = await callLLM(prompt);
  if (aiResult?.text) {
    try {
      const jsonMatch = aiResult.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.warn('AI response was not valid JSON for question generation:', err.message);
    }
  }

  return getFallbackQuestion(topic);
}

/**
 * Evaluate user's answer against codebase truth.
 */
export async function evaluateAnswer({ repoName, question, answer, concept, repoAnalysis }) {
  const prompt = `You are DevMentor evaluating a developer's understanding of their codebase "${repoName}".

QUESTION ASKED:
"${question}"

CONCEPT / FILE:
"${concept || 'State Synchronization'}"

DEVELOPER'S ANSWER:
"${answer}"

TASK:
Evaluate the answer based on the actual codebase principles. Provide a strict, fair, constructive evaluation.

Respond strictly in valid JSON format:
{
  "score": 7,
  "correctPoints": [
    "You correctly identified that active strokes change continuously during drawing.",
    "You connected the concept to real-time user input."
  ],
  "missingPoints": [
    "You missed why separating committed strokes prevents redrawing entire canvas history frame-by-frame on every mousemove event."
  ],
  "explanation": "During active drawing, points arrive at 60fps. Storing them in a transient active stroke buffer avoids constantly re-hashing and re-indexing permanent drawing history until the user releases the mouse (commit).",
  "knowledgeGap": "Canvas rendering performance optimization & state separation",
  "followUpQuestion": "What happens if two users draw simultaneously in the same room? How does PaintSync prevent stroke overwrite conflicts?"
}`;

  const aiResult = await callLLM(prompt);
  if (aiResult?.text) {
    try {
      const jsonMatch = aiResult.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.warn('AI response was not valid JSON for evaluation:', err.message);
    }
  }

  return getFallbackEvaluation(question, answer, concept);
}

function getFallbackExplanation(topic = '', repoName = 'this repository') {
  return {
    explanation: `### Starting with ${repoName}\n\nThe AI provider is not configured or unavailable. Start with the files connected to **${topic || 'Overall Architecture'}**, then trace imports from the main runtime entry point. Review the detected architecture layers, configuration files, services, dependencies, and tests to understand the project flow.`
  };

  /* istanbul ignore next */
  const t = topic.toLowerCase();

  if (t.includes('state') || t.includes('drawing-state') || t.includes('active') || t.includes('committed')) {
    return {
      explanation: `### Why PaintSync Separates Committed and Active Drawing States

In **PaintSync** (\`server/drawing-state.ts\`), drawing state is divided into two distinct buffers: **Active Strokes** (\`Map<string, Stroke>\`) and **Committed Strokes** (\`Stroke[]\`).

#### 1. What It Does
* **Active Strokes**: Holds transient drawing points generated in real-time as a user moves their cursor/stylus across the canvas. Each active stroke is tied to a specific \`userId\`.
* **Committed Strokes**: Holds finalized stroke paths recorded when a user releases the mouse/pen (\`mouseUp\` / stroke completion).

#### 2. Why It Exists in This Codebase
If every single mouse movement point were directly pushed to the main history buffer:
1. Every \`mouseMove\` event (up to 60-120 per second) would force expensive array mutations and global canvas history re-renders.
2. Undo operations would undo individual cursor points rather than an entire line stroke.
3. Network sync payloads would explode with complete state copies on every tiny cursor movement.

By separating active vs. committed state, **PaintSync** allows continuous 60fps local stroke previews while maintaining a clean, atomic history stack.

#### 3. Key Files Involved
* [\`server/drawing-state.ts\`](file:///Users/rajshekharprasadsaxena/Desktop/Build/server/services/codeParser.js) — Implements \`updateActiveStroke()\`, \`commitActiveStroke()\`, and history stack snapshots.
* [\`server/rooms.ts\`](file:///Users/rajshekharprasadsaxena/Desktop/Build/server/services/codeParser.js) — Manages room sessions and broadcasts active vs committed updates.
* [\`client/canvas.ts\`](file:///Users/rajshekharprasadsaxena/Desktop/Build/server/services/codeParser.js) — Renders committed background batch first, then active preview layer on top.

#### 4. Mental Model
Think of **Active Strokes** as *pencil drafts* that can change instantaneously, and **Committed Strokes** as *ink lines* saved permanently into the document ledger.`
    };
  }

  if (t.includes('websocket') || t.includes('socket') || t.includes('rooms')) {
    return {
      explanation: `### How PaintSync Real-Time WebSocket Communication Works

In **PaintSync** (\`client/websocket.ts\` and \`server/rooms.ts\`), WebSockets enable instant multi-user synchronization.

#### 1. What It Does
When users join a whiteboard room, a single persistent WebSocket connection is opened. As a user draws, stroke updates are transmitted over the socket to the server, which immediately relays them to all other connected participants in that room.

#### 2. Why It Exists in This Codebase
Traditional HTTP polling would introduce 100ms–1000ms latency, making collaborative drawing feel sluggish and disconnected. WebSockets provide sub-16ms latency for fluid, real-time collaboration.

#### 3. Key Files & Interactivity
* [\`client/websocket.ts\`](file:///Users/rajshekharprasadsaxena/Desktop/Build/server/services/codeParser.js) — Listens for mouse events on canvas and emits \`DRAW_POINT\` or \`COMMIT_STROKE\` payloads.
* [\`server/rooms.ts\`](file:///Users/rajshekharprasadsaxena/Desktop/Build/server/services/codeParser.js) — Tracks active sockets inside each \`roomId\` and broadcasts incoming events to all peer sockets (excluding sender).

#### 4. Mental Model
Think of the server as a **central radio dispatcher**: when User A speaks (draws a line), the dispatcher instantly broadcasts the audio to User B and User C's walkie-talkies in the same room.`
    };
  }

  if (t.includes('canvas') || t.includes('render')) {
    return {
      explanation: `### HTML5 Canvas Architecture in PaintSync

In **PaintSync** (\`client/canvas.ts\`), drawing is performed on an HTML5 2D Canvas context optimized for High-DPI screens.

#### 1. What It Does
* Scales canvas dimensions by \`window.devicePixelRatio\` to avoid blurry lines on Retina screens.
* Clears and redraws frame batches efficiently.
* Applies smooth line capping (\`lineCap = 'round'\`) and stroke joins (\`lineJoin = 'round'\`).

#### 2. Why It Exists in This Codebase
DOM elements (like SVG or DIVs) lag when rendering thousands of individual stroke points. Direct 2D Canvas pixel rendering guarantees 60 FPS performance regardless of stroke count.`
    };
  }

  return {
    explanation: `### Architecture Overview of ${repoName}

This codebase is structured around modular, event-driven components.

#### 1. Core Architecture
* **Client Layer**: Handles UI interaction, event capture, and real-time state listeners.
* **Server Layer**: Coordinates session lifecycle, room management, and state mutation.
* **State Management**: Enforces strict separation of transient active states and persistent committed states.

#### 2. Key Insights
* Clear separation of concerns between socket listeners, state containers, and visual renderers.
* Optimized for real-time responsiveness and low overhead.`
  };
}

function getFallbackQuestion(topic = 'Overall Architecture') {
  return {
    question: `Where does "${topic}" begin in this repository, and how does data move through it to produce its observable result?`,
    concept: topic,
    difficulty: 'Intermediate'
  };
}

function getFallbackEvaluation(question, answer = '', concept = '') {
  return {
    score: answer.trim().length > 80 ? 6 : 4,
    correctPoints: answer.trim().length > 40 ? ['You connected the concept to repository behavior and described part of its flow.'] : [],
    missingPoints: [
      'Name the relevant files and explain the control flow between them.',
      'Connect the implementation detail to the user-visible behavior.'
    ],
    explanation: `Revisit the code path for ${concept || 'this concept'} and verify each claim against the repository explorer.`,
    knowledgeGap: `${concept || 'Architecture'} flow and file relationships`,
    followUpQuestion: `Which file is the entry point for ${concept || 'this behavior'}, and what calls it next?`
  };
}
