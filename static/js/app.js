Handlebars.registerHelper('parseMarkdown', function(m) {
  return marked(m);
});

$(document).ready(function() {
  stackBlurImage('blur-img', 'blur-canvas', 180, false);

  var articleTemplate = Handlebars.compile($('#article-template').html());
  var bitListTemplate = Handlebars.compile($('#bit-list-template').html());

  $.get('/topic/Random', function(res) {
    var article = articleTemplate(res);
    $(".article-content").html(article);

    var bitList = bitListTemplate({bits: res.bits});
    $(".article-right").html(bitList);
  });
});