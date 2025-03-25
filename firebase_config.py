import os
import firebase_admin
from firebase_admin import credentials, db
import json

# 🔐 Lade den Schlüssel aus einer Umgebungsvariable
firebase_key = os.environ.get("FIREBASE_KEY_JSON")

if firebase_key:
    key_dict = json.loads(firebase_key)
    cred = credentials.Certificate(key_dict)
    firebase_admin.initialize_app(cred, {
        'databaseURL': "https://foodmenu-d3081-default-rtdb.europe-west1.firebasedatabase.app"
    })
    database = db.reference()
else:
    raise Exception("FIREBASE_KEY_JSON not set!")
