# EmojiSentiment

## Introduction

EmojiSentiment is a web app that allows users to search topics over different social media platforms. The purpose of this project is to compare how people feel about specific topics across different social media platforms. 

This project was created as a part of a University capstone project.

## Dependencies

``` json
"dependencies": {
    "dotenv": "^16.0.3",
    "export": "^0.1.337",
    "express": "^4.18.2",
    "fb-sdk-wrapper": "^1.1.0",
    "franc": "^6.0.0",
    "fs": "^0.0.1-security",
    "http-server": "^14.1.1",
    "ibm-watson": "^7.1.2",
    "js-cookie": "^3.0.1",
    "mongoose": "^6.8.4",
    "node-emoji": "^1.11.0",
    "node-fetch": "^2.6.9",
    "node-notifier": "^10.0.1",
    "open": "^7.0.3",
    "p5js": "^1.2.18",
    "raw.js": "^0.1.8",
    "rereddit": "^1.0.0",
    "sentiment": "^5.0.2",
    "snooshift": "^1.0.2",
    "snoowrap": "^1.23.0",
    "twit": "^2.2.11",
    "underscore": "^1.13.6"
}
```



## Instructions

1. Clone the repository to your local machine using Git. You can do this by running the following command in your terminal:

```bash
git clone https://github.com/AndrewHamel111/Comp4990-EmojiSentiment.git
```

2. Navigate to the project directory using the following command:

```bash
cd Comp4990-EmojiSentiment
```

3. Install the project dependencies by running the following command:

```bash
npm install
```

4. Set up the environment variables needed for the project. Any API keys used in the project, the application needs to function. You can either set these variables directly in your terminal session or create a `.env` file in the project directory and store them there. The APIs used can be found by inspecting the `server.js ` file. All wrappers and references are setup at the top of the file.

5. Start the server by running the following command:

```bash
node server.js
```

6. Now open localhost:3000 in your web browser and you should reach the dashboard.

## Future Work / Improvement Ideas

* To improve the readability of the site, a data visualization library such as D3 could be used to generate graphs and interactive plots of sentiment values for specific terms over a period of time.
* Integrating the APIs of more social media platforms could also help widen the sample data to include more trends.
* Creating a custom sentiment analyzer that could be re-used for all sites could help cut down on dependencies and would be an interesting exercise considering the subject of the project.
* Improving the efficiency and speed of the server calls would greatly improve the usability of the dashboard. Currently the server does very little caching, and the client side only features whatever caching is built-in to the functionality of the user's browser.