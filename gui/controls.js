var DIALOGS_REFRESH_LIST = ['dialogCities', 'updateMenuDialog', 'dialogPlayers'];
var DIALOGS_DELETE_LIST = [];

var $province_window = $('#province-window');
function selectProvince(point, selectedUID) {
  removeAllHighlight();

  let old = $('#province-window-' + point.toCSSID());
  var $dup = old.length ? old : $($province_window[0].outerHTML).clone().attr('id', 'province-window-' + point.toCSSID());
  DIALOGS_DELETE_LIST.push($dup);

  let p = point.province;
  let td = point.td;
  td.addClass('highlight');

  let rect = td[0].getBoundingClientRect();

  // check for init
  if (!$dup.hasClass('ui-dialog-content'))
    $dup.dialog({
      closeOnEscape: false, // controlled by index.js
      autoOpen: false
    })
    .dialog('option', 'minWidth', 200)
    .dialog('option', 'width', 200)
    .dialog('option', 'height', 300).dialog('open').parent()
      .css('top', (rect.y - 120 <= 0 ? rect.y + 120 : rect.y - 320).min(0).max(window.innerHeight - 200) + 'px')
      .css('left', (rect.x + 50).min(0).max(window.innerWidth - 300) + 'px');;

  // refresh content
  let html = `<h2>${p.row}, ${p.col}</h2>`;
  if (p.city > 0)
    html += `City: <img src="${PRODUCTION_ICON}" class="white icon"> ${p.city}<divider/>`;
  html += `Owner: <b style="background: ${p.player.color}" class="player-tag" onclick="dialogPlayers(true)">   ${p.owner}   </b><br>
          Supplied: ${p._defendable}<br>
          Defendable: ${p._defendable}<br>
          Attackable: ${p._attackable}<br><divider/>`;

  if (currentPlayer == p.owner) {
    let units = p.units.map(x => (Unit.fetch(x))).sort((a, b) => (b.rank - a.rank));
    units.forEach(unit => {
      if (unit.id == selectedUID)
        dialogUnit(unit.id);
      html += _generateUnitProvinceRow(unit, selectedUID == unit.id ? 'highlight' : '');
    });
    // arrows
    units = isNaN(selectedUID) ? units : [Unit.fetch(selectedUID)];
    _generateArrows(units);
  }


  $dup.html(html).dialog('open');

}

function _generateArrows(units) {
  units.forEach(u => {
    if (u.parent >= 0) {
      let parent = Unit.fetch(u.parent);
      createArrow(parent.loc, u.loc, 'r' + parent.rank);
    }
    if (u.order) {
      createArrow(u.loc, u.order, 'move');
    }
    u.childrenUnits.forEach(child => {
      createArrow(u.loc, child.loc, 'r' + u.rank);
      child.loc.td.addClass('highlight');
    });
  });
}

function _generateUnitProvinceRow(unit, clazz) {
  return `<div class="unit-province-row ${clazz}" onclick="dialogUnit(${unit.id})">
  <h1>${unit.rankTitle} #${unit.id}</h1>
  <span>T.A.: ${unit._totalAttack.round(1)}, S.: ${unit._totalSoldiersLastSeen || '??'}, C.: ${unit.children.length}</span><br><br>
  <div class="hp-container"><div style="width: ${unit._averageHP * 100}%;">${unit._averageHP.round(2)}</div></div>
  </div>`
}

function _generateSelfActionButtons(unit) {
  let html = `<p>
  <button onclick="requestRecruitsDialog(Unit.fetch(${unit.id}))">Request recruits</button>
  `;
  if (!unit._trained)
    html += `<button onclick="orderMoveDialog(Unit.fetch(${unit.id}))">Order move</button>`;
  if (!unit._recruited)
    html += `<button onclick="deployRecruitsDialog(Unit.fetch(${unit.id}))">Deploy</button>`;
  if (!unit._expanded)
    html += `<button onclick="expandUnitDialog(Unit.fetch(${unit.id}))">Expand</button>`;
  if (!unit._trained)
    html += `<button onclick="trainUnitDialog(Unit.fetch(${unit.id}))">Train</button>`;
  return html + `</p>
  <p class="orderMoveTip" style="display: none">Select a province</p>
  `;
}

var _givePlanDialogSelected = [];
function givePlanDialog(unit) {
  _givePlanDialogSelected = unit.plan;
  let listToOpen = [];
  DIALOGS_DELETE_LIST.forEach(x => {
    try {
      if (x.dialog('isOpen')) {
        listToOpen.push(x);
        x.dialog('close');
      }
    } catch (e) { }
  });
  skipEscapeListener = true;

  removeAllHighlight();
  dialogShowPlan(unit.id, true);

  let $dup;
  $dup = $('<div/>').dialog({
      closeOnEscape: true, // controlled by index.js
      autoOpen: false
    })
    .dialog('option', 'minWidth', 200)
    .dialog('option', 'width', 200)
    // .dialog('option', 'height', 18)
    .dialog('open').on('dialogclose', function(event) {
      skipEscapeListener = false;
      $dup.dialog('destroy');
      unit.plan = _givePlanDialogSelected;
      $('stripe').remove();
      dialogShowPlan(unit.id);
      repaintCanvas(true);
      listToOpen.forEach(x => {
        try {
          x.dialog('open');
        } catch (e) { }
      });
    }).append($(`<button>Done</button>`).click(() => { $dup.dialog('close') }));
  traverseMap(col => {
    let p = pt(col.row, col.col);
    let td = $(p.td);
    // no need
    // if (col.moveable(currentPlayer)) {
    td.css('cursor', 'pointer');
    td.attr('onclick', '_addPlan(' + unit.id + ', ' + p + ')');
  });
}

function _addPlan(uid, p) {
  _givePlanDialogSelected.push(p);
  Unit.fetch(uid).plan = _givePlanDialogSelected;
  removeAllHighlight();
  dialogShowPlan(uid, true);
}

function _generateChildActionButtons(unit) {
  let html = `<p>
  <button onclick="giveRecruitsDialog(Unit.fetch(${unit.id}))">Transfer recruits</button>
  <button onclick="givePlanDialog(Unit.fetch(${unit.id}))">Give plan</button>
  <button onclick="setOrderPriorityDialog(Unit.fetch(${unit.id}))">Set order priority</button>
  `;
  return html + '</p>';
}

function setOrderPriorityDialog(unit) {
  $dup = $('<div/>').dialog({
    closeOnEscape: true, // controlled by index.js
    autoOpen: false
  })
  .dialog('option', 'minWidth', 200)
  .dialog('option', 'width', 200)
  .dialog('open')
  .append($(`<button>${ORDER_MAX}</button>`).click(() => { unit.orderPriority = ORDER_MAX; $dup.dialog('close').dialog('destroy');dialogUnit(unit.id) }))
  .append($(`<button>${ORDER_MED}</button>`).click(() => { unit.orderPriority = ORDER_MED; $dup.dialog('close').dialog('destroy');dialogUnit(unit.id) }))
  .append($(`<button>${ORDER_MIN}</button>`).click(() => { unit.orderPriority = ORDER_MIN; $dup.dialog('close').dialog('destroy');dialogUnit(unit.id) }));
}

COL_ORDERMOVE_ONCLICK = td => {
  let p = td.point;
  Unit.fetch(currentUnit).order = p;

  DIALOGS_DELETE_LIST.forEach(x => {
    try {
      x.dialog('open');
    } catch (e) { }
  });

  repaintCanvas();

  dialogUnit(currentUnit);
};

function orderMoveDialog(unit) {
  $('.orderMoveTip').show();
  DIALOGS_DELETE_LIST.forEach(x => {
    try {
      x.dialog('close');
    } catch (e) { }
  });
  removeAllHighlight();
  // highlightProvince(unit.loc);
  traverseMap(col => {
    let p = pt(col.row, col.col);
    let td = $(p.td);
    if (col.moveable(currentPlayer)) {
      td.css('cursor', 'pointer');
      td.attr('onclick', 'COL_ORDERMOVE_ONCLICK(this)');
    } else {
      td.attr('onclick', 'return false;');
      td.css('cursor', 'not-allowed');
    }
  });
}

function expandUnitDialog(unit) {
  if (unit.expand()) dialogUnit(unit.id);
}

function trainUnitDialog(unit) {
  if (unit.train()) dialogUnit(unit.id);
}

function giveRecruitsDialog(unit) {
  let parent = Unit.fetch(currentUnit);
  let max = parent.recruits;
  let $dup;
  $dup = $(`<form><input type="numer" step=1 max="${max}" value="${max}" />
    <p>
    You have: ${max}<br>
    Requested: ${unit.requestRecruits}<br>
    ${unit.supplied ? '' : '<b>Warning: The unit is not supplied and can\'t deploy the granted recruits.</b>'}
    </p>
    <button type="submit">Transfer</button>
    </form>
    `).dialog({
      closeOnEscape: false, // controlled by index.js
      autoOpen: true
    })
    .dialog('option', 'minWidth', 300)
    .dialog('option', 'width', 300).submit(() => {
      $dup.dialog('destroy').remove();
      let n = (parseInt($dup.find('input').val()) || 0).min(0).max(max);
      parent.recruits -= n;
      unit.recruits += n;
      dialogUnit(parent.id);
      dialogUnit(unit.id);
    });
  DIALOGS_DELETE_LIST.push($dup);
}

function deployRecruitsDialog(unit) {
  let max = unit.soldiers.max(unit.recruits);
  let $dup;
  $dup = $(`<form><input type="numer" step=1 max="${max}" value="${max}" />
    <p>
    Max: ${max}<br>
    Note: Your average experience will decrease as a result.
    </p>
    <button type="submit">Deploy</button>
    </form>
    `).dialog({
      closeOnEscape: false, // controlled by index.js
      autoOpen: true
    })
    .dialog('option', 'minWidth', 300)
    .dialog('option', 'width', 300).submit(() => {
      $dup.dialog('destroy').remove();
      unit.recruit((parseInt($dup.find('input').val()) || 0).min(0).max(max));
      dialogUnit(unit.id);
    });
  DIALOGS_DELETE_LIST.push($dup);
}

function requestRecruitsDialog(unit) {
  let max = calcRequestRecruitsMaxIncludeChild(unit);
  let $dup;
  $dup = $(`<form><input type="numer" step=1 max="${max}" value="${estimateRequestRecruitsIncludeChild(unit)}" />
    Suggested: ${(estimateRequestRecruitsIncludeChild(unit) * 0.7).floor()} - ${max} (Max)
    <p>
    Requested by child units: ${estimateRequestRecruitsIncludeChild(unit) - estimateRequestRecruits(unit)}
    </p>
    <button type="submit">Set</button>
    </form>
    `).dialog({
      closeOnEscape: false, // controlled by index.js
      autoOpen: true
    })
    .dialog('option', 'minWidth', 300)
    .dialog('option', 'width', 300).submit(() => {
      $dup.dialog('destroy').remove();
      unit.requestRecruits = (parseInt($dup.find('input').val()) || 0).min(0).max(max);
      dialogUnit(unit.id);
    });
  DIALOGS_DELETE_LIST.push($dup);
}

function _pointTag(loc, uid) {
  if (!loc) return null;
  return `<b style="background: ${loc.province.player.color}" class="player-tag" onclick="highlightSelectProvince(${loc}, ${uid})">   (${loc.row}, ${loc.col})   </b>`
}

function dialogShowPlan(uid, listenForRemoval) {
  let unit = Unit.fetch(uid);
  let plan = unit.plan;
  if (!(plan && plan.length)) return;

  plan.forEach(p => {
    let top = p.row * PROVINCE_WIDTH;
    let left = p.col * PROVINCE_WIDTH;
    if (listenForRemoval) {
      let $stripe = createStripes(top, left, 'removeClick');
      $stripe.click(() => {
        _givePlanDialogSelected = _givePlanDialogSelected.filter(x => (!x.eq(p)));
        unit.plan = _givePlanDialogSelected;
        removeAllHighlight();
        dialogShowPlan(uid, true);
      });
    } else
      createStripes(top, left);
  });
}

var $unit_window = $('#unit-window');
function dialogUnit(uid) {
  $('#unit-window-' + uid).remove();
  var $dup = $($unit_window[0].outerHTML).clone().attr('id', 'unit-window-' + uid);
  $(document.body).append($dup);
  DIALOGS_DELETE_LIST.push($dup);


  // check for init
  if (!$dup.hasClass('ui-dialog-content')) {
    $dup.dialog({
      closeOnEscape: false, // controlled by index.js
      autoOpen: false
    })
    .dialog('option', 'minWidth', 350)
    .dialog('option', 'width', 350)
    .dialog('option', 'height', 600);
  }

  let unit = Unit.fetch(uid);
  if (!unit) return;

  _generateArrows([unit]);

  $dup.dialog('option', 'title', `${unit.rankTitle} - ${unit.id}`).on('dialogclose', function(event) {
    $('stripe').remove();
  });

  // refresh content

  let parentHTML = '';
  let parent;
  if (unit.parent >= 0 && (parent = Unit.fetch(unit.parent))) {
    parentHTML = `
    <b class="unit" onclick="dialogUnit(${parent.id})">${parent.rankTitle.substr(0, 3)} ${parent.id}</b>
    <div class="v-line"></div>`;
  }

  dialogShowPlan(uid);

  let html = `<h2>${unit.rankTitle} - ${unit.id}</h2>
  Rank: ${unit.rank}<br>
  ${uid == currentUnit ? _generateSelfActionButtons(unit) : ''}
  ${Unit.fetch(currentUnit).children.indexOf(uid) >= 0 ? _generateChildActionButtons(unit) : ''}
  Location: ${_pointTag(unit.loc, uid)}<br>
  Total Attack: ${unit._totalAttack.round(1)}<br>
  Attack: ${unit.attack.round(1)}<br>
  Defense: ${unit.fullHP.round(1)}<br>
  (Surround penalty ${unit._prov._adjacentDiff * 20}%)<br>
  <divider/>
  Soldiers: ${unit.soldiers}<br>
  Total Soldiers: ${unit._totalSoldiers}<br>
  Average strength: ${unit.averageStrength.round(1)}<br>
  Average experience: ${unit.averageExperience.round(1)}<br>
  <divider/>
  Supplied: ${unit.supplied}<br>
  Recruits: ${unit.recruits}<br>
  Requested: ${unit.requestRecruits}<br>
  Expand Cost: ${unit.expandCost}<br>
  <divider/>
  Order: ${_pointTag(unit.order)}<br>
  Plan: ${unit.plan && unit.plan.length ? '<button onclick="removeAllHighlight();dialogShowPlan(' + unit.id + ')">Show</button>' : 'none'}<br>
  Priority: ${unit.orderPriority}<br>
  Entrench: ${unit.entrench.round(2)}<br>
  Planning: ${unit.planning.round(2)}<br>
  <br><br>
  Morale:
  <div class="hp-container">
    <div style="width: ${unit.hp * 100}%;background: #a46623">${(unit.hp * 100).floor()}%</div>
  </div>`
  if (unit.rank < RANK_SQUAD)
      html += `Average morale:
      <div class="hp-container">
        <div style="width: ${unit._averageHP * 100}%">${(unit._averageHP * 100).floor()}%</div>
      </div>`;
  html += `<divider/>
  <h4 align=center>Chain of Command</h4>
  <divider/>
  <table class="chain-of-command">
  <thead>
    <tr>
    <th colspan=5>
    ${parentHTML}
    <b class="unit">${unit.rankTitle.substr(0, 3)} ${unit.id}</b>
    <div class="v-line"></div>
    </th>
    </tr>
  </thead>
  <tbody>`;
  for (let i = 0;i < unit.soldiers;i++) {
    if (i % 10 == 0) html += '<tr>';
    if (i % 2 == 0) {
      html += `<td>`;
      if (i < 10)
        html += '<div class="v-line small"></div>';
    }
    html += '<b class="unit small"></b>';
  }
  html += `<tr><td colspan=5><br></tbody>
  </table>
  <div style="text-align: center">
  <div class="v-line"></div>
  ${unit.children.map(uid => {
    let u = Unit.fetch(uid);
    return _generateUnitProvinceRow(u, 'chain-of-command')
  }).join('<br>')}
  </div>
  `;

  $dup.html(html);

  // bring to front
  setTimeout(() => {
    $dup.dialog('open');
  }, 1);
}

var $players_window = $('#players-window');
function dialogPlayers(toggle) {
  // check for init
  if (!$players_window.hasClass('ui-dialog-content')) {
    $players_window.dialog({
      closeOnEscape: true,
      autoOpen: false
    })
    .dialog('option', 'minWidth', 150)
    .dialog('option', 'width', 150);
  }

  // refresh content

  let [ownSum, enemySum] = calcPlayersProduction();
//   let p1 = PLAYERS[currentPlayer];
//   let p2 = PLAYERS[currentPlayer == 1 ? 0 : 1];
  let p1 = PLAYERS[0];
  let p2 = PLAYERS[1];

  let html = '';

  html += `<div class="city-row" style="background-color: ${p1.color};font-weight: bold;margin: 0 -3px;">
  Total <img src="${PRODUCTION_ICON}" class="white icon"> ${ownSum}<br>
  </div>
  Total recruits: ${p1.totalRecruits}<br>
  Total soldiers: ${p1.totalSoldiers}<br>
  Total units: ${p1.totalUnits}<br>
  Units on frontline: ${p1.unitsOnFrontLine} (${(p1.unitsOnFrontLine / p1.totalUnits * 100).round()}%)<br>
  Casualties: ${p1.casualty}<br>
  `;
  html += `<div class="city-row" style="background-color: ${p2.color};font-weight: bold;margin: 0 -3px;">
  Total <img src="${PRODUCTION_ICON}" class="white icon"> ${enemySum}<br>
  </div>
  Total recruits: ${p2.totalRecruits}<br>
  Total soldiers: ${p2.totalSoldiers}<br>
  Total units: ${p2.totalUnits}<br>
  Units on frontline: ${p2.unitsOnFrontLine} (${(p2.unitsOnFrontLine / p2.totalUnits * 100).round()}%)<br>
  Casualties: ${p2.casualty}<br>
  `;

  $players_window.html(html);

  // toggle
  if (toggle) {
    if ($players_window.dialog('isOpen'))
      $players_window.dialog('close');
    else
      $players_window.dialog('open');
  }
}

var $cities_window = $('#cities-window');
function dialogCities(toggle) {
  // check for init
  if (!$cities_window.hasClass('ui-dialog-content')) {
    $cities_window.dialog({
      closeOnEscape: true,
      autoOpen: false
    })
    .dialog('option', 'minWidth', 175)
    .dialog('option', 'width', 175);
  }

  // refresh content

  let ourCities = [];
  let enemyCities = [];

  let [ownSum, enemySum] = calcPlayersProduction();

  cities.forEach(point => {
    let province = point.province;
    let score = [-province.city, province];
    if (currentPlayer == province.owner) {
      ourCities.push(score);
    } else {
      enemyCities.push(score);
    }
  });

  let html = '';


  let createRowFunc = our => (num => {
    let p = num[1];
    html += `<div class="city-row" style="background: ${PLAYERS[p.owner].color};cursor: pointer" onclick="highlightProvince(pt(${p.row}, ${p.col}))">
    <h2 class="city ${p.city < 33 ? 'small' : (p.city >= 66 ? 'large' : '')}">&nbsp;</h2>
    <div>
      <img src="${PRODUCTION_ICON}" class="white icon"> ${p.city}<br>
      Divisions: ${our ? '' : '??'} ${our ? p.units.length : (p.units.length - Math.random() * p.units.length).round().min(0) + ' - ' + (p.units.length + Math.random() * p.units.length).round().min(0)}
    </div>
    <clear/>
    </div>`;
  });

  html += `<div class="city-row" style="background-color: ${PLAYERS[ourCities[0][1].owner].color};font-weight: bold;margin: 0 -3px;">
  Total <img src="${PRODUCTION_ICON}" class="white icon"> ${ownSum}<br>
  </div>`;
  ourCities.sort((a, b) => (a[0] - b[0])).forEach(createRowFunc(true));
  html += `<div class="city-row" style="background-color: ${PLAYERS[enemyCities[0][1].owner].color};font-weight: bold;margin: 0 -3px;">
  Total <img src="${PRODUCTION_ICON}" class="white icon"> ${enemySum}<br>
  </div>`;
  enemyCities.sort((a, b) => (a[0] - b[0])).forEach(createRowFunc(false));

  $cities_window.html(html);

  // toggle
  if (toggle) {
    if ($cities_window.dialog('isOpen'))
      $cities_window.dialog('close');
    else
      $cities_window.dialog('open');
  }
}

var $main_window = $('#main-window');
function initControls() {
  $main_window.dialog({
    closeOnEscape: false,
    open: function (event, ui) {
      $('.ui-dialog-titlebar-close', ui.dialog | ui).hide();
    },
    position: 'top, left'
  })
    .dialog('option', 'minWidth', 100)
    .dialog('option', 'width', 100);
  updateMenuDialog();
}

function updateMenuDialog() {
  window._toggleWindowVar = false;

  let cu = Unit.fetch(currentUnit);
  $main_window.html(`
    <progress value="${currentUnit}" max="${UNITS.length}" style="width: 98px;"></progress>
    Turn: ${turnNumber}<br>
    <button onclick="dialogUnit(${cu.id})">${cu.rankTitle} ${cu.id}</button>
    <button onclick="nextUnit()">Next</button>
    <button onclick="think(Unit.fetch(currentUnit)); updateMenuDialog(); setTimeout(nextUnit, 0)">AI Think</button>
    <button onclick="dialogCities(true)">Cities</button>
    <button onclick="dialogPlayers(true)">Players</button><br>
    <divider><br>
    <button onclick="toggleWindows()">Toggle Windows</button>
    `);
}

function toggleWindows() {
  if (_toggleWindowVar) {
    _toggleWindowVar = false;
    _listToOpen.forEach(x => {
      try {
        x.parent().show();
      } catch (e) { }
    });
  } else {
    _toggleWindowVar = true;
    window._listToOpen = [];
    DIALOGS_DELETE_LIST.forEach(x => {
      try {
        if (x.dialog('isOpen')) {
          _listToOpen.push(x);
          x.parent().hide();
        }
      } catch (e) { }
    });
  }
}
