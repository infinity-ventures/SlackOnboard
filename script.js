/* ***************************************************
Place to do experiment
 * ****************************************************/

'use strict';

const { WebClient } = require('@slack/web-api');
const token = process.env.SLACK_AUTH_TOKEN;
const web = new WebClient(token);

/*
web.conversations.list().then(results => {
    let tmp = results['channels'].map(v => ({id: v['id'], name: v['name']}))
    console.log(tmp)
})
*/
const main = async () => {

    let resp = await web.users.conversations({types: "public_channel,private_channel"})
    channels = resp['channels'].map(v => ({id: v['id'], name: v['name']}))
}

main();
