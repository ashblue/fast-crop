var fc = fc || {};

$(document).ready(function () {
    var DEBUG = false;

    // @TODO Should be part of the object, not private
    var _private = {
        // Monitors constant mouse movement differences from previous dragging position
        getDragX: function (x) {
            var drag = x - this.dragX;
            this.dragX = x;
            return drag;
        },

        getDragY: function (y) {
            var drag = y - this.dragY;
            this.dragY = y;
            return drag;
        }
    };

    var _event = {
        hoverCursor: function (e) {
            var offset = $(this.canvas).offset(),
                x = e.pageX - offset.left,
                y = e.pageY - offset.top;

            if (this.getHandleOverlap(x, y)) {
                $(this.canvas).css('cursor', 'nwse-resize');
            } else if (this.getCropOverlap(x, y)) {
                $(this.canvas).css('cursor', 'move');
            } else {
                $(this.canvas).css('cursor', 'inherit');
            }
        },

        setSelect: function (e) {
            var offset = $(this.canvas).offset(),
                x = e.pageX - offset.left,
                y = e.pageY - offset.top;

            this.dragX = x;
            this.dragY = y;

            if (this.getHandleOverlap(x, y)) {
                this.dragHandle = true;
            } else if (this.getCropOverlap(x, y)) {
                this.dragCrop = true;
            }
        },

        resetSelect: function () {
            this.dragCrop = false;
            this.dragHandle = false;
            return false;
        },

        dragCrop: function (e) {
            if (this.dragCrop) {
                var offset = $(this.container).offset(),
                    x = e.pageX - offset.left - e.data.padding,
                    y = e.pageY - offset.top - e.data.padding;

                this.nudgeLoc(this.getDragX(x), this.getDragY(y));
            }
        },

        dragHandle: function (e) {
            if (this.dragHandle) {
                var offset = $(this.container).offset(),
                    x = e.pageX - offset.left - e.data.padding,
                    y = e.pageY - offset.top - e.data.padding;

                this.nudgeSize(this.getDragX(x), this.getDragY(y));
            }
        }
    };

    /**
     * Creates an individual cropping instance with associates Canvases
     * @constructor
     */
    fc.Crop =  function () {
        this.x = 0;
        this.y = 0;
        this.width = 10;
        this.height = 10;
        this.minWidth = null;
        this.minHeight = null;
        this.handleSize = 10;
        this.ratio = null;
        this.img = null;

        // Element that holds the primary canvas with a padding to make dragging easier
        this.container = document.createElement('div');
        this.padding = 40;

        // Parent of the container
        this.$parent = null;

        // Primary display canvas
        this.canvas = null;
        this.ctx = null;

        // Canvas overlay = visual output of the crop area
        this.oCanvas = null;
        this.oCtx = null;

        // State switches
        this.dragCrop = false;
        this.dragHandle = false;

        // Drag increments during state switches
        this.dragX = null;
        this.dragY = null;
    };

    fc.Crop.prototype.init = function (img, minWidth, minHeight, maxSize) {
        this.x = this.y = this.width = this.height = 0;
        this.img = img;
        this.minWidth = minWidth;
        this.minHeight = minHeight;
        this.maxSize = maxSize;
        this.ratio = minWidth / minHeight;

        this.$parent.after(this.container);

        this.setSize(img.width, img.height);
        this.setArea(0, 0, minWidth, minHeight);
        this.bind();
    };

    fc.Crop.prototype.bind = function () {
        $(this.canvas).mousemove(_event.hoverCursor.bind(this))
            .mousedown(_event.setSelect.bind(this))
            .mouseup(_event.resetSelect.bind(this));


        $(this.container)
            .mousemove({ padding: this.padding }, _event.dragCrop.bind(this))
            .mousemove({ padding: this.padding }, _event.dragHandle.bind(this))
            .bind('mouseleave mouseup', _event.resetSelect.bind(this));
    };

    fc.Crop.prototype.setArea = function (x, y, width, height) {
        // Verify crop is correct limitations
        this.forceBoundary(x, y, width, height)
            .forceMinimum();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.oCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height);

        // Background
        this.oCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.oCtx.fillRect(0, 0, this.oCanvas.width, this.oCanvas.height);

        // Cut hole in background
        this.oCtx.globalCompositeOperation = 'destination-out';
        this.oCtx.fillStyle = '#000';
        this.oCtx.fillRect(this.x, this.y, this.width, this.height);

        // Set handle
        this.oCtx.globalCompositeOperation = 'source-over';
        this.oCtx.fillStyle = 'rgba(0, 100, 200, 0.8)';
        this.oCtx.fillRect(this.getHandleTopLeftX(), this.getHandleTopLeftY(), this.handleSize, this.handleSize);

        this.ctx.drawImage(this.oCanvas, 0, 0);

        return this;
    };

    fc.Crop.prototype.getHandleTopLeftX = function () {
        return this.x + this.width - (this.handleSize / 2);
    };

    fc.Crop.prototype.getHandleTopLeftY = function () {
        return this.y + this.height - (this.handleSize / 2);
    };

    fc.Crop.prototype.getHandleOverlap = function (x, y) {
        return x >= this.getHandleTopLeftX() && x <= this.getHandleTopLeftX() + this.handleSize &&
            y >= this.getHandleTopLeftY() && y <= this.getHandleTopLeftY() + this.handleSize;
    };

    fc.Crop.prototype.getCropOverlap = function (x, y) {
        return x >= this.x && x <= this.x + this.width &&
            y >= this.y && y <= this.y + this.height;
    };

    fc.Crop.prototype.setSize = function (width, height) {
        if (width > this.maxSize || height > this.maxSize) {
            var resizedImage = this.getResizedImage();
            this.width = resizedImage.width;
            this.height = resizedImage.height;
        } else {
            this.width = width;
            this.height = height;
        }

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.oCanvas.width = this.width;
        this.oCanvas.height = this.height;
    };

        // Resizes an overflowing image so it meets the maximum size setting
    fc.Crop.prototype.getResizedImage = function () {
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
    };

    fc.Crop.prototype.setCanvas = function ($start) {
        this.$parent = $start;
        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('fc-canvas');

        this.ctx = this.canvas.getContext('2d');
        this.container.style.padding = this.padding + 'px';
        this.container.appendChild(this.canvas);
        this.container.classList.add('fc-container');

        return this;
    };

    fc.Crop.prototype.setCanvasOverlay = function () {
        this.oCanvas = document.createElement('canvas');
        this.oCtx = this.oCanvas.getContext('2d');

        if (DEBUG) {
            $(this.oCanvas).insertAfter($(this.$parent));
        }

        return this;
    };

        // @TODO Two different methods, one for x/y and another for width/height
    fc.Crop.prototype.forceBoundary = function (x, y, width, height) {
        var prevHeight = this.height,
            prevWidth = this.width;

        // if a width change there must also be a height change
        if (width !== this.width || height !== this.height) {
            if (x >= 0 && x + width <= this.canvas.width &&
                y >= 0 && y + height <= this.canvas.height) {
                this.width = width;
                this.height = height;
                this.forceRatio(prevWidth, prevHeight);
            }
        } else {
            // Set x
            if (x >= 0 && x + width <= this.canvas.width) {
                this.x = x;
            }

            // Set y
            if (y >= 0 && y + height <= this.canvas.height) {
                this.y = y;
            }
        }

        return this;
    };

    fc.Crop.prototype.forceMinimum = function () {
        if (this.width < this.minWidth) {
            this.width = this.minWidth;
        }

        if (this.height < this.minHeight) {
            this.height = this.minHeight;
        }

        return this;
    };

    // @TODO Method to dectect boundary violations
    fc.Crop.prototype.forceRatio = function (prevWidth, prevHeight) {
        var newWidth = this.height * this.ratio;

        // Verify new ratio doesn't exceed boundary
        if (this.x + newWidth <= this.canvas.width) {
            this.width = newWidth;
        } else {
            this.width = prevWidth;
            this.height = prevHeight;
        }

        return this;
    };

    fc.Crop.prototype.nudgeLoc = function (x, y) {
        this.setArea(this.x + x, this.y + y, this.width, this.height);
    };

    fc.Crop.prototype.nudgeSize = function (width, height) {
        this.setArea(this.x, this.y, this.width + width, this.height + height);
    };

    fc.Crop.prototype.getImage = function () {
        var newImage = document.createElement('canvas'),
            newImageCtx = newImage.getContext('2d'),
            crop = this.getCrop();

        // Draw cropped image onto a temporary Canvas
        newImage.width = this.minWidth;
        newImage.height = this.minHeight;
        newImageCtx.drawImage(this.img, crop.x, crop.y, crop.width, crop.height, 0, 0, this.minWidth, this.minHeight);

        // Pump out result into the crop area
        $('#crop-output').prepend(newImage);

        // Turn data into an image
        return newImage.toDataURL('image/png');
    };

    fc.Crop.prototype.getCrop = function () {
        var x, y, width, height, ratio;

        // If image is not oversized send back data as normal
        if (this.img.width <= this.maxSize && this.img.height <= this.maxSize) {
            x = this.x;
            y = this.y;
            width = this.width;
            height = this.height;

        // If height width is larger
        } else if (this.img.width > this.img.height) {
            ratio = this.img.width / this.maxSize;
            x = this.x * ratio;
            y = this.y * ratio;
            width = this.width * ratio;
            height = this.height * ratio;

        // If width is larger
        } else {
            ratio = this.img.height / this.maxSize;
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
        };
    };

    fc.Crop.prototype.getDragX = function (x) {
        var drag = x - this.dragX;
        this.dragX = x;
        return drag;
    };

    fc.Crop.prototype.getDragY = function (y) {
        var drag = y - this.dragY;
        this.dragY = y;
        return drag;
    };
});