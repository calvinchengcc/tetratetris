/// <reference path="jquery.d.ts" />
/// <reference path="lodash.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var TetraTetrisGame = (function () {
    function TetraTetrisGame() {
        this.BLOCK_SIZE = 25;
        this.FPS = 30;
        this.renderTimerID = null;
        this.TPS = 8;
        this.updateTimerID = null;
        this.BPS = 0.5;
        this.lastMoveTime = Date.now();
        this.state = new GameState();
        this.mainViewOffset = new Pos(50, 50);
        this.nextBlockOffset = new Pos(600, 50);
        this.holdQueueOffset = new Pos(600, 250);
        this._keysPressed = [];
        this._gameCanvas = document.getElementById("game-canvas");
        this.BG_IMG = new Image();
        this.BG_IMG.src = "images/tetris-bg.jpg";
        this.WIDTH = this._gameCanvas.width;
        this.HEIGHT = this._gameCanvas.height;
        this.ctx = this._gameCanvas.getContext("2d");
        this.initHandlers();
        this.render();
    }
    TetraTetrisGame.prototype.startGameLoop = function () {
        this.updateTimerID = this.updateTimerID ||
            setInterval(this.update.bind(this), 1000 / this.TPS);
        this.renderTimerID = this.renderTimerID ||
            setInterval(this.render.bind(this), 1000 / this.FPS);
    };
    TetraTetrisGame.prototype.haltGameLoop = function () {
        clearInterval(this.updateTimerID);
        this.updateTimerID = null;
        clearInterval(this.renderTimerID);
        this.renderTimerID = null;
    };
    TetraTetrisGame.prototype.togglePause = function () {
        if (this.renderTimerID == null) {
            console.log("Resuming game.");
            this.startGameLoop();
        }
        else {
            console.log("Game paused.");
            this.haltGameLoop();
        }
    };
    TetraTetrisGame.prototype.reset = function () {
        console.log("Resetting game...");
        clearInterval(this.renderTimerID);
        this.renderTimerID = null;
        this.state = new GameState();
        this.render();
    };
    TetraTetrisGame.prototype.update = function () {
        var _this = this;
        var stillAlive = this._keysPressed
            .every(function (key) { return _this.state.processInput(key); });
        if (Date.now() - this.lastMoveTime > 1000 / this.BPS) {
            stillAlive = stillAlive && this.state.forceAdvance();
            this.lastMoveTime = Date.now();
        }
        if (!stillAlive) {
            console.log("Game over!");
            $("#pause-game").prop("disabled", true);
            this.haltGameLoop();
            this.render();
        }
    };
    TetraTetrisGame.prototype.render = function () {
        this.renderHUD();
        this.renderGameState();
    };
    TetraTetrisGame.prototype.renderHUD = function () {
        var ctx = this.ctx;
        ctx.save();
        ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "lightgrey";
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "black";
        ctx.fillRect(this.mainViewOffset.x, this.mainViewOffset.y, 500, 500);
        ctx.fillRect(this.nextBlockOffset.x, this.nextBlockOffset.y, 150, 150);
        ctx.fillRect(this.holdQueueOffset.x, this.holdQueueOffset.y, 150, 150);
        ctx.fillStyle = "lightgrey";
        ctx.fillRect(600, 450, 150, 100);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.strokeRect(600, 450, 150, 100);
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "black";
        ctx.font = "18px Trebuchet MS";
        ctx.textBaseline = "top";
        ctx.fillText("Score", 610, 460);
        ctx.fillStyle = "white";
        ctx.fillText("Next Tetromino", this.nextBlockOffset.x + 10, this.nextBlockOffset.y + 10);
        ctx.fillText("Hold Queue", this.holdQueueOffset.x + 10, this.holdQueueOffset.y + 10);
        ctx.restore();
    };
    TetraTetrisGame.prototype.renderGameState = function () {
        this.renderNext();
        this.renderHold();
        this.renderBBox();
        this.renderBlocks();
        this.renderCurrent();
        this.renderScore();
        this.renderGameOver();
    };
    TetraTetrisGame.prototype.renderNext = function () {
        var tetromino = this.state.nextTetromino;
        if (tetromino != null) {
            var x = this.nextBlockOffset.x + 25;
            var y = this.nextBlockOffset.y + 45;
            this.renderTetromino(tetromino, new Pos(x, y));
        }
    };
    TetraTetrisGame.prototype.renderHold = function () {
        var tetromino = this.state.holdTetromino;
        if (tetromino != null) {
            var x = this.holdQueueOffset.x + 25;
            var y = this.holdQueueOffset.y + 45;
            this.renderTetromino(tetromino, new Pos(x, y));
        }
    };
    TetraTetrisGame.prototype.renderBBox = function () {
        var bBox = this.state.bBox;
        if (bBox.tl.x >= 0 && bBox.tl.y >= 0) {
            var ctx = this.ctx;
            ctx.save();
            ctx.strokeStyle = "lime";
            ctx.translate(this.mainViewOffset.x, this.mainViewOffset.y);
            ctx.scale(this.BLOCK_SIZE, this.BLOCK_SIZE);
            ctx.lineWidth = 1 / this.BLOCK_SIZE;
            ctx.strokeRect(bBox.tl.x, bBox.tl.y, bBox.width, bBox.height);
            ctx.restore();
        }
    };
    TetraTetrisGame.prototype.renderTetromino = function (tetromino, offset) {
        var _this = this;
        var ctx = this.ctx;
        ctx.save();
        tetromino.shape.forEach(function (row, j) {
            row.forEach(function (e, i) {
                if (e !== 0) {
                    var x = i * _this.BLOCK_SIZE + offset.x;
                    var y = j * _this.BLOCK_SIZE + offset.y;
                    ctx.fillStyle = Util.COLOURS[e];
                    ctx.fillRect(x, y, _this.BLOCK_SIZE, _this.BLOCK_SIZE);
                    ctx.strokeRect(x, y, _this.BLOCK_SIZE, _this.BLOCK_SIZE);
                }
            });
        });
        ctx.restore();
    };
    TetraTetrisGame.prototype.renderScore = function () {
        var ctx = this.ctx;
        ctx.save();
        ctx.font = "50px Trebuchet MS";
        ctx.textBaseline = "bottom";
        ctx.textAlign = "right";
        ctx.fillText(this.state.score + "", 740, 540);
        ctx.restore();
    };
    TetraTetrisGame.prototype.renderBlocks = function () {
        var ctx = this.ctx;
        var landed = this.state.landed;
        var offset = this.mainViewOffset;
        var BLOCK_SIZE = 25;
        ctx.save();
        landed.forEach(function (row, j) {
            row.forEach(function (e, i) {
                if (e !== 0) {
                    var x = i * BLOCK_SIZE + offset.x;
                    var y = j * BLOCK_SIZE + offset.y;
                    ctx.fillStyle = Util.COLOURS[e];
                    ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.strokeRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
                }
            });
        });
        ctx.restore();
    };
    TetraTetrisGame.prototype.renderCurrent = function () {
        var curr = this.state.currTetromino;
        var xOffset = curr.pos.x * this.BLOCK_SIZE + this.mainViewOffset.x;
        var yOffset = curr.pos.y * this.BLOCK_SIZE + this.mainViewOffset.y;
        var withoutOffScreen = curr.shape.map(function (row, j) {
            return row.map(function (e, i) {
                var x = i + curr.pos.x;
                var y = j + curr.pos.y;
                return (x.between(0, 19, true) && y.between(0, 19, true)) ? e : 0;
            });
        });
        this.renderTetromino(new Tetromino([withoutOffScreen]), new Pos(xOffset, yOffset));
    };
    TetraTetrisGame.prototype.renderGameOver = function () {
        if (this.state.gameOver) {
            var ctx = this.ctx;
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "black";
            var x = this.mainViewOffset.x;
            var y = this.mainViewOffset.y;
            var len = 500;
            ctx.fillRect(x, y, len, len);
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            var textX = x + len / 2;
            var textY = y + len / 2;
            ctx.font = "40px Trebuchet MS";
            ctx.fillText("Game Over!", textX, textY);
            ctx.restore();
        }
    };
    TetraTetrisGame.prototype.initHandlers = function () {
        var _this = this;
        $(document).ready(function () {
            $(document).keydown(function (e) {
                var keyCode = e.which || e.keyCode;
                if ([32, 37, 38, 39, 40].indexOf(keyCode) > -1) {
                    e.preventDefault();
                }
                var key = Util.toKey(keyCode);
                if (key != null && $.inArray(key, _this._keysPressed) === -1) {
                    _this._keysPressed.push(key);
                    console.log("Key(s) pressed: " + _this._keysPressed);
                }
            });
            $(document).keyup(function (e) {
                var keyCode = e.which || e.keyCode;
                var key = Util.toKey(keyCode);
                var index = _this._keysPressed.indexOf(key);
                if (index !== -1) {
                    _this._keysPressed.splice(index, 1);
                    console.log("Key released: " + key);
                }
            });
            $("#start-game").click(function () {
                $("#start-game").prop("disabled", true);
                $("#pause-game").prop("disabled", false);
                game.startGameLoop();
            });
            $("#pause-game").click(function () {
                game.togglePause();
            });
            $("#reset-game").click(function () {
                $("#start-game").prop("disabled", false);
                game.reset();
            });
        });
    };
    TetraTetrisGame.prototype.incBPS = function (amount) {
        this.BPS += amount;
    };
    return TetraTetrisGame;
}());
var GameState = (function () {
    function GameState() {
        this._nextDir = Dir.NW;
        this._holdTetromino = null;
        this._lastRotateTime = Date.now();
        this._switched = false;
        this._score = 0;
        this._gameOver = false;
        this.initLandedArr();
        this.genNextTetromino();
        this.spawnTetromino();
    }
    GameState.prototype.initLandedArr = function () {
        var AREA_LEN = GameState.AREA_LEN;
        this._landed = new Array(AREA_LEN);
        for (var i = 0; i < this._landed.length; i++) {
            this._landed[i] = new Array(AREA_LEN);
            for (var j = 0; j < this._landed[i].length; j++) {
                this._landed[i][j] = 0;
            }
        }
        this._landed[9][9] = 8;
        this._landed[9][10] = 8;
        this._landed[10][9] = 8;
        this._landed[10][10] = 8;
    };
    GameState.prototype.genNextTetromino = function () {
        var rand = Math.floor(Math.random() * 7) + 1;
        switch (rand) {
            case 1:
                this._nextTetromino = new ITetromino();
                break;
            case 2:
                this._nextTetromino = new JTetromino();
                break;
            case 3:
                this._nextTetromino = new LTetromino();
                break;
            case 4:
                this._nextTetromino = new ZTetromino();
                break;
            case 5:
                this._nextTetromino = new STetromino();
                break;
            case 6:
                this._nextTetromino = new OTetromino();
                break;
            case 7:
                this._nextTetromino = new TTetromino();
                break;
        }
    };
    GameState.prototype.swapWithHold = function () {
        if (!this._switched) {
            if (this._holdTetromino == null) {
                this._holdTetromino = this._nextTetromino;
                this.genNextTetromino();
            }
            _a = [this._holdTetromino, this._currTetromino], this._currTetromino = _a[0], this._holdTetromino = _a[1];
            this._currTetromino.setStartPos(Util.nextDir(this._nextDir, Rot.CCW));
            this._switched = true;
        }
        return true;
        var _a;
    };
    GameState.prototype.spawnTetromino = function () {
        this._currTetromino = this._nextTetromino;
        this._currTetromino.setStartPos(this._nextDir);
        this.fitBBox();
        this._switched = false;
        this._nextDir = Util.nextDir(this._nextDir, Rot.CW);
        this.genNextTetromino();
    };
    GameState.prototype.processInput = function (key) {
        switch (key) {
            case "up":
            case "left":
            case "right":
            case "down":
                var dir = Util.toDir(key);
                return this.advanceBlock(dir);
            case "z":
            case "x":
                var rot = Util.toRot(key);
                return this.rotateBlock(rot);
            case "shift":
                return this.swapWithHold();
            default:
                throw new Error("Input key not implemeneted");
        }
    };
    GameState.prototype.advanceBlock = function (dir) {
        var curr = this._currTetromino;
        var nextPos = curr.pos.translate(dir);
        if (this.inBBox(curr, nextPos)) {
            if (this.isValidPos(curr, nextPos)) {
                console.log("Moving block ahead.");
                curr.pos = nextPos;
                this.fitBBox();
                return true;
            }
            else {
                var success = this.landTetromino(curr);
                if (success) {
                    console.log("Tetromino landed.");
                    this._score += 10;
                    this.clearSquares();
                    game.incBPS(0.01);
                    this.spawnTetromino();
                    return true;
                }
                else {
                    console.log("Tetromino landed out of screen.");
                    this._gameOver = true;
                    return false;
                }
            }
        }
        else {
            return true;
        }
    };
    GameState.prototype.forceAdvance = function () {
        this.fitBBox();
        this._bBox = this._bBox.shrink();
        var dir = this._currTetromino.dirIntoBox(this._bBox);
        return this.advanceBlock(dir);
    };
    GameState.prototype.inBBox = function (curr, pos) {
        var pieceBox = curr.bBox.translate(pos);
        return pieceBox.containedIn(this._bBox);
    };
    GameState.prototype.isValidPos = function (curr, pos) {
        var _this = this;
        return curr.shape.every(function (row, j) {
            return row.every(function (e, i) {
                if (e === 0) {
                    return true;
                }
                var testPos = new Pos(i + pos.x, j + pos.y);
                return !_this.inGameArea(testPos) || _this.isClear(testPos);
            });
        });
    };
    GameState.prototype.inGameArea = function (pos) {
        var len = this._landed.length;
        var checkX = pos.x.between(0, len - 1, true);
        return checkX && pos.y.between(0, len - 1, true);
    };
    GameState.prototype.isClear = function (pos) {
        return this.landed[pos.y][pos.x] === 0;
    };
    GameState.prototype.landTetromino = function (tetromino) {
        var _this = this;
        var pos = tetromino.pos;
        return tetromino.shape.every(function (row, j) {
            return row.every(function (e, i) {
                if (e === 0) {
                    return true;
                }
                else {
                    var blockPos = new Pos(i + pos.x, j + pos.y);
                    if (_this.inGameArea(blockPos) && _this.isClear(blockPos)) {
                        _this.landed[blockPos.y][blockPos.x] = e;
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            });
        });
    };
    GameState.prototype.clearSquares = function () {
        var _this = this;
        var CLEAR_BASE_POINTS = 100;
        var getSquare = function (dist) {
            var square = {};
            var getRow = function (start, end, dir) {
                var row = [];
                for (var pos = start.translate(dir); !_.isEqual(pos, end); pos = pos.translate(dir)) {
                    row.push(pos);
                }
                return row;
            };
            square["NW"] = [new Pos(dist, dist)];
            square["NE"] = [new Pos(19 - dist, dist)];
            square["SW"] = [new Pos(dist, 19 - dist)];
            square["SE"] = [new Pos(19 - dist, 19 - dist)];
            square["N"] = getRow(square["NW"][0], square["NE"][0], Dir.E);
            square["W"] = getRow(square["NW"][0], square["SW"][0], Dir.S);
            square["E"] = getRow(square["NE"][0], square["SE"][0], Dir.S);
            square["S"] = getRow(square["SW"][0], square["SE"][0], Dir.E);
            return square;
        };
        var counter = 0;
        var _loop_1 = function(distFromEdge) {
            var square = getSquare(distFromEdge);
            console.log(square);
            var complete = _.flatten(_.valuesIn(square)).every(function (e) {
                return !_this.isClear(e);
            });
            if (complete) {
                var recMove_1 = function (dst, moveDir) {
                    var src = dst.translate(Util.reverseDir(moveDir));
                    if (_this.inGameArea(src)) {
                        _this._landed[dst.y][dst.x] = _this._landed[src.y][src.x];
                        recMove_1(src, moveDir);
                    }
                    else {
                        _this._landed[dst.y][dst.x] = 0;
                    }
                };
                var moveCorner = function (dst, moveDir) {
                    var dirs = [
                        Util.reverseDir((moveDir + 45).mod(360)),
                        Util.reverseDir((moveDir - 45).mod(360))
                    ];
                    for (var _i = 0, dirs_1 = dirs; _i < dirs_1.length; _i++) {
                        var dir = dirs_1[_i];
                        for (var pos = dst.translate(dir); pos.x.between(1, 18, true) && pos.y.between(1, 18, true); pos = pos.translate(dir)) {
                            recMove_1(pos, moveDir);
                        }
                    }
                    recMove_1(dst, Util.reverseDir(moveDir));
                };
                square["N"].forEach(function (p) { return recMove_1(p, Dir.S); });
                square["W"].forEach(function (p) { return recMove_1(p, Dir.E); });
                square["E"].forEach(function (p) { return recMove_1(p, Dir.W); });
                square["S"].forEach(function (p) { return recMove_1(p, Dir.N); });
                moveCorner(square["NW"][0], Dir.SE);
                moveCorner(square["NE"][0], Dir.SW);
                moveCorner(square["SW"][0], Dir.NE);
                moveCorner(square["SE"][0], Dir.NW);
                counter++;
                distFromEdge = 1;
            }
            out_distFromEdge_1 = distFromEdge;
        };
        var out_distFromEdge_1;
        for (var distFromEdge = 1; distFromEdge <= 8; distFromEdge++) {
            _loop_1(distFromEdge);
            distFromEdge = out_distFromEdge_1;
        }
        if (counter > 0) {
            this._score += CLEAR_BASE_POINTS << counter;
        }
        console.log("Done checking for cleared squares");
    };
    GameState.prototype.rotateBlock = function (rot) {
        if (Date.now() - this._lastRotateTime > GameState.ROTATE_DELAY) {
            var curr = this._currTetromino;
            curr.rotate(rot);
            if (this.isValidPos(curr, curr.pos)) {
                console.log("Rotating block " + Rot[rot]);
                this.fitBBox();
            }
            else {
                curr.undoRotate(rot);
            }
            this._lastRotateTime = Date.now();
        }
        return true;
    };
    GameState.prototype.fitBBox = function () {
        var curr = this._currTetromino;
        var box = new Box(new Pos(-3, -3), new Pos(23, 23));
        while (curr.containedIn(box)) {
            this._bBox = box;
            box = box.shrink();
        }
        return this._bBox;
    };
    Object.defineProperty(GameState.prototype, "score", {
        get: function () {
            return this._score;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameState.prototype, "landed", {
        get: function () {
            return this._landed;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameState.prototype, "bBox", {
        get: function () {
            return this._bBox;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameState.prototype, "currTetromino", {
        get: function () {
            return this._currTetromino;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameState.prototype, "nextTetromino", {
        get: function () {
            return this._nextTetromino;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameState.prototype, "holdTetromino", {
        get: function () {
            return this._holdTetromino;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameState.prototype, "gameOver", {
        get: function () {
            return this._gameOver;
        },
        enumerable: true,
        configurable: true
    });
    GameState.AREA_LEN = 20;
    GameState.ROTATE_DELAY = 200;
    return GameState;
}());
var Tetromino = (function () {
    function Tetromino(_rotations) {
        var _this = this;
        this._rotations = _rotations;
        this._rotation = 0;
        this._minX = Number.POSITIVE_INFINITY;
        this._maxX = Number.NEGATIVE_INFINITY;
        this._minY = Number.POSITIVE_INFINITY;
        this._maxY = Number.NEGATIVE_INFINITY;
        this._shape = this._rotations[0];
        this._rotations.forEach(function (rot) {
            rot.forEach(function (row, j) {
                row.forEach(function (e, i) {
                    if (e !== 0) {
                        _this._minX = Math.min(_this._minX, i);
                        _this._maxX = Math.max(_this._maxX, i);
                        _this._minY = Math.min(_this._minY, j);
                        _this._maxY = Math.max(_this._maxY, j);
                    }
                });
            });
        });
        var tl = new Pos(this._minX, this._minY);
        var br = new Pos(this._maxX + 1, this._maxY + 1);
        this._bBox = new Box(tl, br);
    }
    Object.defineProperty(Tetromino.prototype, "shape", {
        get: function () {
            return this._shape;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Tetromino.prototype, "pos", {
        get: function () {
            return this._pos;
        },
        set: function (pos) {
            this._pos = pos;
        },
        enumerable: true,
        configurable: true
    });
    Tetromino.prototype.rotate = function (rot) {
        switch (rot) {
            case Rot.CW:
                this._rotation = (this._rotation + 1).mod(4);
                break;
            case Rot.CCW:
                this._rotation = (this._rotation - 1).mod(4);
                break;
            default:
                throw new Error("Rotation not defined");
        }
        this._shape = this._rotations[this._rotation];
    };
    Tetromino.prototype.undoRotate = function (rot) {
        switch (rot) {
            case Rot.CW:
                return this.rotate(Rot.CCW);
            case Rot.CCW:
                return this.rotate(Rot.CW);
            default:
                throw new Error("Rotation not defined");
        }
    };
    Tetromino.prototype.setStartPos = function (dir) {
        switch (dir) {
            case Dir.NW:
                this._pos = new Pos(0 - this._maxX, 0 - this._maxY);
                break;
            case Dir.NE:
                this._pos = new Pos(19 - this._minX, 0 - this._maxY);
                break;
            case Dir.SE:
                this._pos = new Pos(19 - this._minX, 19 - this._minY);
                break;
            case Dir.SW:
                this._pos = new Pos(0 - this._maxX, 19 - this._minY);
                break;
            default:
                throw new Error("Direction not recognized.");
        }
        return this._pos;
    };
    Tetromino.prototype.dirIntoBox = function (box) {
        var a = this.bBoxWithOffset;
        var b = box;
        var moreN = a.tl.y < b.tl.y;
        var moreW = a.tl.x < b.tl.x;
        var moreE = a.br.x > b.br.x;
        var moreS = a.br.y > b.br.y;
        if (moreN && moreW) {
            return Dir.SE;
        }
        else if (moreN && moreE) {
            return Dir.SW;
        }
        else if (moreW && moreS) {
            return Dir.NE;
        }
        else if (moreE && moreS) {
            return Dir.NW;
        }
        else if (moreN) {
            return Dir.S;
        }
        else if (moreE) {
            return Dir.W;
        }
        else if (moreW) {
            return Dir.E;
        }
        else if (moreS) {
            return Dir.N;
        }
        else {
            throw new Error("Tetromino is already inside the box!");
        }
    };
    Tetromino.prototype.containedIn = function (box) {
        return this.bBoxWithOffset.containedIn(box);
    };
    Object.defineProperty(Tetromino.prototype, "bBox", {
        get: function () {
            return this._bBox;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Tetromino.prototype, "bBoxWithOffset", {
        get: function () {
            return this.bBox.translate(this._pos);
        },
        enumerable: true,
        configurable: true
    });
    return Tetromino;
}());
var ITetromino = (function (_super) {
    __extends(ITetromino, _super);
    function ITetromino() {
        var x = 1;
        _super.call(this, [[
                [0, 0, 0, 0],
                [x, x, x, x],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ], [
                [0, 0, x, 0],
                [0, 0, x, 0],
                [0, 0, x, 0],
                [0, 0, x, 0]
            ], [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [x, x, x, x],
                [0, 0, 0, 0]
            ], [
                [0, x, 0, 0],
                [0, x, 0, 0],
                [0, x, 0, 0],
                [0, x, 0, 0]
            ]]);
    }
    return ITetromino;
}(Tetromino));
var JTetromino = (function (_super) {
    __extends(JTetromino, _super);
    function JTetromino() {
        var x = 2;
        _super.call(this, [[
                [0, 0, x, 0],
                [0, 0, x, 0],
                [0, x, x, 0],
                [0, 0, 0, 0]
            ], [
                [0, x, 0, 0],
                [0, x, x, x],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ], [
                [0, 0, x, x],
                [0, 0, x, 0],
                [0, 0, x, 0],
                [0, 0, 0, 0]
            ], [
                [0, 0, 0, 0],
                [0, x, x, x],
                [0, 0, 0, x],
                [0, 0, 0, 0]
            ]]);
    }
    return JTetromino;
}(Tetromino));
var LTetromino = (function (_super) {
    __extends(LTetromino, _super);
    function LTetromino() {
        var x = 3;
        _super.call(this, [[
                [0, x, 0, 0],
                [0, x, 0, 0],
                [0, x, x, 0],
                [0, 0, 0, 0]
            ], [
                [0, 0, 0, 0],
                [x, x, x, 0],
                [x, 0, 0, 0],
                [0, 0, 0, 0]
            ], [
                [x, x, 0, 0],
                [0, x, 0, 0],
                [0, x, 0, 0],
                [0, 0, 0, 0]
            ], [
                [0, 0, x, 0],
                [x, x, x, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ]]);
    }
    return LTetromino;
}(Tetromino));
var ZTetromino = (function (_super) {
    __extends(ZTetromino, _super);
    function ZTetromino() {
        var x = 4;
        _super.call(this, [[
                [0, 0, 0, 0],
                [x, x, 0, 0],
                [0, x, x, 0],
                [0, 0, 0, 0]
            ], [
                [0, x, 0, 0],
                [x, x, 0, 0],
                [x, 0, 0, 0],
                [0, 0, 0, 0]
            ], [
                [x, x, 0, 0],
                [0, x, x, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ], [
                [0, 0, x, 0],
                [0, x, x, 0],
                [0, x, 0, 0],
                [0, 0, 0, 0]
            ]]);
    }
    return ZTetromino;
}(Tetromino));
var STetromino = (function (_super) {
    __extends(STetromino, _super);
    function STetromino() {
        var x = 5;
        _super.call(this, [[
                [0, 0, 0, 0],
                [0, 0, x, x],
                [0, x, x, 0],
                [0, 0, 0, 0]
            ], [
                [0, 0, 0, 0],
                [0, 0, x, 0],
                [0, 0, x, x],
                [0, 0, 0, x]
            ], [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, x, x],
                [0, x, x, 0]
            ], [
                [0, 0, 0, 0],
                [0, x, 0, 0],
                [0, x, x, 0],
                [0, 0, x, 0]
            ]]);
    }
    return STetromino;
}(Tetromino));
var OTetromino = (function (_super) {
    __extends(OTetromino, _super);
    function OTetromino() {
        var x = 6;
        var square = [[0, 0, 0, 0], [0, x, x, 0], [0, x, x, 0], [0, 0, 0, 0]];
        _super.call(this, [square, square, square, square]);
    }
    return OTetromino;
}(Tetromino));
var TTetromino = (function (_super) {
    __extends(TTetromino, _super);
    function TTetromino() {
        var x = 7;
        _super.call(this, [[
                [0, 0, 0, 0],
                [0, x, 0, 0],
                [x, x, x, 0],
                [0, 0, 0, 0]
            ], [
                [0, 0, 0, 0],
                [0, x, 0, 0],
                [0, x, x, 0],
                [0, x, 0, 0]
            ], [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [x, x, x, 0],
                [0, x, 0, 0]
            ], [
                [0, 0, 0, 0],
                [0, x, 0, 0],
                [x, x, 0, 0],
                [0, x, 0, 0]
            ]]);
    }
    return TTetromino;
}(Tetromino));
var Util = (function () {
    function Util() {
        throw new Error("Cannot instantiate Util class");
    }
    Util.toDir = function (dir) {
        switch (dir) {
            case "up":
                return Dir.N;
            case "left":
                return Dir.W;
            case "right":
                return Dir.E;
            case "down":
                return Dir.S;
            default:
                throw new Error("Direction invalid.");
        }
    };
    Util.toRot = function (rot) {
        switch (rot) {
            case "x":
                return Rot.CW;
            case "z":
                return Rot.CCW;
            default:
                throw new Error("Rotation invalid.");
        }
    };
    Util.nextDir = function (dir, rot) {
        return (dir + rot).mod(360);
    };
    Util.reverseDir = function (dir) {
        return (dir + 180) % 360;
    };
    Util.toKey = function (keyCode) {
        switch (keyCode) {
            case 37:
                return "left";
            case 38:
                return "up";
            case 39:
                return "right";
            case 40:
                return "down";
            case 88:
                return "x";
            case 90:
                return "z";
            case 16:
                return "shift";
            default:
                return null;
        }
    };
    Util.COLOURS = [null, "violet", "red", "orange", "gold", "green", "cyan", "purple", "white"];
    return Util;
}());
var Dir;
(function (Dir) {
    Dir[Dir["N"] = 0] = "N";
    Dir[Dir["NE"] = 45] = "NE";
    Dir[Dir["E"] = 90] = "E";
    Dir[Dir["SE"] = 135] = "SE";
    Dir[Dir["S"] = 180] = "S";
    Dir[Dir["SW"] = 225] = "SW";
    Dir[Dir["W"] = 270] = "W";
    Dir[Dir["NW"] = 315] = "NW";
})(Dir || (Dir = {}));
var Rot;
(function (Rot) {
    Rot[Rot["CW"] = 90] = "CW";
    Rot[Rot["CCW"] = -90] = "CCW";
})(Rot || (Rot = {}));
var Pos = (function () {
    function Pos(_x, _y) {
        this._x = _x;
        this._y = _y;
    }
    Object.defineProperty(Pos.prototype, "x", {
        get: function () {
            return this._x;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Pos.prototype, "y", {
        get: function () {
            return this._y;
        },
        enumerable: true,
        configurable: true
    });
    Pos.prototype.toTuple = function () {
        return [this._x, this._y];
    };
    Pos.prototype.translate = function (dir) {
        switch (dir) {
            case Dir.N:
                return new Pos(this.x, this.y - 1);
            case Dir.NW:
                return new Pos(this.x - 1, this.y - 1);
            case Dir.W:
                return new Pos(this.x - 1, this.y);
            case Dir.NE:
                return new Pos(this.x + 1, this.y - 1);
            case Dir.E:
                return new Pos(this.x + 1, this.y);
            case Dir.SE:
                return new Pos(this.x + 1, this.y + 1);
            case Dir.SW:
                return new Pos(this.x - 1, this.y + 1);
            case Dir.S:
                return new Pos(this.x, this.y + 1);
        }
    };
    return Pos;
}());
var Box = (function () {
    function Box(_tl, _br) {
        this._tl = _tl;
        this._br = _br;
        this._x = _tl.x;
        this._y = _tl.y;
        this._width = _br.x - _tl.x;
        this._height = _br.y - _tl.y;
    }
    Box.prototype.translate = function (pos) {
        var newTl = new Pos(this._tl.x + pos.x, this._tl.y + pos.y);
        var newBr = new Pos(this._br.x + pos.x, this._br.y + pos.y);
        return new Box(newTl, newBr);
    };
    Box.prototype.containedIn = function (box) {
        return this.tl.x >= box.tl.x
            && this.tl.y >= box.tl.y
            && this.br.x <= box.br.x
            && this.br.y <= box.br.y;
    };
    Box.prototype.contains = function (box) {
        return box.containedIn(this);
    };
    Box.prototype.touches = function (box) {
        var a = this;
        var b = box;
        return b.br.x >= a.tl.x
            && b.br.y >= a.tl.y
            && b.tl.x <= a.br.x
            && b.tl.y <= a.br.y;
    };
    Box.prototype.intersects = function (box) {
        var a = this;
        var b = box;
        return b.br.x > a.tl.x
            && b.br.y > a.tl.y
            && b.tl.x < a.br.x
            && b.tl.y < a.br.y;
    };
    Box.prototype.shrink = function () {
        if (_.isEqual(this._tl, this._br)) {
            throw new Error("Unable to shrink box");
        }
        return new Box(this._tl.translate(Dir.SE), this._br.translate(Dir.NW));
    };
    Object.defineProperty(Box.prototype, "tl", {
        get: function () {
            return this._tl;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Box.prototype, "br", {
        get: function () {
            return this._br;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Box.prototype, "x", {
        get: function () {
            return this._x;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Box.prototype, "y", {
        get: function () {
            return this._y;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Box.prototype, "width", {
        get: function () {
            return this._width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Box.prototype, "height", {
        get: function () {
            return this._height;
        },
        enumerable: true,
        configurable: true
    });
    return Box;
}());
Number.prototype.between = function (a, b, inc) {
    var min = Math.min(a, b);
    var max = Math.max(a, b);
    return inc ? min <= this && this <= max : min < this && this < max;
};
Number.prototype.mod = function (n) {
    return ((this % n) + n) % n;
};
var game = new TetraTetrisGame();
//# sourceMappingURL=tetratetris.js.map