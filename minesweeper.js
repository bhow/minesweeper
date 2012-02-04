Minesweeper = Ember.Application.create();

Minesweeper.Board = Em.Object.extend({
  tileArray : null,
  size: 0,
  
  // initialize board and tiles
  reset: function(size) {
    this.set('size', size);
    this.set('tileArray', new Array(size));
    
    for (var i=0; i<size; i++) {
      this.tileArray[i] = new Array(size);
      for (var j=0; j<size; j++) {
        var tile = Minesweeper.Tile.create();
        tile.addToBoard(i, j, this);
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
  }
});

Minesweeper.GameManager = Em.Object.extend({
  board: Minesweeper.Board.create(),
  startGame: function() {
    console.log("initing gamemanager");
    this.board.reset(16);
  }
});

Minesweeper.Tile = Em.Object.extend({
  covered: true, // content of this tile has not been exposed
  flagged: false, // user has flagged this as a bomb
  containsBomb: false,
  bombTouchCount: 0,
  row: 0,
  column: 0,
  board: null,
  
  addToBoard: function(row, column, board) {
    this.set('row', row);
    this.set('column', column);
    this.set('board', board);
    board.get('tileArray')[row][column] = this;
  },

  reveal: function() {
    if (containsBomb) {
      // boom - end game here
    }
    var surroundingTiles = this.get('board').getSurroundingTiles(this);
    var surroundingBombs = 0;
    for (var i=0; i < surroundingTiles.length; i++) {
      if (surroundingTiles[i].get('containsBomb')) {
        surroundingBombs += 1;
      }
    }
    this.set('bombTouchCount', surroundingBombs);
    if (surroundingBombs === 0) {
      //if there aren't any bombs we reveal everything around this tile
      for (var i=0; i < surroundingTiles.length; i++) {
        surroundingTiles[i].reveal();
      }
    }
  },
  flag: function() {
    if (this.covered) {
      this.set('flagged', true); 
    }
  }
});


var gameManager = Minesweeper.GameManager.create();
gameManager.startGame();
console.log(gameManager.get('board'));

// views
Minesweeper.SingleTileView = Ember.View.create({
  templateName: 'single-tile-view',
  click: function(evt) {
    alert("ClickableView was clicked!");
  }
});

Minesweeper.BoardView = Ember.View.create({
  templateName: 'board-view',
  board: gameManager.get('board')
});

Minesweeper.BoardView.append();

