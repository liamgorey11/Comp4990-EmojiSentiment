//you can use twit library in js to get acess to tweets. 
const Twit = require('twit');
const Sentiment = require('sentiment');
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();


//Twit Setup
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

//express setup
const app = express();
app.use(express.urlencoded({extended: true}));
const port = process.env.PORT || 3000;
app.use(express.static('website'));
app.use(express.json({limit: '1mb'}));

//mongoose/express setup
mongoose.set('strictQuery', false);
const start = async () => {
    try{
        await mongoose.connect(`mongodb+srv://liamgorey11:${process.env.MONGODB_password}@cluster0.ktp9aod.mongodb.net/?retryWrites=true&w=majority`);
        console.log("MongoDB Connected");
        app.listen(port, () => console.log(`Starting server at ${port}`));
    }catch(e){
        console.log(e.message);
    }
};
start();

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



app.get('/search', (req, res) => {
    const searchTerm = req.query.term;
    T.get('search/tweets', { q: searchTerm,count: 20}, function(err, data, response) {
      if(err) return res.status(500).json({ error: err });
      //res.json(data);
      const tweets = data.statuses;
      var index = 0;
      var sentiment = new Sentiment();
      var totalScore = 0;
      for (var i = 0; i < tweets.length; i++){
          index++;
          console.log("\n",index," ",tweets[i].text);
          const result = sentiment.analyze(tweets[i].text);
          totalScore += result.score;
          console.log("Postive: {" ,result.positive, "}","Negative: {", result.negative,"}")
          console.log("score: ",result.score);
      }
      //send back the data from the tweets aswell as average sentiment
        const averageSentiment = totalScore/tweets.length;
        console.log(averageSentiment);
        res.json(averageSentiment);
        //res.json({tweets, averageSentiment});
      
    });
});
app.get('/sentiment', (req, res) => {

});



/*
app.get('search', getData);
var params = {
    q: 'amongus since:2019-04-15',
    count: 10,
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
        console.log("Postive: {" ,result.positive, "}","Negative: {", result.negative,"}")
        console.log("score: ",result.score);
    }
    //app.post('/tweets', (req,res) => {
        //res.send(tweets);
   // });
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
*/

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



