import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IDataObject,
} from 'n8n-workflow';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import got from 'got';

export class Blockfrost implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Blockfrost',
    name: 'blockfrost',
    icon: 'file:blockfrost.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["category"]}} - {{$parameter["operation"]}}',
    description: 'Interact with Cardano blockchain via Blockfrost API',
    defaults: {
      name: 'Blockfrost',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'blockfrostApi',
        required: true,
      },
    ],
    properties: [
      // Category (single definition)
      {
        displayName: 'Category',
        name: 'category',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Health', value: 'health' },
          { name: 'Metrics', value: 'metrics' },
          { name: 'Accounts', value: 'accounts' },
          { name: 'Addresses', value: 'addresses' },
          { name: 'Assets', value: 'assets' },
          { name: 'Blocks', value: 'blocks' },
          { name: 'Epochs', value: 'epochs' },
          { name: 'Governance', value: 'governance' },
          { name: 'Ledger', value: 'ledger' },
          { name: 'Mempool', value: 'mempool' },
          { name: 'Metadata', value: 'metadata' },
          { name: 'Network', value: 'network' },
          { name: 'Pools', value: 'pools' },
          { name: 'Scripts', value: 'scripts' },
          { name: 'Transactions', value: 'transactions' },
          { name: 'Utilities', value: 'utilities' },
        ],
        default: 'health',
        required: true,
      },
      // Assets operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            category: ['assets'],
          },
        },
        options: [
          { name: 'List Assets', value: 'listAssets', description: 'List of assets (GET /assets)' },
          { name: 'Get Asset', value: 'getAsset', description: 'Information about a specific asset (GET /assets/{asset})' },
          { name: 'Get Asset History', value: 'getAssetHistory', description: 'History of a specific asset (GET /assets/{asset}/history)' },
          { name: 'Get Asset Transactions', value: 'getAssetTransactions', description: 'Transactions of a specific asset (GET /assets/{asset}/transactions)' },
          { name: 'Get Asset Txs', value: 'getAssetTxs', description: 'Transaction hashes of a specific asset (GET /assets/{asset}/txs)' },
          { name: 'Get Asset Addresses', value: 'getAssetAddresses', description: 'Addresses containing a specific asset (GET /assets/{asset}/addresses)' },
          { name: 'List Policy Assets', value: 'listPolicyAssets', description: 'List of assets under a policy (GET /assets/policy/{policy_id})' },
        ],
        default: 'listAssets',
      },
      // Query params for /assets
      {
        displayName: 'Count',
        name: 'count',
        type: 'number',
        default: 100,
        required: false,
        displayOptions: {
          show: {
            category: ['assets'],
            operation: ['listAssets','getAssetHistory','getAssetTransactions','getAssetTxs','getAssetAddresses','listPolicyAssets'],
          },
        },
        description: 'Max number of results per page (1-100)',
      },
      {
        displayName: 'Page',
        name: 'page',
        type: 'number',
        default: 1,
        required: false,
        displayOptions: {
          show: {
            category: ['assets'],
            operation: ['listAssets','getAssetHistory','getAssetTransactions','getAssetTxs','getAssetAddresses','listPolicyAssets'],
          },
        },
        description: 'Page number for results',
      },
      {
        displayName: 'Order',
        name: 'order',
        type: 'options',
        options: [
          { name: 'Ascending', value: 'asc' },
          { name: 'Descending', value: 'desc' },
        ],
        default: 'asc',
        required: false,
        displayOptions: {
          show: {
            category: ['assets'],
            operation: ['listAssets','getAssetHistory','getAssetTransactions','getAssetTxs','getAssetAddresses','listPolicyAssets'],
          },
        },
        description: 'Order of results',
      },
      // Asset input for asset-specific endpoints
      {
        displayName: 'Asset',
        name: 'asset',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['assets'],
            operation: ['getAsset','getAssetHistory','getAssetTransactions','getAssetTxs','getAssetAddresses'],
          },
        },
        description: 'Asset unit (policy_id + hex encoded asset_name)',
      },
      // Policy ID input for /assets/policy/{policy_id}
      {
        displayName: 'Policy ID',
        name: 'policyId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['assets'],
            operation: ['listPolicyAssets'],
          },
        },
        description: 'Policy ID',
      },
      // Blocks operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            category: ['blocks'],
          },
        },
        options: [
          { name: 'Latest Block', value: 'getLatestBlock', description: 'Return the latest block (GET /blocks/latest)' },
          { name: 'Latest Block Transactions', value: 'getLatestBlockTxs', description: 'Return transactions within the latest block (GET /blocks/latest/txs)' },
          { name: 'Latest Block Transactions CBOR', value: 'getLatestBlockTxsCbor', description: 'Return transactions within the latest block with CBOR (GET /blocks/latest/txs/cbor)' },
          { name: 'Specific Block', value: 'getBlock', description: 'Return content of a requested block (GET /blocks/{hash_or_number})' },
          { name: 'Next Blocks', value: 'getNextBlocks', description: 'Return list of blocks following a specific block (GET /blocks/{hash_or_number}/next)' },
          { name: 'Previous Blocks', value: 'getPreviousBlocks', description: 'Return list of blocks preceding a specific block (GET /blocks/{hash_or_number}/previous)' },
          { name: 'Block in Slot', value: 'getBlockInSlot', description: 'Return content of a requested block for a specific slot (GET /blocks/slot/{slot_number})' },
          { name: 'Block in Epoch Slot', value: 'getBlockInEpochSlot', description: 'Return content of a requested block for a specific slot in an epoch (GET /blocks/epoch/{epoch_number}/slot/{slot_number})' },
          { name: 'Block Transactions', value: 'getBlockTxs', description: 'Return transactions within the block (GET /blocks/{hash_or_number}/txs)' },
          { name: 'Block Transactions CBOR', value: 'getBlockTxsCbor', description: 'Return transactions within the block with CBOR (GET /blocks/{hash_or_number}/txs/cbor)' },
          { name: 'Block Addresses', value: 'getBlockAddresses', description: 'Return addresses affected in the specified block (GET /blocks/{hash_or_number}/addresses)' },
        ],
        default: 'getLatestBlock',
      },
      // Block hash or number input for block-specific endpoints
      {
        displayName: 'Block Hash or Number',
        name: 'hashOrNumber',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['blocks'],
            operation: ['getBlock', 'getNextBlocks', 'getPreviousBlocks', 'getBlockTxs', 'getBlockTxsCbor', 'getBlockAddresses'],
          },
        },
        description: 'Block hash or block number',
      },
      // Slot number input for slot-specific endpoints
      {
        displayName: 'Slot Number',
        name: 'slotNumber',
        type: 'number',
        required: true,
        default: 0,
        displayOptions: {
          show: {
            category: ['blocks'],
            operation: ['getBlockInSlot'],
          },
        },
        description: 'Slot number',
      },
      // Epoch number input for epoch slot endpoint
      {
        displayName: 'Epoch Number',
        name: 'epochNumber',
        type: 'number',
        required: true,
        default: 0,
        displayOptions: {
          show: {
            category: ['blocks'],
            operation: ['getBlockInEpochSlot'],
          },
        },
        description: 'Epoch number',
      },
      // Slot number for epoch slot endpoint
      {
        displayName: 'Slot Number',
        name: 'epochSlotNumber',
        type: 'number',
        required: true,
        default: 0,
        displayOptions: {
          show: {
            category: ['blocks'],
            operation: ['getBlockInEpochSlot'],
          },
        },
        description: 'Slot number within the epoch',
      },
      // Count parameter for blocks endpoints
      {
        displayName: 'Count',
        name: 'count',
        type: 'number',
        default: 100,
        required: false,
        displayOptions: {
          show: {
            category: ['blocks'],
            operation: ['getLatestBlockTxs', 'getLatestBlockTxsCbor', 'getNextBlocks', 'getPreviousBlocks', 'getBlockTxs', 'getBlockTxsCbor', 'getBlockAddresses'],
          },
        },
        description: 'Max number of results per page (1-100)',
      },
      // Page parameter for blocks endpoints
      {
        displayName: 'Page',
        name: 'page',
        type: 'number',
        default: 1,
        required: false,
        displayOptions: {
          show: {
            category: ['blocks'],
            operation: ['getLatestBlockTxs', 'getLatestBlockTxsCbor', 'getNextBlocks', 'getPreviousBlocks', 'getBlockTxs', 'getBlockTxsCbor', 'getBlockAddresses'],
          },
        },
        description: 'Page number for results',
      },
      // Order parameter for blocks endpoints
      {
        displayName: 'Order',
        name: 'order',
        type: 'options',
        options: [
          { name: 'Ascending', value: 'asc' },
          { name: 'Descending', value: 'desc' },
        ],
        default: 'asc',
        required: false,
        displayOptions: {
          show: {
            category: ['blocks'],
            operation: ['getLatestBlockTxs', 'getLatestBlockTxsCbor', 'getNextBlocks', 'getPreviousBlocks', 'getBlockTxs', 'getBlockTxsCbor', 'getBlockAddresses'],
          },
        },
        description: 'Order of results',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            category: ['addresses'],
          },
        },
        options: [
          { name: 'Get Address', value: 'getAddress', description: 'Obtain information about a specific address (GET /addresses/{address})' },
          { name: 'Get Address Extended', value: 'getAddressExtended', description: 'Obtain extended information about a specific address (GET /addresses/{address}/extended)' },
          { name: 'Get Address Total', value: 'getAddressTotal', description: 'Obtain details about an address (GET /addresses/{address}/total)' },
          { name: 'Get Address UTXOs', value: 'getAddressUtxos', description: 'UTXOs of the address (GET /addresses/{address}/utxos)' },
          { name: 'Get Address UTXOs of Asset', value: 'getAddressUtxosAsset', description: 'UTXOs of the address for a given asset (GET /addresses/{address}/utxos/{asset})' },
          { name: 'Get Address Transactions', value: 'getAddressTransactions', description: 'Transactions on the address (GET /addresses/{address}/transactions)' },
        ],
        default: 'getAddress',
      },
      // Address input for addresses
      {
        displayName: 'Address',
        name: 'address',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['addresses'],
          },
        },
        description: 'Cardano address in Bech32 format',
      },
      // Asset input for getAddressUtxosAsset
      {
        displayName: 'Asset',
        name: 'asset',
        type: 'string',
        required: false,
        default: '',
        displayOptions: {
          show: {
            category: ['addresses'],
            operation: ['getAddressUtxosAsset'],
          },
        },
        description: 'Asset unit (policy_id + hex encoded asset_name)',
      },
      // Health operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            category: ['health'],
          },
        },
        options: [
          {
            name: 'Root Endpoint',
            value: 'root',
            description: 'Get information pointing to the documentation (GET /)',
          },
          {
            name: 'Backend Health Status',
            value: 'health',
            description: 'Get backend health status (GET /health)',
          },
          {
            name: 'Current Backend Time',
            value: 'clock',
            description: 'Get current backend UNIX time (GET /health/clock)',
          },
        ],
        default: 'root',
      },
      // Metrics operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            category: ['metrics'],
          },
        },
        options: [
          {
            name: 'Usage Metrics',
            value: 'usage',
            description: 'History of your Blockfrost usage metrics in the past 30 days (GET /metrics)',
          },
          {
            name: 'Endpoint Usage Metrics',
            value: 'endpoints',
            description: 'History of your Blockfrost usage metrics per endpoint in the past 30 days (GET /metrics/endpoints)',
          },
        ],
        default: 'usage',
      },
      // Accounts operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            category: ['accounts'],
          },
        },
        options: [
          { name: 'Get Account', value: 'getAccount', description: 'Obtain information about a specific stake account (GET /accounts/{stake_address})' },
          { name: 'Get Rewards', value: 'getRewards', description: 'Obtain information about the reward history of a specific account (GET /accounts/{stake_address}/rewards)' },
          { name: 'Get History', value: 'getHistory', description: 'Obtain information about the history of a specific account (GET /accounts/{stake_address}/history)' },
          { name: 'Get Delegations', value: 'getDelegations', description: 'Obtain information about the delegation of a specific account (GET /accounts/{stake_address}/delegations)' },
          { name: 'Get Registrations', value: 'getRegistrations', description: 'Obtain information about the registrations and deregistrations of a specific account (GET /accounts/{stake_address}/registrations)' },
          { name: 'Get Withdrawals', value: 'getWithdrawals', description: 'Obtain information about the withdrawals of a specific account (GET /accounts/{stake_address}/withdrawals)' },
          { name: 'Get MIRs', value: 'getMirs', description: 'Obtain information about the MIRs of a specific account (GET /accounts/{stake_address}/mirs)' },
          { name: 'Get Associated Addresses', value: 'getAddresses', description: 'Obtain information about the addresses of a specific account (GET /accounts/{stake_address}/addresses)' },
          { name: 'Get Associated Assets', value: 'getAddressesAssets', description: 'Obtain information about assets associated with addresses of a specific account (GET /accounts/{stake_address}/addresses/assets)' },
          { name: 'Get Addresses Total', value: 'getAddressesTotal', description: 'Obtain summed details about all addresses associated with a given account (GET /accounts/{stake_address}/addresses/total)' },
          { name: 'Get UTXOs', value: 'getUtxos', description: 'UTXOs associated with the account (GET /accounts/{stake_address}/utxos)' },
        ],
        default: 'getAccount',
      },
      // Stake Address input for accounts
      {
        displayName: 'Stake Address',
        name: 'stakeAddress',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['accounts'],
          },
        },
        description: 'Stake address in Bech32 format',
      },

      // ================= EPOCHS OPERATIONS =================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            category: ['epochs'],
          },
        },
        options: [
          { name: 'Latest Epoch', value: 'getLatestEpoch', description: 'Return information about the latest epoch (GET /epochs/latest)' },
          { name: 'Latest Epoch Parameters', value: 'getLatestEpochParameters', description: 'Return protocol parameters for the latest epoch (GET /epochs/latest/parameters)' },
          { name: 'Specific Epoch', value: 'getEpoch', description: 'Return content of the requested epoch (GET /epochs/{number})' },
          { name: 'Next Epochs', value: 'getNextEpochs', description: 'Return list of epochs following a specific epoch (GET /epochs/{number}/next)' },
          { name: 'Previous Epochs', value: 'getPreviousEpochs', description: 'Return list of epochs preceding a specific epoch (GET /epochs/{number}/previous)' },
          { name: 'Stake Distribution', value: 'getEpochStakes', description: 'Return active stake distribution for the specified epoch (GET /epochs/{number}/stakes)' },
          { name: 'Stake Distribution by Pool', value: 'getEpochStakesByPool', description: 'Return active stake distribution by stake pool (GET /epochs/{number}/stakes/{pool_id})' },
          { name: 'Block Distribution', value: 'getEpochBlocks', description: 'Return blocks minted for the epoch (GET /epochs/{number}/blocks)' },
          { name: 'Block Distribution by Pool', value: 'getEpochBlocksByPool', description: 'Return blocks minted by stake pool (GET /epochs/{number}/blocks/{pool_id})' },
          { name: 'Protocol Parameters', value: 'getEpochParameters', description: 'Return protocol parameters for the epoch (GET /epochs/{number}/parameters)' },
        ],
        default: 'getLatestEpoch',
      },
      {
        displayName: 'Epoch Number',
        name: 'epochNumber',
        type: 'number',
        required: true,
        default: 0,
        displayOptions: {
          show: {
            category: ['epochs'],
            operation: ['getEpoch', 'getNextEpochs', 'getPreviousEpochs', 'getEpochStakes', 'getEpochStakesByPool', 'getEpochBlocks', 'getEpochBlocksByPool', 'getEpochParameters'],
          },
        },
        description: 'Epoch number',
      },
      {
        displayName: 'Pool ID',
        name: 'poolId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['epochs'],
            operation: ['getEpochStakesByPool', 'getEpochBlocksByPool'],
          },
        },
        description: 'Bech32 encoded pool ID',
      },

      // ================= GOVERNANCE OPERATIONS =================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            category: ['governance'],
          },
        },
        options: [
          { name: 'List DReps', value: 'listDreps', description: 'Return information about Delegate Representatives (GET /governance/dreps)' },
          { name: 'Specific DRep', value: 'getDrep', description: 'DRep information (GET /governance/dreps/{drep_id})' },
          { name: 'DRep Delegators', value: 'getDrepDelegators', description: 'List of DRep delegators (GET /governance/dreps/{drep_id}/delegators)' },
          { name: 'DRep Metadata', value: 'getDrepMetadata', description: 'DRep metadata information (GET /governance/dreps/{drep_id}/metadata)' },
          { name: 'DRep Updates', value: 'getDrepUpdates', description: 'List of certificate updates to the DRep (GET /governance/dreps/{drep_id}/updates)' },
          { name: 'DRep Votes', value: 'getDrepVotes', description: 'History of DRep votes (GET /governance/dreps/{drep_id}/votes)' },
          { name: 'List Proposals', value: 'listProposals', description: 'Return information about Proposals (GET /governance/proposals)' },
          { name: 'Specific Proposal', value: 'getProposal', description: 'Proposal information (GET /governance/proposals/{tx_hash}/{cert_index})' },
          { name: 'Proposal Parameters', value: 'getProposalParameters', description: 'Parameters proposal details (GET /governance/proposals/{tx_hash}/{cert_index}/parameters)' },
          { name: 'Proposal Withdrawals', value: 'getProposalWithdrawals', description: 'Parameters withdrawals details (GET /governance/proposals/{tx_hash}/{cert_index}/withdrawals)' },
          { name: 'Proposal Votes', value: 'getProposalVotes', description: 'History of Proposal votes (GET /governance/proposals/{tx_hash}/{cert_index}/votes)' },
          { name: 'Proposal Metadata', value: 'getProposalMetadata', description: 'Proposal metadata information (GET /governance/proposals/{tx_hash}/{cert_index}/metadata)' },
        ],
        default: 'listDreps',
      },
      {
        displayName: 'DRep ID',
        name: 'drepId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['governance'],
            operation: ['getDrep', 'getDrepDelegators', 'getDrepMetadata', 'getDrepUpdates', 'getDrepVotes'],
          },
        },
        description: 'DRep ID in Bech32 format',
      },
      {
        displayName: 'Transaction Hash',
        name: 'txHash',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['governance'],
            operation: ['getProposal', 'getProposalParameters', 'getProposalWithdrawals', 'getProposalVotes', 'getProposalMetadata'],
          },
        },
        description: 'Transaction hash',
      },
      {
        displayName: 'Certificate Index',
        name: 'certIndex',
        type: 'number',
        required: true,
        default: 0,
        displayOptions: {
          show: {
            category: ['governance'],
            operation: ['getProposal', 'getProposalParameters', 'getProposalWithdrawals', 'getProposalVotes', 'getProposalMetadata'],
          },
        },
        description: 'Certificate index',
      },

      // ================= LEDGER OPERATIONS =================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            category: ['ledger'],
          },
        },
        options: [
          { name: 'Blockchain Genesis', value: 'getGenesis', description: 'Return information about blockchain genesis (GET /genesis)' },
        ],
        default: 'getGenesis',
      },

      // ================= MEMPOOL OPERATIONS =================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            category: ['mempool'],
          },
        },
        options: [
          { name: 'Mempool', value: 'getMempool', description: 'Return transactions in Blockfrost mempool (GET /mempool)' },
          { name: 'Specific Mempool Transaction', value: 'getMempoolTx', description: 'Return content of requested transaction (GET /mempool/{hash})' },
          { name: 'Mempool by Address', value: 'getMempoolByAddress', description: 'List mempool transactions for address (GET /mempool/addresses/{address})' },
        ],
        default: 'getMempool',
      },
      {
        displayName: 'Transaction Hash',
        name: 'txHash',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['mempool'],
            operation: ['getMempoolTx'],
          },
        },
        description: 'Transaction hash',
      },
      {
        displayName: 'Address',
        name: 'address',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['mempool'],
            operation: ['getMempoolByAddress'],
          },
        },
        description: 'Cardano address in Bech32 format',
      },

      // ================= METADATA OPERATIONS =================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            category: ['metadata'],
          },
        },
        options: [
          { name: 'Transaction Metadata Labels', value: 'getTxMetadataLabels', description: 'List all used transaction metadata labels (GET /metadata/txs/labels)' },
          { name: 'Transaction Metadata Content JSON', value: 'getTxMetadataByLabelJson', description: 'Transaction metadata per label JSON (GET /metadata/txs/labels/{label})' },
          { name: 'Transaction Metadata Content CBOR', value: 'getTxMetadataByLabelCbor', description: 'Transaction metadata per label CBOR (GET /metadata/txs/labels/{label}/cbor)' },
        ],
        default: 'getTxMetadataLabels',
      },
      {
        displayName: 'Label',
        name: 'label',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['metadata'],
            operation: ['getTxMetadataByLabelJson', 'getTxMetadataByLabelCbor'],
          },
        },
        description: 'Metadata label',
      },

      // ================= NETWORK OPERATIONS =================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            category: ['network'],
          },
        },
        options: [
          { name: 'Network Information', value: 'getNetworkInfo', description: 'Return detailed network information (GET /network)' },
          { name: 'Network Eras', value: 'getNetworkEras', description: 'Query summary of blockchain eras (GET /network/eras)' },
        ],
        default: 'getNetworkInfo',
      },

      // ================= POOLS OPERATIONS =================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            category: ['pools'],
          },
        },
        options: [
          { name: 'List Stake Pools', value: 'listPools', description: 'List registered stake pools (GET /pools)' },
          { name: 'List Stake Pools Extended', value: 'listPoolsExtended', description: 'List registered stake pools with additional information (GET /pools/extended)' },
          { name: 'List Retired Pools', value: 'listRetiredPools', description: 'List already retired pools (GET /pools/retired)' },
          { name: 'List Retiring Pools', value: 'listRetiringPools', description: 'List stake pools retiring in upcoming epochs (GET /pools/retiring)' },
          { name: 'Specific Stake Pool', value: 'getPool', description: 'Pool information (GET /pools/{pool_id})' },
          { name: 'Stake Pool History', value: 'getPoolHistory', description: 'History of stake pool parameters over epochs (GET /pools/{pool_id}/history)' },
          { name: 'Stake Pool Metadata', value: 'getPoolMetadata', description: 'Stake pool registration metadata (GET /pools/{pool_id}/metadata)' },
          { name: 'Stake Pool Relays', value: 'getPoolRelays', description: 'Relays of a stake pool (GET /pools/{pool_id}/relays)' },
          { name: 'Stake Pool Delegators', value: 'getPoolDelegators', description: 'List current stake pool delegators (GET /pools/{pool_id}/delegators)' },
          { name: 'Stake Pool Blocks', value: 'getPoolBlocks', description: 'List stake pool blocks (GET /pools/{pool_id}/blocks)' },
          { name: 'Stake Pool Updates', value: 'getPoolUpdates', description: 'List certificate updates to the stake pool (GET /pools/{pool_id}/updates)' },
          { name: 'Stake Pool Votes', value: 'getPoolVotes', description: 'History of stake pool votes (GET /pools/{pool_id}/votes)' },
        ],
        default: 'listPools',
      },
      {
        displayName: 'Pool ID',
        name: 'poolId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['pools'],
            operation: ['getPool', 'getPoolHistory', 'getPoolMetadata', 'getPoolRelays', 'getPoolDelegators', 'getPoolBlocks', 'getPoolUpdates', 'getPoolVotes'],
          },
        },
        description: 'Bech32 encoded pool ID',
      },

      // ================= SCRIPTS OPERATIONS =================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            category: ['scripts'],
          },
        },
        options: [
          { name: 'List Scripts', value: 'listScripts', description: 'List of scripts (GET /scripts)' },
          { name: 'Specific Script', value: 'getScript', description: 'Information about a specific script (GET /scripts/{script_hash})' },
          { name: 'Script JSON', value: 'getScriptJson', description: 'JSON representation of a timelock script (GET /scripts/{script_hash}/json)' },
          { name: 'Script CBOR', value: 'getScriptCbor', description: 'CBOR representation of a plutus script (GET /scripts/{script_hash}/cbor)' },
          { name: 'Script Redeemers', value: 'getScriptRedeemers', description: 'List redeemers of a specific script (GET /scripts/{script_hash}/redeemers)' },
          { name: 'Datum Value', value: 'getDatum', description: 'Query JSON value of a datum by its hash (GET /scripts/datum/{datum_hash})' },
          { name: 'Datum CBOR Value', value: 'getDatumCbor', description: 'Query CBOR serialised datum by its hash (GET /scripts/datum/{datum_hash}/cbor)' },
        ],
        default: 'listScripts',
      },
      {
        displayName: 'Script Hash',
        name: 'scriptHash',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['scripts'],
            operation: ['getScript', 'getScriptJson', 'getScriptCbor', 'getScriptRedeemers'],
          },
        },
        description: 'Script hash',
      },
      {
        displayName: 'Datum Hash',
        name: 'datumHash',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['scripts'],
            operation: ['getDatum', 'getDatumCbor'],
          },
        },
        description: 'Datum hash',
      },

      // ================= TRANSACTIONS OPERATIONS =================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            category: ['transactions'],
          },
        },
        options: [
          { name: 'Specific Transaction', value: 'getTransaction', description: 'Return content of the requested transaction (GET /txs/{hash})' },
          { name: 'Transaction UTXOs', value: 'getTransactionUtxos', description: 'Return inputs and UTXOs of the specific transaction (GET /txs/{hash}/utxos)' },
          { name: 'Transaction Stakes', value: 'getTransactionStakes', description: 'Obtain information about stake addresses certificates (GET /txs/{hash}/stakes)' },
          { name: 'Transaction Delegations', value: 'getTransactionDelegations', description: 'Obtain information about delegation certificates (GET /txs/{hash}/delegations)' },
          { name: 'Transaction Withdrawals', value: 'getTransactionWithdrawals', description: 'Obtain information about withdrawals (GET /txs/{hash}/withdrawals)' },
          { name: 'Transaction MIRs', value: 'getTransactionMirs', description: 'Obtain information about Move Instantaneous Rewards (GET /txs/{hash}/mirs)' },
          { name: 'Transaction Pool Updates', value: 'getTransactionPoolUpdates', description: 'Obtain information about stake pool registration and update certificates (GET /txs/{hash}/pool_updates)' },
          { name: 'Transaction Pool Retires', value: 'getTransactionPoolRetires', description: 'Obtain information about stake pool retirements (GET /txs/{hash}/pool_retires)' },
          { name: 'Transaction Metadata', value: 'getTransactionMetadata', description: 'Obtain the transaction metadata (GET /txs/{hash}/metadata)' },
          { name: 'Transaction Metadata CBOR', value: 'getTransactionMetadataCbor', description: 'Obtain the transaction metadata in CBOR (GET /txs/{hash}/metadata/cbor)' },
          { name: 'Transaction Redeemers', value: 'getTransactionRedeemers', description: 'Obtain the transaction redeemers (GET /txs/{hash}/redeemers)' },
          { name: 'Transaction Required Signers', value: 'getTransactionRequiredSigners', description: 'Obtain the extra transaction witnesses (GET /txs/{hash}/required_signers)' },
          { name: 'Transaction CBOR', value: 'getTransactionCbor', description: 'Obtain the CBOR serialized transaction (GET /txs/{hash}/cbor)' },
          { name: 'Submit Transaction', value: 'submitTransaction', description: 'Submit an already serialized transaction to the network (POST /tx/submit)' },
        ],
        default: 'getTransaction',
      },
      {
        displayName: 'Transaction Hash',
        name: 'txHash',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['transactions'],
            operation: ['getTransaction', 'getTransactionUtxos', 'getTransactionStakes', 'getTransactionDelegations', 'getTransactionWithdrawals', 'getTransactionMirs', 'getTransactionPoolUpdates', 'getTransactionPoolRetires', 'getTransactionMetadata', 'getTransactionMetadataCbor', 'getTransactionRedeemers', 'getTransactionRequiredSigners', 'getTransactionCbor'],
          },
        },
        description: 'Transaction hash',
      },
      {
        displayName: 'Transaction CBOR',
        name: 'transactionCbor',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['transactions'],
            operation: ['submitTransaction'],
          },
        },
        description: 'Serialized transaction in CBOR format',
      },

      // ================= UTILITIES OPERATIONS =================
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            category: ['utilities'],
          },
        },
        options: [
          { name: 'Derive Address', value: 'deriveAddress', description: 'Derive Shelley address from an xpub (GET /utils/addresses/xpub/{xpub}/{role}/{index})' },
          { name: 'Evaluate Transaction', value: 'evaluateTransaction', description: 'Submit transaction for execution units evaluation (POST /utils/txs/evaluate)' },
          { name: 'Evaluate Transaction with UTXOs', value: 'evaluateTransactionUtxos', description: 'Submit transaction for evaluation with additional UTXO set (POST /utils/txs/evaluate/utxos)' },
        ],
        default: 'deriveAddress',
      },
      {
        displayName: 'XPub',
        name: 'xpub',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['utilities'],
            operation: ['deriveAddress'],
          },
        },
        description: 'Extended public key (xpub)',
      },
      {
        displayName: 'Role',
        name: 'role',
        type: 'number',
        required: true,
        default: 0,
        displayOptions: {
          show: {
            category: ['utilities'],
            operation: ['deriveAddress'],
          },
        },
        description: 'Role (0 for external, 1 for internal)',
      },
      {
        displayName: 'Index',
        name: 'index',
        type: 'number',
        required: true,
        default: 0,
        displayOptions: {
          show: {
            category: ['utilities'],
            operation: ['deriveAddress'],
          },
        },
        description: 'Address index',
      },
      {
        displayName: 'Transaction CBOR',
        name: 'transactionCbor',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['utilities'],
            operation: ['evaluateTransaction', 'evaluateTransactionUtxos'],
          },
        },
        description: 'Serialized transaction in CBOR format',
      },
      {
        displayName: 'Additional UTXOs',
        name: 'additionalUtxos',
        type: 'json',
        required: false,
        default: '[]',
        displayOptions: {
          show: {
            category: ['utilities'],
            operation: ['evaluateTransactionUtxos'],
          },
        },
        description: 'Additional UTXO set as JSON array',
      },

      // ================= COMMON PARAMETERS =================
      {
        displayName: 'Count',
        name: 'count',
        type: 'number',
        default: 100,
        required: false,
        displayOptions: {
          show: {
            category: ['epochs', 'governance', 'mempool', 'metadata', 'pools', 'scripts'],
          },
        },
        description: 'Max number of results per page (1-100)',
      },
      {
        displayName: 'Page',
        name: 'page',
        type: 'number',
        default: 1,
        required: false,
        displayOptions: {
          show: {
            category: ['epochs', 'governance', 'mempool', 'metadata', 'pools', 'scripts'],
          },
        },
        description: 'Page number for results',
      },
      {
        displayName: 'Order',
        name: 'order',
        type: 'options',
        options: [
          { name: 'Ascending', value: 'asc' },
          { name: 'Descending', value: 'desc' },
        ],
        default: 'asc',
        required: false,
        displayOptions: {
          show: {
            category: ['epochs', 'governance', 'mempool', 'metadata', 'pools', 'scripts'],
          },
        },
        description: 'Order of results',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const credentials = await this.getCredentials('blockfrostApi');
    const blockfrost = new BlockFrostAPI({
      projectId: credentials.projectId as string,
      network: credentials.network as 'mainnet' | 'preprod' | 'preview',
    });

    const category = this.getNodeParameter('category', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;
    let responseData: IDataObject[] = [];

    try {
      if (category === 'assets') {
        // Query params
        const count = this.getNodeParameter('count', 0, 100) as number;
        const page = this.getNodeParameter('page', 0, 1) as number;
        const order = this.getNodeParameter('order', 0, 'asc') as string;
        const operation = this.getNodeParameter('operation', 0) as string;
        let url = '';
  let params: Record<string, any> = { count, page, order };
        let asset = '';
        let policyId = '';
        switch (operation) {
          case 'listAssets':
            url = '/assets';
            break;
          case 'getAsset':
            asset = this.getNodeParameter('asset', 0) as string;
            url = `/assets/${asset}`;
            params = {}; // No query params for this endpoint
            break;
          case 'getAssetHistory':
            asset = this.getNodeParameter('asset', 0) as string;
            url = `/assets/${asset}/history`;
            break;
          case 'getAssetTransactions':
            asset = this.getNodeParameter('asset', 0) as string;
            url = `/assets/${asset}/transactions`;
            break;
          case 'getAssetTxs':
            asset = this.getNodeParameter('asset', 0) as string;
            url = `/assets/${asset}/txs`;
            break;
          case 'getAssetAddresses':
            asset = this.getNodeParameter('asset', 0) as string;
            url = `/assets/${asset}/addresses`;
            break;
          case 'listPolicyAssets':
            policyId = this.getNodeParameter('policyId', 0) as string;
            url = `/assets/policy/${policyId}`;
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
        // Use direct HTTP request for all assets endpoints
        const apiBase = credentials.network === 'mainnet'
          ? 'https://cardano-mainnet.blockfrost.io/api/v0'
          : credentials.network === 'preprod'
            ? 'https://cardano-preprod.blockfrost.io/api/v0'
            : 'https://cardano-preview.blockfrost.io/api/v0';
        const reqUrl = apiBase + url;
        const headers = {
          project_id: credentials.projectId as string,
        };
        let gotOptions: any = {
          method: 'GET',
          headers,
          responseType: 'json',
        };
        if (params && Object.keys(params).length > 0) {
          gotOptions.searchParams = params;
        }
        const response = await got(reqUrl, gotOptions);
        const body = response.body;
        if (Array.isArray(body)) {
          responseData = body as IDataObject[];
        } else if (typeof body === 'object' && body !== null) {
          responseData = [body as IDataObject];
        } else {
          responseData = [{ result: body }];
        }
      } else if (category === 'health') {
        switch (operation) {
          case 'root':
            responseData = [await blockfrost.root() as IDataObject];
            break;
          case 'health':
            responseData = [await blockfrost.health() as IDataObject];
            break;
          case 'clock':
            responseData = [await blockfrost.healthClock() as IDataObject];
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      } else if (category === 'metrics') {
        switch (operation) {
          case 'usage':
            responseData = await blockfrost.metrics();
            break;
          case 'endpoints':
            responseData = await blockfrost.metricsEndpoints();
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      } else if (category === 'accounts') {
        const stakeAddress = this.getNodeParameter('stakeAddress', 0) as string;
        switch (operation) {
          case 'getAccount':
            responseData = [await blockfrost.accounts(stakeAddress) as IDataObject];
            break;
          case 'getRewards':
            responseData = await blockfrost.accountsRewards(stakeAddress);
            break;
          case 'getHistory':
            responseData = await blockfrost.accountsHistory(stakeAddress);
            break;
          case 'getDelegations':
            responseData = await blockfrost.accountsDelegations(stakeAddress);
            break;
          case 'getRegistrations':
            responseData = await blockfrost.accountsRegistrations(stakeAddress);
            break;
          case 'getWithdrawals':
            responseData = await blockfrost.accountsWithdrawals(stakeAddress);
            break;
          case 'getMirs':
            responseData = await blockfrost.accountsMirs(stakeAddress);
            break;
          case 'getAddresses':
            responseData = await blockfrost.accountsAddresses(stakeAddress);
            break;
          case 'getAddressesAssets':
            responseData = await blockfrost.accountsAddressesAssets(stakeAddress);
            break;
          case 'getAddressesTotal':
            responseData = [await blockfrost.accountsAddressesTotal(stakeAddress) as IDataObject];
            break;
          case 'getUtxos':
            if (typeof (blockfrost as any).request === 'function') {
              responseData = await (blockfrost as any).request(`/accounts/${stakeAddress}/utxos`);
            } else if (typeof (blockfrost as any)._request === 'function') {
              responseData = await (blockfrost as any)._request('GET', `/accounts/${stakeAddress}/utxos`);
            } else {
              throw new Error('accountsUtxos method not available in Blockfrost SDK.');
            }
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      } else if (category === 'addresses') {
        const address = this.getNodeParameter('address', 0) as string;
        switch (operation) {
          case 'getAddress':
            responseData = [await blockfrost.addresses(address) as IDataObject];
            break;
          case 'getAddressExtended':
            responseData = [await blockfrost.addressesExtended(address) as IDataObject];
            break;
          case 'getAddressTotal':
            responseData = [await blockfrost.addressesTotal(address) as IDataObject];
            break;
          case 'getAddressUtxos':
            responseData = await blockfrost.addressesUtxos(address);
            break;
          case 'getAddressUtxosAsset': {
            const asset = this.getNodeParameter('asset', 0) as string;
            if (!asset) throw new Error('Asset is required for this operation.');
            // Use generic request for asset-specific UTXOs
            if (typeof (blockfrost as any).request === 'function') {
              responseData = await (blockfrost as any).request(`/addresses/${address}/utxos/${asset}`);
            } else if (typeof (blockfrost as any)._request === 'function') {
              responseData = await (blockfrost as any)._request('GET', `/addresses/${address}/utxos/${asset}`);
            } else {
              throw new Error('addressesUtxosAsset method not available in Blockfrost SDK.');
            }
            break;
          }
          case 'getAddressTransactions':
            responseData = await blockfrost.addressesTransactions(address);
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      } else if (category === 'blocks') {
        // Query params for blocks endpoints
        const count = this.getNodeParameter('count', 0, 100) as number;
        const page = this.getNodeParameter('page', 0, 1) as number;
        const order = this.getNodeParameter('order', 0, 'asc') as string;
        
        let url = '';
        let params: Record<string, any> = {};
        
        switch (operation) {
          case 'getLatestBlock':
            url = '/blocks/latest';
            break;
          case 'getLatestBlockTxs':
            url = '/blocks/latest/txs';
            params = { count, page, order };
            break;
          case 'getLatestBlockTxsCbor':
            url = '/blocks/latest/txs/cbor';
            params = { count, page, order };
            break;
          case 'getBlock': {
            const hashOrNumber = this.getNodeParameter('hashOrNumber', 0) as string;
            url = `/blocks/${hashOrNumber}`;
            break;
          }
          case 'getNextBlocks': {
            const hashOrNumber = this.getNodeParameter('hashOrNumber', 0) as string;
            url = `/blocks/${hashOrNumber}/next`;
            params = { count, page };
            break;
          }
          case 'getPreviousBlocks': {
            const hashOrNumber = this.getNodeParameter('hashOrNumber', 0) as string;
            url = `/blocks/${hashOrNumber}/previous`;
            params = { count, page };
            break;
          }
          case 'getBlockInSlot': {
            const slotNumber = this.getNodeParameter('slotNumber', 0) as number;
            
            // Validate parameters
            if (slotNumber < 0) {
              throw new Error('Slot number must be non-negative');
            }
            
            url = `/blocks/slot/${slotNumber}`;
            break;
          }
          case 'getBlockInEpochSlot': {
            const epochNumber = this.getNodeParameter('epochNumber', 0) as number;
            const slotNumber = this.getNodeParameter('epochSlotNumber', 0) as number;
            
            // Validate parameters
            if (epochNumber < 0) {
              throw new Error('Epoch number must be non-negative');
            }
            if (slotNumber < 0) {
              throw new Error('Slot number must be non-negative');
            }
            
            url = `/blocks/epoch/${epochNumber}/slot/${slotNumber}`;
            break;
          }
          case 'getBlockTxs': {
            const hashOrNumber = this.getNodeParameter('hashOrNumber', 0) as string;
            if (!hashOrNumber || hashOrNumber.trim() === '') {
              throw new Error('Block hash or number is required');
            }
            url = `/blocks/${hashOrNumber}/txs`;
            params = { count, page, order };
            break;
          }
          case 'getBlockTxsCbor': {
            const hashOrNumber = this.getNodeParameter('hashOrNumber', 0) as string;
            if (!hashOrNumber || hashOrNumber.trim() === '') {
              throw new Error('Block hash or number is required');
            }
            url = `/blocks/${hashOrNumber}/txs/cbor`;
            params = { count, page, order };
            break;
          }
          case 'getBlockAddresses': {
            const hashOrNumber = this.getNodeParameter('hashOrNumber', 0) as string;
            if (!hashOrNumber || hashOrNumber.trim() === '') {
              throw new Error('Block hash or number is required');
            }
            url = `/blocks/${hashOrNumber}/addresses`;
            params = { count, page, order };
            break;
          }
          default:
            throw new Error(`Unknown blocks operation: ${operation}`);
        }
        
        // Use direct HTTP request for all blocks endpoints
        const apiBase = credentials.network === 'mainnet'
          ? 'https://cardano-mainnet.blockfrost.io/api/v0'
          : credentials.network === 'preprod'
            ? 'https://cardano-preprod.blockfrost.io/api/v0'
            : 'https://cardano-preview.blockfrost.io/api/v0';
            
        const reqUrl = apiBase + url;
        const headers = {
          project_id: credentials.projectId as string,
        };
        
        let gotOptions: any = {
          method: 'GET',
          headers,
          responseType: 'json',
        };
        
        if (params && Object.keys(params).length > 0) {
          gotOptions.searchParams = params;
        }
        
        const response = await got(reqUrl, gotOptions);
        const body = response.body;
        
        if (Array.isArray(body)) {
          responseData = body as IDataObject[];
        } else if (typeof body === 'object' && body !== null) {
          responseData = [body as IDataObject];
        } else {
          responseData = [{ result: body }];
        }
      } else if (category === 'epochs') {
        // ================= EPOCHS IMPLEMENTATION =================
        const count = this.getNodeParameter('count', 0, 100) as number;
        const page = this.getNodeParameter('page', 0, 1) as number;
        const order = this.getNodeParameter('order', 0, 'asc') as string;
        
        let url = '';
        let params: Record<string, any> = {};
        
        switch (operation) {
          case 'getLatestEpoch':
            url = '/epochs/latest';
            break;
          case 'getLatestEpochParameters':
            url = '/epochs/latest/parameters';
            break;
          case 'getEpoch': {
            const epochNumber = this.getNodeParameter('epochNumber', 0) as number;
            url = `/epochs/${epochNumber}`;
            break;
          }
          case 'getNextEpochs': {
            const epochNumber = this.getNodeParameter('epochNumber', 0) as number;
            url = `/epochs/${epochNumber}/next`;
            params = { count, page };
            break;
          }
          case 'getPreviousEpochs': {
            const epochNumber = this.getNodeParameter('epochNumber', 0) as number;
            url = `/epochs/${epochNumber}/previous`;
            params = { count, page };
            break;
          }
          case 'getEpochStakes': {
            const epochNumber = this.getNodeParameter('epochNumber', 0) as number;
            url = `/epochs/${epochNumber}/stakes`;
            params = { count, page };
            break;
          }
          case 'getEpochStakesByPool': {
            const epochNumber = this.getNodeParameter('epochNumber', 0) as number;
            const poolId = this.getNodeParameter('poolId', 0) as string;
            url = `/epochs/${epochNumber}/stakes/${poolId}`;
            params = { count, page };
            break;
          }
          case 'getEpochBlocks': {
            const epochNumber = this.getNodeParameter('epochNumber', 0) as number;
            url = `/epochs/${epochNumber}/blocks`;
            params = { count, page, order };
            break;
          }
          case 'getEpochBlocksByPool': {
            const epochNumber = this.getNodeParameter('epochNumber', 0) as number;
            const poolId = this.getNodeParameter('poolId', 0) as string;
            url = `/epochs/${epochNumber}/blocks/${poolId}`;
            params = { count, page, order };
            break;
          }
          case 'getEpochParameters': {
            const epochNumber = this.getNodeParameter('epochNumber', 0) as number;
            url = `/epochs/${epochNumber}/parameters`;
            break;
          }
          default:
            throw new Error(`Unknown epochs operation: ${operation}`);
        }
        
        const apiBase = credentials.network === 'mainnet'
          ? 'https://cardano-mainnet.blockfrost.io/api/v0'
          : credentials.network === 'preprod'
            ? 'https://cardano-preprod.blockfrost.io/api/v0'
            : 'https://cardano-preview.blockfrost.io/api/v0';
            
        const reqUrl = apiBase + url;
        const headers = { project_id: credentials.projectId as string };
        let gotOptions: any = { method: 'GET', headers, responseType: 'json' };
        
        if (params && Object.keys(params).length > 0) {
          gotOptions.searchParams = params;
        }
        
        const response = await got(reqUrl, gotOptions);
        const body = response.body;
        
        if (Array.isArray(body)) {
          responseData = body as IDataObject[];
        } else if (typeof body === 'object' && body !== null) {
          responseData = [body as IDataObject];
        } else {
          responseData = [{ result: body }];
        }
        
      } else if (category === 'governance') {
        // ================= GOVERNANCE IMPLEMENTATION =================
        const count = this.getNodeParameter('count', 0, 100) as number;
        const page = this.getNodeParameter('page', 0, 1) as number;
        const order = this.getNodeParameter('order', 0, 'asc') as string;
        
        let url = '';
        let params: Record<string, any> = {};
        
        switch (operation) {
          case 'listDreps':
            url = '/governance/dreps';
            params = { count, page, order };
            break;
          case 'getDrep': {
            const drepId = this.getNodeParameter('drepId', 0) as string;
            url = `/governance/dreps/${drepId}`;
            break;
          }
          case 'getDrepDelegators': {
            const drepId = this.getNodeParameter('drepId', 0) as string;
            url = `/governance/dreps/${drepId}/delegators`;
            params = { count, page, order };
            break;
          }
          case 'getDrepMetadata': {
            const drepId = this.getNodeParameter('drepId', 0) as string;
            url = `/governance/dreps/${drepId}/metadata`;
            break;
          }
          case 'getDrepUpdates': {
            const drepId = this.getNodeParameter('drepId', 0) as string;
            url = `/governance/dreps/${drepId}/updates`;
            params = { count, page, order };
            break;
          }
          case 'getDrepVotes': {
            const drepId = this.getNodeParameter('drepId', 0) as string;
            url = `/governance/dreps/${drepId}/votes`;
            params = { count, page, order };
            break;
          }
          case 'listProposals':
            url = '/governance/proposals';
            params = { count, page, order };
            break;
          case 'getProposal': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            const certIndex = this.getNodeParameter('certIndex', 0) as number;
            url = `/governance/proposals/${txHash}/${certIndex}`;
            break;
          }
          case 'getProposalParameters': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            const certIndex = this.getNodeParameter('certIndex', 0) as number;
            url = `/governance/proposals/${txHash}/${certIndex}/parameters`;
            break;
          }
          case 'getProposalWithdrawals': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            const certIndex = this.getNodeParameter('certIndex', 0) as number;
            url = `/governance/proposals/${txHash}/${certIndex}/withdrawals`;
            params = { count, page, order };
            break;
          }
          case 'getProposalVotes': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            const certIndex = this.getNodeParameter('certIndex', 0) as number;
            url = `/governance/proposals/${txHash}/${certIndex}/votes`;
            params = { count, page, order };
            break;
          }
          case 'getProposalMetadata': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            const certIndex = this.getNodeParameter('certIndex', 0) as number;
            url = `/governance/proposals/${txHash}/${certIndex}/metadata`;
            break;
          }
          default:
            throw new Error(`Unknown governance operation: ${operation}`);
        }
        
        const apiBase = credentials.network === 'mainnet'
          ? 'https://cardano-mainnet.blockfrost.io/api/v0'
          : credentials.network === 'preprod'
            ? 'https://cardano-preprod.blockfrost.io/api/v0'
            : 'https://cardano-preview.blockfrost.io/api/v0';
            
        const reqUrl = apiBase + url;
        const headers = { project_id: credentials.projectId as string };
        let gotOptions: any = { method: 'GET', headers, responseType: 'json' };
        
        if (params && Object.keys(params).length > 0) {
          gotOptions.searchParams = params;
        }
        
        const response = await got(reqUrl, gotOptions);
        const body = response.body;
        
        if (Array.isArray(body)) {
          responseData = body as IDataObject[];
        } else if (typeof body === 'object' && body !== null) {
          responseData = [body as IDataObject];
        } else {
          responseData = [{ result: body }];
        }
        
      } else if (category === 'ledger') {
        // ================= LEDGER IMPLEMENTATION =================
        switch (operation) {
          case 'getGenesis':
            responseData = [await blockfrost.genesis() as IDataObject];
            break;
          default:
            throw new Error(`Unknown ledger operation: ${operation}`);
        }
        
      } else if (category === 'mempool') {
        // ================= MEMPOOL IMPLEMENTATION =================
        const count = this.getNodeParameter('count', 0, 100) as number;
        const page = this.getNodeParameter('page', 0, 1) as number;
        const order = this.getNodeParameter('order', 0, 'asc') as string;
        
        let url = '';
        let params: Record<string, any> = {};
        
        switch (operation) {
          case 'getMempool':
            url = '/mempool';
            params = { count, page, order };
            break;
          case 'getMempoolTx': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            url = `/mempool/${txHash}`;
            break;
          }
          case 'getMempoolByAddress': {
            const address = this.getNodeParameter('address', 0) as string;
            url = `/mempool/addresses/${address}`;
            params = { count, page, order };
            break;
          }
          default:
            throw new Error(`Unknown mempool operation: ${operation}`);
        }
        
        const apiBase = credentials.network === 'mainnet'
          ? 'https://cardano-mainnet.blockfrost.io/api/v0'
          : credentials.network === 'preprod'
            ? 'https://cardano-preprod.blockfrost.io/api/v0'
            : 'https://cardano-preview.blockfrost.io/api/v0';
            
        const reqUrl = apiBase + url;
        const headers = { project_id: credentials.projectId as string };
        let gotOptions: any = { method: 'GET', headers, responseType: 'json' };
        
        if (params && Object.keys(params).length > 0) {
          gotOptions.searchParams = params;
        }
        
        const response = await got(reqUrl, gotOptions);
        const body = response.body;
        
        if (Array.isArray(body)) {
          responseData = body as IDataObject[];
        } else if (typeof body === 'object' && body !== null) {
          responseData = [body as IDataObject];
        } else {
          responseData = [{ result: body }];
        }
        
      } else if (category === 'metadata') {
        // ================= METADATA IMPLEMENTATION =================
        const count = this.getNodeParameter('count', 0, 100) as number;
        const page = this.getNodeParameter('page', 0, 1) as number;
        const order = this.getNodeParameter('order', 0, 'asc') as string;
        
        let url = '';
        let params: Record<string, any> = {};
        
        switch (operation) {
          case 'getTxMetadataLabels':
            url = '/metadata/txs/labels';
            params = { count, page, order };
            break;
          case 'getTxMetadataByLabelJson': {
            const label = this.getNodeParameter('label', 0) as string;
            url = `/metadata/txs/labels/${label}`;
            params = { count, page, order };
            break;
          }
          case 'getTxMetadataByLabelCbor': {
            const label = this.getNodeParameter('label', 0) as string;
            url = `/metadata/txs/labels/${label}/cbor`;
            params = { count, page, order };
            break;
          }
          default:
            throw new Error(`Unknown metadata operation: ${operation}`);
        }
        
        const apiBase = credentials.network === 'mainnet'
          ? 'https://cardano-mainnet.blockfrost.io/api/v0'
          : credentials.network === 'preprod'
            ? 'https://cardano-preprod.blockfrost.io/api/v0'
            : 'https://cardano-preview.blockfrost.io/api/v0';
            
        const reqUrl = apiBase + url;
        const headers = { project_id: credentials.projectId as string };
        let gotOptions: any = { method: 'GET', headers, responseType: 'json' };
        
        if (params && Object.keys(params).length > 0) {
          gotOptions.searchParams = params;
        }
        
        const response = await got(reqUrl, gotOptions);
        const body = response.body;
        
        if (Array.isArray(body)) {
          responseData = body as IDataObject[];
        } else if (typeof body === 'object' && body !== null) {
          responseData = [body as IDataObject];
        } else {
          responseData = [{ result: body }];
        }
        
      } else if (category === 'network') {
        // ================= NETWORK IMPLEMENTATION =================
        switch (operation) {
          case 'getNetworkInfo':
            responseData = [await blockfrost.network() as IDataObject];
            break;
          case 'getNetworkEras':
            responseData = await blockfrost.networkEras();
            break;
          default:
            throw new Error(`Unknown network operation: ${operation}`);
        }
        
      } else if (category === 'pools') {
        // ================= POOLS IMPLEMENTATION =================
        const count = this.getNodeParameter('count', 0, 100) as number;
        const page = this.getNodeParameter('page', 0, 1) as number;
        const order = this.getNodeParameter('order', 0, 'asc') as string;
        
        let url = '';
        let params: Record<string, any> = {};
        
        switch (operation) {
          case 'listPools':
            url = '/pools';
            params = { count, page, order };
            break;
          case 'listPoolsExtended':
            url = '/pools/extended';
            params = { count, page, order };
            break;
          case 'listRetiredPools':
            url = '/pools/retired';
            params = { count, page, order };
            break;
          case 'listRetiringPools':
            url = '/pools/retiring';
            params = { count, page, order };
            break;
          case 'getPool': {
            const poolId = this.getNodeParameter('poolId', 0) as string;
            url = `/pools/${poolId}`;
            break;
          }
          case 'getPoolHistory': {
            const poolId = this.getNodeParameter('poolId', 0) as string;
            url = `/pools/${poolId}/history`;
            params = { count, page, order };
            break;
          }
          case 'getPoolMetadata': {
            const poolId = this.getNodeParameter('poolId', 0) as string;
            url = `/pools/${poolId}/metadata`;
            break;
          }
          case 'getPoolRelays': {
            const poolId = this.getNodeParameter('poolId', 0) as string;
            url = `/pools/${poolId}/relays`;
            break;
          }
          case 'getPoolDelegators': {
            const poolId = this.getNodeParameter('poolId', 0) as string;
            url = `/pools/${poolId}/delegators`;
            params = { count, page, order };
            break;
          }
          case 'getPoolBlocks': {
            const poolId = this.getNodeParameter('poolId', 0) as string;
            url = `/pools/${poolId}/blocks`;
            params = { count, page, order };
            break;
          }
          case 'getPoolUpdates': {
            const poolId = this.getNodeParameter('poolId', 0) as string;
            url = `/pools/${poolId}/updates`;
            params = { count, page, order };
            break;
          }
          case 'getPoolVotes': {
            const poolId = this.getNodeParameter('poolId', 0) as string;
            url = `/pools/${poolId}/votes`;
            params = { count, page, order };
            break;
          }
          default:
            throw new Error(`Unknown pools operation: ${operation}`);
        }
        
        const apiBase = credentials.network === 'mainnet'
          ? 'https://cardano-mainnet.blockfrost.io/api/v0'
          : credentials.network === 'preprod'
            ? 'https://cardano-preprod.blockfrost.io/api/v0'
            : 'https://cardano-preview.blockfrost.io/api/v0';
            
        const reqUrl = apiBase + url;
        const headers = { project_id: credentials.projectId as string };
        let gotOptions: any = { method: 'GET', headers, responseType: 'json' };
        
        if (params && Object.keys(params).length > 0) {
          gotOptions.searchParams = params;
        }
        
        const response = await got(reqUrl, gotOptions);
        const body = response.body;
        
        if (Array.isArray(body)) {
          responseData = body as IDataObject[];
        } else if (typeof body === 'object' && body !== null) {
          responseData = [body as IDataObject];
        } else {
          responseData = [{ result: body }];
        }
        
      } else if (category === 'scripts') {
        // ================= SCRIPTS IMPLEMENTATION =================
        const count = this.getNodeParameter('count', 0, 100) as number;
        const page = this.getNodeParameter('page', 0, 1) as number;
        const order = this.getNodeParameter('order', 0, 'asc') as string;
        
        let url = '';
        let params: Record<string, any> = {};
        
        switch (operation) {
          case 'listScripts':
            url = '/scripts';
            params = { count, page, order };
            break;
          case 'getScript': {
            const scriptHash = this.getNodeParameter('scriptHash', 0) as string;
            url = `/scripts/${scriptHash}`;
            break;
          }
          case 'getScriptJson': {
            const scriptHash = this.getNodeParameter('scriptHash', 0) as string;
            url = `/scripts/${scriptHash}/json`;
            break;
          }
          case 'getScriptCbor': {
            const scriptHash = this.getNodeParameter('scriptHash', 0) as string;
            url = `/scripts/${scriptHash}/cbor`;
            break;
          }
          case 'getScriptRedeemers': {
            const scriptHash = this.getNodeParameter('scriptHash', 0) as string;
            url = `/scripts/${scriptHash}/redeemers`;
            params = { count, page, order };
            break;
          }
          case 'getDatum': {
            const datumHash = this.getNodeParameter('datumHash', 0) as string;
            url = `/scripts/datum/${datumHash}`;
            break;
          }
          case 'getDatumCbor': {
            const datumHash = this.getNodeParameter('datumHash', 0) as string;
            url = `/scripts/datum/${datumHash}/cbor`;
            break;
          }
          default:
            throw new Error(`Unknown scripts operation: ${operation}`);
        }
        
        const apiBase = credentials.network === 'mainnet'
          ? 'https://cardano-mainnet.blockfrost.io/api/v0'
          : credentials.network === 'preprod'
            ? 'https://cardano-preprod.blockfrost.io/api/v0'
            : 'https://cardano-preview.blockfrost.io/api/v0';
            
        const reqUrl = apiBase + url;
        const headers = { project_id: credentials.projectId as string };
        let gotOptions: any = { method: 'GET', headers, responseType: 'json' };
        
        if (params && Object.keys(params).length > 0) {
          gotOptions.searchParams = params;
        }
        
        const response = await got(reqUrl, gotOptions);
        const body = response.body;
        
        if (Array.isArray(body)) {
          responseData = body as IDataObject[];
        } else if (typeof body === 'object' && body !== null) {
          responseData = [body as IDataObject];
        } else {
          responseData = [{ result: body }];
        }
        
      } else if (category === 'transactions') {
        // ================= TRANSACTIONS IMPLEMENTATION =================
        let url = '';
        let method = 'GET';
        let requestBody: any = null;
        
        switch (operation) {
          case 'getTransaction': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            url = `/txs/${txHash}`;
            break;
          }
          case 'getTransactionUtxos': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            url = `/txs/${txHash}/utxos`;
            break;
          }
          case 'getTransactionStakes': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            url = `/txs/${txHash}/stakes`;
            break;
          }
          case 'getTransactionDelegations': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            url = `/txs/${txHash}/delegations`;
            break;
          }
          case 'getTransactionWithdrawals': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            url = `/txs/${txHash}/withdrawals`;
            break;
          }
          case 'getTransactionMirs': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            url = `/txs/${txHash}/mirs`;
            break;
          }
          case 'getTransactionPoolUpdates': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            url = `/txs/${txHash}/pool_updates`;
            break;
          }
          case 'getTransactionPoolRetires': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            url = `/txs/${txHash}/pool_retires`;
            break;
          }
          case 'getTransactionMetadata': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            url = `/txs/${txHash}/metadata`;
            break;
          }
          case 'getTransactionMetadataCbor': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            url = `/txs/${txHash}/metadata/cbor`;
            break;
          }
          case 'getTransactionRedeemers': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            url = `/txs/${txHash}/redeemers`;
            break;
          }
          case 'getTransactionRequiredSigners': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            url = `/txs/${txHash}/required_signers`;
            break;
          }
          case 'getTransactionCbor': {
            const txHash = this.getNodeParameter('txHash', 0) as string;
            url = `/txs/${txHash}/cbor`;
            break;
          }
          case 'submitTransaction': {
            const transactionCbor = this.getNodeParameter('transactionCbor', 0) as string;
            url = '/tx/submit';
            method = 'POST';
            requestBody = transactionCbor;
            break;
          }
          default:
            throw new Error(`Unknown transactions operation: ${operation}`);
        }
        
        const apiBase = credentials.network === 'mainnet'
          ? 'https://cardano-mainnet.blockfrost.io/api/v0'
          : credentials.network === 'preprod'
            ? 'https://cardano-preprod.blockfrost.io/api/v0'
            : 'https://cardano-preview.blockfrost.io/api/v0';
            
        const reqUrl = apiBase + url;
        const headers: any = { 
          project_id: credentials.projectId as string,
        };
        
        if (method === 'POST') {
          headers['Content-Type'] = 'application/cbor';
        }
        
        let gotOptions: any = { method, headers, responseType: 'json' };
        
        if (requestBody) {
          gotOptions.body = requestBody;
        }
        
        const response = await got(reqUrl, gotOptions);
        const body = response.body;
        
        if (Array.isArray(body)) {
          responseData = body as IDataObject[];
        } else if (typeof body === 'object' && body !== null) {
          responseData = [body as IDataObject];
        } else {
          responseData = [{ result: body }];
        }
        
      } else if (category === 'utilities') {
        // ================= UTILITIES IMPLEMENTATION =================
        let url = '';
        let method = 'GET';
        let requestBody: any = null;
        
        switch (operation) {
          case 'deriveAddress': {
            const xpub = this.getNodeParameter('xpub', 0) as string;
            const role = this.getNodeParameter('role', 0) as number;
            const index = this.getNodeParameter('index', 0) as number;
            url = `/utils/addresses/xpub/${xpub}/${role}/${index}`;
            break;
          }
          case 'evaluateTransaction': {
            const transactionCbor = this.getNodeParameter('transactionCbor', 0) as string;
            url = '/utils/txs/evaluate';
            method = 'POST';
            requestBody = transactionCbor;
            break;
          }
          case 'evaluateTransactionUtxos': {
            const transactionCbor = this.getNodeParameter('transactionCbor', 0) as string;
            const additionalUtxos = this.getNodeParameter('additionalUtxos', 0, '[]') as string;
            url = '/utils/txs/evaluate/utxos';
            method = 'POST';
            requestBody = JSON.stringify({
              cbor: transactionCbor,
              additionalUtxoSet: JSON.parse(additionalUtxos)
            });
            break;
          }
          default:
            throw new Error(`Unknown utilities operation: ${operation}`);
        }
        
        const apiBase = credentials.network === 'mainnet'
          ? 'https://cardano-mainnet.blockfrost.io/api/v0'
          : credentials.network === 'preprod'
            ? 'https://cardano-preprod.blockfrost.io/api/v0'
            : 'https://cardano-preview.blockfrost.io/api/v0';
            
        const reqUrl = apiBase + url;
        const headers: any = { 
          project_id: credentials.projectId as string,
        };
        
        if (method === 'POST') {
          if (operation === 'evaluateTransactionUtxos') {
            headers['Content-Type'] = 'application/json';
          } else {
            headers['Content-Type'] = 'application/cbor';
          }
        }
        
        let gotOptions: any = { method, headers, responseType: 'json' };
        
        if (requestBody) {
          gotOptions.body = requestBody;
        }
        
        const response = await got(reqUrl, gotOptions);
        const body = response.body;
        
        if (Array.isArray(body)) {
          responseData = body as IDataObject[];
        } else if (typeof body === 'object' && body !== null) {
          responseData = [body as IDataObject];
        } else {
          responseData = [{ result: body }];
        }
        
      } else {
        throw new Error(`Category ${category} not implemented yet`);
      }
    } catch (error) {
      throw new Error(`Blockfrost API error: ${(error as Error).message}`);
    }
    return [this.helpers.returnJsonArray(responseData)];
  }
}

export default Blockfrost;