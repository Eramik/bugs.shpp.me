(function ($) {
    var range = $('input[type=range]');
    var value = $('input[type=range] + input[type=number]');
    var rangeBlock = $('#rangeBlock');
    var amount = $('input[name=amount]');
    var regularity = $('#regular');
    var buyButton = $('#buy-button');
    var downloadButton = $('#down-button');
    var defaultValue = 500;
    var apihost = window.apihost;

    amount.on('change', function (e) {
        rangeBlock.css('display', e.target.value === "other" ? 'block' : 'none');
        if(!isNaN(e.target.value))
            setMoneyAmount(+e.target.value);
        else
            setMoneyAmount(range.val() || defaultValue);
    });

    function setMoneyAmount(amount) {
        value.val(amount);
        $('#sum').html(amount);
    }

    regularity.click(function (e) {
        e.preventDefault();
        var texts = [ 'вернуться в режим разовой покупки', 'режим ежемесячной подписки' ];
        var buttonTexts = ['1) Подписаться', '1) Купить'];
        var mode = (texts.indexOf(regularity.text()) + 1) % texts.length;
        regularity.text(texts[mode]);
        buyButton.text(buttonTexts[mode])
    })

    buyButton.on('click', function (e) {
        $('#payment').css('display', 'block');
    });

    value.val(range.attr('value'));

    range.on('change', function () {
        console.log(this.value);
        setMoneyAmount(this.value);
    });

    value.on('change', function (e) {
        $('#sum').html(this.value);
    });

    value.on('blur', function () {
        if (this.value < 150) this.value = 150;
        if (this.value > 15000) this.value = 15000;
        range.val(this.value);
        setMoneyAmount(this.value);
    });

    function generateLiqpay() {
        var amount = value.val();
        $.ajax({
            url: apihost + "pay",
            method: "POST",
            data: {
                amount,
                resultname: window.resultname
            }
        }).done(function (msg) {
            msg = JSON.parse(msg);
            $('#data').val(msg['DATA']);
            $('#signature').val(msg['SIGNATURE']);
            $('#payment').find('form').submit();
        })
    }

    $('#liqpay').on('click', generateLiqpay);



})(jQuery)