function removeAllHighlight() {
  $('.highlight').removeClass('highlight');
  $('arrow').remove();
  $('stripe').remove();
}

function highlightProvince(point) {
  let start = new Date().getTime();
  removeAllHighlight();
  let td = point.td;
  td.addClass('highlight');
  td[0].scrollIntoViewIfNeeded();
  console.log(`highlightProvince() done in ${(new Date().getTime() - start)}ms`);
}
