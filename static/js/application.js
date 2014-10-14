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

    Handlebars.registerHelper('formatBitTime', function(time) {
      return moment(time).format("HH:mm a");
    });

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
        if (groupname != gLastGroupName) {
          gLastGroupName = groupname;
          // TODO: move template compile to app init.
          var groupTmpl = Handlebars.compile($('#group-template').html());
          var namePair = groupname.split("|");
          var groupNode = $(groupTmpl({day: namePair[0], month: namePair[1]}));
          groupNode.appendTo('.sidebar');
        }

        var bitsTmpl = Handlebars.compile($('#bits-template').html());
        var bitsNode = $(bitsTmpl({bits: bits}));
        bitsNode.appendTo('.sidebar');
      });
    };

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

