var fc = fc || {};

// @TODO Error firing if browser doesn't support Canvas or File API
// @TODO Minimum size support that carries over to crop.js
$(document).ready(function() {

    var $INPUT = $('#fast-crop'),
        DEBUG = true,
        CANVAS = document.createElement('canvas'),
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
            $(CANVAS).show();
            $(CANVAS_OVERLAY).show();
            fc.crop.init(this, parseInt($INPUT.data().minWidth, 10), parseInt($INPUT.data().minHeight, 10));
        }
    };

    fc.input = {
        init: function () {
            if (!_private.featureDetection()) {
                _private.error();
            }

            fc.crop.setCanvas(CANVAS)
                .setCanvasOverlay(CANVAS_OVERLAY);

            if (DEBUG) {
                $(CANVAS_OVERLAY).insertAfter($INPUT).hide();
            }

            $(CANVAS).insertAfter($INPUT).hide();

            this.bind();
        },

        bind: function () {
            $INPUT.change(_event.setImage);
        }
    };
});