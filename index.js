/* ***************************************************
 * Reacilator for Slack
 * Translate message when a user reacted with an emoji
 * Tomomi Imura (@girlie_mac)
 * ****************************************************/

'use strict';

const oauthToken = process.env.SLACK_AUTH_TOKEN;
const apiUrl = 'https://slack.com/api';

const { WebClient } = require('@slack/web-api');
const token = process.env.SLACK_AUTH_TOKEN;
const web = new WebClient(token);


/* Events */

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

  res.status(200);

  // Events
  if (q.event.type === "user_change") {
    // If reacji was triggered && it is a correct emoji, translate the message into a specified language

    /*
{ token: '...',
  team_id: '...',
  api_app_id: '...',
  event:
   { type: 'user_change',
     user:
      { id: '',
        team_id: '',
        profile: [Object],
        is_admin: false,
        is_owner: false,
        is_primary_owner: false,
        is_restricted: false,
        is_ultra_restricted: false,
        is_bot: false,
        is_app_user: false,
        updated: 1594365981,
        locale: 'en-US' },
     cache_ts: 1594365981,
     event_ts: '1594365981.088600' },
  type: 'event_callback',
  event_id: '...',
  event_time: 1594365981}
    */

    let user = q.event.user
    console.log(user.profile)
    let email = user.profile.email
    console.log(`email: ${email}`)
    if (email === "ian@infinityventures.com"){
      await web.users.profile.set({user:user.id, profile:{"display_name":"Ian Su the White", "title": "The Lord of the Ring."}})
    }

    // find user by email in redis?
    // According to the enent.user info, we find it's realted information 


    res.json("");
    return Promise.resolve();
  }
};
function noOpResponse(response) {
  response.status(200).send('No flag emoji reaction detected.');
  return;
}