let allData = [];
const apiURL = "https://api.npoint.io/433d2b54b3c3bb324e23";

// 1. Uygulama Başlatma ve Veri Çekme
async function initApp() {
    updateOnlineStatus(); // İnternet kontrolü yap
    
    try {
        const res = await fetch(apiURL);
        if (!res.ok) throw new Error("API Hatası");
        
        allData = await res.json();
        localStorage.setItem('backupData', JSON.stringify(allData)); // Yedek al
        renderFeed(allData);
    } catch (e) {
        // Çevrimdışı mod: Yedekten oku
        allData = JSON.parse(localStorage.getItem('backupData')) || [];
        renderFeed(allData);
        console.warn("Veriler yerel hafızadan yüklendi.");
    }
    renderMyTasks(); // Üstlenilenleri yükle
}

// 2. Yardım İlanları
function renderFeed(data) {

    updateStats(data);
    const feed = document.getElementById('help-feed');
    
    let myTasks = JSON.parse(localStorage.getItem('myTasks')) || [];

    if (!data || data.length === 0) {
        feed.innerHTML = `
            <div style="text-align:center; padding:50px; opacity:0.5;">
                // renderFeed içindeki konum satırını şu şekilde güncelle
<span>
    📍 <b>Konum:</b> 
    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.konum)}" 
       target="_blank" 
       style="color: #0d47a1; text-decoration: underline; cursor: pointer;">
        ${item.konum}
    </a>
</span>
                <p>Aradığınız kriterlere uygun ilan bulunamadı.<br>Lütfen filtreleri temizlemeyi deneyin.</p>
            </div>`;
        return;
    }
    
    feed.innerHTML = data.map(item => {
        // ilan zaten üstlenilmiş mi kontrol et
        const isAssigned = myTasks.find(t => t.id === item.id);
        
        return `
            <div class="card" style="${item.acil ? 'border-left: 6px solid #d32f2f; background-color: #fff8f8;' : 'border-left: 6px solid #0d1b2a;'}">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <span class="badge" style="background:#e8eaf6; color:#1a237e; padding:4px 10px; border-radius:4px; font-size:0.7rem; font-weight:bold;">
                         ${(item.kategori || "GENEL").toUpperCase()}
                    </span>
                    ${item.acil ? '<b style="color:#d32f2f; font-size:0.75rem; animation: blink 1.5s infinite;">⚠️ ACİL DURUM</b>' : ''}
                </div>
                
                <h3 style="margin: 12px 0 8px 0; color:#0d1b2a;">${item.baslik}</h3>
                <p style="font-size:0.9rem; line-height:1.5; color:#37474f;">${item.detay}</p>
                
                <div style="font-size:0.8rem; color:#546e7a; margin-top:12px; display:grid; gap:6px;">
                    <span style="display: flex; align-items: center; gap: 5px;">
                        📍 <b>Konum:</b> ${item.konum} 
                        <span style="margin: 0 5px; opacity: 0.5;"></span> 
                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.konum)}" 
                        target="_blank" 
                        style="color: #1a237e; text-decoration: none; font-weight: bold; border-bottom:#1a237e;">
                        Haritada Aç
                        </a>
                    </span>
    <span>📅 <b>Tarih:</b> ${item.tarih}</span>
</div>
                
                <button onclick="shareTask('${item.baslik}', '${item.konum}')" 
                    style="background: #e1f5fe; border: none; color: #01579b; padding: 12px 15px; border-radius: 8px; cursor: pointer; margin-top: 15px; font-weight: bold; flex: 1;">
               ➤ Paylaş
            </button>
                <button class="btn-assign" id="btn-${item.id}" 
                        onclick="assignTask(${item.id})" 
                        style="margin-top:15px; cursor:pointer; 
                        ${isAssigned ? 'background: #2a9d8f; cursor: not-allowed;' : ''}" 
                        ${isAssigned ? 'disabled' : ''}>
                    ${isAssigned ? '✅ Üstlenildi' : 'Görevi Üstlen'}
                </button>
            </div>
        `;
    }).join('');
}

// 3. Kategori filtreleme (Tam Eşleşme)
function filterData(cat, btn) {
    // Buton aktiflik durumunu güncelle
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Filtreleme
    const filtered = cat === 'Tümü' ? allData : allData.filter(i => i.kategori === cat);
    renderFeed(filtered);
}

// 4. Görev Üstlenme ve Silme 
function assignTask(id) {
    const task = allData.find(i => i.id === id);
    let myTasks = JSON.parse(localStorage.getItem('myTasks')) || [];
    
    if (!myTasks.find(t => t.id === id)) {
        myTasks.push(task);
        localStorage.setItem('myTasks', JSON.stringify(myTasks));
                const btn = document.getElementById(`btn-${id}`);
        if(btn) {
            btn.innerText = "✅ Üstlenildi";
            btn.style.background = "#2a9d8f"; 
            btn.style.cursor = "not-allowed"; // İmleci engellendi yap
            btn.disabled = true;              // Tıklanmayı  kapat 
        }
        
        renderMyTasks();
    }
}

function deleteTask(id) {
    let myTasks = JSON.parse(localStorage.getItem('myTasks')) || [];
    myTasks = myTasks.filter(t => t.id !== id);
    localStorage.setItem('myTasks', JSON.stringify(myTasks));
    
    renderMyTasks(); // Kendi listeni güncelle
    renderFeed(allData); // Ana listeyi ve butonları güncelle 
}

function renderMyTasks() {
    const container = document.getElementById('my-tasks');
    let myTasks = JSON.parse(localStorage.getItem('myTasks')) || [];
    
    if (myTasks.length === 0) {
        container.innerHTML = "<p style='font-size:0.85rem; opacity:0.6;'>Henüz bir görev üstlenmediniz.</p>";
        return;
    }
    
    container.innerHTML = myTasks.map(t => `
        <div class="card" style="border-left: 4px solid #546e7a; padding: 12px; margin-bottom:10px;">
            <h4 style="margin:0; font-size:0.95rem; color:#263238;">${t.baslik}</h4>
            <button class="btn-delete" onclick="deleteTask(${t.id})" style="margin-top:8px; cursor:pointer; color:#d32f2f; background:none; border:none; font-size:0.8rem; font-weight:bold;">
                Vazgeç / Sil
            </button>
        </div>
    `).join('');
}

// 5. İnternet Durumu
function updateOnlineStatus() {
    const band = document.getElementById('status-band');
    if (navigator.onLine) {
        band.innerText = "SİSTEM ÇEVRİM İÇİ";
        band.className = "status-online";
    } else {
        band.innerText = "ÇEVRİM DIŞI (Son veriler gösteriliyor)";
        band.className = "status-offline";
    }
}

function searchData() {
    const term = document.getElementById('searchInput').value.toLocaleLowerCase('tr').trim();
    
    // Aktif filtre butonu
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[onclick*="Tümü"]').classList.add('active');

    const filtered = allData.filter(item => {
        const baslik = (item.baslik || "").toLocaleLowerCase('tr');
        const detay = (item.detay || "").toLocaleLowerCase('tr');
        const konum = (item.konum || "").toLocaleLowerCase('tr');
        
        // Arama terimi başlıkta detayda veya konumda geçiyor mu
        return baslik.includes(term) || detay.includes(term) || konum.includes(term);
    });

    renderFeed(filtered);
}

function updateStats(data) {
    const statsPanel = document.getElementById('stats-panel');
    const myTasks = JSON.parse(localStorage.getItem('myTasks')) || [];

    const total = data.length;
    const urgent = data.filter(item => item.acil === true).length;
    const assigned = myTasks.length;

    statsPanel.innerHTML = `
        <div class="stat-card">
            <span class="stat-value">${total}</span>
            <span class="stat-label">Aktif İlan</span>
        </div>
        <div class="stat-card">
            <span class="stat-value stat-urgent">${urgent}</span>
            <span class="stat-label">Acil İhtiyaç</span>
        </div>
        <div class="stat-card">
            <span class="stat-value" style="color: #2a9d8f;">${assigned}</span>
            <span class="stat-label"> Üstlendiğim</span>
        </div>
    `;
}

function shareTask(baslik, konum) {
    const text = `🚨 YARDIM ÇAĞRISI: ${baslik}\n📍 Konum: ${konum}\n🛡️ Afet Koordinasyon Sistemi üzerinden paylaşıldı.`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Afet Yardımı',
            text: text,
            url: window.location.href
        });
    } else {
        // Bilgisayarda ise WhatsApp Web'e yönlendirir
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
}

// Olay Dinleyicileri
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
window.onload = initApp;
