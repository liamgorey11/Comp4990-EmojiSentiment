
const snoowrap = require('snoowrap');
const fs = require('fs');
require('dotenv').config();


userAgent = process.env.Reddit_userAgent;

function test() {
  const r = new snoowrap({ // get proper values here 
    userAgent:  userAgent,
    clientId: process.env.Reddit_clientId,
    clientSecret: process.env.Reddit_clientSecret,
    refreshToken: process.env.Reddit_refreshToken,
    username: process.env.Reddit_username,
    password: process.env.Reddit_password 
  }); 
  r.getNewComments({limit: 10}).then(output => {
    const outputString = JSON.stringify(output, null, 2);
    fs.writeFileSync('result.txt', outputString);
  });
}
test();
