// services/codeAnalysis.js - Service to analyze code with OpenAI
const fetch = require('node-fetch');

// Environment variables
const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-api-key'; // Replace with your actual key

/**
 * Analyzes code for vulnerabilities using OpenAI
 * @param {string} code - The code to analyze
 * @param {string} language - The programming language
 * @returns {Object} - Analysis results with a signature
 */
async function analyzeCode(code, language) {
  try {
    // Craft a prompt for code vulnerability analysis
    const prompt = `
You are a security expert analyzing code for vulnerabilities.
Review the following ${language} code carefully:

\`\`\`${language}
${code}
\`\`\`

Identify any security vulnerabilities, including but not limited to:
1. SQL injection
2. XSS vulnerabilities
3. CSRF vulnerabilities
4. Command injection
5. Insecure cryptography
6. Sensitive data exposure
7. Insecure dependencies
8. Race conditions
9. Buffer overflows
10. Input validation issues

For each vulnerability found:
- Describe the vulnerability
- Explain why it's dangerous
- Provide a specific fix

If no vulnerabilities are found, explain why the code appears secure.

Respond in valid JSON format with the schema:
{
  "vulnerabilities": [
    {
      "type": "string",
      "description": "string",
      "severity": "high|medium|low",
      "fix": "string",
      "line_numbers": [int]
    }
  ],
  "overall_security_score": int (1-10),
  "summary": "string"
}
`;

    // Call the OpenAI API
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Parse and validate the LLM's response
    let analysisResult;
    try {
      // Try to parse the content as JSON
      analysisResult = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      // If not valid JSON, use the raw text
      analysisResult = {
        vulnerabilities: [],
        overall_security_score: 0,
        summary: data.choices[0].message.content
      };
    }

    // Generate a simple "signature" (this is just for demo purposes)
    const signature = generateDemoSignature();

    // Return the analysis with the demo signature
    return {
      analysis: analysisResult,
      signature: signature,
      timestamp: new Date().toISOString(),
      code_hash: hashCode(code), // Simplified - in production use a proper hash function
      meta: {
        code_length: code.length,
        language: language,
        model_used: 'gpt-3.5-turbo'
      }
    };
  } catch (error) {
    console.error('Error analyzing code:', error);
    throw error;
  }
}

/**
 * Simple hash function for demo purposes
 * In production, use a proper cryptographic hash function
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(16); // Convert to hex
}

/**
 * Generate a demo signature for demonstration purposes
 * In a real TEE application, this would be a cryptographic signature
 */
function generateDemoSignature() {
  return 'demo-' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

module.exports = {
  analyzeCode
};