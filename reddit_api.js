
const snoowrap = require('snoowrap');
//const fs = require('fs');
require('dotenv').config();


//userAgent = process.env.Reddit_userAgent;

function test() {
  const r = new snoowrap({ // get proper values here 
    userAgent:  process.env.Reddit_userAgent,
    clientId: process.env.Reddit_clientId,
    clientSecret: process.env.Reddit_clientSecret,
    //refreshToken: process.env.Reddit_refreshToken,
    username: process.env.Reddit_username,
    password: process.env.Reddit_password 
  }); 
  //function to get commebts from a certian subreddit and console log them to the server side
  r.getSubreddit('aww').getNewComments({limit: 25}).then(output => {
    //console log only the text of the comments
    for (var i = 0; i < output.length; i++) {
      console.log(i+1," ",output[i].body);
    }
  });


  //r.getNewComments({limit: 10}).then(output => {
    //const outputString = JSON.stringify(output, null, 2);
    //fs.writeFileSync('result.txt', outputString);
  //});
}
test();
