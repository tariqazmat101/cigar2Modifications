import {pubsub, topics, prettyPrintTime} from "./utils";
import settings from "./settings.js"

let chatState = {
       messages: [],
       waitUntil: 0,
       canvas: document.createElement("canvas"),
       visible: false,
};


const chatInterface = {
    updateChat: function () {
        if (chatState.messages.length === 0 || !settings.showChat)
            return chatState.visible = false;

        chatState.visible = true;
        var canvas = chatState.canvas;
        var ctx = canvas.getContext("2d");
        var latestMessages = chatState.messages.slice(-15);
        var lines = [];
        for (var i = 0, len = latestMessages.length; i < len; i++)
            lines.push([
                {
                    text: latestMessages[i].name,
                    color: latestMessages[i].color
                }, {
                    text: " " + latestMessages[i].message,
                    color: settings.darkTheme ? "#DDD" : "#222"
                }
            ]);
        var width = 0;
        var height = 22 * len + 4;
        for (var i = 0; i < len; i++) {
            var thisLineWidth = 10;
            var complexes = lines[i];
            for (var j = 0; j < complexes.length; j++) {
                ctx.font = "18px Ubuntu";
                complexes[j].width = ctx.measureText(complexes[j].text).width;
                thisLineWidth += complexes[j].width;
            }
            width = Math.max(thisLineWidth, width);
        }
        canvas.width = width;
        canvas.height = height;
        for (var i = 0; i < len; i++) {
            width = 0;
            var complexes = lines[i];
            for (var j = 0; j < complexes.length; j++) {
                ctx.font = "18px Ubuntu";
                ctx.fillStyle = complexes[j].color;
                ctx.fillText(complexes[j].text, width, 22 * (1 + i));
                width += complexes[j].width;
            }
        }

    },

    renderChat: function(mainctx,istyping,viewMult,syncAPPstamp,mainCanvasHeight){
 //   if(!chatState.visible || !istyping) return;

    mainctx.globalAlpha = istyping ? 1 : Math.max(1000 - syncAPPstamp + chatState.waitUntil, 200) / 1000;
                mainctx.drawImage(
                    chatState.canvas,
                    10 / viewMult,
                    (mainCanvasHeight - 55) / viewMult - chatState.canvas.height
                );
                mainctx.globalAlpha = 1;

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
    updateFromServer: function(messageData,waitUntil,mainctx){
    chatState.waitUntil = waitUntil;
    chatState.messages.push(messageData);

    this.updateChat(mainctx);

    },
    pingloopid: 0,
    pingLoopStamp: 0
};

export default chatInterface;
