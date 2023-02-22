
function appendTrendData(data){
    //adds sentiment data to string using join. and creates cookie for analysis data. 
    cookieData = '';
    $('#trendBox').empty();
    for(let i = 0; i < data.length; i++){
        $('#trendBox').append(`<p>${i + 1}: ${data[i].name} EmojiReddit: ${data[i].emojis.reddit} EmojiTwitter: ${data[i].emojis.twitter}(${data[i].sentiment.twitter}) EmojiGithub: ${data[i].emojis.github}(${data[i].sentiment.github})</p>`);
        cookieData += `<p>${i + 1}: ${data[i].name} EmojiReddit: ${data[i].emojis.reddit} EmojiTwitter: ${data[i].emojis.twitter}(${data[i].sentiment.twitter}) EmojiGithub: ${data[i].emojis.github}(${data[i].sentiment.github})</p>`;
    }
    Cookies.set('sentData', cookieData);
}

//will get getTrendingTopics every hour
function getTrending() {
    //gets cookie data
    const cookieData = Cookies.get('sentData');
    //if cookie data was set under an hour ago it resets the current cookie data to the html element trendbox or if the cookie data doesnt exist.
    if (cookieData) {
      const timeElapsed = Date.now() - Cookies.get('sentDataTime');
      if (timeElapsed < 3600000) {
        $('#trendBox').html(cookieData);
        return;
      }
    }

    //calls append data function when the hour is up. and resets time cookie(try to make it reset cookies if server tuens off )
    $.get('/getTrendingTopics', function(data) {
      appendTrendData(data);
      Cookies.set('sentDataTime', Date.now());
    });
    
    setInterval(function() {
      $.get('/getTrendingTopics', appendTrendData); //might be abel to delete this 
      Cookies.set('sentDataTime', Date.now());
      console.log("Trending updated ");
    }, 3600000);
  }
  
  getTrending();