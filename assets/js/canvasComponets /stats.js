import {pubsub, topics, prettyPrintTime} from "../utils";

let statState = {
    framesPerSecond: 0,
    latency: NaN,
    supports: null,
    info: null,
    pingLoopId: NaN,
    pingLoopStamp: null,
    canvas: document.createElement("canvas"),
    visible: true,
    score: NaN,
    maxScore: 0,
    //local variables for the object in question
    previousMassDecay: 0,
    index: 0,
    SyncAppStamp: 0,
};


const statsInterface = {
    drawTopStats: function (mainCtx) {
        let height = 2;
        mainCtx.fillStyle = settings.darkTheme ? "#FFF" : "#000";
        mainCtx.textBaseline = "top";

        //todo why is Statsstuff being drawn here?
        if (!isNaN(statState.score)) {
            mainCtx.font = "30px Ubuntu";
            mainCtx.fillText(`Score: ${statState.score}`, 2, height);
            height += 30;
        }
        mainCtx.font = "20px Ubuntu";
        let gameStatsText = `${~~statState.framesPerSecond} FPS`;
        if (!isNaN(statState.latency)) gameStatsText += ` ${statState.latency}ms ping`;
        mainCtx.fillText(gameStatsText, 2, height);
        height += 24;
    },

    drawBottomStats: function (cellsLength) {
        console.log("statState have been draw");
        if (!statState.info) return statState.visible = false;
        if (!statState.info) return;
        statState.visible = true;

        var canvas = statState.canvas;
        var ctx = canvas.getContext("2d");
        ctx.font = "14px Ubuntu";
        var rows = [
            `${statState.info.name} (${statState.info.mode})`,
            `${statState.info.playersTotal} / ${statState.info.playersLimit} players`,
            `${statState.info.playersAlive} playing`,
            `${statState.info.playersSpect} spectating`,
            `${(statState.info.update * 2.5).toFixed(1)}% load @ ${prettyPrintTime(statState.info.uptime)}`,
            `${(statState.info.mapFull)}% mapFull`,
            `${cellsLength} Particles `,
            `${statState.info.massDecay.toFixed(3)} Mass Decay`,

        ];
        var width = 0;
        for (var i = 0; i < rows.length; i++)
            width = Math.max(width, 2 + ctx.measureText(rows[i]).width + 2);
        canvas.width = width;
        canvas.height = rows.length * (14 + 2);
        ctx.font = "14px Ubuntu";
        ctx.fillStyle = settings.darkTheme ? "#AAA" : "#555";
        ctx.textBaseline = "top";
        let length = cellsLength;
        for (var i = 0; i < rows.length; i++) {
            ctx.font = "14px Ubuntu";
            //On the last row, check if current mass is bigger than the previous value, if yes, then make text green
            //Other, check if previousmassdecay value is the same as current, if yes, make black
            //else we assume it is decreasing, so make
            if (i === rows.length - 2 && length > 500) {
                let value = ~~(length / 100) - 5;
                ctx.font = `${14 + value}px Ubuntu`;
            }
            if (i === rows.length - 1) statState.info.massDecay > previousMassdecay ? ctx.fillStyle = 'green' : previousMassdecay === statState.info.massDecay ? ctx.fillStyle = 'black' : ctx.fillStyle = 'red';
            ctx.fillText(rows[i], 2, -2 + i * (14 + 2));
        }
        if (index % 3 === 0) statState.previousMassdecay = statState.info.massDecay;
        index++
    },

    checkIfvisible: function () {
        return statState.visible;
    },

    updateFromServer: function (latency, info, cellsLength) {
        statState.latency = latency;
        statState.info = info;

        //Draw the Stats now
        this.drawBottomStats(cellsLength);
    },

    updateScore: function (score) {
        statState.score = score;
        statState.maxScore = Math.max(statState.maxScore, score);
    },


    renderStats: function (mainCtx) {
        if (!statState.visible) return;

        this.drawTopStats(mainCtx);
        let height = 2;
        mainCtx.drawImage(statState.canvas, 2, height);
    },
    init: function () {
        pubsub.subscribe(topics.spectateView, function () {
            stateState.maxScore = 0;
            stateState.score = NaN;
        });
        pubsub.subscribe(topics.syncAPPstamp, function (msg, data) {
            //statState.SyncAppStamp = data;
        });

        pubsub.subscribe(topics.updateFPS, function () {
            statState.framesPerSecond += (1000 / Math.max(Date.now() - statState.SyncAppStamp, 1) - statState.framesPerSecond) / 10;
            statState.SyncAppStamp = Date.now();
        });
    },
    pingloopid: 0,
    pingLoopStamp: 0
};

export default statsInterface;