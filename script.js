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

web.conversations.invite({channel: 'C016VCGE88J', users: 'U0162F6PERL'}).then(results =>{
    console.log(results)
}).catch(error => {
    console.log(error)
})