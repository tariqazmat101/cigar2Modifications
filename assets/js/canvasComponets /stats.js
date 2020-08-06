import {topics, pubsub, UINT8_CACHE} from "../utils"
let stats = {
    init: function () {
        pubsub.subscribe(topics.spectateView, function () {
            this.maxScore = 0;
            this.score = NaN;
        });
        pubsub.subscribe(topics.syncAPPstamp, function (data) {
            this.syncAPPstamp =  data;

            //Update the fps counter once the sync app stamp arrives
            this.framesPerSecond = (1000 / Math.max(Date.now() - this.syncAppStamp, 1) - this.framesPerSecond) / 10;
            console.log("stats syncappstamp stamp has changed, check it out");

        });

    },
    framesPerSecond: 0,
    latency: NaN,
    supports: null,
    info: null,
    pingLoopId: NaN,
    pingLoopStamp: null,
    canvas: document.createElement("canvas"),
    visible: false,
    score: NaN,
    maxScore: 0,
    //local variables for the object in question
    previousMassDecay: 0,
    index:0,
    SyncAPPSTAMP:0,

    drawTopstats: function(mainCtx){
        let height = 2;
        mainCtx.fillStyle = settings.darkTheme ? "#FFF" : "#000";
        mainCtx.textBaseline = "top";

        //todo why is Statsstuff being drawn here?
        if (!isNaN(stats.score)) {
            mainCtx.font = "30px Ubuntu";
            mainCtx.fillText(`Score: ${stats.score}`, 2, height);
            height += 30;
        }
        mainCtx.font = "20px Ubuntu";
        let gameStatsText = `${~~stats.framesPerSecond} FPS`;
        if (!isNaN(stats.latency)) gameStatsText += ` ${stats.latency}ms ping`;
        mainCtx.fillText(gameStatsText, 2, height);
        height += 24;
    },

    drawBottomStats: function () {
        if (!stats.info) return stats.visible = false;
        if (!stats.info) return;
        stats.visible = true;

        var canvas = stats.canvas;
        var ctx = canvas.getContext("2d");
        ctx.font = "14px Ubuntu";
        var rows = [
            `${stats.info.name} (${stats.info.mode})`,
            `${stats.info.playersTotal} / ${stats.info.playersLimit} players`,
            `${stats.info.playersAlive} playing`,
            `${stats.info.playersSpect} spectating`,
            `${(stats.info.update * 2.5).toFixed(1)}% load @ ${prettyPrintTime(stats.info.uptime)}`,
            `${(stats.info.mapFull)}% mapFull`,
            `${cells.list.length} Particles `,
            `${stats.info.massDecay.toFixed(3)} Mass Decay`,

        ];
        var width = 0;
        for (var i = 0; i < rows.length; i++)
            width = Math.max(width, 2 + ctx.measureText(rows[i]).width + 2);
        canvas.width = width;
        canvas.height = rows.length * (14 + 2);
        ctx.font = "14px Ubuntu";
        ctx.fillStyle = settings.darkTheme ? "#AAA" : "#555";
        ctx.textBaseline = "top";
        let length = cells.list.length;
        for (var i = 0; i < rows.length; i++) {
            ctx.font = "14px Ubuntu";
            //On the last row, check if current mass is bigger than the previous value, if yes, then make text green
            //Other, check if previousmassdecay value is the same as current, if yes, make black
            //else we assume it is decreasing, so make
            if (i == rows.length - 2 && length > 500) {
                let value = ~~(length / 100) - 5;
                ctx.font = `${14 + value}px Ubuntu`;
            }
            if (i === rows.length - 1) stats.info.massDecay > previousMassdecay ? ctx.fillStyle = 'green' : previousMassdecay === stats.info.massDecay ? ctx.fillStyle = 'black' : ctx.fillStyle = 'red';
            ctx.fillText(rows[i], 2, -2 + i * (14 + 2));
        }
        if (index % 3 == 0) this.previousMassdecay = stats.info.massDecay;
        index++
    },

};

export default stats;
