import express from 'express';
import { explainTopic, generateQuestion, evaluateAnswer, getAIProviderStatus } from '../services/aiService.js';
import { fetchFileContent } from '../services/githubService.js';

const router = express.Router();

router.get('/config', (req, res) => {
  res.json(getAIProviderStatus());
});

router.post('/explain', async (req, res) => {
  try {
    const { repoName, topic, selectedFile, contextCode, repoAnalysis } = req.body;
    const result = await explainTopic({ repoName, topic, selectedFile, contextCode, repoAnalysis });
    return res.json(result);
  } catch (error) {
    console.error('Explain route error:', error);
    return res.status(502).json({ error: error.message || 'Failed to generate explanation.' });
  }
});

router.post('/question', async (req, res) => {
  try {
    const { repoName, topic, repoAnalysis } = req.body;
    const result = await generateQuestion({ repoName, topic, repoAnalysis });
    return res.json(result);
  } catch (error) {
    console.error('Question route error:', error);
    return res.status(502).json({ error: error.message || 'Failed to generate question.' });
  }
});

router.post('/evaluate', async (req, res) => {
  try {
    const { repoName, question, answer, concept, repoAnalysis } = req.body;
    if (!answer || !answer.trim()) {
      return res.status(400).json({ error: 'Please provide an answer.' });
    }

    const result = await evaluateAnswer({ repoName, question, answer, concept, repoAnalysis });
    return res.json(result);
  } catch (error) {
    console.error('Evaluate route error:', error);
    return res.status(502).json({ error: error.message || 'Failed to evaluate answer.' });
  }
});

router.get('/file', async (req, res) => {
  try {
    const { owner, repo, path, branch } = req.query;
    if (!owner || !repo || !path) {
      return res.status(400).json({ error: 'Owner, repo, and path parameters required.' });
    }
    const content = await fetchFileContent(owner, repo, path, branch || 'main');
    return res.json({ path, content });
  } catch (error) {
    console.error('File route error:', error);
    return res.status(500).json({ error: 'Failed to fetch file content.' });
  }
});

export default router;
