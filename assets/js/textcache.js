import settings from "./settings"
import {topics, pubsub} from "./utils";

/* Text/Mass cache handlers */
let syncAppStamp = Date.now();
let cachedNames = {};
let cachedMass = {};

let textUtils = {
    init: function () {
        /* pubSub subscriptions */
        pubsub.subscribe(topics.textCacheCleanup, () => {
            this.cacheCleanup();
        });
        pubsub.subscribe(topics.syncAPPstamp, (msg, data) => {
            syncAppStamp = data;
        });
    },

    cacheCleanup: () => {
        for (var i in cachedNames) {
            for (var j in cachedNames[i])
                if (syncAppStamp - cachedNames[i][j].accessTime >= 5000)
                    delete cachedNames[i][j];
            if (cachedNames[i] === {}) delete cachedNames[i];
        }
        for (var i in cachedMass)
            if (syncAppStamp - cachedMass[i].accessTime >= 5000)
                delete cachedMass[i];
    },

    drawTextOnto: (canvas, ctx, text, size) => {
        ctx.font = `${size}px Ubuntu`;
        //todo change setttings.showtextoutline
        ctx.lineWidth = Math.max(~~(size / 10), 2);
        canvas.width = ctx.measureText(text).width + 2 * ctx.lineWidth;
        canvas.height = 4 * size;
        ctx.font = `${size}px Ubuntu`;
        ctx.lineWidth = Math.max(~~(size / 10), 2);
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";
        ctx.translate(canvas.width / 2, 2 * size);
        (ctx.lineWidth !== 1) && ctx.strokeText(text, 0, 0);
        ctx.fillText(text, 0, 0);
    },
    drawRaw: (ctx, x, y, text, size) => {
        ctx.font = `${size}px Ubuntu`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.lineWidth = Math.max(~~(size / 10), 2);
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";
        (ctx.lineWidth !== 1) && ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
        ctx.restore();
    },

    newNameCache: function (value, size) {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        this.drawTextOnto(canvas, ctx, value, size);

        cachedNames[value] = cachedNames[value] || {};
        cachedNames[value][size] = {
            width: canvas.width,
            height: canvas.height,
            canvas: canvas,
            value: value,
            size: size,
            accessTime: syncAppStamp
        };
        return cachedNames[value][size];
    },
    newMassCache: function (size) {
        var canvases = {
            "0": {}, "1": {}, "2": {}, "3": {}, "4": {},
            "5": {}, "6": {}, "7": {}, "8": {}, "9": {}
        };
        for (var value in canvases) {
            var canvas = canvases[value].canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            this.drawTextOnto(canvas, ctx, value, size);
            canvases[value].canvas = canvas;
            canvases[value].width = canvas.width;
            canvases[value].height = canvas.height;
        }
        cachedMass[size] = {
            canvases: canvases,
            size: size,
            lineWidth: Math.max(~~(size / 10), 2),
            accessTime: syncAppStamp
        };
        return cachedMass[size];
    },
    toleranceTest: (a, b, tolerance) => {
        return (a - tolerance) <= b && b <= (a + tolerance);
    },
    getNameCache: function (value, size) {

        if (!cachedNames[value]) return this.newNameCache(value, size);
        var sizes = Object.keys(cachedNames[value]);
        for (var i = 0, l = sizes.length; i < l; i++)
            if (this.toleranceTest(size, sizes[i], size / 4))
                return cachedNames[value][sizes[i]];
        return this.newNameCache(value, size);
    },
    getMassCache: function (size) {
        var sizes = Object.keys(cachedMass);
        for (var i = 0, l = sizes.length; i < l; i++)
            if (this.toleranceTest(size, sizes[i], size / 4))
                return cachedMass[sizes[i]];
        return this.newMassCache(size);
    },
    drawText: function (ctx, isMass, x, y, size, drawSize, value) {
        ctx.save();
        if (size > 500) return this.drawRaw(ctx, x, y, value, drawSize);
        ctx.imageSmoothingQuality = settings.fancyGraphics ? "high" : "low";
        if (isMass) {
            var cache = this.getMassCache(size);
            cache.accessTime = syncAppStamp;
            var canvases = cache.canvases;
            var correctionScale = drawSize / cache.size;

            // calculate width
            var width = 0;
            for (var i = 0; i < value.length; i++)
                width += canvases[value[i]].width - 2 * cache.lineWidth;

            ctx.scale(correctionScale, correctionScale);
            x /= correctionScale;
            y /= correctionScale;
            x -= width / 2;
            for (var i = 0; i < value.length; i++) {
                var item = canvases[value[i]];
                ctx.drawImage(item.canvas, x, y - item.height / 2);
                x += item.width - 2 * cache.lineWidth;
            }
        } else {
            var cache = this.getNameCache(value, size);
            cache.accessTime = syncAppStamp;
            var canvas = cache.canvas;
            var correctionScale = drawSize / cache.size;
            ctx.scale(correctionScale, correctionScale);
            x /= correctionScale;
            y /= correctionScale;
            ctx.drawImage(canvas, x - canvas.width / 2, y - canvas.height / 2);
        }
        ctx.restore();
    },
    firstdrawText: function (ctx, cells, that) {
        if (that.s < 60 || that.jagged) return;
        if ((cells.mine.indexOf(that.id) !== -1 || cells.mine.length === 0)) {
            var mass = (~~(that.s * that.s / 100)).toString();
            if (that.name) {
                this.drawText(ctx, false, that.x, that.y, that.nameSize, that.drawNameSize, that.name);
                var y = that.y + Math.max(that.s / 4.5, that.nameSize / 1.5);
                this.drawText(ctx, true, that.x, y, that.nameSize / 2, that.drawNameSize / 2, mass);
            } else this.drawText(ctx, true, that.x, that.y, that.nameSize / 2, that.drawNameSize / 2, mass);
        } else if (that.name)
            this.drawText(ctx, false, that.x, that.y, that.nameSize, that.drawNameSize, that.name);
    }

};

export default textUtils;