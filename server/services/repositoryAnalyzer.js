import { parseGithubUrl, fetchRepositoryTree, fetchFileContent } from './githubService.js';
import { parseRepositoryStructure } from './codeParser.js';
import { buildKnowledgeMapGraph } from './knowledgeMap.js';
import { getCachedRepo, setCachedRepo } from '../utils/repoCache.js';

export async function analyzeRepository(repoUrl) {
  if (!repoUrl) {
    throw new Error('Repository URL is required');
  }

  const parsed = parseGithubUrl(repoUrl);
  if (!parsed) {
    throw new Error('Invalid GitHub repository URL. Format: https://github.com/owner/repository');
  }

  const cacheKey = `${parsed.owner}/${parsed.repo}`;
  const cached = getCachedRepo(cacheKey);
  if (cached) {
    return cached;
  }

  // 1. Fetch Tree
  const tree = await fetchRepositoryTree(parsed.owner, parsed.repo);

  // 2. Fetch representative files for deep parsing without assuming a framework or layout.
  const keyFiles = ['package.json', 'README.md', 'pyproject.toml', 'requirements.txt', 'pom.xml', 'build.gradle', 'go.mod', 'Cargo.toml', 'Dockerfile'];
  const filesContentMap = {};

  for (const file of tree.files || []) {
    if (keyFiles.includes(file.path) || file.path.endsWith('package.json') || file.path.endsWith('Dockerfile')) {
      const content = await fetchFileContent(parsed.owner, parsed.repo, file.path, tree.defaultBranch);
      filesContentMap[file.path] = content;
    }
  }

  // 3. Parse Structure
  const parseResults = parseRepositoryStructure(tree, filesContentMap);

  // 4. Build Knowledge Map
  const knowledgeMap = buildKnowledgeMapGraph(parsed.repo, tree, parseResults);

  const result = {
    repoUrl,
    owner: parsed.owner,
    repo: parsed.repo,
    name: tree.name || parsed.repo,
    description: tree.description || `Analyzed codebase for ${parsed.repo}`,
    defaultBranch: tree.defaultBranch || 'main',
    filesCount: tree.files ? tree.files.length : 0,
    fileTree: tree.files || [],
    filesContentMap,
    technologies: parseResults.technologies,
    coreConcepts: parseResults.coreConcepts,
    fileOverviews: parseResults.fileOverviews,
    knowledgeMap
  };

  setCachedRepo(cacheKey, result);
  return result;
}
