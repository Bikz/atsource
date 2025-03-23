// app.js - Main server file to run in the TEE
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { analyzeCode } = require('./services/codeAnalysis');

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: 'TEE',
    timestamp: new Date().toISOString()
  });
});

// Code analysis endpoint
app.post('/analyze', async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    // Analyze the code using SecretLLM
    const analysis = await analyzeCode(code, language || 'unknown');
    
    // Return analysis with signature
    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze code', 
      message: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Secure Code Analysis server running on port ${port}`);
});