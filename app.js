/* COUNTER APP
  - Copyright (C) 2026 AlphexOne
  - SPDX-License-Identifier: GPL-3.0-or-later */

  

// ========================= ELEMENTE =========================
const CounterInput = document.getElementById("CounterInput");
const addCounterBtn = document.getElementById("addCounterBtn");
const CounterContainer = document.getElementById("CounterContainer");
const mainView = document.getElementById("mainView");
const CounterView = document.getElementById("CounterView");
const settingsView = document.getElementById("settingsView");

const headerTitle = document.getElementById("headerTitle");
const CounterValue = document.getElementById("CounterValue");
const lastUpdated = document.getElementById("lastUpdated");

const plusBtn = document.getElementById("plusBtn");
const minusBtn = document.getElementById("minusBtn");
const resetBtn = document.getElementById("resetBtn");

// NAV BUTTONS
const homeBtn = document.getElementById("homeBtn");
const counterBtn = document.getElementById("counterBtn");
const settingsBtn = document.getElementById("settingsBtn");

// SETTINGS ELEMENTE
const settingsCounterSelect = document.getElementById("settingsCounterSelect");
const enableResetCheckbox = document.getElementById("enableResetCheckbox");

// ========================= STATE =========================
let Counter = JSON.parse(localStorage.getItem("trackingCounters")) || [];
let currentCounterId = localStorage.getItem("currentCounterId") || null;

// Uhrzeit in Statusleiste simulieren
setInterval(() => {
    const now = new Date();
    document.getElementById("uhr").innerText = now.toLocaleTimeString("de-DE", {hour: '2-digit', minute:'2-digit'});
}, 1000);

// ========================= HELPERS =========================
function saveCounter() {
    localStorage.setItem("trackingCounters", JSON.stringify(Counter));
    if (currentCounterId) {
        localStorage.setItem("currentCounterId", currentCounterId);
    } else {
        localStorage.removeItem("currentCounterId");
    }
}

function hideAllViews() {
    mainView.classList.add("hidden");
    CounterView.classList.add("hidden");
    settingsView.classList.add("hidden");
    
    homeBtn.classList.remove("active");
    counterBtn.classList.remove("active");
    settingsBtn.classList.remove("active");
}

function formatDate(dateString) {
    if (!dateString) return "Noch nicht aktualisiert";
    const d = new Date(dateString);
    return d.toLocaleString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ========================= VIEW SWITCH =========================
function showMainView() {
    hideAllViews();
    headerTitle.innerText = "Counter-App";
    addCounterBtn.classList.remove("hidden");
    mainView.classList.remove("hidden");
    homeBtn.classList.add("active");
    renderCounter();
}

function showCounterView() {
    hideAllViews();

    if (currentCounterId) {
        const item = Counter.find(c => c.id === currentCounterId);
        headerTitle.innerText = item ? item.name : "Zähler";
    } else if (Counter.length > 0) {
        headerTitle.innerText = Counter[0].name;
    } else {
        headerTitle.innerText = "Zähler";
    }

    addCounterBtn.classList.add("hidden");
    CounterView.classList.remove("hidden");
    counterBtn.classList.add("active");

    if (currentCounterId) {
        openCounter(currentCounterId);
    } else if (Counter.length > 0) {
        openCounter(Counter[0].id);
    } else {
        CounterValue.innerText = "0";
        lastUpdated.innerText = "-";
    }
}

function showSettingsView() {
    hideAllViews();
    headerTitle.innerText = "Einstellungen";
    addCounterBtn.classList.add("hidden");
    settingsView.classList.remove("hidden");
    settingsBtn.classList.add("active");
    renderSettings();
}

// ========================= COUNTER LOGIK =========================
function renderCounter() {
    CounterContainer.innerHTML = "";
    
    if (Counter.length === 0) {
        CounterContainer.innerHTML = `<p style="color: var(--text-muted); text-align: center; margin-top: 20px;">Keine Counter vorhanden. Erstelle einen oben über das Plus!</p>`;
        return;
    }

    Counter.forEach(c => {
        const tile = document.createElement("div");
        tile.className = "counter-tile";
        tile.addEventListener("click", (e) => {
            if (e.target.closest('.menu-trigger') || e.target.closest('.context-menu')) return;
            openCounter(c.id);
            showCounterView();
        });

        tile.innerHTML = `
            <div class="tile-info">
                <h4>${c.name}</h4>
                <p>Update: ${formatDate(c.updatedAt)}</p>
            </div>
            <div class="tile-right">
                <span class="tile-value">${c.value}</span>
                <button class="menu-trigger"><i class="fa-solid fa-ellipsis-vertical"></i></button>
            </div>
            <div class="context-menu hidden" id="menu-${c.id}">
                <button class="rename-option">Umbenennen</button>
                <button class="delete-option">Löschen</button>
            </div>
        `;

        CounterContainer.appendChild(tile);

        // Kontextmenü-Trigger
        const trigger = tile.querySelector(".menu-trigger");
        const menu = tile.querySelector(".context-menu");
        
        trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            
            // Schließe andere offene Menüs
            document.querySelectorAll(".context-menu").forEach(m => {
                if (m !== menu) m.classList.add("hidden");
            });
            
            const isHidden = menu.classList.contains("hidden");
            
            if (isHidden) {
                menu.style.visibility = "hidden";
                menu.classList.remove("hidden");
                const menuHeight = menu.offsetHeight;
                menu.classList.add("hidden");
                menu.style.visibility = "";

                const contentContainer = document.querySelector(".content");
                const containerHeight = contentContainer.clientHeight;
                const tileTop = tile.offsetTop - contentContainer.scrollTop;
                const tileHeight = tile.offsetHeight;
                
                const spaceBelow = containerHeight - (tileTop + tileHeight);
                const spaceAbove = tileTop;

                menu.style.top = "auto";
                menu.style.bottom = "auto";
                menu.style.transform = "none";

                if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
                    menu.style.bottom = "85%";
                } else if (spaceBelow < menuHeight && spaceAbove < menuHeight) {
                    menu.style.top = "50%";
                    menu.style.transform = "translateY(-50%)";
                } else {
                    menu.style.top = "85%";
                }

                menu.classList.remove("hidden");
            } else {
                menu.classList.add("hidden");
            }
        });

        // Umbenennen Aktion
        tile.querySelector(".rename-option").addEventListener("click", () => {
            const newName = prompt("Neuen Namen eingeben:", c.name);
            if (newName && newName.trim() !== "") {
                c.name = newName.trim();
                saveCounter();
                renderCounter();
            }
        });

        // Löschen Aktion
        tile.querySelector(".delete-option").addEventListener("click", () => {
            if (confirm(`Möchtest du "${c.name}" wirklich löschen?`)) {
                deleteCounter(c.id);
            }
        });
    });
}

function openCounter(id) {
    currentCounterId = id;
    const item = Counter.find(c => c.id === id);
    if (!item) return;

    checkDailyReset(item);

    CounterValue.innerText = item.value;
    lastUpdated.innerText = formatDate(item.updatedAt);
    saveCounter();
}

// Berechnung
function updateCounter(type) {
    if (!currentCounterId) return;
    const item = Counter.find(c => c.id === currentCounterId);
    if (!item) return;

    if (type === "plus") {
        item.value++;
    } else if (type === "minus") {
      // Verhindert Negativzahlen (Wert bleibt bei minimal 0 stehen)
      if (item.value > 0) {
        item.value--;
      } else {
        return; // Aktion abbrechen, da 0 erreicht ist
      }
  } else if (type === "reset") {
    item.value = 0;
  }

    item.updatedAt = new Date().toISOString();
    CounterValue.innerText = item.value;
    lastUpdated.innerText = formatDate(item.updatedAt);
    
    saveCounter();
}

// ========================= DAILY RESET LOGIK =========================
function checkDailyReset(counterItem) {
    if (counterItem.resetEnabled && counterItem.updatedAt) {
        const lastDate = new Date(counterItem.updatedAt).setHours(0,0,0,0);
        const today = new Date().setHours(0,0,0,0);

        if (today > lastDate) {
            counterItem.value = 0;
            counterItem.updatedAt = new Date().toISOString();
        }
    }
}

// ========================= CREATE / DELETE =========================
addCounterBtn.addEventListener("click", () => {
    const name = CounterInput.value.trim();
    if (!name) return alert("Name fehlt!");

    const newCounter = {
        id: "id_" + Date.now(),
        name: name,
        value: 0,
        updatedAt: null,
        resetEnabled: true,  
        resetInterval: "daily"
    };

    Counter.push(newCounter);
    currentCounterId = newCounter.id; 
    saveCounter();
    
    CounterInput.value = ""; 
    showCounterView(); 
});

function deleteCounter(id) {
    Counter = Counter.filter(c => c.id !== id);
    if (currentCounterId === id) {
        currentCounterId = Counter.length > 0 ? Counter[0].id : null;
    }
    saveCounter();
    renderCounter();
}

// ========================= SETTINGS LOGIK =========================
function renderSettings() {
    settingsCounterSelect.innerHTML = "";

    if (Counter.length === 0) {
        settingsCounterSelect.innerHTML = `<option value="">-- Kein Counter vorhanden --</option>`;
        return;
    }

    Counter.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.innerText = c.name;
        if (c.id === currentCounterId) opt.selected = true;
        settingsCounterSelect.appendChild(opt);
    });

    loadCounterSettings();
}

function loadCounterSettings() {
    const selectedId = settingsCounterSelect.value;
    const item = Counter.find(c => c.id === selectedId);
    if (!item) return;

    enableResetCheckbox.checked = item.resetEnabled;
}

settingsCounterSelect.addEventListener("change", loadCounterSettings);

enableResetCheckbox.addEventListener("change", () => {
    const selectedId = settingsCounterSelect.value;
    const item = Counter.find(c => c.id === selectedId);
    if (!item) return;

    item.resetEnabled = enableResetCheckbox.checked;
    saveCounter();
});

// ========================= EVENTS =========================
homeBtn.addEventListener("click", showMainView);
counterBtn.addEventListener("click", showCounterView);
settingsBtn.addEventListener("click", showSettingsView);

plusBtn.addEventListener("click", () => updateCounter("plus"));
minusBtn.addEventListener("click", () => updateCounter("minus"));
resetBtn.addEventListener("click", () => updateCounter("reset"));

// Klick außerhalb schließt Kontextmenüs
document.addEventListener("click", () => {
    document.querySelectorAll(".context-menu").forEach(m => m.classList.add("hidden"));
});

// ========================= START =========================
window.addEventListener("load", () => {
    if (currentCounterId && Counter.some(c => c.id === currentCounterId)) {
        showCounterView();
    } else {
        showMainView();
    }
});