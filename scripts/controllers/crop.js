var fc = fc || {};

// @TODO Needs extra padding to prevent issues on the edges
$(document).ready(function() {
    var _dragCrop = false,
        _dragHandle = false,
        _dragX,
        _dragY,
        _offsetX,
        _offsetY;

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
            var x = e.pageX - _offsetX,
                y = e.pageY - _offsetY;

            if (fc.crop.getHandleOverlap(x, y)) {
                $(this).css('cursor', 'nwse-resize');
            } else if (fc.crop.getCropOverlap(x, y)) {
                $(this).css('cursor', 'move');
            } else {
                $(this).css('cursor', 'inherit');
            }
        },

        setSelect: function (e) {
            var x = e.pageX - _offsetX,
                y = e.pageY - _offsetY;

            _dragX = x;
            _dragY = y;

            if (fc.crop.getHandleOverlap(x, y)) {
                _dragHandle = true;
            } else if (fc.crop.getCropOverlap(x, y)) {
                _dragCrop = true;
            }
        },

        resetSelect: function () {
            _dragCrop = false;
            _dragHandle = false;
        },

        dragCrop: function (e) {
            if (_dragCrop) {
                var x = e.pageX - _offsetX,
                    y = e.pageY - _offsetY;

                fc.crop.nudgeLoc(_private.getDragX(x), _private.getDragY(y));
            }
        },

        dragHandle: function (e) {
            if (_dragHandle) {
                var x = e.pageX - _offsetX,
                    y = e.pageY - _offsetY;

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

        init: function (img, minWidth, minHeight) {
            var offset = $(canvas).offset();
            _offsetX = offset.left;
            _offsetY = offset.top;

            this.x = this.y = this.width = this.height = 0;
            this.img = img;
            this.minWidth = minWidth;
            this.minHeight = minHeight;
            this.ratio = minWidth / minHeight;
            this.setSize(img.width, img.height);
            this.setArea(0, 0, minWidth, minHeight);
            this.bind();
        },

        bind: function () {
            $(canvas).mousemove(_event.hoverCursor)
                .mousedown(_event.setSelect)
                .mousemove(_event.dragCrop)
                .mousemove(_event.dragHandle)
                .mouseup(_event.resetSelect);
        },

        setArea: function (x, y, width, height) {
            // Verify crop is correct limitations
            this.forceBoundary(x, y, width, height)
                .forceMinimum()
                .forceRatio();

            // Exit during force boundary to prevent unecessary overflow
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            oCtx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(this.img, 0, 0);

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
            canvas.width = width;
            canvas.height = height;
            oCanvas.width = width;
            oCanvas.height = height;
        },

        setCanvas: function (el) {
            canvas = el;
            ctx = el.getContext('2d');
            return this;
        },

        setCanvasOverlay: function (el) {
            oCanvas = el;
            oCtx = el.getContext('2d');
            return this;
        },

        forceBoundary: function (x, y, width, height) {
            if (x >= 0 && x + width <= canvas.width &&
                y >= 0 && y + height <= canvas.height) {
                this.x = x;
                this.width = width;
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
            this.height = this.width * this.ratio;
            return this;
        },

        nudgeLoc: function (x, y) {
            this.setArea(this.x + x, this.y + y, this.width, this.height);
        },

        nudgeSize: function (width, height) {
            this.setArea(this.x, this.y, this.width + width, this.height + height);
        }
    };
});