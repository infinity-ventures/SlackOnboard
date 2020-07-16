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

// Google Cloud Storage Credential, only used locally.
/* let credentials = {
  projectId: 'introos',
  keyFilename: process.env.GOOGLE_KEY_JSON
}*/

const {Storage} = require('@google-cloud/storage');
const storage = new Storage();  // credentials
const bucketName = "ivs_attendees"


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
  if (q.event.type === "message") {

    if (q.event.text != "update profile") return noOpResponse(res);
  
    let resp = await web.users.info({user: q.event.user})
    let user_id = resp.user.id
    let email = resp.user.profile.email

    const client = new Client()
    await client.connect()
    const result = await client.query(`SELECT * FROM ivs_attendees WHERE email='${email}';`)
    if (result.rows.length === 0) return noOpResponse(res);  // Return if no related data
    let username, title, img_file_name
    ({username, email, title, img_file_name} = result.rows[0])
    // console.info({username, email, title, img_file_name})

    // list file names
    /* const [files] = await storage.bucket(bucketName).getFiles();
    console.log('Files:');
    files.forEach(file => {
      console.log(file.name);
    });*/

    // change profile img
    if (img_file_name){
      storage.bucket(bucketName).file(img_file_name).download(function(err, contents) {
        web.users.setPhoto({image: contents}) 
      })
    }

    // change profile info
    web.users.profile.set({user:user_id, profile:{"display_name":username, "title": title, "real_name": username}})
    await client.end()

    res.status(200);
    res.json("");
    return Promise.resolve();
  }
};
function noOpResponse(response) {
  response.status(200).send('No flag emoji reaction detected.');
  return;
}