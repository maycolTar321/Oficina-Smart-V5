/**
 * OFICINA PRO V8 - SUPER MARIO ODYSSEY EDITION
 * Diversión, botellones visuales y confirmaciones de Mario.
 */

const app = {
    db: JSON.parse(localStorage.getItem('oficina_v8_db')) || [],
    config: JSON.parse(localStorage.getItem('oficina_v8_cfg')) || {
        officialName: 'Nilsa',
        adminName: 'Maycol Avila',
        internetTarget: 179,
        turn1: 'OFICIAL / MAYCOL',
        turn2: 'SAMUEL / XIMENA'
    },
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
        document.getElementById('date').innerText = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
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
        setTimeout(() => pop.classList.remove('show'), 1500);
    },

    action(nombre, monto, tipo, esOficial = false) {
        const finalName = esOficial ? this.config.officialName : nombre;
        this.saveEntry({
            id: 'TX-' + Date.now(),
            n: finalName, a: parseFloat(monto), t: tipo,
            d: new Date().toISOString().split('T')[0], ts: Date.now()
        });
        this.showConfirm();
    },

    addManual() {
        const selName = document.getElementById('man-name').value;
        const otherName = document.getElementById('man-other').value;
        const monto = parseFloat(document.getElementById('man-amount').value);
        const cat = document.getElementById('man-cat').value;
        const date = document.getElementById('man-date').value;
        if(!monto || !date) return alert("⚠️ Datos incompletos");
        let finalName = selName === 'Oficial' ? this.config.officialName : (selName === 'Otro' ? (otherName || 'Varios') : selName);
        this.saveEntry({
            id: 'MAN-' + Date.now(),
            n: finalName, a: monto, t: cat, d: date, ts: new Date(date).getTime()
        });
        document.getElementById('man-amount').value = '';
        this.showConfirm();
    },

    saveEntry(entry) {
        this.db.push(entry);
        localStorage.setItem('oficina_v8_db', JSON.stringify(this.db));
        this.sync();
    },

    sync() {
        const total = this.db.reduce((acc, i) => acc + i.a, 0);
        const intB = this.db.filter(i => i.t === 'Internet').reduce((acc, i) => acc + i.a, 0);
        const aguEntries = this.db.filter(i => i.t === 'Agua' && i.a > 0).length;
        
        document.getElementById('total-balance').innerText = total.toFixed(2) + " Bs";
        document.getElementById('fund-otro').innerText = (total - intB).toFixed(2);
        
        document.querySelectorAll('.official-name-display').forEach(el => el.innerText = this.config.officialName);
        document.getElementById('h-user').innerText = this.config.adminName;
        document.getElementById('h-avatar').innerText = this.config.adminName.substring(0,2).toUpperCase();

        // Monitor Internet
        const target = 179;
        const porc = Math.min((intB / target) * 100, 100);
        document.getElementById('int-bs').innerText = intB.toFixed(2) + " Bs";
        document.getElementById('int-perc').innerText = Math.floor(porc) + "%";
        document.getElementById('int-bar').style.width = porc + "%";
        const statusText = document.getElementById('int-text');
        statusText.innerText = intB >= target ? "¡MÁXIMA POTENCIA! FONDO LISTO" : `Faltan ${(target-intB).toFixed(2)} monedas`;

        // --- LÓGICA BOTELLONES MARIO ---
        // Asumimos que 2 personas = 2 botellones. 
        // Cada registro de "Agua" de 36 Bs llena 1 botellón.
        const numBotellones = aguEntries % 2; 
        const totalPagosCiclo = aguEntries;
        
        const b1 = document.getElementById('bot-1');
        const b2 = document.getElementById('bot-2');
        const bText = document.getElementById('bottle-text');

        // Reset
        b1.classList.remove('full');
        b2.classList.remove('full');

        if(totalPagosCiclo % 2 === 1) {
            b1.classList.add('full');
            bText.innerText = "¡Falta 1 botellón! 🥤";
        } else if(totalPagosCiclo > 0 && totalPagosCiclo % 2 === 0) {
            b1.classList.add('full');
            b2.classList.add('full');
            bText.innerText = "¡ESTAMOS LLENOS! 🥤🥤";
        } else {
            bText.innerText = "Faltan 2 botellones";
        }

        const ultAgua = this.db.filter(i => i.t === 'Agua').sort((a,b) => b.ts - a.ts)[0];
        let sugerido = this.config.turn1;
        if(ultAgua && (ultAgua.n.toUpperCase().includes(this.config.officialName.toUpperCase()) || ultAgua.n.toUpperCase().includes('MAYCOL'))) {
            sugerido = this.config.turn2;
        }
        document.getElementById('suggestion-text').innerText = sugerido;
        document.getElementById('btn-turn1-label').innerText = this.config.turn1;
        document.getElementById('btn-turn2-label').innerText = this.config.turn2;

        this.renderLogs();
        this.renderVisualReport();
    },

    renderVisualReport() {
        const container = document.getElementById('visual-report-container');
        if(!container) return;
        const summary = {};
        this.db.forEach(item => { if(item.a > 0) summary[item.n] = (summary[item.n] || 0) + item.a; });
        let html = `<div style="margin-top:10px;"><h4 style="font-size:10px; color:var(--text-dim); margin-bottom:10px; text-transform:uppercase;">📊 APORTES DE NIVEL</h4>`;
        for (let name in summary) {
            html += `<div style="display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.03); border-radius:15px; margin-bottom:8px; font-size:13px; border-left: 4px solid var(--mario-yellow);">
                <span style="font-weight:700;">${name}</span>
                <span style="color:var(--mario-yellow); font-weight:800;">${summary[name].toFixed(2)} Bs</span>
            </div>`;
        }
        html += `</div>`;
        container.innerHTML = html;
    },

    renderLogs() {
        const container = document.getElementById('log-container');
        if(!container) return;
        container.innerHTML = '<h3 style="font-size: 10px; color: var(--text-dim); margin-bottom: 15px; text-transform:uppercase;">LIBRO DE AVENTURAS</h3>';
        const sorted = [...this.db].sort((a,b) => b.ts - a.ts).slice(0, 15);
        sorted.forEach(item => {
            const isPos = item.a >= 0;
            const div = document.createElement('div');
            div.className = 'btn-action';
            div.style.marginBottom = "10px"; div.style.display = "flex"; div.style.justifyContent = "space-between";
            div.style.alignItems = "center"; div.style.padding = "15px 20px";
            div.onclick = () => this.openEdit(item.id);
            div.innerHTML = `<div style="display: flex; align-items: center; gap: 15px;"><div style="font-size: 20px;">${this.getIcon(item.t)}</div><div><div style="font-size: 14px; font-weight: 800;">${item.n}</div><div style="font-size: 10px; color: var(--text-dim);">${item.d}</div></div></div><div style="font-family: 'JetBrains Mono'; font-weight: 800; color: ${isPos ? 'var(--mario-green)' : 'var(--mario-red)'}">${isPos ? '+' : ''}${item.a.toFixed(2)}</div>`;
            container.appendChild(div);
        });
    },

    getIcon(t) { return t === 'Internet' ? '🍄' : (t === 'Agua' ? '🥤' : (t === 'Oficial' ? '🌟' : '📝')); },

    settleInternet() {
        const current = this.db.filter(i => i.t === 'Internet').reduce((acc, i) => acc + i.a, 0);
        if(current < 179) return alert("❌ No tienes suficientes monedas");
        if(confirm("¿Pagar el castillo (internet) por 179 Bs?")) {
            this.saveEntry({ id: 'OUT-' + Date.now(), n: 'PAGO CASTILLO INTERNET', a: -179, t: 'Internet', d: new Date().toISOString().split('T')[0], ts: Date.now() });
            this.showConfirm();
        }
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
        const isNeg = this.db[idx].a < 0;
        this.db[idx].n = document.getElementById('edit-n').value;
        this.db[idx].a = (isNeg ? -1 : 1) * parseFloat(document.getElementById('edit-a').value);
        this.db[idx].d = document.getElementById('edit-d').value;
        this.db[idx].ts = new Date(this.db[idx].d).getTime();
        localStorage.setItem('oficina_v8_db', JSON.stringify(this.db));
        this.sync(); this.closeEdit(); this.showConfirm();
    },

    delete() {
        const id = document.getElementById('edit-id').value;
        if(confirm("¿Borrar bloque?")) {
            this.db = this.db.filter(i => i.id !== id);
            localStorage.setItem('oficina_v8_db', JSON.stringify(this.db));
            this.sync(); this.closeEdit(); this.showConfirm();
        }
    },

    showFullReport() {
        const total = this.db.reduce((acc, i) => acc + i.a, 0);
        const intB = this.db.filter(i => i.t === 'Internet').reduce((acc, i) => acc + i.a, 0);
        let msg = `🍄 *SUPER REPORTE OFICINA*\n🪙 MONEDAS: ${total.toFixed(2)}\n🌐 INTERNET: ${intB.toFixed(2)}/179\n---------------------------\n`;
        this.db.slice(-5).forEach(l => msg += `• ${l.n}: ${l.a} Bs\n`);
        document.getElementById('report-area').innerText = msg;
        document.getElementById('modal-report').style.display = 'flex';
    },

    closeReport() { document.getElementById('modal-report').style.display = 'none'; },
    shareWA() { window.open(`https://wa.me/?text=${encodeURIComponent(document.getElementById('report-area').innerText)}`, '_blank'); },

    saveCfg() {
        this.config.officialName = document.getElementById('cfg-official').value || 'Oficial';
        this.config.adminName = document.getElementById('cfg-admin').value || 'Admin';
        this.config.turn1 = document.getElementById('cfg-turn1').value || 'OFICIAL / MAYCOL';
        this.config.turn2 = document.getElementById('cfg-turn2').value || 'SAMUEL / XIMENA';
        localStorage.setItem('oficina_v8_cfg', JSON.stringify(this.config));
        this.sync(); this.showConfirm();
    },

    wipe() { if(confirm("¿GAME OVER? Se borrará todo.")) { this.db = []; localStorage.removeItem('oficina_v8_db'); this.sync(); this.showConfirm(); } },
    resetWater() { if(confirm("¿Reiniciar botellones?")) { this.db = this.db.filter(i => i.t !== 'Agua'); localStorage.setItem('oficina_v8_db', JSON.stringify(this.db)); this.sync(); this.showConfirm(); } },
    backup() {
        const blob = new Blob([JSON.stringify(this.db)], {type: 'application/json'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `mario_oficina_v8.json`; a.click();
    },

    renderChart() {
        const ctx = document.getElementById('mainChart').getContext('2d');
        const intB = this.db.filter(i => i.t === 'Internet').reduce((acc, i) => acc + i.a, 0);
        const total = this.db.reduce((acc, i) => acc + i.a, 0);
        const otros = total - intB;
        if(this.chart) this.chart.destroy();
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Internet', 'Otros'],
                datasets: [{ data: [intB, otros], backgroundColor: ['#007cc3', '#e62423'], borderWidth: 0, hoverOffset: 15 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { weight: '800' } } } }, cutout: '80%' }
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
            data: {
                labels: labels,
                datasets: [{ label: 'Bs', data: balances, borderColor: '#facd00', backgroundColor: 'rgba(250, 205, 0, 0.1)', fill: true, tension: 0.4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } }, plugins: { legend: { display: false } } }
        });
    }
};

window.onload = () => app.init();
