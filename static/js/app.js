var currentArticle;
var articleTemplate, bitListTemplate, articleListTemplate;

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
    return moment(d).format('MMMM D YYYY, h:mm:ss a');
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

    if ($('.article-content').hasClass('flipped')) {
      // If it's in edit mode. Flip into view mode.
      $('.article-content').toggleClass('flipped');
    }

    var bitList = bitListTemplate({bits: res.bits});
    $(".article-right").html($(bitList));
  });
}

// Show article list
function slideInArticleList() {
  $.get('/topics', function(res) {
    if (res.error) {
      return alert(res.error);
    }

    $('.article-list').html(articleListTemplate(res));
    $('.article-list a').bind('click', function() {
      var currentTopic = this.text;
      loadArticle(currentTopic);
    });
  });
  $('.article-right').velocity({width: "0px", opacity: 0});
  $('.article-list').velocity({width: "250px", opacity: 1}, {queue: false});
}

function slideOutArticleList() {
  $('.article-right').velocity({width: "250px", opacity: 1});
  $('.article-list').velocity({width: "0px", opacity: 0}, {queue: false});
}

function initTemplates() {
  articleTemplate = Handlebars.compile($('#article-template').html());
  bitListTemplate = Handlebars.compile($('#bit-list-template').html());
  articleListTemplate = Handlebars.compile($('#article-list-template').html());
}

$(document).ready(function() {
  stackBlurImage('blur-img', 'blur-canvas', 180, false);

  initTemplates();
  loadArticle('Random');

  // Edit article
  $('.article-content').on('click', '.article-view-toolbar-edit', function() {
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
    if (currentArticle == null) {
      // Save bit.
      var bitContent = $('#article-editor').val();
      $.post('/bit', {content: bitContent}, function(res) {
        var topics = res.topics;
        if (!topics || topics.length == 0) {
          loadArticle('Random'); // TODO: remove hard code 'Random'.
        } else {
          loadArticle(topics[0]); // TODO: needs improvement too.
          // Like we can highlight it on the right.
        }
      });
      // TODO: What if save error and no article is defined now.
    } else {
      // Save article
      currentArticle.content = $('#article-editor').val();
      $.post('/article/' + currentArticle.topic, {content: currentArticle.content}, function(res) {
        if (res['error']) {
          error(res['error']);
        } else {
          // TODO: maybe we can return the edited article and update it, saving another request time.
          loadArticle(currentArticle.topic);
          $('.article-content').toggleClass('flipped');
        }
      });   
    }

  });

  $('.article-cancel').bind('click', function() {
    $('.article-content').toggleClass('flipped');
  });

  $('.toolbar-list-doc a').bind('click', function() {
    if ($('.article-list').width() == 0) {
      slideInArticleList();
    } else {
      slideOutArticleList();
    }
  });

  $('.toolbar-add-bit a').bind('click', function() {
    currentArticle = null;
    $('.article-content').toggleClass('flipped');

    // $('.bit-topic').css({display: 'block'});
    $('.article-content-edit textarea').text('');
    $('.article-content-edit textarea').focus();
    /*
    var newEditor = $('.article-content-edit').clone();
    $('.article-content-view').velocity({top: '600px', opacity: 0}, {duration: 900, complete: function(e) {
      $(e).css({display: 'none'});
    }});
   */
  });

});