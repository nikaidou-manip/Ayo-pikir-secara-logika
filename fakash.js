        let dataProduk = [];
        let dataKupon = [];
        let kuponAktif = null;
        let diskonKupon = 0;

        document.addEventListener("DOMContentLoaded", async () => {
            await loadDataProduk();
            await loadDataKupon();
            setTimeout(() => {
                document.getElementById("loader").classList.add("hidden");
            }, 1500);
            tampilProduk();
            setupScrollEvent();
            checkLoginStatus();
        });

        async function loadDataProduk() {
            try {
                const res = await fetch("https://script.google.com/macros/s/AKfycbzCsGSvRaiYghxVFlOtkscqP6fkbZfcLBLW1mXtaDD2idqMqHDVjvdii2Tes7bMBElHEg/exec");
                const rawData = await res.json();
                dataProduk = rawData.map(row => ({
                    ...row,
                    kategori: row.kategori
                        ? row.kategori.split(',').map(k => k.trim().toLowerCase())
                        : ['umum'],
                    // Pastikan deskripsi ada, jika tidak ada gunakan deskripsi default
                    deskripsi: row.deskripsi || 'Produk berkualitas tinggi dengan desain menarik dan fungsional. Dibuat dengan material terbaik untuk memberikan pengalaman pengguna yang optimal. Cocok untuk digunakan sehari-hari atau sebagai hadiah special untuk orang tersayang.'
                }));

                console.log("✅ Produk berhasil dimuat");
            } catch (e) {
                console.error("❌ Gagal memuat produk:", e);
            }
        }

        async function loadDataKupon() {
            try {
                const res = await fetch("https://script.google.com/macros/s/AKfycbzCsGSvRaiYghxVFlOtkscqP6fkbZfcLBLW1mXtaDD2idqMqHDVjvdii2Tes7bMBElHEg/exec?sheet=kupon");
                const rawData = await res.json();
                dataKupon = rawData.map(row => ({
                    ...row,
                    expiry: new Date(row.expiry)
                }));

                console.log("✅ Kupon berhasil dimuat");
            } catch (e) {
                console.error("❌ Gagal memuat kupon:", e);
            }
        }

        let keranjangBelanja = [];
        let filterAktif = 'all';
        let halamanSekarang = 1;
        const itemPerHalaman = 12;
        let userLoggedIn = false;
        let currentUser = null;

        // Login Functions
        function bukaLogin() {
            document.getElementById('loginModal').classList.add('active');
            // Reset form
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            document.getElementById('usernameError').classList.remove('show');
            document.getElementById('passwordError').classList.remove('show');
        }

        function tutupLogin() {
            document.getElementById('loginModal').classList.remove('active');
        }

        function login(event) {
            event.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Validasi form
            let isValid = true;

            // Validasi username
            if (!username || username.trim() === '') {
                document.getElementById('usernameError').classList.add('show');
                isValid = false;
            } else {
                document.getElementById('usernameError').classList.remove('show');
            }

            // Validasi password
            if (!password || password.trim() === '') {
                document.getElementById('passwordError').classList.add('show');
                isValid = false;
            } else {
                document.getElementById('passwordError').classList.remove('show');
            }

            if (!isValid) return;

            // Simulasi login - untuk demo, gunakan username/password sederhana
            if (username === 'admin' && password === 'admin') {
                // Simulasi proses login
                notif('Sedang masuk...');

                setTimeout(() => {
                    // Set user data
                    currentUser = {
                        name: 'Admin',
                        username: username,
                        type: 'admin'
                    };

                    userLoggedIn = true;

                    // Save to localStorage
                    localStorage.setItem('user', JSON.stringify(currentUser));

                    // Update UI
                    updateUserUI();

                    // Close modal
                    tutupLogin();

                    notif(`Selamat datang, ${currentUser.name}!`);
                }, 1000);
            } else if (username === 'user' && password === 'user') {
                // Simulasi proses login
                notif('Sedang masuk...');

                setTimeout(() => {
                    // Set user data
                    currentUser = {
                        name: 'User',
                        username: username,
                        type: 'registered'
                    };

                    userLoggedIn = true;

                    // Save to localStorage
                    localStorage.setItem('user', JSON.stringify(currentUser));

                    // Update UI
                    updateUserUI();

                    // Close modal
                    tutupLogin();

                    notif(`Selamat datang, ${currentUser.name}!`);
                }, 1000);
            } else {
                // Username atau password salah
                document.getElementById('passwordError').textContent = 'Username atau password salah';
                document.getElementById('passwordError').classList.add('show');
            }
        }

        function loginGuest() {
            // Simulasi proses login
            notif('Sedang masuk sebagai tamu...');

            setTimeout(() => {
                // Set user data
                currentUser = {
                    name: 'Tamu',
                    username: 'guest',
                    type: 'guest'
                };

                userLoggedIn = true;

                // Save to sessionStorage (not localStorage for guest)
                sessionStorage.setItem('user', JSON.stringify(currentUser));

                // Update UI
                updateUserUI();

                // Close modal
                tutupLogin();

                notif('Selamat datang, Di N.A.T.R.I!');
            }, 1000);
        }

        function tampilProduk(filter = 'all', halaman = 1) {
            const gridProduk = document.getElementById('productGrid');
            let produkTerfilter = dataProduk;

            // Filter kategori
            if (filter !== 'all') {
                if (filter === 'limited') {
                    produkTerfilter = dataProduk.filter(p => p.lencana?.toLowerCase() === 'limited');
                } else if (filter === 'sale') {
                    produkTerfilter = dataProduk.filter(p => p.diskon);
                } else if (filter === 'popular') {
                    produkTerfilter = dataProduk.filter(p => p.rating >= 4.9);
                } else {

                    produkTerfilter = dataProduk.filter(p =>
                        Array.isArray(p.kategori)
                            ? p.kategori.includes(filter.toLowerCase())
                            : p.kategori.toLowerCase() === filter.toLowerCase()
                    );
                }
            }

            // Hitung paginasi
            const totalHalaman = Math.ceil(produkTerfilter.length / itemPerHalaman);
            const indeksAwal = (halaman - 1) * itemPerHalaman;
            const indeksAkhir = indeksAwal + itemPerHalaman;
            const produkPerHalaman = produkTerfilter.slice(indeksAwal, indeksAkhir);

            gridProduk.innerHTML = produkPerHalaman.map(item => `
                <div class="product-card" onclick="bukaProdukModal(${item.id})">
                    ${item.diskon ? `<div class="discount-badge">-${item.persentaseDiskon}%</div>` : ''}
                    <img src="${item.gambar}" alt="${item.nama}" class="product-image">
                    <div class="product-info">
                        <span class="product-badge">${item.lencana}</span>
                        <h3 class="product-name">${item.nama}</h3>
                        <div class="product-rating">
                            <span class="rating-number">${item.rating}</span>
                        </div>
                        <div class="product-price">
                            ${item.diskon ?
                    `<span class="original-price">Rp ${item.harga.toLocaleString('id-ID')}</span>
                                <span class="discount-price">Rp ${item.hargaAsli.toLocaleString('id-ID')}</span>` :
                    `Rp ${item.hargaAsli.toLocaleString('id-ID')}`
                }
                        </div>
                        <button class="add-to-cart" onclick="event.stopPropagation(); tambahKeranjang(${item.id})">
                            <i class="fas fa-cart-plus"></i> Tambah ke Keranjang
                        </button>
                    </div>
                </div>
            `).join('');

            // Update paginasi
            updatePaginasi(totalHalaman, halaman);
        }

        // Update Paginasi
        function updatePaginasi(totalHalaman, halamanAktif) {
            const paginasi = document.getElementById('pagination');

            if (totalHalaman <= 1) {
                paginasi.innerHTML = '';
                return;
            }

            let htmlPaginasi = '';

            // Tombol sebelumnya
            if (halamanAktif > 1) {
                htmlPaginasi += `<button class="page-btn" onclick="tampilProduk('${filterAktif}', ${halamanAktif - 1})"><i class="fas fa-chevron-left"></i></button>`;
            }

            // Logika untuk menampilkan maksimal 5 halaman
            if (totalHalaman <= 5) {
                // Jika total halaman <= 5, tampilkan semua
                for (let i = 1; i <= totalHalaman; i++) {
                    if (i === halamanAktif) {
                        htmlPaginasi += `<button class="page-btn active">${i}</button>`;
                    } else {
                        htmlPaginasi += `<button class="page-btn" onclick="tampilProduk('${filterAktif}', ${i})">${i}</button>`;
                    }
                }
            } else {
                // Jika total halaman > 5
                if (halamanAktif <= 3) {
                    // Tampilkan 1, 2, 3, 4, 5
                    for (let i = 1; i <= 5; i++) {
                        if (i === halamanAktif) {
                            htmlPaginasi += `<button class="page-btn active">${i}</button>`;
                        } else {
                            htmlPaginasi += `<button class="page-btn" onclick="tampilProduk('${filterAktif}', ${i})">${i}</button>`;
                        }
                    }
                    // Tambah ellipsis dan tombol terakhir
                    htmlPaginasi += `<span style="padding: 0 10px;">...</span>`;
                    htmlPaginasi += `<button class="page-btn" onclick="tampilProduk('${filterAktif}', ${totalHalaman})">${totalHalaman}</button>`;
                } else if (halamanAktif >= totalHalaman - 2) {
                    // Tampilkan halaman pertama, ellipsis, dan 5 halaman terakhir
                    htmlPaginasi += `<button class="page-btn" onclick="tampilProduk('${filterAktif}', 1)">1</button>`;
                    htmlPaginasi += `<span style="padding: 0 10px;">...</span>`;
                    for (let i = totalHalaman - 4; i <= totalHalaman; i++) {
                        if (i === halamanAktif) {
                            htmlPaginasi += `<button class="page-btn active">${i}</button>`;
                        } else {
                            htmlPaginasi += `<button class="page-btn" onclick="tampilProduk('${filterAktif}', ${i})">${i}</button>`;
                        }
                    }
                } else {
                    // Tampilkan halaman pertama, ellipsis, halaman aktif-2 sampai aktif+2, ellipsis, halaman terakhir
                    htmlPaginasi += `<button class="page-btn" onclick="tampilProduk('${filterAktif}', 1)">1</button>`;
                    htmlPaginasi += `<span style="padding: 0 10px;">...</span>`;

                    for (let i = halamanAktif - 2; i <= halamanAktif + 2; i++) {
                        if (i === halamanAktif) {
                            htmlPaginasi += `<button class="page-btn active">${i}</button>`;
                        } else {
                            htmlPaginasi += `<button class="page-btn" onclick="tampilProduk('${filterAktif}', ${i})">${i}</button>`;
                        }
                    }

                    htmlPaginasi += `<span style="padding: 0 10px;">...</span>`;
                    htmlPaginasi += `<button class="page-btn" onclick="tampilProduk('${filterAktif}', ${totalHalaman})">${totalHalaman}</button>`;
                }
            }

            // Tombol berikutnya
            if (halamanAktif < totalHalaman) {
                htmlPaginasi += `<button class="page-btn" onclick="tampilProduk('${filterAktif}', ${halamanAktif + 1})"><i class="fas fa-chevron-right"></i></button>`;
            }

            // Tombol langsung ke halaman terakhir (jika total halaman > 5)
            if (totalHalaman > 5 && halamanAktif < totalHalaman) {
                htmlPaginasi += `<button class="page-btn" onclick="tampilProduk('${filterAktif}', ${totalHalaman})" title="Ke Halaman Terakhir" style="margin-left: 5px;">>></button>`;
            }

            paginasi.innerHTML = htmlPaginasi;
        }

        // Fungsi Keranjang
        function tambahKeranjang(idProduk) {
            if (!userLoggedIn) {
                notif('Silakan masuk terlebih dahulu untuk menambahkan produk ke keranjang');
                bukaLogin();
                return;
            }

            const item = dataProduk.find(p => p.id === idProduk);
            const itemAda = keranjangBelanja.find(item => item.id === idProduk);

            if (itemAda) {
                itemAda.jumlah++;
            } else {
                keranjangBelanja.push({ ...item, jumlah: 1 });
            }

            updateJumlahKeranjang();
            notif(`${item.nama} udah masuk keranjang!`);
        }

        function updateJumlahKeranjang() {
            const jumlah = keranjangBelanja.reduce((total, item) => total + item.jumlah, 0);
            document.getElementById('cartCount').textContent = jumlah;
        }

        function bukaKeranjang() {
            if (!userLoggedIn) {
                notif('Silakan masuk terlebih dahulu untuk melihat keranjang belanja');
                bukaLogin();
                return;
            }

            const modal = document.getElementById('cartModal');
            modal.classList.toggle('active');

            if (modal.classList.contains('active')) {
                renderKeranjang();
            }
        }

        function renderKeranjang() {
            const itemKeranjang = document.getElementById('cartItems');

            if (keranjangBelanja.length === 0) {
                itemKeranjang.innerHTML = '<p style="text-align: center; padding: 2rem;">Keranjang belanja kosong</p>';
            } else {
                itemKeranjang.innerHTML = keranjangBelanja.map(item => `
                    <div class="cart-item">
                        <img src="${item.gambar}" alt="${item.nama}" class="cart-item-image">
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item.nama}</div>
                            <div class="cart-item-price">Rp ${item.harga.toLocaleString('id-ID')}</div>
                            <div class="quantity-controls">
                                <button class="quantity-btn" onclick="ubahJumlah(${item.id}, -1)">-</button>
                                <span>${item.jumlah}</span>
                                <button class="quantity-btn" onclick="ubahJumlah(${item.id}, 1)">+</button>
                                <button class="quantity-btn" onclick="hapusDariKeranjang(${item.id})" style="margin-left: 10px;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            updateTotalKeranjang();
            updateCouponStatus();
        }

        function ubahJumlah(idProduk, perubahan) {
            const item = keranjangBelanja.find(item => item.id === idProduk);
            if (item) {
                item.jumlah += perubahan;
                if (item.jumlah <= 0) {
                    hapusDariKeranjang(idProduk);
                } else {
                    renderKeranjang();
                    updateJumlahKeranjang();
                }
            }
        }

        function hapusDariKeranjang(idProduk) {
            keranjangBelanja = keranjangBelanja.filter(item => item.id !== idProduk);
            renderKeranjang();
            updateJumlahKeranjang();
            notif('Produk dihapus dari keranjang');
        }

        function updateTotalKeranjang() {
            const subtotal = keranjangBelanja.reduce((jumlah, item) => jumlah + (item.harga * item.jumlah), 0);
            const total = subtotal - diskonKupon;

            document.getElementById('cartSubtotal').textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
            document.getElementById('cartTotal').textContent = `Rp ${total.toLocaleString('id-ID')}`;

            // Show/hide coupon discount row
            if (diskonKupon > 0) {
                document.getElementById('couponDiscountRow').style.display = 'flex';
                document.getElementById('couponDiscount').textContent = `-Rp ${diskonKupon.toLocaleString('id-ID')}`;
            } else {
                document.getElementById('couponDiscountRow').style.display = 'none';
            }
        }

        function bayarSekarang() {
            if (keranjangBelanja.length === 0) {
                notif('Keranjang belanja masih kosong!');
                return;
            }

            notif('Proses pembayaran dimulai...');
            setTimeout(() => {
                // Tutup modal keranjang
                document.getElementById('cartModal').classList.remove('active');

                // Tampilkan struk
                tampilkanStruk();
            }, 2000);
        }

        // Fungsi untuk menampilkan struk
        function tampilkanStruk() {
            // Set transaction info
            const now = new Date();
            document.getElementById('transactionId').textContent = generateTransactionId();
            document.getElementById('transactionDate').textContent = formatDate(now);
            document.getElementById('transactionTime').textContent = formatTime(now);

            // Set customer info
            document.getElementById('customerName').textContent = currentUser.name;
            document.getElementById('customerPhone').textContent = '08245276345';

            // Populate items table
            const itemsTableBody = document.getElementById('receiptItemsTableBody');
            itemsTableBody.innerHTML = '';

            keranjangBelanja.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <div class="item-name">${item.nama}</div>
                        <div class="item-details">${item.kategori.join(', ')}</div>
                    </td>
                    <td class="item-qty">${item.jumlah}</td>
                    <td class="item-price">Rp ${item.hargaAsli.toLocaleString('id-ID')}</td>
                    <td class="item-total">Rp ${(item.hargaAsli * item.jumlah).toLocaleString('id-ID')}</td>
                `;
                itemsTableBody.appendChild(row);
            });

            // Calculate and set totals
            const totals = calculateTotals();
            document.getElementById('receiptSubtotal').textContent = formatCurrency(totals.subtotal);

            // Show coupon discount if applied
            if (diskonKupon > 0) {
                document.getElementById('receiptCouponRow').style.display = 'flex';
                document.getElementById('receiptCouponDiscount').textContent = `-Rp ${diskonKupon.toLocaleString('id-ID')}`;
            } else {
                document.getElementById('receiptCouponRow').style.display = 'none';
            }

            document.getElementById('receiptDiscount').textContent = formatCurrency(totals.discount);
            document.getElementById('receiptShipping').textContent = formatCurrency(totals.shipping);
            document.getElementById('receiptTotalAmount').textContent = formatCurrency(totals.total);

            // Show receipt modal
            document.getElementById('receiptModal').classList.add('active');
        }

        // Generate transaction ID
        function generateTransactionId() {
            const now = new Date();
            const date = now.toISOString().slice(0, 10).replace(/-/g, '');
            const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `TRX-${date}-${random}`;
        }

        // Format date
        function formatDate(date) {
            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            return date.toLocaleDateString('id-ID', options);
        }

        // Format time
        function formatTime(date) {
            return date.toTimeString().slice(0, 8);
        }

        // Format currency
        function formatCurrency(amount) {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(amount);
        }

        // Calculate totals
        function calculateTotals() {
            let subtotal = 0;
            let totalDiscount = 0;

            keranjangBelanja.forEach(item => {
                const itemTotal = item.hargaAsli * item.jumlah;
                subtotal += itemTotal;

                if (item.diskon) {
                    const discountAmount = (item.hargaAsli - item.harga) * item.jumlah;
                    totalDiscount += discountAmount;
                }
            });

            // Calculate shipping (flat rate for demo)
            const shipping = subtotal > 500000 ? 0 : 15000;

            // Calculate total with coupon discount
            const total = subtotal - totalDiscount - diskonKupon + shipping;

            return {
                subtotal,
                discount: totalDiscount,
                shipping,
                total
            };
        }

        // Fungsi untuk menutup struk
        function tutupStruk() {
            document.getElementById('receiptModal').classList.remove('active');
            // Kosongkan keranjang setelah menutup struk
            keranjangBelanja = [];
            updateJumlahKeranjang();
            // Reset coupon
            kuponAktif = null;
            diskonKupon = 0;
        }

        // Fungsi untuk kembali ke beranda
        function selesaiBelanja() {
            document.getElementById('receiptModal').classList.remove('active');
            // Kosongkan keranjang
            keranjangBelanja = [];
            updateJumlahKeranjang();
            // Reset coupon
            kuponAktif = null;
            diskonKupon = 0;
            // Scroll ke beranda
            document.getElementById('home').scrollIntoView({ behavior: 'smooth' });
        }

        // Fungsi Filter
        function filterKategori(kategori) {
            filterAktif = kategori;
            halamanSekarang = 1;
            tampilProduk(kategori, halamanSekarang);
            scrollKeProduk();
        }

        function urutinProduk(urutan) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            filterAktif = urutan;
            halamanSekarang = 1;
            tampilProduk(urutan, halamanSekarang);
        }

        // Fungsi Pencarian
        function handleSearch(event) {
            if (event.key === 'Enter') {
                cariBarang();
            }
        }

        function cariBarang() {
            const keyword = document.getElementById('searchInput').value.toLowerCase();
            const hasil = dataProduk.filter(p =>
                p.nama.toLowerCase().includes(keyword) ||
                (Array.isArray(p.kategori)
                    ? p.kategori.some(k => k.includes(keyword))
                    : p.kategori.toLowerCase().includes(keyword))
            );

            const gridProduk = document.getElementById('productGrid');
            if (hasil.length === 0) {
                gridProduk.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Produk nggak ketemu</p>';
                document.getElementById('pagination').innerHTML = '';
            } else {
                // Hitung paginasi
                const totalHalaman = Math.ceil(hasil.length / itemPerHalaman);
                const indeksAwal = (halamanSekarang - 1) * itemPerHalaman;
                const indeksAkhir = indeksAwal + itemPerHalaman;
                const produkPerHalaman = hasil.slice(indeksAwal, indeksAkhir);

                gridProduk.innerHTML = produkPerHalaman.map(item => `
                    <div class="product-card" onclick="bukaProdukModal(${item.id})">
                        ${item.diskon ? `<div class="discount-badge">-${item.persentaseDiskon}%</div>` : ''}
                        <img src="${item.gambar}" alt="${item.nama}" class="product-image">
                        <div class="product-info">
                            <span class="product-badge">${item.lencana}</span>
                            <h3 class="product-name">${item.nama}</h3>
                            <div class="product-rating">
                                <span class="rating-number">${item.rating}</span>
                            </div>
                            <div class="product-price">
                                ${item.diskon ?
                        `<span class="original-price">Rp ${item.harga.toLocaleString('id-ID')}</span>
                                    <span class="discount-price">Rp ${item.hargaAsli.toLocaleString('id-ID')}</span>` :
                        `Rp ${item.hargaAsli.toLocaleString('id-ID')}`
                    }
                            </div>
                            <button class="add-to-cart" onclick="event.stopPropagation(); tambahKeranjang(${item.id})">
                                <i class="fas fa-cart-plus"></i> Tambah ke Keranjang
                            </button>
                        </div>
                    </div>
                `).join('');

                // Update paginasi
                updatePaginasi(totalHalaman, halamanSekarang);
            }
        }

        // Fungsi Modal Produk
        function bukaProdukModal(idProduk) {
            console.log('Membuka modal produk dengan ID:', idProduk);
            const produk = dataProduk.find(p => p.id === idProduk);
            if (!produk) {
                console.log('Produk tidak ditemukan dengan ID:', idProduk);
                return;
            }

            console.log('Produk ditemukan:', produk);

            // Isi data produk ke modal
            document.getElementById('modalProductImage').src = produk.gambar;
            document.getElementById('modalProductName').textContent = produk.nama;

            // Harga
            if (produk.diskon) {
                document.getElementById('modalProductPrice').innerHTML = `
                    <span class="original-price">Rp ${produk.harga.toLocaleString('id-ID')}</span>
                    <span class="discount-price">Rp ${produk.hargaAsli.toLocaleString('id-ID')}</span>
                `;
            } else {
                document.getElementById('modalProductPrice').textContent = `Rp ${produk.hargaAsli.toLocaleString('id-ID')}`;
            }

            document.getElementById('modalProductRating').textContent = produk.rating;

            // Gunakan deskripsi dari Google Sheets
            document.getElementById('modalProductDescription').textContent = produk.deskripsi;

            // Setup tombol tambah ke keranjang
            const btnAddToCart = document.getElementById('modalAddToCart');
            btnAddToCart.onclick = function () {
                tambahKeranjang(idProduk);
                tutupProdukModal();
            };

            // Tampilkan modal
            const modal = document.getElementById('productModal');
            modal.classList.add('active');
            console.log('Modal ditampilkan');
        }

        function tutupProdukModal() {
            const modal = document.getElementById('productModal');
            modal.classList.remove('active');
            console.log('Modal ditutup');
        }

        // Fungsi Utilitas
        function notif(pesan) {
            const toast = document.getElementById('toast');
            toast.textContent = pesan;
            toast.classList.add('show');

            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }

        function scrollKeProduk() {
            document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
        }

        function scrollNewsletter() {
            document.getElementById('newsletter').scrollIntoView({ behavior: 'smooth' });
        }

        function scrollKeAtas() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function bukaMenuMobile() {
            document.getElementById('navMenu').classList.toggle('active');
        }

        function bukaPencarian() {
            const inputPencarian = document.getElementById('searchInput');
            inputPencarian.focus();
            inputPencarian.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function bukaChat() {
            window.open('https://wa.me/6282317761703', '_blank');
        }

        function subscribeNewsletter(event) {
            event.preventDefault();

            // Generate random coupon code
            const couponCode = 'NATRI' + Math.floor(Math.random() * 10000);

            // Save coupon to localStorage
            localStorage.setItem('coupon', JSON.stringify({
                code: couponCode,
                discount: 20, // 20% discount
                expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            }));

            // Show coupon code in toast notification
            notif(`Selamat! Anda mendapatkan kupon diskon 20%. Kode: ${couponCode}`);
            event.target.reset();
        }

        function handleCouponInput(event) {
            if (event.key === 'Enter') {
                applyCoupon();
            }
        }

        function applyCoupon() {
            const couponInput = document.getElementById('couponInput').value.trim();

            if (!couponInput) {
                notif('Masukkan kode kupon terlebih dahulu!');
                return;
            }

            // Check if coupon exists in localStorage (from newsletter)
            const localCoupon = localStorage.getItem('coupon');
            if (localCoupon) {
                const couponData = JSON.parse(localCoupon);

                // Check if coupon is expired
                if (new Date(couponData.expiry) < new Date()) {
                    notif('Kupon sudah kadaluarsa!');
                    return;
                }

                // Check if coupon code matches
                if (couponData.code === couponInput) {
                    // Apply coupon
                    kuponAktif = couponData.code;
                    const subtotal = keranjangBelanja.reduce((jumlah, item) => jumlah + (item.harga * item.jumlah), 0);
                    diskonKupon = Math.round(subtotal * (couponData.discount / 100));

                    // Update UI
                    updateTotalKeranjang();
                    updateCouponStatus();

                    notif(`Kupon ${couponData.code} berhasil digunakan! Diskon ${couponData.discount}%`);
                    return;
                }
            }

            // Check if coupon exists in Google Sheets
            const sheetCoupon = dataKupon.find(c => c.code === couponInput);
            if (sheetCoupon) {
                // Check if coupon is expired
                if (new Date(sheetCoupon.expiry) < new Date()) {
                    notif('Kupon sudah kadaluarsa!');
                    return;
                }

                // Apply coupon
                kuponAktif = sheetCoupon.code;
                const subtotal = keranjangBelanja.reduce((jumlah, item) => jumlah + (item.harga * item.jumlah), 0);
                diskonKupon = Math.round(subtotal * (sheetCoupon.discount / 100));

                // Update UI
                updateTotalKeranjang();
                updateCouponStatus();

                notif(`Kupon ${sheetCoupon.code} berhasil digunakan! Diskon ${sheetCoupon.discount}%`);
                return;
            }

            notif('Kupon tidak valid!');
        }

        function updateCouponStatus() {
            const couponStatus = document.getElementById('couponStatus');

            if (kuponAktif) {
                couponStatus.innerHTML = `
                    <div class="coupon-applied">
                        <div class="coupon-applied-info">
                            <i class="fas fa-check-circle" style="color: #27ae60;"></i>
                            <span>Kupon <span class="coupon-applied-code">${kuponAktif}</span> telah digunakan</span>
                        </div>
                        <button class="remove-coupon-btn" onclick="hapusKupon()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            } else {
                couponStatus.innerHTML = `
                    <div class="coupon-input-container">
                        <input type="text" class="coupon-input" id="couponInput" placeholder="Masukkan kode kupon" onkeypress="handleCouponInput(event)">
                        <button class="apply-coupon-btn" onclick="applyCoupon()">Gunakan</button>
                    </div>
                `;
            }
        }

        function hapusKupon() {
            kuponAktif = null;
            diskonKupon = 0;
            updateTotalKeranjang();
            updateCouponStatus();
            notif('Kupon telah dihapus');
        }


        async function tambahKupon(event) {
            event.preventDefault();

            const couponCode = document.getElementById('couponCode').value;
            const couponDiscount = document.getElementById('couponDiscount').value;
            const couponExpiry = document.getElementById('couponExpiry').value;
            const couponDescription = document.getElementById('couponDescription').value;

            try {
                // Send data to Google Sheets
                const response = await fetch('https://script.google.com/macros/s/AKfycbzCsGSvRaiYghxVFlOtkscqP6fkbZfcLBLW1mXtaDD2idqMqHDVjvdii2Tes7bMBElHEg/exec', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'addCoupon',
                        code: couponCode,
                        discount: couponDiscount,
                        expiry: couponExpiry,
                        description: couponDescription
                    }),
                    redirect: 'follow'
                });

                if (response.ok) {
                    notif('Kupon berhasil ditambahkan!');

                    // Reset form
                    document.getElementById('couponCode').value = '';
                    document.getElementById('couponDiscount').value = '';
                    document.getElementById('couponExpiry').value = '';
                    document.getElementById('couponDescription').value = '';

                    // Reload coupon data
                    await loadDataKupon();
                    tampilDaftarKupon();
                } else {
                    notif('Gagal menambahkan kupon. Silakan coba lagi.');
                }
            } catch (error) {
                console.error('Error adding coupon:', error);
                notif('Terjadi kesalahan saat menambahkan kupon');
            }
        }

        function tampilDaftarKupon() {
            const couponListContainer = document.getElementById('couponListContainer');

            if (dataKupon.length === 0) {
                couponListContainer.innerHTML = '<p style="text-align: center; padding: 1rem;">Tidak ada kupon aktif</p>';
                return;
            }

            couponListContainer.innerHTML = dataKupon.map(coupon => `
                <div class="coupon-item">
                    <div class="coupon-info">
                        <div class="coupon-code">${coupon.code}</div>
                        <div class="coupon-details">Diskon: ${coupon.discount}% | Kadaluarsa: ${formatDate(new Date(coupon.expiry))}</div>
                        ${coupon.description ? `<div class="coupon-details">${coupon.description}</div>` : ''}
                    </div>
                    <button class="delete-coupon-btn" onclick="hapusKuponAdmin('${coupon.code}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }

        async function hapusKuponAdmin(couponCode) {
            if (!confirm(`Apakah Anda yakin ingin menghapus kupon ${couponCode}?`)) {
                return;
            }

            try {
                // Send request to Google Sheets
                const response = await fetch('https://script.google.com/macros/s/AKfycbzCsGSvRaiYghxVFlOtkscqP6fkbZfcLBLW1mXtaDD2idqMqHDVjvdii2Tes7bMBElHEg/exec', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'deleteCoupon',
                        code: couponCode
                    }),
                    redirect: 'follow'
                });

                if (response.ok) {
                    notif('Kupon berhasil dihapus!');

                    // Reload coupon data
                    await loadDataKupon();
                    tampilDaftarKupon();
                } else {
                    notif('Gagal menghapus kupon. Silakan coba lagi.');
                }
            } catch (error) {
                console.error('Error deleting coupon:', error);
                notif('Terjadi kesalahan saat menghapus kupon');
            }
        }


        let slideIndex = 1;
        let slideInterval;

        // Function to show specific slide
        function currentSlide(n) {
            showSlide(slideIndex = n);
            resetInterval();
        }

        // Function to show slides
        function showSlide(n) {
            let i;
            const slides = document.getElementsByClassName("banner-slide");
            const dots = document.getElementsByClassName("dot");

            if (n > slides.length) { slideIndex = 1 }
            if (n < 1) { slideIndex = slides.length }

            for (i = 0; i < slides.length; i++) {
                slides[i].classList.remove("active");
            }

            for (i = 0; i < dots.length; i++) {
                dots[i].classList.remove("active");
            }

            slides[slideIndex - 1].classList.add("active");
            dots[slideIndex - 1].classList.add("active");
        }

        // Function to reset the interval
        function resetInterval() {
            clearInterval(slideInterval);
            slideInterval = setInterval(autoSlide, 5000); // Change slide every 5 seconds
        }

        // Function for auto slide
        function autoSlide() {
            slideIndex++;
            showSlide(slideIndex);
        }

        // Initialize banner slider when DOM is loaded
        document.addEventListener("DOMContentLoaded", function () {
            // Start auto slide
            slideInterval = setInterval(autoSlide, 5000);

            // Show first slide
            showSlide(slideIndex);
        });


        // Scroll Event
        function setupScrollEvent() {
            const tombolScroll = document.getElementById('scrollTop');
            const navbar = document.getElementById('navbar');

            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) {
                    tombolScroll.classList.add('show');
                } else {
                    tombolScroll.classList.remove('show');
                }

                if (window.scrollY > 100) {
                    navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
                } else {
                    navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
                }
            });
        }

        // Smooth scroll untuk navigasi
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        function checkLoginStatus() {
            // Cek apakah user sudah login
            const userFromStorage = localStorage.getItem('user') || sessionStorage.getItem('user');

            if (userFromStorage) {
                currentUser = JSON.parse(userFromStorage);
                userLoggedIn = true;
                updateUserUI();
            }
        }

        function updateUserUI() {
            if (userLoggedIn) {
                // Tampilkan info user
                document.getElementById('userName').textContent = currentUser.name;
                document.getElementById('userInfo').style.display = 'block';

                // Sembunyikan tombol login
                document.getElementById('loginBtn').style.display = 'none';

                // Tampilkan menu user
                document.getElementById('profileBtn').style.display = 'block';
                document.getElementById('ordersBtn').style.display = 'block';

                // Tampilkan tombol admin jika user adalah admin
                if (currentUser.type === 'admin') {
                    document.getElementById('adminBtn').style.display = 'block';
                } else {
                    document.getElementById('adminBtn').style.display = 'none';
                }

                document.getElementById('logoutBtn').style.display = 'block';
            } else {
                // Sembunyikan info user
                document.getElementById('userInfo').style.display = 'none';

                // Tampilkan tombol login
                document.getElementById('loginBtn').style.display = 'block';

                // Sembunyikan menu user
                document.getElementById('profileBtn').style.display = 'none';
                document.getElementById('ordersBtn').style.display = 'none';
                document.getElementById('adminBtn').style.display = 'none';
                document.getElementById('logoutBtn').style.display = 'none';
            }
        }

        function toggleUserMenu() {
            if (userLoggedIn) {
                document.getElementById('userDropdown').classList.toggle('active');
            } else {
                bukaLogin();
            }
        }

        function logout() {
            // Hapus data user dari storage
            localStorage.removeItem('user');
            sessionStorage.removeItem('user');

            // Reset state
            currentUser = null;
            userLoggedIn = false;

            // Kosongkan keranjang
            keranjangBelanja = [];
            updateJumlahKeranjang();

            // Update UI
            updateUserUI();

            // Tutup dropdown
            document.getElementById('userDropdown').classList.remove('active');

            notif('Anda telah keluar dari akun');
        }

        function bukaProfil() {
            notif('Halaman profil sedang dalam pengembangan');
            document.getElementById('userDropdown').classList.remove('active');
        }

        function bukaPesanan() {
            notif('Halaman pesanan sedang dalam pengembangan');
            document.getElementById('userDropdown').classList.remove('active');
        }

        // Tutup dropdown saat klik di luar
        document.addEventListener('click', function (event) {
            const userDropdown = document.getElementById('userDropdown');
            if (!userDropdown.contains(event.target)) {
                userDropdown.classList.remove('active');
            }
        });

        // Event listener untuk menutup modal produk saat klik di luar
        document.getElementById('productModal').addEventListener('click', function (event) {
            if (event.target === this) {
                tutupProdukModal();
            }
        });

        // Event listener untuk menutup modal keranjang saat klik di luar
        document.getElementById('cartModal').addEventListener('click', function (event) {
            if (event.target === this) {
                bukaKeranjang();
            }
        });

        // Event listener untuk menutup modal struk saat klik di luar
        document.getElementById('receiptModal').addEventListener('click', function (event) {
            if (event.target === this) {
                tutupStruk();
            }
        });

        // Event listener untuk menutup modal admin saat klik di luar
        document.getElementById('adminPanel').addEventListener('click', function (event) {
            if (event.target === this) {
                tutupAdminPanel();
            }
        });