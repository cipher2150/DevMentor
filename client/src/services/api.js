const API_BASE = 'https://devmentor-nvis.onrender.com/api';

export async function analyzeRepo(repoUrl) {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to analyze repository');
  }

  return await response.json();
}

export async function getConfig() {
  const response = await fetch(`${API_BASE}/config`);
  if (!response.ok) throw new Error('Unable to read server configuration');
  return await response.json();
}

export async function explainTopic(payload) {
  const response = await fetch(`${API_BASE}/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate explanation');
  }

  return await response.json();
}

export async function fetchQuestion(payload) {
  const response = await fetch(`${API_BASE}/question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate question');
  }

  return await response.json();
}

export async function evaluateAnswer(payload) {
  const response = await fetch(`${API_BASE}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to evaluate answer');
  }

  return await response.json();
}

export async function fetchFileContent(owner, repo, path, branch = 'main') {
  const params = new URLSearchParams({ owner, repo, path, branch });
  const response = await fetch(`${API_BASE}/file?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to load file ${path}`);
  }

  return await response.json();
}
