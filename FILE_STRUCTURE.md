secure-code-analyzer/
├── backend/                 # Node.js backend to run in TEE
│   ├── app.js               # Main server file
│   ├── package.json         # Node dependencies
│   ├── config.json          # Marlin enclave config
│   └── services/
│       └── codeAnalysis.js  # Code to interact with SecretLLM
├── frontend/                # Next.js frontend
│   ├── public/              # Static assets
│   ├── app/                 # Next.js app router
│   │   ├── page.tsx         # Home page
│   │   ├── layout.tsx       # Main layout
│   │   └── api/             # API routes
│   │       └── verify/      
│   │           └── route.ts # API to verify signatures
│   ├── components/          # React components
│   │   └── CodeAnalyzer.tsx # Main component
│   ├── .env                 # Environment variables
│   └── package.json         # Frontend dependencies
└── README.md                # Project documentation