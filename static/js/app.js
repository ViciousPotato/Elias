var currentArticle;

// === Templates ===
var articleTemplate
  , bitListTemplate
  , articleListTemplate
  , bitTemplate
  , articleEditorTemplate
  , bitEditorTemplate;

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

_.each(handleBarHelpers, function(handler, name) {
  Handlebars.registerHelper(name, handler);
});

function initTemplates() {
  articleTemplate       = Handlebars.compile($('#article-template').html());
  bitListTemplate       = Handlebars.compile($('#bit-list-template').html());
  articleListTemplate   = Handlebars.compile($('#article-list-template').html());
  bitTemplate           = Handlebars.compile($('#bit-template').html());
  articleEditorTemplate = Handlebars.compile($('#article-editor-template').html());
  bitEditorTemplate     = Handlebars.compile($('#bit-editor-template').html());
}

function error(msg) {
  // TODO: Better error handling.
  alert(msg);
}

function redirect(url) {
  location.hash = url;
}

function loadArticle(title) {
  $.get('/article/' + title, function(res) {
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

function blurBackground() {
  $('#blur-img').on('load', function() {
    stackBlurImage('blur-img', 'blur-canvas', 180, false);
  });
  $('#blur-img').attr('src', '/img/blur-bg.jpg');
}

function listBits() {
  // Load bits and put them into .article-content
  $.get('/bits', function(data) {
    // Create bits in DOM
    d3.select(".article-content")
      .html("")
      .selectAll("div")
      .data(data.bits)
      .enter()
      .append("div")
      .attr("class", "bit")
      .html(function(d) {
        return bitTemplate({
          content: d.content,
          date: moment(d.date).fromNow(),
          id: d._id
        });
      });

    // Attach event listeners.
    //   - 'Delete' event listener
    d3.selectAll(".article-content .bit-toolbar-delete")
      .on("click", function() {
        var parent = $(this).parents('.bit')[0];
        var id = d3.select(parent).datum()['_id'];
        $.get('/bit/delete/' + id, function(data) {
          if (data.error) {
            return error(data.error);
          }

          d3.select(parent).transition().on("end", function() {
            d3.select(this).remove();
          })
          .style("opacity", 0);
        });
      });

    d3.selectAll(".article-content .bit-toolbar-edit")
      .on("click", function() {
        var parent = $(this).parents('.bit')[0];
        var id = d3.select(parent).datum()['_id'];
        editBit(id);
      });

    $("div.bit-content").dotdotdot();
  });

  if ($('.article-right').width() > 0) {
    $('.article-right').velocity({width: "0px", opacity: 0});
  }
}

function saveBit() {
  // Save bit. Bit mode.
  var bitContent = $('.bit-editor').val();
  var bitTopic = ''; // By default bit should have no topic
  $.post('/bit', {content: bitContent, topic: bitTopic}, function(res) {

  });
  // TODO: What if save error and no article is defined now.  
}

// Append inElems to parent, and fadeout parent's existing elems.
function fadeOutBitFadeInEditor(parent, editorTmpl) {
  var fadeInEditor = function() {
    // Append DOM element
    var editor = $(editorTmpl);
    parent.append(editor);

    // Register event listeners to editor
    $(".bit-save a").bind("click", saveBit);

    // Fade in
    d3.select(".article-content-edit")
      .transition()
      .duration(200)
      .on("start", function() {
        d3.select(this).style("opacity", 0).style("top", "200px");
      })
      .style("opacity", 1)
      .style("top", "0px");
  };

  var fadeOutBitList = function() {
    // Don't remove
    d3.select(".article-right")
      .transition()
      .duration(200)
      .style("width", "0px");
  };

  fadeOutBitList();

  var bits = d3.selectAll(".article-content .bit");
  // If there are no content, just fade in editor.
  if (bits.empty()) {
    fadeInEditor();
  }
  else {
    // Or else we have content, fade them out and then fade in editor.
    d3.selectAll(".bit")
      .transition()
      .delay(function(d, i) { return i * 50; })
      .duration(200)
      .on("end", function(current, index, all) {
        if (index == all.length-1) {
          // Only start to remove things when animations are done.
          // Or it will cause flickering animation.
          parent.empty();
          fadeInEditor();
        }

      })
      .style("top", function() {
        return (parseInt(d3.select(this).style("top")) - 200) + "px";
      })
      .style("opacity", 0);
  }
}

function addBit() {
  currentArticle = null;
  // Fade out current view, fade in editor
  var editorTmpl = bitEditorTemplate();
  fadeOutBitFadeInEditor($('.article-content'), editorTmpl);
}

function editBit(id) {
  $.get('/bit/get/'+id, function(data) {
    if (data.error) {
      return error(data.error);
    }
    var editorTmpl = bitEditorTemplate({
      bit: data.bit
    });
    fadeOutBitFadeInEditor($('.article-content'), editorTmpl);
  });
}

$(document).ready(function() {
  initTemplates();
  blurBackground();

  var router = Router({
    '/newbit'  : addBit,
    '/'        : listBits,
    '/editbit' : {
      '/:id': {
        on: function(id) { editBit(id);  }
      }
    }
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

  $('.toolbar-list-bit').bind('click', listBits);
  listBits();
});
