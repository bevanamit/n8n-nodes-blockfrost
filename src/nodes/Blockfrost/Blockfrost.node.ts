import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IDataObject,
} from 'n8n-workflow';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

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
      {
        displayName: 'Category',
        name: 'category',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Health', value: 'health' },
          { name: 'Metrics', value: 'metrics' },
          // Add more categories as you implement them
        ],
        default: 'health',
        required: true,
      },
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
      // Add more operations for other categories as needed
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
      if (category === 'health') {
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