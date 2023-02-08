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


app.get('/searchReddit', async (req, res) => {
  const searchTerm = req.query.searchTerm;
  console.log(req.query.searchTerm);
  const snoo = new SnooShift(); 
  const searchParams = {
    q: searchTerm,
    size: 100,
    order: 'asc',
    sort: 'created_utc'
  };
  try{
    const comments = await snoo.searchComments("\""+searchParams+"\"");
    let commentBody = comments.map(comment => comment.body + "\n");
    let bodyText = commentBody.join("");
    let he = require('he');
    let fixedText = he.decode(bodyText);
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
          'entities': {
            'emotion': true,
            'sentiment': true,
          },
          'keywords': {
            'emotion': true,
            'sentiment': true,
          },
        }
      },
    };
    const analysisResults = await naturalLanguageUnderstanding.analyze(analyzeParams);
  
    // TODO: check for language is english
    // if lang is english (program wil give bad request if language is not english)
    
    let sentimentResults = analysisResults.result.emotion.document.emotion;
          

    //sadness
    var sadness = sentimentResults.sadness;
    sadness = sadness.toFixed(2);

    var joy = sentimentResults.joy;
    joy = joy.toFixed(2);

    var fear = sentimentResults.fear;
    fear = fear.toFixed(2);
    
    var disgust = sentimentResults.disgust;
    disgust = disgust.toFixed(2);

    var anger = sentimentResults.anger;
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