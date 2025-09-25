# PowerShell script to clean, build, deploy, and restart n8n with the latest custom Blockfrost node
# Save as refresh-n8n-blockfrost.ps1 and run in PowerShell

# Stop all n8n processes
Get-Process n8n -ErrorAction SilentlyContinue | Stop-Process -Force

# Build the project
cd "C:\personal\projects\cardano\blockfrost\n8n-nodes-blockfrost"
npm run build

# Deploy the build to n8n custom directory
Copy-Item -Path "dist" -Destination "$env:USERPROFILE\.n8n\custom\n8n-nodes-blockfrost" -Recurse -Force

# Copy package.json if needed
Copy-Item -Path "package.json.fixed" -Destination "$env:USERPROFILE\.n8n\custom\n8n-nodes-blockfrost\package.json" -Force

# Install dependencies in the custom directory
cd "$env:USERPROFILE\.n8n\custom\n8n-nodes-blockfrost"
npm install

# Start n8n
n8n start
