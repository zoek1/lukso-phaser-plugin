import Phaser from 'phaser';
import Web3 from 'web3/dist/web3.min.js'
import 'isomorphic-fetch';

import UniversalProfile from "@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json";
import { LSPFactory } from '@lukso/lsp-factory.js';
import { ERC725 } from '@erc725/erc725.js';
import erc725schema from '@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json';
import KeyManager from '@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json';


const LUKSO_CHAIN_ID = 2828;
const IPFS_GATEWAY = 'https://2eff.lukso.dev/ipfs/';

class LUKSOPlugin extends Phaser.Plugins.BasePlugin {
    constructor(pluginManager) {
      super(pluginManager);
      this.web3 = new Web3(window.ethereum);
    
    }

    init(data) {
      this.data = data;
      console.log(this.data);
    }

    async getAccount() {
      const accountsRequest = await this.web3.eth.requestAccounts();
      const accounts = await this.web3.eth.getAccounts();
      return accounts;
    }

    async getBalance(address) {
      return await this.web3.eth.getBalance(address);
    }

    async sendTransaction(universal_address, recipient_address, value, data, gas=this.data.gas, gasPrice=this.data.gasPrice) {
      await this.web3.eth.sendTransaction({
        from: universal_address,
	to: recipient_address,
	value,
	data,
	gas,
        gasPrice
      });
    }

    async signMessage(message, address) {
      return this.web3.eth.sign(message, address); 
    }

    getUniversalProfileContract(universal_address, gas=this.data.gas, gasPrice=this.data.gasPrice) {
      return new this.web3.eth.Contract(UniversalProfile.abi, universal_address, {
        gas,
        gasPrice
      });
    }

    getLSPFactory(provider=window.ethereum, chainId=LUKSO_CHAIN_ID) {
      return new LSPFactory(provider, {
        chainId,
      });
    }

    createAccount() {
      return web3.eth.accounts.create();
    }

    async createUniversalProfile(address, metadata, provider, chainID) {
      const lspFactory = this.getLSPFactory(provider, LUKSO_CHAIN_ID);
      const contracts = await lspFactory.UniversalProfile.deploy({
        controllerAddresses: (typeof address === 'string' ? [address] : address),
        lsp3Profile: metadata,
      });

      return contracts;
    }

    async fetchProfile(address, key='') {
      const config = { ipfsGateway: IPFS_GATEWAY };
      const profile = new ERC725(erc725schema, address, window.ethereum, config);
      const keys = ['SupportedStandards:LSP3UniversalProfile', 'LSP3Profile', 'LSP12IssuedAssets[]', 'LSP5ReceivedAssets[]', 'LSP1UniversalReceiverDelegate'];

      return keys.includes(key) ? await profile.fetchData(key) : await profile.fetchData();
    }

    getERC725Contract(address, schema=erc725schema) {
      const config = { ipfsGateway: IPFS_GATEWAY };
      return new ERC725(schema, address, this.web3.currentProvider, config); 
    }

    async updateProfileInfo(address, data) {   
      const lspFactory = this.getLSPFactory(this.web3.currentProvider, LUKSO_CHAIN_ID);
      const uploadResult = await lspFactory.UniversalProfile.uploadProfileData(data);
      const lsp3ProfileIPFSUrl = uploadResult.url;

      const schema = [{
        name: 'LSP3Profile',
	key: '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5',
	keyType: 'Singleton',
	valueContent: 'JSONURL',
	valueType: 'bytes',
      },];
     
      const erc725 = this.getERC725Contract(address, schema);

      const encodedData = erc725.encodeData({
        keyName: 'LSP3Profile',
        value: {
          hashFunction: 'keccak256(utf8)',
          hash: this.web3.utils.keccak256(JSON.stringify(uploadResult.json)),
          url: lsp3ProfileIPFSUrl,
        },
      });

      const universalProfileContract = new this.web3.eth.Contract(
        UniversalProfile.abi,
        address,
      );

      const keyManagerAddress = await universalProfileContract.methods.owner().call();
      const keyManagerContract = new this.web3.eth.Contract(
        KeyManager.abi,
        keyManagerAddress,
      );
    
      const abiPayload = await universalProfileContract.methods[
          'setData(bytes32[],bytes[])'
      ](encodedData.keys, encodedData.values).encodeABI();

      return await (keyManagerContract.methods
        .execute(abiPayload)
        .send({ from: address, gasLimit: 300000 }));
    }
}

export class LSP3Metadata {
  constructor(metadata={}) {
    this._metadata = metadata;
  }

  set name(name) {
    this._metadata.name = name;
  }

  set description(description) {
    this._metadata.description = description;
  }

  set profileImage(profileImage) {
    this._metadata.profileImage = profileImage;
  }

  set backgroundImage(backgroundImage) {
    this._metadata.backgroundImage = backgroundImage;
  }

  set tags(tags) {
     this._metadata.tags = tags;
  }

  set links(links) {
     this._metadata.links = links;
  }

  setKey(value) {
    this._metadata[key] = value;
  }

  get name() { 
    return this._metadata.name;
  }

  get description() {
    return this._metadata.description;
  }

  get profileImage() {
    return this._metadata.profileImage;
  }

  get backgroundImage() {
    return this._metadata.backgroundImage;
  }

  get tags() {
    return this._metadata.tags;
  }

  get links() {
    return this._metadata.links;
  }
  
  getKey(key){
    return this._metadata[key];
  }

  toJSON(){
    return this._metadata;
  }
}

export default LUKSOPlugin;
