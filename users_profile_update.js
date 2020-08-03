/* ***************************************************
1. Check user profile info and channel involved
2. Compare it with our database
3. List users our ivs-onboard bot missed.
* ****************************************************/

'use strict';

const { WebClient } = require('@slack/web-api');
const token = process.env.SLACK_AUTH_TOKEN;
const web = new WebClient(token);

const { getDataByEmail, updateProfile, getUnCheckedEmails, sleep } = require('./utils.js')

const main = async () => {

    let emails = await getUnCheckedEmails()
    console.log(`Get ${emails.length} users.`)
    let count = 0


    for (const email_dict of emails) {
        let { email } = email_dict


        if (count % 1 == 0) {
            console.log(`Progress: ${Math.round(count/emails.length * 100)}%`)
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

        // console.log("Rest for 1 sec")
        await sleep(1000)
            
        let {id, real_name, is_admin} = resp['user']
        if (is_admin) continue
     
        console.log(`Start to update profile for user ${real_name}(${id})`)
        let userData = await getDataByEmail(email)
        if (userData.length == 0) continue
        updateProfile(id, userData[0])
    }
}

main()
