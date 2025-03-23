// services/codeAnalysis.js - Service to analyze code with SecretLLM
const fetch = require('node-fetch');

// Environment variables
const NILAI_API_URL = process.env.NILAI_API_URL || 'https://nilai-a779.nillion.network/v1';
const NILAI_API_KEY = process.env.NILAI_API_KEY || 'Nillion2025'; // Test key, replace with your actual key

/**
 * Analyzes code for vulnerabilities using SecretLLM
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

    // Call the SecretLLM API
    const response = await fetch(`${NILAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NILAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.1-8B-Instruct',
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
      throw new Error(`SecretLLM API error: ${JSON.stringify(errorData)}`);
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

    // Return the analysis with the signature from SecretLLM
    return {
      analysis: analysisResult,
      signature: data.signature,
      timestamp: new Date().toISOString(),
      code_hash: hashCode(code), // Simplified - in production use a proper hash function
      meta: {
        code_length: code.length,
        language: language,
        model_used: 'meta-llama/Llama-3.1-8B-Instruct'
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

module.exports = {
  analyzeCode
};