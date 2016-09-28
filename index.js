'use strict';
const request = require('request-promise');
const AWS = require('aws-sdk');
const qs = require('querystring');
const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = 'SlackTeams';

const addSlackTeam = function(teamId, data, cb) {
  const item = Object.assign(data, {id: teamId});
  const params = {
    TableName: tableName,
    Key: {
      id: { S: teamId }
    },
    Item: item
  };
  console.log("Adding a new team...", params);
  docClient.put(params, cb);
};

const authParams = {
  client_id: process.env.SLACK_CLIENT_ID,
  client_secret: process.env.SLACK_SECRET
};
const apiUrl = process.env['API_GATEWAY_URL'];
const oauthURL = 'https://slack.com/api/oauth.access';

exports.handler = function(event, context) {
  if (event.params && event.params.querystring) event = event.params.querystring;

  const params = Object.assign(authParams, {
    code: event.code,
    redirect_uri: apiUrl + '/slack-oauth'
  });
  const url = `${oauthURL}?${qs.stringify(params)}`;

  request.get(url).then(response => {
    let data;
    console.log(response);
    try {
      data = JSON.parse(response);
    } catch(e) {
      console.log('error parsing response', e);
      context.done();
    }

    if (!data.ok || data.error) {
      console.log(data);
      return context.done(new Error('an error occurred'));
    }

    data.bot_user_id = data.bot.bot_user_id;
    data.bot_access_token = data.bot.bot_access_token;
    delete data.bot;

    addSlackTeam(data.team_id, data, function(err, dbData) {
      if (err) return context.done(err);
      context.done(null, `<h1>@anfon email bot is ready for the ${data.team_name} team on Slack!</h1>`);
    });
  }).catch(err => {
    console.log(err);
    context.done();
  });
};
