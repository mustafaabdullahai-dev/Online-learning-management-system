import os

from flask import Flask
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
import datetime

# --- Configuration (Same as your app.py) ---
app = Flask(__name__)
app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "mongodb://localhost:27017/LMS_Database")
mongo = PyMongo(app)
bcrypt = Bcrypt(app)

def create_super_admin():
    users_collection = mongo.db.users

    # 1. Check karein k Super Admin pehle se to nahi?
    existing_admin = users_collection.find_one({'role': 'super_admin'})
    if existing_admin:
        print("❌ Error: Super Admin pehle se मौजूद hai!")
        return

    # 2. Details set karein
    first_name = os.environ.get("SUPER_ADMIN_FIRST_NAME", "Super")
    last_name = os.environ.get("SUPER_ADMIN_LAST_NAME", "Admin")
    email = os.environ.get("SUPER_ADMIN_EMAIL", "super@admin.com")
    password = os.environ.get("SUPER_ADMIN_PASSWORD", "admin123")

    # 3. Password Hash karein
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # 4. Database mein insert karein
    super_admin_data = {
        'firstName': first_name,
        'lastName': last_name,
        'email': email,
        'password': hashed_password,
        'role': 'super_admin',    # Special Role
        'status': 'active',       # Direct Active
        'created_at': datetime.datetime.utcnow()
    }

    users_collection.insert_one(super_admin_data)
    print("✅ Success! Super Admin create ho gaya hai.")
    print(f"Login Email: {email}")
    print(f"Password: {password}")

if __name__ == '__main__':
    # Flask context k andar run karein
    with app.app_context():
        create_super_admin()