import express from 'express';
import { analyzeRepository } from '../services/repositoryAnalyzer.js';

const router = express.Router();

router.post('/analyze', async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ error: 'GitHub Repository URL is required.' });
    }

    if (!/^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+(?:[/?#].*)?$/i.test(repoUrl.trim())) {
      return res.status(400).json({ error: 'Enter a valid GitHub repository URL, for example https://github.com/owner/repository.' });
    }

    const analysis = await analyzeRepository(repoUrl);
    return res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to analyze repository.'
    });
  }
});

export default router;
