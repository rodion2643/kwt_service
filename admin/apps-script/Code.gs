// KWT Service — Google Таблица + Drive
// БЕЗ getUi().alert — иначе ошибка при запуске
// Порядок: upgradeOnce → setPasswordOnce → Deploy → New deployment

var SHEET_NAME = 'listings';
var HIDDEN_SHEET = 'hidden';
var HEADERS = ['id', 'name', 'type', 'price', 'image', 'specs', 'badge', 'category', 'active', 'created'];

function setupOnce() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureListingsSheet_(ss);
  ensureHiddenSheet_(ss);
  Logger.log('OK: setupOnce');
}

function upgradeOnce() {
  setupOnce();
}

function setPasswordOnce() {
  PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD', 'ewASDV@!LOXW12)');
  Logger.log('OK: password saved');
}

function ensureListingsSheet_(ss) {
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    return;
  }
  ensureCategoryColumn_(sheet);
}

function ensureCategoryColumn_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  if (headers.indexOf('category') >= 0) {
    backfillCategory_(sheet, headers);
    return;
  }
  var badgeIdx = headers.indexOf('badge');
  var insertAfter = badgeIdx >= 0 ? badgeIdx + 1 : headers.length;
  sheet.insertColumnAfter(insertAfter);
  sheet.getRange(1, insertAfter + 1).setValue('category');
  headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  backfillCategory_(sheet, headers);
}

function backfillCategory_(sheet, headers) {
  var badgeIdx = headers.indexOf('badge');
  var catIdx = headers.indexOf('category');
  if (badgeIdx < 0 || catIdx < 0) return;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var data = sheet.getRange(2, 1, lastRow, headers.length).getValues();
  for (var i = 0; i < data.length; i++) {
    var existing = String(data[i][catIdx] || '').toLowerCase();
    if (existing === 'used' || existing === 'sale') continue;
    sheet.getRange(i + 2, catIdx + 1).setValue(inferCategory_(String(data[i][badgeIdx] || ''), ''));
  }
}

function inferCategory_(badge, category) {
  var cat = String(category || '').toLowerCase().trim();
  if (cat === 'used' || cat === 'sale') return cat;
  var b = String(badge || '').toLowerCase().trim();
  if (b === 'б/у' || b === 'used' || b === 'bu' || b === 'b/u') return 'used';
  return 'sale';
}

function badgeForCategory_(category) {
  return category === 'used' ? 'Б/У' : 'продажа';
}

function ensureHiddenSheet_(ss) {
  var sheet = ss.getSheetByName(HIDDEN_SHEET);
  if (!sheet) sheet = ss.insertSheet(HIDDEN_SHEET);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1).setValues([['id']]);
    sheet.setFrozenRows(1);
  }
}

function doGet(e) {
  e = e || {};
  var p = e.parameter || {};
  if (p.action === 'remove' || p.action === 'hide' || p.action === 'delete') {
    if (!checkPassword_(p.password)) {
      return json_({ ok: false, error: 'Wrong password' });
    }
    return json_(removeListing_(p.id));
  }
  return json_({
    items: getActiveListings_(),
    hidden: getHiddenIds_()
  });
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (!checkPassword_(body.password)) {
      return json_({ ok: false, error: 'Wrong password' });
    }
    if (body.action === 'list') {
      return json_({ ok: true, items: getAllListings_(), hidden: getHiddenIds_() });
    }
    if (body.action === 'add') return json_(addListing_(body));
    if (body.action === 'update') return json_(upsertListing_(body));
    if (body.action === 'remove') return json_(removeListing_(body.id));
    if (body.action === 'hide') return json_(removeListing_(body.id));
    if (body.action === 'delete') return json_(removeListing_(body.id));
    return json_({ ok: false, error: 'Unknown action: ' + body.action });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function checkPassword_(pw) {
  var saved = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  return saved && pw === saved;
}

function getSheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Run upgradeOnce first');
  ensureCategoryColumn_(sheet);
  return sheet;
}

function getHiddenSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureHiddenSheet_(ss);
  return ss.getSheetByName(HIDDEN_SHEET);
}

function getHiddenIds_() {
  var sheet = getHiddenSheet_();
  var data = sheet.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) out.push(String(data[i][0]));
  }
  return out;
}

function hideId_(id) {
  var sheet = getHiddenSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return;
  }
  sheet.appendRow([String(id)]);
}

function rowToItem_(row, headers) {
  var idx = function(name) { return headers.indexOf(name); };
  var specsRaw = row[idx('specs')] || '';
  var specs = specsRaw ? String(specsRaw).split('|').map(function(s) { return s.trim(); }).filter(Boolean) : [];
  var category = inferCategory_(row[idx('badge')], row[idx('category')]);
  return {
    id: String(row[idx('id')] || ''),
    name: String(row[idx('name')] || ''),
    type: String(row[idx('type')] || 'Самокат'),
    price: String(row[idx('price')] || ''),
    image: String(row[idx('image')] || ''),
    badge: badgeForCategory_(category),
    category: category,
    specs: specs,
    active: row[idx('active')] === true || String(row[idx('active')]).toUpperCase() === 'TRUE',
    created: String(row[idx('created')] || '')
  };
}

function getActiveListings_() {
  var sheet = getSheet_();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(String);
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var item = rowToItem_(data[i], headers);
    if (item.active && item.name) out.push(item);
  }
  out.sort(function(a, b) { return b.created.localeCompare(a.created); });
  return out;
}

function getAllListings_() {
  var sheet = getSheet_();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(String);
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var item = rowToItem_(data[i], headers);
    if (item.name) out.push(item);
  }
  out.sort(function(a, b) { return b.created.localeCompare(a.created); });
  return out;
}

function findRowById_(sheet, id) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(String);
  var idCol = headers.indexOf('id');
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      return { row: i + 1, headers: headers };
    }
  }
  return null;
}

function addListing_(body) {
  return writeListing_(getSheet_(), 'adm-' + new Date().getTime(), body, true);
}

function upsertListing_(body) {
  if (!body.id) return { ok: false, error: 'No id' };
  var sheet = getSheet_();
  var found = findRowById_(sheet, body.id);
  if (found) return writeListing_(sheet, body.id, body, false, found.row, found.headers);
  return writeListing_(sheet, body.id, body, true);
}

function buildRowValues_(headers, id, body, isNew, oldRow) {
  var category = inferCategory_(body.badge, body.category);
  var values = {
    id: id,
    name: body.name,
    type: body.type || 'Самокат',
    price: body.price,
    image: body.image || '',
    specs: (body.specs || []).join('|'),
    badge: badgeForCategory_(category),
    category: category,
    active: true,
    created: new Date().toISOString()
  };
  if (!isNew && oldRow) {
    var idx = function(name) { return headers.indexOf(name); };
    var createdCol = idx('created');
    if (createdCol >= 0 && oldRow[createdCol]) values.created = String(oldRow[createdCol]);
    if (!values.image) {
      var imageCol = idx('image');
      if (imageCol >= 0) values.image = String(oldRow[imageCol] || '');
    }
  }
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    row.push(values.hasOwnProperty(headers[i]) ? values[headers[i]] : '');
  }
  return row;
}

function writeListing_(sheet, id, body, isNew, rowNum, headers) {
  var imageUrl = body.image || '';
  if (body.imageBase64) {
    imageUrl = saveImage_(body.imageBase64, body.imageName || id + '.jpg');
    body.image = imageUrl;
  }
  if (!imageUrl && isNew) return { ok: false, error: 'Need photo' };
  if (!headers) {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  }
  var oldRow = (!isNew && rowNum) ? sheet.getRange(rowNum, 1, rowNum, headers.length).getValues()[0] : null;
  var row = buildRowValues_(headers, id, body, isNew, oldRow);
  if (isNew) sheet.appendRow(row);
  else sheet.getRange(rowNum, 1, rowNum, row.length).setValues([row]);
  if (getHiddenIds_().indexOf(String(id)) >= 0) unhideId_(id);
  return { ok: true, id: id, image: imageUrl || row[headers.indexOf('image')] };
}

function unhideId_(id) {
  var sheet = getHiddenSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) === String(id)) sheet.deleteRow(i + 1);
  }
}

function removeListing_(id) {
  if (!id) return { ok: false, error: 'No id' };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureHiddenSheet_(ss);
  hideId_(String(id));
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (sheet && sheet.getLastRow() > 1) {
    ensureCategoryColumn_(sheet);
    var found = findRowById_(sheet, id);
    if (found) {
      var activeCol = found.headers.indexOf('active') + 1;
      if (activeCol > 0) sheet.getRange(found.row, activeCol).setValue(false);
    }
  }
  return { ok: true, id: String(id) };
}

function saveImage_(base64, filename) {
  var parts = base64.split(',');
  var mime = (parts[0] || '').indexOf('png') >= 0 ? 'image/png' : 'image/jpeg';
  var file = DriveApp.createFile(Utilities.newBlob(Utilities.base64Decode(parts.pop()), mime, filename));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1400';
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
