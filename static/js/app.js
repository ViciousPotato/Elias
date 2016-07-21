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

function clearSides() {
  if ($('.article-list').width() > 0) {
    d3.select('.article-list').transition().style("width", "0px").style("opacity", 0);
  }

  if ($('.article-right').width() > 0) {
    d3.select('.article-right').transition().style("width", "0px").style('opacity', 0);
  }
}

function loadArticle(id) {
  $.get('/article/' + id, function(res) {
    if (res.error) {
      return error(res.error);
    }

    // slideOut(".article-list");
    fadeOutChildren(".article-content", function() {
      $('.article-content').html(articleTemplate(res.article));
      $('.article-content .article-view-toolbar-edit').on('click', function() {
        editArticle(res.article);
      });

    /*
      var article = articleTemplate(res);
      $(".article-content-view").html(article);

      if ($('.article-content').hasClass('flipped')) {
        // If it's in edit mode. Flip into view mode.
        $('.article-content').toggleClass('flipped');
      }

      var bitList = bitListTemplate({bits: res.bits});
      $(".article-right").html($(bitList));
      */
    });
  });
}

function dragBit(evt) {
  evt.dataTransfer.setData("text", evt.target.innerHTML);
}

function allowDrop(evt) { evt.preventDefault(); }

function dropToEditor(evt) {
  evt.preventDefault();
  var data = evt.dataTransfer.getData("text");
  debugger;
}

function listArticles() {
  $.get('/article/metas', function(res) {
    if (res.error) { return error(res.error.message); }

    $('.article-list').html(articleListTemplate({
      metas: res.metas}));

    d3.select(".article-list")
      .transition()
      .duration(200)
      .style("width", "200px")
      .style("opacity", 1);

    d3.select(".article-right")
      .transition()
      .duration(200)
      .style("width", "275px")
      .style("opacity", 1);

  });

  $.get('/article/latest', function(res) {
    if (res.error) { return error(res.error.message); }

    // Show article
    // TODO: and related bits
    // TODO: if no content, show create guide.
    if (res.article) {
      loadArticle(res.article._id);
    } else {
      $('.article-content').html('');
    }
  });
}

function showArticle(id) {
  $.get('/article/'+id, function(data) {
    
  });
}

function craftArticle() {
  slideOut(".article-list");
  $(".article-content").html(articleEditorTemplate());
  $(".article-content .article-save").on("click", function() {
    // TODO: disable editor while saving
    $.post('/article', {title: $("#editor-bit-topic").val(), content: $(".article-editor").val()}, function(res) {
      if (res.error) {
        return error(error);
      }
      redirect("#articles");
    });
  });
  // Crafting article means new, so load all bits at right for selection.
  $.get('/bits', function(res) {
    if (res.error) {
      return error(res.error);
    }
    // Fill the right
    $('.article-right').html(bitListTemplate({bits: res.bits}));
  });
}

function editArticle(article) {
  $(".article-content").html(articleEditorTemplate({article: article}));
  $(".article-content .article-save").on("click", function() {
    // TODO: disable editor while saving
    $.post('/article/'+article._id
          , {title: $("#editor-bit-topic").val(), content: $(".article-editor").val()}
          , function(res) {
          if (res.error) {
            return error(error);
          }
          redirect("#articles");
        });
  });
}

function slideOutArticleList() {
  $('.article-right').velocity({width: "275px", opacity: 1});
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
  clearSides();
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
        var displayDate = 
            (d.lastModified == d.date)
          ? "Created " + moment(d.date).fromNow()
          : "Updated " + moment(d.lastModified).fromNow();

        return bitTemplate({
          content: d.content,
          date: displayDate,
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
        var bit = d3.select(parent).datum();
        editBit(bit);
      });

    $("div.bit-content").dotdotdot();
  });

  if ($('.article-right').width() > 0) {
    $('.article-right').velocity({width: "0px", opacity: 0});
  }
}

// Save bit. 
// @id: null -> create new bit.
//      val  -> update existing bit.
function saveBit(id) {
  var bitContent = $('.bit-editor').val();
  id = id || null;
  $.post('/bit', {content: bitContent, id: id}, function(res) {
    if (res.error) {
      return error(res.error.message);
    }
    redirect('bits');
  });
}

function slideOut(sel) {
  d3.select(sel).transition().duration(150).style("width", "0px").style("opacity", 0);
}

function fadeOutChildren(parentSelector, callback) {
  var parent = $(parentSelector);
  var removeClassName = "removing" + Math.random().toString().replace(".", "");

  // Assign unique class names to children for d3 to remove.
  parent.children().each(function(i, c) { $(c).addClass(removeClassName) });
  // Then perform the animation
  d3.selectAll("." + removeClassName)
    .transition()
    .delay(function(d, i) { return Math.random() * 50; })
    .duration(Math.random() * 200)
    .on("end", function(current, index, all) {
      if (index == all.length-1) {
        // Only start to remove things when animations are done.
        // Or it will cause flickering animation.
        // parent.empty();
        parent.html('');
        callback && callback();
      }

    })
    .style("opacity", 0);
}

function fadeOutBitFadeInEditor(editorTmpl, handlers) {
  var parent = $('.article-content');
  var fadeInEditor = function() {
    // Append DOM element
    var editor = $(editorTmpl);
    parent.append(editor);

    // Register event listeners to editor
    // Last anonymous fun is to clean jquery parameters.
    $(".bit-save a").bind("click", handlers && handlers.save || function() { saveBit(); });

    // Fade in editor, .article-content-edit is appened by editorTmpl
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
    parent.empty();
    fadeInEditor();
  }
  else {
    // Or else we have content, fade them out and then fade in editor.
    d3.selectAll(".bit")
      .transition()
      .delay(function(d, i) { return Math.random() * i * 50; })
      .duration(Math.random() * 200)
      .on("end", function(current, index, all) {
        if (index == all.length-1) {
          // Only start to remove things when animations are done.
          // Or it will cause flickering animation.
          parent.empty();
          fadeInEditor();
        }

      })
      .style("opacity", 0);
  }
}

function addBit() {
  clearSides();
  // Fade out current view, fade in editor
  var editorTmpl = bitEditorTemplate();
  fadeOutBitFadeInEditor(editorTmpl);
}

function editBit(bit) {
  var editorTmpl = bitEditorTemplate({bit: bit});
  fadeOutBitFadeInEditor(editorTmpl, {save: function() {
    saveBit(bit._id);
  }});
}

$(document).ready(function() {
  initTemplates();
  blurBackground();

  var router = Router({
    '/newbit'  : addBit,
    //'/'        : listBits,
    '/bits'    : listBits,
    '/articles': listArticles,
    /*
    '/editbit' : {
      '/:id': {
        on: function(id) { editBit(id);  }
      }
    }
    */
  });
  router.init('/bits');

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

  /*
  $('.article-cancel').bind('click', function() {
    $('.article-content').toggleClass('flipped');
  });

  $('.toolbar-list-doc a').bind('click', function() {
    if ($('.article-list').width() == 0) {
      // slideInArticleList();
      listArticles();
      fadeOutChildren(".article-content");
    } else {
      slideOutArticleList();
    }
  });
  */

  // $('.toolbar-list-bit').bind('click', listBits);
  // listBits();
});
