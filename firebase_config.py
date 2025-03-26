import os
import json
from firebase_admin import credentials, initialize_app, db

if os.environ.get("FIREBASE_KEY"):
    # 🔐 Online-Modus: JSON kommt aus Environment Variable (Render)
    firebase_key_dict = json.loads(os.environ["FIREBASE_KEY"])
    cred = credentials.Certificate(firebase_key_dict)
else:
    # 🧪 Lokal: Lade direkt aus Datei
    cred = credentials.Certificate("firebase-key.json")

# Initialisiere Firebase
initialize_app(cred, {
    'databaseURL': 'https://foodmenu-d3081-default-rtdb.europe-west1.firebasedatabase.app/'
})

# DB-Referenz
database = db.reference()
