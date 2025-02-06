/*
    Xử lý trường hợp mã vận đơn bị lỗi
    TH1: Xuất hiện dấu -
    ==> Bỏ từ dấu - trở đi
    VD: JDVA2677755030-1-1-1 ==> JDVA2677755030

    TH2: Bắt đầu bằng R02Z thì bỏ đi
    VD: R02ZJDVA2677755030 ==> JDVA2677755030
*/

export const formatTrackingNumber = (trackingNumber: string) => {
  if (!trackingNumber) return '';

  // TH1
  if (trackingNumber.includes('-')) {
    return trackingNumber.split('-')[0];
  }

  // TH2
  if (trackingNumber.startsWith('R02Z')) {
    return trackingNumber.slice(4);
  }

  return trackingNumber;
};

export const convertDotToComma = (value: string) => {
  if (!value) return '';

  return value.replace(/\./g, ',');
};

export const convertCommaToDot = (value: string) => {
  if (!value) return '';

  return value.replace(/,/g, '.');
};

export const removeDot = (value: string) => {
  if (!value) return '';

  return value.replace(/\./g, '');
};
