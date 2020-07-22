/* ***************************************************
The main script to be exec on Google Cloud Function
 * ****************************************************/

'use strict';

const { WebClient } = require('@slack/web-api');
const token = process.env.SLACK_AUTH_TOKEN;
const web = new WebClient(token);



// Postgres related config
const { Client } = require('pg')

// Google Cloud Storage Credential
const { Storage } = require('@google-cloud/storage');

if (process.env.GOOGLE_KEY_JSON){
  let credentials = {
    projectId: 'introos',
    keyFilename: process.env.GOOGLE_KEY_JSON
  }
  const storage = new Storage(credentials);
} else {
  const storage = new Storage();
}
const bucketName = "ivs_attendees"

const up_rex = /update\sprofile/i
const invite_rex = /invite\schannels/i
const user_id_rex = /\$([A-Z\d]+)\$/


const getDataByEmail = async (email) => {
  // get data from PostGres
  const client = new Client()
  await client.connect()
  const result = await client.query(`SELECT * FROM ivs2020summer_attendees WHERE email='${email}';`)
  client.end()
  return result.rows
}

const updateProfile = (targetUserId, profileDict) => {
  let {company_name, title, category, industry, fb_url, username_jp, username, profie_img} = profileDict
  let customFields = {Xf017EPYEVHQ: {value: company_name}, 
    Xf017DD0FKS9: {value: title},
    Xf017F0QEZ9R: {value: category},
    Xf017M03U9UL: {value: industry},
    Xf017DCZF8SZ: {value: fb_url},
    Xf017DQLKDNZ: {value: username_jp}
  }

  web.users.profile.set({user:targetUserId, profile:{"display_name":username, "real_name": username, "title": `${title} (${company_name} )`,
    fields: customFields}}).catch(e => {
      console.warn(e)
  })

  /* const [files] = await storage.bucket(bucketName).getFiles();
  console.log('Files:');
  files.forEach(file => {
    console.log(file.name);
  });*/

  // change profile img

  if (profie_img){
    storage.bucket(bucketName).file(profie_img).download(function(err, contents) {
      web.users.setPhoto({image: contents}) 
    }).catch(e => {
      console.warn(e)
    })
  }
  return null
}

const inviteToChannels = (target_user_id, channels) => {
  channels.forEach((chId) => {
    web.conversations.invite({channel: chId, users: target_user_id}).catch(error => {
        console.log(error)
    })
  })
}

exports.onboard = async (req, res) => {
  let q = req.body;

  if (q.type === 'url_verification') {
    console.log('Slack URL verification request.');
    // App setting validation
    return res.send(q.challenge);
  } else if (q.token !== process.env.SLACK_VERIFICATION_TOKEN) {
    // To see if the request is not coming from Slack.
    console.warn('Invalid verification token.');
    return res.status(401);
  }

  // Events
  let team_join_cond = q.event.type === "team_join"
  let message_event_cond = q.event.type === "message"
  let update_profile_cond = q.event.text.match(up_rex) != null
  let invite_channels_cond = q.event.text.match(invite_rex) != null
  let target_email, target_user_id


  if (team_join_cond) {
    target_user_id = q.event.user.id
    target_email = q.event.user.profile.email
  } 
  else if (message_event_cond & (update_profile_cond | invite_channels_cond)) {
    let user_id_specified = q.event.text.match(user_id_rex)  // need to specified user_id
    if (user_id_specified == null) return
    let user_id = q.event.user  // check if user is admin
    let resp = await web.users.info({user: user_id})
    if (!resp.user.is_admin) return
  
    // get target user email
    target_user_id = user_id_specified[1]
    resp = await web.users.profile.get({user: target_user_id})  // include_labels: true
    target_email = resp.profile.email
  } else {
    return
  }

  let data = await getDataByEmail(target_email)
  if (data.length == 0) return 

  if (team_join_cond | update_profile_cond) {
    updateProfile(target_user_id, data[0])
  }

  if (team_join_cond | invite_channels_cond) {
    inviteToChannels(target_user_id, data[0]['channels_join'])
  }

  res.status(200);
  res.json({});
  return Promise.resolve();
};
