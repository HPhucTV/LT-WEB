// src/mockApi.js — Full mock data layer with multi-role accounts

const state = {
  tours: [
    {
      id: 1, code: 'PQ-001',
      name: 'Khám Phá Đảo Ngọc Phú Quốc',
      destination: 'Phú Quốc',
      durationDays: 3,
      price: 3500000, originalPrice: 4200000,
      promotionTitle: 'Ưu đãi biển đảo',
      promotionDescription: 'Giảm giá cho nhóm đặt sớm.',
      maxGuests: 30, category: 'Nghỉ dưỡng',
      description: 'Chuyến đi nghỉ dưỡng tuyệt vời tại hòn đảo xinh đẹp nhất Việt Nam. Tận hưởng bãi biển cát trắng, lặn ngắm san hô, tham quan làng chài và thưởng thức hải sản tươi sống.',
      imageUrl: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80',
      isActive: true
    },
    {
      id: 2, code: 'DL-002',
      name: 'Thành Phố Ngàn Hoa Đà Lạt',
      destination: 'Đà Lạt',
      durationDays: 4,
      price: 2800000, originalPrice: 3500000,
      promotionTitle: 'Deal trong tuần',
      promotionDescription: 'Áp dụng cho khách đặt tour Đà Lạt trong tuần này.',
      maxGuests: 25, category: 'Khám phá',
      description: 'Tận hưởng không khí se lạnh, thưởng ngoạn vườn hoa, thác nước hùng vĩ và thưởng thức cà phê chồn tại cao nguyên Lâm Viên.',
      imageUrl: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?w=800&q=80',
      isActive: true
    },
    {
      id: 3, code: 'HL-003',
      name: 'Di Sản Vịnh Hạ Long',
      destination: 'Hạ Long',
      durationDays: 2,
      price: 4200000, originalPrice: 4200000,
      maxGuests: 40, category: 'Khám phá',
      description: 'Nghỉ dưỡng trên du thuyền 5 sao, khám phá hang động kỳ bí, chèo kayak và thưởng thức hải sản giữa vịnh.',
      imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80',
      isActive: true
    },
    {
      id: 4, code: 'DN-004',
      name: 'Đà Nẵng - Hội An Cổ Kính',
      destination: 'Đà Nẵng',
      durationDays: 4,
      price: 5100000, originalPrice: 6500000,
      promotionTitle: 'Combo gia đình',
      promotionDescription: 'Ưu đãi cho nhóm gia đình từ 3 khách.',
      maxGuests: 35, category: 'Gia đình',
      description: 'Khám phá miền Trung với Bà Nà Hills, cầu Vàng, phố cổ Hội An lung linh đèn lồng và bãi biển Mỹ Khê.',
      imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80',
      isActive: true
    },
    {
      id: 5, code: 'SP-005',
      name: 'Sapa - Nơi Gặp Gỡ Đất Trời',
      destination: 'Sapa',
      durationDays: 3,
      price: 3200000, originalPrice: 3800000,
      maxGuests: 20, category: 'Khám phá',
      description: 'Trải nghiệm trekking qua ruộng bậc thang, homestay cùng đồng bào H\'Mông, chinh phục đỉnh Fansipan.',
      imageUrl: 'https://images.unsplash.com/photo-1596422846543-7ec79435b021?w=800&q=80',
      isActive: true
    },
    {
      id: 6, code: 'NT-006',
      name: 'Nha Trang - Thiên Đường Biển Đảo',
      destination: 'Nha Trang',
      durationDays: 3,
      price: 3800000, originalPrice: 4500000,
      maxGuests: 30, category: 'Nghỉ dưỡng',
      description: 'Lặn biển ngắm san hô, tắm bùn khoáng, tham quan Vinpearl Land và thưởng thức hải sản tươi sống.',
      imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80',
      isActive: true
    },
    {
      id: 7, code: 'HUE-007',
      name: 'Cố Đô Huế - Dấu Ấn Hoàng Cung',
      destination: 'Huế',
      durationDays: 3,
      price: 2900000, originalPrice: 3200000,
      maxGuests: 25, category: 'Gia đình',
      description: 'Tham quan Đại Nội, lăng tẩm vua Nguyễn, chùa Thiên Mụ và thưởng thức ẩm thực cung đình Huế.',
      imageUrl: 'https://images.unsplash.com/photo-1558005530-a7958896ec60?w=800&q=80',
      isActive: true
    },
    {
      id: 8, code: 'CM-008',
      name: 'Cà Mau - Mũi Cực Nam Tổ Quốc',
      destination: 'Cà Mau',
      durationDays: 2,
      price: 2200000, originalPrice: 2200000,
      maxGuests: 15, category: 'Khám phá',
      description: 'Khám phá rừng tràm U Minh, đất mũi Cà Mau và trải nghiệm đời sống miền Tây sông nước.',
      imageUrl: 'https://images.unsplash.com/photo-1504457047772-27faf1c00561?w=800&q=80',
      isActive: true
    }
  ],

  customers: [
    { id: 1, fullName: 'Nguyễn Văn An', phone: '0901234567', email: 'nguyenvanan@gmail.com', address: 'Quận 1, TP.HCM', createdAt: new Date().toISOString() },
    { id: 2, fullName: 'Trần Thị Bích', phone: '0912345678', email: 'tranthib@gmail.com', address: 'Quận 3, TP.HCM', createdAt: new Date().toISOString() },
    { id: 3, fullName: 'Lê Minh Châu', phone: '0923456789', email: 'leminhchau@gmail.com', address: 'Quận 7, TP.HCM', createdAt: new Date().toISOString() }
  ],

  bookings: [
    { id: 1, tourScheduleId: 1, tourName: 'Khám Phá Đảo Ngọc Phú Quốc', startDate: new Date(Date.now() + 86400000 * 5).toISOString(), customerName: 'Nguyễn Văn An', customerPhone: '0901234567', guestCount: 2, totalAmount: 7000000, status: 'Confirmed', paymentMethod: 'Cash', paymentStatus: 'Paid', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 2, tourScheduleId: 2, tourName: 'Thành Phố Ngàn Hoa Đà Lạt', startDate: new Date(Date.now() + 86400000 * 12).toISOString(), customerName: 'Trần Thị Bích', customerPhone: '0912345678', guestCount: 4, totalAmount: 11200000, status: 'Pending', paymentMethod: 'Cash', paymentStatus: 'Unpaid', createdAt: new Date(Date.now() - 86400000 * 1).toISOString() },
    { id: 3, tourScheduleId: 3, tourName: 'Di Sản Vịnh Hạ Long', startDate: new Date(Date.now() + 86400000 * 8).toISOString(), customerName: 'Lê Minh Châu', customerPhone: '0923456789', guestCount: 3, totalAmount: 12600000, status: 'Confirmed', paymentMethod: 'Cash', paymentStatus: 'Paid', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() }
  ],

  schedules: [
    { id: 1, tourId: 1, tourName: 'Khám Phá Đảo Ngọc Phú Quốc', startDate: new Date(Date.now() + 86400000 * 5).toISOString(), endDate: new Date(Date.now() + 86400000 * 7).toISOString(), availableSeats: 18, status: 'Open', guideUserId: 2, guideName: 'Nhân Viên Tư Vấn' },
    { id: 2, tourId: 1, tourName: 'Khám Phá Đảo Ngọc Phú Quốc', startDate: new Date(Date.now() + 86400000 * 15).toISOString(), endDate: new Date(Date.now() + 86400000 * 17).toISOString(), availableSeats: 30, status: 'Open' },
    { id: 3, tourId: 2, tourName: 'Thành Phố Ngàn Hoa Đà Lạt', startDate: new Date(Date.now() + 86400000 * 10).toISOString(), endDate: new Date(Date.now() + 86400000 * 13).toISOString(), availableSeats: 12, status: 'Open', guideUserId: 2, guideName: 'Nhân Viên Tư Vấn' },
    { id: 4, tourId: 3, tourName: 'Di Sản Vịnh Hạ Long', startDate: new Date(Date.now() + 86400000 * 8).toISOString(), endDate: new Date(Date.now() + 86400000 * 9).toISOString(), availableSeats: 25, status: 'Open' },
    { id: 5, tourId: 4, tourName: 'Đà Nẵng - Hội An Cổ Kính', startDate: new Date(Date.now() + 86400000 * 20).toISOString(), endDate: new Date(Date.now() + 86400000 * 23).toISOString(), availableSeats: 35, status: 'Open' },
    { id: 6, tourId: 5, tourName: 'Sapa - Nơi Gặp Gỡ Đất Trời', startDate: new Date(Date.now() + 86400000 * 7).toISOString(), endDate: new Date(Date.now() + 86400000 * 9).toISOString(), availableSeats: 10, status: 'Open' },
    { id: 7, tourId: 6, tourName: 'Nha Trang - Thiên Đường Biển Đảo', startDate: new Date(Date.now() + 86400000 * 14).toISOString(), endDate: new Date(Date.now() + 86400000 * 16).toISOString(), availableSeats: 20, status: 'Open' },
    { id: 8, tourId: 7, tourName: 'Cố Đô Huế - Dấu Ấn Hoàng Cung', startDate: new Date(Date.now() + 86400000 * 18).toISOString(), endDate: new Date(Date.now() + 86400000 * 20).toISOString(), availableSeats: 22, status: 'Open' }
  ],

  guideAvailabilities: [
    { id: 1, guideUserId: 2, startDate: new Date(Date.now() + 86400000 * 14).toISOString(), endDate: new Date(Date.now() + 86400000 * 20).toISOString(), status: 'Available', note: 'Ưu tiên tour biển', createdAt: new Date().toISOString() },
    { id: 2, guideUserId: 2, startDate: new Date(Date.now() + 86400000 * 24).toISOString(), endDate: new Date(Date.now() + 86400000 * 30).toISOString(), status: 'Available', note: '', createdAt: new Date().toISOString() }
  ],

  // ─── Multi-role accounts ────────────────────────────────────────────────
  // admin/admin123    → Quản trị viên (full access, admin dashboard)
  // staff/staff123    → Nhân viên     (admin dashboard, manage tours/bookings)
  // customer1/1234    → Khách hàng 1  (public site, book tours, write reviews)
  // customer2/1234    → Khách hàng 2  (public site, book tours, write reviews)
  users: [
    { id: 1, username: 'admin', password: 'admin123', fullName: 'Quản Trị Viên', role: 'Admin' },
    { id: 2, username: 'staff', password: 'staff123', fullName: 'Nhân Viên Tư Vấn', role: 'Staff' },
    { id: 3, username: 'customer1', password: '1234', fullName: 'Nguyễn Văn An', role: 'Customer' },
    { id: 4, username: 'customer2', password: '1234', fullName: 'Trần Thị Bích', role: 'Customer' }
  ],

  reviews: [
    { id: 1, tourId: 1, customerName: 'Nguyễn Văn An', rating: 5, comment: 'Tour tuyệt vời! Hướng dẫn viên nhiệt tình, khách sạn sạch đẹp, đồ ăn rất ngon.', createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
    { id: 2, tourId: 1, customerName: 'Lê Minh Châu', rating: 4, comment: 'Cảnh đẹp, lịch trình hợp lý. Chỉ tiếc thời gian hơi ngắn.', createdAt: new Date(Date.now() - 86400000 * 8).toISOString() },
    { id: 3, tourId: 1, customerName: 'Phạm Hồng Đức', rating: 5, comment: 'Đã đi 2 lần mà lần nào cũng thích, sẽ giới thiệu bạn bè!', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: 4, tourId: 2, customerName: 'Trần Thị Bích', rating: 5, comment: 'Đà Lạt lãng mạn quá! Đặc biệt là chuyến thăm vườn dâu.', createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
    { id: 5, tourId: 2, customerName: 'Nguyễn Văn An', rating: 4, comment: 'Khí hậu mát mẻ, khách sạn view đẹp. Tuy nhiên ăn uống chưa phong phú.', createdAt: new Date(Date.now() - 86400000 * 4).toISOString() },
    { id: 6, tourId: 3, customerName: 'Hoàng Thị Mai', rating: 5, comment: 'Du thuyền sang trọng, view vịnh rất đẹp!', createdAt: new Date(Date.now() - 86400000 * 12).toISOString() },
    { id: 7, tourId: 3, customerName: 'Đặng Quang Huy', rating: 4, comment: 'Đáng đồng tiền bát gạo, sẽ quay lại!', createdAt: new Date(Date.now() - 86400000 * 9).toISOString() },
    { id: 8, tourId: 4, customerName: 'Vũ Ngọc Linh', rating: 5, comment: 'Hội An ban đêm đẹp lung linh, Bà Nà Hills rất ấn tượng!', createdAt: new Date(Date.now() - 86400000 * 6).toISOString() },
    { id: 9, tourId: 4, customerName: 'Trần Thị Bích', rating: 4, comment: 'Phố cổ rất đẹp, đồ ăn ngon, giá cả hợp lý.', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 10, tourId: 5, customerName: 'Nguyễn Văn An', rating: 5, comment: 'Ruộng bậc thang tuyệt đẹp, trải nghiệm homestay rất thú vị!', createdAt: new Date(Date.now() - 86400000 * 11).toISOString() },
    { id: 11, tourId: 6, customerName: 'Lê Minh Châu', rating: 4, comment: 'Biển Nha Trang trong xanh, lặn biển rất đáng trải nghiệm.', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 12, tourId: 7, customerName: 'Phạm Hồng Đức', rating: 5, comment: 'Cố đô Huế rất có chiều sâu lịch sử, ẩm thực cung đình tuyệt vời.', createdAt: new Date(Date.now() - 86400000 * 1).toISOString() }
  ],

  favorites: [
    { id: 1, customerId: 3, tourId: 1 },
    { id: 2, customerId: 3, tourId: 3 }
  ]
};

let nextId = {
  tours: 9,
  customers: 4,
  bookings: 4,
  schedules: 9,
  users: 5,
  reviews: 13,
  favorites: 3,
  guideAvailabilities: 3
};

function parseBody(options) {
  if (options && options.body) {
    if (typeof options.body === 'string') return JSON.parse(options.body);
    return options.body;
  }
  return {};
}

function currentMockUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const userId = parseInt(token.replace('mock_jwt_', ''));
  return state.users.find(u => u.id === userId) || null;
}

function overlaps(startA, endA, startB, endB) {
  return new Date(startA) <= new Date(endB) && new Date(endA) >= new Date(startB);
}

export async function handleMockRequest(url, options = {}) {
  console.log(`%c[Mock API] %c${options.method || 'GET'} ${url}`, 'color: #f97316; font-weight: bold', 'color: inherit');
  await new Promise(resolve => setTimeout(resolve, 200));

  const method = (options.method || 'GET').toUpperCase();
  const body = parseBody(options);

  // ─── AUTH ───
  if (url.includes('/auth/login') && method === 'POST') {
    const user = state.users.find(u => u.username === body.username && u.password === body.password);
    if (user) {
      return { token: `mock_jwt_${user.id}`, user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role } };
    }
    throw new Error('Sai tài khoản hoặc mật khẩu');
  }

  if (url.includes('/auth/register') && method === 'POST') {
    if (state.users.some(u => u.username === body.username)) {
      throw new Error('Tên đăng nhập đã tồn tại');
    }
    const newUser = {
      id: nextId.users++,
      username: body.username,
      password: body.password,
      fullName: body.fullName || body.username,
      role: body.role || 'Customer'
    };
    state.users.push(newUser);
    return { token: `mock_jwt_${newUser.id}`, user: { id: newUser.id, username: newUser.username, fullName: newUser.fullName, role: newUser.role } };
  }

  if (url.includes('/auth/me')) {
    const user = currentMockUser();
    if (!user) throw new Error('Unauthorized');
    return { id: user.id, username: user.username, fullName: user.fullName, role: user.role };
  }

  // ─── TOURS ───
  if (url === '/tours' && method === 'GET') return state.tours;
  if (url === '/tours' && method === 'POST') {
    const newItem = { id: nextId.tours++, ...body };
    state.tours.push(newItem);
    return newItem;
  }
  if (url.match(/^\/tours\/(\d+)$/) && !url.includes('schedules') && !url.includes('reviews')) {
    const id = parseInt(url.split('/').pop());
    const idx = state.tours.findIndex(t => t.id === id);
    if (method === 'GET') return state.tours[idx] || null;
    if (idx === -1) throw new Error('Không tìm thấy tour');
    if (method === 'PUT') {
      state.tours[idx] = { ...state.tours[idx], ...body };
      return state.tours[idx];
    }
    if (method === 'DELETE') {
      state.tours.splice(idx, 1);
      return { success: true };
    }
  }

  // ─── REVIEWS ───
  if (url === '/reviews/me' && method === 'GET') {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Unauthorized');
    const userId = parseInt(token.replace('mock_jwt_', ''));
    const user = state.users.find(u => u.id === userId);
    if (!user) throw new Error('Unauthorized');
    // For mock, filter by customerName matching user.fullName, or fallback to filtering by id
    const myReviews = state.reviews.filter(r => r.customerName === user.fullName || r.customerId === user.id);
    // Attach tour name for display
    return myReviews.map(r => {
      const tour = state.tours.find(t => t.id === r.tourId);
      return { ...r, tourName: tour ? tour.name : 'Unknown Tour' };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  if (url.match(/^\/reviews\/(\d+)$/)) {
    const id = parseInt(url.split('/')[2]);
    const reviewIndex = state.reviews.findIndex(r => r.id === id);
    if (reviewIndex === -1) throw new Error('Không tìm thấy đánh giá');
    
    if (method === 'PUT') {
      const { rating, comment } = body;
      state.reviews[reviewIndex] = { ...state.reviews[reviewIndex], rating, comment };
      // Attach tour name for UI response
      const tour = state.tours.find(t => t.id === state.reviews[reviewIndex].tourId);
      return { ...state.reviews[reviewIndex], tourName: tour ? tour.name : 'Unknown Tour' };
    }
    if (method === 'DELETE') {
      state.reviews.splice(reviewIndex, 1);
      return { success: true };
    }
  }

  if (url.match(/^\/tours\/(\d+)\/reviews$/)) {
    const tourId = parseInt(url.split('/')[2]);
    if (method === 'GET') {
      return state.reviews.filter(r => r.tourId === tourId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    if (method === 'POST') {
      const newItem = { id: nextId.reviews++, tourId, ...body, createdAt: new Date().toISOString() };
      state.reviews.push(newItem);
      return newItem;
    }
  }

  // ─── FAVORITES ───
  if (url.startsWith('/favorites')) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Unauthorized');
    const userId = parseInt(token.replace('mock_jwt_', ''));

    if (url === '/favorites' && method === 'GET') {
      const userFavs = state.favorites.filter(f => f.customerId === userId);
      return state.tours.filter(t => userFavs.some(f => f.tourId === t.id));
    }
    if (url === '/favorites' && method === 'POST') {
      const { tourId } = body;
      if (state.favorites.some(f => f.customerId === userId && f.tourId === tourId)) {
        return { success: true };
      }
      const newItem = { id: nextId.favorites++, customerId: userId, tourId };
      state.favorites.push(newItem);
      return { success: true };
    }
    const favMatch = url.match(/^\/favorites\/(\d+)$/);
    if (favMatch && method === 'DELETE') {
      const tourId = Number(favMatch[1]);
      state.favorites = state.favorites.filter(f => !(f.customerId === userId && f.tourId === tourId));
      return { success: true };
    }
  }

  // ─── GUIDE AVAILABILITY ───
  if (url === '/guide-availabilities/my' && method === 'GET') {
    const user = currentMockUser();
    if (!user) throw new Error('Unauthorized');
    return state.guideAvailabilities
      .filter(a => a.guideUserId === user.id)
      .map(a => ({ ...a, guideName: user.fullName }))
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }

  if (url === '/guide-availabilities' && method === 'POST') {
    const user = currentMockUser();
    if (!user) throw new Error('Unauthorized');
    if (new Date(body.endDate) < new Date(body.startDate)) throw new Error('Ngày kết thúc phải sau ngày bắt đầu.');
    if (state.guideAvailabilities.some(a => a.guideUserId === user.id && overlaps(a.startDate, a.endDate, body.startDate, body.endDate))) {
      throw new Error('Khoảng lịch trống này đang bị trùng với lịch đã khai báo.');
    }
    if (state.schedules.some(s => s.guideUserId === user.id && s.status !== 'Cancelled' && overlaps(s.startDate, s.endDate, body.startDate, body.endDate))) {
      throw new Error('Bạn đã được xếp tour trong khoảng thời gian này.');
    }
    const newItem = { id: nextId.guideAvailabilities++, guideUserId: user.id, status: 'Available', createdAt: new Date().toISOString(), ...body };
    state.guideAvailabilities.push(newItem);
    return { ...newItem, guideName: user.fullName };
  }

  const availabilityMatch = url.match(/^\/guide-availabilities\/(\d+)$/);
  if (availabilityMatch) {
    const user = currentMockUser();
    if (!user) throw new Error('Unauthorized');
    const id = Number(availabilityMatch[1]);
    const idx = state.guideAvailabilities.findIndex(a => a.id === id && a.guideUserId === user.id);
    if (idx === -1) throw new Error('Không tìm thấy lịch trống');
    if (method === 'PUT') {
      if (new Date(body.endDate) < new Date(body.startDate)) throw new Error('Ngày kết thúc phải sau ngày bắt đầu.');
      if (state.guideAvailabilities.some(a => a.id !== id && a.guideUserId === user.id && overlaps(a.startDate, a.endDate, body.startDate, body.endDate))) {
        throw new Error('Khoảng lịch trống này đang bị trùng với lịch đã khai báo.');
      }
      state.guideAvailabilities[idx] = { ...state.guideAvailabilities[idx], ...body, status: 'Available' };
      return { ...state.guideAvailabilities[idx], guideName: user.fullName };
    }
    if (method === 'DELETE') {
      state.guideAvailabilities.splice(idx, 1);
      return null;
    }
  }

  if (url.startsWith('/guides/available') && method === 'GET') {
    const params = new URLSearchParams(url.split('?')[1] || '');
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');
    if (!startDate || !endDate) return [];
    const busyGuideIds = new Set(state.schedules
      .filter(s => s.guideUserId && s.status !== 'Cancelled' && overlaps(s.startDate, s.endDate, startDate, endDate))
      .map(s => s.guideUserId));
    return state.guideAvailabilities
      .filter(a => a.status === 'Available' && new Date(a.startDate) <= new Date(startDate) && new Date(a.endDate) >= new Date(endDate) && !busyGuideIds.has(a.guideUserId))
      .map(a => {
        const user = state.users.find(u => u.id === a.guideUserId);
        return user ? { id: user.id, username: user.username, fullName: user.fullName, availabilityNote: a.note || '' } : null;
      })
      .filter(Boolean);
  }

  // ─── SCHEDULES ───
  if (url.startsWith('/schedules') && method === 'GET') {
    const queryString = url.split('?')[1] || '';
    const params = new URLSearchParams(queryString);
    const tourId = params.get('tourId');
    const status = params.get('status');
    return state.schedules
      .filter(s => !tourId || s.tourId === Number(tourId))
      .filter(s => !status || s.status === status)
      .map(s => ({
        bookedSeats: state.bookings
          .filter(b => b.tourScheduleId === s.id && b.status !== 'Cancelled')
          .reduce((sum, b) => sum + (b.guestCount || 0), 0),
        guideName: null,
        guideUserId: null,
        note: '',
        ...s,
      }));
  }

  if (url.match(/^\/tours\/(\d+)\/schedules$/)) {
    const tourId = parseInt(url.split('/')[2]);
    if (method === 'GET') return state.schedules.filter(s => s.tourId === tourId).map(s => ({
      bookedSeats: state.bookings
        .filter(b => b.tourScheduleId === s.id && b.status !== 'Cancelled')
        .reduce((sum, b) => sum + (b.guestCount || 0), 0),
      guideName: null,
      guideUserId: null,
      note: '',
      ...s,
    }));
    if (method === 'POST') {
      const tour = state.tours.find(t => t.id === tourId);
      const guide = body.guideUserId ? state.users.find(u => u.id === body.guideUserId && u.role === 'Staff') : null;
      if (guide && state.schedules.some(s => s.guideUserId === guide.id && s.status !== 'Cancelled' && overlaps(s.startDate, s.endDate, body.startDate, body.endDate))) {
        throw new Error('Hướng dẫn viên đã có tour trong khoảng thời gian này.');
      }
      const newItem = { id: nextId.schedules++, tourId, tourName: tour?.name || '', bookedSeats: 0, ...body, guideUserId: guide?.id || null, guideName: guide?.fullName || body.guideName || null };
      state.schedules.push(newItem);
      return newItem;
    }
  }
  const assignGuideMatch = url.match(/^\/schedules\/(\d+)\/assign-guide$/);
  if (assignGuideMatch && method === 'PUT') {
    const id = Number(assignGuideMatch[1]);
    const idx = state.schedules.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Không tìm thấy lịch trình');
    const schedule = state.schedules[idx];
    const guide = body.guideUserId ? state.users.find(u => u.id === body.guideUserId && u.role === 'Staff') : null;
    if (body.guideUserId && !guide) throw new Error('Hướng dẫn viên không hợp lệ.');
    if (guide && state.schedules.some(s => s.id !== id && s.guideUserId === guide.id && s.status !== 'Cancelled' && overlaps(s.startDate, s.endDate, schedule.startDate, schedule.endDate))) {
      throw new Error('Hướng dẫn viên đã có tour trong khoảng thời gian này.');
    }
    state.schedules[idx] = { ...schedule, guideUserId: guide?.id || null, guideName: guide?.fullName || null };
    return state.schedules[idx];
  }
  if (url.match(/^\/schedules\/(\d+)$/)) {
    const id = parseInt(url.split('/').pop());
    const idx = state.schedules.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Không tìm thấy lịch trình');
    if (method === 'PUT') {
      const guide = body.guideUserId ? state.users.find(u => u.id === body.guideUserId && u.role === 'Staff') : null;
      if (guide && state.schedules.some(s => s.id !== id && s.guideUserId === guide.id && s.status !== 'Cancelled' && overlaps(s.startDate, s.endDate, body.startDate, body.endDate))) {
        throw new Error('Hướng dẫn viên đã có tour trong khoảng thời gian này.');
      }
      state.schedules[idx] = { ...state.schedules[idx], ...body, guideUserId: guide?.id || null, guideName: guide?.fullName || body.guideName || null };
      return state.schedules[idx];
    }
    if (method === 'DELETE') {
      state.schedules.splice(idx, 1);
      return { success: true };
    }
  }

  // ─── BOOKINGS ───
  if (url === '/bookings' && method === 'GET') return state.bookings;
  if (url === '/bookings' && method === 'POST') {
    const schedule = state.schedules.find(s => s.id === body.tourScheduleId);
    const tour = schedule ? state.tours.find(t => t.id === schedule.tourId) : null;
    const totalAmount = tour ? tour.price * (body.guestCount || 1) : 0;
    const newItem = {
      id: nextId.bookings++,
      ...body,
      tourName: tour?.name || 'Tour',
      startDate: schedule?.startDate || new Date().toISOString(),
      totalAmount,
      status: 'Pending',
      paymentMethod: 'Cash',
      paymentStatus: 'Unpaid',
      createdAt: new Date().toISOString()
    };
    if (schedule) schedule.availableSeats -= (body.guestCount || 1);
    state.bookings.push(newItem);
    return newItem;
  }
  if (url.match(/^\/bookings\/(\d+)$/)) {
    const id = parseInt(url.split('/').pop());
    const idx = state.bookings.findIndex(b => b.id === id);
    if (idx === -1) throw new Error('Không tìm thấy đơn đặt tour');
    if (method === 'PUT') {
      state.bookings[idx] = { ...state.bookings[idx], ...body };
      return state.bookings[idx];
    }
    if (method === 'DELETE') {
      state.bookings.splice(idx, 1);
      return { success: true };
    }
  }

  // ─── CUSTOMERS ───
  if (url === '/customers' && method === 'GET') return state.customers;
  if (url === '/customers' && method === 'POST') {
    const newItem = { id: nextId.customers++, ...body, createdAt: new Date().toISOString() };
    state.customers.push(newItem);
    return newItem;
  }
  if (url.match(/^\/customers\/(\d+)$/)) {
    const id = parseInt(url.split('/').pop());
    const idx = state.customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Không tìm thấy khách hàng');
    if (method === 'PUT') {
      state.customers[idx] = { ...state.customers[idx], ...body };
      return state.customers[idx];
    }
    if (method === 'DELETE') {
      state.customers.splice(idx, 1);
      return { success: true };
    }
  }

  // ─── RATINGS (aggregated) ───
  if (url === '/tours/ratings' && method === 'GET') {
    const tourIds = [...new Set(state.reviews.map(r => r.tourId))];
    return tourIds.map(tourId => {
      const tourReviews = state.reviews.filter(r => r.tourId === tourId);
      return {
        tourId,
        averageRating: Math.round((tourReviews.reduce((s, r) => s + r.rating, 0) / tourReviews.length) * 10) / 10,
        reviewCount: tourReviews.length
      };
    });
  }

  // ─── REPORTS ───
  if (url.startsWith('/reports/summary')) {
    const confirmed = state.bookings.filter(b => b.status !== 'Cancelled');
    return {
      totalTours: state.tours.length,
      activeTours: state.tours.filter(t => t.isActive).length,
      totalCustomers: state.customers.length,
      totalBookings: state.bookings.length,
      totalRevenue: confirmed.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
      totalGuests: confirmed.reduce((sum, b) => sum + (b.guestCount || 0), 0),
      topTours: state.tours.slice(0, 5).map(t => ({
        tourName: t.name,
        bookingCount: state.bookings.filter(b => b.tourName === t.name && b.status !== 'Cancelled').length,
        revenue: state.bookings.filter(b => b.tourName === t.name && b.status !== 'Cancelled').reduce((s, b) => s + (b.totalAmount || 0), 0)
      })).sort((a, b) => b.revenue - a.revenue)
    };
  }
  if (url.startsWith('/reports/revenue')) {
    return {
      totalRevenue: state.bookings.filter(b => b.status !== 'Cancelled').reduce((s, b) => s + (b.totalAmount || 0), 0),
      items: state.bookings.filter(b => b.status !== 'Cancelled').map(b => ({
        id: b.id, tourName: b.tourName, customerName: b.customerName,
        guestCount: b.guestCount, totalAmount: b.totalAmount, status: b.status, createdAt: b.createdAt
      }))
    };
  }
  if (url.startsWith('/reports/export')) {
    return new Blob(["Mock CSV data\nRow1,Row2"], { type: 'text/csv' });
  }

  // ─── USERS ───
  if (url === '/users' && method === 'GET') {
    return state.users.map(u => ({ id: u.id, username: u.username, fullName: u.fullName, role: u.role, createdAt: new Date(Date.now() - 86400000 * u.id).toISOString() }));
  }
  const userRoleMatch = url.match(/^\/users\/(\d+)\/role$/);
  if (userRoleMatch && method === 'PUT') {
    const user = state.users.find(u => u.id === Number(userRoleMatch[1]));
    if (!user) throw new Error('User not found');
    user.role = body.role;
    return { id: user.id, username: user.username, fullName: user.fullName, role: user.role };
  }
  const userDelMatch = url.match(/^\/users\/(\d+)$/);
  if (userDelMatch && method === 'DELETE') {
    state.users = state.users.filter(u => u.id !== Number(userDelMatch[1]));
    return null;
  }

  throw new Error(`Mock API route not implemented: ${method} ${url}`);
}
