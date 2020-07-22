/* ***************************************************
 * Reacilator for Slack
 * Translate message when a user reacted with an emoji
 * Tomomi Imura (@girlie_mac)
 * ****************************************************/

'use strict';

const { WebClient } = require('@slack/web-api');
const token = process.env.SLACK_AUTH_TOKEN;
const web = new WebClient(token);



// Postgres related config
const { Client } = require('pg')

// Google Cloud Storage Credential
const {Storage} = require('@google-cloud/storage');

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
const user_id_rex = /\$([A-Z\d]+)\$/

exports.profileFiller = async (req, res) => {
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
  let cond1 = q.event.type === "message" & q.event.text.match(up_rex) != null;
  
  let cond2 = q.event.type === "team_join"

  if (cond1 | cond2) {

    let user_id, target_email, target_user_id
    if (cond1) {
      let extract_user_id = q.event.text.match(user_id_rex)
      user_id = q.event.user 
      if (extract_user_id) { // check if user is admin
        let resp = await web.users.info({user: user_id})
        if (!resp.user.is_admin) return noOpResponse()
      }
      target_user_id = extract_user_id != null? extract_user_id[1]: user_id
      let resp = await web.users.profile.get({user: target_user_id, include_labels: true})  
      target_email = resp.profile.email
    } else {  // cond2
      target_user_id = q.event.user.id
      target_email = q.event.user.profile.email
    }

    // postgres client
    const client = new Client()
    await client.connect()
    const result = await client.query(`SELECT * FROM ivs2020summer_attendees WHERE email='${target_email}';`)
    client.end()
  
    if (result.rows.length === 0) return noOpResponse(res);  // Return if no related data
    let {username, username_jp, company_name, title, category, industry, fb_url, profie_img} = result.rows[0]
    // console.info({username, email, title, img_file_name})

    // change profile info
    
    let custom_fields = {Xf017EPYEVHQ: {value: company_name}, 
                        Xf017DD0FKS9: {value: title},
                        Xf017F0QEZ9R: {value: category},
                        Xf017M03U9UL: {value: industry},
                        Xf017DCZF8SZ: {value: fb_url},
                        Xf017DQLKDNZ: {value: username_jp}
    }

    web.users.profile.set({user:target_user_id, profile:{"display_name":username, "real_name": username, "title": `${title} (${company_name} )`,
                          fields: custom_fields}}).catch(e => {
                            console.warn(e)
                          })

    // list file names for debug
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
  }

  res.status(200);
  res.json({});
  return Promise.resolve();
};
function noOpResponse(response) {
  response.status(200).send('No flag emoji reaction detected.');
  return;
}