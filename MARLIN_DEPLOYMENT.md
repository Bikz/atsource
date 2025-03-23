# Deploying ATSource on Marlin TEE

This document outlines the steps to deploy ATSource on Marlin's Trusted Execution Environment (TEE).

## Prerequisites

- Install Docker: `sudo apt install docker.io`
- Install Node.js and npm: `sudo apt install nodejs npm`
- Set up Metamask with Arbitrum One tokens (0.001 ETH and 1 USDC)
- Install the oyster-cvm CLI tool:
  ```bash
  # For amd64
  sudo wget https://artifacts.marlin.org/oyster/binaries/oyster-cvm_v2.0.0_linux_amd64 -O /usr/local/bin/oyster-cvm
  # Make executable
  sudo chmod +x /usr/local/bin/oyster-cvm
  ```

## Build Process

1. Create the Node.js binary package:
   ```bash
   cd backend
   npm install
   npm i -D pkg
   npx pkg -t node14-alpine app.js
   ```

2. Build and deploy the enclave:
   ```bash
   # Replace <key> with your wallet's private key
   oyster-cvm deploy --wallet-private-key <key> --docker-compose ./docker-compose.yml \
   --instance-type c6a.xlarge --region ap-south-1 \
   --operator 0xe10Fa12f580e660Ecd593Ea4119ceBC90509D642 \
   --duration-in-minutes 20 --pcr-preset base/blue/v1.0.0/amd64 \
   --image-url https://artifacts.marlin.org/oyster/eifs/base-blue_v1.0.0_linux_amd64.eif
   ```

3. Update the frontend environment to point to the TEE instance:
   ```
   # Edit frontend/.env.local
   BACKEND_URL=http://<marlin-tee-ip>:4000
   ```

4. Deploy the frontend using Vercel or your preferred hosting platform.

## Verification

1. Download the verifier:
   ```bash
   wget http://public.artifacts.marlin.pro/projects/enclaves/verifier && chmod +x ./verifier
   ```

2. Verify the enclave:
   ```bash
   ./verifier --endpoint http://<ip>:1300/attestation/raw --public key.pub \
   --pcr0 "<pcr0>" --pcr1 "<pcr1>" --pcr2 "<pcr2>" --max-age 300
   ```

3. Test the API endpoint:
   ```bash
   curl <ip>:4000/health
   ```

The frontend can now use this verified TEE backend for trusted code analysis. 