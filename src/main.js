"use strict";

// Globals
var canvas, ctx;
var gamestate = {
  turn: 0,
  tiles: [],
  moves: [[],[]],
  score: [0,0],
};

// Constants
const SEARCHDEPTH =   5;
const GRIDCOUNT   =   3;
const BOARDSIZE   = 600;
const TILESIZE    = BOARDSIZE / GRIDCOUNT;
const COLORS      = {
  grey:   "#DADFE1",
  orange: "#F39C12",
  purple: "#BF55EC",
};

/** Main -----------------------------------------------------------------------
    Runs the program when the window has loaded.

*/
window.onload = function () {
  setup();
  render();
};

/** setup ----------------------------------------------------------------------
    Sets up the canvas, tiles and the mouse click event handler.

*/
function setup() {
  canvas = document.getElementById("board");
  ctx    = canvas.getContext("2d");

  constructGrid();

  canvas.addEventListener("click", (e) => play(e), false);
}

/** Tile -----------------------------------------------------------------------
    Object that is used as squares in the game.

    @param {number} x The x position of the square.
    @param {number} y The y position of the square.
*/
function Tile(x, y) {
  this.x      =   x;
  this.y      =   y;
  this.player = -10;

  this.render = () => {
    switch (this.player) {
      case -10:
        ctx.fillStyle = COLORS.grey;
        break;
      case 0:
        ctx.fillStyle = COLORS.orange;
        break;
      case 1:
        ctx.fillStyle = COLORS.purple;
        break;
    }
    ctx.rect(this.x, this.y, TILESIZE, TILESIZE);
    ctx.fillRect(x, this.y, TILESIZE, TILESIZE);
    ctx.stroke();
  };
}

/** play -----------------------------------------------------------------------
    Controls and initiates a players move, then renders the move and runs the
    ai for counter-play.

    @param {event} e The click event.
*/
function play(e) {
  let player = gamestate.turn % 2;  // Player 0 (player) or 1 (ai).
  let index = getIndex(e);
  let tile  = gamestate.tiles[index.x][index.y];

  // Checks if the player is allowed to play the move.
  if (player !== 0 || tile.player !== -10) return;

  // Move is legal and is initiated.
  ++gamestate.turn;
  tile.player = player;

  // Check move consequence and render.
  updateMoves(gamestate, player, index);
  render();
  checkWin();

  // Run AI, check move consequence, and render.
    setTimeout(() => ai(), 300);
}

/** updateMoves ----------------------------------------------------------------
    Pushes a move into a FIFO list for the current player and pops the oldest
    move if the list exceeds a length of 3.

    @param {Object} state  The state of a game.
    @param {number} player The player that initiated the move.
    @param {Object} move   The move details. {score, x, y}.
*/
function updateMoves(state, player, move) {
  if (state.moves[player].push({x: move.x, y: move.y}) > 3) {
    let tile = state.moves[player].shift();
    state.tiles[tile.x][tile.y].player = -10;
  }
}

/** checkWin -------------------------------------------------------------------
    Validates the current state of the game and initiates a win if there is a
    winner.

*/
function checkWin() {
  let winner = validate(gamestate.tiles);
  if (winner !== -10) win(winner);
}

/** validate -------------------------------------------------------------------
    Validates a set of tiles and returns the winner if the tiles are in a
    winning position. (Otherwise returns -10).

    @param {Object[][]} tiles A set of Tile objects of a game state.
    @return {number} The winner if in winning position, else -10.
*/
function validate(tiles) {
  let winner = 0,  sum = 0,  i = 0,  k = 0;

  // If there are 3 of one player in a column.
  for (; i < GRIDCOUNT; ++i) {
    for (k = sum = 0; k < GRIDCOUNT; ++k) {
      sum += tiles[i][k].player;
    }
    winner = parseSum(sum);
    if (winner !== -10) return winner;
  }

  // If there are 3 of one player in a row.
  for (i = 0; i < GRIDCOUNT; ++i) {
    for (k = 0, sum = 0; k < GRIDCOUNT; ++k) {
      sum += tiles[k][i].player;
    }
    winner = parseSum(sum);
    if (winner !== -10) return winner;
  }

  // If there are 3 of one player in downwards diagonal.
  for (i = sum = 0; i < GRIDCOUNT; ++i) {
    sum += tiles[i][i].player;
  }
  winner = parseSum(sum);
  if (winner !== -10) return winner;

  // If there are 3 of one player in upwards diagonal.
  for (i = sum = 0; i < GRIDCOUNT; ++i) {
    sum += tiles[GRIDCOUNT-i-1][i].player;
  }
  winner = parseSum(sum);
  if (winner !== -10) return winner;

  // No winner.
  return -10;
}

/** parseSum -------------------------------------------------------------------
    Parses a sum of Tile.player and returns a player based on winning
    conditions.

    @param {number} sum The sum of a Tile row, column or diagonal.
    @return {number} The winner if in winning position, else -10.
*/
function parseSum(sum) {
  if      (sum === 3) return 1;
  else if (sum === 0) return 0;
  return -10;
}

/** win ------------------------------------------------------------------------
    initiates a win by resetting the game and providing the winner +1 score.

    @param {number} player The player that won the round.
*/
function win(player) {
  gamestate.moves = [[],[]];
  ++gamestate.score[player];
  setTimeout(() => {constructGrid(); render();}, 100);
}

/** constructGrid --------------------------------------------------------------
    Resets and constructs a grid of Tiles, then pushes it to the global game
    state.

*/
function constructGrid() {
  gamestate.tiles = [];
  for (let i = 0; i < GRIDCOUNT; ++i) {
    let column = [];
    for (let k = 0; k < GRIDCOUNT; ++k) {
      let tile = new Tile(i*TILESIZE, k*TILESIZE);
      column.push(tile);
    }
    gamestate.tiles.push(column);
  }
}

/** render ---------------------------------------------------------------------
    Controls and initiates all render functions.

*/
function render() {
  renderHTML();
  renderTiles();
}

/** renderHTML -----------------------------------------------------------------
    Renders all HTML DOM objects.

*/
function renderHTML() {
  document.getElementById("s1").innerHTML = gamestate.score[0];
  document.getElementById("s2").innerHTML = gamestate.score[1];
}

/** renderTiles ----------------------------------------------------------------
    Renders all tiles in the game state.

*/
function renderTiles() {
  gamestate.tiles.map(tiles => tiles.map(tile => tile.render()));
}

/** getIndex -------------------------------------------------------------------
    Parses the mouse position coordinates to grid index format and returns the
    indexes.

    @param {event} e The click event.
    @return {Object} The mouse position based on the grid index: {x, y}.
*/
function getIndex(e){
    let totalOffsetX   = 0;
    let totalOffsetY   = 0;
    let currentElement = canvas;

    do {
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    } while (currentElement = currentElement.offsetParent);

    let x = Math.floor( (event.pageX - totalOffsetX) / TILESIZE );
    let y = Math.floor( (event.pageY - totalOffsetY) / TILESIZE );

    return {x, y};
}

/** ai -------------------------------------------------------------------------
    initiates ai counter-play by gathering the best moves and playing one of
    them. The ai selects one of the moves randomly for more dynamic gameplay.

*/
function ai() {
  let bestMoves = getBestMove(gamestate, 0);
  let nextMove  = bestMoves[Math.floor(Math.random()*bestMoves.length)];
  let player = gamestate.turn % 2;

  // Move is initiated.
  ++gamestate.turn;
  gamestate.tiles[nextMove.x][nextMove.y].player = player;

  // Check move consequence and render.
  updateMoves(gamestate, player, nextMove);
  checkWin();
  render();

  // UNCOMMENT TO LET THE AI PLAY AGAINST ITSELF AFTER FIRST HUMAN MOVE.
    //setTimeout(() => ai(), 200);
}

/** getBestMove ----------------------------------------------------------------
    Recursive function that returns a set of moves with equal score if the
    search depth is 0. The function returns the best move when its in a search
    deeper than 0. The function runs through every possible game with
    (const)SEARCHDEPTH moves and calculates the score of each game with a
    exponential scoring formula. The formula emphasizes close consequences more
    than far consequences, and a loss is more valuable than a win.
    The algorithm chooses a path where it does not loose, and cherry picks the move
    that results in the best possibility for a win.

    @param s           The state of a game.
    @param depth       The current depth of a search.
    @return {Object}   (depth  > 0) The best move of the current path.
    @return {Object[]} (depth == 0) A set of the best possible moves.
*/
function getBestMove(s, depth) {
  let bestMove = {score:0, x:-1, y:-1};
  if (depth > SEARCHDEPTH) return bestMove; // Deepest point in the path.

  let x = 0, y = 0; // Itterators.
  let player = (s.turn+depth) % 2;    // Current player for this move.
  let gPlayer = (gamestate.turn) % 2; // Global current player.

  if (depth === 0 ) {
    // This is the root node, so we minimize the score and init the ret array.
    bestMove.score = Math.pow(4,SEARCHDEPTH)*-1;
    var bestMoves = [bestMove];

  } else {
    // This is somewhere in a path, so we validate the position.
    let winner = validate(s.tiles);

    // If there is a winner, return the move with a score based the formula.
    if      ( winner == gPlayer )     return {score:(Math.pow(2,(SEARCHDEPTH-depth)/2)), x, y};
    else if ( winner == +(!gPlayer) ) return {score:(Math.pow(3,(SEARCHDEPTH-depth))*-1), x, y};
  }

  // This is not a win/loss, so we extend the path.
  for (; x < GRIDCOUNT; ++x) {
    for (y = 0; y < GRIDCOUNT; ++y) {
      if (s.tiles[x][y].player !== -10) continue; // This tile is occupied... next.

      // This tile is not occupied, so we search this path.
      let state = JSON.parse(JSON.stringify(s));  // Immutable copy the state.

      state.tiles[x][y].player = player; // Play this move.

      updateMoves(state, player, {x,y}); // Check consequences.

      let move = getBestMove(state, depth+1); // Validate best path for this node.

      if (depth === 0) {
        // This is the root node, so we compare this move with the best one soo far.
        if (move.score > bestMove.score) {
          // This move is better than the current best, so we clear the previous
          //   entries and insert this move as the best one.
          bestMove = {score:move.score, x, y};
          bestMoves= [bestMove];
        } else if (move.score === bestMove.score) {
          // This move is equally as good as our current best, so we insert this move.
          bestMoves.push({score:move.score, x, y});
        }
      } else {
        // This is a possible play, so we score the play based on this move.
        bestMove.score += move.score;
      }
    }
  }
  if (depth === 0) return bestMoves; // This is the root node so we return the list.

  return bestMove; // This is a path so we return the best move for this path.
}
