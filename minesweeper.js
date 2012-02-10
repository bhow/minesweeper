/*
  Author: Brian How
*/

Array.prototype.contains = function(obj) {
  for (i in this) {
    if (this[i] === obj) return true;
  }
  return false;
}

Minesweeper = Ember.Application.create();

// models
Minesweeper.Board = Em.Object.extend({
  tileArray: null,
  size: 0,
  bombTileArray: null,  
  revealedTiles: new Array(),  
  flaggedTileCount: 0,  

  // initialize board
  reset: function(size, bombCount) {
    
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

  revealTile: function(tile) {
    if (!tile.get('hidden')) {
      return;
    }
    tile.set('hidden', false);
    this.get('revealedTiles').push(tile);
    if (tile.get('containsBomb')) {
      // boom - end game here
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

  toggleCheat: function() {
    var bombs = this.get('bombTileArray');
    for (var i=0; i < this.bombTileArray.length; i++) {
      bombs[i].set('peeking', !bombs[i].get('peeking'));
    }
  },
  
  checkWin: function() {
    var size = this.get('tileArray').length;
    var totalNonBombTiles = (size * size) - this.get('bombTileArray').length;
    if (totalNonBombTiles === revealedTiles.length) {
      return true;
    }
    return false;
  }
});

Minesweeper.Tile = Em.Object.extend({
  hidden: true, // content of this tile has not been exposed
  flagged: false, // user has flagged this as a bomb
  containsBomb: false,
  peeking: false, // user is cheating and can see underlying contents 
  bombTouchCount: 0,
  row: 0,
  column: 0,
  board: null,
  flag: function() {
    if (this.hidden) {
      this.set('flagged', !this.get('flagged')); 
    }
  },
  style: function() {
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
  }.property('hidden', 'flagged', 'containsBomb', 'bombTouchCount', 'peeking')
});

// controllers
Minesweeper.minesweeperController = Ember.Object.create({
  board: Minesweeper.Board.create(),
  gameOver: false,
  newBoardSize: 8,
  start: function() {
    this.board.reset(8, 10);
  },
  clickTile: function(tile) {
    if (!this.get('gameOver')) {
      this.board.revealTile(tile);
      if(this.board.checkWin()) {
        this.set('gameOver', true);
      }
    }
  },
  flagTile: function(tile) {
    if (!this.get('gameOver')) {
      tile.flag();
    }
  },
  toggleCheat: function() {
    if (!this.get('gameOver')) {
      this.board.toggleCheat();
    }
  },
  validate: function() {
    
  }
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
  tileArray: Minesweeper.minesweeperController.board.get('tileArray'),
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

Minesweeper.menuView = Ember.View.create({
  templateName: 'menu-view',
});
Minesweeper.menuView.append();

Minesweeper.boardView.append();

