var GROWTH = 1.1;

class Node {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.points = [];
        this.children = null;
    }

    containsPoint(point) {
        return point.x >= this.x && point.x <= this.x + this.w &&
            point.y >= this.y && point.y <= this.y + this.h;
    }

    overlaps(aabb) {
        return aabb.x < this.x + this.w && aabb.x + aabb.w > this.x &&
            aabb.y < this.y + this.h && aabb.y + aabb.h > this.y;
    }

    insert(point, maxPoints) {
        if (this.children != null) {
            var col = point.x > this.x + this.w / 2;
            var row = point.y > this.y + this.h / 2;
            this.children[col + row * 2].insert(point, maxPoints * GROWTH);
        } else {
            this.points.push(point);
            if (this.points.length > maxPoints && this.w > 1) {
                this.split(maxPoints);
            }
        }
    }

    some(aabb, test) {
        if (this.children != null) {
            for (var i = 0; i < this.children.length; ++i) {
                var child = this.children[i];
                if (child.overlaps(aabb) && child.some(aabb, test)) {
                    return true;
                }
            }
        } else {
            for (var i = 0; i < this.points.length; ++i) {
                var point = this.points[i];
                if (Node.prototype.containsPoint.call(aabb, point) &&
                    test(point)
                ) {
                    return true;
                }
            }
        }
        return false;
    }


    split(maxPoints) {
        this.children = [];
        var halfW = this.w / 2;
        var halfH = this.h / 2;
        for (var y = 0; y < 2; ++y) {
            for (var x = 0; x < 2; ++x) {
                var px = this.x + x * halfW;
                var py = this.y + y * halfH;
                this.children.push(new Node(px, py, halfW, halfH));
            }
        }
        var oldPoints = this.points;
        this.points = [];
        var midX = this.x + halfW;
        var midY = this.y + halfH;
        for (var i = 0; i < oldPoints.length; ++i) {
            var point = oldPoints[i];
            var col = point.x > midX;
            var row = point.y > midY;
            this.children[col + row * 2].insert(point, maxPoints * GROWTH);
        }
    }


    clear() {
        if (this.children != null) {
            for (var i = 0; i < 4; ++i) {
                this.children[i].clear();
            }
            this.children.length = 0;
            this.children = null;
        }
        this.points.length = 0;
        this.points = null;
    }
}

export default class PointQuadTree {
    constructor(x, y, w, h, maxPoints) {
        this.root = new Node(x, y, w, h);
        this.maxPoints = maxPoints;
    }

    clear() {
        this.root.clear();
    }

    insert(point) {
        if (!this.root.containsPoint(point)) return;
        this.root.insert(point, this.maxPoints);
    }

    some(aabb, test) {
        return this.root.some(aabb, test);
    }
};


