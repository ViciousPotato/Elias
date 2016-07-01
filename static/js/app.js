var currentArticle;

// templates
var articleTemplate
  , bitListTemplate
  , articleListTemplate
  , bitTemplate
  , articleEditorTemplate;

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
  $.get('/article/' + topic, function(res) {
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
      slideOutArticleList();
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
  bitTemplate = Handlebars.compile($('#bit-template').html())
  articleEditorTemplate = Handlebars.compile($('#article-editor-template').html());
}

function blurBackground() {
  $('#blur-img').on('load', function() {
    stackBlurImage('blur-img', 'blur-canvas', 180, false);
  });
  $('#blur-img').attr('src', '/img/blur-bg.jpg');
}

function listBits() {
  // Load bits and put them into .article-content
  $.get('/bits', function(data) {
    d3.select(".article-content")
      .html("")
      .selectAll("div")
      .data(data.bits)
      .enter()
      .append("div")
      .attr("class", "bit")
      .html(function(d) {
        return bitTemplate(
          {
            content: d.content,
            date: moment(d.date).fromNow()
          }
        )
       });

    $("div.bit-content").dotdotdot();
  });

  if ($('.article-right').width() > 0) {
    $('.article-right').velocity({width: "0px", opacity: 0});
  }
}

// Append inElems to parent, and fadeout parent's existing elems.
function fadeInOut(parent, inElems) {
  var children = parent.children();

  parent.append(inElems);

  children.velocity({'margin-top': '-500px', opacity: 0}, function() {
    this.forEach(function(d) {
      d.remove();
    });
  })
}

function addBit() {
  currentArticle = null;
  // Fade out current view, fade in editor
  var editor = articleEditorTemplate();
  fadeInOut($('.article-content'), editor);

  // $('.bit-topic').css({display: 'block'});
  // $('.article-content-edit textarea').text('');
  // $('.article-content-edit textarea').focus();
  /*
  var newEditor = $('.article-content-edit').clone();
  $('.article-content-view').velocity({top: '600px', opacity: 0}, {duration: 900, complete: function(e) {
    $(e).css({display: 'none'});
  }});
 */
}

$(document).ready(function() {
  initTemplates();
  blurBackground();
  // loadArticle('Random');

  var router = Router({
    '/newbit': addBit,
    '/': listBits
  });
  router.init();

  // Edit article
  $('.article-content').on('click', '.article-view-toolbar-edit', function() {
    $('.article-content').toggleClass('flipped');

    var editContent = "";
    if (currentArticle.content) {
      // For article with content, we use content directly.
      editContent = currentArticle.content;
    } else {
      var contents = _.map(currentArticle.bits, function(bit) {
        return bit.content;
      })
      // Double blank line means one line
      editContent = contents.join('\n\n');
    }
    $('.article-content-edit textarea').text(editContent);
    $('.article-content-edit #editor-bit-topic').val(currentArticle.topic);
  });

  // Save article
  $('.article-save').bind('click', function() {
    if (currentArticle == null) {
      // Save bit. Bit mode.
      var bitContent = $('#article-editor').val();
      var bitTopic = $('#editor-bit-topic').val();
      $.post('/bit', {content: bitContent, topic: bitTopic}, function(res) {
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
      // currentArticle.content = $('#article-editor').val();
      var updateData = {}
      var topic = $('#editor-bit-topic').val();

      updateData.content =  $('#article-editor').val();
      updateData.topic = topic;

      // topic not changed.
      if (topic != currentArticle.topic) {
        updateData.topic = topic;
        updateData.oldTopic = currentArticle.topic;
      }

      $.post('/article/' + currentArticle._id, updateData, function(res) {
        if (res['error']) {
          error(res['error']);
        } else {
          // TODO: maybe we can return the edited article and update it, saving another request time.
          loadArticle(topic);
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

  // $('.toolbar-add-bit a').bind('click', function() {
    // currentArticle = null;
    // Fade out current view, fade in editor
    // var editor = articleEditorTemplate();
    // fadeInOut($('.article-content'), editor);

    // $('.bit-topic').css({display: 'block'});
    // $('.article-content-edit textarea').text('');
    // $('.article-content-edit textarea').focus();
    /*
    var newEditor = $('.article-content-edit').clone();
    $('.article-content-view').velocity({top: '600px', opacity: 0}, {duration: 900, complete: function(e) {
      $(e).css({display: 'none'});
    }});
   */
  // });

  $('.toolbar-list-bit').bind('click', listBits);
});
