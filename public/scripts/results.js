$(document).ready(function () {
    var apihost = 'http://localhost:3013/';

    $('#download-result').on('click', function () {
        var email = $('input[type="email"]').val();
        if(email) {
            var rememberme = $('#rememberme').is(':checked');
            var result_url = $('#result_url').val();
            saveMail(email, rememberme, result_url);
        }
    });

    function saveMail(email, remember, result_url) {
        $.ajax({
            url: apihost + 'remember',
            method: 'post',
            data: {
                email: email,
                remember: remember,
                result_url: result_url
            }
        }).done(function () {
            $('input[type="email"]').val('');
            $('#remember-me').hide();
        })
    }
    $('form').on('submit', function (e) {
        e.preventDefault();
    })
})