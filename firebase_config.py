import firebase_admin
from firebase_admin import credentials, db

# Firebase Service Key laden
cred = credentials.Certificate("firebase-key.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': "https://foodmenu-d3081-default-rtdb.europe-west1.firebasedatabase.app"
})

# Verbindung zur Firebase Realtime Database
database = db.reference()
