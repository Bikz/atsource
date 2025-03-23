# Atsource

Is a web application that:

Allows users to upload or paste code
Securely sends the code to a Marlin enclave (TEE)
Within the TEE, uses Nillion's SecretLLM to analyze the code
Returns analysis results with a cryptographic signature verifying the process happened in the TEE