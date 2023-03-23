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

//twit object setup
var T = new Twit({
  consumer_key: process.env.TWITTER_API_KEY,
  consumer_secret: process.env.TWITTER_API_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

//express setup localhost server
const app = express();
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 3000;
app.use(express.static("website"));//uses website folder 
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

var trendingTopicsCache = [];
var trendingTopicsTimestamp = 0;
const trendingTopicsExpiry = 1000 * 60 * 60 * 3;

//searches reddit comments using snooshift and ibmwatson
async function getDataReddit(query, limit, startDate, endDate) {
  const snoo = new SnooShift();
  const searchParams = {
    q: query,
    size: limit,
    after: startDate,
    before: endDate
  };
  try {
    const comments = await snoo.searchComments(searchParams);
    let commentBody = comments.map(comment => comment.body);
    let bodyText = commentBody.join("");
    const meep = await getEmojisIBMTING(bodyText);
    return {
      averageSentiemnentReddit: meep.sent, 
      emojiReddit: meep.emojis
    }; 
  } catch (error) {
    console.error(error);
  }
};

//search twitter for user query
async function getDataTwitter(query, startDate, endDate, count) {
  const params = {
    q: `${query} since:${startDate}until:${endDate}`,
    count,
  };

  try {
    const { data } = await T.get("search/tweets", params);
    const tweets = data.statuses;
    let allTweets = tweets.map(tweet => tweet.text).join('\n');
    const emojiData = await getEmojisIBMTING(allTweets);
    return {
      averageSentiemnentTwitter: emojiData.sent,
      emojiTwitter: emojiData.emojis,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

//github searches repos/comments/commits
async function getDataGithub(query, limit, startDate, endDate) {
  const url = `${GITHUB_API_URL}/search/repositories?q=${query}+created:${startDate}..${endDate}&per_page=${limit}`;
  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
    "User-Agent": "MyApp",
  };
  try {
    const response = await fetch(url, { headers });
    const data = await response.json();
    const repositories = data.items;
    var commitAndCommentData = [];
    if(Array.isArray(repositories) && repositories.length >= 1){
      for (const repo of repositories) {
        const commitUrl = `${repo.url}/commits`;
        const commitResponse = await fetch(commitUrl, { headers });
        const commitData = await commitResponse.json();
        //check commitData here
        if (Array.isArray(commitData) && commitData.length > 0) {
          const commitSummarys = commitData.map((commitSum) => commitSum.commit.message); //handle repo with no commit error
          commitAndCommentData = commitAndCommentData.concat(commitSummarys);
        }
        const commentUrl = `${repo.url}/issues/comments`;
        const commentResponse = await fetch(commentUrl, { headers });
        const commentData = await commentResponse.json();
        //chech commentData here
        if (Array.isArray(commentData) && commentData.length > 0) {
          const comments = commentData.map((comment) => comment.body);
          commitAndCommentData = commitAndCommentData.concat(comments);
        }
      }
    }
  //check if there are any actual results 
  if(repositories === undefined){
    return ({averageSentiemnentGithub: "NO RESULTS", emojiGithub: "😐"});
  }else{
    const CombinedData = commitAndCommentData.join(" ");
    const emojiData = await getEmojisIBMTING(CombinedData);
    return {
      averageSentiemnentGithub: emojiData.sent,
      emojiGithub: emojiData.emojis,
    };
  }
  } catch (error) {
    console.log(error); //This is an acceptable error that is handled in the trending topics case
  }
}

async function getEmojisIBMTING(bodyText) {
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
  const sentiment = analysisResults.result.sentiment.document.score;

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
  return {emojis: emojis,sent: sentiment};
}

app.get("/search", async (request, result) => {
  try {
    const searchTerm = request.query.term;
    const startDate = request.query.startD;
    const endDate = request.query.endD;
    const newDate = new Date(startDate);
    const newDate2 = new Date(endDate);
    const endTimeSecs = newDate2.getTime() / 1000;
    const startTimeSecs = newDate.getTime() / 1000;
    console.log(startTimeSecs);
    console.log(startDate);
    console.log("SEARCH TERM:", searchTerm);
    const { averageSentiemnentTwitter, emojiTwitter } = await getDataTwitter(searchTerm,startDate,endDate,100);
    const { averageSentiemnentGithub, emojiGithub } = await getDataGithub(searchTerm,25,startDate,endDate);
    const { averageSentiemnentReddit, emojiReddit } = await getDataReddit(searchTerm,25,startTimeSecs,endTimeSecs);
    const results = {
      averageSentiemnentTwitter, 
      emojiTwitter,
      averageSentiemnentGithub,
      emojiGithub,
      averageSentiemnentReddit,
      emojiReddit,
    };
    result.json(results);
  } catch (error) {
    result.status(500).send(error);
  }
});

app.get("/getTrendingTopics", async (req, res) => {
  //calls the getTwitter, getGithub and getReddit functions with the trending topics on twitter maybe 4-10 of them.
  // will need a new function to grab the trending hashtags ,then put that in as the query term for the functions.
  // this will be called from the client every hour. (maybe find a way to make the functions faster)
  //right here will just be getting the trending topics(from canada)
  const cacheReady = Date.now() < trendingTopicsTimestamp + trendingTopicsExpiry;
  if(cacheReady) {
    res.json(trendingTopicsCache);
    return;
  }

  try {
    T.get("trends/place", { id: "23424775" }, async (err, data, response) => { //TODO: make const global var for Canada id in param section
      //gets from canadian trending in canada top 3
      if (err) {
        console.log(err);
      } else {
        const newDate = new Date("2022-02-20");//TODO: dont hardcode dates Put into functiion with date.now()now-24hours, and date2 date.now()
        const newDate2 = new Date("2023-02-21");
        const date = "2022-02-20";
        const date2 = "2023-02-21";
        const startTimeSecs = newDate.getTime() / 1000;
        const endTimeSecs = newDate2.getTime() / 1000;
        let trendingTopics = [];
        
        const trends = data[0].trends.slice(0, 3);
        for (const trend of trends) {
					const trimmedName = (trend.name).replace("#", "");

					var averageSentiemnentTwitter = 0;
					var averageSentiemnentGithub = 0;
					var averageSentiemnentReddit = 0;
					var emojiTwitter = [];
					var emojiReddit = [];
					var emojiGithub = [];
 
					const twitterResult = await getDataTwitter(trimmedName, date, date2, 100);
					if (twitterResult != undefined)
					{
						averageSentiemnentTwitter = twitterResult.averageSentiemnentTwitter;
						emojiTwitter = twitterResult.emojiTwitter;
					}
 
					const githubResult = await getDataGithub(trimmedName, 100,date, date2);
					if (githubResult != undefined)
					{
						averageSentiemnentGithub = githubResult.averageSentiemnentGithub;
						emojiGithub = githubResult.emojiGithub;
					}
 
					const redditResult = await getDataReddit(trimmedName, 25, startTimeSecs, endTimeSecs);
					if (redditResult != undefined)
					{
						averageSentiemnentReddit = redditResult.averageSentiemnentReddit;
						emojiReddit = redditResult.emojiReddit;
					}
 
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
        trendingTopicsCache = trendingTopics;
        trendingTopicsTimestamp = Date.now();
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

//reccieves text from the client textarea then returns the sentiment of the text to the client page
app.get("/customSentiment", async (req, res) => {
  const text = req.query.term;
  const result = await getEmojisIBMTING(text);
  res.json({ custsentiment: result.sent, emoji: result.emojis});
});
