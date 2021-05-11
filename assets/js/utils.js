import x from "pubsub-js"

export const colorToBytes = (color) => {
    if (color.length === 4)
        return {
            r: parseInt(color[1] + color[1], 16),
            g: parseInt(color[2] + color[2], 16),
            b: parseInt(color[3] + color[3], 16)
        };
    else if (color.length === 7)
        return {
            r: parseInt(color[1] + color[2], 16),
            g: parseInt(color[3] + color[4], 16),
            b: parseInt(color[5] + color[6], 16)
        };
    throw new Error(`invalid color ${color}`);
};

export const sqDist = (a, b) => {
    return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
};

export const bytesToColor = (r, g, b) => {
    var r1 = ("00" + (~~r).toString(16)).slice(-2);
    var g1 = ("00" + (~~g).toString(16)).slice(-2);
    var b1 = ("00" + (~~b).toString(16)).slice(-2);
    return `#${r1}${g1}${b1}`;
};


/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
export const roundRect = (ctx, x, y, width, height, radius, fill, stroke) => {
    if (typeof stroke === 'undefined') {
        stroke = true;
    }
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
        var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}

export const darkenColor = (color) => {
    var a = colorToBytes(color);
    return bytesToColor(a.r * .9, a.g * .9, a.b * .9);
};

export const log = {
    verbosity: 4,
    error: function (a) {
        if (log.verbosity <= 0) return;
        console.error(a);
    },
    warn: function (a) {
        if (log.verbosity <= 1) return;
        console.warn(a);
    },
    info: function (a) {
        if (log.verbosity <= 2) return;
        console.info(a);
    },
    debug: function (a) {
        if (log.verbosity <= 3) return;
        console.debug(a);
    }
};

export const prettyPrintTime = (seconds) => {
    seconds = ~~seconds;
    var minutes = ~~(seconds / 60);
    if (minutes < 1) return "<1 min";
    var hours = ~~(minutes / 60);
    if (hours < 1) return minutes + "min";
    var days = ~~(hours / 24);
    if (days < 1) return hours + "h";
    return days + "d";
};

export const UINT8_CACHE = {
    1: new Uint8Array([1]),
    17: new Uint8Array([17]),
    21: new Uint8Array([21]),
    18: new Uint8Array([18]),
    19: new Uint8Array([19]),
    22: new Uint8Array([22]),
    23: new Uint8Array([23]),
    24: new Uint8Array([24]),
    69: new Uint8Array([69]), // This is a new packetcode that will be sent to the server, it tells the server to change leaderboards
    254: new Uint8Array([254])
};
export const topics = {
    //miscelneeiosu topics
    syncUpdateStamp: "SyncUpdateSTamp",
    syncAPPstamp: "syncAPPstamp",
    showEscapeoverlay: "showescape",
    textCacheCleanup: "textcachecleanup",
    spectateView: "spectateView",
    wsSend: "wsSend",
    updateFPS: "updateFPS",

    //topics for settings
    showLeaderboard: "showLeaderboard",
    showGrid: "showGrid",
    showMinimap: "showminimap",
    theme: "theme",
    showMass: "showMass",
    showSkins: "showSkins",

    //User interfaces

};

export let pubsub = x;


export const PI_2 = Math.PI * 2;

