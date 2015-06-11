var currentArticle;
var articleTemplate, bitListTemplate;

var handleBarHelpers = {
  parseMarkdown: function(m) {
    return marked(m);
  },
  getMonth: function(d) {
    return moment(d).format("MMM");
  },
  getDay: function(d) {
    return moment(d).format("DD");
  },
  articleDate: function(d) {
    return moment(d).format('MMMM Do YYYY, h:mm:ss a');
  }
};

function error(msg) {
  alert(msg);
}

_.each(handleBarHelpers, function(handler, name) {
  Handlebars.registerHelper(name, handler);
});

function loadArticle(topic) {
  $.get('/topic/' + topic, function(res) {
    if (res.error) {
      return error(res.error);
    }
    currentArticle = res;

    var article = articleTemplate(res);
    $(".article-content-view").html(article);

    var bitList = bitListTemplate({bits: res.bits});
    $(".article-right").append($(bitList));
  });
}

$(document).ready(function() {
  stackBlurImage('blur-img', 'blur-canvas', 180, false);

  articleTemplate = Handlebars.compile($('#article-template').html());
  bitListTemplate = Handlebars.compile($('#bit-list-template').html());

  loadArticle('Random');

  // Create new article
  $('.toolbar-add-doc a').bind('click', function() {
    $('.article-content').toggleClass('flipped');

    var contents = _.map(currentArticle.bits, function(bit) {
      return bit.content;
    })
    // Double blank line means one line
    var joinedContent = contents.join('\n\n');
    $('.article-content-edit textarea').text(joinedContent);
  });

  // Save article
  $('.article-save').bind('click', function() {
    currentArticle.content = $('#article-editor').val();
    $.post('/article/Random', {content: currentArticle.content}, function(res) {
      if (res['error']) {
        error(res['error']);
      } else {
        // TODO: maybe we can return the edited article and update it, saving another request time.
        loadArticle(currentArticle.topic);
        $('.article-content').toggleClass('flipped');
      }
    })
  });

  $('.article-cancel').bind('click', function() {
    $('.article-content').toggleClass('flipped');
  })

});