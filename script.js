/**
 * OFICINA PRO V7 - FINAL
 * Soporte para ciclos de agua editables, reportes visuales y persistencia local explicada.
 */

const app = {
    db: JSON.parse(localStorage.getItem('oficina_v7_db')) || [],
    config: JSON.parse(localStorage.getItem('oficina_v7_cfg')) || {
        officialName: 'Nilsa',
        adminName: 'Maycol Avila',
        internetTarget: 179,
        turn1: 'OFICIAL / MAYCOL',
        turn2: 'SAMUEL / XIMENA'
    },
    chart: null,

    init() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        
        // Cargar config en inputs
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
        if(viewId === 'view-caja') setTimeout(() => this.renderChart(), 100);
        window.scrollTo(0,0);
    },

    action(nombre, monto, tipo, esOficial = false) {
        const finalName = esOficial ? this.config.officialName : nombre;
        this.saveEntry({
            id: 'TX-' + Date.now(),
            n: finalName, a: parseFloat(monto), t: tipo,
            d: new Date().toISOString().split('T')[0], ts: Date.now()
        });
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
    },

    saveEntry(entry) {
        this.db.push(entry);
        localStorage.setItem('oficina_v7_db', JSON.stringify(this.db));
        this.sync();
    },

    sync() {
        const total = this.db.reduce((acc, i) => acc + i.a, 0);
        const intB = this.db.filter(i => i.t === 'Internet').reduce((acc, i) => acc + i.a, 0);
        const aguB = this.db.filter(i => i.t === 'Agua').reduce((acc, i) => acc + i.a, 0);
        const otroB = total - intB - aguB;

        document.getElementById('total-balance').innerText = total.toFixed(2) + " Bs";
        document.getElementById('fund-agua').innerText = aguB.toFixed(2);
        document.getElementById('fund-otro').innerText = otroB.toFixed(2);
        
        document.querySelectorAll('.official-name-display').forEach(el => el.innerText = this.config.officialName);
        document.getElementById('h-user').innerText = this.config.adminName;
        document.getElementById('h-avatar').innerText = this.config.adminName.substring(0,2).toUpperCase();

        // Monitor Internet
        const target = 179;
        const porc = Math.min((intB / target) * 100, 100);
        document.getElementById('int-bs').innerText = intB.toFixed(2) + " Bs";
        document.getElementById('int-perc').innerText = Math.floor(porc) + "%";
        document.getElementById('int-bar').style.width = porc + "%";

        const statusIcon = document.getElementById('int-icon');
        const statusText = document.getElementById('int-text');
        if (intB >= target) {
            statusIcon.innerText = "✅"; statusText.innerText = "¡FONDO LISTO!";
            statusText.style.color = "var(--secondary)";
            document.getElementById('int-bar').style.background = "var(--grad-green)";
        } else {
            statusIcon.innerText = "⏳"; statusText.innerText = `Faltan ${(target - intB).toFixed(2)} Bs`;
            statusText.style.color = "var(--text-dim)";
            document.getElementById('int-bar').style.background = "var(--grad-blue)";
        }

        // --- LÓGICA DE TURNOS EDITABLES ---
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
        this.db.forEach(item => {
            if(item.a > 0) {
                summary[item.n] = (summary[item.n] || 0) + item.a;
            }
        });

        let html = `<div style="margin-top:20px;"><h4 style="font-size:11px; color:var(--text-dim); margin-bottom:10px;">📊 RESUMEN DE APORTES POR PERSONA</h4>`;
        for (let name in summary) {
            html += `<div style="display:flex; justify-content:space-between; padding:10px; background:rgba(255,255,255,0.03); border-radius:12px; margin-bottom:5px; font-size:13px;">
                <span style="font-weight:700;">${name}</span>
                <span style="color:var(--secondary); font-weight:800;">${summary[name].toFixed(2)} Bs</span>
            </div>`;
        }
        html += `</div>`;
        container.innerHTML = html;
    },

    renderLogs() {
        const container = document.getElementById('log-container');
        if(!container) return;
        container.innerHTML = '<h3 style="font-size: 11px; color: var(--text-dim); margin-bottom: 15px;">ÚLTIMOS MOVIMIENTOS</h3>';
        const sorted = [...this.db].sort((a,b) => b.ts - a.ts).slice(0, 15);
        sorted.forEach(item => {
            const isPos = item.a >= 0;
            const div = document.createElement('div');
            div.className = 'btn-action';
            div.style.marginBottom = "10px"; div.style.display = "flex"; div.style.justifyContent = "space-between";
            div.style.alignItems = "center"; div.style.padding = "15px 20px";
            div.onclick = () => this.openEdit(item.id);
            div.innerHTML = `<div style="display: flex; align-items: center; gap: 15px;"><div style="font-size: 20px;">${this.getIcon(item.t)}</div><div><div style="font-size: 14px; font-weight: 800;">${item.n}</div><div style="font-size: 10px; color: var(--text-dim);">${item.d}</div></div></div><div style="font-family: 'JetBrains Mono'; font-weight: 800; color: ${isPos ? 'var(--secondary)' : 'var(--danger)'}">${isPos ? '+' : ''}${item.a.toFixed(2)}</div>`;
            container.appendChild(div);
        });
    },

    getIcon(t) { return t === 'Internet' ? '🌐' : (t === 'Agua' ? '💧' : (t === 'Oficial' ? '⚖️' : '📝')); },

    settleInternet() {
        const current = this.db.filter(i => i.t === 'Internet').reduce((acc, i) => acc + i.a, 0);
        if(current < 179) return alert("❌ Saldo insuficiente");
        if(confirm("¿Pagar internet de 179 Bs?")) {
            this.saveEntry({ id: 'OUT-' + Date.now(), n: 'PAGO MES INTERNET', a: -179, t: 'Internet', d: new Date().toISOString().split('T')[0], ts: Date.now() });
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
        localStorage.setItem('oficina_v7_db', JSON.stringify(this.db));
        this.sync(); this.closeEdit();
    },

    delete() {
        const id = document.getElementById('edit-id').value;
        if(confirm("¿Eliminar registro?")) {
            this.db = this.db.filter(i => i.id !== id);
            localStorage.setItem('oficina_v7_db', JSON.stringify(this.db));
            this.sync(); this.closeEdit();
        }
    },

    showFullReport() {
        const total = this.db.reduce((acc, i) => acc + i.a, 0);
        const intB = this.db.filter(i => i.t === 'Internet').reduce((acc, i) => acc + i.a, 0);
        const aguB = this.db.filter(i => i.t === 'Agua').reduce((acc, i) => acc + i.a, 0);
        let msg = `🌌 *REPORTE OFICINA V7*\n💰 TOTAL: ${total.toFixed(2)} Bs\n🌐 INTERNET: ${intB.toFixed(2)} / 179\n💧 AGUA: ${aguB.toFixed(2)}\n---------------------------\n`;
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
        localStorage.setItem('oficina_v7_cfg', JSON.stringify(this.config));
        this.sync(); alert("✅ Configuración actualizada");
    },

    wipe() { if(confirm("¿REINICIAR TODO?")) { this.db = []; localStorage.removeItem('oficina_v7_db'); this.sync(); } },
    resetWater() { if(confirm("¿Reiniciar turnos agua?")) { this.db = this.db.filter(i => i.t !== 'Agua'); localStorage.setItem('oficina_v7_db', JSON.stringify(this.db)); this.sync(); } },
    backup() {
        const blob = new Blob([JSON.stringify(this.db)], {type: 'application/json'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `backup_v7_${new Date().toISOString().split('T')[0]}.json`; a.click();
    }
};

window.onload = () => app.init();
