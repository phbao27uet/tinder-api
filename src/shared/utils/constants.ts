export const SALT_ROUNDS = 11;

export const JWT_CONSTANTS = {
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
};

export const EDUCATION = {
  CU_NHAN: 'Cử nhân',
  DANG_HOC_DAI_HOC: 'Đang học đại học',
  THPT: 'Trung học phổ thông',
  TIEN_SI: 'Tiến sĩ',
  THAC_SI: 'Thạc sĩ',
  SAU_DAI_HOC: 'Sau đại học',
  TRUONG_DAY_NGHE: 'Trường dạy nghề',
};

export const FUTURE_FAMILY = {
  MUON_CO_CON: 'Muốn có con',
  KHONG_MUON_CO_CON: 'Không muốn có con',
  CO_ROI_MUON_CO_THEM: 'Có rồi muốn có thêm',
  CO_ROI_KHONG_MUON_CO_THEM: 'Có rồi không muốn có thêm',
  CHUA_RO: 'Chưa rõ',
};

export const COMMUNICATION_STYLE = {
  NGHIEN_NHAN_TIN: 'Nghiên nhân tin',
  THICH_GOI_DIEN: 'Thích gọi điện',
  THICH_GOI_VIDEO: 'Thích gọi video',
  IT_NHAN_TIN: 'Ít nhận tin',
  THICH_GAP_MAT_TRUC_TIEP: 'Thích gặp mặt trực tiếp',
};

export const LOVE_LANGUAGE = {
  NHUNG_HANH_DONG_TINH_TE: 'Những hành động tình cảm',
  NHUNG_MON_QUA: 'Những món quà',
  NHUNG_CU_CHI_AU_YEM: 'Những cử chỉ ý yêu',
  NHUNG_LOI_KHEN: 'Những lời khén',
  THOI_GIAN_BEN_NHAU: 'Thời gian bên nhau',
};

export const PETS = {
  CHO: 'Chó',
  MEO: 'Mèo',
  BO_SAT: 'Bò sát',
  DONG_VAT_LUONG_CU: 'Động vật lưỡng cư',
  LOAI_CHIM: 'Loại chim',
  CA: 'Cá',
  RUA: 'Rùa',
  HAMSTER: 'Hamster',
  THO: 'Thỏ',
  KHAC: 'Khác',
  KHONG_NUOI_THU_CUNG: 'Không nuôi thú cưng',
  MUON_NUOI_THU_CUNG: 'Muốn nuôi thú cưng',
  DI_UNG_VOI_DONG_VAT: 'Dị ứng với động vật',
};

export const ALCOHOL_CONSUMPTION = {
  KHONG_DANH_CHO_MINH: 'Không đanh chọ mình',
  LUON_TINH_TAO: 'Luôn tỉnh táo',
  UONG_CO_TRACH_NGHIEM: 'Uống có trách nhiệm',
  CHI_NHUNG_DIP_DAC_BIET: 'Chỉ nhừng đợt đặc biệt',
  UONG_GIAO_LUU_VAO_CUOI_TUAN: 'Uống giao lưu vào cuối tuần',
  HAU_NHU_MOI_TOI: 'Hậu như mỗi tối',
};

export const SMOKING_PREFERENCE = {
  HUT_THUOC_VOI_BAN_BE: 'Hút thuốc với bạn bè',
  HUT_THUOC_KHI_NHAU: 'Hút thuốc khi nhàu',
  KHONG_HUT_THUOC: 'Không hút thuốc',
  HUT_THUOC_THUONG_XUYEN: 'Hút thuốc thường xuyên',
  DANG_CO_GANG_BO: 'Đang có gạng bụng',
};

export const EXERCISE_FREQUENCY = {
  HANG_NGAY: 'Hằng ngày',
  THUONG_XUYEN: 'Thường xuyên',
  THINH_THOANG: 'Thính thống',
  KHONG_TAP: 'Không tập',
};

export const DIETARY_PREFERENCE = {
  AN_THUAN_CHAY: 'An thuần chay',
  AN_CHAY: 'An chay',
  CHI_AN_HAI_SAN_RAU_CU: 'Chỉ ăn hai sản rau củ',
  CHI_AN_THIT: 'Chỉ ăn thịt',
  KHONG_AN_KIENG: 'Không ăn kiêng',
  KHAC: 'Khác',
};

export const SOCIAL_MEDIA_USAGE = {
  INFLUENCER: 'Influencer',
  HOAT_DONG_TICH_CUC: 'Hoạt động tích cực',
  KHONG_DUNG_MANG: 'Không dùng mạng',
  LUOT_DAO_AM_THAM: 'Lột da am thấm',
};

export const SLEEP_PATTERN = {
  DAY_SOM: 'Ngày sóm',
  CU_DEM: 'Củ đêm',
  GIO_GIAC_LINH_HOAT: 'Giờ giấc linh hoạt',
};

export const LOOKING_FOR = {
  NGUOI_YEU: 'Người yêu',
  HEN_HO_LAU_DAI: 'Bạn hẹn hò lâu dài',
  BAT_KI_DIEU_GI_CO_THE: 'Bất kì điều gì có thể',
  QUAN_HE_KHONG_RANG_BUOC: 'Quan hệ không ràng buộc',
  NHUNG_NGUOI_BAN_MOI: 'Những người bạn mới',
  CHUA_RO: 'Chưa rõ',
};

export const ZODIAC_SIGN = {
  BachDuong: 'Bạch Dương',
  KimNguu: 'Kim Ngưu',
  SongTu: 'Song Tử',
  CuGiai: 'Cự Giải',
  SuTu: 'Sư Tử',
  XuNu: 'Xử Nữ',
  ThienBinh: 'Thiên Bình',
  BoCap: 'Bọ Cạp',
  NhanMa: 'Nhân Mã',
  MaKet: 'Ma Kết',
  BaoBinh: 'Bảo Bình',
  SongNgu: 'Song Ngư',
};

export const GENDER = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
};
