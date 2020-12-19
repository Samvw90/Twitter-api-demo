const path = require('path');
const http = require('http');
const soketIo = require('socket.io');
const express = require('express');
const needle = require('needle');
const config = require('dotenv').config();
const PORT = process.env.PORT || 3000;

const app = express();

const server = http.createServer(app);
const io = soketIo(server);

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../', 'client', 'index.html'));
});

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamURL =
  'https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id';

const rules = [{ value: '#100daysofcode' }];

//Get stream rules
async function getRules() {
  const response = await needle('get', rulesURL, {
    headers: {
      Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
    },
  });
  // console.log(response.body);
  return response.body;
}

//POST set rules
async function setRules() {
  const data = {
    add: rules,
  };
  const response = await needle('post', rulesURL, data, {
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
    },
  });
  return response.body;
}

//DELETE stream rules
async function deleteRules(rules) {
  console.log('rules: ', rules.data);
  if (!Array.isArray(rules.data)) {
    return null;
  }
  const ids = rules.data.map((rule) => rule.id);
  const data = {
    delete: {
      ids: ids,
    },
  };
  const response = await needle('post', rulesURL, data, {
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
    },
  });
  return response.body;
}

function streamTweets(socket) {
  const stream = needle.get(streamURL, {
    headers: {
      Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
    },
  });

  stream.on('data', (data) => {
    try {
      const json = JSON.parse(data);
      // console.log('JSON: ', json);
      socket.emit('tweet', json);
    } catch (error) {}
  });
}

io.on('connection', async () => {
  console.log('Client connected...');
  let currentRules;
  try {
    //Get all stream rules
    currentRules = await getRules();
    //Delete all stream rules
    await deleteRules(currentRules);
    //Set rules based on array above
    await setRules();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
  streamTweets(io);
});

// (async () => {
//   let currentRules;
//   try {
//     //Get all stream rules
//     currentRules = await getRules();
//     //Delete all stream rules
//     await deleteRules(currentRules);
//     //Set rules based on array above
//     await setRules();
//   } catch (error) {
//     console.error(error);
//     process.exit(1);
//   }
//   streamTweets();
// })();

server.listen(PORT, () => console.log('Listening on port: ', PORT));
