import os
import json
from firebase_admin import credentials, initialize_app, db

# Lade den JSON-String aus der Umgebungsvariable
firebase_key_str = os.environ.get("FIREBASE_KEY")

# Wandle ihn in ein Python-Objekt um
firebase_key_dict = json.loads(firebase_key_str)

cred = credentials.Certificate(firebase_key_dict)
initialize_app(cred, {
    'databaseURL': 'https://foodmenu-d3081-default-rtdb.europe-west1.firebasedatabase.app/'
})

database = db
