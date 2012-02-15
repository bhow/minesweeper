/*
* Author: Brian How
*/
// hack for jslint
var Ember = Ember;
var $ = $;
var document = document;

Array.prototype.contains = function (obj) {
    "use strict";
    var i;
    for (i in this) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
};

var gameStateEnum = {IN_PROGRESS: '', WON: 'You Win! :)', LOST: 'You Lose :('};

var Minesweeper = Ember.Application.create();

// models
Minesweeper.Board = Ember.Object.extend({
    tileArray: [],
    size: 0,
    bombTileArray: null,
    revealedTiles: [],
    gameState: gameStateEnum.IN_PROGRESS,
    bombsLeftToFlag: 0,

    // initialize board
    newGame: function (size, bombCount) {
        "use strict";
        var bombIndices, totalTiles, randomIndex, i, j, tile, position, createNewTileArray;
        this.set('gameState', gameStateEnum.IN_PROGRESS);
        // generate bomb positions
        bombIndices = [];
        totalTiles = size * size;
        while (bombIndices.length < bombCount) {
            randomIndex = (Math.floor(Math.random() * totalTiles));
            do {
                if (!bombIndices.contains(randomIndex)) {
                    bombIndices.push(randomIndex);
                }
                randomIndex = (Math.floor(Math.random() * totalTiles));
            } while (bombIndices.length < bombCount);
        }
        createNewTileArray = (this.get('size') !== size); //only create new array if board size has changed
        this.set('size', size);
        if (createNewTileArray) {
            this.set('tileArray', []);
        }
        this.set('bombTileArray', []);
        this.set('revealedTiles', []);
        this.set('bombsLeftToFlag', bombCount);
        // create tiles and set up bombs
        for (i = 0; i < size; i += 1) {
            if (createNewTileArray) {
                this.get('tileArray')[i] = [];
            }
            for (j = 0; j < size; j += 1) {
                if (createNewTileArray) {
                    tile = Minesweeper.Tile.create();
                } else {
                    tile = this.get('tileArray')[i][j];
                    tile.reset();
                }
                position = (i * size) + j;
                if (bombIndices.contains(position)) {
                    tile.set('containsBomb', true);
                    this.get('bombTileArray').push(tile);
                }
                this.addTileToBoard(i, j, tile);
            }
        }
    },

    addTileToBoard: function (row, column, tile) {
        "use strict";
        tile.set('row', row);
        tile.set('column', column);
        this.get('tileArray')[row][column] = tile;
    },

    loseGame: function () {
        "use strict";
        var i, flaggedTiles;
        this.set('gameState', gameStateEnum.LOST);
        for (i = 0; i < this.get('bombTileArray').length; i += 1) {
            if (!this.get('bombTileArray')[i].get('exploded')) {
                this.get('bombTileArray')[i].set('hidden', false);
            }
        }
        //mark wrongly flagged tiles
        flaggedTiles = this.findFlaggedTiles();
        flaggedTiles.forEach(function (tile) {
            tile.set('hidden', false);
        });
    },

    revealTile: function (tile) {
        "use strict";
        var surroundingTiles, surroundingBombs, i;
        if (this.get('gameState') !== gameStateEnum.IN_PROGRESS) {
            return;
        }
        if (!tile.get('hidden')) {
            return;
        }
        tile.set('hidden', false);
        if (tile.get('flagged')) {
            tile.set('flagged', false);
            this.set('bombsLeftToFlag', this.get('bombsLeftToFlag') + 1);
        }
        this.get('revealedTiles').push(tile);
        if (tile.get('containsBomb')) {
            // boom - end game here
            tile.set('exploded', true);
            this.loseGame();
            return;
        }
        surroundingTiles = this.getSurroundingTiles(tile);
        surroundingBombs = 0;
        for (i = 0; i < surroundingTiles.length; i += 1) {
            if (surroundingTiles[i].get('containsBomb')) {
                surroundingBombs += 1;
            }
        }
        tile.set('bombTouchCount', surroundingBombs);
        if (surroundingBombs === 0) {
            //if there aren't any bombs we reveal everything around this tile
            for (i = 0; i < surroundingTiles.length; i += 1) {
                this.revealTile(surroundingTiles[i]);
            }
        }
        this.checkWin();
    },

    // return array of surrounding tiles for given tile (max 8)
    getSurroundingTiles: function (tile) {
        "use strict";
        var row, column, surroundingTiles, onTopEdge, onBottomEdge, onLeftEdge, onRightEdge;
        row = tile.get('row');
        column = tile.get('column');
        surroundingTiles = [];

        onTopEdge = row === 0;
        onBottomEdge = row === this.size - 1;
        onLeftEdge = column === 0;
        onRightEdge = column === this.size - 1;

        if (!onTopEdge) {
            surroundingTiles.push(this.get('tileArray')[row - 1][column]);
            if (!onLeftEdge) {
                surroundingTiles.push(this.get('tileArray')[row - 1][column - 1]);
            }
            if (!onRightEdge) {
                surroundingTiles.push(this.get('tileArray')[row - 1][column + 1]);
            }
        }
        if (!onBottomEdge) {
            surroundingTiles.push(this.get('tileArray')[row + 1][column]);
            if (!onLeftEdge) {
                surroundingTiles.push(this.get('tileArray')[row + 1][column - 1]);
            }
            if (!onRightEdge) {
                surroundingTiles.push(this.get('tileArray')[row + 1][column + 1]);
            }
        }
        if (!onLeftEdge) {
            surroundingTiles.push(this.get('tileArray')[row][column - 1]);
        }
        if (!onRightEdge) {
            surroundingTiles.push(this.get('tileArray')[row][column + 1]);
        }
        return surroundingTiles;
    },
    flagTile: function (tile) {
        "use strict";
        if (this.get('gameState') !== gameStateEnum.IN_PROGRESS) {
            return;
        }
        if (tile.get('hidden')) {
            if (!tile.get('flagged')) {
                if (this.get('bombsLeftToFlag') > 0) {
                    tile.set('flagged', true);
                    this.set('bombsLeftToFlag', this.get('bombsLeftToFlag') - 1);
                }
            } else {
                tile.set('flagged', false);
                this.set('bombsLeftToFlag', this.get('bombsLeftToFlag') + 1);
            }
        }
    },
    toggleCheat: function () {
        "use strict";
        var bombs, i;
        if (this.get('gameState') !== gameStateEnum.IN_PROGRESS) {
            return;
        }
        bombs = this.get('bombTileArray');
        for (i = 0; i < bombs.length; i += 1) {
            bombs[i].set('peeking', !bombs[i].get('peeking'));
        }
    },
    checkWin: function () {
        "use strict";
        var size, totalNonBombTiles;
        size = this.get('tileArray').length;
        totalNonBombTiles = (this.get('size') * this.get('size')) - this.get('bombTileArray').length;
        if (totalNonBombTiles === this.get('revealedTiles').length) {
            this.set('gameState', gameStateEnum.WON);
        }
    },
    findFlaggedTiles : function () {
        "use strict";
        var flaggedTiles = [];
        this.get('tileArray').forEach(function (row) {
            row.forEach(function (tile) {
                if (tile.get('flagged')) {
                    flaggedTiles.push(tile);
                }
            });
        });
        return flaggedTiles;
    },
    validate: function () {
        "use strict";
        var flaggedTiles, i;
        flaggedTiles = this.findFlaggedTiles();
        for (i = 0; i < this.get('bombTileArray').length; i += 1) {
            if (!flaggedTiles.contains(this.get('bombTileArray')[i])) {
                this.loseGame();
                return;
            }
        }
        this.set('gameState', gameStateEnum.WON);
    }
});

Minesweeper.Tile = Ember.Object.extend({
    hidden: true, // content of this tile has not been exposed
    flagged: false, // user has flagged this as a bomb
    containsBomb: false,
    peeking: false, // user is cheating and can see underlying contents
    exploded: false,
    bombTouchCount: 0,
    row: 0,
    column: 0,

    reset: function () {
        "use strict";
        this.set('hidden', true);
        this.set('flagged', false);
        this.set('containsBomb', false);
        this.set('peeking', false);
        this.set('exploded', false);
        this.set('bombTouchCount', 0);
        this.set('row', 0);
        this.set('column', 0);
    },

    // computed css class for tile state
    style: function () {
        "use strict";
        var numbers;
        if (this.get('exploded')) {
            return "exploded";
        }
        if (this.get('hidden') && !this.get('peeking')) {
            if (this.get('flagged')) {
                return "flagged";
            } else {
                return "hidden";
            }
        }
        if (!this.get('hidden') && this.get('flagged') && !this.get('containsBomb')) {
            return "wrongFlag";
        }
        if (this.get('containsBomb')) {
            return "bomb";
        }
        if (this.get('bombTouchCount') === 0) {
            return "empty";
        }
        numbers = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"];
        return numbers[this.get('bombTouchCount')];
    }.property('hidden', 'flagged', 'containsBomb', 'bombTouchCount', 'peeking', 'exploded').cacheable(true)
});

Minesweeper.gameBoardSize = Ember.Object.extend({
    name: null,
    size: null
});
Minesweeper.difficulty = Ember.Object.extend({
    name: null,
    baseBombs: null
});

// controllers
Minesweeper.minesweeperController = Ember.Object.create({
    board: Minesweeper.Board.create(),
    newBoardSize: null,
    newBoardDifficulty: null,
    start: function () {
        "use strict";
        this.board.newGame(8, 10);
    },
    startCustom: function (boardSize, difficulty) {
        "use strict";
        this.board.newGame(boardSize, difficulty);
    },
    clickTile: function (tile) {
        "use strict";
        if (!tile.get('flagged')) {
            this.get('board').revealTile(tile);
        }
    },
    flagTile: function (tile) {
        "use strict";
        this.get('board').flagTile(tile);
    },
    toggleCheat: function () {
        "use strict";
        this.get('board').toggleCheat();
    },
    validate: function () {
        "use strict";
        this.get('board').validate();
    },
    newGame: function () {
        "use strict";
        var difficultyFactor, difficulty;
        difficultyFactor = (this.get('newBoardSize').size * this.get('newBoardSize').size) / 64; //base board is 8x8=64 tiles
        difficulty = this.get('newBoardDifficulty').get('baseBombs') * difficultyFactor;
        this.get('board').newGame(this.get('newBoardSize').size, difficulty);
    },
    sizes: Ember.ArrayProxy.create({content: [
        Minesweeper.gameBoardSize.create({name: 'Small (8x8)', size: 8}),
        Minesweeper.gameBoardSize.create({name: 'Medium (16x16)', size: 16}),
        Minesweeper.gameBoardSize.create({name: 'Large (32x32)', size: 32})]}),
    difficulties: Ember.ArrayProxy.create({content: [
        Minesweeper.difficulty.create({name: 'Normal', baseBombs: 10}),
        Minesweeper.difficulty.create({name: 'Hard', baseBombs: 15}),
        Minesweeper.difficulty.create({name: 'Expert', baseBombs: 20})]})
});


// views
Minesweeper.boardView = Ember.View.extend({
    templateName: 'board-view',
    boardBinding: 'Minesweeper.minesweeperController.board',
    tileArrayBinding: 'Minesweeper.minesweeperController.board.tileArray'
});

Minesweeper.TileView = Ember.View.extend({
    templateName: 'tile-view',
    tile: null,
    tileStyleBinding: 'this.tile.style',
    tileCommonStyle: 'tile',
    mouseDown: function (evt) {
        "use strict";
        if (evt.button === 0) {
            Minesweeper.minesweeperController.clickTile(this.tile);
        } else if (evt.button === 2) {
            Minesweeper.minesweeperController.flagTile(this.tile);
        }
    }
});

Minesweeper.minesweeperController.start();
var boardView = Minesweeper.boardView.create();
$(document).ready(function () {
    "use strict";
    boardView.append();
});
