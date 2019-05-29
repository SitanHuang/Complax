function createArrow(from, to, clazz) {
  let fromY = PROVINCE_WIDTH * from.row + PROVINCE_WIDTH / 2;
  let fromX = PROVINCE_WIDTH * from.col + PROVINCE_WIDTH / 2;
  let toY = PROVINCE_WIDTH * to.row + PROVINCE_WIDTH / 2;
  let toX = PROVINCE_WIDTH * to.col + PROVINCE_WIDTH / 2;


  let dx = toX - fromX;
  let dy = toY - fromY;

  let ang = angle(dx, dy);
  var distance = Math.sqrt(dx*dx + dy*dy);

  let $arrow = $('<arrow/>')
                  .css('top', fromY)
                  .css('left', fromX)
                  .css('width', distance)
                  .css('transform', `rotate(${ang}deg)`)
                  .addClass(clazz);

  $mapContainer.append($arrow);
  return $arrow;
}

function createStripes(top, left, clazz, width) {
  width = width || PROVINCE_WIDTH - 4;

  let $stripe = $('<stripe/>')
                  .css('top', top)
                  .css('left', left)
                  .css('width', width)
                  .css('height', width)
                  .addClass(clazz);

  $mapContainer.append($stripe);
  return $stripe;
}
