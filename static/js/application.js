// Some general UI pack related JS

// I don't know what this is.
$(function () {
  // Custom selects
  $("select").dropkick();
});


function customInit() {
  $('#save-btn').on('click', function() {
    // Show working
    /*
    $('#save-btn').css({
      'background-image':  'url(/img/loading.gif)',
      'background-repeat': 'no-repeat',
      'background-position': 'center'
    });
    */
    $(
      '<div class="row bit-entry processing">' +
      '<div class="span3 timeline-column">' +
      '<div class="span timeline-hour"></div>' +
      '</div>' +
      '<div class="span5"><div class="message-box"></div></div>' + 
      '</div>'
    ).insertAfter('.bit-entry:first');
    $('.processing').show('slow');

    $.post(
      '/bit', 
      { content: $('#content-txt').val() }, 
      function(data) {
        $('.processing .timeline-hour').html(data.date);
        $('.processing .message-box').html(data.content);
        $('.processing').removeClass('processing');
        $('#content-txt').val('');
      }
    );
  });
}

$(document).ready(function() {
    // Init tooltips
    $("[data-toggle=tooltip]").tooltip("show");

    // Init tags input
    $("#tagsinput").tagsInput();

    // Init jQuery UI slider
    $("#slider").slider({
        min: 1,
        max: 5,
        value: 2,
        orientation: "horizontal",
        range: "min",
    });

    // JS input/textarea placeholder
    $("input, textarea").placeholder();

    // Make pagination demo work
    $(".pagination a").click(function() {
        if (!$(this).parent().hasClass("previous") && !$(this).parent().hasClass("next")) {
            $(this).parent().siblings("li").removeClass("active");
            $(this).parent().addClass("active");
        }
    });

    $(".btn-group a").click(function() {
        $(this).siblings().removeClass("active");
        $(this).addClass("active");
    });

    // Disable link click not scroll top
    $("a[href='#']").click(function() {
        return false
    });

    customInit();

    //
    $("#uploader-form").onsubmit = function(evt) {
      evt.preventDefault();
    };

    $("#fileupload").fileupload({
      done: function(e, data) {
        
      },
      progress: function(e, data) {
        var progress = parseInt(data.progress().loaded / data.progress().total * 100, 10);
        data.context.children('.upload-progress')
          .css('width', progress + '%');
      },
      add: function(e, data) {
        data.context = $('<div class="upload-status"><div class="upload-progress"></div></div>')
          .appendTo($('.new-bit-box'));
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
        if (groupname == gLastGroupName) {
          return 0
        } else {
          gLastGroupName = groupname;
        }

        var groupTmpl = _.template(
            '<div class="row bit-entry-date-header">' +
             '<div class="span3 timeline-column">' +
              '<div class="outercircle-date">' +
               '<div class="innercircle-date">' +
                '<span class="day"><%=day%></span>' +
                '<span class="month"><%=month%></span>' +
               '</div>'+
              '</div>'+
             '</div>' +
            '</div>');

        var groupNode = $(groupTmpl({day: groupname.split("|")[0], month: groupname.split("|")[1]}));
        groupNode.appendTo('.sidebar');

        _.each(bits, function(bit) {
         var bitTmpl = _.template(
          '<div class="row bit-entry">' +
            '<div class="span3 timeline-column">' +
              '<div class="span timeline-hour">06:47 am</div>' +
            '</div>' +
            '<div id="<%=bit._id%>" class="span5">' +
              '<div class="message-box">' +
                '<div class="message-box-content">' +
                  '<%=bit.content%>' +
                '</div>' +
                '<div class="bit-entry-toolbar">' +
                  '<div class="btn-toolbar bit-entry-controls">' +
                    '<div class="bit-entry-toolbar-btn-group btn-group">' +
                      '<a href="/edit/<%=bit._id%>" class="btn btn-primary bit-entry-toolbar-btn">' +
                        '<span class="fui-new-16"></span>' +
                      '</a>' +
                      '<a href="/view/<%=bit._id%>" class="btn btn-primary bit-entry-toolbar-btn">' +
                        '<span class="fui-eye-16"></span></a>' +
                      '<a href="/delete/<%=bit._id%>" class="btn btn-primary bit-entry-toolbar-btn">' +
                        '<span class="fui-cross-16"></span>' +
                      '</a>' +
                    '</div>' +
                  '</div>' +
                  '<div class="bit-entry-topics tagsinput"></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>');
          $(bitTmpl({bit: bit})).appendTo('.sidebar');
        });
    });
    }

    // Infinite scroll
    var gBitOffset = 0;
    var gBitLimit = 10;
    var gLastGroupName = '';
    $(window).scroll(function() {
      // Scrolled to end
      if ($(window).scrollTop() == $(document).height() - $(window).height()) {
          $.ajax('/bit/'+gBitOffset+'/'+gBitLimit)
              .done(function(data) { updateBits(data); gBitOffset += gBitLimit; })
              .fail(function(error) { alert("Load bit failed: " + error); })
      }
    });
});

