//you can use twit library in js to get acess to tweets. 
const Twit = require('twit');
const Sentiment = require('sentiment');
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const {SnooShift} = require('snooshift');   
const fs = require('fs');
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');


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
        //await mongoose.connect(`mongodb+srv://liamgorey11:${process.env.MONGODB_password}@cluster0.ktp9aod.mongodb.net/?retryWrites=true&w=majority`);
        console.log("MongoDB Connected");
        app.listen(port, () => console.log(`Starting server at ${port}`));
    }catch(e){
        console.log(e.message);
    }
};
start();
//trying to get posts from facebook TEST

//const accessToken = process.env.facebook_acessToken;

app.get('/searchFacebook', async function(req, res) {
  const query = req.query.term;
  //search querys were deprecated in v16.0 of the facebook graph api so this endpoint is not working and we will no longer be using the graph api 
  const endpoint = `https://graph.facebook.com/v16.0/search?q=${query}&type=post&access_token=${process.env.facebook_acessToken}`;
  //endpoint to query facebook posts diffrent from the last endpoint
  console.log("Facebook QUERY", query)  
  try {
    const response = await fetch(endpoint);
    const data = await response.json();
    console.log("data test", data);
    let posts = [];
    for (let i = 0; i < data.data.length; i++) {
      posts.push(data.data[i].message);
    }
    res.json("meep");
  } catch (error) {
    console.error(error);
  }
});
//searches reddit comments using snooshift and ibmwatson 
app.get('/searchReddit', async (req, res) => {
  const searchTerm = req.query.term;
  console.log("meep",req.query.term);
  const snoo = new SnooShift(); 
  const searchParams = {
    q: searchTerm,
    size: 100,
    order: 'asc',
    sort: 'created_utc'
  };
  try{
    const comments = await snoo.searchComments(searchParams);
    let commentBody = comments.map(comment => comment.body + "\n");
    let bodyText = commentBody.join("");
    let he = require('he');
    let fixedText = he.decode(bodyText);
    fs.writeFileSync('redditComments.txt', fixedText);
    const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
      version: '2022-04-07',
      authenticator: new IamAuthenticator({
        apikey: process.env.Watson_apikey,
      }),
      serviceUrl: process.env.Watson_serviceUrl,
    });
    
    const analyzeParams = {
      'text': fixedText,
      'features': {
        'emotion': {
          'document': {
              'emotion':true,
          },
        },
        'sentiment': {
          'document': {
            'score':true,
          }
        },
      },
    };

    const analysisResults = await naturalLanguageUnderstanding.analyze(analyzeParams);
    const outputString = JSON.stringify(analysisResults, null, 2);
    fs.writeFileSync('results.json', outputString);
    // TODO: check for language is english
    // if lang is english (program wil give bad request if language is not english)
    
    let emotionResults = analysisResults.result.emotion.document.emotion;
    let sentimentResults = analysisResults.result.sentiment.document.score
    //sadness
    var sadness = emotionResults.sadness;
    sadness = sadness.toFixed(2);

    var joy = emotionResults.joy;
    joy = joy.toFixed(2);

    var fear = emotionResults.fear;
    fear = fear.toFixed(2);
    
    var disgust = emotionResults.disgust;
    disgust = disgust.toFixed(2);

    var anger = emotionResults.anger;
    anger = anger.toFixed(2);

    var neutral = 1 - sadness - joy - fear - disgust - anger;
    neutral = neutral.toFixed(2);

    console.log("RESULTS");
    console.log("sadness: "+sadness);
    console.log("joy: "+joy);
    console.log("fear: "+fear);
    console.log("disgust: "+disgust);
    console.log("anger: "+anger);
    console.log("neutral: "+neutral);
    console.log("sentiment: "+sentimentResults);
    
    let maxEmotion = 'sadness';
    let maxScore=sadness;
    if (joy > maxScore) {
      maxEmotion = 'joy';
      maxScore = joy;
    }
    else if (fear > maxScore) {
      maxEmotion = 'fear';
      maxScore = fear;
    }
    else if (disgust > maxScore) {
      maxEmotion = 'disgust';
      maxScore = disgust;
    }
    else if (anger > maxScore) {
      maxEmotion = 'anger';
      maxScore = anger;
    }
    let emoji;
    switch (maxEmotion) {
      case 'joy':
        emoji = '😊';
        break;
      case 'fear':
        emoji = '😱';
        break;
      case 'disgust':
        emoji = '🤢';
        break;
      case 'anger':
        emoji = '😠';
        break;
      case 'sadness':
        emoji = '😢';
        break;
      default:
        emoji = '🤔';
        break;
    }
    console.log(emoji);
    res.json(emoji);  
  }catch(error){
    console.error(error);
  }
});

//search reddit comments using snoowrap and sentiment libraries
app.get('/searchReddit1', async (req, res) => {
  const searchTerm = req.query.term;
  const snoo = new SnooShift();
  const searchParams = {
    q: searchTerm,
    size: 100,
    order: 'asc',
    sort: 'created_utc'
  }
  try {
      const comments = await snoo.search({searchParams});
      var sentiment = new Sentiment();
      var totalScore = 0;
      for (var i = 0; i < comments.length; i++){
          const result = sentiment.analyze(comments[i].body);
          totalScore += result.score;
      }
      const averageSentiment = totalScore/comments.length;
      console.log("AVGS SCORE COMMENTS: "+ averageSentiment);
      let emoji;
      if (averageSentiment > 1) 
      {
          emoji = "😁";
      } 
      else if (averageSentiment < -1) 
      {
          emoji = "😡";
      } 
      else if (averageSentiment < 0) 
      {
          emoji = "😔";
      } 
      else if (averageSentiment > 0) 
      {
          emoji = "🙂"; 
      } 
      else 
      {
          emoji = "😐";
      }
      res.json({averageSentiment, emoji});
  } catch (err) {
      return res.status(500).json({ error: err });
  }
});

//search twitter tweets uses twit and sentiment libraries
app.get('/searchTwitter', (req, res) => {
    const searchTerm = req.query.term;
    T.get('search/tweets', { q: searchTerm,count: 50}, function(err, data, response) {
      if(err) return res.status(500).json({ error: err });
      const tweets = data.statuses;
      var sentiment = new Sentiment();
      var totalScore = 0;
      for (var i = 0; i < tweets.length; i++){
          const result = sentiment.analyze(tweets[i].text);
          totalScore += result.score;
          //console.log("\n",i," ",tweets[i].text);
          //console.log("Postive: {" ,result.positive, "}","Negative: {", result.negative,"}")
          //console.log("score: ",result.score);
      }
      //send back the data from the tweets aswell as average sentiment
        const averageSentiment = totalScore/tweets.length;
        console.log("AVGS SCORE TWEETS: "+ averageSentiment);
        if (averageSentiment > 1) 
        {
          emoji = "😁";
        } 
        else if (averageSentiment < -1) 
        {
            emoji = "😡";
        } 
        else if (averageSentiment < 0) 
        {
            emoji = "😔";
        } 
        else if (averageSentiment > 0) 
        {
            emoji = "🙂"; 
        } 
        else 
        {
            emoji = "😐";
        }
        res.json({averageSentiment, emoji});
        //res.json({tweets, averageSentiment});     
    });
});

//reccieves text from the client textarea then returns the sentiment of the text to the client page
app.get('/customSentiment', (req, res) => {
    //analzes the textarea text from the client after the user clicks the button
    const text = req.query.term;
    console.log(text);
    var sentiment = new Sentiment();
    const result = sentiment.analyze(text);
    console.log(result);
    res.json(result.score);
});