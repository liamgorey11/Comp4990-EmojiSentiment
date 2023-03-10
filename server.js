//you can use twit library in js to get acess to tweets.
const Twit = require("twit");
const Sentiment = require("sentiment");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const { SnooShift } = require("snooshift");
const fs = require("fs");
const NaturalLanguageUnderstandingV1 = require("ibm-watson/natural-language-understanding/v1");
const { IamAuthenticator } = require("ibm-watson/auth");

//Twit Setup
api_key = process.env.TWITTER_API_KEY;
api_key_secret = process.env.TWITTER_API_SECRET;
accessToken = process.env.TWITTER_ACCESS_TOKEN;
accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
//twit object
var T = new Twit({
  consumer_key: api_key,
  consumer_secret: api_key_secret,
  access_token: accessToken,
  access_token_secret: accessTokenSecret,
});

//express setup
const app = express();
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 3000;
app.use(express.static("website"));
app.use(express.json({ limit: "1mb" }));

//mongoose/express setup
mongoose.set("strictQuery", false);
const start = async () => {
  try {
    app.listen(port, () => console.log(`Starting server at ${port}`));
  } catch (e) {
    console.log(e.message);
  }
};
start();

//search topics on reddit
const fetch = require("node-fetch");
const { response } = require("express");
const GITHUB_API_URL = "https://api.github.com";

//searches reddit comments using snooshift and ibmwatson
async function getReddit(query, limit, startDate, endDate) {
  const snoo = new SnooShift();
  const searchParams = {
    q: query,
    size: limit,
    after: startDate,
    before: endDate
  };
  try {
    const comments = await snoo.searchComments(searchParams);
    let commentBody = comments.map(comment => comment.body + "\n");
    let bodyText = commentBody.join("");
    const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
      version: '2022-04-07',
      authenticator: new IamAuthenticator({
        apikey: process.env.Watson_apikey,
      }),
      serviceUrl: process.env.Watson_serviceUrl,
    });
    const analyzeParams = {
      'text': bodyText,
      'features': {
        'emotion': {
          'document': {
            'emotion': true,
          },
        },
        'sentiment': {
          'document': {
            'score': true,
          },
        },
      },
    };
    const analysisResults = await naturalLanguageUnderstanding.analyze(
      analyzeParams
    );
    let emotionResults = analysisResults.result.emotion.document.emotion;
    const emoji = getEmojisIBMTING(emotionResults);
    //const sentiment1 = new Sentiment();
    //const emotionResults = sentiment1.analyze(bodyText);
    //const sentiment = emotionResults;
    //console.log("SENTIMENT: " + sentiment);
    //const emoji = GetEmojiForSentiment(sentiment);
    const sentiment = analysisResults.result.sentiment.document.score;
    console.log("SENTIMENT: " + sentiment);
    return ({averageSentiemnentReddit: sentiment, emojiReddit: emoji }); //fix this
  } catch (error) {
    console.error(error);
  }
};

function getEmojisIBMTING(emotionResults) {
  const joy = emotionResults.joy;
  const sadness = emotionResults.sadness;
  const fear = emotionResults.fear;
  const disgust = emotionResults.disgust;
  const anger = emotionResults.anger;
  //ADD TO A LIST
  //dont do params like that
  const emojis = [];
  let total = joy + sadness + fear + disgust + anger;
  console.log("TOTAL: " + total);
  let joyPercent = Math.round((joy / total) * 100);
  let sadnessPercent = Math.round((sadness / total) * 100);
  let fearPercent = Math.round((fear / total) * 100);
  let disgustPercent = Math.round((disgust / total) * 100);
  let angerPercent = Math.round((anger / total) * 100);
  console.log("JOY: " + joyPercent);
  console.log("SADNESS: " + sadnessPercent);
  console.log("FEAR: " + fearPercent);
  console.log("DISGUST: " + disgustPercent);
  console.log("ANGER: " + angerPercent);
  if (joyPercent >= 30) {
    emojis.push(`😀:${joyPercent}%`);
  } else if (joyPercent >= 20) {
    emojis.push(`😊:${joyPercent}%`);
  } if (sadnessPercent >= 30) {
    emojis.push(`😢:${sadnessPercent}%`);
  } else if (sadnessPercent >= 20) {
    emojis.push(`😔:${sadnessPercent}%`);
  }
  if (fearPercent >= 20) {
    emojis.push(`😱:${fearPercent}%`);
  } else if (fearPercent >= 15) {
    emojis.push(`😨:${fearPercent}%`);
  }
  if (disgustPercent >= 20) {
    emojis.push(`🤢:${disgustPercent}%`);
  } else if (disgustPercent >= 15) {
    emojis.push(`🤮:${disgustPercent}%`);
  }
  if (angerPercent >= 20) {
    emojis.push(`🤬:${angerPercent}%`);
  } else if (angerPercent >= 15) {
    emojis.push(`😠:${angerPercent}%`);
  }
  if (emojis.length === 0) {
    emojis.push("😐:ERROR");
  }
  console.log(emojis);
  return emojis;
}

function getTwitter(query, startDate, endDate, count) {
  return new Promise((resolve, reject) => {
    const params = {
      q: `${query} since:${startDate}until:${endDate}`,
      count,
    }
    T.get(
      "search/tweets",
      params,
      function (err, data, response) {
        console.log(`${query} since:${startDate}`);
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
          resolve({
            averageSentiemnentTwitter: averageSentiment,
            emojiTwitter: emoji,
          });
        } //convert to IBM ONE
      }
    );
  });
}

app.get("/search", async (req, res) => {
  try {
    const searchTerm = req.query.term;
    const startDate = req.query.startD;
    const endDate = req.query.endD;
    const newDate = new Date(startDate);
    const newDate2 = new Date(endDate);
    const endTimeSecs = newDate2.getTime() / 1000;
    const startTimeSecs = newDate.getTime() / 1000;
    console.log(startTimeSecs);
    console.log(startDate);

    const { averageSentiemnentTwitter, emojiTwitter } = await getTwitter(searchTerm,startDate,endDate,10);
    const { averageSentiemnentGithub, emojiGithub } = await getGithub(searchTerm,10,startDate,endDate);
    const { averageSentiemnentReddit, emojiReddit } = await getReddit(searchTerm,10,startTimeSecs,endTimeSecs);
    const results = {
      averageSentiemnentTwitter,
      emojiTwitter,
      averageSentiemnentGithub,
      emojiGithub,
      averageSentiemnentReddit,
      emojiReddit,
    };
    res.json(results);
  } catch (error) {
    res.status(500).send(error);
  }
});
app.get("/getTrendingTopics", async (req, res) => {
  //calls the getTwitter, getGithub and getReddit functions with the trending topics on twitter maybe 4-10 of them.
  // will need a new function to grab the trending hashtags ,then put that in as the query term for the functions.
  // this will be called from the client every hour. (maybe find a way to make the functions faster)
  //right here will just be getting the trending topics(from canada)
  try {
    T.get("trends/place", { id: "23424775" }, async (err, data, response) => {
      //gets from canadian trending in canada top 3
      if (err) {
        console.log(err);
      } else {
        const newDate = new Date("2022-02-20");
        const newDate2 = new Date("2023-02-21");
        const date = "2022-02-20";
        const date2 = "2023-02-21";
        const startTimeSecs = newDate.getTime() / 1000;
        const endTimeSecs = newDate2.getTime() / 1000;
        let trendingTopics = [];

        const trends = data[0].trends.slice(0, 3);
        for (const trend of trends) {
          const trimmedName = (trend.name).replace("#", "");
          const { averageSentiemnentTwitter, emojiTwitter } = await getTwitter(trimmedName, date, date2, 10);
          const { averageSentiemnentGithub, emojiGithub } = await getGithub(trimmedName, 10, date, date2);
          const { averageSentiemnentReddit, emojiReddit } = await getReddit(trimmedName, 10, startTimeSecs, endTimeSecs);
          trendingTopics.push({
            name: trend.name,
            sentiment: {
              twitter: averageSentiemnentTwitter,
              github: averageSentiemnentGithub,
               reddit: averageSentiemnentReddit,
            },
            emojis: {
              twitter: emojiTwitter,
              reddit: emojiReddit,
              github: emojiGithub,
            },
          });
        }
        res.json(trendingTopics);
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching trending topics");
  }
});
//used in github and twitter functions
function GetEmojiForSentiment(averageSentiment) {
  if (averageSentiment > 1) {
    emoji = "😁";
  } else if (averageSentiment < -1) {
    emoji = "😡";
  } else if (averageSentiment < 0) {
    emoji = "😔";
  } else if (averageSentiment > 0) {
    emoji = "🙂";
  } else {
    emoji = "😐";
  }
  return emoji;
}

async function getGithub(query, limit, startDate, endDate) {
  const url = `${GITHUB_API_URL}/search/repositories?q=${query}+created:${startDate}..${endDate}&per_page=${limit}`;
  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
    "User-Agent": "MyApp",
  };
  try {
    const response = await fetch(url, { headers });
    const data = await response.json();
    const repositories = data.items;
    const sentiment = new Sentiment();
    var totalSentiment = 0;
    if(Array.isArray(repositories) && repositories.length >= 1){
      for (const repo of repositories) {
        var totalScore = 0;
        const commitUrl = `${repo.url}/commits`;
        const commitResponse = await fetch(commitUrl, { headers });
        const commitData = await commitResponse.json();

        //check commitData here
        if (Array.isArray(commitData) && commitData.length > 0) {
          const commits = commitData.map((commit) => commit.commit.message); //handle repo with no commit error
          for (const commit of commits) {
            const result = sentiment.analyze(commit);
            totalScore += result.score / commits.length;
          }
        }
        const commentUrl = `${repo.url}/issues/comments`;
        const commentResponse = await fetch(commentUrl, { headers });
        const commentData = await commentResponse.json();

        //chech commentData here
        if (Array.isArray(commentData) && commentData.length > 0) {
          const comments = commentData.map((comment) => comment.body);
          for (const comment of comments) {
            const result = sentiment.analyze(comment);
            totalScore += result.score / comments.length;
          }
        }
        if (totalScore > 0) {
          totalSentiment += totalScore / 2;
        }
      }
  }
  //check if there are any actual results 
  if(repositories === undefined){
    return ({averageSentiemnentGithub: "NO RESULTS", emojiGithub: "😐"});
  }else{
    const averageSentiment = totalSentiment / repositories.length;
    const emoji = GetEmojiForSentiment(averageSentiment);
    return ({ averageSentiemnentGithub: averageSentiment, emojiGithub: emoji });
  }
  } catch (error) {
    console.error(error);
    //res.status(500).json({ error: error.message });
  }
}

//reccieves text from the client textarea then returns the sentiment of the text to the client page
app.get("/customSentiment", async (req, res) => {
  const text = req.query.term;
  const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
    version: "2022-04-07",
    authenticator: new IamAuthenticator({
      apikey: process.env.Watson_apikey,
    }),
    serviceUrl: process.env.Watson_serviceUrl,
  });
  const analyzeParams = {
    text: text,
    features: {
      emotion: {
        document: {
          emotion: true,
        },
      },
      sentiment: {
        document: {
          score: true,
        },
      },
    },
  };
  const analysisResults = await naturalLanguageUnderstanding.analyze(
    analyzeParams
  );
  let emotionResults = analysisResults.result.emotion.document.emotion;
  const emoji = getEmojisIBMTING(emotionResults);
  const custsentiment = analysisResults.result.sentiment.document.score;

  res.json({ custsentiment, emoji });
});
