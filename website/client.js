function checkData(){
    const cookieData1 = Cookies.get('sentDataReddit');
    const cookieData2 = Cookies.get('sentDataTwitter');
    const cookieData3 = Cookies.get('sentDataGithub');
    if(cookieData1 && cookieData2 && cookieData3){
        $('#AvgSentiment2').html(cookieData1);
        $('#AvgSentiment').html(cookieData2);
        $('#AvgSentiment4').html(cookieData3);
        return;
    }
}
checkData();

function appendData(data){
    cookieDataReddit = '';
    cookieDataTwitter = '';
    cookieDataGithub = '';
    var searchInput = $('#searchInput').val();
    $('#AvgSentiment2').append(`<p>Sentiment: ${data.emojiReddit}, SearchTerm: ${searchInput} </p>`);
    $('#AvgSentiment').append(`<p>Sentiment: ${data.averageSentiemnentTwitter}, ${data.emojiTwitter}, SearchTerm: ${searchInput} </p>`);
    $('#AvgSentiment4').append(`<p>Sentiment: ${data.averageSentiemnentGithub}, ${data.emojiGithub}, SearchTerm: ${searchInput} </p>`);
    cookieDataReddit += `<p>Sentiment: ${data.emojiReddit}, SearchTerm: ${searchInput} </p>`;
    cookieDataTwitter += `<p>Sentiment: ${data.averageSentiemnentTwitter}, ${data.emojiTwitter}, SearchTerm: ${searchInput} </p>`;
    cookieDataGithub += `<p>Sentiment: ${data.averageSentiemnentGithub}, ${data.emojiGithub}, SearchTerm: ${searchInput} </p>`;
    Cookies.set('sentDataReddit', cookieDataReddit);
    Cookies.set('sentDataTwitter', cookieDataTwitter);
    Cookies.set('sentDataGithub', cookieDataGithub);
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

$('#custom-Sentiment-Button').click(function(){
    var customSentiment = $('#custom-Sentiment').val();
    $.get('/customSentiment',{term:customSentiment},appendCustomData);
});