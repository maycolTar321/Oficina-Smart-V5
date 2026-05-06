/**
 * OFICINA SMART V5 - MOBILE EDITION
 * Lógica optimizada para App de Celular
 */

const app = {
    // --- ESTADO ---
    db: JSON.parse(localStorage.getItem('oficina_v5_db')) || [],
    config: JSON.parse(localStorage.getItem('oficina_v5_cfg')) || {
        officialName: 'Nilsa',
        adminName: 'Maycol Avila',
        internetTarget: 179
    },
    chart: null,

    // --- INICIO ---
    init() {
        // Cargar config inicial
        document.getElementById('cfg-official').value = this.config.officialName;
        document.getElementById('cfg-admin').value = this.config.adminName;
        document.getElementById('man-date').valueAsDate = new Date();
        
        // Listener para 'Otro'
        document.getElementById('man-name').addEventListener('change', (e) => {
            document.getElementById('man-other').style.display = e.target.value === 'Otro' ? 'block' : 'none';
        });

        this.sync();
        console.log("OFICINA SMART V5 LISTO");
    },

    // --- NAVEGACIÓN ---
    nav(viewId, btn) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        document.getElementById(viewId).classList.add('active');
        btn.classList.add('active');

        if(viewId === 'view-caja') setTimeout(() => this.renderChart(), 100);
        window.scrollTo(0,0);
    },

    // --- LÓGICA DE PAGOS ---
    action(nombre, monto, tipo, esOficial = false) {
        const finalName = esOficial ? this.config.officialName : nombre;
        this.saveEntry({
            id: 'TX-' + Date.now(),
            n: finalName, a: parseFloat(monto), t: tipo,
            d: new Date().toISOString().split('T')[0], ts: Date.now()
        });
        alert(`✅ Registrado: ${finalName}`);
    },

    addManual() {
        const selName = document.getElementById('man-name').value;
        const otherName = document.getElementById('man-other').value;
        const monto = parseFloat(document.getElementById('man-amount').value);
        const cat = document.getElementById('man-cat').value;
        const date = document.getElementById('man-date').value;

        if(!monto || !date) return alert("⚠️ Datos incompletos");

        let finalName = selName;
        if(selName === 'Oficial') finalName = this.config.officialName;
        if(selName === 'Otro') finalName = otherName || 'Varios';

        this.saveEntry({
            id: 'MAN-' + Date.now(),
            n: finalName, a: monto, t: cat, d: date, ts: new Date(date).getTime()
        });

        document.getElementById('man-amount').value = '';
        document.getElementById('man-other').value = '';
        alert("✅ Registro guardado");
    },

    saveEntry(entry) {
        this.db.push(entry);
        localStorage.setItem('oficina_v5_db', JSON.stringify(this.db));
        this.sync();
    },

    // --- SINCRONIZACIÓN UI ---
    sync() {
        const total = this.db.reduce((acc, i) => acc + i.a, 0);
        const internetBalance = this.db.filter(i => i.t === 'Internet').reduce((acc, i) => acc + i.a, 0);
        const aguaBalance = this.db.filter(i => i.t === 'Agua').reduce((acc, i) => acc + i.a, 0);
        const otroBalance = total - internetBalance - aguaBalance;

        // Actualizar UI General
        document.getElementById('total-balance').innerText = total.toFixed(2) + " Bs";
        document.getElementById('fund-agua').innerText = aguaBalance.toFixed(2);
        document.getElementById('fund-otro').innerText = otroBalance.toFixed(2);
        
        // Perfil
        document.querySelectorAll('.official-name-display').forEach(el => el.innerText = this.config.officialName);
        document.getElementById('header-user').innerText = this.config.adminName;
        document.getElementById('header-avatar').innerText = this.config.adminName.substring(0,2).toUpperCase();

        // --- MONITOR INTERNET (WIDGET) ---
        const target = this.config.internetTarget;
        const porc = Math.min((internetBalance / target) * 100, 100);
        
        document.getElementById('internet-bs').innerText = internetBalance.toFixed(2) + " Bs";
        document.getElementById('internet-porc').innerText = Math.floor(porc) + "%";
        document.getElementById('internet-bar').style.width = porc + "%";

        const statusText = document.getElementById('internet-status');
        if (internetBalance >= target) {
            statusText.innerText = "✅ ¡FONDO COMPLETADO!";
            statusText.style.color = "var(--success)";
        } else {
            const faltante = target - internetBalance;
            statusText.innerText = `⏳ Faltan ${faltante.toFixed(2)} Bs para el mes`;
            statusText.style.color = "var(--text-muted)";
        }

        // Sugerencia Agua
        const ultAgua = this.db.filter(i => i.t === 'Agua').sort((a,b) => b.ts - a.ts)[0];
        let sugerido = "Oficial / Maycol";
        if(ultAgua && (ultAgua.n.toUpperCase().includes('MAYCOL') || ultAgua.n.toUpperCase().includes('OFICIAL'))) {
            sugerido = "Samuel / Ximena";
        }
        document.getElementById('suggestion-text').innerText = sugerido;

        this.renderLogs();
    },

    renderLogs() {
        const container = document.getElementById('log-container');
        if(!container) return;
        container.innerHTML = '<h3 style="font-size: 13px; color: var(--text-muted); margin-bottom: 15px;">HISTORIAL RECIENTE</h3>';
        
        const sorted = [...this.db].sort((a,b) => b.ts - a.ts).slice(0, 10);
        sorted.forEach(item => {
            const isPos = item.a >= 0;
            const div = document.createElement('div');
            div.style.background = "white";
            div.style.borderRadius = "20px";
            div.style.padding = "15px";
            div.style.marginBottom = "10px";
            div.style.display = "flex";
            div.style.justifyContent = "space-between";
            div.style.alignItems = "center";
            div.style.boxShadow = "var(--shadow-soft)";
            div.onclick = () => this.openEdit(item.id);

            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 12px; background: var(--primary-light); display: flex; align-items: center; justify-content: center; font-size: 18px;">
                        ${this.getIcon(item.t)}
                    </div>
                    <div>
                        <div style="font-size: 13px; font-weight: 800;">${item.n}</div>
                        <div style="font-size: 10px; color: var(--text-muted);">${item.d}</div>
                    </div>
                </div>
                <div style="font-weight: 800; color: ${isPos ? 'var(--success)' : 'var(--danger)'}">
                    ${isPos ? '+' : ''}${item.a.toFixed(2)}
                </div>
            `;
            container.appendChild(div);
        });
    },

    getIcon(t) {
        if(t === 'Internet') return '🌐';
        if(t === 'Agua') return '💧';
        return '📝';
    },

    // --- ACCIONES DE CAJA ---
    settleInternet() {
        const current = this.db.filter(i => i.t === 'Internet').reduce((acc, i) => acc + i.a, 0);
        if(current < 179) return alert("❌ Saldo insuficiente");

        if(confirm("¿Pagar internet de este mes (179 Bs)?")) {
            this.saveEntry({
                id: 'OUT-' + Date.now(),
                n: 'PAGO MES INTERNET', a: -179, t: 'Internet',
                d: new Date().toISOString().split('T')[0], ts: Date.now()
            });
            alert("🌐 Pago registrado");
        }
    },

    // --- EDICIÓN ---
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

        localStorage.setItem('oficina_v5_db', JSON.stringify(this.db));
        this.sync();
        this.closeEdit();
        alert("✅ Actualizado");
    },

    delete() {
        const id = document.getElementById('edit-id').value;
        if(confirm("¿Eliminar registro?")) {
            this.db = this.db.filter(i => i.id !== id);
            localStorage.setItem('oficina_v5_db', JSON.stringify(this.db));
            this.sync();
            this.closeEdit();
            alert("🗑️ Eliminado");
        }
    },

    // --- REPORTES ---
    showFullReport() {
        const total = this.db.reduce((acc, i) => acc + i.a, 0);
        const intB = this.db.filter(i => i.t === 'Internet').reduce((acc, i) => acc + i.a, 0);
        const aguB = this.db.filter(i => i.t === 'Agua').reduce((acc, i) => acc + i.a, 0);
        
        let msg = `🏠 *REPORTE SMART OFICINA*\n`;
        msg += `💰 SALDO TOTAL: ${total.toFixed(2)} Bs\n`;
        msg += `🌐 INTERNET: ${intB.toFixed(2)} / 179 Bs\n`;
        msg += `💧 AGUA: ${aguB.toFixed(2)} Bs\n`;
        msg += `---------------------------\n`;
        msg += `👤 Administrador: ${this.config.adminName}`;
        
        document.getElementById('report-area').innerText = msg;
        document.getElementById('modal-report').style.display = 'flex';
    },

    closeReport() { document.getElementById('modal-report').style.display = 'none'; },

    shareWA() {
        const text = document.getElementById('report-area').innerText;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    },

    // --- CONFIG ---
    saveCfg() {
        this.config.officialName = document.getElementById('cfg-official').value || 'Oficial';
        this.config.adminName = document.getElementById('cfg-admin').value || 'Admin';
        localStorage.setItem('oficina_v5_cfg', JSON.stringify(this.config));
        this.sync();
        alert("✅ Configuración guardada");
    },

    wipe() {
        if(confirm("¿REINICIAR SISTEMA?")) {
            this.db = [];
            localStorage.removeItem('oficina_v5_db');
            this.sync();
            alert("🧹 Limpio");
        }
    },

    backup() {
        const blob = new Blob([JSON.stringify(this.db)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `oficina_v5_backup.json`;
        a.click();
    },

    // --- CHART ---
    renderChart() {
        const ctx = document.getElementById('mainChart').getContext('2d');
        const intB = this.db.filter(i => i.t === 'Internet').reduce((acc, i) => acc + i.a, 0);
        const aguB = this.db.filter(i => i.t === 'Agua').reduce((acc, i) => acc + i.a, 0);
        const total = this.db.reduce((acc, i) => acc + i.a, 0);
        const otros = total - intB - aguB;

        if(this.chart) this.chart.destroy();

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Internet', 'Agua', 'Otros'],
                datasets: [{
                    data: [intB, aguB, otros],
                    backgroundColor: ['#5c67f2', '#55efc4', '#eef0ff'],
                    borderWidth: 0,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#636e72', font: { weight: '700' } } }
                },
                cutout: '80%'
            }
        });
    }
};

window.onload = () => app.init();
