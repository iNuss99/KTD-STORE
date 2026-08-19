export interface AdministrativeDivision {
  name: string;
  districts: {
    name: string;
    wards: string[];
  }[];
}

export const VN_PROVINCES: AdministrativeDivision[] = [
  {
    name: 'TP. Hồ Chí Minh',
    districts: [
      { name: 'Quận 1', wards: ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Cầu Kho', 'Phường Cầu Ông Lãnh', 'Phường Cô Giang', 'Phường Đa Kao', 'Phường Nguyễn Cư Trinh', 'Phường Nguyễn Thái Bình', 'Phường Phạm Ngũ Lão', 'Phường Tân Định'] },
      { name: 'Quận 3', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường Võ Thị Sáu'] },
      { name: 'Quận 4', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 6', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 18'] },
      { name: 'Quận 5', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14'] },
      { name: 'Quận 6', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14'] },
      { name: 'Quận 7', wards: ['Phường Bình Thuận', 'Phường Phú Mỹ', 'Phường Phú Thuận', 'Phường Tân Hưng', 'Phường Tân Kiểng', 'Phường Tân Phong', 'Phường Tân Phú', 'Phường Tân Quy', 'Phường Tân Thuận Đông', 'Phường Tân Thuận Tây'] },
      { name: 'Quận 8', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16'] },
      { name: 'Quận 10', wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'] },
      { name: 'Quận 11', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16'] },
      { name: 'Quận 12', wards: ['Phường An Phú Đông', 'Phường Đông Hưng Thuận', 'Phường Hiệp Thành', 'Phường Tân Chánh Hiệp', 'Phường Tân Hưng Thuận', 'Phường Tân Thới Hiệp', 'Phường Tân Thới Nhất', 'Phường Thạnh Lộc', 'Phường Thạnh Xuân', 'Phường Thới An', 'Phường Trung Mỹ Tây'] },
      { name: 'TP. Thủ Đức', wards: ['Phường An Khánh', 'Phường An Lợi Đông', 'Phường An Phú', 'Phường Bình Chiểu', 'Phường Bình Thọ', 'Phường Cát Lái', 'Phường Hiệp Bình Chánh', 'Phường Hiệp Bình Phước', 'Phường Hiệp Phú', 'Phường Linh Chiểu', 'Phường Linh Đông', 'Phường Linh Tây', 'Phường Linh Trung', 'Phường Linh Xuân', 'Phường Long Bình', 'Phường Long Phước', 'Phường Long Thạnh Mỹ', 'Phường Long Trường', 'Phường Phú Hữu', 'Phường Phước Bình', 'Phường Phước Long A', 'Phường Phước Long B', 'Phường Tam Bình', 'Phường Tam Phú', 'Phường Tăng Nhơn Phú A', 'Phường Tăng Nhơn Phú B', 'Phường Tân Phú', 'Phường Thảo Điền', 'Phường Thịnh Mỹ Lợi', 'Phường Trường Thạnh', 'Phường Trường Thọ'] },
      { name: 'Quận Bình Thạnh', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 17', 'Phường 19', 'Phường 21', 'Phường 22', 'Phường 24', 'Phường 25', 'Phường 26', 'Phường 27', 'Phường 28'] },
      { name: 'Quận Gò Vấp', wards: ['Phường 1', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17'] },
      { name: 'Quận Phú Nhuận', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 13', 'Phường 15', 'Phường 17'] },
      { name: 'Quận Tân Bình', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'] },
      { name: 'Quận Tân Phú', wards: ['Phường Hiệp Tân', 'Phường Hòa Thạnh', 'Phường Phú Thạnh', 'Phường Phú Thọ Hòa', 'Phường Phú Trung', 'Phường Sơn Kỳ', 'Phường Tân Quý', 'Phường Tân Sơn Nhì', 'Phường Tân Thành', 'Phường Tân Thới Hòa', 'Phường Tây Thạnh'] },
      { name: 'Quận Bình Tân', wards: ['Phường An Lạc', 'Phường An Lạc A', 'Phường Bình Hưng Hòa', 'Phường Bình Hưng Hòa A', 'Phường Bình Hưng Hòa B', 'Phường Bình Trị Đông', 'Phường Bình Trị Đông A', 'Phường Bình Trị Đông B', 'Phường Tân Tạo', 'Phường Tân Tạo A'] },
      { name: 'Huyện Bình Chánh', wards: ['Thị trấn Tân Túc', 'Xã An Phú Tây', 'Xã Bình Chánh', 'Xã Bình Hưng', 'Xã Bình Lợi', 'Xã Đa Phước', 'Xã Hưng Long', 'Xã Lê Minh Xuân', 'Xã Phạm Văn Hai', 'Xã Phong Phú', 'Xã Quy Đức', 'Xã Tân Kiên', 'Xã Tân Nhựt', 'Xã Tân Quý Tây', 'Xã Vĩnh Lộc A', 'Xã Vĩnh Lộc B'] },
      { name: 'Huyện Hóc Môn', wards: ['Thị trấn Hóc Môn', 'Xã Bà Điểm', 'Xã Đông Thạnh', 'Xã Nhị Bình', 'Xã Tân Hiệp', 'Xã Tân Thới Nhì', 'Xã Tân Xuân', 'Xã Thới Tam Thôn', 'Xã Trung Chánh', 'Xã Xuân Thới Đông', 'Xã Xuân Thới Sơn', 'Xã Xuân Thới Thượng'] },
      { name: 'Huyện Củ Chi', wards: ['Thị trấn Củ Chi', 'Xã An Nhơn Tây', 'Xã An Phú', 'Xã Bình Mỹ', 'Xã Căn Hưng', 'Xã Nhuận Đức', 'Xã Phạm Văn Cội', 'Xã Phú Hòa Đông', 'Xã Phú Mỹ Hưng', 'Xã Tân An Hội', 'Xã Tân Thông Hội', 'Xã Trung An'] },
      { name: 'Huyện Nhà Bè', wards: ['Thị trấn Nhà Bè', 'Xã Hiệp Phước', 'Xã Long Thới', 'Xã Nhơn Đức', 'Xã Phú Xuân', 'Xã Phước Kiển', 'Xã Phước Lộc'] },
      { name: 'Huyện Cần Giờ', wards: ['Thị trấn Cần Thạnh', 'Xã An Thới Đông', 'Xã Bình Khánh', 'Xã Long Hòa', 'Xã Lý Nhơn', 'Xã Tam Thôn Hiệp', 'Xã Thạnh An'] }
    ]
  },
  {
    name: 'Hà Nội',
    districts: [
      { name: 'Quận Ba Đình', wards: ['Phường Cống Vị', 'Phường Điện Biên', 'Phường Đội Cấn', 'Phường Giảng Võ', 'Phường Kim Mã', 'Phường Liễu Giai', 'Phường Ngọc Hà', 'Phường Ngọc Khánh', 'Phường Nguyễn Trung Trực', 'Phường Phúc Xá', 'Phường Quán Thánh', 'Phường Thành Công', 'Phường Trúc Bạch', 'Phường Vĩnh Phúc'] },
      { name: 'Quận Hoàn Kiếm', wards: ['Phường Chương Dương', 'Phường Cửa Đông', 'Phường Cửa Nam', 'Phường Đồng Xuân', 'Phường Hàng Bạc', 'Phường Hàng Bài', 'Phường Hàng Bồ', 'Phường Hàng Bông', 'Phường Hàng Buồm', 'Phường Hàng Đào', 'Phường Hàng Gai', 'Phường Hàng Mã', 'Phường Hàng Trống', 'Phường Lý Thái Tổ', 'Phường Phan Chu Trinh', 'Phường Phúc Tân', 'Phường Tràng Tiền', 'Phường Trần Hưng Đạo'] },
      { name: 'Quận Tây Hồ', wards: ['Phường Bưởi', 'Phường Nhật Tân', 'Phường Phú Thượng', 'Phường Quảng An', 'Phường Thụy Khuê', 'Phường Tứ Liên', 'Phường Xuân La', 'Phường Yên Phụ'] },
      { name: 'Quận Cầu Giấy', wards: ['Phường Dịch Vọng', 'Phường Dịch Vọng Hậu', 'Phường Mai Dịch', 'Phường Nghĩa Đô', 'Phường Nghĩa Tân', 'Phường Quan Hoa', 'Phường Trung Hòa', 'Phường Yên Hòa'] },
      { name: 'Quận Đống Đa', wards: ['Phường Cát Linh', 'Phường Hàng Bột', 'Phường Khâm Thiên', 'Phường Khương Thượng', 'Phường Kim Liên', 'Phường Láng Hạ', 'Phường Láng Thượng', 'Phường Nam Đồng', 'Phường Ngã Tư Sở', 'Phường Ô Chợ Dừa', 'Phường Phương Liên', 'Phường Phương Mai', 'Phường Quang Trung', 'Phường Quốc Tử Giám', 'Phường Thịnh Quang', 'Phường Thổ Quan', 'Phường Trung Liệt', 'Phường Trung Phụng', 'Phường Trung Tự', 'Phường Văn Chương', 'Phường Văn Miếu'] },
      { name: 'Quận Hai Bà Trưng', wards: ['Phường Bạch Đằng', 'Phường Bách Khoa', 'Phường Bạch Mai', 'Phường Cầu Dền', 'Phường Đống Mác', 'Phường Đồng Nhân', 'Phường Đồng Tâm', 'Phường Lê Đại Hành', 'Phường Minh Khai', 'Phường Nguyễn Du', 'Phường Phạm Đình Hổ', 'Phường Phố Huế', 'Phường Quỳnh Lôi', 'Phường Quỳnh Mai', 'Phường Thanh Lương', 'Phường Thanh Nhàn', 'Phường Trương Định', 'Phường Vĩnh Tuy'] },
      { name: 'Quận Hoàng Mai', wards: ['Phường Đại Kim', 'Phường Định Công', 'Phường Giáp Bát', 'Phường Hoàng Liệt', 'Phường Hoàng Văn Thụ', 'Phường Lĩnh Nam', 'Phường Mai Động', 'Phường Tân Mai', 'Phường Thanh Trì', 'Phường Thịnh Liệt', 'Phường Trần Phú', 'Phường Tương Mai', 'Phường Vĩnh Hưng', 'Phường Yên Sở'] },
      { name: 'Quận Thanh Xuân', wards: ['Phường Hạ Đình', 'Phường Khương Đình', 'Phường Khương Mai', 'Phường Khương Trung', 'Phường Kim Giang', 'Phường Nhân Chính', 'Phường Phương Liệt', 'Phường Thanh Xuân Bắc', 'Phường Thanh Xuân Nam', 'Phường Thanh Xuân Trung', 'Phường Thượng Đình'] },
      { name: 'Quận Nam Từ Liêm', wards: ['Phường Cầu Diễn', 'Phường Đại Mỗ', 'Phường Mễ Trì', 'Phường Mỹ Đình 1', 'Phường Mỹ Đình 2', 'Phường Phú Đô', 'Phường Phương Canh', 'Phường Tây Mỗ', 'Phường Trung Văn', 'Phường Xuân Phương'] },
      { name: 'Quận Bắc Từ Liêm', wards: ['Phường Cổ Nhuế 1', 'Phường Cổ Nhuế 2', 'Phường Đông Ngạc', 'Phường Đức Thắng', 'Phường Liên Mạc', 'Phường Minh Khai', 'Phường Phú Diễn', 'Phường Phúc Diễn', 'Phường Tây Tựu', 'Phường Thụy Phương', 'Phường Thượng Cát', 'Phường Xuân Đỉnh', 'Phường Xuân Tảo'] },
      { name: 'Quận Hà Đông', wards: ['Phường Biên Giang', 'Phường Đồng Mai', 'Phường Dương Nội', 'Phường Hà Cầu', 'Phường Kiến Hưng', 'Phường La Khê', 'Phường Mộ Lao', 'Phường Nguyễn Trãi', 'Phường Phú La', 'Phường Phú Lãm', 'Phường Phú Lương', 'Phường Phúc La', 'Phường Quang Trung', 'Phường Vạn Phúc', 'Phường Văn Quán', 'Phường Yên Nghĩa', 'Phường Yết Kiêu'] },
      { name: 'Quận Long Biên', wards: ['Phường Bồ Đề', 'Phường Cự Khối', 'Phường Đức Giang', 'Phường Gia Thụy', 'Phường Giang Biên', 'Phường Long Biên', 'Phường Ngọc Lâm', 'Phường Ngọc Thụy', 'Phường Phúc Đồng', 'Phường Phúc Lợi', 'Phường Sài Đồng', 'Phường Thạch Bàn', 'Phường Thượng Thanh', 'Phường Việt Hưng'] },
      { name: 'Huyện Gia Lâm', wards: ['Thị trấn Trâu Quỳ', 'Thị trấn Yên Viên', 'Xã Bát Tràng', 'Xã Cổ Bi', 'Xã Đa Tốn', 'Xã Đặng Xá', 'Xã Ninh Hiệp', 'Xã Phù Đổng', 'Xã Dương Xá'] },
      { name: 'Huyện Đông Anh', wards: ['Thị trấn Đông Anh', 'Xã Bắc Hồng', 'Xã Cổ Loa', 'Xã Hải Bối', 'Xã Kim Chung', 'Xã Kim Nỗ', 'Xã Nam Hồng', 'Xã Tiên Dương', 'Xã Uy Nỗ', 'Xã Vĩnh Ngọc', 'Xã Võng La'] },
      { name: 'Huyện Thanh Trì', wards: ['Thị trấn Văn Điển', 'Xã Đại Áng', 'Xã Đông Mỹ', 'Xã Duyên Hà', 'Xã Hữu Hòa', 'Xã Liên Ninh', 'Xã Ngọc Hồi', 'Xã Ngũ Hiệp', 'Xã Tả Thanh Oai', 'Xã Tam Hiệp', 'Xã Tân Triều', 'Xã Thanh Liệt', 'Xã Tứ Hiệp', 'Xã Vạn Phúc', 'Xã Vĩnh Quỳnh', 'Xã Yên Mỹ'] },
      { name: 'Huyện Hoài Đức', wards: ['Thị trấn Trạm Trôi', 'Xã An Khánh', 'Xã An Thượng', 'Xã Cát Quế', 'Xã Đắc Sở', 'Xã Di Trạch', 'Xã Đông La', 'Xã Đức Giang', 'Xã Đức Thượng', 'Xã Kim Chung', 'Xã La Phù', 'Xã Lại Yên', 'Xã Song Phương', 'Xã Tiền Yên', 'Xã Vân Canh', 'Xã Vân Côn', 'Xã Yên Sở'] }
    ]
  },
  {
    name: 'Đà Nẵng',
    districts: [
      { name: 'Quận Hải Châu', wards: ['Phường Bình Hiên', 'Phường Bình Thuận', 'Phường Hải Châu I', 'Phường Hải Châu II', 'Phường Hòa Cường Bắc', 'Phường Hòa Cường Nam', 'Phường Hòa Thuận Đông', 'Phường Hòa Thuận Tây', 'Phường Nam Dương', 'Phường Phước Ninh', 'Phường Thạch Thang', 'Phường Thanh Bình', 'Phường Thuận Phước'] },
      { name: 'Quận Thanh Khê', wards: ['Phường An Khê', 'Phường Chính Gián', 'Phường Hòa Khê', 'Phường Tam Thuận', 'Phường Tân Chính', 'Phường Thạc Gián', 'Phường Thanh Khê Đông', 'Phường Thanh Khê Tây', 'Phường Vĩnh Trung', 'Phường Xuân Hà'] },
      { name: 'Quận Sơn Trà', wards: ['Phường An Hải Bắc', 'Phường An Hải Đông', 'Phường An Hải Tây', 'Phường Mân Thái', 'Phường Nại Hiên Đông', 'Phường Phước Mỹ', 'Phường Thọ Quang'] },
      { name: 'Quận Ngũ Hành Sơn', wards: ['Phường Hòa Hải', 'Phường Hòa Quý', 'Phường Khuê Mỹ', 'Phường Mỹ An'] },
      { name: 'Quận Liên Chiểu', wards: ['Phường Hòa Hiệp Bắc', 'Phường Hòa Hiệp Nam', 'Phường Hòa Khánh Bắc', 'Phường Hòa Khánh Nam', 'Phường Hòa Minh'] },
      { name: 'Quận Cẩm Lệ', wards: ['Phường Hòa An', 'Phường Hòa Phát', 'Phường Hòa Thọ Đông', 'Phường Hòa Thọ Tây', 'Phường Hòa Xuân', 'Phường Khuê Trung'] },
      { name: 'Huyện Hòa Vang', wards: ['Xã Hòa Bắc', 'Xã Hòa Châu', 'Xã Hòa Khương', 'Xã Hòa Liên', 'Xã Hòa Nhơn', 'Xã Hòa Ninh', 'Xã Hòa Phong', 'Xã Hòa Phú', 'Xã Hòa Phước', 'Xã Hòa Sơn', 'Xã Hòa Tiến'] }
    ]
  },
  {
    name: 'Hải Phòng',
    districts: [
      { name: 'Quận Hồng Bàng', wards: ['Phường Hoàng Văn Thụ', 'Phường Minh Khai', 'Phường Phan Bội Châu', 'Phường Quán Toan', 'Phường Sở Dầu', 'Phường Thượng Lý', 'Phường Trại Chuối'] },
      { name: 'Quận Ngô Quyền', wards: ['Phường Cầu Đất', 'Phường Cầu Tre', 'Phường Đằng Giang', 'Phường Đông Khê', 'Phường Gia Viên', 'Phường Lạc Viên', 'Phường Lạch Tray', 'Phường Lê Lợi', 'Phường Máy Chai', 'Phường Máy Tơ', 'Phường Vạn Mỹ'] },
      { name: 'Quận Lê Chân', wards: ['Phường An Biên', 'Phường An Dương', 'Phường Cát Dài', 'Phường Đông Hải', 'Phường Dư Hàng', 'Phường Dư Hàng Kênh', 'Phường Hàng Kênh', 'Phường Hồ Nam', 'Phường Kênh Dương', 'Phường Lam Sơn', 'Phường Niệm Nghĩa', 'Phường Nghĩa Xá', 'Phường Trại Cau', 'Phường Trần Nguyên Hãn', 'Phường Vĩnh Niệm'] },
      { name: 'Quận Hải An', wards: ['Phường Cát Bi', 'Phường Đằng Hải', 'Phường Đằng Lâm', 'Phường Đông Hải 1', 'Phường Đông Hải 2', 'Phường Nam Hải', 'Phường Thành Tô', 'Phường Tràng Cát'] },
      { name: 'Quận Kiến An', wards: ['Phường Bắc Sơn', 'Phường Đồng Hòa', 'Phường Nam Sơn', 'Phường Ngọc Sơn', 'Phường Phù Liễn', 'Phường Quán Trữ', 'Phường Trần Thành Ngọ', 'Phường Tràng Minh', 'Phường Văn Đẩu'] }
    ]
  },
  {
    name: 'Cần Thơ',
    districts: [
      { name: 'Quận Ninh Kiều', wards: ['Phường An Bình', 'Phường An Cư', 'Phường An Hòa', 'Phường An Khánh', 'Phường An Nghiệp', 'Phường Cái Khế', 'Phường Hưng Lợi', 'Phường Tân An', 'Phường Thới Bình', 'Phường Xuân Khánh'] },
      { name: 'Quận Bình Thủy', wards: ['Phường An Thới', 'Phường Bình Thủy', 'Phường Bùi Hữu Nghĩa', 'Phường Long Hòa', 'Phường Long Tuyền', 'Phường Thới An Đông', 'Phường Trà An', 'Phường Trà Nóc'] },
      { name: 'Quận Cái Răng', wards: ['Phường Ba Láng', 'Phường Hưng Phú', 'Phường Hưng Thạnh', 'Phường Lê Bình', 'Phường Phú Thứ', 'Phường Tân Phú', 'Phường Yên Thượng'] },
      { name: 'Quận Ô Môn', wards: ['Phường Châu Văn Liêm', 'Phường Long Hưng', 'Phường Phước Thới', 'Phường Thới An', 'Phường Thới Hòa', 'Phường Thới Long'] }
    ]
  },
  {
    name: 'Bình Dương',
    districts: [
      { name: 'TP. Thủ Dầu Một', wards: ['Phường Chánh Mỹ', 'Phường Chánh Nghĩa', 'Phường Định Hòa', 'Phường Hiệp An', 'Phường Hiệp Thành', 'Phường Hòa Phú', 'Phường Phú Cường', 'Phường Phú Hòa', 'Phường Phú Lợi', 'Phường Phú Mỹ', 'Phường Phú Tân', 'Phường Phú Thọ', 'Phường Tân An', 'Phường Tương Bình Hiệp'] },
      { name: 'TP. Thuận An', wards: ['Phường An Phú', 'Phường An Thạnh', 'Phường Bình Chuẩn', 'Phường Bình Hòa', 'Phường Bình Nhâm', 'Phường Hưng Định', 'Phường Lái Thiêu', 'Phường Thuận Giao', 'Phường Vĩnh Phú', 'Xã An Sơn'] },
      { name: 'TP. Dĩ An', wards: ['Phường An Bình', 'Phường Bình An', 'Phường Bình Thắng', 'Phường Dĩ An', 'Phường Đông Hòa', 'Phường Tân Bình', 'Phường Tân Đông Hiệp'] },
      { name: 'TP. Tân Uyên', wards: ['Phường Hội Nghĩa', 'Phường Khánh Bình', 'Phường Phú Chánh', 'Phường Tân Hiệp', 'Phường Tân Phước Khánh', 'Phường Tân Vĩnh Hiệp', 'Phường Thái Hòa', 'Phường Thạnh Phước', 'Phường Uyên Hưng', 'Phường Vĩnh Tân'] },
      { name: 'TP. Bến Cát', wards: ['Phường An Điền', 'Phường An Tây', 'Phường Chánh Phú Hòa', 'Phường Hòa Lợi', 'Phường Mỹ Phước', 'Phường Tân Định', 'Phường Thới Hòa'] }
    ]
  },
  {
    name: 'Đồng Nai',
    districts: [
      { name: 'TP. Biên Hòa', wards: ['Phường An Bình', 'Phường An Hòa', 'Phường Bình Đa', 'Phường Bửu Hòa', 'Phường Bửu Long', 'Phường Hiệp Hòa', 'Phường Hóa An', 'Phường Hòa Bình', 'Phường Hố Nai', 'Phường Long Bình', 'Phường Long Bình Tân', 'Phường Phước Tân', 'Phường Quang Vinh', 'Phường Quyết Thắng', 'Phường Tam Hiệp', 'Phường Tam Hòa', 'Phường Tam Phước', 'Phường Tân Biên', 'Phường Tân Hạnh', 'Phường Tân Hiệp', 'Phường Tân Hòa', 'Phường Tân Mai', 'Phường Tân Phong', 'Phường Tân Tiến', 'Phường Tân Vạn', 'Phường Thanh Bình', 'Phường Thống Nhất', 'Phường Trảng Dài', 'Phường Trung Dũng', 'Xã Long Hưng'] },
      { name: 'TP. Long Khánh', wards: ['Phường Bàu Sen', 'Phường Phú Bình', 'Phường Suối Tre', 'Phường Xuân An', 'Phường Xuân Bình', 'Phường Xuân Hòa', 'Phường Xuân Lập', 'Phường Xuân Tân', 'Phường Xuân Thanh', 'Phường Xuân Trung'] },
      { name: 'Huyện Long Thành', wards: ['Thị trấn Long Thành', 'Xã An Phước', 'Xã Bàu Cạn', 'Xã Bình An', 'Xã Bình Sơn', 'Xã Cẩm Đường', 'Xã Lộc An', 'Xã Long An', 'Xã Long Đức', 'Xã Phước Bình', 'Xã Phước Thái', 'Xã Tam An', 'Xã Tân Hiệp'] },
      { name: 'Huyện Nhơn Trạch', wards: ['Thị trấn Hiệp Phước', 'Xã Đại Phước', 'Xã Long Tân', 'Xã Long Thọ', 'Xã Phú Đông', 'Xã Phú Hội', 'Xã Phú Hữu', 'Xã Phú Thạnh', 'Xã Phước An', 'Xã Phước Khánh', 'Xã Phước Thiền', 'Xã Vĩnh Thanh'] }
    ]
  },
  {
    name: 'Bà Rịa - Vũng Tàu',
    districts: [
      { name: 'TP. Vũng Tàu', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường Thắng Nhất', 'Phường Thắng Nhì', 'Phường Thắng Tam', 'Phường Rạch Dừa', 'Phường Nguyễn An Ninh', 'Xã Long Sơn'] },
      { name: 'TP. Bà Rịa', wards: ['Phường Kim Dinh', 'Phường Long Hương', 'Phường Long Tâm', 'Phường Long Toàn', 'Phường Phước Hưng', 'Phường Phước Hiệp', 'Phường Phước Nguyên', 'Phường Phước Trung', 'Xã Hòa Long', 'Xã Long Phước', 'Xã Tân Hưng'] },
      { name: 'Thị xã Phú Mỹ', wards: ['Phường Hắc Dịch', 'Phường Mỹ Xuân', 'Phường Phú Mỹ', 'Phường Phước Hòa', 'Phường Tân Phước', 'Xã Châu Pha', 'Xã Sông Xoài', 'Xã Tân Hải', 'Xã Tân Hòa', 'Xã Tóc Tiên'] }
    ]
  },
  {
    name: 'Khánh Hòa',
    districts: [
      { name: 'TP. Nha Trang', wards: ['Phường Lộc Thọ', 'Phường Ngọc Hiệp', 'Phường Phước Hải', 'Phường Phước Hòa', 'Phường Phước Long', 'Phường Phước Tân', 'Phường Phước Tiến', 'Phường Phương Sài', 'Phường Phương Sơn', 'Phường Tân Lập', 'Phường Vạn Thắng', 'Phường Vạn Thạnh', 'Phường Vĩnh Hải', 'Phường Vĩnh Hòa', 'Phường Vĩnh Phước', 'Phường Vĩnh Thọ', 'Phường Vĩnh Trường', 'Phường Vĩnh Nguyên', 'Phường Xương Huân'] },
      { name: 'TP. Cam Ranh', wards: ['Phường Ba Ngòi', 'Phường Cam Linh', 'Phường Cam Lộc', 'Phường Cam Lợi', 'Phường Cam Nghĩa', 'Phường Cam Phú', 'Phường Cam Phúc Bắc', 'Phường Cam Phúc Nam', 'Phường Cam Thuận'] }
    ]
  },
  {
    name: 'Lâm Đồng',
    districts: [
      { name: 'TP. Đà Lạt', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Xã Tà Nung', 'Xã Trạm Hành', 'Xã Xuân Thọ', 'Xã Xuân Trường'] },
      { name: 'TP. Bảo Lộc', wards: ['Phường 1', 'Phường 2', 'Phường B’Lao', 'Phường Lộc Phát', 'Phường Lộc Sơn', 'Phường Lộc Tiến'] }
    ]
  },
  {
    name: 'Quảng Ninh',
    districts: [
      { name: 'TP. Hạ Long', wards: ['Phường Bạch Đằng', 'Phường Bãi Cháy', 'Phường Cao Thắng', 'Phường Cao Xanh', 'Phường Đại Yên', 'Phường Giếng Đáy', 'Phường Hà Khánh', 'Phường Hà Khẩu', 'Phường Hà Lầm', 'Phường Hà Phong', 'Phường Hà Trung', 'Phường Hà Tu', 'Phường Hòn Gai', 'Phường Hồng Gai', 'Phường Hồng Hà', 'Phường Hồng Hải', 'Phường Hùng Thắng', 'Phường Tuần Châu', 'Phường Việt Hưng', 'Phường Yết Kiêu'] },
      { name: 'TP. Cẩm Phả', wards: ['Phường Cẩm Bình', 'Phường Cẩm Đông', 'Phường Cẩm Phú', 'Phường Cẩm Sơn', 'Phường Cẩm Tây', 'Phường Cẩm Thạch', 'Phường Cẩm Thành', 'Phường Cẩm Thịnh', 'Phường Cẩm Thủy', 'Phường Cẩm Trung', 'Phường Cửa Ông', 'Phường Mông Dương', 'Phường Quang Hanh'] },
      { name: 'TP. Uông Bí', wards: ['Phường Bắc Sơn', 'Phường Nam Khê', 'Phường Phương Đông', 'Phường Phương Nam', 'Phường Quang Trung', 'Phường Thanh Sơn', 'Phường Trưng Vương', 'Phường Vàng Danh', 'Phường Yên Thanh'] }
    ]
  },
  {
    name: 'Thừa Thiên Huế',
    districts: [
      { name: 'TP. Huế', wards: ['Phường An Cựu', 'Phường An Đông', 'Phường An Hòa', 'Phường An Tây', 'Phường Đông Ba', 'Phường Gia Hội', 'Phường Hương An', 'Phường Hương Hồ', 'Phường Hương Long', 'Phường Hương Sơ', 'Phường Hương Vinh', 'Phường Kim Long', 'Phường Phú Hậu', 'Phường Phú Hội', 'Phường Phú Nhuận', 'Phường Phú Thượng', 'Phường Phước Vĩnh', 'Phường Phường Đúc', 'Phường Tây Lộc', 'Phường Thuận An', 'Phường Thuận Hòa', 'Phường Thuận Lộc', 'Phường Thủy Biều', 'Phường Thủy Vân', 'Phường Thủy Xuân', 'Phường Trường An', 'Phường Vĩnh Ninh', 'Phường Vỹ Dạ', 'Phường Xuân Phú'] }
    ]
  },
  {
    name: 'Bắc Ninh',
    districts: [
      { name: 'TP. Bắc Ninh', wards: ['Phường Đại Phúc', 'Phường Đáp Cầu', 'Phường Hạp Lĩnh', 'Phường Khắc Niệm', 'Phường Khúc Xuyên', 'Phường Kinh Bắc', 'Phường Ninh Xá', 'Phường Phong Khê', 'Phường Suối Hoa', 'Phường Thị Cầu', 'Phường Tiền An', 'Phường Vạn An', 'Phường Vân Dương', 'Phường Vệ An', 'Phường Võ Cường', 'Phường Vũ Ninh'] },
      { name: 'TP. Từ Sơn', wards: ['Phường Châu Khê', 'Phường Đình Bảng', 'Phường Đồng Kỵ', 'Phường Đông Ngàn', 'Phường Đồng Nguyên', 'Phường Hương Mạc', 'Phường Phù Chẩn', 'Phường Phù Khê', 'Phường Tam Sơn', 'Phường Tân Hồng', 'Phường Trang Hạ', 'Phường Tương Giang'] }
    ]
  },
  {
    name: 'Nghệ An',
    districts: [
      { name: 'TP. Vinh', wards: ['Phường Bến Thủy', 'Phường Cửa Nam', 'Phường Đội Cung', 'Phường Đông Vĩnh', 'Phường Hà Huy Tập', 'Phường Hưng Bình', 'Phường Hưng Dũng', 'Phường Hưng Phúc', 'Phường Lê Lợi', 'Phường Lê Mao', 'Phường Quán Bàu', 'Phường Quang Trung', 'Phường Trung Đô', 'Phường Trường Thi', 'Phường Vinh Tân'] },
      { name: 'Thị xã Cửa Lò', wards: ['Phường Nghi Hải', 'Phường Nghi Hòa', 'Phường Nghi Hương', 'Phường Nghi Tân', 'Phường Nghi Thu', 'Phường Nghi Thủy', 'Phường Thu Thủy'] }
    ]
  },
  {
    name: 'Thanh Hóa',
    districts: [
      { name: 'TP. Thanh Hóa', wards: ['Phường An Hưng', 'Phường Ba Đình', 'Phường Điện Biên', 'Phường Đông Cương', 'Phường Đông Hải', 'Phường Đông Hương', 'Phường Đông Sơn', 'Phường Đông Thọ', 'Phường Đông Vệ', 'Phường Hàm Rồng', 'Phường Lam Sơn', 'Phường Nam Ngạn', 'Phường Ngọc Trạo', 'Phường Phú Sơn', 'Phường Quảng Cát', 'Phường Quảng Đông', 'Phường Quảng Hưng', 'Phường Quảng Thành', 'Phường Quảng Thắng', 'Phường Quảng Thịnh', 'Phường Quảng Tâm', 'Phường Tào Xuyên', 'Phường Tân Sơn', 'Phường Trường Thi'] },
      { name: 'TP. Sầm Sơn', wards: ['Phường Bắc Sơn', 'Phường Quảng Châu', 'Phường Quảng Cư', 'Phường Quảng Tiến', 'Phường Quảng Thọ', 'Phường Quảng Vinh', 'Phường Trung Sơn', 'Phường Trường Sơn'] }
    ]
  },
  {
    name: 'Quảng Nam',
    districts: [
      { name: 'TP. Tam Kỳ', wards: ['Phường An Mỹ', 'Phường An Phú', 'Phường An Sơn', 'Phường An Xuân', 'Phường Hòa Hương', 'Phường Phước Hòa', 'Phường Tân Thạnh', 'Phường Trường Xuân'] },
      { name: 'TP. Hội An', wards: ['Phường Cẩm An', 'Phường Cẩm Châu', 'Phường Cẩm Nam', 'Phường Cẩm Phô', 'Phường Cửa Đại', 'Phường Minh An', 'Phường Sơn Phong', 'Phường Tân An', 'Phường Thanh Hà'] }
    ]
  },
  {
    name: 'Kiên Giang',
    districts: [
      { name: 'TP. Rạch Giá', wards: ['Phường An Bình', 'Phường An Hòa', 'Phường Rạch Sỏi', 'Phường Vĩnh Bảo', 'Phường Vĩnh Hiệp', 'Phường Vĩnh Lạc', 'Phường Vĩnh Lợi', 'Phường Vĩnh Quang', 'Phường Vĩnh Thanh', 'Phường Vĩnh Thanh Vân', 'Phường Vĩnh Thông', 'Xã Phi Thông'] },
      { name: 'TP. Phú Quốc', wards: ['Phường An Thới', 'Phường Dương Đông', 'Xã Bãi Thơm', 'Xã Cửa Cạn', 'Xã Cửa Dương', 'Xã Dương Tơ', 'Xã Gành Dầu', 'Xã Hàm Ninh', 'Xã Thổ Châu'] }
    ]
  },
  // Full list of remaining provinces with generic district/ward support
  ...[
    'An Giang', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bến Tre', 'Bình Định', 'Bình Phước', 'Bình Thuận',
    'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
    'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình', 'Hưng Yên', 'Kon Tum', 'Lai Châu',
    'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
    'Quảng Bình', 'Quảng Ngãi', 'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
    'Tiền Giang', 'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
  ].map((pName) => ({
    name: pName,
    districts: [
      { name: `Thành phố ${pName}`, wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường Tân An', 'Phường Trung Tâm'] },
      { name: 'Huyện Trung Tâm', wards: ['Thị trấn Trung Tâm', 'Xã 1', 'Xã 2', 'Xã 3', 'Xã 4', 'Xã 5'] }
    ]
  }))
];

export const getProvinces = () => VN_PROVINCES.map((p) => p.name);

export const getDistricts = (provinceName: string) => {
  const p = VN_PROVINCES.find((item) => item.name === provinceName);
  return p ? p.districts.map((d) => d.name) : [];
};

export const getWards = (provinceName: string, districtName: string) => {
  const p = VN_PROVINCES.find((item) => item.name === provinceName);
  if (!p) return [];
  const d = p.districts.find((item) => item.name === districtName);
  return d ? d.wards : [];
};
