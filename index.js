/* ***************************************************
The main script to be exec on Google Cloud Function
 * ****************************************************/

'use strict';

const { WebClient } = require('@slack/web-api');
const token = process.env.SLACK_AUTH_TOKEN;
const web = new WebClient(token);


const { getDataByEmail, updateProfile, inviteToChannels, noOpResponse } = require('./utils.js')

const up_rex = /update\sprofile/i
const invite_rex = /invite\schannels/i
const user_id_rex = /\$([A-Z\d]+)\$/


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
    if (user_id_specified == null) return noOpResponse(res, `User id not specified`)
    let user_id = q.event.user  // check if user is admin
    let resp = await web.users.info({user: user_id})
    if (!resp.user.is_admin) return noOpResponse(res, "Only admin can use message to update profile or invite to channels")
  
    // get target user email
    target_user_id = user_id_specified[1]
    resp = await web.users.profile.get({user: target_user_id})  // include_labels: true
    target_email = resp.profile.email
  } else {
    return noOpResponse(res, `Unhandled event: ${q.event.type}.`)
  }

  let data = await getDataByEmail(target_email)
  if (data.length == 0) return noOpResponse(res, `Don't get data from Postgres by email`)

  if (team_join_cond | update_profile_cond) {
    updateProfile(target_user_id, data[0])
  }

  if (team_join_cond | invite_channels_cond) {
    inviteToChannels(target_user_id, data[0]['channels'])
  }

  res.status(200);
  res.json({});
  return Promise.resolve();
};
