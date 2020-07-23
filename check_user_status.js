/* ***************************************************
1. Check user profile info and channel involved
2. Compare it with our database
3. List users our ivs-onboard bot missed.
* ****************************************************/

'use strict';

const { WebClient } = require('@slack/web-api');
const token = process.env.SLACK_AUTH_TOKEN;
const web = new WebClient(token);

const { getDataByEmail, updateProfile, inviteToChannels } = require('./utils.js')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

const main = async () => {
    let results = await web.users.list()
    let userList = results['members'].map(v => ({id: v['id'], name: v['name'], real_name: v['real_name'], is_admin: v['is_admin']}))

    console.log(`Get ${userList.length} users.`)
    let count = 0
    
    for (let user of userList) {
        if (count % 5 == 0) {
            console.log(`Progress: ${Math.round(count/userList.length * 100)}%`)
        }
        count = count + 1
        console.log(`Start processing user ${JSON.stringify(user)}`)
        console.log("Rest for 5 sec")
        await sleep(5000)

        // get profile info
        let resp
        try {
            resp = await web.users.profile.get({user: user['id'], include_labels: true})
            // The include_labels parameter is heavily rate-limited.
        } catch (e) {
            console.log(`Error on users.profile.get: ${e}`)
            continue
        }
            
        let {email, fields, display_name} = resp['profile']
    
        if (email == null) continue
    
        let userData = await getDataByEmail(email)
        if (userData.length == 0) continue  // cannot find related data on Postgres
     
        if (Array.isArray(fields) & fields.length == 0) {  // seems no data being updated.
            console.log(`${display_name} has empty fields`)
            // updateProfile(user['id'], userData[0])
        }
    
        let {channels_join} = userData[0] 
        if (channels_join != null) {
            try {
                resp = await web.users.conversations({user: user['id'], types: "public_channel,private_channel"})
            } catch (e) {
                console.log(`Error on users.conversations: ${e}`)
                continue
            }

            let channels_joined = resp['channels'].map(v => (v['id']))
            for (let ch of channels_join) {
                if (!channels_joined.includes(ch)) {
                    console.log(`${display_name} should be but not in channel (${ch})`)
                    // inviteToChannels(user['id'], ch)
                }
            }
        }

    }

}

main()
