import {colorToBytes, darkenColor, bytesToColor, PI_2, log, topics, pubsub} from "./utils";
import textUtils from "./textcache";
import settings from "./settings";
import PointQuadTree from "./quadtree";


export default class Cell {
    static syncAppstamp = Date.now();
    destroyed = false;
    id = 0;
    diedBy = 0;
    ox = 0;
    x = 0;
    nx = 0;
    oy = 0;
    y = 0;
    ny = 0;
    os = 0;
    s = 0;
    ns = 0;
    nameSize = 0;
    drawNameSize = 0;
    color = "#FFF";
    sColor = "#E5E5E5";
    skin = null;
    jagged = false;
    born = null;
    updated = null;
    dead = null; // timestamps

    constructor(id, x, y, s, name, color, skin, flags, syncUpdStamp) {
        this.id = id;
        this.x = this.nx = this.ox = x;
        this.y = this.ny = this.oy = y;
        this.s = this.ns = this.os = s;
        this.setColor(color);
        this.setName(name);
        this.setSkin(skin);
        this.jagged = flags & 0x01 || flags & 0x10;
        this.ejected = !!(flags & 0x20);
        this.born = syncUpdStamp;
        this.points = [];
        this.pointsVel = [];
    }

    static init() {
        pubsub.subscribe(topics.syncAPPstamp, function (data) {
            syncAppStamp = data;
        });
    }

    destroy(killerId, syncUpdStamp, cells) {
        delete cells.byId[this.id];
        if (cells.mine.remove(this.id) && cells.mine.length === 0) pubsub.publish(topics.showEscapeoverlay);
        this.destroyed = true;
        this.dead = syncUpdStamp;
        if (killerId && !this.diedBy)
            this.diedBy = killerId;
    }

    update(relativeTime, cells) {
        var dt = (relativeTime - this.updated) / 120;
        dt = Math.max(Math.min(dt, 1), 0);
        if (this.destroyed && Date.now() > this.dead + 200)
            cells.list.remove(this);
        else if (this.diedBy && cells.byId.hasOwnProperty(this.diedBy)) {
            this.nx = cells.byId[this.diedBy].x;
            this.ny = cells.byId[this.diedBy].y;
        }
        this.x = this.ox + (this.nx - this.ox) * dt;
        this.y = this.oy + (this.ny - this.oy) * dt;
        this.s = this.os + (this.ns - this.os) * dt;
        this.nameSize = ~~(~~(Math.max(~~(0.3 * this.ns), 24)) / 3) * 3;
        this.drawNameSize = ~~(~~(Math.max(~~(0.3 * this.s), 24)) / 3) * 3;
    }

    setName(value) {
        var nameSkin = /\{([\w\W]+)\}/.exec(value);
        if (this.skin === null && nameSkin !== null) {
            this.name = value.replace(nameSkin[0], "").trim();
            this.setSkin(nameSkin[1]);
        } else this.name = value;
    }

    updateNumPoints() {
        var numPoints = this.s * cameraZ | 0;
        numPoints = Math.max(numPoints, CELL_POINTS_MIN);
        numPoints = Math.min(numPoints, CELL_POINTS_MAX);
        if (this.jagged) numPoints = VIRUS_POINTS;
        while (this.points.length > numPoints) {
            var i = Math.random() * this.points.length | 0;
            this.points.splice(i, 1);
            this.pointsVel.splice(i, 1);
        }
        if (this.points.length == 0 && numPoints != 0) {
            this.points.push({
                x: this.x,
                y: this.y,
                rl: this.s,
                parent: this
            });
            this.pointsVel.push(Math.random() - 0.5);
        }
        while (this.points.length < numPoints) {
            var i = Math.random() * this.points.length | 0;
            var point = this.points[i];
            var vel = this.pointsVel[i];
            this.points.splice(i, 0, {
                x: point.x,
                y: point.y,
                rl: point.rl,
                parent: this
            });
            this.pointsVel.splice(i, 0, vel);
        }
    }

    movePoints() {
        var pointsVel = this.pointsVel.slice();
        var len = this.points.length;
        for (var i = 0; i < len; ++i) {
            var prevVel = pointsVel[(i - 1 + len) % len];
            var nextVel = pointsVel[(i + 1) % len];
            var newVel = (this.pointsVel[i] + Math.random() - 0.5) * 0.7;
            newVel = Math.max(Math.min(newVel, 10), -10);
            this.pointsVel[i] = (prevVel + nextVel + 8 * newVel) / 10;
        }
        for (var i = 0; i < len; ++i) {
            var curP = this.points[i];
            var curRl = curP.rl;
            var prevRl = this.points[(i - 1 + len) % len].rl;
            var nextRl = this.points[(i + 1) % len].rl;
            var self = this;
            var affected = quadtree.some({
                x: curP.x - 5,
                y: curP.y - 5,
                w: 10,
                h: 10
            }, function (item) {
                return item.parent != self && sqDist(item, curP) <= 25;
            });
            if (!affected &&
                (curP.x < border.left || curP.y < border.top ||
                    curP.x > border.right || curP.y > border.bottom)) {
                affected = true;
            }
            if (affected) {
                this.pointsVel[i] = Math.min(this.pointsVel[i], 0);
                this.pointsVel[i] -= 1;
            }
            curRl += this.pointsVel[i];
            curRl = Math.max(curRl, 0);
            curRl = (9 * curRl + this.s) / 10;
            curP.rl = (prevRl + nextRl + 8 * curRl) / 10;

            var angle = 2 * Math.PI * i / len;
            var rl = curP.rl;
            if (this.jagged && i % 2 == 0) {
                rl += 5;
            }
            curP.x = this.x + Math.cos(angle) * rl;
            curP.y = this.y + Math.sin(angle) * rl;
        }
    }

    setSkin(value) {
        this.skin = (value && value[0] === "%" ? value.slice(1) : value) || this.skin;
        if (this.skin === null || !knownSkins.hasOwnProperty(this.skin) || loadedSkins[this.skin])
            return;
        loadedSkins[this.skin] = new Image();
        loadedSkins[this.skin].src = `${SKIN_URL}${this.skin}.png`;
    }

    setColor(value) {
        if (!value) {
            log.warn("got no color");
            return;
        }
        this.color = value;
        this.sColor = darkenColor(value);
    }

    draw(ctx, cells) {
        ctx.save();
        this.drawShape(ctx);
        this.drawText(ctx, cells);
        ctx.restore();
    }

    drawShape(ctx) {
        ctx.fillStyle = this.color;
        /* Do not add stroke to pellets, they will performace */
        ctx.strokeStyle = this.sColor;

        if (settings.fancyGraphics) {
            ctx.lineWidth = Math.max(~~(this.s / 50), 10);
        }

        if (this.destroyed)
            ctx.globalAlpha = Math.max(120 - Date.now() + this.dead, 0) / 120;
        else
            ctx.globalAlpha = Math.min(Date.now() - this.born, 120) / 120;

        if (!this.ejected && 20 < this.s)
            this.s -= ctx.lineWidth / 2 - 2;

        if (settings.fancyGraphics && this.points.length) {
            ctx.beginPath();
            var point = this.points[0];
            ctx.moveTo(point.x, point.y);
            for (var i = 0; i < this.points.length; ++i) {
                var point = this.points[i];
                ctx.lineTo(point.x, point.y);
            }
            ctx.closePath();
            ctx.fill();
        } else if (this.jagged) {
            this.drawVirus(ctx, this.x, this.y, this.s, ctx.fillStyle, ctx.strokeStyle);
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.s, 0, PI_2, false);
            ctx.fill();
        }

        if (settings.showSkins && this.skin) {
            var skin = loadedSkins[this.skin];
            if (skin && skin.complete && skin.width && skin.height) {
                ctx.save();
                ctx.clip();
                scaleBack(ctx);
                var sScaled = this.s * cameraZ;
                ctx.drawImage(skin,
                    this.x * cameraZ - sScaled,
                    this.y * cameraZ - sScaled,
                    sScaled *= 2, sScaled);
                scaleForth(ctx);
                ctx.restore();
            }
        }
        if (!this.ejected && 20 < this.s)
            this.s += ctx.lineWidth / 2 - 2;
    }

    drawVirus(mainCtx, x, y, s, fill, stroke) {
        var size = Math.ceil(s / 100) * 100;
        var hash = size + fill + stroke;
        var virus = cacheVirus[hash];
        if (!virus) {
            var canvas = document.createElement("canvas");
            canvas.width = canvas.height = 2 * size;
            var ctx = canvas.getContext("2d");
            var incremental = PI_2 / VIRUS_POINTS;
            ctx.fillStyle = fill;
            ctx.strokeStyle = stroke;
            ctx.lineJoin = "miter";
            ctx.lineWidth = size / 20;
            ctx.beginPath();
            ctx.moveTo(size, 2 * size - ctx.lineWidth);
            for (var i = 1; i < VIRUS_POINTS; i++) {
                var angle = i * incremental;
                var dist = size - ctx.lineWidth - 6 + (i % 2 === 0) * 6;
                ctx.lineTo(
                    size + dist * Math.sin(angle),
                    size + dist * Math.cos(angle)
                )
            }
            ctx.lineTo(size, 2 * size - ctx.lineWidth);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            virus = cacheVirus[hash] = {
                canvas: canvas,
                accessTime: syncAppStamp,
                size: size
            }
        }
        mainCtx.drawImage(virus.canvas, x - s, y - s, virus.canvas.width * s / virus.size, virus.canvas.height * s / virus.size);
    }

    drawText(ctx, cells) {
        textUtils.firstdrawText(ctx, cells, this);
    }
}