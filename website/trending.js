function startLoader() {
  document.getElementById("loader1").style.visibility = "visible";
}
function stopLoader() {
  document.getElementById("loader1").style.visibility = "hidden";
}
function appendTrendData(data) {
  $("#trendBox").empty();
  //adds sentiment data to string using join. and creates cookie for analysis data.
  //const cookieData = '';

  let tableHTML = "<table> <tr><th>Trend Number</th><th>Trend Name</th><th>Reddit Emoji</th><th>Twitter Emoji</th><th>Github Emoji</th></tr>"; //start of table
  for (let i = 0; i < data.length; i++) {
    tableHTML += `<tr><td>${i + 1}</td><td>${data[i].name}</td><td>${data[i].emojis.reddit}</td><td>${data[i].emojis.twitter}</td><td>${data[i].emojis.github}</td>`;
  }
  tableHTML += "</table>"; //end of table

  //append data
  $("#trendBox").append(tableHTML);
  stopLoader();
}

//will get getTrendingTopics every hour
function getTrending() {
  startLoader();
  //calls append data function when the hour is up. and resets time cookie(try to make it reset cookies if server tuens off )
  $.get("/getTrendingTopics", appendTrendData);
}
$("#refresh").click(function () {
  startLoader();
  console.log("refreshed");
  Cookies.set("sentDataTime", Date.now()); // reset so when they refresh it will still auto refresh in an hour after
  $.get("/getTrendingTopics", appendTrendData);
});

getTrending();
