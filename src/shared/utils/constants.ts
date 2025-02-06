export const SALT_ROUNDS = 11;

export const JWT_CONSTANTS = {
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
};

export const STATUS_CODE = {
  1: 'CN_WAREHOUSE',
  2: 'VN_WAREHOUSE',
  3: 'DISPATCHED',
  4: 'PENDING',
};

export const SHIPMENT_STATUS_TEXT = {
  PENDING: 'Chờ xử lý',
  CN_WAREHOUSE: 'Đã nhập kho TQ',
  IN_TRANSIT_VN: 'Đang chuyển về VN',
  VN_WAREHOUSE: 'Đã nhập kho VN',
  DISPATCHED: 'Đã xuất',
  REJECTED: 'Đã từ chối',
  UNDEFINED: 'Không xác định',
};

export const PREFIX_USER = 'TA';
export const USER_KXD = `${PREFIX_USER}-KXD`;
