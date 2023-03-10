
function appendTrendData(data){
  stopLoader();
  $('#trendBox').empty();
    //adds sentiment data to string using join. and creates cookie for analysis data. 
    //const cookieData = '';
    
    let tableHTML = '<table>'; //start of table
    let cookieData = '<table> <tr><th>Trend Number</th><th>Trend Name</th><th>Reddit Emoji</th><th>Twitter Emoji</th><th>Github Emoji</th></tr>';
    //table header
    if (Cookies.get('sentData')) {
      tableHTML += '<tr><th>Trend Number</th><th>Trend Name</th><th>Reddit Emoji</th><th>Twitter Emoji</th><th>Github Emoji</th></tr>';
    }
    for(let i = 0; i < data.length; i++){
        tableHTML += `<tr><td>${i + 1}</td><td>${data[i].name}</td><td>${data[i].emojis.reddit}</td><td>${data[i].emojis.twitter}</td><td>${data[i].emojis.github}</td>`;
        cookieData += `<tr><td>${i + 1}</td><td>${data[i].name}</td><td>${data[i].emojis.reddit}</td><td>${data[i].emojis.twitter}</td><td>${data[i].emojis.github}</td>`;
    }
    cookieData += '</table>';
    tableHTML += '</table>';//end of table
    //append data
    $('#trendBox').append(tableHTML); 
    Cookies.set('sentData', cookieData);
}
function startLoader() {
  document.getElementById('loader').style.visibility = 'visible';
};
function stopLoader() {
  document.getElementById('loader').style.visibility = 'hidden';
}
document.addEventListener("load", function(){
  stopLoader();
});

//will get getTrendingTopics every hour
function getTrending() {
  const hourTing = 3600000;
    //gets cookie data
    startLoader();
    const cookieData = Cookies.get('sentData');
    //if cookie data was set under an hour ago it resets the current cookie data to the html element trendbox or if the cookie data doesnt exist.
    if (cookieData) {
      const timeElapsed = Date.now() - Cookies.get('sentDataTime');
      if (timeElapsed < hourTing) {
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
    }, hourTing);
  }
  $('#refresh').click(function () {
    startLoader();
    console.log("refreshed");
    $.get('/getTrendingTopics', appendTrendData);
  });
  
  getTrending();