const { badRequest } = require('./errors');

const INT_RE = /^-?\d+$/;
const NUM_RE = /^-?\d+(\.\d+)?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ID_RE = /^[A-Za-z0-9_-]{1,50}$/;

function rawString(query, name) {
  const v = query[name];
  if (v === undefined) return undefined;
  if (typeof v !== 'string') {
    throw badRequest(`Tham số '${name}' phải là một giá trị duy nhất.`);
  }
  const t = v.trim();
  return t === '' ? undefined : t;
}

/** Chuỗi bắt buộc (không rỗng). */
function requiredString(query, name) {
  const v = rawString(query, name);
  if (v === undefined) throw badRequest(`Thiếu tham số '${name}'.`);
  return v;
}

/** Chuỗi tùy chọn: trả về undefined nếu không truyền. */
function optionalString(query, name) {
  return rawString(query, name);
}

/** Mã định danh (IDTaiKhoan, IDTuong, ...) bắt buộc. */
function requiredId(value, name) {
  if (typeof value !== 'string' || !ID_RE.test(value)) {
    throw badRequest(`'${name}' không hợp lệ.`);
  }
  return value;
}

/** Số nguyên bắt buộc, có thể giới hạn min/max. */
function requiredInt(query, name, { min, max } = {}) {
  const v = rawString(query, name);
  if (v === undefined) throw badRequest(`Thiếu tham số '${name}'.`);
  if (!INT_RE.test(v) || !Number.isSafeInteger(Number(v))) {
    throw badRequest(`'${name}' phải là số nguyên.`);
  }
  const n = Number(v);
  if (min !== undefined && n < min) throw badRequest(`'${name}' phải >= ${min}.`);
  if (max !== undefined && n > max) throw badRequest(`'${name}' phải <= ${max}.`);
  return n;
}

/** Số (cho phép thập phân) bắt buộc. */
function requiredNumber(query, name, { min } = {}) {
  const v = rawString(query, name);
  if (v === undefined) throw badRequest(`Thiếu tham số '${name}'.`);
  if (!NUM_RE.test(v)) throw badRequest(`'${name}' phải là số.`);
  const n = Number(v);
  if (min !== undefined && n < min) throw badRequest(`'${name}' phải >= ${min}.`);
  return n;
}

function isRealDate(iso) {
  if (!DATE_RE.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Ngày dạng YYYY-MM-DD bắt buộc. */
function requiredDate(query, name) {
  const v = rawString(query, name);
  if (v === undefined) throw badRequest(`Thiếu tham số '${name}'.`);
  if (!isRealDate(v)) throw badRequest(`'${name}' phải có định dạng YYYY-MM-DD.`);
  return v;
}

function nextDay(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/**
 * Khoảng ngày [from, to] (cả hai đầu đều bao gồm).
 * Trả về mốc bắt đầu và mốc kết thúc không bao gồm (toExclusive) để so sánh DATETIME an toàn.
 */
function dateRange(query, fromName, toName) {
  const from = requiredDate(query, fromName);
  const to = requiredDate(query, toName);
  if (from > to) throw badRequest(`'${fromName}' không được lớn hơn '${toName}'.`);
  return {
    from: `${from} 00:00:00`,
    toExclusive: `${nextDay(to)} 00:00:00`,
  };
}

module.exports = {
  requiredString,
  optionalString,
  requiredId,
  requiredInt,
  requiredNumber,
  requiredDate,
  dateRange,
};
