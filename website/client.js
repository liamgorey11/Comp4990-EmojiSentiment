function appendData(data){
    var searchInput = $('#searchInput').val();
    $('#AvgSentiment2').append(`<p>Sentiment: ${data.emojiReddit}, SearchTerm: ${searchInput} </p>`);
    $('#AvgSentiment').append(`<p>Sentiment: ${data.averageSentiemnentTwitter}, ${data.emojiTwitter}, SearchTerm: ${searchInput} </p>`);
    $('#AvgSentiment4').append(`<p>Sentiment: ${data.averageSentiemnentGithub}, ${data.emojiGithub}, SearchTerm: ${searchInput} </p>`);
}
function submitForm(){
    var searchInput = $('#searchInput').val();
    var startDate = $('#start').val();
    $.get('/search', {term:searchInput,startD:startDate}, appendData);
    return false;
}
$(function(){
    $('#searchButton').click(submitForm);
});
function appendCustomData(data){
    var customSentiment = $('#custom-Sentiment').val();
    $('#AvgSentiment3').append(`<p>Average Sentiment General Text: ${data.sentiment}, ${data.emoji}, SearchTerm: ${customSentiment} </p>`);
}


function appendTrendData(data){
    $('#trendBox').empty();
    for(let i = 0; i < data.length; i++){
        $('#trendBox').append(`<p> ${i + 1}: ${data[i].name} EmojiReddit: ${data[i].emojis.reddit} EmojiTwitter: ${data[i].emojis.twitter}(${data[i].sentiment.twitter})  EmojiGithub: ${data[i].emojis.github}(${data[i].sentiment.github})</p>`);
    }
}

//will get getTrendingTopics every hour
function getTrending(){
    $.get('/getTrendingTopics', appendTrendData);
    //call once on start
    setInterval(() =>
        $.get('/getTrendingTopics', appendTrendData) + console.log("Trending updated "),
        3600000
    );
};
getTrending();

$('#custom-Sentiment-Button').click(function(){
    var customSentiment = $('#custom-Sentiment').val();
    $.get('/customSentiment',{term:customSentiment},appendCustomData);
});