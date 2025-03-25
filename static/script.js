function openAddForm() {
    document.getElementById("add-form").style.display = "block";
}

function closeAddForm() {
    document.getElementById("add-form").style.display = "none";
}

// Gericht zum Wochenplan hinzufügen
function addToPlan() {
    const gericht_name = document.getElementById("gericht_name").value;
    const datum = document.getElementById("datum").value;

    if (!datum || !gericht_name) {
        alert("Bitte ein Gericht und Datum auswählen!");
        return;
    }

    const eintrag = {
        datum: datum,
        gericht: gericht_name
    };

    fetch("/add_to_plan", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(eintrag)
    })
    .then(response => response.json())
    .then(data => {
        alert("Gericht zum Wochenplan hinzugefügt!");
        window.location.href = "/wochenplan"; // Nach dem Hinzufügen zurück zur Wochenplan-Seite
    })
    .catch(error => console.error("Fehler:", error));
}

// Zutat zur Einkaufsliste hinzufügen
function addToEinkaufsliste() {
    const zutat = document.getElementById("zutat").value;
    const menge = document.getElementById("menge").value;

    const data = {
        zutat: zutat,
        menge: menge
    };

    fetch("/add_to_einkaufsliste", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        window.location.href = "/einkaufsliste";  // Nach dem Hinzufügen zur Einkaufsliste zurück zur Seite
    })
    .catch(error => console.error("Fehler:", error));
}
let nebenzutaten = [];

function addNebenzutat() {
    const inputField = document.getElementById("nebenzutat");
    const zutat = inputField.value.trim();
    
    if (zutat === "") {
        alert("Bitte eine Zutat eingeben.");
        return;
    }
    if (nebenzutaten.length >= 15) {
        alert("Maximal 15 Nebenzutaten erlaubt.");
        return;
    }
    
    nebenzutaten.push(zutat);
    inputField.value = "";
    updateNebenzutatenListe();
}

function updateNebenzutatenListe() {
    const listElement = document.getElementById("nebenzutaten-liste");
    listElement.innerHTML = "";
    
    nebenzutaten.forEach((zutat, index) => {
        const li = document.createElement("li");
        li.textContent = zutat;
        
        const removeButton = document.createElement("button");
        removeButton.textContent = "❌";
        removeButton.classList.add("remove-button");
        removeButton.onclick = function () {
            nebenzutaten.splice(index, 1);
            updateNebenzutatenListe();
        };
        
        li.appendChild(removeButton);
        listElement.appendChild(li);
    });
}

function addGericht() {
    const name = document.getElementById("name").value;
    const hauptzutat_1 = document.getElementById("hauptzutat_1").value;
    const hauptzutat_2 = document.getElementById("hauptzutat_2").value;
    const bild_url = document.getElementById("bild_url").value;
    
    const gerichtData = {
        name: name,
        hauptzutaten: [hauptzutat_1, hauptzutat_2],
        nebenzutaten: nebenzutaten,
        bild_url: bild_url
    };

    fetch("/add_gericht", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(gerichtData)
    })
    .then(response => response.json())
    .then(data => {
        alert("Neues Gericht hinzugefügt!");
        window.location.reload();
    })
    .catch(error => console.error("Fehler:", error));
}

// Bearbeiten-Button in Detailansicht
function toggleEdit() {
    console.log("Bearbeiten-Button wurde geklickt!");  // DEBUGGING
    let form = document.getElementById("edit-form");
    form.classList.toggle("hidden");
    console.log("Formular sichtbar:", !form.classList.contains("hidden"));  // DEBUGGING
}

function saveChanges(gerichtId) {
    let name = document.getElementById("edit-name").value.trim();
    let bild = document.getElementById("edit-bild").value.trim();
    let hauptzutaten = document.getElementById("edit-hauptzutaten").value.split(",").map(z => z.trim());
    let nebenzutaten = document.getElementById("edit-nebenzutaten").value.split(",").map(z => z.trim());

    console.log("Speichern der Änderungen: ", name, bild, hauptzutaten, nebenzutaten);

    fetch(`/edit_gericht/${gerichtId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, bild_url: bild, hauptzutaten, nebenzutaten })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);  // Bestätigung der Änderung
        window.location.href = "/";  // Weiterleitung zur Startseite
    })
    .catch(error => {
        console.error("Fehler beim Speichern:", error);
    });
}

function renderKalender(wochenplan) {
    const kalender = document.getElementById("kalender-wochen");
    kalender.innerHTML = "";  // Kalender zurücksetzen
    let today = new Date();
    const wochenTage = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    let startDay = today.getDay();
    if (startDay === 0) startDay = 7;  // Sonntag behandeln
    let offset = startDay - 1;

    // Wochentage einfügen
    wochenTage.forEach(tag => {
        let th = document.createElement("div");
        th.className = "kalender-header";
        th.textContent = tag;
        kalender.appendChild(th);
    });

    // Erstelle die Tage im Kalender
    for (let i = -offset; i < 14 - offset; i++) {
        let date = new Date();
        date.setDate(today.getDate() + i);
        let dateStr = date.toISOString().split('T')[0]; // z. B. "2025-03-25"
        console.log("📅 Aktuelles Datum:", dateStr);
        console.log("🔁 Prüfe auf Übereinstimmung mit:");

        wochenplan.forEach(item => {
            console.log("  - aus Datenbank:", item.datum, "| Equal?", item.datum === dateStr);
        });
        
        // Suche passenden Eintrag
        let eintrag = wochenplan.find(item => item.datum === dateStr);
        
        // 🧪 Prüfen ob etwas gefunden wurde
        console.log("🔎 Gefundener Eintrag für " + dateStr + ":", eintrag);


        let tag = document.createElement("div");
        tag.className = "kalender-tag";
        tag.textContent = date.getDate() + "." + (date.getMonth() + 1).toString().padStart(2, '0');

        // Wenn ein Gericht für diesen Tag vorhanden ist, grünen Punkt hinzufügen
        if (eintrag) {
            let punkt = document.createElement("span");
            punkt.className = "gruen-punkt";  // Grüner Punkt anzeigen
            tag.appendChild(punkt);

            // Beim Klicken auf den Tag das Gericht anzeigen
            tag.onclick = function () {
                alert("Für diesen Tag ist geplant: " + eintrag.gericht);
            };
            
        } else {
            // Falls das Gericht nicht vorhanden ist, die Möglichkeit zum Hinzufügen bieten
            tag.onclick = function() {
                if (confirm("Möchtest du {{ gericht.name }} für den " + dateStr + " hinzufügen?")) {
                    addToPlan(dateStr);
                }
            };
        }
        
        kalender.appendChild(tag);
    }
}
// Kalender initial befüllen, sobald DOM geladen ist
document.addEventListener("DOMContentLoaded", () => {
    const kalenderContainer = document.getElementById("kalender-wochen");
    if (kalenderContainer) {
        fetch("/wochenplan_api")
            .then(response => response.json())
            .then(data => renderKalender(data))
            .catch(error => console.error("Fehler beim Laden des Wochenplans:", error));
    }
});


