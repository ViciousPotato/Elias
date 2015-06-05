var currentArticle;

var handleBarHelpers = {
  parseMarkdown: function(m) {
    return marked(m);
  },
  getMonth: function(d) {
    return moment(this.date).format("MMM");
  },
  getDay: function(d) {
    return moment(this.date).format("DD");
  }
};

_.each(handleBarHelpers, function(handler, name) {
  Handlebars.registerHelper(name, handler);
});

$(document).ready(function() {
  stackBlurImage('blur-img', 'blur-canvas', 180, false);

  var articleTemplate = Handlebars.compile($('#article-template').html());
  var bitListTemplate = Handlebars.compile($('#bit-list-template').html());

  $.get('/topic/Random', function(res) {
    // TODO: add error handling.
    currentArticle = res;

    var article = articleTemplate(res);
    $(".article-content-view").html(article);

    var bitList = bitListTemplate({bits: res.bits});
    $(".article-right").append($(bitList));
  });

  $('.toolbar-add-doc a').bind('click', function() {
    $('.article-content').toggleClass('flipped');

    var contents = _.map(currentArticle.bits, function(bit) {
      return bit.content;
    })
    var joinedContent = contents.join('\n');
    $('.article-content-edit textarea').text(joinedContent);
  });
});