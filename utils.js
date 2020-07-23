// Postgres related config
const { Client } = require('pg')

const { WebClient } = require('@slack/web-api');
const token = process.env.SLACK_AUTH_TOKEN;
const web = new WebClient(token);


const { Storage } = require('@google-cloud/storage');
var storage
if (process.env.GOOGLE_KEY_JSON){
    let credentials = {
      projectId: 'introos',
      keyFilename: process.env.GOOGLE_KEY_JSON
    }
    storage = new Storage(credentials);
} else {
    storage = new Storage();
}
const bucketName = "ivs_attendees"

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

function noOpResponse(response, str) {
    response.status(200).send(str);
    return;
}

module.exports = {
    getDataByEmail: getDataByEmail,
    updateProfile: updateProfile,
    inviteToChannels: inviteToChannels,
    noOpResponse: noOpResponse
}