var fc = fc || {};

$(document).ready(function() {
    $('#export').click(fc.crop.getImage.bind(fc.crop));

    fc.input.init();
});