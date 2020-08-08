// import $ from 'jquery';
import Reader from "./reader.js"
import Writer from "./writer.js"
import map from "../img/minimap.png"
import snake from "../img/fire.png"
import fire from "../img/snake.png"
import Cell from "./Cell"

import css from "../css/index.css"
import {pubsub, topics} from "./utils";
import textUtils from "./textcache";
import SETTINGS from "./settings";

import statsInterface from "./canvasComponets /stats"

//hello
(function (wHandle, wjQuery) {
    var mySubscriber = function (msg, data) {
        console.log(`${msg} is gay and ${data}`);
    };

    //why don't we add (); to mySubscriber function call? we are invoking it,right??
    var token = pubsub.subscribe('x', mySubscriber);
    pubsub.publish('x', 'hello world!');

    function byId(id) {
        return document.getElementById(id);
    }

    function byClass(clss, parent) {
        return (parent || document).getElementsByClassName(clss);
    }

    console.log(wjQuery);
    if (navigator.appVersion.indexOf("MSIE") != -1)
        alert("You're using a pretty old browser, some parts of the website might not work properly.");

    Date.now || (Date.now = function () {
        return (+new Date).getTime();
    });
    var LOAD_START = Date.now();
    Array.prototype.peek = function () {
        return this[this.length - 1];
    };
    Array.prototype.remove = function (a) {
        var i = this.indexOf(a);
        if (i !== -1) this.splice(i, 1);
        return i !== -1;
    };

    function bytesToColor(r, g, b) {
        var r1 = ("00" + (~~r).toString(16)).slice(-2);
        var g1 = ("00" + (~~g).toString(16)).slice(-2);
        var b1 = ("00" + (~~b).toString(16)).slice(-2);
        return `#${r1}${g1}${b1}`;
    }

    function loadImage(url) {
        return new Promise(r => {
            let i = new Image();
            i.onload = (() => r(i));
            i.src = url;
        });
    }

    var images = {fire: null, snake: null, minimap: null, fireimage: null};

    // function syncLoadImages() {
    //     for( let i = 0,file,img; i <filenames.length; i++ ){
    //          file = filenames[i];
    //          img = new Image();
    //         img.src = `./img/${file}.png`;
    //         img.onload = () => {
    //             images[file] = img
    //         }
    //     }
    // }
    function syncLoadImages() {
        const myimage = new Image();
        myimage.src = map;
        images["minimap"] = myimage;

        const thatimage = new Image();
        thatimage.src = fire;
        images["fire"] = thatimage;

        const x = new Image();
        x.src = snake;
        images["snake"] = x;
    }

    function colorToBytes(color) {
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
    }

    function darkenColor(color) {
        var a = colorToBytes(color);
        return bytesToColor(a.r * .9, a.g * .9, a.b * .9);
    }

    function cleanupObject(object) {
        for (var i in object)
            delete object[i];
    }


    var log = {
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

    var wsUrl = null,
        SKIN_URL = "./skins/",
        USE_HTTPS = "https:" == wHandle.location.protocol,
        PI_2 = Math.PI * 2,
        SEND_254 = new Uint8Array([254, 6, 0, 0, 0]),
        SEND_255 = new Uint8Array([255, 1, 0, 0, 0]),
        UINT8_CACHE = {
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

    function wsCleanup() {
        if (!ws) return;
        log.debug("ws cleanup trigger");
        ws.onopen = null;
        ws.onmessage = null;
        ws.close();
        ws = null;
    }

    function wsInit(url) {
        if (ws) {
            log.debug("ws init on existing conn");
            wsCleanup();
        }
        wjQuery("#connecting").show();
        ws = new WebSocket(`ws${USE_HTTPS ? "s" : ""}://${wsUrl = url}`);
        ws.binaryType = "arraybuffer";
        ws.onopen = wsOpen;
        ws.onmessage = wsMessage;
        ws.onerror = wsError;
        ws.onclose = wsClose;
    }

    function wsOpen() {
        disconnectDelay = 1000;
        wjQuery("#connecting").hide();
        wsSend(SEND_254);
        wsSend(SEND_255);
        document.getElementById("togglelb").style.display = "block";
        log.debug(`ws connected, using https: ${USE_HTTPS}`);
    }

    function wsError(error) {
        log.warn(error);
    }

    function wsClose(e) {
        log.debug(`ws disconnected ${e.code} '${e.reason}'`);
        wsCleanup();
        gameReset();
        setTimeout(function () {
            if (ws && ws.readyState === 1) return;
            wsInit(wsUrl);
        }, disconnectDelay *= 1.5);
    }

    function wsSend(data) {
        if (!ws) return;
        if (ws.readyState !== 1) return;
        if (data.build) ws.send(data.build());
        else ws.send(data);
    }

    function wsMessage(data) {
        syncUpdStamp = Date.now();
        var reader = new Reader(new DataView(data.data), 0, true);
        var packetId = reader.getUint8();
        switch (packetId) {
            case 0x10: // update nodes
                var killer, killed, id, node, x, y, s, flags, cell,
                    updColor, updName, updSkin, count, color, name, skin;

                // consume records
                count = reader.getUint16();
                for (var i = 0; i < count; i++) {
                    killer = reader.getUint32();
                    killed = reader.getUint32();
                    if (!cells.byId.hasOwnProperty(killer) || !cells.byId.hasOwnProperty(killed))
                        continue;
                    cells.byId[killed].destroy(killer, syncUpdStamp, cells);
                }

                // update records
                while (true) {
                    id = reader.getUint32();
                    if (id === 0) break;

                    x = reader.getInt32();
                    y = reader.getInt32();
                    s = reader.getUint16();

                    flags = reader.getUint8();
                    updColor = !!(flags & 0x02);
                    updName = !!(flags & 0x08);
                    updSkin = !!(flags & 0x04);
                    color = updColor ? bytesToColor(reader.getUint8(), reader.getUint8(), reader.getUint8()) : null;
                    skin = updSkin ? reader.getStringUTF8() : null;
                    name = updName ? reader.getStringUTF8() : null;

                    if (cells.byId.hasOwnProperty(id)) {
                        cell = cells.byId[id];
                        cell.update(syncUpdStamp, cells);
                        cell.updated = syncUpdStamp;
                        cell.ox = cell.x;
                        cell.oy = cell.y;
                        cell.os = cell.s;
                        cell.nx = x;
                        cell.ny = y;
                        cell.ns = s;
                        if (color) cell.setColor(color);
                        if (skin) cell.setSkin(skin);
                        if (name) cell.setName(name);
                    } else {
                        cell = new Cell(id, x, y, s, name, color, skin, flags, syncUpdStamp);
                        cells.byId[id] = cell;
                        cells.list.push(cell);
                    }
                }
                // dissapear records
                count = reader.getUint16();
                for (i = 0; i < count; i++) {
                    killed = reader.getUint32();
                    if (cells.byId.hasOwnProperty(killed) && !cells.byId[killed].destroyed)
                        cells.byId[killed].destroy(null, syncUpdStamp, cells);
                    //moved this functionality over
                }
                break;
            case 0x11: // update pos
                targetX = reader.getFloat32();
                targetY = reader.getFloat32();
                targetZ = reader.getFloat32();
                break;
            case 0x12: // clear all
                for (var i in cells.byId) {
                    cells.byId[i].destroy(null, syncUpdStamp, cells);   // what the fuck is this
                }


            case 0x14: // clear my cells
                cells.mine = [];
                break;
            case 0x15: // draw line
                log.warn("got packer 0x15 (draw line) which is unsupported");
                break;
            case 0x20: // new cell
                cells.mine.push(reader.getUint32());
                break;
            case 0x30: // text list
                leaderboard.items = [];
                leaderboard.type = "text";

                var count = reader.getUint32();
                for (i = 0; i < count; ++i)
                    leaderboard.items.push(reader.getStringUTF8());
                drawLeaderboard();
                break;
            case 0x31: // ffa list
                leaderboard.items = [];
                leaderboard.type = "ffa";

                var count = reader.getUint32();
                for (i = 0; i < count; ++i)
                    leaderboard.items.push({
                        me: !!reader.getUint32(),
                        name: reader.getStringUTF8() || "An unnamed cell"
                    });
                drawLeaderboard();
                break;
            case 0x32: // pie chart
                leaderboard.items = [];
                leaderboard.type = "pie";


                var count = reader.getUint32();
                for (i = 0; i < count; ++i)
                    leaderboard.items.push(reader.getFloat32());
                drawLeaderboard();
                break;
            case 0x40: // set border
                border.left = reader.getFloat64();
                border.top = reader.getFloat64();
                border.right = reader.getFloat64();
                border.bottom = reader.getFloat64();
                border.width = border.right - border.left;
                border.height = border.bottom - border.top;
                border.centerX = (border.left + border.right) / 2;
                border.centerY = (border.top + border.bottom) / 2;
                if (data.data.byteLength === 33) break;
                if (!mapCenterSet) {
                    mapCenterSet = true;
                    cameraX = targetX = border.centerX;
                    cameraY = targetY = border.centerY;
                    cameraZ = targetZ = 1;
                }
                reader.getUint32(); // game type
                if (!/MultiOgar|OgarII/.test(reader.getStringUTF8()) || statsInterface.pingLoopId) break;
                statsInterface.pingloopid = setInterval(function () {
                    wsSend(UINT8_CACHE[254]);
                    statsInterface.pingLoopStamp = Date.now();
                }, 2000);
                break;
            case 0x45:
                leaderboard.items = [];
                leaderboard.type = "ffa";

                var count = reader.getUint32();
                for (i = 0; i < count; ++i)
                    leaderboard.items.push({
                        me: !!reader.getUint32(),
                        name: reader.getStringUTF8() || "An unnamed cell",
                        color: bytesToColor(reader.getUint8(), reader.getUint8(), reader.getUint8())
                    });
                drawLeaderboard();
                break;
            case 0x46:
                console.log("Minimap packet has arrived");
                minimapNodes.nodes = [];
                count = reader.getUint16();
                for (let i = 0; i < count; i++) {
                    minimapNodes.nodes.push({
                        x: reader.getInt32(),
                        y: reader.getInt32(),
                        color: bytesToColor(reader.getUint8(), reader.getUint8(), reader.getUint8()),
                        name: reader.getStringUTF8(),
                    })
                }
                let l = 4;
                break;
            case 0x63: // chat message
                var flags = reader.getUint8();
                var color = bytesToColor(reader.getUint8(), reader.getUint8(), reader.getUint8());

                var name = reader.getStringUTF8().trim();
                var reg = /\{([\w]+)\}/.exec(name);
                if (reg) name = name.replace(reg[0], "").trim();
                var message = reader.getStringUTF8();

                var server = !!(flags & 0x80),
                    admin = !!(flags & 0x40),
                    mod = !!(flags & 0x20);

                var wait = Math.max(5000, 1000 + message.length * 200);
                chat.waitUntil = syncUpdStamp - chat.waitUntil > 1000 ? syncUpdStamp + wait : chat.waitUntil + wait;
                chat.messages.push({
                    server: server,
                    admin: admin,
                    mod: mod,
                    color: color,
                    name: name,
                    message: message,
                    time: syncUpdStamp
                });
                drawChat();
                break;
            case 0xFE: // server stat
                let info = JSON.parse(reader.getStringUTF8()), latency = syncUpdStamp - statsInterface.pingLoopStamp;
                statsInterface.updateFromServer(latency, info, cells.length);

                break;
            default:
                // invalid packet
                wsCleanup();
                break;
        }
    }

    function sendMouseMove(x, y) {
        var writer = new Writer(true);
        writer.setUint8(0x10);
        writer.setUint32(x);
        writer.setUint32(y);
        writer._b.push(0, 0, 0, 0);
        wsSend(writer);
    }

    let randomName;
    /* This will generate a random name for us */
    const computeName = function () {
        return `Azma.io#${Math.floor((Math.random() * 1000) + 1)}`;
    };

    function sendPlay(inputName) {
        /* if inputName is "",null,or undefined then we check if we have a randomName compued for us */
        let name = inputName || (randomName ? randomName : randomName = computeName());

        log.debug("play trigger");
        var writer = new Writer(true);
        writer.setUint8(0x00);
        writer.setStringUTF8(name);
        wsSend(writer);
    }

    function sendSkin(input) {
        // Stop large urls from being sent
        if (!isValidURL(input)) return;
        if (input.toString().length > 100) return;
        log.debug("skinurl trigger");
        var writer = new Writer(true);
        writer.setUint8(0x69);
        writer.setStringUTF8(input);
        wsSend(writer);
    }

    function isValidURL(string) {
        var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
        return (res !== null)
    }

    function sendChat(text) {
        var writer = new Writer();
        writer.setUint8(0x63);
        writer.setUint8(0);
        writer.setStringUTF8(text);
        wsSend(writer);
    }

    function gameReset() {
        cleanupObject(cells);
        cleanupObject(border);
        cleanupObject(leaderboard);
        cleanupObject(chat);
        //todo emit gamereset so that everything can be cleaned up;
        //cleanupObject(x);


        chat.messages = [];
        leaderboard.items = [];
        cells.mine = [];
        cells.byId = {};
        cells.list = [];
        cameraX = cameraY = targetX = targetY = 0;
        cameraZ = targetZ = 1;
        mapCenterSet = false;
    }

    var cells = Object.create({
        mine: [],
        byId: {},
        list: [],
    });
    var border = Object.create({
        left: -2000,
        right: 2000,
        top: -2000,
        bottom: 2000,
        width: 4000,
        height: 4000,
        centerX: -1,
        centerY: -1
    });
    var minimapNodes = Object.create({
        nodes: []
        }
    );
    var leaderboard = Object.create({
        type: NaN,
        items: null,
        canvas: document.getElementById("leaderboardcanvas"),
        teams: ["#F33", "#3F3", "#33F"]
    });
    var chat = Object.create({
        messages: [],
        waitUntil: 0,
        canvas: document.createElement("canvas"),
        visible: false,
    });
    // var statsComponent = Object.create({
    //     framesPerSecond: 0,
    //     latency: NaN,
    //     supports: null,
    //     info: null,
    //     pingLoopId: NaN,
    //     pingLoopStamp: null,
    //     canvas: document.createElement("canvas"),
    //     visible: false,
    //     score: NaN,
    //     maxScore: 0
    // });

    var ws = null;
    var wsUrl = null;
    var disconnectDelay = 1000;

    var syncUpdStamp = Date.now();
    var syncAppStamp = Date.now();

    var mainCanvas = null;
    var mainCtx = null;
    var knownSkins = {};
    var loadedSkins = {};
    var escOverlayShown = false;
    var isTyping = false;
    var chatBox = null;
    var mapCenterSet = false;
    var cameraX = 0;
    var cameraY = 0;
    var cameraZ = 1;
    var cameraZInvd = 1;
    var targetX = 0;
    var targetY = 0;
    var targetZ = 1;
    var viewMult = 1;
    var mouseX = NaN;
    var mouseY = NaN;
    var mouseZ = 1;

    var settings = {
        mobile: "createTouch" in document,
        showMass: true,
        showNames: true,
        showLeaderboard: true,
        showChat: true,
        showGrid: true,
        showColor: true,
        showSkins: true,
        showMinimap: true,
        darkTheme: false,
        allowGETipSet: false,
        showBorder: true,
    };
    var pressed = {
        space: false,
        w: false,
        e: false,
        r: false,
        t: false,
        p: false,
        q: false,
        esc: false
    };

    if (null !== wHandle.localStorage) {
        wjQuery(window).on('load', function () {
            wjQuery(".save").each(function () {
                var id = wjQuery(this).data("box-id");
                var value = wHandle.localStorage.getItem("checkbox-" + id);
                if (value && value == "true" && 0 != id && 9 != id) {
                    wjQuery(this).prop("checked", "true");
                    wjQuery(this).trigger("change");
                } else if (id == 0 && value != null) {
                    wjQuery(this).val(value);
                } else if (id == 9 && value != null)
                    wjQuery(this).val(value);
            });
            wjQuery(".save").change(function () {
                var id = wjQuery(this).data("box-id");
                var value = (id == 0 || id == 9) ? wjQuery(this).val() : wjQuery(this).prop("checked");
                wHandle.localStorage.setItem("checkbox-" + id, value);
            });
        });
    }

    function hideESCOverlay() {
        escOverlayShown = false;
        wjQuery("#overlays").hide();
    }

    function showESCOverlay() {
        escOverlayShown = true;
        wjQuery("#overlays").fadeIn(0);
    }

    pubsub.subscribe(topics.showEscapeoverlay, showESCOverlay);

    function toCamera(ctx) {
        ctx.translate(mainCanvas.width / 2, mainCanvas.height / 2);
        scaleForth(ctx);
        ctx.translate(-cameraX, -cameraY);
    }

    function scaleForth(ctx) {
        ctx.scale(cameraZ, cameraZ);
    }

    function scaleBack(ctx) {
        ctx.scale(cameraZInvd, cameraZInvd);
    }

    function fromCamera(ctx) {
        ctx.translate(cameraX, cameraY);
        scaleBack(ctx);
        ctx.translate(-mainCanvas.width / 2, -mainCanvas.height / 2);
    }

    function drawChat() {
        if (chat.messages.length === 0 || !settings.showChat)
            return chat.visible = false;

        chat.visible = true;
        var canvas = chat.canvas;
        var ctx = canvas.getContext("2d");
        var latestMessages = chat.messages.slice(-15);
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
    }

    let previousMassdecay = 0;
    let index = 0;


    function prettyPrintTime(seconds) {
        seconds = ~~seconds;
        var minutes = ~~(seconds / 60);
        if (minutes < 1) return "<1 min";
        var hours = ~~(minutes / 60);
        if (hours < 1) return minutes + "min";
        var days = ~~(hours / 24);
        if (days < 1) return hours + "h";
        return days + "d";
    }

    function drawLeaderboard() {
        if (leaderboard.type === NaN) return leaderboard.visible = false;
        if (!settings.showNames || leaderboard.items.length === 0)
            return leaderboard.visible = false;
        leaderboard.visible = true;
        // var canvas = leaderboard.canvas;
        var canvas = document.getElementById('leaderboardcanvas');
        let lbctxt = canvas.getContext("2d");
        var len = leaderboard.items.length;

        canvas.width = 180;
        canvas.height = leaderboard.type !== "pie" ? 60 + 24 * len : 230;

        lbctxt.globalAlpha = .4;
        lbctxt.fillStyle = "#000";
        lbctxt.fillRect(0, 0, canvas.width, canvas.height);

        lbctxt.globalAlpha = 1;
        lbctxt.fillStyle = "yellow";
        lbctxt.font = "35px Ubuntu";
        lbctxt.fillText("Azma.io", 95 - lbctxt.measureText("Azma.io").width / 2, 45);

        if (leaderboard.type === "pie") {
            var last = 0;
            for (var i = 0; i < len; i++) {
                lbctxt.fillStyle = leaderboard.teams[i];
                lbctxt.beginPath();
                lbctxt.moveTo(100 - 7, 140);
                lbctxt.arc(100 - 7, 140, 80, last, (last += leaderboard.items[i] * PI_2), false);
                lbctxt.closePath();
                lbctxt.fill();
            }
        } else {
            var text, isMe = false, w, start;

            //How far away the the text is relative to the left side, bigger numbers, larger offset
            let textOffset = 30;
            lbctxt.font = "20px Ubuntu";
            for (var i = 0; i < len; i++) {
                if (leaderboard.type === "text")
                    text = leaderboard.items[i];
                else
                    text = leaderboard.items[i].name,
                        isMe = leaderboard.items[i].me;

                // replace {skin} with empty string
                var reg = /\{([\w]+)\}/.exec(text);
                if (reg) text = text.replace(reg[0], "").trim();

                //lbctxt.fillStyle = isMe ? "#FAA" : leaderboard.items[i].color;
                lbctxt.fillStyle = isMe ? "yellow" : leaderboard.items[i].color;
                text = (i + 1) + ". " + (text || "An unnamed cell");
                while (lbctxt.measureText(text).width > canvas.width - textOffset) {
                    text = text.substring(0, text.length - 1);
                }
                if (i == 0) lbctxt.drawImage(images.snake, 5, 52 + 24 * 8, 20, 20);
                if (i == 1) lbctxt.drawImage(images.fire, 5, 52, 20, 20);
                //what is the step value for the fire emoji?

                lbctxt.fillText(text, textOffset, 70 + 24 * i);
            }
        }
    }


    function drawBorders(ctx) {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 20;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(border.left, border.top);
        ctx.lineTo(border.right, border.top);
        ctx.lineTo(border.right, border.bottom);
        ctx.lineTo(border.left, border.bottom);
        ctx.closePath();
        ctx.stroke();
    }

    function drawGrid() {
        mainCtx.save();
        mainCtx.lineWidth = 1;
        mainCtx.strokeStyle = settings.darkTheme ? "#AAA" : "#000";
        mainCtx.globalAlpha = 0.1;
        var step = 50;
        let cW = mainCanvas.width;
        let cH = mainCanvas.height;
        let startLeft = (-cameraX + cW / cameraZ / 2) % step,
            startTop = (-cameraY + cH / cameraZ / 2) % step;
        startLeft = startLeft * cameraZ;
        startTop = startTop * cameraZ;
        step = step * cameraZ;

        mainCtx.beginPath();
        for (var i = startLeft; i < cW; i += step) {
            mainCtx.moveTo(~~i, 0);
            mainCtx.lineTo(~~i, ~~cH);
        }
        for (var i = startTop; i < cH; i += step) {
            mainCtx.moveTo(0, ~~i);
            mainCtx.lineTo(~~cW, ~~i);
        }
        mainCtx.closePath();
        mainCtx.stroke();
        mainCtx.restore();
    }

    function drawMinimap() {
        if (border.centerX !== 0 || border.centerY !== 0 || !settings.showMinimap)
            // scramble level 2+ makes the minimap unusable
            // and is detectable with a non-zero map center
            return;
        mainCtx.save();
        let offset = 10;
        var targetSize = 200;
        var width = targetSize * (border.width / border.height);
        var height = targetSize * (border.height / border.width);
        var beginX = mainCanvas.width / viewMult - width - offset;
        var beginY = mainCanvas.height / viewMult - height - offset;

        mainCtx.fillStyle = "#000";
        mainCtx.globalAlpha = 0.9;
        mainCtx.fillRect(beginX, beginY, width, height);
        mainCtx.globalAlpha = 1;
        //Offset relative to right side of window, how much spacing is between right side of map and right side of window.
        mainCtx.drawImage(images.minimap, beginX, beginY, width, height);

        mainCtx.fillStyle = settings.darkTheme ? "#666" : "#666";
        mainCtx.textBaseline = "middle";
        mainCtx.textAlign = "center";


        var myPosX = beginX + ((cameraX + border.width / 2) / border.width * width);
        var myPosY = beginY + ((cameraY + border.height / 2) / border.height * height);
        for (let i = 0; i < minimapNodes.nodes.length; i++) {
            let node = minimapNodes.nodes[i];
            let nodeX = beginX + (node.x + border.width / 2) / border.width * width;
            let nodeY = beginY + (node.y + border.height / 2) / border.height * height;
            mainCtx.fillStyle = node.color;
            mainCtx.beginPath();

            mainCtx.arc(nodeX, nodeY, 4, 0, PI_2, false);
            mainCtx.closePath();
            mainCtx.fill();
        }
        // draw name above user's pos if he has a cell on the screen
        var cell = null;
        for (var i = 0, l = cells.mine.length; i < l; i++)
            if (cells.byId.hasOwnProperty(cells.mine[i])) {
                cell = cells.byId[cells.mine[i]];
                break;
            }
        if (cell !== null) {
            mainCtx.fillStyle = settings.darkTheme ? "#DDD" : "#222";
            var textSize = 12;
            mainCtx.font = `${textSize}px Ubuntu`;
            mainCtx.fillText(cell.name, myPosX, myPosY - 7 - textSize / 2);
        }

        mainCtx.restore();
    }

    function drawGame() {
        //todo why is Statsstuff being updated here?
        //Frame is being updated
        pubsub.publish(topics.updateFPS);
        syncAppStamp = Date.now();

        //emit appStamp
        pubsub.publish(topics.syncAPPstamp, syncAppStamp);

        var drawList = cells.list.slice(0).sort(cellSort);
        for (var i = 0, l = drawList.length; i < l; i++)
            drawList[i].update(syncAppStamp, cells);
        cameraUpdate();
        if (SETTINGS.fancyGraphics) {
            Cell.updateQuadtree(cells, cameraZ, cameraX, cameraY);
            for (var i = 0, l = drawList.length; i < l; ++i) {
                var cell = drawList[i];
                cell.updateNumPoints(cameraZ);
                cell.movePoints(border);
            }
        }
        mainCtx.save();

        mainCtx.fillStyle = settings.darkTheme ? "#111" : "#F2FBFF";
        mainCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
        // drawBorders(mainCtx);
        if (settings.showGrid) drawGrid();
        //if(settings.showBorder) drawBorders(mainCtx);

        toCamera(mainCtx);
        drawBorders(mainCtx);

        let start = Date.now();
        for (var i = 0, l = drawList.length; i < l; i++)
            drawList[i].draw(mainCtx, cells);
        let end = Date.now();

        console.log(`Draw executation took ${end - start} ms with ${cells.list.length} cells `);

        fromCamera(mainCtx);
        mainCtx.scale(viewMult, viewMult);
        statsInterface.renderStats(mainCtx);

        if (leaderboard.visible)
            // mainCtx.drawImage(
            //     leaderboard.canvas,
            //     mainCanvas.width / viewMult - 10 - leaderboard.canvas.width,
            //     10);
            if (chat.visible || isTyping) {
                mainCtx.globalAlpha = isTyping ? 1 : Math.max(1000 - syncAppStamp + chat.waitUntil, 200) / 1000;
                mainCtx.drawImage(
                    chat.canvas,
                    10 / viewMult,
                    (mainCanvas.height - 55) / viewMult - chat.canvas.height
                );
                mainCtx.globalAlpha = 1;
            }
        drawMinimap();

        mainCtx.restore();
        pubsub.publish(topics.textCacheCleanup);
        wHandle.requestAnimationFrame(drawGame);
    }

    function cellSort(a, b) {
        return a.s === b.s ? a.id - b.id : a.s - b.s;
    }

    function cameraUpdate() {
        var myCells = [];
        for (var i = 0; i < cells.mine.length; i++)
            if (cells.byId.hasOwnProperty(cells.mine[i]))
                myCells.push(cells.byId[cells.mine[i]]);
        if (myCells.length > 0) {
            var x = 0,
                y = 0,
                s = 0,
                score = 0;
            for (var i = 0, l = myCells.length; i < l; i++) {
                var cell = myCells[i];
                score += ~~(cell.ns * cell.ns / 100);
                x += cell.x;
                y += cell.y;
                s += cell.s;
            }
            targetX = x / l;
            targetY = y / l;
            targetZ = Math.pow(Math.min(64 / s, 1), .4);
            cameraX += (targetX - cameraX) / 2;
            cameraY += (targetY - cameraY) / 2;
            //todo make a camera update (publish camera update, with a score)
            statsInterface.updateScore(score);
        } else {
            // x.score = NaN;
            // x.maxScore = 0;
            cameraX += (targetX - cameraX) / 9;
            cameraY += (targetY - cameraY) / 9;
        }
        cameraZ += (targetZ * viewMult * mouseZ - cameraZ) / 9;
        cameraZInvd = 1 / cameraZ;
    }

    function init() {
        mainCanvas = document.getElementById("canvas");
        mainCtx = mainCanvas.getContext("2d");
        chatBox = document.getElementById("chat_textbox");
        mainCanvas.focus();

        SETTINGS.init();
        textUtils.init();
        statsInterface.init();


        //load critical images
        syncLoadImages();

        function handleScroll(event) {
            mouseZ *= Math.pow(.9, event.wheelDelta / -120 || event.detail || 0);
            1 > mouseZ && (mouseZ = 1);
            mouseZ > 4 / mouseZ && (mouseZ = 4 / mouseZ);
        }

        if (/firefox/i.test(navigator.userAgent))
            document.addEventListener("DOMMouseScroll", handleScroll, false);
        else
            document.body.onmousewheel = handleScroll;
        wHandle.onkeydown = function (event) {
            switch (event.keyCode) {
                case 13: // enter
                    if (escOverlayShown) break;
                    if (!settings.showChat) break;
                    if (isTyping) {
                        chatBox.blur();
                        var chattxt = chatBox.value;
                        if (chattxt.length > 0) sendChat(chattxt);
                        chatBox.value = "";
                    } else chatBox.focus();
                    break;
                case 32: // space
                    if (isTyping || escOverlayShown || pressed.space) break;
                    wsSend(UINT8_CACHE[17]);
                    pressed.space = true;
                    break;
                case 87: // W
                    if (isTyping || escOverlayShown) break;
                    wsSend(UINT8_CACHE[21]);
                    pressed.w = true;
                    break;
                case 81: // Q
                    if (isTyping || escOverlayShown || pressed.q) break;
                    wsSend(UINT8_CACHE[18]);
                    pressed.q = true;
                    break;
                case 69: // E
                    if (isTyping || escOverlayShown || pressed.e) break;
                    wsSend(UINT8_CACHE[22]);
                    pressed.e = true;
                    break;
                case 82: // R
                    if (isTyping || escOverlayShown || pressed.r) break;
                    wsSend(UINT8_CACHE[23]);
                    pressed.r = true;
                    break;
                case 84: // T
                    if (isTyping || escOverlayShown || pressed.t) break;
                    wsSend(UINT8_CACHE[24]);
                    pressed.t = true;
                    break;
                case 80: // P
                    if (isTyping || escOverlayShown || pressed.p) break;
                    wsSend(UINT8_CACHE[25]);
                    pressed.p = true;
                    break;
                case 27: // esc
                    if (pressed.esc) break;
                    pressed.esc = true;
                    if (escOverlayShown) hideESCOverlay();
                    else showESCOverlay();
                    break;
            }
        };
        wHandle.onkeyup = function (event) {
            switch (event.keyCode) {
                case 32: // space
                    pressed.space = false;
                    break;
                case 87: // W
                    pressed.w = false;
                    break;
                case 81: // Q
                    if (pressed.q) wsSend(UINT8_CACHE[19]);
                    pressed.q = false;
                    break;
                case 69: // E
                    pressed.e = false;
                    break;
                case 82: // R
                    pressed.r = false;
                    break;
                case 84: // T
                    pressed.t = false;
                    break;
                case 80: // P
                    pressed.p = false;
                    break;
                case 27: // esc
                    pressed.esc = false;
                    break;
            }
        };
        chatBox.onblur = function () {
            isTyping = false;
            drawChat();
        };
        chatBox.onfocus = function () {
            isTyping = true;
            drawChat();
        };
        mainCanvas.onmousemove = function (event) {
            mouseX = event.clientX;
            mouseY = event.clientY;
        };
        setInterval(function () {
            // send mouse update
            sendMouseMove(
                (mouseX - mainCanvas.width / 2) / cameraZ + cameraX,
                (mouseY - mainCanvas.height / 2) / cameraZ + cameraY
            );
        }, 40);
        wHandle.onresize = function () {
            var cW = mainCanvas.width = wHandle.innerWidth,
                cH = mainCanvas.height = wHandle.innerHeight;
            viewMult = Math.sqrt(Math.min(cH / 1080, cW / 1920));
        };
        wHandle.onresize();
        log.info(`init done in ${Date.now() - LOAD_START}ms`);
        gameReset();
        showESCOverlay();

        if (settings.allowGETipSet && wHandle.location.search) {
            var div = /ip=([\w\W]+):([0-9]+)/.exec(wHandle.location.search.slice(1));
            if (div) wsInit(`${div[1]}:${div[2]}`);
        }

        window.requestAnimationFrame(drawGame);

    }

    wHandle.setserver = function (arg = 'backend.azma.io') {
        if (wsUrl === arg) return;
        wsInit(arg);
    };
    wHandle.setDarkTheme = function (a) {
        settings.darkTheme = a;
        //stats.drawStats();
        x.y();
    };
    wHandle.setShowMass = function (a) {
        settings.showMass = a;
    };
    wHandle.setSkins = function (a) {
        settings.showSkins = a;
    };
    wHandle.setColors = function (a) {
        settings.showColor = !a;
    };
    wHandle.setNames = function (a) {
        settings.showNames = a;
        drawLeaderboard();
    };
    wHandle.setChatHide = function (a) {
        settings.showChat = !a;
        drawChat();
    };
    wHandle.setMinimap = function (a) {
        settings.showMinimap = !a;

    };
    wHandle.spectate = function (a) {
        wsSend(UINT8_CACHE[1]);
        //todo emit that we are in spectatemode, so statscan upadte it's maxscore to 0;
        pubsub.publish(topics.spectateView);
        hideESCOverlay();
    };
    wHandle.toggleleaderboard = function () {
        //check if teammodefirst
        //send a special instruction to the server to toggle leaderboard positions
        wsSend(UINT8_CACHE[69]);
        console.log("I am printed");
    };
    wHandle.play = function (a, b) {
        sendPlay(a);
        sendSkin(b);
        hideESCOverlay();
    };
    wHandle.onload = init;
})(window, $);
