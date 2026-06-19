# Dasturiy Ta'minot Talablari Spetsifikatsiyasi (SRS)

**Loyiha nomi:** Kichik Instagram Loyihasi (Social Network Web App)  
**Hujjat turi:** MVP uchun Funksional va Biznes Talablar  
**Platforma:** Web (Desktop & Mobile Responsive)

---

## 1. Loyiha haqida umumiy ma'lumot
Ushbu loyiha foydalanuvchilarga vizual kontent (rasm, karusel, video) ulashish, bir-birlarini kuzatish va shaxsiy daxlsizlikni boshqarish imkonini beruvchi ijtimoiy tarmoq platformasining MVP (Minimum Viable Product) versiyasidir. Tizim sodda, tezkor va foydalanuvchi uchun tushunarli veb-interfeys orqali ishlaydi.

---

## 2. Foydalanuvchi rollari va ruxsatnomalar

Tizimda 2 ta asosiy rol mavjud bo'lib, ularning ruxsatnomalari quyidagicha taqsimlanadi:

| Rol | Ruxsatnomalar (Permissions) |
| :--- | :--- |
| **Oddiy Foydalanuvchi (User)** | Ro'yxatdan o'tish, profilni sozlash (Public/Private), post yuklash (rasm/video/karusel), boshqalarga obuna bo'lish (Follow), obuna so'rovlarini boshqarish, shaxsiy lentani (Feed) ko'rish. |
| **Tizim Administratori (Admin)** | Tizimdagi barcha foydalanuvchilar va postlar ustidan to'liq nazorat, qoidalarni buzgan postlarni o'chirish, nojo'ya foydalanuvchilarni bloklash hamda umumiy tizim statistikasini ko'rish. |

---

## 3. Funksional talablar (Modullar kesimida)

### 3.1. Autentifikatsiya va Ro'yxatdan o'tish moduli
* **Tizimga kirish usullari:** Foydalanuvchi Email va Parol yordamida yoki **Google OAuth** orqali bir marta bosish bilan tezkor ro'yxatdan o'tishi va tizimga kirishi mumkin.
* **Sessiyani boshqarish:** Foydalanuvchi tizimdan chiqmaguncha brauzerda sessiya saqlanib qolishi kerak.

### 3.2. Profil va Maxfiylik moduli
* **Profil ma'lumotlari:** Foydalanuvchi ismi, username (unikal bo'lishi shart), profil rasmi (Avatar) va Bio (o'zi haqida qisqa matn).
* **Maxfiylik sozlamalari:** Foydalanuvchi o'z akkauntini istalgan vaqtda **Public (Ochiq)** yoki **Private (Yopiq)** holatiga o'tkazishi mumkin.

### 3.3. Post yuklash moduli (Content Creation)
* **Kontent turlari:** Matnli tavsif (Caption) bilan birgalikda **bitta rasm**, **karusel (bir nechta rasm)** yoki **video** yuklash imkoniyati.
* **Cheklovlar:** * Bitta postdagi karusel rasmlar soni cheklangan bo'ladi (max 5-10 ta).
  * Yuklanadigan fayllar hajmiga cheklov qo'yiladi (max 5MB rasm uchun, max 20MB video uchun).
  * Post ostidagi matn (Caption) hajmi belgilangan simvoldan oshmasligi kerak.

### 3.4. Obunalar (Follow/Unfollow) moduli
* **Public akkauntlar:** Foydalanuvchi "Follow" tugmasini bosganda, tizim avtomatik ravishda uni obunachiga aylantiradi.
* **Private akkauntlar:** Foydalanuvchi "Follow" tugmasini bosganda, qarshi tomonga **Obuna so'rovi (Follow Request)** yuboriladi.

### 3.5. Lenta (Feed) moduli
* **Shakllanish mantiqi:** Tizim sof **Xronologik** tartibda ishlaydi. Foydalanuvchi bosh sahifaga kirganda, faqat o'zi obuna bo'lgan (tasdiqlangan) foydalanuvchilarning postlarini eng yangisidan boshlab ko'radi.

---

## 4. Biznes logika va tizim qoidalari

* **Unikallik qoidasi:** Tizimda bitta `username` yoki bitta `email` orqali ikkita alohida akkaunt ochish taqiqlanadi.
* **Private Kontent daxlsizligi:** Private akkaunt egalarining postlari qidiruvda yoki umumiy havolalar orqali obuna bo'lmagan shaxslarga ko'rinmaydi.
* **Yagona Admin tamoyili:** Tizimda bitta boshqaruvchi (Admin) mavjud bo'lib, rollarni iyerarxik bo'lish (superadmin, moderator) MVP versiyada ko'zda tutilmagan.

---

## 5. No-funksional talablar

* **Xavfsizlik (Security):** Foydalanuvchi parollari ma'lumotlar bazasida ochiq holda saqlanmaydi (kriptografik xeshlash majburiy). Google OAuth tokenlari xavfsiz saqlanishi shart.
* **Ishlash tezligi (Performance):** Rasmlar va videolar yuklanganda tizim resurslarini tejash uchun ularni optimizatsiya qilish va siqish (compression) mexanizmi bo'lishi kerak.
* **Foydalanuvchi interfeysi (UX/UI):** Veb-sayt mobil qurilmalarga to'liq moslashuvchan (Responsive) bo'lishi shart, chunki ijtimoiy tarmoq foydalanuvchilarining aksariyati smartfonlardan foydalanadi.

---

## 6. Edge Case-lar (Yashirin chekka holatlar) va ularning yechimlari

### Yechim talab qiladigan vaziyatlar:
1. **Hisob turi o'zgarganda nima bo'ladi?** * *Ssenariy:* Akkaunt **Private** holatda bo'lgan va unga ko'plab "Follow Request"lar kelgan. Foydalanuvchi to'satdan akkauntini **Public** qilib o'zgartirdi.
   * *Yechim:* Tizim barcha kutilayotgan (pending) so'rovlarni avtomatik ravishda tasdiqlangan obunachiga (Follower) aylantirishi va so'rovlar ro'yxatini tozalashi kerak.
2. **Obunalar yo'qligida Lenta (Feed) holati:** * *Ssenariy:* Yangi ro'yxatdan o'tgan foydalanuvchi hali hech kimga obuna bo'lmagan. Xronologik qoidaga ko'ra uning lentasi bo'sh bo'lishi kerak.
   * *Yechim:* Foydalanuvchi zerikib platformadan chiqib ketmasligi uchun, lenta bo'sh bo'lgan holatda tizim unga "Tavsiya etilgan ommaviy profillar" ro'yxatini yoki platformadagi eng so'nggi ommaviy (Public) postlarni ko'rsatadi.
3. **Kontent yuklash uzilib qolganda:** * *Ssenariy:* Foydalanuvchi katta hajmli karusel yoki video yuklayotganda internet uzilib qoldi.
   * *Yechim:* Tizim xatolik haqida UI oynasida aniq xabar berishi va ma'lumotlar bazasida chala qolib ketgan "yetim" fayllarni tozalab tashlashi kerak.

---

## 7. Foydalanuvchi yo'li (User Journey Map Summary)

### Oddiy foydalanuvchi yo'li:
`[Kirish/Ro'yxatdan o'tish] ➔ [Profilni sozlash (Ochiq/Yopiq)] ➔ [Post yuklash (Matn+Karusel)] ➔ [Boshqa foydalanuvchini qidirish va Follow bosish] ➔ [Shaxsiy Lentani (Feed) xronologik ko'rish]`

### Administrator yo'li:
`[Admin panelga kirish] ➔ [Tizim statistikasini ko'rish] ➔ [Kontentni moderatsiya qilish (Ochirish/Bloklash)]`
