# ATSource

A web application that:

- Allows users to upload or paste code
- Securely sends the code to a Marlin enclave (TEE)
- Within the TEE, uses OpenAI to analyze the code
- Returns analysis results with a cryptographic signature verifying the process happened in the TEE

## Development Setup

### Prerequisites
- Node.js (v16+)
- npm
- OpenAI API key

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=your-api-key-here

# Start development server
node app.js
# Server runs on http://localhost:4001
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs on http://localhost:3000
```

## Building for Production

### Backend
```bash
cd backend
npm install
npm i -D pkg
npx pkg -t node14-alpine app.js
```
This creates a standalone binary (`app`) that can be deployed to the Marlin TEE.

### Frontend
```bash
cd frontend
npm install
npm run build
```

## Deployment

### Marlin TEE Deployment
See detailed instructions in [MARLIN_DEPLOYMENT.md](./MARLIN_DEPLOYMENT.md)

1. Set up prerequisites (Docker, Marlin CLI)
2. Configure your OpenAI API key
3. Build the enclave image
4. Deploy to Marlin network
5. Update frontend to point to the TEE instance

### Frontend Deployment
The Next.js frontend can be deployed to Vercel or any static hosting:

```bash
cd frontend
npm run build
# Deploy the .next directory to your hosting provider
```

## Configuration
- Backend: Configure in `.env` file
- Frontend: Configure in `.env.local` file
- Marlin: Configure in `marlin-config.json` and `docker-compose.yml`

## Sample Code for Demo

### Good JavaScript Example (Secure)

```javascript
// Safe user authentication function
const crypto = require('crypto');

function validatePassword(storedHash, storedSalt, providedPassword) {
  // Use constant-time comparison to prevent timing attacks
  const hashedInput = crypto.pbkdf2Sync(
    providedPassword, 
    storedSalt, 
    10000,  // Number of iterations
    64,     // Key length
    'sha512'
  ).toString('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(hashedInput, 'hex'),
    Buffer.from(storedHash, 'hex')
  );
}

function authenticateUser(username, password, database) {
  // Input validation
  if (!username || typeof username !== 'string' || !password) {
    return { success: false, message: 'Invalid credentials format' };
  }
  
  const user = database.getUserByUsername(username);
  if (!user) {
    // Use same response for non-existent user to prevent user enumeration
    return { success: false, message: 'Authentication failed' };
  }
  
  const isValid = validatePassword(user.passwordHash, user.salt, password);
  
  if (!isValid) {
    return { success: false, message: 'Authentication failed' };
  }
  
  // Generate a secure session token
  const sessionToken = crypto.randomBytes(32).toString('hex');
  
  return { success: true, sessionToken };
}
```

### Bad JavaScript Example (Vulnerable)

```javascript
// VULNERABLE authentication code with multiple security issues
const db = require('./database');
const crypto = require('crypto');
const exec = require('child_process').exec;

function login(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  
  // SQL INJECTION vulnerability - direct string concatenation
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).send('Database error');
    }
    
    if (result.length > 0) {
      // INSECURE: Storing plaintext password in token
      const token = createToken(username, password);
      
      // Log login - COMMAND INJECTION vulnerability
      exec('echo "User login: ' + username + ' at ' + new Date() + '" >> /var/log/app.log');
      
      // XSS vulnerability - direct insertion of username
      res.send(`<div>Welcome back, ${username}! You are now logged in.</div>`);
    } else {
      // Information disclosure - reveals if username exists
      if (userExists(username)) {
        res.send('Incorrect password');
      } else {
        res.send('User does not exist');
      }
    }
  });
}

function createToken(username, password) {
  // INSECURE: Weak hashing, no salt, and includes password
  return username + ':' + crypto.createHash('md5').update(password).digest('hex');
}

// INSECURE: Hard-coded credentials
const adminCredentials = {
  username: 'admin',
  password: 'admin123'
};
```

### Good Python Example (Secure)

```python
import secrets
import hashlib
import hmac
import sqlite3
from typing import Dict, Optional, Tuple
import re
import bleach
from contextlib import contextmanager

# Prepared statements prevent SQL injection
SQL_GET_USER = "SELECT user_id, password_hash, salt FROM users WHERE username = ?"
SQL_SAVE_SESSION = "INSERT INTO sessions (user_id, token, expiry) VALUES (?, ?, ?)"

@contextmanager
def get_db_connection():
    """Safely manage database connections with context manager"""
    conn = sqlite3.connect('app.db')
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """Securely hash a password with a random salt"""
    if salt is None:
        salt = secrets.token_hex(16)
    
    # Use strong hashing algorithm with many iterations
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000,  # High iteration count
        dklen=128
    )
    return key.hex(), salt

def verify_user(username: str, password: str) -> Dict:
    """Securely verify a user's credentials"""
    # Input validation
    if not isinstance(username, str) or not isinstance(password, str):
        return {"authenticated": False, "error": "Invalid input type"}
    
    # Prevent NoSQL injection with regex validation
    if not re.match(r'^[a-zA-Z0-9_]{3,30}$', username):
        return {"authenticated": False, "error": "Invalid username format"}
        
    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Use parameterized query to prevent SQL injection
        cursor.execute(SQL_GET_USER, (username,))
        user = cursor.fetchone()
        
    if not user:
        # Same message regardless of whether user exists
        return {"authenticated": False, "error": "Authentication failed"}
        
    stored_hash = user['password_hash']
    salt = user['salt']
    
    calculated_hash, _ = hash_password(password, salt)
    
    # Use constant time comparison to prevent timing attacks
    if hmac.compare_digest(calculated_hash, stored_hash):
        # Generate a secure random token
        session_token = secrets.token_hex(32)
        
        # Store session securely
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # Set expiry 24 hours in the future
            expiry = int(time.time()) + 86400
            cursor.execute(SQL_SAVE_SESSION, (user['user_id'], session_token, expiry))
            conn.commit()
        
        return {"authenticated": True, "session_token": session_token}
    
    return {"authenticated": False, "error": "Authentication failed"}

def render_user_content(content: str) -> str:
    """Safely render user-provided content"""
    # Use HTML sanitization to prevent XSS
    return bleach.clean(content)
```

### Bad Python Example (Vulnerable)

```python
import sqlite3
import os
import hashlib
import pickle
from flask import Flask, request, render_template_string

app = Flask(__name__)

# INSECURE: Hard-coded credentials in plain text
DB_USER = "admin"
DB_PASS = "Password123!"

def login():
    username = request.args.get('username')
    password = request.args.get('password')
    
    # VULNERABLE: SQL Injection due to string formatting
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    
    # VULNERABLE: Insecure connection handling
    conn = sqlite3.connect('users.db')
    cursor = conn.execute(query)
    user = cursor.fetchone()
    
    if user:
        # VULNERABLE: Command Injection
        os.system(f"echo {username} logged in at $(date) >> /var/log/logins.txt")
        
        # VULNERABLE: Insecure deserialization
        user_data = pickle.loads(user[3])  # Assuming column 3 contains pickled data
        
        # VULNERABLE: XSS via template injection
        welcome = f"""
        <div>
            <h1>Welcome {username}!</h1>
            <script>alert('You are logged in as: {username}');</script>
        </div>
        """
        return render_template_string(welcome)
    else:
        # VULNERABLE: Information disclosure
        if check_username(username):
            return "Password incorrect"
        else:
            return "Username not found"

def check_username(username):
    # VULNERABLE: Weak hashing for sensitive operations
    conn = sqlite3.connect('users.db')
    cursor = conn.execute(f"SELECT 1 FROM users WHERE username = '{username}'")
    return cursor.fetchone() is not None

def register(username, password):
    # VULNERABLE: Weak password hashing
    hashed = hashlib.md5(password.encode()).hexdigest()
    
    # VULNERABLE: SQL Injection
    query = f"INSERT INTO users (username, password) VALUES ('{username}', '{hashed}')"
    conn = sqlite3.connect('users.db')
    conn.execute(query)
    conn.commit()
    return "Registration successful"
```

# Kill processes on port 4001 and 3000
(lsof -ti:4001 | xargs kill -9 2>/dev/null || true) && (lsof -ti:3000 | xargs kill -9 2>/dev/null || true) && \
# Start backend in background
(cd backend && node app.js > backend.log 2>&1 &) && \
# Start frontend in foreground
(cd frontend && npm run dev)