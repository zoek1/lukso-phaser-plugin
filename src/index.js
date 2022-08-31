import Phaser from 'phaser';
import LUKSOPlugin, { LSP3Metadata } from '../lib/lukso-plugin.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 600,
  plugins: {
    global: [
      { 
        key: 'LUKSOPlugin', 
	plugin: LUKSOPlugin, 
	start: false, 
	mapping: 'lukso', 
	data: {
          gas: 5000000,
          gasPrice: '1000000000'
        }
      }
    ]
  },
  scene: {
    preload: preload,
    create: create
  }
}

const game = new Phaser.Game(config);

function preload() {
  console.log('preload')
}

async function create() {
  let [account] = await this.lukso.getAccount();
  // console.log(await this.lukso.signMessage("Hello Lukso User", account));
  console.log(await this.lukso.getBalance(account));

  let metadata = new LSP3Metadata({
    name: 'LuksoUser', 
    description: 'I\'m a lukso user', 
    backgroundImage: [],
    links: [],
    profileImage: [],
    tags: []
  })
  metadata.tags = ['Lukso', 'Game'];

  console.log(metadata.toJSON())

  console.log(this.lukso.getLSPFactory())

  // let contracts = await this.lukso.createUniversalProfile(account, metadata);
  // console.log(contracts);

  console.log(await this.lukso.fetchProfile(account));
  await this.lukso.updateProfileInfo(account, metadata.toJSON());

  console.log(await this.lukso.fetchProfile(account));
}
