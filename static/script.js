function openAddForm() {
    const form = document.getElementById("add-form");
    form.style.display = "block";
    form.scrollIntoView({ behavior: "smooth" });
}

function clearForm() {
    document.getElementById("name").value = "";
    document.getElementById("hauptzutat_1").value = "";
    document.getElementById("hauptzutat_2").value = "";
    document.getElementById("bild_url").value = "";
    document.getElementById("nebenzutat").value = "";
    nebenzutaten = [];
    updateNebenzutatenListe();

    // ✅ Kein form.style.display = "none"
    // Optional: Fokus setzen
    document.getElementById("name").focus();

    // Scroll zurück nach oben, wenn du das willst:
    window.scrollTo({ top: 0, behavior: "smooth" });
}


// Dynamisches Layout
document.addEventListener("DOMContentLoaded", function () {
    const header = document.querySelector("h1");
    const nav = document.querySelector("nav");
    const main = document.querySelector("main");

    if (header && nav && main) {
        const headerHeight = header.offsetHeight;
        const navHeight = nav.offsetHeight;
        const totalOffset = headerHeight + navHeight + 20;
        main.style.marginTop = `${totalOffset}px`;
    }
});

function addToPlan() {
    const gericht_name = document.getElementById("gericht_name").value;
    const datum = document.getElementById("datum").value;

    if (!datum || !gericht_name) {
        alert("Bitte ein Gericht und Datum auswählen!");
        return;
    }

    fetch("/add_to_plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datum, gericht: gericht_name })
    })
    .then(response => response.json())
    .then(() => {
        alert("Gericht zum Wochenplan hinzugefügt!");
        window.location.href = "/wochenplan";
    })
    .catch(error => console.error("Fehler:", error));
}

function addToEinkaufsliste() {
    const zutat = document.getElementById("zutat").value;
    const menge = document.getElementById("menge").value;

    fetch("/add_to_einkaufsliste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zutat, menge })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        window.location.href = "/einkaufsliste";
    })
    .catch(error => console.error("Fehler:", error));
}

let nebenzutaten = [];

function addNebenzutat() {
    const name = document.getElementById("neben-name").value.trim();
    const menge = parseFloat(document.getElementById("neben-menge").value);
    const einheit = document.getElementById("neben-einheit").value;

    if (!name || isNaN(menge)) {
        alert("Bitte Namen und gültige Menge angeben.");
        return;
    }

    const container = document.createElement("div");
    container.className = "neben-zutat";
    container.style.display = "flex";
    container.style.gap = "10px";
    container.style.marginBottom = "5px";

    const inputName = document.createElement("input");
    inputName.type = "text";
    inputName.value = name;
    inputName.className = "z-name";
    inputName.readOnly = true;

    const inputMenge = document.createElement("input");
    inputMenge.type = "number";
    inputMenge.value = menge;
    inputMenge.className = "z-menge";
    inputMenge.readOnly = true;
    inputMenge.style.width = "80px";

    const inputEinheit = document.createElement("input");
    inputEinheit.type = "text";
    inputEinheit.value = einheit;
    inputEinheit.className = "z-einheit";
    inputEinheit.readOnly = true;
    inputEinheit.style.width = "70px";

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.className = "plus-button";
    removeBtn.onclick = function () {
        container.remove();
    };

    container.appendChild(inputName);
    container.appendChild(inputMenge);
    container.appendChild(inputEinheit);
    container.appendChild(removeBtn);

    document.getElementById("nebenzutaten-liste").appendChild(container);

    // Felder zurücksetzen
    document.getElementById("neben-name").value = "";
    document.getElementById("neben-menge").value = "";
}


function updateNebenzutatenListe() {
    const list = document.getElementById("nebenzutaten-liste");
    list.innerHTML = "";

    nebenzutaten.forEach((zutat, i) => {
        const li = document.createElement("li");
        li.textContent = zutat;

        const btn = document.createElement("button");
        btn.textContent = "❌";
        btn.classList.add("remove-button");
        btn.onclick = () => {
            nebenzutaten.splice(i, 1);
            updateNebenzutatenListe();
        };

        li.appendChild(btn);
        list.appendChild(li);
    });
}

function addGericht() {
    const name = document.getElementById("name").value.trim();
    const bildUrl = document.getElementById("bild_url").value.trim();

    // Hauptzutaten erfassen
    const h1 = {
        name: document.getElementById("hauptzutat_1_name").value.trim(),
        menge: parseFloat(document.getElementById("hauptzutat_1_menge").value),
        einheit: document.getElementById("hauptzutat_1_einheit").value
    };
    const h2 = {
        name: document.getElementById("hauptzutat_2_name").value.trim(),
        menge: parseFloat(document.getElementById("hauptzutat_2_menge").value),
        einheit: document.getElementById("hauptzutat_2_einheit").value
    };

    if (!name || !h1.name || isNaN(h1.menge) || !h2.name || isNaN(h2.menge)) {
        alert("Bitte Namen und Mengen für beide Hauptzutaten eingeben.");
        return;
    }

    // Nebenzutaten erfassen
    const nebenzutaten = Array.from(document.querySelectorAll(".neben-zutat")).map(item => ({
        name: item.querySelector(".z-name").value.trim(),
        menge: parseFloat(item.querySelector(".z-menge").value),
        einheit: item.querySelector(".z-einheit").value
    })).filter(z => z.name && !isNaN(z.menge));

    // Datenstruktur für Firebase
    const gerichtData = {
        name: name,
        bild_url: bildUrl,
        hauptzutaten: [h1.name, h2.name],
        haupt_mengen: [h1.menge, h2.menge],
        haupt_einheiten: [h1.einheit, h2.einheit],
        nebenzutaten: nebenzutaten.map(z => z.name),
        neben_mengen: nebenzutaten.map(z => z.menge),
        neben_einheiten: nebenzutaten.map(z => z.einheit)
    };

    // Abschicken
    fetch("/add_gericht", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gerichtData)
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || "Gericht hinzugefügt!");
        location.reload();
    })
    .catch(err => {
        console.error("Fehler:", err);
        alert("Fehler beim Hinzufügen.");
    });
}

function toggleEdit() {
    const form = document.getElementById("edit-form");
    if (form) form.classList.toggle("hidden");
}

function saveChanges(gerichtId) {
    const name = document.getElementById("edit-name").value;
    const bild = document.getElementById("edit-bild").value;

    const hauptzutaten = [0, 1].map(i => document.getElementById(`edit-hauptzutat-name-${i}`).value);
    const haupt_mengen = [0, 1].map(i => parseFloat(document.getElementById(`edit-hauptzutat-menge-${i}`).value));
    const haupt_einheiten = [0, 1].map(i => document.getElementById(`edit-hauptzutat-einheit-${i}`).value);

    const nebenblocks = document.querySelectorAll(".neben-edit-block");
    const nebenzutaten = [], neben_mengen = [], neben_einheiten = [];
    nebenblocks.forEach(block => {
        nebenzutaten.push(block.querySelector(".edit-neben-name").value);
        neben_mengen.push(parseFloat(block.querySelector(".edit-neben-menge").value));
        neben_einheiten.push(block.querySelector(".edit-neben-einheit").value);
    });

    fetch(`/edit_gericht/${gerichtId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name, bild_url: bild,
            hauptzutaten, haupt_mengen, haupt_einheiten,
            nebenzutaten, neben_mengen, neben_einheiten
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || "Gericht aktualisiert.");
        location.reload();
    });
}

function renderKalender(wochenplan) {
    const kalender = document.getElementById("kalender-wochen");
    kalender.innerHTML = "";
    let today = new Date();
    const wochenTage = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    let startDay = today.getDay();
    if (startDay === 0) startDay = 7;
    let offset = startDay - 1;

    wochenTage.forEach(tag => {
        const th = document.createElement("div");
        th.className = "kalender-header";
        th.textContent = tag;
        kalender.appendChild(th);
    });

    for (let i = -offset; i < 14 - offset; i++) {
        let date = new Date();
        date.setDate(today.getDate() + i);
        let dateStr = date.toISOString().split('T')[0];
        let tag = document.createElement("div");
        tag.className = "kalender-tag";
        tag.textContent = `${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;

        let eintrag = wochenplan.find(item => item.datum === dateStr);
        if (eintrag) {
            let punkt = document.createElement("span");
            punkt.className = "gruen-punkt";
            tag.appendChild(punkt);
            tag.onclick = () => alert("Für diesen Tag ist geplant: " + eintrag.gericht);
        } else {
            tag.onclick = () => {
                if (confirm("Möchtest du {{ gericht.name }} für den " + dateStr + " hinzufügen?")) {
                    addToPlan(dateStr);
                }
            };
        }

        kalender.appendChild(tag);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const kalenderContainer = document.getElementById("kalender-wochen");
    if (kalenderContainer) {
        fetch("/wochenplan_api")
            .then(response => response.json())
            .then(data => renderKalender(data))
            .catch(error => console.error("Fehler beim Laden des Wochenplans:", error));
    }
});

function toggleFilter() {
    const container = document.getElementById("filter-container");
    container.style.display = container.style.display === "none" ? "block" : "none";
}

function anwendenFilter() {
    const name = document.getElementById("filter-name").value.toLowerCase();
    const hz = document.getElementById("filter-hauptzutat").value.toLowerCase();
    const sort = document.getElementById("sortierung").value;

    const alleGerichte = Array.from(document.querySelectorAll(".gericht-link"));

    alleGerichte.forEach(link => {
        const nameText = link.querySelector(".gericht-name").textContent.toLowerCase();
        const zutatenText = link.querySelector(".gericht-zutaten").textContent.toLowerCase();

        const matchName = !name || nameText.includes(name);
        const matchHZ = !hz || zutatenText.includes(hz);

        link.style.display = (matchName && matchHZ) ? "" : "none";
    });

    const container = document.getElementById("gerichte-liste");
    const sichtbare = Array.from(container.children).filter(el => el.style.display !== "none");

    sichtbare.sort((a, b) => {
        if (sort === "name") {
            return a.querySelector(".gericht-name").textContent.localeCompare(
                   b.querySelector(".gericht-name").textContent);
        } else if (sort === "datum") {
            return b.dataset.index - a.dataset.index;
        }
    });

    sichtbare.forEach(el => container.appendChild(el));
}

function zuruecksetzenFilter() {
    document.getElementById("filter-name").value = "";
    document.getElementById("filter-hauptzutat").value = "";
    document.getElementById("sortierung").value = "name";

    document.querySelectorAll(".gericht-link").forEach(el => {
        el.style.display = "";
    });
}


