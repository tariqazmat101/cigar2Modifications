import {topics, pubsub, UINT8_CACHE} from "./utils";

const stats = {
    init: function () {
        pubsub.subscribe(topics.spectateView, function () {
            this.maxScore = 0;
            this.score = NaN;
        });


        let startPingloop = function () {
            this.pingLoopId = setInterval(function () {
                pubsub.publish(topics.wsSend, UINT8_CACHE[254]);
                stats.pingLoopId = Date.now();
            }, 2000);
        }
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
    drawStats: function () {

    },


};

export default stats;
