# Private Blockchain Notary Service

In this project, I built a Star Registry Service that allows users to claim ownership of their favorite star in the night sky.

## What will you need to do?
Create a Blockchain dataset to store a Star.

The application will persist the data (using LevelDB).
The application will allow users to identify the Star data with the owner.

## Create a Mempool component

The mempool component will store temporal validation requests for 5 minutes (300 seconds).
The mempool component will store temporal valid requests for 30 minutes (1800 seconds).
The mempool component will manage the validation time window.

## Create a REST API that allows users to interact with the application.

The API will allow users to submit a validation request.
The API will allow users to validate the request.
The API will be able to encode and decode the star data.
The API will allow be able to submit the Star data.
The API will allow lookup of Stars by hash, wallet address, and height.

## Dependencies

Use the Private Blockchain application that I built and use in Project 2 and Project 3.
Set up a Node.js Project with the following dependencies:
```
"dependencies": {
   "bitcoinjs-lib": "^4.0.2",
   "bitcoinjs-message": "^2.0.0",
   "body-parser": "^1.18.3",
   "crypto-js": "^3.1.9-1",
   "express": "^4.16.4",
   "hex2ascii": "0.0.3",
   "level": "^4.0.0",
 }
```

## 1. User submits a validation request
Users start out by submitting a validation request to an API endpoint:
```
curl -X POST \
  http://localhost:8000/requestValidation \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  -d '{
    "address":"19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL"
}'
```
Example:
```
this.app.post("/requestValidation", (req, res) => { // Your code });
```

## 2. AddRequestValidation method in the mempool

Mempool can be thought as a temporary storage for validation requests:
```
       this.mempool = [];
       this.timeoutRequests = [];
```

A possible approach in this is to have arrays to store these temporary requests.

If the user re-submits a request, the application will not add a new request; instead, it will return the same request that it is already in the mempool.

## 3. setTimeOut method in the mempool

The request (as was mentioned before in the requirements) should be available for validation for 5 minutes. If the condition is met, we will need to delete the request. Let's create a function to help us do this:
```
self.timeoutRequests[request.walletAddress]=setTimeout(function(){ self.removeValidationRequest(request.walletAddress) }, TimeoutRequestsWindowTime );
```
Tip: Here is one way to handle the time calculation:
```
const TimeoutRequestsWindowTime = 5*60*1000;

let timeElapse = (new Date().getTime().toString().slice(0,-3)) - req.requestTimeStamp;
let timeLeft = (TimeoutRequestsWindowTime/1000) - timeElapse;
req.validationWindow = timeLeft;
```

## 4. requestObject return values

requestObject should return these values
```
{
    "walletAddress": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",
    "requestTimeStamp": "1541605128",
    "message": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL:1541605128:starRegistry",
    "validationWindow": 300
}
```

## 5. User will send a validation request
```
curl -X POST \
  http://localhost:8000/message-signature/validate \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  -d '{
"address":"19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",
 "signature":"H8K4+1MvyJo9tcr2YN2KejwvX1oqneyCH+fsUL1z1WBdWmswB9bijeFfOfMqK68kQ5RO6ZxhomoXQG3fkLaBl+Q="
}'
```
Tip: To do this, get the “message” returned in the previous step and use your electrum wallet to sign that message:

Use your electrum wallet, sign the message with the wallet address you use to submit your request.

## 6. validateRequestByWallet method in the mempool

Create a method that allows you to validate the request following this logic:

Find your request in the mempool array by wallet address.
Verify your windowTime.
Verify the signature using:
```
const bitcoinMessage = require('bitcoinjs-message');
let isValid = bitcoinMessage.verify(message, address, signature);
```
Create the new object and save it into the mempoolValid array
```
this.registerStar = true;
this.status = {
   address: walletAddress,
   requestTimeStamp: requestTimeStamp,
   message: message,
   validationWindow: validationWindow,
   messageSignature: valid
};
```
If you have implemented a timeoutArray, make sure you clean it up before returning the object.

## 7. Return the validRequest object

validRequest should return this object:
```
{
    "registerStar": true,
    "status": {
        "address": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",
        "requestTimeStamp": "1541605128",
        "message": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL:1541605128:starRegistry",
        "validationWindow": 200,
        "messageSignature": true
    }
}
```

## 8. A user will send star data to be stored

Example of start data to be stored:

Star story supports ASCII text, limited to 250 words (500 bytes), and hex encoded.
```
{
"address": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",
    "star": {
            "dec": "68° 52' 56.9",
            "ra": "16h 29m 1.0s",
            "story": "Found star using https://www.google.com/sky/"
        }
}
```
Note: Make sure only one Star can be send in the request

## 9. verifyAddressRequest method

Verify if the request validation exists and if it is valid.

## 10. Encode Star story data

Encode the story data of the star, this is the object you will save as a body of your block:
```
let body = {
        address: req.body.address,
        star: {
              ra: RA,
              dec: DEC,
              mag: MAG,
              cen: CEN,
              story: Buffer(starStory).toString('hex')
              }
};
```

## 11. addBlock method

Your Blockchain implementation already has an addblock(body).
```
let body = {
      address: req.body.address,
      star: {
                ra: RA,
                dec: DEC,
                mag: MAG,
                cen: CEN,
                story: Buffer(starStory).toString('hex')
        }
 };
 let block = new Block(body);
// Use your `addBlock(block)` method
```
When you pass your start object as a parameter to this method, the application should return the object:
```
{
     "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
      "height": 1,
      "body": {
           "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
           "star": {
                "ra": "16h 29m 1.0s",
                "dec": "-26° 29' 24.9",
                "story":
        "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
                "storyDecoded": "Found star using https://www.google.com/sky/"
             }
       },
      "time": "1532296234",
       "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
}
```
Tip: Because "storyDecoded" property is not being saved in the block you should decode your story to be able to return this object.
```
hex2ascii(obj.body.star.story);
```

## Additional functionalities

Now that we have our application working, it is time to add some functionalities that allow users to retrieve the data stored in the blockchain dataset.

## 1. Get star block by hash with JSON response

The first step is modify your LevelDB methods to include a method that search for the block that has the hash that we are looking for. Check on this example:
```
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
```
Use this CURL example as a request:
```
// Curl request
curl "http://localhost:8000/stars/hash:a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f"
```
Then create an endpoint to call the method and return the block object.

Tip: Make sure that each time you are returning a block you need to decode the star’s story.

## 2. Get star block by wallet address

Create the getBlockByWalletAddress(address) method using db.createReadStream() method from LevelDB.

Tip: In this case you can have more than one block with stars registered by one user, so pay attention that you are going to return an array.

Tip: Make sure that each time you are returning a block you need to decode the star’s story.

## 3. Get star block by height

Create the getBlockByHeight(height) method using db.createReadStream() if the key you are using to store data in LevelDB otherwise you can just use:
```
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
```
Tip: Make sure that each time you are returning a block you need to decode the star’s story.

## Select Node.js framework

For my first web service project, I selected Express.js as my preferred Node.js framework from the list below:
```
Hapi.js
Express.js
Sails.js
```

## Configure two endpoints

I created the below two endpoints which will allow my application to accept user requests.
```
GET Block Endpoint
POST Block Endpoint
```

### GET Block Endpoint
Configure a GET request using URL path with a block height parameter. The response for the endpoint should provide block object is JSON format.

URL
```
http://localhost:8000/block/[blockheight]
```

#### Example URL path:
http://localhost:8000/block/0, where '0' is the block height.

#### Response
The response for the endpoint should provide block object is JSON format.

#### Example GET Response
For URL, http://localhost:8000/block/0
```
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
cache-control: no-cache
content-length: 179
accept-ranges: bytes
Connection: close          
{"hash":"49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3","height":0,"body":"First block in the chain - Genesis block","time":"1530311457","previousBlockHash":""}
```

### POST Block Endpoint
Post a new block with data payload option to add data to the block body. The block body should support a string of text. The response for the endpoint should provide block object in JSON format.

#### Response
The response for the endpoint should provide block object in JSON format.

#### Example POST response
For URL: http://localhost:8000/block
```
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
cache-control: no-cache
content-length: 238
Connection: close
{"hash":"ffaffeb2330a12397acc069791323783ef1a1c8aab17ccf2d6788cdab0360b90","height":1,"body":"Testing block with test string data","time":"1531764891","previousBlockHash":"49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"}
```
