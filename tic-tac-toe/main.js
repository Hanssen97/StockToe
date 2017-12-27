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
const SEARCHDEPTH =   6;
const GRIDCOUNT   =   3;
const BOARDSIZE   = 600;
const TILESIZE    = BOARDSIZE / GRIDCOUNT;
const COLORS      = {
  grey:   "#DADFE1",
  orange: "#F39C12",
  purple: "#BF55EC",
};


// Main -----------------------------------------------------------------------
window.onload = function () {
  setup();
  render();
};


// setup ----------------------------------------------------------------------
function setup() {
  canvas = document.getElementById("board");
  ctx    = canvas.getContext("2d");

  constructGrid();

  canvas.addEventListener("click", (e) => play(e), false);
}


// Tile -----------------------------------------------------------------------
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


// play -----------------------------------------------------------------------
function play(e) {
  let player = gamestate.turn % 2;
  let index = getIndex(e);
  let tile  = gamestate.tiles[index.x][index.y];

  if (player !== 0 || tile.player !== -10) return;

  ++gamestate.turn;
  tile.player = player;

  updateMoves(gamestate, player, index);

  render();
  checkWin();

  setTimeout(() => {
    ai();
    checkWin();

    render();
  }, 300);
}


// updateMoves ----------------------------------------------------------------
function updateMoves(state, player, move) {
  if (state.moves[player].push({x: move.x, y: move.y}) > 3) {
    let tile = state.moves[player].shift();
    state.tiles[tile.x][tile.y].player = -10;
  }
}


// checkWin -------------------------------------------------------------------
function checkWin() {
  let winner = validate(gamestate.tiles);
  if (winner !== -10) win(winner);
}


// Validate -------------------------------------------------------------------
function validate(tiles) {
  let winner = 0,  sum = 0,  i = 0,  k = 0;

  for (; i < GRIDCOUNT; ++i) {
    for (k = sum = 0; k < GRIDCOUNT; ++k) {
      sum += tiles[i][k].player;
    }
    winner = parseSum(sum);
    if (winner !== -10) return winner;
  }

  for (i = 0; i < GRIDCOUNT; ++i) {
    for (k = 0, sum = 0; k < GRIDCOUNT; ++k) {
      sum += tiles[k][i].player;
    }
    winner = parseSum(sum);
    if (winner !== -10) return winner;
  }

  for (i = sum = 0; i < GRIDCOUNT; ++i) {
    sum += tiles[i][i].player;
  }
  winner = parseSum(sum);
  if (winner !== -10) return winner;

  for (i = sum = 0; i < GRIDCOUNT; ++i) {
    sum += tiles[GRIDCOUNT-i-1][i].player;
  }
  winner = parseSum(sum);
  if (winner !== -10) return winner;

  return -10;
}


// parseSum -------------------------------------------------------------------
function parseSum(sum) {
  if      (sum === 3) return 1;
  else if (sum === 0) return 0;

  return -10;
}


// win ------------------------------------------------------------------------
function win(player) {
  gamestate.moves = [[],[]];
  ++gamestate.score[player];
  setTimeout(() => {constructGrid(); render();}, 200);
}


// constructGrid --------------------------------------------------------------
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


// render ---------------------------------------------------------------------
function render() {
  renderHTML();
  renderTiles();
}
// renderHTML -----------------------------------------------------------------
function renderHTML() {
  document.getElementById("s1").innerHTML = gamestate.score[0];
  document.getElementById("s2").innerHTML = gamestate.score[1];
}
// renderTiles ----------------------------------------------------------------
function renderTiles() {
  gamestate.tiles.map(tiles => tiles.map(tile => {
      tile.render();
  }));
}


// getIndex -------------------------------------------------------------------
function getIndex(e){
    let totalOffsetX   = 0;
    let totalOffsetY   = 0;
    let currentElement = canvas;

    do {
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    } while (currentElement = currentElement.offsetParent);

    let canvasX = Math.floor( (event.pageX - totalOffsetX) / TILESIZE );
    let canvasY = Math.floor( (event.pageY - totalOffsetY) / TILESIZE );

    return {x:canvasX, y:canvasY};
}


// ai -------------------------------------------------------------------------
function ai() {
  let nextMoves = getBestMove(gamestate, 0);
  let nextMove  = nextMoves[Math.floor(Math.random()*nextMoves.length)];

  let tile   = gamestate.tiles[nextMove.x][nextMove.y];
  let player = gamestate.turn % 2;

  tile.player = player;
  ++gamestate.turn;

  updateMoves(gamestate, player, nextMove);
}


// getBestMove ----------------------------------------------------------------
function getBestMove(s, depth) {
  let bestMove = {score:0, x:-1, y:-1};
  if (depth > SEARCHDEPTH) return bestMove;

  let x = 0, y = 0;
  let player = (s.turn+depth) % 2;
  let bestMoves = [bestMove];

  if (depth === 0 ) {
    bestMove.score = -1000000;
  } else {
    let winner = validate(s.tiles);

    if      ( winner === 1 ) return {score:Math.pow((SEARCHDEPTH-depth),3), x, y};
    else if ( winner === 0 ) return {score:Math.pow((SEARCHDEPTH-depth),4)*-1, x, y};
  }

  for (; x < GRIDCOUNT; ++x) {
    for (y = 0; y < GRIDCOUNT; ++y) {
      if (s.tiles[x][y].player !== -10) continue;

      let state = JSON.parse(JSON.stringify(s)); //Immutable

      state.tiles[x][y].player = player;

      updateMoves(state, player, {x,y});

      let move = getBestMove(state, depth+1);

      if (depth === 0) {
        if (move.score > bestMove.score) {
          bestMove = {score:move.score, x, y};
          bestMoves= [bestMove];
        } else if (move.score === bestMove.score) {
          bestMoves.push({score:move.score, x, y});
        }
      } else {
        bestMove.score += move.score;
      }
    }
  }

  if (depth === 0) return bestMoves;

  return bestMove;
}
