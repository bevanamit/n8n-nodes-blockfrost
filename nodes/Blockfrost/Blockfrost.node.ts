import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IDataObject,
} from 'n8n-workflow';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

export class BlockfrostNode implements INodeType {
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
      {
        displayName: 'Category',
        name: 'category',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Accounts',
            value: 'accounts',
          },
          {
            name: 'Addresses',
            value: 'addresses',
          },
          {
            name: 'Assets',
            value: 'assets',
          },
          {
            name: 'Blocks',
            value: 'blocks',
          },
          {
            name: 'Epochs',
            value: 'epochs',
          },
          {
            name: 'Network',
            value: 'network',
          },
          {
            name: 'Pools',
            value: 'pools',
          },
          {
            name: 'Transactions',
            value: 'transactions',
          },
          // Add more categories as implemented
        ],
        default: 'accounts',
        required: true,
      },
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
          {
            name: 'Get Account',
            value: 'getAccount',
            description: 'Get specific account information',
          },
          {
            name: 'Get Account Rewards',
            value: 'getAccountRewards',
            description: 'Get account reward history',
          },
          {
            name: 'Get Account History',
            value: 'getAccountHistory',
            description: 'Get account history',
          },
          {
            name: 'Get Account Delegations',
            value: 'getAccountDelegations',
            description: 'Get account delegation history',
          },
          {
            name: 'Get Account Registrations',
            value: 'getAccountRegistrations',
            description: 'Get account registration history',
          },
          {
            name: 'Get Account Withdrawals',
            value: 'getAccountWithdrawals',
            description: 'Get account withdrawal history',
          },
          {
            name: 'Get Account MIRs',
            value: 'getAccountMIRs',
            description: 'Get account MIR history',
          },
          {
            name: 'Get Account Addresses',
            value: 'getAccountAddresses',
            description: 'Get account associated addresses',
          },
          {
            name: 'Get Account Addresses Assets',
            value: 'getAccountAddressesAssets',
            description: 'Get assets associated with account addresses',
          },
          {
            name: 'Get Account Addresses Total',
            value: 'getAccountAddressesTotal',
            description: 'Get detailed information about account addresses',
          },
          {
            name: 'Get Account UTXOs',
            value: 'getAccountUTXOs',
            description: 'Get UTXOs associated with the account',
          },
        ],
        default: 'getAccount',
        required: true,
      },
      // Dynamic properties for Accounts
      {
        displayName: 'Stake Address',
        name: 'stakeAddress',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: {
            category: ['accounts'],
            operation: [
              'getAccount',
              'getAccountRewards',
              'getAccountHistory',
              'getAccountDelegations',
              'getAccountRegistrations',
              'getAccountWithdrawals',
              'getAccountMIRs',
              'getAccountAddresses',
              'getAccountAddressesAssets',
              'getAccountAddressesTotal',
              'getAccountUTXOs',
            ],
          },
        },
        description: 'Stake address in Bech32 format',
      },
      // Add more categories and operations here
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
      if (category === 'accounts') {
        const stakeAddress = this.getNodeParameter('stakeAddress', 0) as string;

        switch (operation) {
          case 'getAccount':
            const account = await blockfrost.accounts(stakeAddress);
            responseData = [account];
            break;
          case 'getAccountRewards':
            const rewards = await blockfrost.accountsRewards(stakeAddress);
            responseData = rewards;
            break;
          case 'getAccountHistory':
            const history = await blockfrost.accountsHistory(stakeAddress);
            responseData = history;
            break;
          case 'getAccountDelegations':
            const delegations = await blockfrost.accountsDelegations(stakeAddress);
            responseData = delegations;
            break;
          case 'getAccountRegistrations':
            const registrations = await blockfrost.accountsRegistrations(stakeAddress);
            responseData = registrations;
            break;
          case 'getAccountWithdrawals':
            const withdrawals = await blockfrost.accountsWithdrawals(stakeAddress);
            responseData = withdrawals;
            break;
          case 'getAccountMIRs':
            const mirs = await blockfrost.accountsMirs(stakeAddress);
            responseData = mirs;
            break;
          case 'getAccountAddresses':
            const addresses = await blockfrost.accountsAddresses(stakeAddress);
            responseData = addresses;
            break;
          case 'getAccountAddressesAssets':
            const addressesAssets = await blockfrost.accountsAddressesAssets(stakeAddress);
            responseData = addressesAssets;
            break;
          case 'getAccountAddressesTotal':
            const addressesTotal = await blockfrost.accountsAddressesTotal(stakeAddress);
            responseData = [addressesTotal];
            break;
          case 'getAccountUTXOs':
            // const utxos = await blockfrost.accountsUtxos(stakeAddress);
            // responseData = utxos;
            throw new Error('UTXOs operation not implemented yet');
          default:
            throw new Error(`Unknown operation: ${operation}`);
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