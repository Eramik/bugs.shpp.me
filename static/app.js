(function($){
	// var apihost = 'http://bugs.shpp.me:3013/';
	var apihost = 'http://localhost:3013/';
	var apiArtwork = apihost + 'images';
	var artworkResponse = null;
	var artwork = null;

	var selection = [];
	var resultname;
	var minElsAmount = 3;

    $('#render-button').click(function(){
		render()
	});

	/* range slider button display */
    var range = $('.input-range'),
    value = $('.range-value');
    value.val(range.attr('value'));
    range.on('input', function(){
    	value.val(this.value);
        $('#sum').html(this.value);
    });
    value.on('input', function () {
    	if(this.value < 150) this.value = 150;
    	if(this.value > 15000) this.value = 15000;
		range.val(this.value);
        $('#sum').html(this.value);
    });

    $('#cancel').on('click', function () {
    	cancel();
    });

    function cancel() {
        $('#payment').css('display', 'none');
        $("#render-button").css("display", 'block');
    }

    function generateLiqpay(){
        var amount = value.val();
        $.ajax({
            url: apihost + "pay",
            method: "POST",
            data: {
                resultname: resultname,
                result_url: apihost + 'download?resultname=' + resultname,
                amount: amount
            }
        }).done(function (msg) {
            msg = JSON.parse(msg);
            $('#data').val(msg['DATA']);
            $('#signature').val(msg['SIGNATURE']);
            $('#payment').find('form').submit();
        })
	}

    $('#liqpay').on('click', function() {
    	generateLiqpay();
	});

   $('dialog').dialog({
        bgiframe: true,
        autoOpen: false,
        modal: true,
        open: function(){
            $('.ui-widget-overlay').bind('click',function(){
                $('dialog').dialog('close');
            })
        }
	});
    if(document.cookie.indexOf('notFirstTimeHere') === -1 ) {
        document.cookie = "notFirstTimeHere=true;Path=/;expires=Fri, 22 Aug 2022 00:00:00 GMT";
        $('dialog#about-us').dialog('open');
    }
	$('.ui-dialog-titlebar-close').html("<i class=\"fa fa-times\" aria-hidden=\"true\"></i>");

    $('.logo').on('click', function (e){
        var target = e.target.id;
        if(target === 'visalogo')
			$('dialog#visa').dialog('open');
        if(target === 'mclogo')
            $('dialog#mastercad').dialog('open');
    });


	function loadArtwork(callback) {
		busy(true);
		$.ajax({
			url: apiArtwork,
			success: callback,
			error: function(){
				console.warn(arguments)
			},
			compvare: function(){
				busy(false)
			}
		})
	}

	function busy(is) {
		if (!is) {
			$(".busy").hide();
			return
		}
		$(".busy").show()
	}

	function getImageByID(id) {
		for (var cat in artwork) {
			if (!artwork.hasOwnProperty(cat)) { continue }
			var category = artwork[cat];
			for (var img in category.images) {
				if (!category.images.hasOwnProperty(img)) { continue }
				var image = category.images[img];
				if (image.id === id) {
					return image
				}
			}
		}
		return null
	}

	function findSelected(onrender) {
		var ids = [];
		var special = true;
        var previewEl = $('#preview').empty();
		$('#options').find('input:checked').each(function(){
            var $this = $(this);
            var id = $this.val();
            var img = getImageByID(id);
            var marginTop = onrender ? 0 : -1000;
            if (img !== null) {
                ids.push(id);
                var mt = special ? 0 : -1000;
                previewEl.append(
                    $("<img>", {src: img.href})
                        .css({marginTop: marginTop})
                );
                special = false
            }
        });
        return ids;
    }

    function animatePart(img) {
        var $this = $(img);
        $this.animate({
            marginTop: 0
        }, 250*i);
        i++;
    }

	function updatePreview() {
		$("#render-button").prop("disabled", false);
		var previewEl = $('#preview').empty();
		selection = findSelected();
		i = 1;
		previewEl.find("img").each(function () {
            animatePart(this);
        });
		i = 0;
	}

	function shuffle() {
		var i = 0;
		for (var cat in artwork) {
			if (!artwork.hasOwnProperty(cat)) { continue }
			i++;
			var special = i <= minElsAmount;
			var category = artwork[cat];
			var rand = Math.round(Math.random()*(category.images.length-1));
            if (rand < 0 && special) {
				rand = 0
			}
			if (rand < 0) {
				// none
				$('input[name="'+category.name+'"]').prop('checked', false);
				continue	
			}
			var image = category.images[rand];
            $('input[value="'+image.id+'"]').prop('checked', true)
		}
		updatePreview()
	}

	function nicename(s) {
		return s.replace(/_/g, ' ')
	}

	function reset() {
		$("form#options").trigger("reset");
		selection = [];
		updatePreview()
	}

	function render() {
		$("#render-button").css("display", 'none');
		$('#payment').css('display', 'block');
		$('h4.panel-title a').click();
		 resultname = new Date().getTime();
		 selected = findSelected(true);
		$('#id').val(apihost + 'download/?resultname='+resultname);
		$.ajax({
			url: apihost + 'render',
			method: "POST",
			data: {
				selected: selected,
				resultname: resultname
			}
		});
	}


	$(function(){

		$('#shuffle-button').click(function(){
            shuffle()
		});
		$('#reset-button').click(function(){
			reset()
		});

		var optionsEl = $('#options');

		loadArtwork(function(result){
			artworkResponse = result;
			artwork = result.categories;
			$(".total_combinations").text(Humanize.intComma(artworkResponse.total_combinations));
			var i = 0;
			var special = true;
			for (var cat in artwork) {
				if (!artwork.hasOwnProperty(cat)) { continue }
				i++;
				special = i <= minElsAmount;
				var category = artwork[cat];
				var catID = category.name;
                var list_width = Math.max(category.images.length*75, 328);
                var list = $("<div style='width: "+list_width+"px'>");

				if (!special) {
					$("<label>", {class:'none item'}).append(
						$('<input>', {type:'radio', name:catID, value: "<none>", checked: (special ? 'checked' : null)}).change(updatePreview),
						$('<img>', {src: "static/whitebox.png", 'title':'Remove', 'data-toggle':'tooltip', 'data-placement':'bottom'}).tooltip()
					).appendTo(list)
				}

				var specialInCat = true;
				for (var img in category.images) {
					if (!category.images.hasOwnProperty(img)) { continue }
					var image = category.images[img];

					$("<label>", {class:'item'}).append(
						$('<input>', {type:'radio', name:catID, value:image.id, checked: (special && specialInCat ? 'checked' : null)}).change(updatePreview),
						$('<img>', {src: image.thumbnail_href, 'title':image.name, 'data-toggle':'tooltip', 'data-placement':'bottom'}).tooltip()
					).appendTo(list);
					specialInCat = false
				}
				
				var panel = $("<div>", {class:'panel panel-default'});
				panel.append(
					$("<div>", {
                        role:'button',
                        'class': 'panel-heading ' + (special ? '' : 'collapsed'),
                        'data-toggle': 'collapse',
                        'data-parent': '#options',
                        'href': '#'+catID,
                        'aria-expanded': (special ? 'true' : 'false'),
                        'aria-controls': catID
                    }).append(
						$("<h4>", {class:'panel-title'}).append(
						    $("<a>").html(
							    nicename(category.name) +
                                '<i class="fa fa-angle-down" aria-hidden="true"></i>'
                            ).tooltip()
						)
					)
				)
				panel.append(
					$("<div>", {id:catID, class:'panel-collapse collapse' + (special && i === 1 ? ' in' : ''), role:'tabpanel'}).append(
						$("<div>", {class:'panel-body'}).append(list)
					)
				);
				optionsEl.append(panel)
			}
			shuffle();
		})
	})
})(jQuery);
