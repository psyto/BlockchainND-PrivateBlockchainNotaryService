const Block = require('./block');

/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    // Genesis block persist as the first block in the blockchain using LevelDB.
    this.getBlockHeight().then((height) => {
      if (height === -1) {
        this.addBlock(new Block("First block in the chain - Genesis block"));
      }
    })
  }

  // addBlock(newBlock) includes a method to store newBlock within LevelDB.
  async addBlock(newBlock){
    // Previous block height
    const previousBlockHeight = parseInt(await this.getBlockHeight());
    // Block height
    newBlock.height = previousBlockHeight + 1;
    // UTC timestamp
    newBlock.time = new Date().getTime().toString().slice(0,-3);
    // previous block hash
    if(newBlock.height>0){
      const previousBlock = await this.getBlock(previousBlockHeight);
      newBlock.previousBlockHash = previousBlock.hash;
    }
    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    // Adding block object to chain
    await this.addDataToLevelDB(newBlock.height, JSON.stringify(newBlock));
  }

  // getBlockHeight() function retrieves current block height within the LevelDB chain.
  async getBlockHeight(){
    return await this.getBlockHeightFromLevelDB();
  }

  // getBlock() function retrieves a block by block height within the LevelDB chain.
  async getBlock(blockHeight){
    // return object as a single string
    return JSON.parse(await this.getLevelDBData(blockHeight));
  }

  // validate block() function to validate a block stored within levelDB.
  async validateBlock(blockHeight){
    // get block object
    let block = await this.getBlock(blockHeight);
    // get block hash
    let blockHash = block.hash;
    // remove block hash to test block integrity
    block.hash = '';
    // generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString();
    // Compare
    if (blockHash===validBlockHash) {
      return true;
    } else {
      console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
      return false;
    }
  }

  // validateChain() function to validate blockchain stored within levelDB.
  async validateChain(){
    let errorLog = [];
    let blockHeight = await this.getBlockHeightFromLevelDB();
    for (let i = 0; i < blockHeight-1; i++) {
      // validate block
      let isValid = await this.validateBlock(i);
      if (!isValid) errorLog.push(i);
      // compare blocks hash link
      let blockHash = await this.getBlock(i).hash;
      let previousHash = await this.getBlock(i+1).previousBlockHash;
      if (blockHash!==previousHash) {
        errorLog.push(i);
      }
    }
    if (errorLog.length>0) {
      console.log('Block errors = ' + errorLog.length);
      console.log('Blocks: '+errorLog);
    } else {
      console.log('No errors detected');
    }
  }

  // Add data to levelDB with key/value pair
  addDataToLevelDB(key,value){
    return new Promise((resolve, reject) => {
      db.put(key, value, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(value);
        }
      })
    })
  }

  // Get data from levelDB with key
  getLevelDBData(key){
    return new Promise((resolve, reject) => {
      db.get(key, (err, value) => {
        if (err) {
          reject(err);
        } else {
          resolve(value);
        }
      })
    })
  }

  // Get block height from levelDB
  getBlockHeightFromLevelDB(){
    return new Promise((resolve, reject) => {
      let height = -1;
      db.createReadStream().on('data', (data) => {
        height++;
      }).on('error', (err) => {
        reject(err);
      }).on('close', () => {
        resolve(height);
      })
    })
  }

  // Additional functionalities
  // Now that we have our application working, it is time to add some functionalities that allow users to retrieve the data stored in the blockchain dataset.

  // 1. Get star block by hash with JSON response
  // The first step is modify your LevelDB methods to include a method that search for the block that has the hash that we are looking for. Check on this example:
  // Get block by hash
     getBlockByHash(hash) {
         let self = this;
         let block = null;
         return new Promise(function(resolve, reject){
             self.db.createReadStream()
             .on('data', function (data) {
                 if(data.hash === hash){
                     block = data;
                 }
             })
             .on('error', function (err) {
                 reject(err)
             })
             .on('close', function () {
                 resolve(block);
             });
         });
     }

  // Use this CURL example as a request:
  // Curl request
  // curl "http://localhost:8000/stars/hash:a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f"

  // Then create an endpoint to call the method and return the block object.
  // Tip: Make sure that each time you are returning a block you need to decode the star’s story.

  // 2. Get star block by wallet address
  // Create the getBlockByWalletAddress(address) method using db.createReadStream() method from LevelDB.
  // Tip: In this case you can have more than one block with stars registered by one user, so pay attention that you are going to return an array.
  // Tip: Make sure that each time you are returning a block you need to decode the star’s story.

  // 3. Get star block by height
  // Create the getBlockByHeight(height) method using db.createReadStream() if the key you are using to store data in LevelDB otherwise you can just use:
  // Get data from levelDB with key (Promise)
      getLevelDBData(key){
          let self = this;
          return new Promise(function(resolve, reject) {
              self.db.get(key, (err, value) => {
                  if(err){
                      if (err.type == 'NotFoundError') {
                          resolve(undefined);
                      }else {
                          console.log('Block ' + key + ' get failed', err);
                          reject(err);
                      }
                  }else {
                      resolve(value);
                  }
              });
          });
      }

  // Tip: Make sure that each time you are returning a block you need to decode the star’s story.

}

module.exports = Blockchain;
