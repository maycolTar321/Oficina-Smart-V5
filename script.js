/**
 * OFICINA PRO V10 - MARIO & FRIENDS EDITION
 * Luigi en el equipo 2 y Bowser en el pago final.
 */

const app = {
    db: JSON.parse(localStorage.getItem('oficina_v10_db')) || [],
    config: JSON.parse(localStorage.getItem('oficina_v10_cfg')) || {
        officialName: 'Nilsa',
        adminName: 'Maycol Avila',
        internetTarget: 179,
        turn1: 'OFICIAL / MAYCOL',
        turn2: 'SAMUEL / XIMENA'
    },
    bottlesFull: localStorage.getItem('oficina_v10_bottles') === 'true',
    isMusicPlaying: false,
    chart: null,
    trendChart: null,

    init() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        
        document.getElementById('cfg-official').value = this.config.officialName;
        document.getElementById('cfg-admin').value = this.config.adminName;
        document.getElementById('cfg-turn1').value = this.config.turn1;
        document.getElementById('cfg-turn2').value = this.config.turn2;
        document.getElementById('man-date').valueAsDate = new Date();
        
        document.getElementById('man-name').addEventListener('change', (e) => {
            document.getElementById('man-other').style.display = e.target.value === 'Otro' ? 'block' : 'none';
        });

        this.sync();
    },

    updateClock() {
        const now = new Date();
        document.getElementById('clock').innerText = now.toLocaleTimeString();
    },

    playSound(id) {
        const s = document.getElementById(id);
        if(s) { s.currentTime = 0; s.play().catch(e => console.log("Audio bloqueado")); }
    },

    toggleMusic() {
        const theme = document.getElementById('snd-theme');
        const btn = document.getElementById('music-btn');
        if(this.isMusicPlaying) {
            theme.pause();
            btn.innerText = "🔇";
        } else {
            theme.play();
            btn.innerText = "🔊";
        }
        this.isMusicPlaying = !this.isMusicPlaying;
    },

    nav(viewId, btn) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        btn.classList.add('active');
        if(viewId === 'view-caja') setTimeout(() => { this.renderChart(); this.renderTrendChart(); }, 100);
        window.scrollTo(0,0);
    },

    showConfirm() {
        const pop = document.getElementById('confirm-pop');
        pop.classList.add('show');
        this.playSound('snd-jump');
        setTimeout(() => pop.classList.remove('show'), 1500);
    },

    fillBottles(nombreEquipo) {
        this.bottlesFull = true;
        localStorage.setItem('oficina_v10_bottles', 'true');
        this.updateBottlesUI();
        this.showConfirm();
        this.saveEntry({
            id: 'WAT-' + Date.now(),
            n: 'Llenado: ' + nombreEquipo, a: 0, t: 'Agua',
            d: new Date().toISOString().split('T')[0], ts: Date.now()
        });
    },

    emptyBottles() {
        this.bottlesFull = false;
        localStorage.setItem('oficina_v10_bottles', 'false');
        this.updateBottlesUI();
        this.playSound('snd-coin');
    },

    updateBottlesUI() {
        const b1 = document.getElementById('bot-1');
        const b2 = document.getElementById('bot-2');
        const text = document.getElementById('bottle-text');
        if(this.bottlesFull) {
            b1.classList.add('full'); b2.classList.add('full');
            text.innerText = "¡SÚPER LLENOS! 🥤🥤";
            text.style.color = "var(--mario-green)";
        } else {
            b1.classList.remove('full'); b2.classList.remove('full');
            text.innerText = "Vacío. Toca equipo abajo.";
            text.style.color = "var(--text-dim)";
        }
    },

    action(nombre, monto, tipo, esOficial = false) {
        const finalName = esOficial ? this.config.officialName : nombre;
        this.saveEntry({
            id: 'TX-' + Date.now(),
            n: finalName, a: parseFloat(monto), t: tipo,
            d: new Date().toISOString().split('T')[0], ts: Date.now()
        });
        
        if(tipo === 'Oficial' || tipo === 'Internet') {
            this.spawnEffect('fireball');
            this.playSound('snd-fireball');
        } else {
            this.spawnEffect('coin');
            this.playSound('snd-coin');
        }
        
        this.showConfirm();
    },

    addManual() {
        const monto = parseFloat(document.getElementById('man-amount').value);
        const date = document.getElementById('man-date').value;
        if(!monto || !date) return alert("⚠️ Datos incompletos");
        const selName = document.getElementById('man-name').value;
        let finalName = selName === 'Oficial' ? this.config.officialName : (selName === 'Otro' ? (document.getElementById('man-other').value || 'Varios') : selName);
        this.saveEntry({ id: 'MAN-' + Date.now(), n: finalName, a: monto, t: document.getElementById('man-cat').value, d: date, ts: new Date(date).getTime() });
        this.playSound('snd-coin'); this.showConfirm();
    },

    saveEntry(entry) {
        this.db.push(entry);
        localStorage.setItem('oficina_v10_db', JSON.stringify(this.db));
        this.sync();
    },

    sync() {
        const total = this.db.reduce((acc, i) => acc + i.a, 0);
        const intB = this.db.filter(i => i.t === 'Internet' || i.t === 'Oficial').reduce((acc, i) => acc + i.a, 0);
        document.getElementById('total-balance').innerText = total.toFixed(2) + " Bs";
        
        document.querySelectorAll('.official-name-display').forEach(el => el.innerText = this.config.officialName);
        document.getElementById('h-user').innerText = this.config.adminName;
        document.getElementById('h-avatar').innerText = this.config.adminName.substring(0,2).toUpperCase();

        const target = 179;
        const porc = Math.min((intB / target) * 100, 100);
        document.getElementById('int-bs').innerText = intB.toFixed(2) + " Bs";
        document.getElementById('int-perc').innerText = Math.floor(porc) + "%";
        document.getElementById('int-bar').style.width = porc + "%";
        
        // Efecto visual de Bowser según vida
        const bowserImg = document.querySelector('.bowser-img');
        if(bowserImg) {
            bowserImg.style.filter = `grayscale(${100 - porc}%) contrast(${50 + (porc/2)}%)`;
            if(porc >= 100) bowserImg.classList.add('defeated-glow');
            else bowserImg.classList.remove('defeated-glow');
        }

        if(intB >= target) {
            document.getElementById('int-text').innerText = "¡BOWSER DEBILITADO! ¡DALE EL GOLPE FINAL!";
            document.getElementById('int-text').style.color = "var(--mario-yellow)";
            document.getElementById('bowser-btn').classList.add('ready');
        } else {
            document.getElementById('int-text').innerText = `Faltan ${(target - intB).toFixed(2)} monedas para el Dragón`;
            document.getElementById('int-text').style.color = "var(--text-dim)";
            document.getElementById('bowser-btn').classList.remove('ready');
        }

        const ultAgua = this.db.filter(i => i.t === 'Agua').sort((a,b) => b.ts - a.ts)[0];
        let sugerido = this.config.turn1;
        if(ultAgua && ultAgua.n.includes(this.config.turn1)) sugerido = this.config.turn2;
        document.getElementById('suggestion-text').innerText = sugerido;
        document.getElementById('btn-turn1-label').innerText = this.config.turn1;
        document.getElementById('btn-turn2-label').innerText = this.config.turn2;

        this.updateBottlesUI();
        this.renderLogs();
        this.renderVisualReport();
    },

    renderVisualReport() {
        const container = document.getElementById('visual-report-container');
        if(!container) return;
        const summary = {};
        this.db.forEach(item => { if(item.a > 0) summary[item.n] = (summary[item.n] || 0) + item.a; });
        let html = `<h4 style="font-size:10px; color:var(--text-dim); margin-bottom:10px;">📊 MONEDAS DEL REINO</h4>`;
        for (let name in summary) {
            html += `<div style="display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.03); border-radius:15px; margin-bottom:8px; font-size:13px; border-left: 4px solid var(--mario-yellow);">
                <span style="font-weight:700;">${name}</span><span style="color:var(--mario-yellow); font-weight:800;">${summary[name].toFixed(2)} Bs</span>
            </div>`;
        }
        container.innerHTML = html;
    },

    renderLogs() {
        const container = document.getElementById('log-container');
        if(!container) return;
        container.innerHTML = '<h3 style="font-size: 10px; color: var(--text-dim); margin-bottom: 15px;">MISIONES REALIZADAS</h3>';
        const sorted = [...this.db].sort((a,b) => b.ts - a.ts).slice(0, 15);
        sorted.forEach(item => {
            const isPos = item.a >= 0;
            const div = document.createElement('div');
            div.className = 'btn-action';
            div.style.marginBottom = "10px"; div.style.display = "flex"; div.style.justifyContent = "space-between";
            div.style.alignItems = "center"; div.style.padding = "15px 20px";
            div.onclick = () => this.openEdit(item.id);
            div.innerHTML = `<div style="display: flex; align-items: center; gap: 15px;"><div style="font-size: 20px;">${this.getIcon(item.t)}</div><div><div style="font-size: 14px; font-weight: 800;">${item.n}</div><div style="font-size: 10px; color: var(--text-dim);">${item.d}</div></div></div><div style="font-family: 'JetBrains Mono'; font-weight: 800; color: ${item.a === 0 ? 'var(--text-dim)' : (isPos ? 'var(--mario-green)' : 'var(--mario-red)')}">${item.a === 0 ? '✓' : (isPos ? '+' : '') + item.a.toFixed(2)}</div>`;
            container.appendChild(div);
        });
    },

    getIcon(t) { return t === 'Internet' ? '🍄' : (t === 'Agua' ? '🥤' : (t === 'Oficial' ? '🌟' : '📝')); },

    settleInternet() {
        const current = this.db.filter(i => i.t === 'Internet' || i.t === 'Oficial').reduce((acc, i) => acc + i.a, 0);
        if(current < 179) {
            this.playSound('snd-error');
            const btn = document.getElementById('bowser-btn');
            btn.classList.add('shake');
            setTimeout(() => btn.classList.remove('shake'), 500);
            return;
        }
        if(confirm("¿Derrotar a Bowser y pagar el mes?")) {
            this.saveEntry({ id: 'OUT-' + Date.now(), n: 'PAGO MES INTERNET', a: -179, t: 'Internet', d: new Date().toISOString().split('T')[0], ts: Date.now() });
            this.playSound('snd-win');
            this.showConfirm();
            this.spawnEffect('victory');
        }
    },

    spawnEffect(type) {
        const container = document.body;
        const el = document.createElement('div');
        el.className = `mario-effect ${type}`;
        el.innerHTML = type === 'coin' ? '🪙' : (type === 'fireball' ? '🔥' : '👑');
        el.style.left = (Math.random() * 80 + 10) + '%';
        el.style.top = '80%';
        container.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    },

    openEdit(id) {
        const item = this.db.find(i => i.id === id);
        if(!item) return;
        document.getElementById('edit-id').value = item.id;
        document.getElementById('edit-n').value = item.n;
        document.getElementById('edit-a').value = Math.abs(item.a);
        document.getElementById('edit-d').value = item.d;
        document.getElementById('modal-edit').style.display = 'flex';
    },

    closeEdit() { document.getElementById('modal-edit').style.display = 'none'; },

    saveEdit() {
        const id = document.getElementById('edit-id').value;
        const idx = this.db.findIndex(i => i.id === id);
        if(idx === -1) return;
        this.db[idx].n = document.getElementById('edit-n').value;
        this.db[idx].a = (this.db[idx].a < 0 ? -1 : 1) * parseFloat(document.getElementById('edit-a').value);
        this.db[idx].d = document.getElementById('edit-d').value;
        this.db[idx].ts = new Date(this.db[idx].d).getTime();
        localStorage.setItem('oficina_v10_db', JSON.stringify(this.db));
        this.sync(); this.closeEdit(); this.playSound('snd-coin');
    },

    delete() {
        const id = document.getElementById('edit-id').value;
        if(confirm("¿Borrar?")) {
            this.db = this.db.filter(i => i.id !== id);
            localStorage.setItem('oficina_v10_db', JSON.stringify(this.db));
            this.sync(); this.closeEdit(); this.playSound('snd-over');
        }
    },

    showFullReport() {
        const total = this.db.reduce((acc, i) => acc + i.a, 0);
        const intB = this.db.filter(i => i.t === 'Internet').reduce((acc, i) => acc + i.a, 0);
        const summary = {};
        this.db.forEach(item => { if(item.a > 0) summary[item.n] = (summary[item.n] || 0) + item.a; });
        let msg = `🍄 *REPORTE DE MARIO (ESPAÑOL)*\n💰 CAJA GENERAL: ${total.toFixed(2)} Bs\n🌐 INTERNET: ${intB.toFixed(2)}/179 Bs\n---------------------------\n📊 RESUMEN DE APORTES:\n`;
        for (let name in summary) { msg += `• ${name}: ${summary[name].toFixed(2)} Bs\n`; }
        document.getElementById('report-area').innerText = msg;
        document.getElementById('modal-report').style.display = 'flex';
    },

    closeReport() { document.getElementById('modal-report').style.display = 'none'; },
    shareWA() { window.open(`https://wa.me/?text=${encodeURIComponent(document.getElementById('report-area').innerText)}`, '_blank'); },

    saveCfg() {
        this.config.officialName = document.getElementById('cfg-official').value || 'Oficial';
        this.config.adminName = document.getElementById('cfg-admin').value || 'Admin';
        this.config.turn1 = document.getElementById('cfg-turn1').value || 'EQUIPO 1';
        this.config.turn2 = document.getElementById('cfg-turn2').value || 'EQUIPO 2';
        localStorage.setItem('oficina_v10_cfg', JSON.stringify(this.config));
        this.sync(); this.playSound('snd-power'); this.showConfirm();
    },

    wipe() { 
        if(confirm("¿GAME OVER?")) { 
            this.db = []; 
            this.bottlesFull = false;
            localStorage.removeItem('oficina_v10_db'); 
            localStorage.setItem('oficina_v10_bottles', 'false');
            this.sync(); 
            this.playSound('snd-over'); 
        } 
    },
    backup() {
        const blob = new Blob([JSON.stringify(this.db)], {type: 'application/json'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `mario_v10.json`; a.click();
    },

    restore(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    this.db = data;
                    localStorage.setItem('oficina_v10_db', JSON.stringify(this.db));
                    this.sync();
                    this.playSound('snd-power');
                    alert('✅ Respaldo cargado correctamente!');
                } else {
                    alert('❌ Formato de respaldo inválido.');
                }
            } catch (err) {
                alert('❌ Error al leer el archivo de respaldo.');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    },

    renderChart() {
        const ctx = document.getElementById('mainChart').getContext('2d');
        const intB = this.db.filter(i => i.t === 'Internet').reduce((acc, i) => acc + i.a, 0);
        const total = this.db.reduce((acc, i) => acc + i.a, 0);
        if(this.chart) this.chart.destroy();
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['Internet', 'Otros'], datasets: [{ data: [intB, total - intB], backgroundColor: ['#007cc3', '#e62423'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '75%' }
        });
    },

    renderTrendChart() {
        const ctx = document.getElementById('trendChart').getContext('2d');
        const sorted = [...this.db].sort((a,b) => a.ts - b.ts).slice(-7);
        const labels = sorted.map(i => i.d.split('-').slice(1).join('/'));
        let curr = this.db.reduce((acc, i) => acc + i.a, 0) - sorted.reduce((acc, i) => acc + i.a, 0);
        const balances = sorted.map(i => { curr += i.a; return curr; });
        if(this.trendChart) this.trendChart.destroy();
        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: { labels: labels, datasets: [{ label: 'Bs', data: balances, borderColor: '#facd00', backgroundColor: 'rgba(250, 205, 0, 0.1)', fill: true, tension: 0.4 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } }, plugins: { legend: { display: false } } }
        });
    }
};

window.onload = () => app.init();
