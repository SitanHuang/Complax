function pt(row, col) {
  return new Point(row, col);
}

class Point {
  constructor(row, col) {
    this.row = row;
    this.col = col;
  }

  get province() {
    return this._p || (this._p = map[this.row] && map[this.row][this.col]);
  }

  eq(r, c) {
    if (isNaN(c)) {
      if (isNaN(r.row) || isNaN(r.col)) return false;
      return r.row == this.row && r.col == this.col;
    }
    return r == this.row && c == this.col;
  }

  get td() {
    return $(`#r${this.row}c${this.col}`);
  }

  toString() {
    return `pt(${this.row}, ${this.col})`;
  }

  toCSSID() {
    return `${this.row}-${this.col}`;
  }
}

class Province {
  constructor() {
    this.row = -1;
    this.col = -1;
    this.owner = -1;
    // this.terrain = 0;
    this.city = 0; // number indicates available recruits per round
    this.units = [];

    this._adjacentDiff = 0; // number of adjacent enemies, decrease attack by factor of x
    this._adjacentDiffStyleLeft = '';
    this._adjacentDiffStyleRight = '';
    this._adjacentDiffStyleTop = '';
    this._adjacentDiffStyleBottom = '';
    this._attackable = false;
    this._defendable = false;

  }

  get loc() {
    return this._loc = this._loc || pt(this.row, this.col);
  }

  moveable(player) {
    return (this.owner == player && this._defendable) || (this.owner !=
      player && this._attackable)
  }

  get player() {
    return PLAYERS[this.owner];
  }

  leastUnitsFriendlyNeighbor(player) {
    let pro = null;
    let num = Infinity;
    [Province.tryGet(this.row - 1, this.col),
      Province.tryGet(this.row + 1, this.col),
      Province.tryGet(this.row, this.col - 1),
      Province.tryGet(this.row, this.col + 1)].forEach(prov => {
      if (prov && prov.units < num && prov.owner == player) {
        pro = prov;
        num = prov.units;
      }
    });
    return pro;
  }

  nonAttackableFriendlyNeighbor(player) {
    let pro = null;
    [Province.tryGet(this.row - 1, this.col),
      Province.tryGet(this.row + 1, this.col),
      Province.tryGet(this.row, this.col - 1),
      Province.tryGet(this.row, this.col + 1)].forEach(prov => {
      if (prov && !prov._attackable && prov._defendable && prov.owner == player) {
        pro = prov;
      }
    });
    return pro;
  }

  calcPostAdjacentDiff() {
    this._attackable = false;
    this._defendable = false;

    let top = Province.tryGet(this.row - 1, this.col);
    let bottom = Province.tryGet(this.row + 1, this.col);
    let left = Province.tryGet(this.row, this.col - 1);
    let right = Province.tryGet(this.row, this.col + 1);

    // if block near any own block, then defendable
    this._defendable = (top && top.owner == this.owner && top._adjacentDiff <=
        2) ||
      (bottom && bottom.owner == this.owner && bottom._adjacentDiff <= 2) ||
      (left && left.owner == this.owner && left._adjacentDiff <= 2) ||
      (right && right.owner == this.owner && right._adjacentDiff <= 2);
    // if city, not defendable but supplied
    // if (this.city > 0) this._defendable = true;

    // if block near any enemy block, the attackable
    this._attackable = (top && top.owner != this.owner && top._adjacentDiff <=
        3) ||
      (bottom && bottom.owner != this.owner && bottom._adjacentDiff <= 3) ||
      (left && left.owner != this.owner && left._adjacentDiff <= 3) ||
      (right && right.owner != this.owner && right._adjacentDiff <= 3);
  }

  // TODO: battle always pick lowest rank first

  calcAdjacentDiff() {
    this._adjacentDiff = 0;
    this._adjacentDiffStyleLeft = '';
    this._adjacentDiffStyleRight = '';
    this._adjacentDiffStyleTop = '';
    this._adjacentDiffStyleBottom = '';

    let top = Province.tryGet(this.row - 1, this.col);
    let bottom = Province.tryGet(this.row + 1, this.col);
    let left = Province.tryGet(this.row, this.col - 1);
    let right = Province.tryGet(this.row, this.col + 1);

    if (top && top.owner != this.owner) {
      this._adjacentDiff++;
      this._adjacentDiffStyleTop = '4px solid white';
    }
    if (right && right.owner != this.owner) {
      this._adjacentDiff++;
      this._adjacentDiffStyleRight = '4px solid white';
    }
    if (bottom && bottom.owner != this.owner) {
      this._adjacentDiff++;
      this._adjacentDiffStyleBottom = '4px solid white';
    }
    if (left && left.owner != this.owner) {
      this._adjacentDiff++;
      this._adjacentDiffStyleLeft = '4px solid white';
    }
  }

  static tryGet(row, col) {
    return map[row] && map[row][col];
  }
}

var cities = null;

var map = []; // must be array

function traverseMap(handle) {
  map.forEach((row, r) => {
    row.forEach(handle);
  });
}

function generateWorld() {
  cities = [];

  var playerCities = [[], []];

  map = new Array(MAP_HEIGHT).fill(0).map((y, row) => (
    new Array(MAP_WIDTH).fill(0).map((x, col) => {
      let p = new Province();
      p.row = row;
      p.col = col;
      p.owner = col >= MAP_WIDTH / 2 ? 1 : 0;

      if (cities.length < 20 && Math.random() < ((1 + (25 - cities.length)) /
          (MAP_WIDTH *
            MAP_HEIGHT * 1.1))) {
        p.city = (Math.random() * 300).round().min(1).max(200);
        PLAYERS[p.owner].production += p.city;
        cities.push(pt(row, col));
        playerCities[p.owner].push(pt(row, col))
      }

      return p;
    })
  ));

  let _playerSquad = [];

  function generateArmyForPlayer(playerNum, rowFunc, colFunc) {
    // ======= army =======
    let army = new Unit(playerCities[playerNum].sample(), playerNum, RANK_ARMY,
      -1, MAP_SOLDIER_PER_RANK()).add();
    _playerSquad.push(army);
    // ======= divisions =======
    let dnum = MAP_CHILDREN_PER_RANK();
    for (let di = 0; di < dnum; di++) {
      let division = new Unit(pt(rowFunc(), colFunc()), playerNum,
        RANK_DIVISION, army.id, MAP_SOLDIER_PER_RANK()).add();
      army.children.push(division.id);
      _playerSquad.push(division);

      // ======= regiments =======
      let rnum = MAP_CHILDREN_PER_RANK();
      for (let ri = 0; ri < rnum; ri++) {
        let regiment = new Unit(division.loc, playerNum, RANK_REGIMENT,
          division.id, MAP_SOLDIER_PER_RANK()).add();
        division.children.push(regiment.id);
        _playerSquad.push(regiment);

        // ======= companies =======
        let cnum = MAP_CHILDREN_PER_RANK();
        for (let ci = 0; ci < cnum; ci++) {
          let company = new Unit(pt(rowFunc(), colFunc()), playerNum,
            RANK_COMPANY, regiment.id, MAP_SOLDIER_PER_RANK()).add();
          regiment.children.push(company.id)
          if (Math.random() < 0.7) _playerSquad.push(company);


          // ======= squads =======
          let snum = MAP_CHILDREN_PER_RANK();
          for (let si = 0; si < snum; si++) {
            let squad = new Unit(company.loc, playerNum, RANK_SQUAD, company.id,
              MAP_SOLDIER_PER_SQUAD()).add();
            company.children.push(squad.id);
            if (Math.random() < 0.9) _playerSquad.push(squad);
          }
        }
      }
    }
  }

  // generate left side army
  let rowFunc = exclusiveRange(0, MAP_HEIGHT);

  generateArmyForPlayer(0, rowFunc, exclusiveRange(0, MAP_WIDTH / 2));
  generateArmyForPlayer(1, rowFunc, exclusiveRange(MAP_WIDTH / 2, MAP_WIDTH));

  _playerSquad.sample().ai = false;

}
