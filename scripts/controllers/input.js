var fc = fc || {};

$(document).ready(function() {
    var $INPUT = $('.fast-crop'),
        DEBUG = false;

    var _private = {
        error: function () {
            alert('Sorry, your browser doesn\'t support our file upload tools. Please use Google Chrome or Firefox');
        },

        detectCanvas: function () {
            return !!document.createElement('canvas').getContext;
        },

        detectFileAPI: function () {
            return typeof FileReader !== 'undefined';
        },

        featureDetection: function () {
            return this.detectCanvas() && this.detectFileAPI();
        }
    };

    var _event = {
        // @TODO Logic here is a bit tangled, should be broken up
        setImage: function (e) {
            var file = this.files[0],
                img = document.createElement('img'),
                reader = new FileReader(),
                $input = $(this),
                crop = e.data.crop;

            reader.onload = function (e) {
                // Double check that its a valid image
                if (file.type.indexOf('image') !== -1) {
                    img.src = e.target.result;
                    img.onload = function () {
                        var data = $input.data();

                        // Check image size properties since they're available
                        if (this.width >= data.width && this.height >= data.height) {
                            crop.init(this, parseInt(data.width, 10), parseInt(data.height, 10), parseInt(data.maxSize, 10));
                        } else {
                            alert('Sorry, but your image does not meet the minimum size requirements of ' +
                                'width ' + data.width + 'px and height ' + data.height + 'px');
                        }
                    };
                } else {
                    alert('Uploaded file must be a valid image.');
                }
            };
            reader.readAsDataURL(file);
        },

        exportImage: function (e) {
            e.data.crop.getImage();
        }
    };

    /**
     * Responsible for creating initial Fast Crop objects from inputs
     * @type {{init: Function, bind: Function}}
     */
    fc.input = {
        init: function () {
            if (!_private.featureDetection()) {
                _private.error();
            }

            var crop, $btn;
            $INPUT.each(function () {
                crop = new fc.Crop();
                $btn = $('<button>Crop Image</button>').insertAfter(this);

                crop.setCanvas($(this))
                    .setCanvasOverlay();

                fc.input.bind(this, crop, $btn);
            });


        },

        bind: function (input, target, $btn) {
            $(input).change({ crop: target }, _event.setImage);
            $btn.click({ crop: target }, _event.exportImage);
        }
    };
});