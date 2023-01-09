//you can use twit library in js to get acess to tweets. 
const Twit = require('twit');
//sentiment library
//const Sentiment = require('sentiment');
//const express = require('express');
//const app = express();
//const fetch = require('node-fetch');
require('dotenv').config();
//start listening on port 3000\
/*
app.listen(3000, () => console.log('listening on port 3000'))
app.use(express.static('public'));
app.use(express.json({limit: '1mb'}));

app.get('/api', (request, response) => {
    database.find({},(err, data) => {
        if(err) {
            response.end();
            return;
        }
        response.json(data);
    });
    
});
*/

api_key = process.env.TWITTER_API_KEY;
api_key_secret = process.env.TWITTER_API_SECRET;
accessToken = process.env.TWITTER_ACCESS_TOKEN;
accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

//twit object
var T = new Twit({ 
    consumer_key:        api_key,
    consumer_secret:     api_key_secret,
    access_token:         accessToken,
    access_token_secret:  accessTokenSecret,
});


(async () => {
    T.get('search/tweets', { q: '#tesla since:2020-04-15', count: 1 }, function(err, data, response) {
        const tweets = data;
        //.map(tweet => `LANG: ${franc(tweet.text)} : ${tweet.text}`) //CHECK LANGUAGE
        //.map(tweet => tweet.text)
        //.filter(tweet => tweet.toLowerCase().includes('elon'));
        console.log(tweets);
    })
})();


/*
var sentiment = new Sentiment();
var result = sentiment.analyze('hey thats pretty neat, fuck, happy, love, masterpiece, wonderful, happy');
console.dir(result); 
*/

//accessing reddits api to get the top 10 posts from r/tesla
// Path: reddit_api.js
