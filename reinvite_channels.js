/* ***************************************************
Place to do experiment
 * ****************************************************/

'use strict';

const { WebClient } = require('@slack/web-api');
const token = process.env.SLACK_BOT_TOKEN;
const admin_token = process.env.SLACK_USER_TOKEN;
const web = new WebClient(token);

const { inviteToChannels, getEmailsWithChannels, sleep } = require('./utils.js')

const main = async () => {

    let data = await getEmailsWithChannels('profile_check')
    console.log(`Get ${data.length} users.`)
    let count = 0

    for (const row of data) {
        let { email, channels } = row

        if (count % 1 == 0) {
            console.log(`Progress: ${Math.round(count/data.length * 100)}%`)
        }
        count = count + 1

        // get profile info
        let resp
        try {
            resp = await web.users.lookupByEmail({email: email})
            // The include_labels parameter is heavily rate-limited.
        } catch (e) {  // user not found
            console.log(`Error on users.lookupByEmail: ${e}`)
            continue
        }
        let {id, real_name} = resp['user']
        // console.log("Rest for 1 sec")
        await sleep(1000)
    
        try {
            resp = await web.users.conversations({token: admin_token, user: id, types: "public_channel,private_channel"})
        } catch (e) {
            console.log(`Error on users.conversations: ${e}`)
            continue
        }
        let channels_joined = resp['channels'].map(v => (v['id']))
        channels = channels.filter(ch => !channels_joined.includes(ch))
        inviteToChannels(id, channels)
    }
}

main();
