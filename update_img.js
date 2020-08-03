
// update profile (or partially)

const { getAllNameEmails, updateColByEmail } = require('./utils.js')
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

const { WebClient } = require('@slack/web-api');
const token = process.env.SLACK_BOT_TOKEN;
const web = new WebClient(token);

const options = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 24 * 60 * 60 * 1000, // 15 minutes
  };

const main = async () => {

    const nameEmails = await getAllNameEmails()

    const [files] = await storage.bucket(bucketName).getFiles();
    console.log(files.length)

    for (let f of files) {

        let file_name = f.name.split(".")[0]

        for (let row of nameEmails) {
            // normalize username
            let name = row['username'].toLowerCase().replace(/ /g,'')
            let email = row['email']
            
            // check name
            if (name == file_name) {  // find match between img and pg data.git 
                
                await updateColByEmail(row['email'], 'profile_img', f.name).catch((err) => console.log(err))
                let resp = await web.users.lookupByEmail({email: email}).catch((err) => {
                        console.log(err);
                    })
                if (resp == null) break
                let { id } = resp['user']
                resp = await web.users.profile.get({user: id})
                if ('image_original' in resp['profile']) {
                    // console.log(`${row['username']} already has profie image`)
                    break
                }
                // get file name
                console.log(`${row['username']} hasn't had profie image yet.`)
                /* const [url] = await storage.bucket(bucketName).file(f.name).getSignedUrl(options);
                web.chat.postMessage({
                    channel: id,
                    text: `Hi ${row['username']}, 写真をまだアップロードしてないようですね！この写真はいかがですか？ダウンロードして使ってください　ダウンロードリンク: <${url}| ${row['username']}'s profile>.`})
                */
            }
        }
    }
}
// update img file name to postgres tables
main()
