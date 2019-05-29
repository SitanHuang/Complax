var $mapContainer = $('#mapContainer');
var $mapTable = $('#mapTable');

COL_DEFAULT_STYLE = (td, clickHandler) => {
  let p = td[0].province;
  td[0].style = `background-color: ${p.player.color};`;
  td.attr('onclick', ((clickHandler && clickHandler.name || clickHandler) || COL_DEFAULT_ONCLICK.name) + '(this)')
  if (p.owner == currentPlayer)
    td.attr('onmouseenter', `updateUnits($(this), pt(${p.row}, ${p.col}).province, true)`)
      .attr('onmouseleave', `updateUnits($(this), pt(${p.row}, ${p.col}).province)`);
  td.removeClass('highlight');
};

COL_DEFAULT_ONCLICK = td => {
  let p = td.point;
  highlightSelectProvince(p);
}

function highlightSelectProvince(point, uid) {
  highlightProvince(point);
  selectProvince(point, uid);
}

function refreshCol($td, point, clickHandler) {
  let p = point.province;
  $td[0].point = point;
  $td[0].province = p;

  // reset ===
  $td.attr('style', '').attr('class', '').html('');

  // bg color ===
  $td.css('background-color', p.player.color);

  // add city ===
  if (p.city > 0)
    $td.addClass('city');
  if (p.city >= 66)
    $td.addClass('large');
  else if (p.city < 33)
    $td.addClass('small');

  // onclick ===
  $td.attr('onclick', ((clickHandler && clickHandler.name || clickHandler) || COL_DEFAULT_ONCLICK.name) + '(this)')
  if (p.owner == currentPlayer)
    $td.attr('onmouseenter', `updateUnits($(this), pt(${p.row}, ${p.col}).province, true)`)
      .attr('onmouseleave', `updateUnits($(this), pt(${p.row}, ${p.col}).province)`);

  // add position ===
  $td.append(`<position>${p.row}, ${p.col}</position>`);
  // if interval, always show
  if (p.row % SHOW_COORDINATE_INTERVAL == 0 && p.col % SHOW_COORDINATE_INTERVAL == 0)
    $td.addClass('interval');

  // adjacent border ===
  $td.css('border-top', p._adjacentDiffStyleTop);
  $td.css('border-bottom', p._adjacentDiffStyleBottom);
  $td.css('border-left', p._adjacentDiffStyleLeft);
  $td.css('border-right', p._adjacentDiffStyleRight);

  // add units ===
  updateUnits($td, p);

}

function updateUnits($td, p, o) {
  $td.find('.unit-container').remove();
  let $unit_container = $('<div class="unit-container"></div>');
  let stackSize = p.units.length;
  let startPos = -stackSize * UNIT_STACK_OFFSET / 2;
  let sortedUnits = o ? p.units.map(x => Unit.fetch(x)).sort((a, b) => (a.rank - b.rank)) : p.units.map(x => Unit.fetch(x)).sort((a, b) => (b.rank - a.rank));
  sortedUnits.forEach((unit, i) => {
    let b = $('<unit></unit>')
      .css('margin-top', startPos + i * UNIT_STACK_OFFSET)
      .css('margin-left', startPos + i * UNIT_STACK_OFFSET)
      .css('z-index', 100 + i);
    if (p.owner == currentPlayer)
        b.append(`<b>${unit.rankTitle.substr(0, 3)}</b>`)
         .append(`<span># ${unit.id}</span>`)
          .css('transform', `scale(${window['UNIT_STACK_' + unit.rank + '_SIZE']})`);
    else {
      if (p._adjacentDiff > 0) {
        if (Math.random() > (1 - BORDER_COVERAGE))
          b.append(`<b>${unit.rankTitle.substr(0, 3)}</b>`)
            .css('transform', `scale(${window['UNIT_STACK_' + unit.rank + '_SIZE']})`);
        else
          b.append(`<b>???</b>`)
      } else if (Math.random() > (1 - RADAR_COVERAGE))
        return;
      else
        b.append('<b>???</b>');
    }
    $unit_container.append(b);
  });
  $td.append($unit_container);
}

function repaintCanvas(fast, clickHandler) {
  let start = new Date().getTime();
  map.forEach((rowData, row) => {
    rowData.forEach((colData, col) => {
      let point = pt(row, col);
      let $td = point.td;

      if (fast) {
        COL_DEFAULT_STYLE($td, clickHandler);
      } else
        refreshCol($td, point, clickHandler);
    });
  });
  console.log(`repaintCanvas(${!!fast}) done in ${(new Date().getTime() - start)}ms`)
}

function reinitCanvas() {
  let start = new Date().getTime();
  $mapTable.html('');
  map.forEach((rowData, row) => {
    let $tr = $('<tr/>').attr('id', 'r' + row);
    rowData.forEach((colData, col) => {
      let $td = $('<td/>').attr('id', 'r' + row + 'c' + col);
      let point = pt(row, col);

      refreshCol($td, point);

      $tr.append($td);
    });

    $mapTable.append($tr);
  });
  console.log(`reinitCanvas() done in ${(new Date().getTime() - start)}ms`)
}
