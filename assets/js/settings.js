import {topics, pubsub} from "./utils";

let settings = {
    mobile: "createTouch" in document,
    showMass: false,
    showLeaderboard: true,
    fancyGraphics: false,
    showChat: true,
    showGrid: true,
    showColor: true,
    showSkins: true,
    showMinimap: true,
    darkTheme: false,
    allowGETipSet: false,
    init: function (settings) {
        //why does this 'this' refer to the settings object now?
        pubsub.subscribe(topics.showMass, !this.showMass);
        pubsub.subscribe(topics.showLeaderboard, !this.showLeaderboard);
        pubsub.subscribe(topics.showMinimap, !this.showMinimap);
        pubsub.subscribe(topics.showGrid, !this.showGrid);
        pubsub.subscribe(topics.darkTheme, !this.darkTheme);
        pubsub.subscribe(topics.showSkins, !this.showSkins);
    }
};
export default settings;