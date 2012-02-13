/*
  Author: Brian How
*/

Array.prototype.contains = function(obj) {
  for (i in this) {
    if (this[i] === obj) return true;
  }
  return false;
}

var gameStateEnum = {IN_PROGRESS: '', WON: 'You win! :)', LOST: 'You lose :('}

Minesweeper = Ember.Application.create();

// models
Minesweeper.Board = Em.Object.extend({
  tileArray: null,
  size: 0,
  bombTileArray: null,  
  revealedTiles: new Array(),  
  gameState: gameStateEnum.IN_PROGRESS,  
  bombsLeftToFlag: 0,

  // initialize board
  reset: function(size, bombCount) {
    this.set('gameState', gameStateEnum.IN_PROGRESS);
    // generate bomb positions
    var bombIndices = new Array();
    var totalTiles = size * size;
    while (bombIndices.length < bombCount) {
      var randomIndex = (Math.floor(Math.random() * totalTiles));
      do {
        if (!bombIndices.contains(randomIndex)) { 
          bombIndices.push(randomIndex);
        }
        randomIndex = (Math.floor(Math.random() * totalTiles));
      } while (bombIndices.length < bombCount)
    }
    this.set('size', size);
    this.set('tileArray', new Array(size));
    this.set('bombTileArray', new Array());
    this.set('revealedTiles', new Array());
    this.set('bombsLeftToFlag', bombCount);
    // create tiles and set up bombs
    for (var i=0; i<size; i++) {
      this.tileArray[i] = new Array(size);
      for (var j=0; j<size; j++) {
        var tile = Minesweeper.Tile.create();
        var position = (i * size) + j;
        if (bombIndices.contains(position)) {
          tile.set('containsBomb', true);
          this.get('bombTileArray').push(tile);
        }
        this.addTileToBoard(i, j, tile);
      }
    }
  },
  
  addTileToBoard: function(row, column, tile) {
    tile.set('row', row);
    tile.set('column', column);
    this.get('tileArray')[row][column] = tile;
  },

  loseGame: function() {
      this.set('gameState', gameStateEnum.LOST);
      for (var i=0; i < this.get('bombTileArray').length; i++) {
        this.get('bombTileArray')[i].set('exploded', true);
      }
      //mark wrongly flagged tiles
      var flaggedTiles = this.findFlaggedTiles();
      flaggedTiles.forEach(function (tile) {
        tile.set('hidden', false);
      });
  },  

  revealTile: function(tile) {
    if (this.get('gameState') !== gameStateEnum.IN_PROGRESS) {
      return;
    }
    if (!tile.get('hidden')) {
      return;
    }
    tile.set('hidden', false);
    if (tile.get('flagged')) {
      this.set('bombsLeftToFlag', this.get('bombsLeftToFlag') + 1);
    }
    this.get('revealedTiles').push(tile);
    if (tile.get('containsBomb')) {
      // boom - end game here
      loseGame();
      return;
    }
    var surroundingTiles = this.getSurroundingTiles(tile);
    var surroundingBombs = 0;
    for (var i=0; i < surroundingTiles.length; i++) {
      if (surroundingTiles[i].get('containsBomb')) {
        surroundingBombs += 1;
      }
    }
    tile.set('bombTouchCount', surroundingBombs);
    if (surroundingBombs === 0) {
      //if there aren't any bombs we reveal everything around this tile
      for (var i=0; i < surroundingTiles.length; i++) {
        this.revealTile(surroundingTiles[i]);
      }
    }
    this.checkWin();
  },

  // return array of surrounding tiles for given tile (max 8)
  getSurroundingTiles: function(tile) {
    var row = tile.get('row');
    var column = tile.get('column');
    var surroundingTiles = new Array();

    var onTopEdge = row === 0;
    var onBottomEdge = row === this.size - 1;
    var onLeftEdge = column === 0;
    var onRightEdge = column === this.size - 1;

    if (!onTopEdge) {
      surroundingTiles.push(this.get('tileArray')[row-1][column]);
      if (!onLeftEdge) {
        surroundingTiles.push(this.get('tileArray')[row-1][column-1]);
      }
      if (!onRightEdge) {
        surroundingTiles.push(this.get('tileArray')[row-1][column+1]);
      }
    }
    if (!onBottomEdge) {
      surroundingTiles.push(this.get('tileArray')[row+1][column]);
      if (!onLeftEdge) {
        surroundingTiles.push(this.get('tileArray')[row+1][column-1]);
      }
      if (!onRightEdge) {
        surroundingTiles.push(this.get('tileArray')[row+1][column+1]);
      }
    }
    if (!onLeftEdge) {
      surroundingTiles.push(this.get('tileArray')[row][column-1]);
    }
    if (!onRightEdge) {
      surroundingTiles.push(this.get('tileArray')[row][column+1]);
    }
    return surroundingTiles;
  },
  flagTile: function(tile) {
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
  toggleCheat: function() {
    if (this.get('gameState') !== gameStateEnum.IN_PROGRESS) {
      return;
    }
    var bombs = this.get('bombTileArray');
    for (var i=0; i < this.bombTileArray.length; i++) {
      bombs[i].set('peeking', !bombs[i].get('peeking'));
    }
  },
  checkWin: function() {
    var size = this.get('tileArray').length;
    var totalNonBombTiles = (this.get('size') * this.get('size')) - this.get('bombTileArray').length;
    if (totalNonBombTiles === this.get('revealedTiles').length) {
      this.set('gameState', gameStateEnum.WON);
    }
  },
  findFlaggedTiles : function() {
    var flaggedTiles = new Array();
    this.get('tileArray').forEach(function(row) {
      row.forEach(function(tile) {
        if(tile.get('flagged')) {
          flaggedTiles.push(tile);
        }
      });
    });
    return flaggedTiles;
  },
  validate: function() {
    var flaggedTiles = this.findFlaggedTiles();
    for (var i=0; i<this.get('bombTileArray').length; i++) {
      if (!flaggedTiles.contains(this.get('bombTileArray')[i])) {
        this.loseGame();
        return; 
      }
    }
    this.set('gameState', gameStateEnum.WON); 
  }
});

Minesweeper.Tile = Em.Object.extend({
  hidden: true, // content of this tile has not been exposed
  flagged: false, // user has flagged this as a bomb
  containsBomb: false,
  peeking: false, // user is cheating and can see underlying contents
  exploded: false,
  bombTouchCount: 0,
  row: 0,
  column: 0,

  // computed css class for tile state
  style: function() {
    if (!this.get('hidden') && this.get('flagged') && !this.get('containsBomb')) {
      console.log("JEJE");
      return "wrongFlag";
    } 
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
    if (this.get('containsBomb')) {
      return "bomb";
    }
    if (this.get('bombTouchCount') === 0) {
      return "empty";
    }
    var numbers = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"];
    return numbers[this.get('bombTouchCount')];
  }.property('hidden', 'flagged', 'containsBomb', 'bombTouchCount', 'peeking', 'exploded')
});

// controllers
Minesweeper.minesweeperController = Ember.Object.create({
  board: Minesweeper.Board.create(),
  newBoardSize: 8,
  start: function() {
    this.board.reset(8, 10);
  },
  startCustom: function(boardSize, difficulty) {
  },
  clickTile: function(tile) {
    this.get('board').revealTile(tile);
  },
  flagTile: function(tile) {
    this.get('board').flagTile(tile);
  },
  toggleCheat: function() {
    this.get('board').toggleCheat();
  },
  validate: function() {
    this.get('board').validate();
  },
  newGame: function() {
    this.get('board').reset(8, 10);
  },
  sizes: Ember.ArrayProxy.create({content:[{name:'Small (8x8)', size: 8},
          {name:'Medium (16x16)', size: 16},
          {name: 'Large (32x32)', size: 32}]})
});

Minesweeper.gameOptionsController = Ember.ArrayController.create({
  content: [Ember.Object.create({name:'Small (8x8)', size: 8}),
                        Ember.Object.create({name:'Small (8x8)', size: 16}),
                        Ember.Object.create({name:'Small (8x8)', size: 16})]
});

Minesweeper.minesweeperController.start();

// views
Minesweeper.boardView = Ember.View.create({
  templateName: 'board-view',
  boardBinding: 'Minesweeper.minesweeperController.board',
});

Minesweeper.TileView = Ember.View.extend({
  templateName: 'tile-view',
  tile: null,
  tileStyleBinding: 'this.tile.style',
  tileCommonStyle: 'tile',
  mouseDown: function(evt) {
    if (evt.button === 0) {
      Minesweeper.minesweeperController.clickTile(this.tile);
    } else if (evt.button === 2) {
      Minesweeper.minesweeperController.flagTile(this.tile);
    }
  },
});

Minesweeper.boardView.append();

