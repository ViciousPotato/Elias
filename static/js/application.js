// Some general UI pack related JS

// I don't know what this is.
$(function () {
  // Custom selects
  $("select").dropkick();
});

$(document).ready(function() {
  var gBitTmpl = Handlebars.compile($('#bit-template').html());

  // Init tooltips
  $("[data-toggle=tooltip]").tooltip("show");

  // Init tags input
  $("#tagsinput").tagsInput();

  // JS input/textarea placeholder
  $("input, textarea").placeholder();


  $(".btn-group a").click(function() {
      $(this).siblings().removeClass("active");
      $(this).addClass("active");
  });

  // Disable link click not scroll top
  $("a[href='#']").click(function() {
      return false
  });

  $('#save-btn').on('click', function() {
    // Show working
    var processingNode = $(gBitTmpl({date: new Date(), content: ''}));
    processingNode.addClass('processing');
    processingNode.insertAfter('.bit-entry:first');
    $('.processing').show('slow');

    $.post(
      '/bit',
      { content: $('#content-txt').val() },
      function(data) {
        processingNode.replaceWith(gBitTmpl(data));
        $('#content-txt').val('');
      }
    );
  });

  Handlebars.registerHelper('formatBitTime', function(time) {
    return moment(time).format("HH:mm a");
  });

  //
  $("#uploader-form").onsubmit = function(evt) {
    evt.preventDefault();
  };

  $("#fileupload").fileupload({
    progress: function(e, data) {
      var progress = parseInt(data.progress().loaded / data.progress().total * 100, 10);
      data.context.find('.upload-progress')
        .css('width', progress + '%');
    },
    add: function(e, data) {
      var fileName = data.files[0].name;
      var uploadTmpl = Handlebars.compile($('#upload-file-template').html());
      data.context = $(uploadTmpl({file: fileName}))
        .insertAfter($('.new-bit-box'));
      data.submit();
    },
    done: function(e, data) {
      var baseUrl = location.href;
      var uploadUrl = baseUrl + data.result.url;
      var fileName = data.files[0].name;
      var mdTxt = '[' + fileName + '](' + uploadUrl + ')';
      $('#content-txt').append(mdTxt)
      // console.log('done');
    }
  });

  function updateBits(data) {
    _.each(data.bits, function(bits, groupname) {
      if (groupname != gLastGroupName) {
        gLastGroupName = groupname;
        // TODO: move template compile to app init.
        var groupTmpl = Handlebars.compile($('#group-template').html());
        var namePair = groupname.split("|");
        var groupNode = $(groupTmpl({day: namePair[0], month: namePair[1]}));
        groupNode.appendTo('.sidebar');
      }

      var bitTmpl = Handlebars.compile($('#bit-template').html());
      _.each(bits, function(bit) {
        $(bitTmpl(bit)).appendTo('.sidebar');
      });
    });
  };

  function loadBits() {
    var loading = $('<div class="bit-loading"></div>');
    loading.insertAfter('body');
    $.ajax('/bit/' + gBitOffset + '/' + gBitLimit)
      .done(function (data) {
        updateBits(data);
        gBitOffset += gBitLimit;
      })
      .fail(function (error) {
        alert("Load bit failed: " + error);
      })
      .always(function () {
        loading.remove();
      });
  }

  // Infinite scroll
  var gBitOffset = 0;
  var gBitLimit = 10;
  var gLastGroupName = '';
  $(window).scroll(function() {
    // Scrolled to end
    if ($(window).scrollTop() == $(document).height() - $(window).height()) {
      loadBits();
    }
  });

  loadBits();
});

