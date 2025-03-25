from flask import Flask, request, jsonify, render_template, redirect, url_for
from firebase_config import database  # Import der Firebase-Verbindung
from datetime import date
from collections import defaultdict

app = Flask(__name__)

# ---------- 📌 HTML SEITEN RENDERN ---------- #

# Startseite (Gerichte anzeigen)
@app.route("/")
def index():
    gerichte_ref = database.child("gerichte").get()
    
    # Debugging, um zu prüfen, ob Firebase-Daten vorhanden sind
    print("DEBUG: Firebase-Antwort für Gerichte:", gerichte_ref)
    
    gerichte = []
    if gerichte_ref and isinstance(gerichte_ref, dict):  
        gerichte = [{**value, "id": key} for key, value in gerichte_ref.items()]

    else:
        print("⚠ WARNUNG: Keine Gerichte gefunden oder ungültiges Format!")
    
    return render_template("index.html", gerichte=gerichte)


# Detailseite eines Gerichts
@app.route("/gericht/<gericht_id>")
def gericht_detail(gericht_id):
    gericht_ref = database.child("gerichte").child(gericht_id).get()
    if not gericht_ref:
        return render_template("404.html"), 404
    gericht = {**gericht_ref, "id": gericht_id}  # ID hinzufügen!
    today = date.today().strftime("%Y-%m-%d")
    return render_template("detail.html", gericht=gericht, today=today)



# Wochenplan anzeigen
@app.route("/wochenplan")
def wochenplan():
    # Hole den Wochenplan und die Einkaufsliste aus der Firebase-Datenbank
    wochenplan_ref = database.child("wochenplan").get()
    einkaufsliste_ref = database.child("einkaufsliste").get()

    # Überprüfe, ob Daten vorhanden sind und konvertiere sie in eine Liste
    wochenplan = [{**doc, "id": key} for key, doc in wochenplan_ref.items()] if wochenplan_ref else []
    einkaufsliste = [{**doc, "id": key} for key, doc in einkaufsliste_ref.items()] if einkaufsliste_ref else []

    # Gebe die Daten an die HTML-Seite weiter
    return render_template("wochenplan.html", wochenplan=wochenplan, einkaufsliste=einkaufsliste)



# Einkaufsliste Seite anzeigen
@app.route("/einkaufsliste")
def einkaufsliste():
    einkauf_ref = database.child("einkaufsliste").get()
    
    einkaufsliste = []
    if einkauf_ref:
        einkaufsliste = [{**doc, "id": key} for key, doc in einkauf_ref.items()]

    return render_template("einkaufsliste.html", einkaufsliste=einkaufsliste)

# ---------- 📌 API FUNKTIONEN ---------- #

# Gericht hinzufügen (POST)
@app.route("/add_gericht", methods=["POST"])
def add_gericht():
    data = request.json
    neues_gericht = {
        "name": data["name"],
        "hauptzutaten": data["hauptzutaten"],  
        "nebenzutaten": data["nebenzutaten"],  
        "bild_url": data["bild_url"]
    }
    gericht_id = database.child("gerichte").push(neues_gericht)
    return jsonify({"message": "Gericht hinzugefügt", "id": gericht_id.key}), 201

# Gericht aus der Datenbank bearbeiten (POST)
@app.route("/edit_gericht/<gericht_id>", methods=["POST"])
def edit_gericht(gericht_id):
    data = request.json
    if not data:
        return jsonify({"error": "Keine Daten erhalten"}), 400

    # Aktualisierte Werte aus dem Request abrufen
    update_data = {
        "name": data.get("name"),
        "bild_url": data.get("bild_url"),
        "hauptzutaten": data.get("hauptzutaten", []),
        "nebenzutaten": data.get("nebenzutaten", [])
    }

    # Gericht in Firebase aktualisieren
    database.child("gerichte").child(gericht_id).update(update_data)

    return jsonify({"message": "Gericht erfolgreich aktualisiert!"}), 200

# Gericht aus der Datenbank löschen (Delete)
@app.route("/delete_gericht/<gericht_id>", methods=["DELETE"])
def delete_gericht(gericht_id):
    try:
        database.child("gerichte").child(gericht_id).delete()
        return jsonify({"message": "Gericht erfolgreich gelöscht!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# Alle Gerichte abrufen (GET)
@app.route("/gerichte", methods=["GET"])
def get_gerichte():
    gerichte_ref = database.child("gerichte").get()

    if not gerichte_ref:
        return jsonify([]), 200  # Falls leer, geben wir einfach eine leere Liste zurück

    gerichte = [{**doc, "id": key} for key, doc in gerichte_ref.items()]
    return jsonify(gerichte), 200


from flask import redirect, url_for, request
from firebase_config import database

#Gericht zum Wochenplan hinzufügen
@app.route("/add_to_plan", methods=["POST"])
def add_to_plan():
    data = request.json
    if data:
        # ✅ Gericht-ID aus dem Request holen
        gericht_id = data.get("id")

        # ✅ Daten zum Speichern aufbereiten – inklusive gericht_id!
        data_to_save = {
            "datum": data["datum"],
            "gericht": data["gericht"],
            "hauptzutaten": data.get("hauptzutaten", []),
            "nebenzutaten": data.get("nebenzutaten", []),
            "gericht_id": gericht_id  # ← das ist neu
        }

        neues_gericht = database.child("wochenplan").push(data_to_save)
        print("Neues Gericht zum Wochenplan hinzugefügt:", neues_gericht)

        # Zutaten zur Einkaufsliste hinzufügen mit Mengenaggregation
        einkaufs_dict = defaultdict(int)

        if isinstance(data.get("hauptzutaten"), list):
            for zutat in data["hauptzutaten"]:
                if zutat:
                    einkaufs_dict[zutat] += 1

        if isinstance(data.get("nebenzutaten"), list):
            for zutat in data["nebenzutaten"]:
                if zutat:
                    einkaufs_dict[zutat] += 1

        # Vorhandene Einkaufsliste abrufen und Mengen aktualisieren
        einkauf_ref = database.child("einkaufsliste").get()

        if einkauf_ref:
            for key, item in einkauf_ref.items():
                vorhandene_zutat = item["zutat"]
                if vorhandene_zutat in einkaufs_dict:
                    menge_str = item.get("menge", "1 Stück")
                    menge = int(menge_str.split()[0])
                    neue_menge = menge + einkaufs_dict[vorhandene_zutat]
                    database.child("einkaufsliste").child(key).update({"menge": f"{neue_menge} Stück"})
                    del einkaufs_dict[vorhandene_zutat]

        # Neue Zutaten hinzufügen
        for zutat, menge in einkaufs_dict.items():
            database.child("einkaufsliste").push({"zutat": zutat, "menge": f"{menge} Stück"})

    return jsonify({"message": "Gericht hinzugefügt und Zutaten zur Einkaufsliste ergänzt!"}), 201




# Gericht aus dem Wochenplan löschen
@app.route("/delete_from_plan/<gericht_id>", methods=["DELETE"])
def delete_from_plan(gericht_id):
    gericht_ref = database.child("wochenplan").child(gericht_id).get()
    
    # Überprüfen, ob das Gericht existiert
    if not gericht_ref:
        return jsonify({"error": "Gericht nicht gefunden"}), 404
    
    gericht_data = gericht_ref  # Direkter Zugriff auf das dict

    # Gericht aus der Datenbank löschen
    database.child("wochenplan").child(gericht_id).delete()

    # Falls auch Zutaten aus der Einkaufsliste entfernt werden sollen
    if request.args.get("remove_ingredients") == "true":
        einkauf_ref = database.child("einkaufsliste").get()
        if einkauf_ref:
            for item in einkauf_ref.items():
                vorhandene_zutat = item[1]["zutat"]
                if vorhandene_zutat in (gericht_data.get("hauptzutaten", []) + gericht_data.get("nebenzutaten", [])):
                    database.child("einkaufsliste").child(item[0]).delete()  # Lösche auch Zutaten

    return jsonify({"message": "Gericht entfernt"}), 200


# Wochenplan abrufen (GET) und nach Datum sortieren
@app.route("/wochenplan_api", methods=["GET"])
def get_wochenplan():
    plan_ref = database.child("wochenplan").get()
    
    # Mit items() statt each() arbeiten
    wochenplan = [{**doc, "id": key} for key, doc in plan_ref.items()] if plan_ref else []
    
    wochenplan.sort(key=lambda x: x["datum"])  # Sortierung nach Datum
    
    return jsonify(wochenplan), 200


# Einkaufsliste abrufen (GET) mit Mengenaggregation
@app.route("/einkaufsliste_api", methods=["GET"])
def get_einkaufsliste():
    einkauf_ref = database.child("einkaufsliste").get()
    einkaufs_dict = defaultdict(int)

    if einkauf_ref:
        for key, item in einkauf_ref.items():
            zutat = item["zutat"]
            menge = int(item.get("menge", "1 Stück").split()[0])
            einkaufs_dict[zutat] += menge

    einkaufsliste = [{"zutat": zutat, "menge": f"{menge} Stück"} for zutat, menge in einkaufs_dict.items()]
    return jsonify(einkaufsliste), 200

# Zutat zur Einkaufsliste hinzufügen (POST)
@app.route("/add_to_einkaufsliste", methods=["POST"])
def add_to_einkaufsliste():
    data = request.json
    if data:
        neue_zutat = database.child("einkaufsliste").push(data)
        print("Neue Zutat zur Einkaufsliste hinzugefügt:", neue_zutat)
    else:
        print("Fehler: Keine Zutat zum Hinzufügen!")
    return jsonify({"message": "Zutat zur Einkaufsliste hinzugefügt"}), 201

# Zutat aus Einkaufsliste löschen (DELETE)
@app.route("/delete_zutat/<zutat_id>", methods=["DELETE"])
def delete_zutat(zutat_id):
    try:
        database.child("einkaufsliste").child(zutat_id).delete()
        return jsonify({"message": "Zutat abgehakt & gelöscht"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------- 📌 FLASK STARTEN ---------- #
if __name__ == "__main__":
    app.run(debug=True)
