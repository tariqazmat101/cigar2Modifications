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
    darkTheme: "darktheme",
    showMass: "showMass",
    showSkins: "showSkins",
};

export let pubsub = x;


export const PI_2 = Math.PI * 2;

