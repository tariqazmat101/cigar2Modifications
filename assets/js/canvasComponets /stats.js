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
        if (!isNaN(statState.latency)) gameStatsText += ` ${statState.latency}ms`;
        mainCtx.fillText(gameStatsText, 2, height);
        height += 24;
    },

    drawBottomStats: function (cellsLength) {
        //console.log("statState have been draw");
        if (!statState.info) return statState.visible = false;
        if (!statState.info) return;
        statState.visible = true;

        var canvas = statState.canvas;
        var ctx = canvas.getContext("2d");
        ctx.font = "14px Ubuntu";
        var load = parseFloat(statState.info.update) * 2.5;
        if (statState.info.load) load = parseFloat(statState.info.load);
        if (statState.info.playersAlive >= 12 && statState.info.playersAlive <= 14) {
            var fakePlayers = statState.info.playersTotal + 1;
        } else if (statState.info.playersAlive >= 15 && statState.info.playersAlive <= 17){
            var fakePlayers = statState.info.playersTotal + 2;
        } else if (statState.info.playersAlive >= 18 && statState.info.playersAlive <= 20){
            var fakePlayers = statState.info.playersTotal + 3;
        } else if (statState.info.playersAlive >= 21 && statState.info.playersAlive <= 23){
            var fakePlayers = statState.info.playersTotal + 4;
        } else if (statState.info.playersAlive >= 24 && statState.info.playersAlive <= 26){
            var fakePlayers = statState.info.playersTotal + 5;
        } else if (statState.info.playersAlive >= 27){
            var fakePlayers = statState.info.playersTotal + 6;
        } else {
            var fakePlayers = statState.info.playersTotal;
        }
        var rows = [
            `${fakePlayers}/250 connections`,
            `${statState.info.playersAlive} playing`,
            `${statState.info.playersSpect} spectating`,
            `${(statState.info.update * 2.5).toFixed(1)}% load @ ${prettyPrintTime(statState.info.uptime)}`,
         //   `${(statState.info.mapFull)}% mapFull`,
          //  `${cellsLength} Particles `,
            //`${statState.info.massDecay.toFixed(3)} Mass Decay`,
           // `40 Mass Decay`,

        ];
        var width = 0;
        for (var i = 0; i < rows.length; i++)
            width = Math.max(width, 2 + ctx.measureText(rows[i]).width + 2);
        canvas.width = width;
        canvas.height = rows.length * (14 + 2) +54;
        ctx.font = "14px Ubuntu";
        ctx.fillStyle = settings.darkTheme ? "#AAA" : "#555";
        ctx.textBaseline = "top";
        let length = cellsLength;
        for (var i = 0; i < rows.length; i++)
            ctx.fillText(rows[i], 2, i * (16) + 54);
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