// This file exports all nodes which will be included in the package
import { INodeType } from 'n8n-workflow';
import { ICredentialType } from 'n8n-workflow';

import { BlockfrostNode } from './nodes/Blockfrost/Blockfrost.node';
import { BlockfrostApi } from './nodes/Blockfrost/Blockfrost.credentials';

// For backwards compatibility
const Blockfrost = BlockfrostNode;

export {
	BlockfrostNode,
	BlockfrostApi,
	Blockfrost,
};