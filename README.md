# n8n-nodes-blockfrost

This is a custom n8n node for interacting with the [Cardano blockchain](https://cardano.org) via the [Blockfrost API](https://blockfrost.io).

## Features

- Query Cardano blockchain data (accounts, addresses, transactions, blocks, etc.)
- Work with NFTs and native tokens
- Access IPFS data (if supported by your Blockfrost project)
- Integrate Cardano blockchain data into your n8n workflows

## Installation

### Option 1: Community Node (via npm)

1. Open your n8n instance
2. Go to **Settings** > **Community Nodes**
3. Click **Install**
4. Enter `n8n-nodes-blockfrost` and click **Install**

### Option 2: Manual Installation

1. Navigate to your n8n custom directory: `~/.n8n/custom/`
2. Clone this repository: `git clone https://github.com/bevanamit/n8n-nodes-blockfrost.git`
3. Install dependencies: `cd n8n-nodes-blockfrost && npm install`
4. Build the project: `npm run build`
5. Restart n8n

## Prerequisites

- [n8n](https://n8n.io/) (version 0.209.0 or newer)
- A [Blockfrost](https://blockfrost.io) account and project API key

## Credentials

To use this node, you need to set up Blockfrost API credentials:

1. Sign up for a free account on [Blockfrost.io](https://blockfrost.io)
2. Create a project and get your API key
3. In n8n, create a new credential of type **Blockfrost API**
4. Enter your **Project ID** (API key)
5. Select the appropriate **Network** (mainnet, preprod, preview)

## Usage

1. Add the **Blockfrost** node to your workflow
2. Select a **Category** (e.g., Accounts, Addresses, Assets, etc.)
3. Choose an **Operation** specific to that category
4. Fill in the required parameters
5. Connect the node to other nodes in your workflow

## Example Workflows

### 1. Monitor Cardano Address Balance

Create a workflow that periodically checks a Cardano address balance and sends notifications when changes occur.

### 2. Track NFT Ownership

Monitor ownership changes of specific NFTs on the Cardano blockchain.

### 3. Analyze Transaction History

Pull transaction data for analysis or reporting purposes.

## Development

If you want to contribute to this node:

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the code: `npm run build`
4. Link to your local n8n: `npm link`
5. In your n8n installation directory: `npm link n8n-nodes-blockfrost`

## License

[Apache 2.0](LICENSE)