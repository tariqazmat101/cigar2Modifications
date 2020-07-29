export const colorToBytes = (color) => {
    if (color.length === 4)
        return { r: parseInt(color[1] + color[1], 16), g: parseInt(color[2] + color[2], 16), b: parseInt(color[3] + color[3], 16) };
    else if (color.length === 7)
        return { r: parseInt(color[1] + color[2], 16), g: parseInt(color[3] + color[4], 16), b: parseInt(color[5] + color[6], 16) };
    throw new Error(`invalid color ${color}`);
};

export const bytesToColor = (r,g,b) => {
    var r1 = ("00" + (~~r).toString(16)).slice(-2);
    var g1 = ("00" + (~~g).toString(16)).slice(-2);
    var b1 = ("00" + (~~b).toString(16)).slice(-2);
    return `#${r1}${g1}${b1}`;
};

export const darkenColor = (color) =>  {
    var a = colorToBytes(color);
    return bytesToColor(a.r * .9, a.g * .9, a.b * .9);
};

export const log = {
    verbosity: 4,
    error: function(a) { if (log.verbosity <= 0) return; console.error(a); },
    warn: function(a) { if (log.verbosity <= 1) return; console.warn(a); },
    info: function(a) { if (log.verbosity <= 2) return; console.info(a); },
    debug: function(a) { if (log.verbosity <= 3) return; console.debug(a); }
};

export const topics = {
    name: "minimap",
    syncUpdateStamp: "SyncUpdateSTamp",
    showEscapeoverlay: "showescape"
};
export const PI_2 = Math.PI * 2;

