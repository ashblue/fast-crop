var fc = fc || {};

// @TODO Needs extra padding to prevent issues on the edges
$(document).ready(function() {
    var DEBUG = true;

    var _dragCrop = false,
        _dragHandle = false,
        _dragX,
        _dragY;

    var canvas,
        ctx,
        oCanvas,
        oCtx;

    var _private = {
        // Monitors constant mouse movement differences from previous dragging position
        getDragX: function (x) {
            var drag = x - _dragX;
            _dragX = x;
            return drag;
        },

        getDragY: function (y) {
            var drag = y - _dragY;
            _dragY = y;
            return drag;
        }
    };

    var _event = {
        hoverCursor: function (e) {
            var offset = $(this).offset(),
                x = e.pageX - offset.left,
                y = e.pageY - offset.top;

            if (fc.crop.getHandleOverlap(x, y)) {
                $(this).css('cursor', 'nwse-resize');
            } else if (fc.crop.getCropOverlap(x, y)) {
                $(this).css('cursor', 'move');
            } else {
                $(this).css('cursor', 'inherit');
            }
        },

        setSelect: function (e) {
            var offset = $(this).offset(),
                x = e.pageX - offset.left,
                y = e.pageY - offset.top;

            _dragX = x;
            _dragY = y;

            if (fc.crop.getHandleOverlap(x, y)) {
                _dragHandle = true;
            } else if (fc.crop.getCropOverlap(x, y)) {
                _dragCrop = true;
            }
        },

        resetSelect: function (e) {
            _dragCrop = false;
            _dragHandle = false;
            return false;
        },

        dragCrop: function (e) {
            if (_dragCrop) {
                var offset = $(this).offset(),
                    x = e.pageX - offset.left - e.data.padding,
                    y = e.pageY - offset.top - e.data.padding;

                fc.crop.nudgeLoc(_private.getDragX(x), _private.getDragY(y));
            }
        },

        dragHandle: function (e) {
            if (_dragHandle) {
                var offset = $(this).offset(),
                    x = e.pageX - offset.left - e.data.padding,
                    y = e.pageY - offset.top - e.data.padding;

                fc.crop.nudgeSize(_private.getDragX(x), _private.getDragY(y));
            }
        }
    };

    fc.crop = {
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        minWidth: null,
        minHeight: null,
        handleSize: 10,
        ratio: null,
        img: null,
        container: document.createElement('div'),
        padding: 20,
        $parent: null,

        init: function (img, minWidth, minHeight, maxSize) {
            this.x = this.y = this.width = this.height = 0;
            this.img = img;
            this.minWidth = minWidth;
            this.minHeight = minHeight;
            this.maxSize = maxSize;
            this.ratio = minWidth / minHeight;
//            this.ratio = minHeight / minWidth;


            this.$parent.after(this.container);

            this.setSize(img.width, img.height);
            this.setArea(0, 0, minWidth, minHeight);
            this.bind();
        },

        bind: function () {
            $(canvas).mousemove(_event.hoverCursor)
                .mousedown(_event.setSelect)
                .mouseup(_event.resetSelect);


            $(this.container)
                .mousemove({ padding: this.padding }, _event.dragCrop)
                .mousemove({ padding: this.padding }, _event.dragHandle)
                .bind('mouseleave mouseup', _event.resetSelect);
        },

        setArea: function (x, y, width, height) {
            // Verify crop is correct limitations
            this.forceBoundary(x, y, width, height)
                .forceMinimum()
                .forceRatio();

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            oCtx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(this.img, 0, 0, canvas.width, canvas.height);

            // Background
            oCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            oCtx.fillRect(0, 0, oCanvas.width, oCanvas.height);

            // Cut hole in background
            oCtx.globalCompositeOperation = 'destination-out';
            oCtx.fillStyle = '#000';
            oCtx.fillRect(this.x, this.y, this.width, this.height);

            // Set handle
            oCtx.globalCompositeOperation = 'source-over';
            oCtx.fillStyle = 'rgba(0, 100, 200, 0.8)';
            oCtx.fillRect(this.getHandleTopLeftX(), this.getHandleTopLeftY(), this.handleSize, this.handleSize);

            ctx.drawImage(oCanvas, 0, 0);

            return this;
        },

        getHandleTopLeftX: function () {
            return this.x + this.width - (this.handleSize / 2);
        },

        getHandleTopLeftY: function () {
            return this.y + this.height - (this.handleSize / 2);
        },

        getHandleOverlap: function (x, y) {
            return x >= this.getHandleTopLeftX() && x <= this.getHandleTopLeftX() + this.handleSize &&
                y >= this.getHandleTopLeftY() && y <= this.getHandleTopLeftY() + this.handleSize;
        },

        getCropOverlap: function (x, y) {
            return x >= this.x && x <= this.x + this.width &&
                y >= this.y && y <= this.y + this.height;
        },

        setSize: function (width, height) {
            if (width > this.maxSize || height > this.maxSize) {
                var resizedImage = this.getResizedImage();
                this.width = resizedImage.width;
                this.height = resizedImage.height;
            } else {
                this.width = width;
                this.height = height;
            }

            canvas.width = this.width;
            canvas.height = this.height;

            oCanvas.width = this.width;
            oCanvas.height = this.height;
        },

        // Resizes an overflowing image so it meets the maximum size setting
        getResizedImage: function () {
            var ratio,
                width,
                height;

            // Width is the largest
            if (this.img.width > this.img.height) {
                ratio = this.img.height / this.img.width;
                width = this.maxSize;
                height = width * ratio;

            // Height is the largest
            } else {
                ratio = this.img.width / this.img.height;
                height = this.maxSize;
                width = height * ratio;
            }

            return {
                width: width,
                height: height
            };
        },

        setCanvas: function ($start) {
            this.$parent = $start;
            canvas = document.createElement('canvas');
            canvas.classList.add('fc-canvas');

            ctx = canvas.getContext('2d');
            this.container.style.padding = this.padding + 'px';
            this.container.appendChild(canvas);
            this.container.classList.add('fc-container');

            return this;
        },

        setCanvasOverlay: function (el) {
            oCanvas = el;
            oCtx = el.getContext('2d');
            return this;
        },

        forceBoundary: function (x, y, width, height) {
            if (x >= 0 && x + width <= canvas.width) {
                this.x = x;
                this.width = width;
            }

            if (y >= 0 && y + height <= canvas.height) {
                this.y = y;
                this.height = height;
            }

            return this;
        },

        forceMinimum: function () {
            if (this.width < this.minWidth) {
                this.width = this.minWidth;
            }

            if (this.height < this.minHeight) {
                this.height = this.minHeight;
            }

            return this;
        },

        forceRatio: function () {
            this.width = this.height * this.ratio;
            return this;
        },

        nudgeLoc: function (x, y) {
            this.setArea(this.x + x, this.y + y, this.width, this.height);
        },

        nudgeSize: function (width, height) {
            this.setArea(this.x, this.y, this.width + width, this.height + height);
        },

        getImage: function () {
            var newImage = document.createElement('canvas'),
                newImageCtx = newImage.getContext('2d'),
                crop = this.getCrop();

            // Draw cropped image onto a temporary Canvas
            newImage.width = this.minWidth;
            newImage.height = this.minHeight;
            newImageCtx.drawImage(this.img, crop.x, crop.y, crop.width, crop.height, 0, 0, this.minWidth, this.minHeight);

            if (DEBUG) {
                $('#crop-output').prepend(newImage);
            }

            // Turn data into an image
            return newImage.toDataURL('image/png');
        },

        getCrop: function () {
            var x, y, width, height, ratio;

            // If image is not oversized send back data as normal
            if (this.img.width <= this.maxSize || this.img.height <= this.maxSize) {
                x = this.x;
                y = this.y;
                width = this.width;
                height = this.height;
            } else {
                ratio = this.img.width / this.maxSize;
                x = this.x * ratio;
                y = this.y * ratio;
                width = this.width * ratio;
                height = this.height * ratio;
            }

            return {
                x: x,
                y: y,
                width: width,
                height: height
            }
        }
    };
});