(function($){
	var apihost = 'http://bugs.shpp.me:3013/';
	var apiArtwork = apihost + 'images';
	var artworkResponse = null;
	var artwork = null;

	var selection = [];
	var resultname;
	var minElsAmount = 3;

	function absurl() {
		return apihost+'render.png?dl=0&images=' + encodeURIComponent(selection.join('|'))
	}

	$('#download-button').click(function(){
		var $this = $(this);
		$this.attr("disabled", "disabled");
		location.href = '/api/render.png?images=' + encodeURIComponent(selection.join('|'))
	});

	$('#share-button').click(function(){
		var $this = $(this);
		var absURL = absurl();
		var text = "I just Gopherized myself on https://gopherize.me via @ashleymcnamara and @matryer";
		var shareURL = 'https://twitter.com/share?url='+encodeURIComponent(absURL)+'&text='+encodeURIComponent(text)+'&hashtags=golang,gopherize'
		window.open(shareURL)
	});

	$('#buy-button').click(function(){
		buy()
	});

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
		$('#payment').css('display', 'none');
        $("#render-button").css("display", 'block');
    });

    $('#liqpay').on('click', function() {
    	var amount = 10; //value.val();
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
    $('dialog#about-us').dialog('open');


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

	function findSelected() {
		var ids = [];
		var special = true;
        var previewEl = $('#preview').empty();
		$('#options').find('input:checked').each(function(){
            var $this = $(this);
            var id = $this.val();
            var img = getImageByID(id);
            if (img !== null) {
                ids.push(id);
                var mt = special ? 0 : -1000;
                previewEl.append(
                    $("<img>", {src: img.href}).css({
                        marginTop: -1000
                    })
                );
                special = false
            }
        });
        return ids;
    }

	function updatePreview() {
		$("#render-button").prop("disabled", false);
		var previewEl = $('#preview').empty();
		selection = findSelected();
        var i = 1;
		previewEl.find("img").each(function(){
			var $this = $(this);
			$this.animate({
				marginTop: 0
			}, 250*i);
			i++
		})
	}

	function shuffle() {
		var i = 0;
		for (var cat in artwork) {
			if (!artwork.hasOwnProperty(cat)) { continue }
			i++;
			var special = i <= minElsAmount;
			var category = artwork[cat];
			var rand = Math.round(Math.random()*(category.images.length));
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
		 selected = findSelected();
		$('#id').val(apihost + 'download/?resultname='+resultname);
		$.ajax({
			url: apihost + 'render',
			method: "POST",
			data: {
				selected: selected,
				resultname: resultname
			}
		});
		updatePreview();
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
			$(".total_combinations").text(Humanize.intComma(artworkResponse.total_combinations) + " possible combinations");
			var i = 0;
			var special = true;
			for (var cat in artwork) {
				if (!artwork.hasOwnProperty(cat)) { continue }
				i++;
				special = i <= minElsAmount;
				var category = artwork[cat];
				var catID = category.name;
				var list = $("<div>");
				
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
					$("<div>", {class:'panel-heading', role:'tab'}).append(
						$("<h4>", {class:'panel-title'}).append(
							$("<a>", {
								'class': (special ? '' : 'collapsed'),
								'role': 'button',
								'data-toggle': 'collapse',
								'data-parent': '#options',
								'href': '#'+catID,
								'aria-expanded': (special ? 'true' : 'false'),
								'aria-controls': catID
							}).text(nicename(category.name)).tooltip()
						)
					)
				);
				panel.append(
					$("<div>", {id:catID, class:'panel-collapse collapse' + (special ? ' in' : ''), role:'tabpanel'}).append(
						$("<div>", {class:'panel-body'}).append(list)
					)
				);
				optionsEl.append(panel)
			}
			updatePreview()
		})
	})
})(jQuery);
