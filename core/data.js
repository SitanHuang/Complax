PLAYERS = [{
  color: '#6b2323',
  production: 0,
  casualty: 0
}, {
  color: '#184492',
  production: 0,
  casualty: 0
}];

UNITS = [];

var currentUnit = -1;

// used to indicate the owner of current unit
var currentPlayer = 0;

function calcPlayersProduction() {
  return currentPlayer == 0 ? [PLAYERS[0].production, PLAYERS[1].production] : [PLAYERS[1].production, PLAYERS[0].production];
}
