function startLoader() {
  document.getElementById('newLoader').style.visibility = 'visible';
};
function stopLoader() {
  document.getElementById('newLoader').style.visibility = 'hidden';
}

function checkData() {//now doeesbt reset the headings
  const cookieData1 = Cookies.get('sentDataReddit') || ''; //this is so it does not appened and undefined if nothing is changed 
  const cookieData2 = Cookies.get('sentDataTwitter') || '';
  const cookieData3 = Cookies.get('sentDataGithub') || '';
  if (cookieData1){
    $('#AvgSentiment2').html(`<h4>Reddit:</h4> ${cookieData1}`);
  }
  if(cookieData2){
    $('#AvgSentiment').html(`<h4>Twitter:</h4> ${cookieData2}`);
    
  }
  if(cookieData3){
    $('#AvgSentiment4').html(`<h4>Github:</h4> ${cookieData3}`);
  }
  return;
}

function appendData(data) {
  //set cookies equal to header somewhere here 

  var searchInput = $('#searchInput').val();
  $('#AvgSentiment2').append(
    `<p>Sentiment: ${data.averageSentiemnentReddit} ,${data.emojiReddit}, SearchTerm: ${searchInput} </p>`
  );
  $('#AvgSentiment').append(
    `<p>Sentiment: ${data.averageSentiemnentTwitter}, ${data.emojiTwitter}, SearchTerm: ${searchInput} </p>`
  );
  $('#AvgSentiment4').append(
    `<p>Sentiment: ${data.averageSentiemnentGithub}, ${data.emojiGithub}, SearchTerm: ${searchInput} </p>`
  );

  var cookieData1 = Cookies.get('sentDataReddit') || '';
  var cookieData2 = Cookies.get('sentDataTwitter') || '';
  var cookieData3 = Cookies.get('sentDataGithub') || '';

  cookieData1 += `<p>Sentiment: ${data.emojiReddit}, SearchTerm: ${searchInput} </p>`;
  cookieData2 += `<p>Sentiment: ${data.averageSentiemnentTwitter}, ${data.emojiTwitter}, SearchTerm: ${searchInput} </p>`;
  cookieData3 += `<p>Sentiment: ${data.averageSentiemnentGithub}, ${data.emojiGithub}, SearchTerm: ${searchInput} </p>`;

  Cookies.set('sentDataReddit', cookieData1);
  Cookies.set('sentDataTwitter', cookieData2);
  Cookies.set('sentDataGithub', cookieData3);
  stopLoader();
}
checkData();
function submitForm() {
  var searchInput = $('#searchInput').val();
  if(searchInput == ''){
    alert('Please enter a search term');
    return false;
  }
  var startDate = $('#start').val();
  var endDate = $('#end').val();
  $.get('/search', { term: searchInput, startD: startDate, endD: endDate}, appendData);
  startLoader();
  return false;
}

$(function () {
  $('#searchButton').click(submitForm);
});
  
function appendCustomData(data) {
  var customSentiment = $('#custom-Sentiment').val();
  $('#AvgSentiment3').append(
    `<p>Average Sentiment General Text: ${data.custsentiment}, ${data.emoji}</p>`
  );
}
  
$('#custom-Sentiment-Button').click(function () {
  var customSentiment = $('#custom-Sentiment').val();
  $.get('/customSentiment', { term: customSentiment }, appendCustomData);
});
  
$('#clearButton').click(function () {
  //aslo clear text in search box
  $('#searchInput').val('');
  $('#AvgSentiment3').html('<h4>Custom text: </h4>');
  $('#AvgSentiment').html('<h4>Twitter <i class="fab fa-twitter">: </h4>');
  $('#AvgSentiment2').html('<h4> Reddit <i class="fab fa-reddit-alien">: </h4>');
  $('#AvgSentiment4').html('<h4> Github <i class="fab fa-github">: </h4>');
  Cookies.remove('sentDataReddit');
  Cookies.remove('sentDataTwitter');
  Cookies.remove('sentDataGithub');
});