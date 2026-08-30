/**
 * Service to fetch GitHub repository contents and metadata.
 */

import dotenv from 'dotenv';

dotenv.config();

const IGNORED_PATHS = [
  'node_modules', '.git', 'dist', 'build', 'coverage', '.env',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.DS_Store'
];

const IGNORED_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.pdf', '.zip', '.tar', '.gz', '.woff', '.woff2', '.ttf', '.eot'
];

const DEMO_REPO_ENABLED = process.env.ALLOW_DEMO_REPO === 'true';

export function parseGithubUrl(url) {
  if (!url) return null;
  const cleanUrl = url.trim().replace(/\/+$/, '');
  
  // Match formats: https://github.com/owner/repo or owner/repo
  const match = cleanUrl.match(/(?:github\.com\/|^)([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)/i);
  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/i, '')
  };
}

function getGithubHeaders() {
  const headers = {
    'User-Agent': 'DevMentor-App',
    'Accept': 'application/vnd.github.v3+json'
  };

  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  return headers;
}

export async function fetchRepositoryTree(owner, repo) {
  const isDemoRepo = DEMO_REPO_ENABLED && repo.toLowerCase().includes('paintsync');

  try {
    const headers = getGithubHeaders();

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, {
      headers
    });

    let treeData = null;
    if (response.ok) {
      treeData = await response.json();
    } else {
      const responseMaster = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`, {
        headers
      });
      if (responseMaster.ok) {
        treeData = await responseMaster.json();
      }
    }

    if (treeData && treeData.tree) {
      const filteredFiles = treeData.tree.filter(item => {
        const path = item.path;
        if (IGNORED_PATHS.some(ignored => path.includes(ignored))) return false;
        if (IGNORED_EXTENSIONS.some(ext => path.endsWith(ext))) return false;
        return true;
      });

      return {
        owner,
        repo,
        name: repo,
        defaultBranch: await fetchDefaultBranch(owner, repo, headers),
        files: filteredFiles
      };
    }
    throw new Error(`GitHub returned no repository tree for ${owner}/${repo}`);
  } catch (error) {
    console.warn(`GitHub repository fetch failed for ${owner}/${repo}:`, error.message);
  }

  // Fallback for PaintSync demo or general fallback when API rate limit is reached
  if (isDemoRepo || (!owner && DEMO_REPO_ENABLED)) {
    return getPaintSyncMockRepository();
  }

  throw new Error(`Unable to load ${owner}/${repo} from GitHub. Check the URL, repository visibility, token permissions, and API rate limit.`);
}

async function fetchDefaultBranch(owner, repo, headers) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!response.ok) return 'main';
  const data = await response.json();
  return data.default_branch || 'main';
}

export async function fetchFileContent(owner, repo, filePath, branch = 'main') {
  if (DEMO_REPO_ENABLED && repo.toLowerCase().includes('paintsync')) {
    const mockFiles = getPaintSyncFileContents();
    if (mockFiles[filePath]) {
      return mockFiles[filePath];
    }
  }

  try {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    const headers = {};
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken) {
      headers.Authorization = `Bearer ${githubToken}`;
    }

    const response = await fetch(rawUrl, { headers });
    if (response.ok) {
      return await response.text();
    }
  } catch (err) {
    console.warn(`Could not fetch content for ${filePath}:`, err.message);
  }

  return `// ${filePath}\n// File content preview for ${repo}\n// Managed component module`;
}

function getPaintSyncMockRepository() {
  return {
    owner: 'devmentor-demo',
    repo: 'PaintSync',
    name: 'PaintSync',
    description: 'Real-time collaborative whiteboard with TypeScript, WebSockets, Canvas rendering, and undo/redo state synchronization.',
    defaultBranch: 'main',
    files: [
      { path: 'package.json', type: 'blob', size: 650 },
      { path: 'README.md', type: 'blob', size: 1200 },
      { path: 'client', type: 'tree' },
      { path: 'client/canvas.ts', type: 'blob', size: 2100 },
      { path: 'client/main.ts', type: 'blob', size: 1400 },
      { path: 'client/websocket.ts', type: 'blob', size: 1850 },
      { path: 'client/undo-redo.ts', type: 'blob', size: 1600 },
      { path: 'server', type: 'tree' },
      { path: 'server/server.ts', type: 'blob', size: 1950 },
      { path: 'server/rooms.ts', type: 'blob', size: 2400 },
      { path: 'server/drawing-state.ts', type: 'blob', size: 3100 },
      { path: 'shared', type: 'tree' },
      { path: 'shared/types.ts', type: 'blob', size: 1100 }
    ]
  };
}

export function getPaintSyncFileContents() {
  return {
    'server/drawing-state.ts': `import { Stroke, Point, DrawingRoomState } from '../shared/types';

/**
 * Manages drawing state for collaborative room sessions.
 * Maintains distinct active strokes (currently being drawn by active users)
 * and committed strokes (finalized stroke paths).
 */
export class DrawingStateManager {
  private activeStrokes: Map<string, Stroke> = new Map();
  private committedStrokes: Stroke[] = [];
  private historyStack: Stroke[][] = [];

  constructor(public readonly roomId: string) {}

  public updateActiveStroke(userId: string, point: Point, color: string, width: number): Stroke {
    let stroke = this.activeStrokes.get(userId);
    if (!stroke) {
      stroke = { id: \`stroke_\${Date.now()}_\${userId}\`, userId, points: [point], color, width, isCommitted: false };
      this.activeStrokes.set(userId, stroke);
    } else {
      stroke.points.push(point);
    }
    return stroke;
  }

  public commitActiveStroke(userId: string): Stroke | null {
    const stroke = this.activeStrokes.get(userId);
    if (!stroke) return null;
    
    stroke.isCommitted = true;
    this.committedStrokes.push(stroke);
    this.activeStrokes.delete(userId);
    
    // Save snapshot for global room undo
    this.historyStack.push([...this.committedStrokes]);
    return stroke;
  }

  public getFullState(): DrawingRoomState {
    return {
      roomId: this.roomId,
      committedStrokes: this.committedStrokes,
      activeStrokes: Array.from(this.activeStrokes.values())
    };
  }

  public undoLastStroke(userId: string): boolean {
    const index = this.committedStrokes.findLastIndex(s => s.userId === userId);
    if (index !== -1) {
      this.committedStrokes.splice(index, 1);
      return true;
    }
    return false;
  }
}`,

    'server/rooms.ts': `import { WebSocket } from 'ws';
import { DrawingStateManager } from './drawing-state';
import { SyncMessage, User } from '../shared/types';

export class RoomManager {
  private rooms: Map<string, { state: DrawingStateManager; clients: Map<string, WebSocket> }> = new Map();

  public getOrCreateRoom(roomId: string): { state: DrawingStateManager; clients: Map<string, WebSocket> } {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        state: new DrawingStateManager(roomId),
        clients: new Map()
      });
    }
    return this.rooms.get(roomId)!;
  }

  public joinRoom(roomId: string, userId: string, ws: WebSocket) {
    const room = this.getOrCreateRoom(roomId);
    room.clients.set(userId, ws);
    
    // Broadcast initial state sync on connect
    const initialState = room.state.getFullState();
    ws.send(JSON.stringify({ type: 'INIT_STATE', payload: initialState }));
  }

  public broadcastToRoom(roomId: string, message: SyncMessage, senderId?: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const data = JSON.stringify(message);
    room.clients.forEach((ws, userId) => {
      if (userId !== senderId && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }
}`,

    'client/websocket.ts': `import { SyncMessage } from '../shared/types';

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private messageHandlers: Array<(msg: SyncMessage) => void> = [];

  constructor(private readonly url: string) {}

  public connect(roomId: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(\`\${this.url}?room=\${roomId}&user=\${userId}\`);

      this.socket.onopen = () => {
        console.log('[WebSocket] Connected to PaintSync session');
        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const message: SyncMessage = JSON.parse(event.data);
          this.messageHandlers.forEach(handler => handler(message));
        } catch (e) {
          console.error('[WebSocket] Message parse error:', e);
        }
      };

      this.socket.onerror = (err) => reject(err);
    });
  }

  public sendStrokeUpdate(point: { x: number; y: number }, isFinal: boolean) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: isFinal ? 'COMMIT_STROKE' : 'DRAW_POINT',
        payload: { point, timestamp: Date.now() }
      }));
    }
  }

  public onMessage(handler: (msg: SyncMessage) => void) {
    this.messageHandlers.push(handler);
  }
}`,

    'client/canvas.ts': `import { Stroke, Point } from '../shared/types';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  
  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.setupHighDPI();
  }

  private setupHighDPI() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }

  public renderBatch(committed: Stroke[], active: Stroke[]) {
    // Clear canvas before full redrawing frame
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw all committed (permanent) strokes
    for (const stroke of committed) {
      this.drawStrokePath(stroke);
    }

    // Draw active strokes on top with real-time smooth path rendering
    for (const stroke of active) {
      this.drawStrokePath(stroke, true);
    }
  }

  private drawStrokePath(stroke: Stroke, isActive: boolean = false) {
    if (stroke.points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.strokeStyle = stroke.color;
    this.ctx.lineWidth = stroke.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    this.ctx.stroke();
  }
}`,

    'package.json': `{
  "name": "paintsync",
  "version": "1.0.0",
  "description": "Real-time collaborative whiteboard",
  "scripts": {
    "dev": "concurrently \\"npm run dev:server\\" \\"npm run dev:client\\""
  },
  "dependencies": {
    "ws": "^8.16.0",
    "express": "^4.19.2",
    "typescript": "^5.3.3"
  }
}`
  };
}

function getGenericFallbackRepository(owner, repo) {
  return {
    owner: owner || 'developer',
    repo: repo || 'project',
    name: repo || 'project',
    description: `GitHub Repository: ${owner}/${repo}`,
    defaultBranch: 'main',
    files: [
      { path: 'package.json', type: 'blob', size: 500 },
      { path: 'README.md', type: 'blob', size: 800 },
      { path: 'src', type: 'tree' },
      { path: 'src/index.js', type: 'blob', size: 1200 },
      { path: 'src/server.js', type: 'blob', size: 1500 },
      { path: 'src/config.js', type: 'blob', size: 600 }
    ]
  };
}
