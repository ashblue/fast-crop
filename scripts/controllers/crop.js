var fc = fc || {};

// @TODO Error firing if browser doesn't support Canvas or File API
$(document).ready(function() {
    var canvas,
        ctx,
        oCanvas,
        oCtx;

    fc.crop = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        handleSize: 10,
        resizing: false,
        img: null,

        init: function (img) {
            this.img = img;
            this.setSize(img.width, img.height);
            this.setArea(50, 50, 50, 50);
        },

        setArea: function (x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;

            ctx.drawImage(this.img, 0, 0);

            // Background
            oCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            oCtx.fillRect(0, 0, oCanvas.width, oCanvas.height);

            // Cut hole in background
            oCtx.globalCompositeOperation = 'destination-out';
            oCtx.fillStyle = '#000';
            oCtx.fillRect(x, y, width, height);

            // Set handle
            oCtx.globalCompositeOperation = 'source-over';
            oCtx.fillStyle = 'rgba(0, 100, 200, 0.8)';
            oCtx.fillRect(this.getHandleTopLeftX(), this.getHandleTopLeftY(), this.handleSize, this.handleSize);

            ctx.drawImage(oCanvas, 0, 0);
        },

        getHandleTopLeftX: function () {
            return this.x + this.width - (this.handleSize / 2);
        },

        getHandleTopLeftY: function () {
            return this.y + this.height - (this.handleSize / 2);
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
        }
    };
});