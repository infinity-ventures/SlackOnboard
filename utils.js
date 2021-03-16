// Postgres related config
const { Client } = require('pg')

const { WebClient } = require('@slack/web-api');
const token = process.env.SLACK_BOT_TOKEN;
const admin_token = process.env.SLACK_USER_TOKEN;
const pg_tb_name = process.env.PG_TBNAME;
const web = new WebClient(token);

const { getCreateTableScript } = require('./pg_scripts.js')

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

const createIVSAttendeeTable = async () => {
  const client = new Client()
  await client.connect()
  await client.query(getCreateTableScript(pg_tb_name))
  await client.end()
}

const checkDBColumn = async (email, col) => {
  const client = new Client()
  await client.connect()
  await client.query(`UPDATE ${pg_tb_name} SET ${col} = True WHERE email='${email.toLowerCase()}';`)
  await client.end()
}

const checkEmailExists = async (email) => {
  const client = new Client()
  await client.connect()
  const result = await client.query(`SELECT exists (SELECT 1 FROM ${pg_tb_name} WHERE email = '${email}' LIMIT 1);`)
  await client.end
  return result.rows[0]['exists']
}

const createDataRow = async (data) => {
  const client = new Client()
  await client.connect()
  const col_str = Object.keys(data).join(", ")
  const val_str = Object.values(data).map((x) => `'${x}'`).join(", ")
  const query_str = `INSERT INTO ${pg_tb_name} (${col_str}) VALUES (${val_str})`
  await client.query(query_str)
  await client.end()
}

const updateColByEmail = async (email, col, val) => {
  const client = new Client()
  await client.connect()
  await client.query(`UPDATE ${pg_tb_name} SET ${col} = '${val}' WHERE email='${email.toLowerCase()}';`)
  await client.end()
  return 
}

const getDataByEmail = async (email) => {
  // get data from PostGres
  const client = new Client()
  await client.connect()
  const result = await client.query(`SELECT * FROM ${pg_tb_name} WHERE email='${email.toLowerCase()}';`)
  await client.end()
  return result.rows
}

const getUnCheckedEmails = async () => {
    // get data from PostGres
    const client = new Client()
    await client.connect()
    let result = await client.query(`SELECT email FROM ${pg_tb_name} WHERE profile_check = False;`)
    await client.end()
    return result.rows
}

const getAllNameEmails = async () => {
  // get data from PostGres
  const client = new Client()
  await client.connect()
  let result = await client.query(`SELECT username, email FROM ${pg_tb_name};`)
  await client.end()
  return result.rows
}

const getEmailsWithChannels = async () => {
  const client = new Client()
  await client.connect()
  let result = await client.query(`SELECT email, channels FROM ${pg_tb_name} WHERE cardinality(channels) IS NOT null;`)
  await client.end()
  return result.rows
}

const roleStatusMap = {
  Startup: ':unicorn_face:',
  VC: ':moneybag:',
  CVC: ':moneybag:',
  AngelInvestor: ':moneybag:',
  ListedCompany: ':office:',
  Media: ':book:',
  Staff: ':ivs:',
  Others: ':nerd_face:'
}

const updateProfile = (targetUserId, profileDict) => {
  let {company_name, title, category, industry, fb_url, username_jp, username, profie_img, email, userrole} = profileDict
  let customFields = {Xf017EPYEVHQ: {value: company_name}, 
    Xf017DD0FKS9: {value: title},
    Xf017F0QEZ9R: {value: category},
    Xf017M03U9UL: {value: industry},
    Xf017DCZF8SZ: {value: fb_url},
    Xf017DQLKDNZ: {value: username_jp}
  }

  let status_emoji = roleStatusMap[userrole]

  web.users.profile.set({token:admin_token, user:targetUserId, profile:{"display_name":username, "real_name": username, "title": `${title} (${company_name} )`,
    status_emoji: status_emoji, fields: customFields}}).then(() => {
      checkDBColumn(email, 'profile_check')
    }).catch(e => {
      console.warn(e)
  })

  return null
}
  
const inviteToChannels = (target_user_id, channels) => {
    /*
      Go to https://api.slack.com/methods/conversations.list/test
      to find a channel id.
    */
    if (channels != null) {
      return Promise.all(channels.map(chId => {
          web.conversations.invite({token:admin_token, channel: chId, users: target_user_id}).catch(err => {console.log(err)})
      }))
    }
}

function noOpResponse(response, str) {
    response.status(200).send(str);
    return;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    getDataByEmail: getDataByEmail,
    updateProfile: updateProfile,
    inviteToChannels: inviteToChannels,
    noOpResponse: noOpResponse,
    getUnCheckedEmails: getUnCheckedEmails,
    getEmailsWithChannels: getEmailsWithChannels,
    sleep: sleep,
    getAllNameEmails: getAllNameEmails,
    updateColByEmail: updateColByEmail,
    createIVSAttendeeTable: createIVSAttendeeTable,
    createDataRow: createDataRow,
    checkEmailExists: checkEmailExists
}