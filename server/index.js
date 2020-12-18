const needle = require('needle');
const config = require('dotenv').config();

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamURL =
  'https://api.twitter.com/2/tweets/search/stream?tweet.field=public_metrics&expansions=author_id';

const rules = [{ value: 'giveaway' }];
