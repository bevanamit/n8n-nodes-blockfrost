import { ICredentialType } from 'n8n-workflow';

export class Blockfrost implements ICredentialType {
  name = 'blockfrostApi';
  displayName = 'Blockfrost API';
  properties = [
    {
      displayName: 'Project ID',
      name: 'projectId',
      type: 'string' as const,
      required: true,
      default: '',
      description: 'Your Blockfrost Project ID from https://blockfrost.io',
    },
    {
      displayName: 'Network',
      name: 'network',
      type: 'options' as const,
      options: [
        { name: 'Mainnet', value: 'mainnet' },
        { name: 'Preprod', value: 'preprod' },
        { name: 'Preview', value: 'preview' },
      ],
      default: 'mainnet',
      required: true,
      description: 'The Cardano network to connect to',
    },
  ];
}

export default Blockfrost;