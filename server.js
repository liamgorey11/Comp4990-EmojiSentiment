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
        app.listen(port, () => console.log(`Starting server at ${port}`));
    }catch(e){
        console.log(e.message);
    }
};
start();
//search topics on reddit 
const fetch = require('node-fetch');
const GITHUB_API_URL = 'https://api.github.com';


//searches reddit comments using snooshift and ibmwatson 
async function getReddit(query, limit){
  const snoo = new SnooShift(); 
  const searchParams = {
    q: query,
    size: limit,
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
    return emoji;  
  }catch(error){
    console.error(error);
  }
};

function getTwitter(query, count){
  return new Promise((resolve, reject) => {
    T.get('search/tweets', { q: query, count }, function (err, data, response) {
      if (err) {
        reject(err);
      } else {
        const tweets = data.statuses;
        const sentiment = new Sentiment();
        let totalScore = 0;
        for (let i = 0; i < tweets.length; i++) {
          const result = sentiment.analyze(tweets[i].text);
          totalScore += result.score;
        }
        const averageSentiment = totalScore / tweets.length;
        const emoji = GetEmojiForSentiment(averageSentiment);
        resolve({averageSentiemnentTwitter: averageSentiment, emojiTwitter:emoji });
      }
    });
  });
}
app.get('/search', async (req, res) => {
  try{
    const searchTerm = req.query.term;
    const {averageSentiemnentTwitter, emojiTwitter} = await getTwitter(searchTerm, 40);
    const {averageSentiemnentGithub, emojiGithub} = await getGithub(searchTerm,40);
    const emojiReddit = await getReddit(searchTerm, 100);
    const results = {averageSentiemnentTwitter, emojiTwitter, averageSentiemnentGithub, emojiGithub, emojiReddit}
    res.json(results);
  }catch(error){
    res.status(500).send(error);
  }
});

function GetEmojiForSentiment(averageSentiment) {
  if (averageSentiment > 1) 
  {
    emoji = "😁";
  } 
  else if (averageSentiment < -1) 
  {
      emoji = "😡";
  } 
  else if (averageSentiment < 0) {
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
  return emoji;
}

async function getGithub(query, limit){
  const url = `${GITHUB_API_URL}/search/repositories?q=${query}&per_page=${limit}`;
  const headers = {
    'Authorization': `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
    'User-Agent': 'MyApp'
  };
  try {
    const response = await fetch(url, { headers });
    const data = await response.json();
    const repositories = data.items;
    const sentiment = new Sentiment();
    var totalSentiment = 0;
    for (const repo of repositories) {
      var totalScore = 0;
      const commitUrl = `${repo.url}/commits`;
      const commitResponse = await fetch(commitUrl, { headers });
      const commitData = await commitResponse.json();
      const commits = commitData.map(commit => commit.commit.message);//handle repo with no commit error 
      for (const commit of commits) {
        const result = sentiment.analyze(commit);
        totalScore += result.score/(commits.length);
      }
      const commentUrl = `${repo.url}/issues/comments`;
      const commentResponse = await fetch(commentUrl, { headers });
      const commentData = await commentResponse.json();
      const comments = commentData.map(comment => comment.body);
      for (const comment of comments) {
        const result = sentiment.analyze(comment);
        totalScore += result.score/(comments.length);
      }
      totalSentiment += totalScore / 2;
    }
    const averageSentiment = totalSentiment / repositories.length;
    let emoji;
    emoji = GetEmojiForSentiment(averageSentiment);
    return {averageSentiemnentGithub:averageSentiment,emojiGithub:emoji};
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

//reccieves text from the client textarea then returns the sentiment of the text to the client page
app.get('/customSentiment', async (req, res) => {
    const text = req.query.term;
    var sentiment = new Sentiment();
    const result = sentiment.analyze(text);
    sentiment = result.score;
    console.log(text.length);
    emoji = GetEmojiForSentiment(sentiment);
    res.json({sentiment,emoji});
});