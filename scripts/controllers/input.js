var fc = fc || {};

// @TODO Error firing if browser doesn't support Canvas or File API
// @TODO Minimum size support that carries over to crop.js
$(document).ready(function() {

    var $INPUT = $('#fast-crop'),
        DEBUG = true,
        CANVAS_OVERLAY = document.createElement('canvas');

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
        setImage: function () {
            var file = this.files[0],
                img = document.createElement('img'),
                reader = new FileReader();

            reader.onload = function (e) {
                // Double check that its a valid image
                if (file.type.indexOf('image') !== -1) {
                    img.src = e.target.result;
                    img.onload = _event.loadedImage;
                } else {
                    alert('Uploaded file must be a valid image.');
                }
            };
            reader.readAsDataURL(file);
        },

        loadedImage: function () {
            var data = $INPUT.data();

            // Check image size properties since they're available
            if (this.width >= data.width && this.height >= data.height) {
                fc.crop.init(this, parseInt(data.width, 10), parseInt(data.height, 10), parseInt(data.maxSize, 10));
            } else {
                alert('Sorry, but your image does not meet the minimum size requirements of ' +
                    'width ' + data.width + 'px and height ' + data.height + 'px');
                
            }
        }
    };

    fc.input = {
        init: function () {
            if (!_private.featureDetection()) {
                _private.error();
            }

            fc.crop.setCanvas($INPUT)
                .setCanvasOverlay(CANVAS_OVERLAY);

            if (DEBUG) {
                $(CANVAS_OVERLAY).insertAfter($INPUT).hide();
            }

            this.bind();
        },

        bind: function () {
            $INPUT.change(_event.setImage);
        }
    };
});