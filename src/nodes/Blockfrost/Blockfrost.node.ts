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