//you can use twit library in js to get acess to tweets. 
const Twit = require('twit');
//sentiment library
const Sentiment = require('sentiment');
const express = require('express');
const app = express();
const fetch = require('node-fetch');
require('dotenv').config();
//start listening on port 3000\
const fs = require('fs')
var emoji = require('node-emoji');

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Starting server at ${port}`));
app.use(express.static('website'));
app.use(express.json({limit: '1mb'}));

//Posting data
/*
app.post('/api', (request, response) => {
    const data = request.body;;
    const timestamp = Date.now();
    data.timestamp = timestamp;
    //console.log(timestamp.toLocaleDateString());
    database.insert(data);
    response.json(data);
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


app.get('tweets/:query', getData);
var params = {
    q: 'meep since:2019-04-15',
    count: 110,
}
function getData(err, data, response) {
    const tweets = data.statuses;
    var index = 0;
    var sentiment = new Sentiment();
    var totalScore = 0;
    for (var i = 0; i < tweets.length; i++){
        index++;
        console.log("\n",index," ",tweets[i].text);
        const result = sentiment.analyze(tweets[i].text);
        totalScore += result.score;
        console.log("Postive: {" +result.positive, "}","Negative: {", result.negative,"}")
        console.log("score: ",result.score);
        //fs.appendFile("tweets.txt", JSON.stringify([tweets[i].text]));
    }
    const averageSentiment = totalScore/tweets.length;
    var emoji;
    if (averageSentiment > 1){
        emoji = "😁";
    }else if( averageSentiment < -1 ){
        emoji = "😡";
    }
    else if (averageSentiment < 0){
        emoji = "😔";
    
    }else if( averageSentiment > 0){
        emoji = "🙂";
    }else{
        emoji = "😐";
    }

    console.log("-------------------------------------");
    console.log("\ntotal: ", totalScore)
    console.log("Avg Score: ",averageSentiment," ",emoji );
    console.log("Search Query: ",params.q);
    console.log("-------------------------------------");
}
T.get('search/tweets', params , getData);

/*
app.get('tweets/:query', getTweets);
function getTweets(req, res) {
    // Here's the string we are seraching for
    var query = req.params.query;
  
    // Execute a Twitter API call
    T.get('search/tweets', { q: query, count: 10 }, gotData);
  
    // Callback
    function gotData(err, data) {
      // Get the tweets
      var tweets = data.statuses;
      // Spit it back out so that p5 can load it!
      res.send(tweets);
    };
  }
*/
app.get('/tweets', (req,res) =>{
        const{dynamic} = req.params
        console.log(dynamic)
        res.status(200).json({info: 'PUT SCORE OF THE SENTIEMTN IN HERE THEN SEDN IT TO THE CLIENT'})
})



