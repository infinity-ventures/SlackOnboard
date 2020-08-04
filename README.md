# Slack Onboard

Slack onboard help to setup user status when a new user join the workspace. Currently, Slack onboard can do the following:
1. Update user's profile information when first join.
2. Invite to pre-specified channels when first join.
3. Send message and images to members who hasn't had a profile image.

## Set Up Your Slack App

1. Create an app at your Slack App Setting page at [api.slack.com/apps](https://api.slack.com/apps):
2. Enable events and point to `https://your-server.com/onBoard`
3. Subscribe to bot event: `team_join`, `message.im`
4. Make sure the `bot` scope has been pre-selected
5. Add the following scopes
    1. Bot scope:  `im:history`, `im:read`, `im:write`, `users.profile:read`, `users:read`, `users:read.email`
    2. User scope: `users.profile:write`

## Set ENV variables
Create `.env` for your production ENV variables; and `.dev_env` for your development ENV variables.

```
GOOGLE_KEY_JSON=  # path to google json credential

PGUSER=
PGPASSWORD=
PGHOST=
PGPORT=
PGDATABASE=

SLACK_VERIFICATION_TOKEN=
SLACK_USER_TOKEN=
SLACK_BOT_TOKEN=
```

Get Your Slack credentials at: `https://api.slack.com/apps/[YOUR_APP_ID]/general` at **Basic Information**, auth token at **OAuth & Permissions**.

## Create PostgresDB on GCP

### For production
Follow this: [Connecting from Cloud Functions to Cloud SQL](https://cloud.google.com/sql/docs/mysql/connect-functions#private-ip)

### For development
Follow this: [Connecting MySQL client using the Cloud SQL Proxy](https://cloud.google.com/sql/docs/mysql/connect-admin-proxy)

## Deploy to Google Cloud Functions

`$ npm run deploy`


### Execute scripts locally

`npm run update_profiles`
