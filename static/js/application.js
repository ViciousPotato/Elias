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
		$.post(
			'/bit', 
			{ title: "title", content: $('#content-txt').val() }, 
			function(data) {
				/*$('#save-btn').css({
          'background-image': 'none'
        });*/
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
});

