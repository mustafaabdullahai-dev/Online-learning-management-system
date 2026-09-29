import os
import string
import traceback

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass
from flask import Flask, jsonify, request, send_from_directory
from flask_pymongo import PyMongo
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import jwt
import datetime
from datetime import timedelta
from flask_mail import Mail, Message
import secrets
from functools import wraps
from bson.objectid import ObjectId
from werkzeug.utils import secure_filename
import requests
import random
from google import genai
from google.genai import types
import pyotp
import qrcode
import io
import base64
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature

# --- App Initialization ---
app = Flask(__name__)
# React se connection ki ijazat
CORS(app, resources={r"/*": {"origins": "*"}})

# --- File Upload Configuration ---
UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True) 

# --- Email Configuration (Gmail k liye) ---
app.config['MAIL_SERVER'] = 'smtp.googlemail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', '')

mail = Mail(app)

# --- DB Configuration ---
app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "mongodb://localhost:27017/LMS_Database")
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "change-me-in-production")

# --- Services Initialization ---
try:
    mongo = PyMongo(app)
    db = mongo.db
    users_collection = db.users
    courses_collection = db.courses
    content_collection = db.content
    discussions_collection = db.discussions 
    replies_collection = db.replies
    assessments_collection = db.assessments
    submissions_collection = db.submissions 
    lesson_completions_collection = db.lesson_completions
    meetings_collection= db.meetings
    announcements_collection = db.announcements
    otp_collection = db.temp_otps
    print("MongoDB connected successfully!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    users_collection = None
    courses_collection = None
    content_collection = None
    discussions_collection = None 
    replies_collection = None
    assessments_collection = None
    submissions_collection = None 
    lesson_completions_collection = None
    meetings_collection = db["meetings"]

bcrypt = Bcrypt(app)

# === TOKEN DECORATOR (SECURITY GUARD) ===
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'error': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users_collection.find_one({'_id': ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'error': 'User not found'}), 404
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid!'}), 401

        return f(current_user, *args, **kwargs)
    return decorated
# === (End) TOKEN DECORATOR ===


# --- API Routes ---

# 1. Test Route
@app.route('/api/test', methods=['GET'])
def test_api():
    if users_collection is not None:
        return jsonify({"message": "Backend Flask se connected hai aur DB bhi set hai! 👍"})
    else:
        return jsonify({"message": "Backend connected hai, lekin DB connection FAILED."}), 500


# 2. SIGN UP (Step 3: Password Set logic)
@app.route('/api/signup', methods=['POST'])
def signup():
    if users_collection is None:
        return jsonify({"error": "Database not connected"}), 500

    data = request.get_json()
    email = data.get('email').lower().strip()
    password = data.get('password')
    role = data.get('role', 'student')
    firstName = data.get('firstName', 'User')
    lastName = data.get('lastName', '')

    if not email or not password:
        return jsonify({"error": "Email and Password are required"}), 400

    # User dhoondein (OTP verification ke baad wala state)
    existing_user = users_collection.find_one({'email': email})
    
    # Check if already registered with a password
    if existing_user and existing_user.get('password'):
        return jsonify({"error": "Email already exists"}), 409

    # Password Hash karein (Yahan se Signin match karega)
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    status = 'active'
    if role in ['instructor', 'admin', 'super_admin']:
        status = 'pending'

    try:
        # Purane temporary record ko update karein aur password set karein
        users_collection.update_one(
            {'email': email},
            {'$set': {
                'firstName': firstName,
                'lastName': lastName,
                'password': hashed_password,
                'role': role,
                'status': status,
                'link_clicked': False,
                'created_at': datetime.datetime.utcnow()
            }},
            upsert=True
        )
        
        # New record fetch karein token ke liye
        user = users_collection.find_one({'email': email})

        token = jwt.encode({
            'user_id': str(user['_id']),
            'role': role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")

        return jsonify({
            "message": "Registration successful!", 
            "token": token, 
            "role": role,
            "firstName": firstName
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 3. SIGN IN (Updated: Direct Password Login, No OTP)
@app.route('/api/signin', methods=['POST'])
def signin():
    if users_collection is None:
        return jsonify({"error": "Database offline"}), 500
        
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing credentials"}), 400

    email = data.get('email').lower().strip()
    password = data.get('password')

    # User dhoondein
    user = users_collection.find_one({'email': email})

    # 1. Check if user exists and has a password
    if user and user.get('password'):
        # 2. Bcrypt Verification
        if bcrypt.check_password_hash(user['password'], password):
            
            # 3. Pending Status Check (Instructors/Admins ke liye)
            if user.get('status') == 'pending':
                return jsonify({
                    "error": "PENDING_APPROVAL",
                    "message": "Account under eligibility verification.",
                    "role": user.get('role')
                }), 403

            # 4. SUCCESS: Seedha Token Generate Karein (OTP wala part remove kar diya)
            token = jwt.encode({
                'user_id': str(user['_id']), 
                'role': user['role'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, app.config['SECRET_KEY'], algorithm="HS256") 

            # Frontend ko seedha access grant karein
            return jsonify({
                "message": "Login successful!",
                "token": token,
                "role": user['role'],
                "firstName": user.get('firstName', 'User') 
            }), 200
        else:
            # Galat password par 401
            return jsonify({"error": "Incorrect password protocol."}), 401
    else:
        # User na milne par 401
        return jsonify({"error": "Node identifier not found."}), 401

@app.route('/api/verify-signin', methods=['POST'])
def verify_signin():
    data = request.json
    email = data.get('email').lower().strip()
    user_otp = data.get('otp')

    user = users_collection.find_one({"email": email})
    
    if user and user.get('temp_otp') == user_otp:
        # Clear OTP
        users_collection.update_one({"email": email}, {"$unset": {"temp_otp": 1}}) 

        # Final Token Generation
        token = jwt.encode({
            'user_id': str(user['_id']), 
            'role': user['role'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256") 

        return jsonify({
            "message": "Uplink Established",
            "token": token,
            "role": user['role'],
            "firstName": user.get('firstName', 'User')
        }), 200
    
    return jsonify({"error": "Invalid security code"}), 400

# 4. FORGOT PASSWORD
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    if users_collection is None:
        return jsonify({"error": "Database not connected"}), 500
        
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
        
    user = users_collection.find_one({"email": email})
    
    if user:
        token = secrets.token_hex(16)
        expiry_time = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        
        users_collection.update_one(
            {'_id': user['_id']},
            {'$set': {'reset_token': token, 'reset_token_expiry': expiry_time}}
        )
        
        reset_link = f"http://localhost:3000/reset-password/{token}"
        
        try:
            msg = Message(
                'Password Reset Request',
                sender=app.config['MAIL_USERNAME'], 
                recipients=[email] 
            )
            msg.body = f"To reset your password, please click the following link:\n\n{reset_link}\n\nThe link is valid for 1 hour."
            mail.send(msg)
            return jsonify({"message": "Password reset link has been sent to your email."}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    return jsonify({"message": "If this email is registered, a password reset link will be sent."}), 200

# Helper to format time (e.g., "2 hours ago")
def time_ago(date_obj):
    if not date_obj: return ""
    now = datetime.datetime.utcnow()
    diff = now - date_obj
    seconds = diff.total_seconds()
    if seconds < 60: return "Just now"
    if seconds < 3600: return f"{int(seconds // 60)} mins ago"
    if seconds < 86400: return f"{int(seconds // 3600)} hours ago"
    return f"{int(seconds // 86400)} days ago"

# 5. DASHBOARD STATS (REAL-TIME DATABASE DATA)
@app.route('/api/dashboard-stats', methods=['GET'])
@token_required
def get_dashboard_stats(current_user): 
    role = current_user.get('role')
    user_id = current_user.get('_id')
    
    stats = []
    courses_data = []
    discussions_data = []

    try:
        # --- ADMIN / SUPER ADMIN ---
        if role in ['admin', 'super_admin']: 
            total_students = users_collection.count_documents({"role": "student"})
            total_instructors = users_collection.count_documents({"role": "instructor"})
            total_users = users_collection.count_documents({})
            active_courses = courses_collection.count_documents({"status": "Active"}) 
            
            stats = [
                {"title": "Total Students", "value": total_students, "change": "Active", "icon": "FaUserGroup"},
                {"title": "Active Courses", "value": active_courses, "change": "Published", "icon": "IoBookOutline"},
                {"title": "Total Instructors", "value": total_instructors, "change": "Verified", "icon": "FaGraduationCap"},
                {"title": "System Users", "value": total_users, "change": "Total", "icon": "LuBookText"},
            ]
            
            # Recent Courses (Last 3 created)
            recent_courses = courses_collection.find().sort("created_at", -1).limit(3)
            for c in recent_courses:
                courses_data.append({
                    "_id": str(c["_id"]),
                    "name": c.get("title", "Untitled"),
                    "students": f"{c.get('students_enrolled', 0)} Students"
                })

        # --- INSTRUCTOR ---
        elif role == 'instructor':
            # 1. My Courses Count
            my_courses_cursor = list(courses_collection.find({"instructor_id": user_id}))
            my_courses_count = len(my_courses_cursor)
            
            # 2. My Students Count (Unique students across all my courses)
            my_student_ids = set()
            course_ids = []
            for course in my_courses_cursor:
                course_ids.append(course["_id"])
                my_student_ids.update(course.get('enrolled_students', []))
            my_students_count = len(my_student_ids)

            # 3. Pending Grading (Submissions in my courses with status 'Submitted')
            # First find assessments in my courses
            my_assessments = list(assessments_collection.find({"course_id": {"$in": course_ids}}, {"_id": 1}))
            my_assessment_ids = [a["_id"] for a in my_assessments]
            
            pending_grading_count = submissions_collection.count_documents({
                "assessment_id": {"$in": my_assessment_ids},
                "status": "Submitted" # Not 'Graded'
            })

            stats = [
                {"title": "My Students", "value": my_students_count, "change": "Total", "icon": "FaUserGroup"},
                {"title": "My Courses", "value": my_courses_count, "change": "Active", "icon": "IoBookOutline"},
                {"title": "Pending Grading", "value": pending_grading_count, "change": "To Do", "icon": "FaGraduationCap"},
            ]
            
            # Recent 3 Courses
            for c in my_courses_cursor[:3]:
                courses_data.append({
                    "_id": str(c["_id"]),
                    "name": c.get("title"),
                    "students": f"{c.get('students_enrolled', 0)} Enrolled"
                })

        # --- STUDENT ---
        elif role == 'student':
            # 1. Enrolled Courses
            enrolled_courses_cursor = list(courses_collection.find({"enrolled_students": user_id}))
            enrolled_count = len(enrolled_courses_cursor)
            enrolled_ids = [c["_id"] for c in enrolled_courses_cursor]

            # 2. Assignments Due (Published assessments in my courses, not yet submitted)
            # (Simplified: Just count total active assessments for now)
            assignments_count = assessments_collection.count_documents({
                "course_id": {"$in": enrolled_ids},
                "status": "Published"
            })

            stats = [
                {"title": "Enrolled Courses", "value": enrolled_count, "change": "Learning", "icon": "FaUserGroup"},
                {"title": "Assignments", "value": assignments_count, "change": "Total", "icon": "FiCheckSquare"},
                {"title": "Attendance", "value": "95%", "change": "Average", "icon": "FiClock"}, # Mock for now
            ]
            
            # Recent 3 Enrolled Courses
            for c in enrolled_courses_cursor[:3]:
                courses_data.append({
                    "_id": str(c["_id"]),
                    "name": c.get("title"),
                    "students": "In Progress"
                })

        # --- COMMON: Recent Discussions (Last 3) ---
        # Filter discussions based on role (Admin sees all, others see relevant)
        disc_query = {}
        if role == 'instructor':
            disc_query = {"course_id": {"$in": course_ids}}
        elif role == 'student':
            disc_query = {"course_id": {"$in": enrolled_ids}}
            
        recent_discussions = discussions_collection.find(disc_query).sort("last_reply_at", -1).limit(3)
        
        for d in recent_discussions:
            title_words = d.get('title', '').split()
            initials = "".join(word[0] for word in title_words[:2]).upper()
            discussions_data.append({
                "initials": initials,
                "title": d.get('title'),
                "replies": f"{d.get('reply_count', 0)} replies",
                "time": time_ago(d.get('last_reply_at'))
            })

        return jsonify({
            'stats': stats,
            'courses': courses_data,
            'discussions': discussions_data
        }), 200

    except Exception as e:
        print(f"Dashboard Error: {e}")
        return jsonify({'error': str(e)}), 500

# 6. QUICK ACTIONS (DYNAMIC)
@app.route('/api/quick-actions', methods=['GET'])
@token_required
def get_quick_actions(current_user):
    role = current_user.get('role')
    actions = []

    try:
        if role in ['admin', 'super_admin']:
            pending_courses = courses_collection.count_documents({"status": "Draft"})
            pending_users = users_collection.count_documents({"status": "pending"})

            if pending_courses > 0:
                actions.append({"text": f"Approve {pending_courses} Courses", "link": "/courses", "icon": "FiCheckSquare"})
            if pending_users > 0:
                 actions.append({"text": f"Verify {pending_users} Users", "link": "/users", "icon": "FiUserPlus"})
            
            actions.append({"text": "System Settings", "link": "/settings", "icon": "FiEdit"})

        elif role == 'instructor':
            actions = [
                {"text": "Create New Course", "link": "/courses", "icon": "FiEdit"},
                {"text": "Schedule Meeting", "link": "/video-conferencing", "icon": "FiPlayCircle"},
                {"text": "Check Assignments", "link": "/assessments", "icon": "FiCheckSquare"},
            ]

        elif role == 'student':
            actions = [
                {"text": "Join Class", "link": "/video-conferencing", "icon": "FiPlayCircle"}, 
                {"text": "View Assignments", "link": "/assessments", "icon": "FiCheckSquare"},
                {"text": "Ask a Question", "link": "/discussions", "icon": "FiMessageSquare"},
            ]
        
        return jsonify({'actions': actions}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# 7. GET ALL USERS (Admin & Super Admin)
@app.route('/api/users', methods=['GET'])
@token_required
def get_all_users(current_user):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin']:
        return jsonify({"error": "Admin access required"}), 403

    try:
        users_from_db = list(users_collection.find({}))
        users_list = []
        for user in users_from_db:
            first_name = user.get('firstName', '')
            last_name = user.get('lastName', '')
            initials = (first_name[0] if first_name else '') + (last_name[0] if last_name else '')
            
            users_list.append({
                '_id': str(user['_id']),
                'initials': initials.upper(),
                'name': f"{first_name} {last_name}",
                'firstName': first_name,
                'lastName': last_name,
                'email': user.get('email'),
                'role': user.get('role'),
                'status': user.get('status', 'active'),
                'enrolled': 0, 
                'completed': 0
            })
        
        return jsonify(users_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 8. ADD NEW USER (Admin & Super Admin)
@app.route('/api/users', methods=['POST'])
@token_required
def add_user(current_user):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin']:
        return jsonify({"error": "Admin access required"}), 403
        
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password') or not data.get('firstName') or not data.get('role') or not data.get('status'):
        return jsonify({"error": "Missing required fields"}), 400
    
    if users_collection.find_one({'email': data['email']}):
        return jsonify({"error": "Email already exists"}), 409
    
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    try:
        users_collection.insert_one({
            'firstName': data['firstName'],
            'lastName': data.get('lastName', ''),
            'email': data['email'],
            'password': hashed_password,
            'role': data['role'],
            'status': data['status']
        })
        return jsonify({"message": "User added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 9. UPDATE USER (Protected)
@app.route('/api/users/<user_id>', methods=['PUT'])
@token_required
def update_user(current_user, user_id):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin']:
        return jsonify({"error": "Admin access required"}), 403
        
    data = request.get_json()
    
    try:
        target_user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not target_user:
            return jsonify({"error": "User not found"}), 404

        # Cannot edit another Super Admin unless you are one? (Simplified: Just block editing Super Admin)
        # Or let Super Admin edit other Super Admins.
        # Strict rule: Don't edit Super Admin role if target is Super Admin
        if target_user.get('role') == 'super_admin' and current_user.get('role') != 'super_admin':
             return jsonify({"error": "Action Denied: Cannot edit Super Admin account."}), 403

        update_data = {
            'firstName': data['firstName'],
            'lastName': data.get('lastName', ''),
            'email': data['email'],
            'role': data['role'],
            'status': data['status']
        }
        
        if data.get('password'):
             hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
             update_data['password'] = hashed_password

        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        return jsonify({"message": "User updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 10. DELETE USER (Protected)
@app.route('/api/users/<user_id>', methods=['DELETE'])
@token_required
def delete_user(current_user, user_id):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin']:
        return jsonify({"error": "Admin access required"}), 403
        
    try:
        target_user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not target_user:
            return jsonify({"error": "User not found"}), 404

        if target_user.get('role') == 'super_admin':
            return jsonify({"error": "Action Denied: Cannot delete Super Admin account."}), 403

        users_collection.delete_one({'_id': ObjectId(user_id)})
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# === COURSE MANAGEMENT ===

# 11. CREATE NEW COURSE
@app.route('/api/courses', methods=['POST'])
@token_required
def create_course(current_user):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin', 'instructor']:
        return jsonify({"error": "Permission denied"}), 403
    if current_user.get('role') == 'student':
        return jsonify({"error": "Security Access Denied. Students cannot create nodes."}), 403

    data = request.get_json()
    if not data or not data.get('title') or not data.get('duration'):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        new_course = {
            'title': data['title'],
            'description': data.get('description', ''),
            'duration': data['duration'],
            'status': data.get('status', 'Draft'),
            'instructor_id': current_user['_id'],
            'instructor_name': f"{current_user.get('firstName')} {current_user.get('lastName')}",
            'enrolled_students': [],
            'created_at': datetime.datetime.utcnow()
        }
        new_course['students_enrolled'] = len(new_course['enrolled_students'])

        courses_collection.insert_one(new_course)
        return jsonify({"message": "Course created successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 12. GET COURSES
@app.route('/api/courses', methods=['GET'])
@token_required
def get_courses(current_user):
    role = current_user.get('role')
    user_id = current_user.get('_id') 

    try:
        query = {}

        if role == 'instructor':
            query = {'instructor_id': user_id}
        elif role == 'student':
            query = {'status': 'Active'}
        # Admin OR Super Admin
        elif role in ['admin', 'super_admin']: # <-- UPDATED
             requested_status = request.args.get('status')
             if requested_status:
                 query = {'status': requested_status}
        else:
             return jsonify({"error": "Permission denied"}), 403

        courses_from_db = list(courses_collection.find(query).sort("created_at", -1))

        courses_list = []
        for course in courses_from_db:
            is_enrolled = False
            if role == 'student':
                enrolled_list = course.get('enrolled_students', [])
                if user_id in enrolled_list:
                    is_enrolled = True

            courses_list.append({
                '_id': str(course['_id']),
                'title': course.get('title'),
                'description': course.get('description', ''), 
                'instructor': course.get('instructor_name', 'N/A'),
                'students': course.get('students_enrolled', 0),
                'duration': course.get('duration'),
                'status': course.get('status', 'Draft'),
                'category': course.get('category', 'General'), 
                'isEnrolled': is_enrolled, 
                'progress': 0 
            })

        return jsonify(courses_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# 13. UPDATE COURSE
@app.route('/api/courses/<course_id>', methods=['PUT'])
@token_required
def update_course(current_user, course_id):
    role = current_user.get('role')
    data = request.get_json()
    if current_user.get('role') == 'student':
        return jsonify({"error": "Security Access Denied. Students cannot create nodes."}), 403
    try:
        course = courses_collection.find_one({'_id': ObjectId(course_id)})
        if not course:
            return jsonify({"error": "Course not found"}), 404
            
        # Instructor Check (Admin/SuperAdmin bypasses this)
        if role == 'instructor' and course.get('instructor_id') != current_user['_id']:
            return jsonify({"error": "Permission denied: You do not own this course"}), 403
            
        update_data = {
            'title': data.get('title', course['title']),
            'description': data.get('description', course.get('description')),
            'duration': data.get('duration', course['duration']),
            'status': data.get('status', course['status']),
        }
        
        courses_collection.update_one(
            {'_id': ObjectId(course_id)},
            {'$set': update_data}
        )
        return jsonify({"message": "Course updated successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 14. DELETE COURSE (Admin & Super Admin)
@app.route('/api/courses/<course_id>', methods=['DELETE'])
@token_required
def delete_course(current_user, course_id):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin']:
        return jsonify({"error": "Admin access required"}), 403
        
    try:
        result = courses_collection.delete_one({'_id': ObjectId(course_id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Course not found"}), 404
        
        content_collection.delete_many({'course_id': ObjectId(course_id)})
        assessments_collection.delete_many({'course_id': ObjectId(course_id)})

        return jsonify({"message": "Course deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === ENROLLMENT MANAGEMENT ===

# 15. GET LIST OF ALL STUDENTS
@app.route('/api/students', methods=['GET'])
@token_required
def get_all_students_for_enrollment(current_user):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin', 'instructor']:
        return jsonify({"error": "Permission denied"}), 403

    try:
        students = list(users_collection.find(
            {'role': 'student'},
            {'_id': 1, 'firstName': 1, 'lastName': 1}
        ))

        student_list = [{
            '_id': str(s['_id']),
            'name': f"{s.get('firstName', '')} {s.get('lastName', '')}".strip()
        } for s in students]

        return jsonify(student_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 16. GET ENROLLED STUDENTS
@app.route('/api/courses/<course_id>/enrolled-students', methods=['GET'])
@token_required
def get_enrolled_students(current_user, course_id):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin', 'instructor']:
        return jsonify({"error": "Permission denied"}), 403

    try:
        course = courses_collection.find_one(
            {'_id': ObjectId(course_id)},
            {'enrolled_students': 1, 'instructor_id': 1}
        )
        if not course:
            return jsonify({"error": "Course not found"}), 404

        if current_user.get('role') == 'instructor' and course.get('instructor_id') != current_user['_id']:
            return jsonify({"error": "Permission denied: Not your course"}), 403

        enrolled_ids = course.get('enrolled_students', [])

        enrolled_students_details = list(users_collection.find(
            {'_id': {'$in': enrolled_ids}},
            {'_id': 1, 'firstName': 1, 'lastName': 1}
        ))

        student_list = [{
            '_id': str(s['_id']),
            'name': f"{s.get('firstName', '')} {s.get('lastName', '')}".strip()
        } for s in enrolled_students_details]

        return jsonify(student_list), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 17. UPDATE ENROLLMENTS
@app.route('/api/courses/<course_id>/enrollments', methods=['PUT'])
@token_required
def update_enrollments(current_user, course_id):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin', 'instructor']:
        return jsonify({"error": "Permission denied"}), 403

    data = request.get_json()
    student_ids_to_enroll = data.get('student_ids', [])

    if not isinstance(student_ids_to_enroll, list):
        return jsonify({"error": "Invalid data format: student_ids should be a list"}), 400

    try:
        course = courses_collection.find_one({'_id': ObjectId(course_id)})
        if not course:
            return jsonify({"error": "Course not found"}), 404

        if current_user.get('role') == 'instructor' and course.get('instructor_id') != current_user['_id']:
            return jsonify({"error": "Permission denied: Not your course"}), 403

        object_ids_to_enroll = [ObjectId(sid) for sid in student_ids_to_enroll]

        result = courses_collection.update_one(
            {'_id': ObjectId(course_id)},
            {'$set': {
                'enrolled_students': object_ids_to_enroll,
                'students_enrolled': len(object_ids_to_enroll) 
            }}
        )

        return jsonify({"message": "Enrollments updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# 18. STUDENT ENROLL THEMSELVES
@app.route('/api/courses/<course_id>/enroll', methods=['POST'])
@token_required
def enroll_student(current_user, course_id):
    if current_user.get('role') != 'student':
        return jsonify({"error": "Only students can enroll"}), 403

    user_id = current_user.get('_id')

    try:
        course = courses_collection.find_one({'_id': ObjectId(course_id)})
        if not course:
            return jsonify({"error": "Course not found"}), 404

        if course.get('status') != 'Active':
             return jsonify({"error": "Course is not active for enrollment"}), 400

        result = courses_collection.update_one(
            {'_id': ObjectId(course_id)},
            {'$addToSet': {'enrolled_students': user_id}}
        )

        if result.modified_count > 0:
            courses_collection.update_one(
                 {'_id': ObjectId(course_id)},
                 {'$inc': {'students_enrolled': 1}}
            )

        return jsonify({"message": "Successfully enrolled"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === CONTENT MANAGEMENT ===

# Helper to check if user can manage a specific course
def can_manage_course(user, course_id):
    if not course_id: return False
    # Added super_admin
    if user.get('role') in ['admin', 'super_admin']:
        return True 
    
    try:
        if not isinstance(course_id, ObjectId):
            course_id = ObjectId(course_id)
    except Exception:
        return False 

    course = courses_collection.find_one({'_id': course_id})
    if course and user.get('role') == 'instructor' and course.get('instructor_id') == user['_id']:
        return True 
    return False

# 19. GET CONTENT
@app.route('/api/content', methods=['GET'])
@token_required
def get_content(current_user):
    role = current_user.get('role')
    user_id = current_user.get('_id')
    course_id_filter = request.args.get('courseId') 

    # Added super_admin
    if role not in ['admin', 'super_admin', 'instructor', 'student']:
        return jsonify({"error": "Permission denied"}), 403

    try:
        query = {}
        if role == 'student':
            query['status'] = 'Published'
            # Optional: Sirf un courses ka content dikhayein jin mein student enrolled hai
            query['course_id'] = {'$in': list(courses_collection.find({'enrolled_students': user_id}, {'_id': 1}))}
        
        elif role == 'instructor':
            query['instructor_id'] = user_id

        if course_id_filter:
            if role == 'instructor':
                 course_check = courses_collection.find_one({'_id': ObjectId(course_id_filter), 'instructor_id': user_id})
                 if not course_check:
                     return jsonify({"error": "Course not found or permission denied"}), 404
            query['course_id'] = ObjectId(course_id_filter)

        content_items_db = list(content_collection.find(query).sort("order", 1)) 

        course_ids = [item.get('course_id') for item in content_items_db if item.get('course_id')]
        courses_info = {str(c['_id']): c.get('title', 'N/A') for c in courses_collection.find({'_id': {'$in': course_ids}}, {'title': 1})}

        content_list = []
        for item in content_items_db:
            content_list.append({
                '_id': str(item['_id']),
                'title': item.get('title'),
                'type': item.get('type'),
                'course_id': str(item.get('course_id')),
                'course': courses_info.get(str(item.get('course_id')), 'Unknown Course'), 
                'url': item.get('url'), 
                'duration': item.get('duration'), 
                'status': item.get('status', 'Draft'),
                'order': item.get('order', 0) 
            })

        return jsonify(content_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 20. ADD NEW CONTENT
@app.route('/api/content', methods=['POST'])
@token_required
def add_content(current_user):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin', 'instructor']:
        return jsonify({"error": "Permission denied"}), 403
    if current_user.get('role') == 'student':
        return jsonify({"error": "Security Access Denied. Students cannot purge nodes."}), 403

    data = request.get_json()
    required_fields = ['title', 'type', 'course_id', 'status', 'url'] 
    if not data or not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields (title, type, course_id, status, url)"}), 400

    course_id_to_link = ObjectId(data['course_id'])

    if not can_manage_course(current_user, course_id_to_link):
         return jsonify({"error": "Cannot add content to this course"}), 403

    try:
        new_content = {
            'title': data['title'],
            'type': data['type'], 
            'course_id': course_id_to_link,
            'instructor_id': current_user['_id'], 
            'url': data['url'], 
            'duration': data.get('duration'), 
            'status': data['status'], 
            'order': data.get('order', 0), 
            'uploaded_at': datetime.datetime.utcnow()
        }
        content_collection.insert_one(new_content)
        return jsonify({"message": "Content added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 21. UPDATE CONTENT
@app.route('/api/content/<content_id>', methods=['PUT'])
@token_required
def update_content(current_user, content_id):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin', 'instructor']:
        return jsonify({"error": "Permission denied"}), 403
    if current_user.get('role') == 'student':
        return jsonify({"error": "Security Access Denied. Students cannot purge nodes."}), 403

    data = request.get_json()
    if not data:
         return jsonify({"error": "No update data provided"}), 400

    try:
        content_item = content_collection.find_one({'_id': ObjectId(content_id)})
        if not content_item:
            return jsonify({"error": "Content not found"}), 404

        if current_user.get('role') == 'instructor' and content_item.get('instructor_id') != current_user['_id']:
            return jsonify({"error": "Permission denied: Cannot edit this content"}), 403

        update_data = {}
        allowed_fields = ['title', 'type', 'course_id', 'url', 'duration', 'status', 'order']
        for field in allowed_fields:
            if field in data:
                 if field == 'course_id':
                     new_course_id = ObjectId(data['course_id'])
                     if not can_manage_course(current_user, new_course_id):
                           return jsonify({"error": "Cannot move content to this course"}), 403
                     update_data[field] = new_course_id
                 else:
                     update_data[field] = data[field]

        if not update_data:
             return jsonify({"error": "No valid fields to update"}), 400

        content_collection.update_one(
            {'_id': ObjectId(content_id)},
            {'$set': update_data}
        )
        return jsonify({"message": "Content updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 22. DELETE CONTENT
@app.route('/api/content/<content_id>', methods=['DELETE'])
@token_required
def delete_content(current_user, content_id):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin', 'instructor']:
        return jsonify({"error": "Permission denied"}), 403
    if current_user.get('role') == 'student':
        return jsonify({"error": "Security Access Denied. Students cannot purge nodes."}), 403

    try:
        content_item = content_collection.find_one({'_id': ObjectId(content_id)})
        if not content_item:
            return jsonify({"error": "Content not found"}), 404

        if current_user.get('role') == 'instructor' and content_item.get('instructor_id') != current_user['_id']:
            return jsonify({"error": "Permission denied: Cannot delete this content"}), 403

        result = content_collection.delete_one({'_id': ObjectId(content_id)})
        if result.deleted_count == 0:
             return jsonify({"error": "Content not found during deletion"}), 404 

        return jsonify({"message": "Content deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 23. GET SIMPLE COURSE LIST
@app.route('/api/courses/simple', methods=['GET'])
@token_required
def get_simple_course_list(current_user):
    role = current_user.get('role')
    user_id = current_user.get('_id')
    query = {}

    if role == 'instructor':
        query = {'instructor_id': user_id} 
    elif role == 'student':
        query = {'enrolled_students': user_id}
    # Added super_admin
    elif role in ['admin', 'super_admin']:
        pass 
    else:
         return jsonify({"error": "Unknown role"}), 403 

    try:
        courses = list(courses_collection.find(query, {'_id': 1, 'title': 1}).sort('title', 1)) 
        course_list = [{'_id': str(c['_id']), 'title': c.get('title')} for c in courses]
        return jsonify(course_list), 200
    except Exception as e:
        print(f"Error in get_simple_course_list: {e}") 
        return jsonify({"error": str(e)}), 500

# === STUDENT COURSE CONTENT VIEW ===

# 24. GET PUBLISHED CONTENT FOR A SPECIFIC COURSE
@app.route('/api/courses/<course_id>/content', methods=['GET'])
@token_required
def get_course_content_for_student(current_user, course_id):
    user_id = current_user['_id']
    role = current_user.get('role')

    try:
        course_object_id = ObjectId(course_id)
        course = courses_collection.find_one({'_id': course_object_id})

        if not course:
            return jsonify({"error": "Course not found"}), 404

        is_enrolled = user_id in course.get('enrolled_students', [])
        # Added super_admin
        can_view = role in ['admin', 'super_admin', 'instructor'] or is_enrolled

        if not can_view:
            return jsonify({"error": "You are not enrolled in this course"}), 403

        content_items_db = list(content_collection.find({
            'course_id': course_object_id,
            'status': 'Published' 
        }).sort("order", 1)) 

        content_list = []
        for item in content_items_db:
            content_list.append({
                '_id': str(item['_id']),
                'title': item.get('title'),
                'type': item.get('type'),
                'url': item.get('url'), 
                'duration': item.get('duration'), 
                'order': item.get('order', 0)
            })

        return jsonify({
            'course_title': course.get('title', 'Course Content'),
            'content': content_list
        }), 200

    except Exception as e:
       print(f"Error in get_course_content_for_student: {e}")
       return jsonify({"error": "An internal server error occurred"}), 500

# === DISCUSSION FORUM ===

# Helper
def can_access_course_discussion(user, course_id_str):
    if not course_id_str: return False
    role = user.get('role')
    user_id = user.get('_id')
    
    try:
        course_id = ObjectId(course_id_str)
    except Exception:
        return False

    # Added super_admin
    if role in ['admin', 'super_admin']: return True 

    course = courses_collection.find_one({'_id': course_id})
    if not course: return False

    if role == 'instructor' and course.get('instructor_id') == user_id:
        return True 
    if role == 'student' and user_id in course.get('enrolled_students', []):
        return True 

    return False


# 25. GET DISCUSSION THREADS
@app.route('/api/discussions', methods=['GET'])
@token_required
def get_discussions(current_user):
    role = current_user.get('role')
    user_id = current_user.get('_id')
    user_id_str = str(user_id) 
    course_id_filter = request.args.get('courseId')

    try:
        query = {}
        accessible_course_ids = []

        # Added super_admin
        if role in ['admin', 'super_admin']:
            pass
        elif role == 'instructor':
            my_courses = list(courses_collection.find({'instructor_id': user_id}, {'_id': 1}))
            accessible_course_ids = [c['_id'] for c in my_courses]
            query['course_id'] = {'$in': accessible_course_ids}
        elif role == 'student':
            my_enrollments = list(courses_collection.find({'enrolled_students': user_id}, {'_id': 1}))
            accessible_course_ids = [c['_id'] for c in my_enrollments]
            query['course_id'] = {'$in': accessible_course_ids}
        else:
            return jsonify({"error": "Permission denied"}), 403

        if course_id_filter:
             course_obj_id = ObjectId(course_id_filter)
             # Added super_admin check
             if role in ['admin', 'super_admin'] or course_obj_id in accessible_course_ids:
                 query['course_id'] = course_obj_id
             else:
                 return jsonify([]), 200 

        discussions_db = list(discussions_collection.find(query).sort("last_reply_at", -1))
        course_ids_needed = {d.get('course_id') for d in discussions_db if d.get('course_id')}
        courses_info = {str(c['_id']): c.get('title', 'N/A') for c in courses_collection.find({'_id': {'$in': list(course_ids_needed)}}, {'title': 1})}

        discussion_list = []

        for d in discussions_db:
            starter_info = users_collection.find_one({'_id': d.get('starter_id')}, {'firstName': 1, 'lastName': 1})
            starter_name = f"{starter_info.get('firstName', '')} {starter_info.get('lastName', '')}".strip() if starter_info else "Unknown User"
            title_words = d.get('title', '').split()
            initials = "".join(word[0] for word in title_words[:2]).upper() if title_words else "D"

            has_unread = False
            last_reply_time = d.get('last_reply_at', d.get('created_at'))
            last_viewed_dict = d.get('last_viewed_by', {})
            user_last_view_time = last_viewed_dict.get(user_id_str) 

            if last_reply_time and (not user_last_view_time or last_reply_time > user_last_view_time):
                 has_unread = True

            discussion_list.append({
                '_id': str(d['_id']),
                'title': d.get('title'),
                'initials': initials,
                'starter_id': str(d.get('starter_id')),
                'starter': starter_name,
                'time': d.get('created_at').strftime('%Y-%m-%d %H:%M'),
                'last_reply_at': last_reply_time.strftime('%Y-%m-%d %H:%M'),
                'replies': d.get('reply_count', 0),
                'course_id': str(d.get('course_id')),
                'course': courses_info.get(str(d.get('course_id')), 'Unknown Course'),
                'hasUnread': has_unread 
            })

        return jsonify(discussion_list), 200
    except Exception as e:
        print(f"Error in get_discussions: {e}")
        return jsonify({"error": str(e)}), 500

# 26. CREATE NEW DISCUSSION THREAD
@app.route('/api/discussions', methods=['POST'])
@token_required
def create_discussion(current_user):
    user_id = current_user.get('_id')
    user_name = f"{current_user.get('firstName')} {current_user.get('lastName')}"

    data = request.get_json()
    if not data or not data.get('title') or not data.get('course_id') or not data.get('content'):
        return jsonify({"error": "Missing title, course_id, or content"}), 400

    course_id_str = data['course_id']

    if not can_access_course_discussion(current_user, course_id_str):
        return jsonify({"error": "You do not have permission to post in this course's discussion"}), 403

    try:
        now = datetime.datetime.utcnow()
        discussion_result = discussions_collection.insert_one({
            'title': data['title'],
            'course_id': ObjectId(course_id_str),
            'starter_id': user_id,
            'created_at': now,
            'last_reply_at': now, 
            'reply_count': 0 
        })

        new_discussion_id = discussion_result.inserted_id

        replies_collection.insert_one({
            'discussion_id': new_discussion_id,
            'user_id': user_id,
            'user_name': user_name,
            'content': data['content'],
            'created_at': now
        })

        return jsonify({"message": "Discussion started successfully", "discussion_id": str(new_discussion_id)}), 201

    except Exception as e:
        print(f"Error in create_discussion: {e}") 
        return jsonify({"error": str(e)}), 500
    
# 27. GET REPLIES
@app.route('/api/discussions/<discussion_id>/replies', methods=['GET'])
@token_required
def get_replies(current_user, discussion_id):
    user_id = current_user.get('_id')
    user_id_str = str(user_id) 

    try:
        discussion_object_id = ObjectId(discussion_id)
        discussion = discussions_collection.find_one({'_id': discussion_object_id})
        if not discussion:
            return jsonify({"error": "Discussion not found"}), 404

        if not can_access_course_discussion(current_user, str(discussion.get('course_id'))):
             return jsonify({"error": "Permission denied to view this discussion"}), 403

        replies_db = list(replies_collection.find({'discussion_id': discussion_object_id}).sort("created_at", 1))

        replies_list = []
        for r in replies_db:
             replies_list.append({
                 '_id': str(r['_id']),
                 'user_id': str(r.get('user_id')),
                 'user_name': r.get('user_name', 'Unknown User'),
                 'content': r.get('content'),
                 'created_at': r.get('created_at').strftime('%Y-%m-%d %H:%M')
             })

        now = datetime.datetime.utcnow()
        update_field = f"last_viewed_by.{user_id_str}"
        discussions_collection.update_one(
            {'_id': discussion_object_id},
            {'$set': {update_field: now}}
        )

        return jsonify({
            'discussion_title': discussion.get('title'),
            'course_id': str(discussion.get('course_id')),
            'replies': replies_list
            }), 200

    except Exception as e:
        print(f"Error in get_replies: {e}")
        return jsonify({"error": str(e)}), 500

# 28. POST A NEW REPLY
@app.route('/api/discussions/<discussion_id>/replies', methods=['POST'])
@token_required
def post_reply(current_user, discussion_id):
    user_id = current_user.get('_id')
    user_name = f"{current_user.get('firstName')} {current_user.get('lastName')}"

    data = request.get_json()
    if not data or not data.get('content'):
        return jsonify({"error": "Missing reply content"}), 400

    try:
        discussion_object_id = ObjectId(discussion_id)
        discussion = discussions_collection.find_one({'_id': discussion_object_id})
        if not discussion:
            return jsonify({"error": "Discussion not found"}), 404

        if not can_access_course_discussion(current_user, str(discussion.get('course_id'))):
             return jsonify({"error": "Permission denied to reply in this discussion"}), 403

        now = datetime.datetime.utcnow()
        replies_collection.insert_one({
            'discussion_id': discussion_object_id,
            'user_id': user_id,
            'user_name': user_name,
            'content': data['content'],
            'created_at': now
        })

        discussions_collection.update_one(
            {'_id': discussion_object_id},
            {
                '$set': {'last_reply_at': now},
                '$inc': {'reply_count': 1}
            }
        )

        return jsonify({"message": "Reply posted successfully"}), 201

    except Exception as e:
        print(f"Error in post_reply: {e}")
        return jsonify({"error": str(e)}), 500
    
# === ASSESSMENT MANAGEMENT ===

# 29. CREATE NEW ASSESSMENT
@app.route('/api/assessments', methods=['POST'])
@token_required
def create_assessment(current_user):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin', 'instructor']:
        return jsonify({"error": "Permission denied"}), 403

    try:
        data = request.form
        required_fields = ['title', 'course_id', 'type', 'due_date', 'status', 'total_points']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        if 'assignment_file' not in request.files:
            return jsonify({'message': 'Assignment file is missing'}), 400

        file = request.files['assignment_file']
        if file.filename == '':
            return jsonify({'message': 'No selected file'}), 400

        course_id_to_link = ObjectId(data['course_id'])

        if not can_manage_course(current_user, course_id_to_link):
            return jsonify({"error": "Cannot add assessment to this course"}), 403

        filename = ""
        file_path = ""
        if file:
            timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            filename = secure_filename(f"{timestamp}_{file.filename}")
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)

        try:
            due_date_dt = datetime.datetime.fromisoformat(data['due_date'])
        except ValueError:
            return jsonify({"error": "Invalid date/time format for due_date. Use YYYY-MM-DDTHH:MM."}), 400

        new_assessment = {
            'title': data['title'],
            'course_id': course_id_to_link,
            'instructor_id': current_user['_id'],
            'type': data['type'],
            'instructions': data.get('instructions', ''),
            'due_date': due_date_dt,
            'status': data['status'],
            'total_points': data.get('total_points', 100),
            'submission_count': 0,
            'created_at': datetime.datetime.utcnow(),
            'assignment_file_path': file_path,  
            'assignment_file_name': filename   
        }
        assessments_collection.insert_one(new_assessment)
        return jsonify({"message": "Assessment created successfully"}), 201
    
    except Exception as e:
        print(f"Error creating assessment: {e}")
        return jsonify({"error": str(e)}), 500


# 30. GET ASSESSMENTS
@app.route('/api/assessments', methods=['GET'])
@token_required
def get_assessments(current_user):
    role = current_user.get('role')
    user_id = current_user.get('_id')
    course_id_filter = request.args.get('courseId')

    if role not in ['admin', 'super_admin', 'instructor', 'student']:
        return jsonify({"error": "Permission denied"}), 403

    try:
        query = {}

        # --- INSTRUCTOR/ADMIN ---
        if role == 'instructor':
            query['instructor_id'] = user_id
            if course_id_filter and course_id_filter != "All":
                query['course_id'] = ObjectId(course_id_filter)
        elif role in ['admin', 'super_admin']:
            if course_id_filter and course_id_filter != "All":
                query['course_id'] = ObjectId(course_id_filter)
        
        # --- STUDENT LOGIC ---
        elif role == 'student':
            enrolled_courses = list(courses_collection.find({'enrolled_students': user_id}, {'_id': 1}))
            enrolled_course_ids = [c['_id'] for c in enrolled_courses]

            query = {
                'course_id': {'$in': enrolled_course_ids},
                'status': 'Published' # Students only see published
            }
            if course_id_filter and course_id_filter != "All":
                obj_id = ObjectId(course_id_filter)
                if obj_id in enrolled_course_ids:
                    query['course_id'] = obj_id

        # 1. Fetch Assessments
        assessments_db = list(assessments_collection.find(query).sort("due_date", 1))

        # 2. Optimization: specific logic for students to get THEIR submission status
        student_submission_map = {}
        if role == 'student':
            # Get all assessment IDs from the result
            assessment_ids = [a['_id'] for a in assessments_db]
            # Find submissions by this student for these assessments
            my_submissions = list(submissions_collection.find({
                'student_id': user_id,
                'assessment_id': {'$in': assessment_ids}
            }))
            # Create a lookup map: { 'assessment_id_string': 'Submitted/Graded' }
            for sub in my_submissions:
                student_submission_map[str(sub['assessment_id'])] = {
                    'status': sub.get('status', 'Submitted'),
                    'grade': sub.get('grade')
                }

        # 3. Get Course Names
        course_ids_needed = {a.get('course_id') for a in assessments_db if a.get('course_id')}
        courses_info = {str(c['_id']): c.get('title', 'N/A') for c in courses_collection.find({'_id': {'$in': list(course_ids_needed)}}, {'title': 1})}

        assessment_list = []
        for a in assessments_db:
            # Determine Status to show
            display_status = a.get('status', 'Draft') # Default for Admin/Instructor
            my_grade = None

            if role == 'student':
                # For students, show THEIR status (Pending, Submitted, Graded)
                sub_data = student_submission_map.get(str(a['_id']))
                if sub_data:
                    display_status = sub_data['status']
                    my_grade = sub_data['grade']
                else:
                    display_status = "Pending"

            assessment_list.append({
                '_id': str(a['_id']),
                'title': a.get('title'),
                'course_id': str(a.get('course_id')),
                'course': courses_info.get(str(a.get('course_id')), 'Unknown Course'),
                'type': a.get('type'),
                'due': a.get('due_date').isoformat() if a.get('due_date') else 'N/A',
                'status': display_status, # <--- This now shows "Pending" or "Submitted" for students
                'submissions': a.get('submission_count', 0),
                'assignment_file_path': a.get('assignment_file_path'),
                'grade': my_grade
            })

        return jsonify(assessment_list), 200
    except Exception as e:
        print(f"Error in get_assessments: {e}")
        return jsonify({"error": str(e)}), 500

# 31. UPDATE ASSESSMENT
@app.route('/api/assessments/<assessment_id>', methods=['PUT'])
@token_required
def update_assessment(current_user, assessment_id):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin', 'instructor']:
        return jsonify({"error": "Permission denied"}), 403

    try:
        data = request.form 
        assessment_object_id = ObjectId(assessment_id)
        assessment = assessments_collection.find_one({'_id': assessment_object_id})
        if not assessment:
            return jsonify({"error": "Assessment not found"}), 404

        if current_user.get('role') == 'instructor' and assessment.get('instructor_id') != current_user['_id']:
            return jsonify({"error": "Permission denied: Cannot edit this assessment"}), 403

        update_data = {}
        allowed_fields = ['title', 'course_id', 'type', 'instructions', 'due_date', 'status', 'total_points']
        
        for field in allowed_fields:
            if field in data:
                if field == 'course_id':
                     new_course_id = ObjectId(data['course_id'])
                     if not can_manage_course(current_user, new_course_id):
                           return jsonify({"error": "Cannot move assessment to this course"}), 403
                     update_data[field] = new_course_id
                     
                elif field == 'due_date':
                     try:
                         update_data[field] = datetime.datetime.fromisoformat(data['due_date'])
                     except ValueError:
                        return jsonify({"error": "Invalid date/time format for due_date. Use YYYY-MM-DDTHH:MM."}), 400
                else:
                    update_data[field] = data[field]
        
        if 'assignment_file' in request.files:
            file = request.files['assignment_file']
            if file and file.filename != '':
                old_file_path = assessment.get('assignment_file_path')
                if old_file_path and os.path.exists(old_file_path):
                    os.remove(old_file_path)
                
                timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
                filename = secure_filename(f"{timestamp}_{file.filename}")
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                update_data['assignment_file_path'] = file_path
                update_data['assignment_file_name'] = filename

        if not update_data: 
            return jsonify({"message": "No valid fields to update"}), 200

        assessments_collection.update_one(
            {'_id': assessment_object_id},
            {'$set': update_data}
        )
        return jsonify({"message": "Assessment updated successfully"}), 200

    except Exception as e:
        print(f"Error updating assessment: {e}")
        return jsonify({"error": str(e)}), 500


# 32. DELETE ASSESSMENT
@app.route('/api/assessments/<assessment_id>', methods=['DELETE'])
@token_required
def delete_assessment(current_user, assessment_id):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin', 'instructor']:
        return jsonify({"error": "Permission denied"}), 403

    try:
        assessment_object_id = ObjectId(assessment_id)
        assessment = assessments_collection.find_one({'_id': assessment_object_id})
        if not assessment:
            return jsonify({"error": "Assessment not found"}), 404

        if current_user.get('role') == 'instructor' and assessment.get('instructor_id') != current_user['_id']:
            return jsonify({"error": "Permission denied: Cannot delete this assessment"}), 403

        file_path = assessment.get('assignment_file_path')
        if file_path and os.path.exists(file_path):
            os.remove(file_path)

        result = assessments_collection.delete_one({'_id': assessment_object_id})
        if result.deleted_count == 0:
             return jsonify({"error": "Assessment not found during deletion"}), 404

        submissions_to_delete = list(submissions_collection.find({'assessment_id': assessment_object_id}))
        for sub in submissions_to_delete:
            sub_file = sub.get('submission_file_path')
            if sub_file and os.path.exists(sub_file):
                os.remove(sub_file)
        submissions_collection.delete_many({'assessment_id': assessment_object_id})

        return jsonify({"message": "Assessment and related submissions deleted"}), 200
    except Exception as e:
        print(f"Error deleting assessment: {e}")
        return jsonify({"error": str(e)}), 500

# === STUDENT ASSESSMENT VIEW ===

# 33. GET PUBLISHED ASSESSMENTS FOR A SPECIFIC COURSE
@app.route('/api/courses/<course_id>/assessments', methods=['GET'])
@token_required
def get_course_assessments_for_student(current_user, course_id):
    user_id = current_user['_id']
    role = current_user.get('role')

    try:
        course_object_id = ObjectId(course_id)
        course = courses_collection.find_one({'_id': course_object_id})
        if not course:
            return jsonify({"error": "Course not found"}), 404

        is_enrolled = user_id in course.get('enrolled_students', [])
        # Added super_admin
        can_view = role in ['admin', 'super_admin', 'instructor'] or is_enrolled

        if not can_view:
            return jsonify({"error": "You are not enrolled in this course"}), 403

        assessments_db = list(assessments_collection.find({
            'course_id': course_object_id,
            'status': 'Published' 
        }).sort("due_date", 1))

        assessment_list = []
        for a in assessments_db:
            my_submission = submissions_collection.find_one({
                'assessment_id': a['_id'],
                'student_id': user_id
            })
            
            status = "Pending"
            grade = None
            if my_submission:
                status = my_submission.get('status', 'Submitted')
                grade = my_submission.get('grade')
            
            assessment_list.append({
                '_id': str(a['_id']),
                'title': a.get('title'),
                'type': a.get('type'),
                'instructions': a.get('instructions'),
                'due': a.get('due_date').isoformat() if a.get('due_date') else 'N/A', 
                'total_points': a.get('total_points', 100),
                'assignment_file_path': a.get('assignment_file_path'),
                'status': status,
                'grade': grade    
            })

        return jsonify(assessment_list), 200

    except Exception as e:
        print(f"Error in get_course_assessments_for_student: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500


# ROUTE: STUDENT ASSESSMENT FILE DOWNLOAD
@app.route('/api/assessments/<assessment_id>/file', methods=['GET'])
@token_required
def download_assignment_file(current_user, assessment_id):
    try:
        assessment = assessments_collection.find_one({'_id': ObjectId(assessment_id)})
        if not assessment:
            return jsonify({"error": "Assessment not found"}), 404
            
        course = courses_collection.find_one({'_id': assessment['course_id']})
        is_enrolled = current_user['_id'] in course.get('enrolled_students', [])
        # Added super_admin
        can_view = current_user.get('role') in ['admin', 'super_admin', 'instructor'] or is_enrolled

        if not can_view:
            return jsonify({"error": "You are not enrolled in this course"}), 403

        file_path = assessment.get('assignment_file_path')
        file_name = assessment.get('assignment_file_name', 'assignment_file')
        
        if not file_path or not os.path.exists(file_path):
            return jsonify({"error": "File not found on server"}), 404
            
        directory = os.path.dirname(file_path)
        filename_on_server = os.path.basename(file_path)
        
        return send_from_directory(directory, filename_on_server, as_attachment=True, download_name=file_name)
        
    except Exception as e:
        print(f"Error downloading file: {e}")
        return jsonify({"error": str(e)}), 500

# ROUTE: STUDENT APNA ANSWER SUBMIT KAREGA
@app.route('/api/assessments/<assessment_id>/submit', methods=['POST'])
@token_required
def submit_assignment(current_user, assessment_id):
    user_role = current_user.get('role')
    if user_role != 'student':
        print(f"PERMISSION DENIED: User role is '{user_role}' but must be 'student'.") 
        return jsonify({"error": "Only students can submit assignments"}), 403

    try:
        assessment_object_id = ObjectId(assessment_id)
        assessment = assessments_collection.find_one({'_id': assessment_object_id})
        if not assessment:
            return jsonify({"error": "Assessment not found"}), 404

        course = courses_collection.find_one({'_id': assessment['course_id']})
        if current_user['_id'] not in course.get('enrolled_students', []):
             return jsonify({"error": "You are not enrolled in this course"}), 403

        existing_submission = submissions_collection.find_one({
            'assessment_id': assessment_object_id,
            'student_id': current_user['_id']
        })
        if existing_submission:
            return jsonify({"error": "You have already submitted this assignment"}), 409

        if 'submission_file' not in request.files:
            return jsonify({'message': 'Submission file is missing'}), 400
        file = request.files['submission_file']
        if file.filename == '':
            return jsonify({'message': 'No selected file'}), 400

        now = datetime.datetime.utcnow()
        status = "Submitted"
        if now > assessment['due_date']:
            status = "Late"

        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        original_filename = secure_filename(file.filename)
        filename_on_server = f"sub_{current_user['_id']}_{timestamp}_{original_filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename_on_server)
        file.save(file_path)

        new_submission = {
            'assessment_id': assessment_object_id,
            'student_id': current_user['_id'],
            'submission_file_path': file_path, 
            'submission_file_name': original_filename, 
            'submitted_at': now,
            'status': status,
            'grade': None, 
            'feedback': None
        }
        submissions_collection.insert_one(new_submission)
        
        assessments_collection.update_one(
            {'_id': assessment_object_id},
            {'$inc': {'submission_count': 1}}
        )

        return jsonify({"message": f"Assignment submitted successfully. (Status: {status})"}), 201

    except Exception as e:
        print(f"Error submitting assignment: {e}")
        return jsonify({"error": str(e)}), 500


# === PROGRESS TRACKING ===

# Helper
def get_course_titles_dict(course_ids):
    if not course_ids: return {}
    courses_info = courses_collection.find({'_id': {'$in': course_ids}}, {'title': 1})
    return {str(c['_id']): c.get('title', 'N/A') for c in courses_info}

# 34. GET OVERALL STATS (Admin & Super Admin)
@app.route('/api/progress/admin-stats', methods=['GET'])
@token_required
def get_admin_progress_stats(current_user):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin']:
        return jsonify({"error": "Admin access required"}), 403

    try:
        average_completion = 0 
        active_learners = users_collection.count_documents({'role': 'student', 'status': 'active'}) 
        certificates_issued = 0 

        stats = [
            {'title': 'Average Completion Rate', 'value': f"{average_completion}%", 'change': "+0%"},
            {'title': 'Active Learners', 'value': active_learners, 'change': "+0"},
            {'title': 'Certificates Issued', 'value': certificates_issued, 'change': "+0"}
        ]
        return jsonify(stats), 200
    except Exception as e:
        print(f"Error in get_admin_progress_stats: {e}")
        return jsonify({"error": str(e)}), 500

# 35. GET ALL STUDENT PROGRESS OVERVIEW
@app.route('/api/progress/all-students', methods=['GET'])
@token_required
def get_all_student_progress(current_user):
    if current_user.get('role') not in ['admin', 'super_admin', 'instructor']:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        students = list(users_collection.find({'role': 'student'}))
        progress_list = []

        for student in students:
            # Student ki enrollment check karein
            enrolled_courses = list(courses_collection.find({'enrolled_students': student['_id']}))
            
            for course in enrolled_courses:
                # 1. Total assessments dhoondein jo is course mein hain
                course_assessments = list(assessments_collection.find({'course_id': course['_id']}, {'_id': 1}))
                assessment_ids = [a['_id'] for a in course_assessments]
                
                total_tasks = len(assessment_ids)
                
                # 2. Student ne kitni submissions ki hain in assessments par
                done_count = submissions_collection.count_documents({
                    'student_id': student['_id'], 
                    'assessment_id': {'$in': assessment_ids}
                }) if total_tasks > 0 else 0
                
                # 3. Percentage Nikalna
                progress = int((done_count / total_tasks) * 100) if total_tasks > 0 else 0
                
                progress_list.append({
                    'student_id': str(student['_id']),
                    'name': f"{student.get('firstName')} {student.get('lastName')}",
                    'initials': (student.get('firstName', 'U')[0] + student.get('lastName', ' ')[0]).upper(),
                    'course': course.get('title'),
                    'progress': progress,
                    'lessons': f"{done_count}/{total_tasks}",
                    'lastActivity': "Active Now",
                    'status': "On Track" if progress > 30 else "Needs Attention"
                })

        return jsonify(progress_list), 200
    except Exception as e:
        print(f"Error: {str(e)}") # Terminal mein error dekhne ke liye
        return jsonify({"error": str(e)}), 500


# 36. GET MY PROGRESS (Student & Admin Safe)
@app.route('/api/progress/my-progress', methods=['GET'])
@token_required
def get_my_progress(current_user):
    # FIX: Allow students, admins, AND super_admins
    if current_user.get('role') not in ['student', 'admin', 'super_admin']:
        return jsonify({"error": "Access denied"}), 403

    # If the user is an ADMIN, they don't have their own progress.
    # We return empty data so the page loads without crashing.
    if current_user.get('role') in ['admin', 'super_admin']:
        return jsonify({
            'stats': [
                {'title': 'Courses Enrolled', 'value': 0},
                {'title': 'Courses Completed', 'value': 0},
                {'title': 'Average Progress', 'value': "0%"}
            ],
            'progress_details': []
        }), 200

    # --- BELOW IS THE ORIGINAL STUDENT LOGIC ---
    student_id = current_user['_id']

    try:
        enrolled_courses = list(courses_collection.find({'enrolled_students': student_id}))
        enrolled_course_ids = [c['_id'] for c in enrolled_courses]
        course_titles = get_course_titles_dict(enrolled_course_ids)

        my_progress_list = []
        total_progress_sum = 0
        courses_with_progress = 0

        for course in enrolled_courses:
            course_id = course['_id']
            course_id_str = str(course_id)
            
            progress_percent = 75 
            lessons_completed = "8/10" 
            last_activity = "N/A" 
            status = "On Track" 
            grade = "B+" 

            my_progress_list.append({
                'course_id': course_id_str,
                'course': course_titles.get(course_id_str, "Enrolled Course"),
                'progress': progress_percent,
                'lessons': lessons_completed,
                'lastActivity': last_activity,
                'status': status,
                'grade': grade 
            })
            total_progress_sum += progress_percent
            courses_with_progress += 1

        courses_enrolled_count = len(enrolled_courses)
        completed_courses_count = 0 
        average_progress = int(total_progress_sum / courses_with_progress) if courses_with_progress > 0 else 0

        my_stats = [
             {'title': 'Courses Enrolled', 'value': courses_enrolled_count},
             {'title': 'Courses Completed', 'value': completed_courses_count},
             {'title': 'Average Progress', 'value': f"{average_progress}%"}
        ]

        return jsonify({
            'stats': my_stats,
            'progress_details': my_progress_list
            }), 200
    except Exception as e:
        print(f"Error in get_my_progress: {e}")
        return jsonify({"error": str(e)}), 500
# app.py mein student-report wala route is tarah update karein:
@app.route('/api/progress/student-report/<first_name>', methods=['GET'])
@token_required
def get_student_report(current_user, first_name):
    try:
        role = current_user.get('role')
        # Frontend se aane wale name ko normalize karein
        target_name = first_name.strip()

        # --- SECURITY CHECK ---
        # Agar student hai toh check karo ke wo sirf apna hi data dekh raha hai?
        if role == 'student' and current_user.get('firstName') != target_name:
            return jsonify({"error": "Security Breach: Access Denied to other nodes"}), 403

        # 1. First Name ke mutabiq student dhoondein
        student = users_collection.find_one({'firstName': target_name}, {'password': 0})
        if not student: 
            return jsonify({"error": f"Node identifier '{target_name}' not found"}), 404

        student_id = student['_id']
        report_details = []

        # 2. Enrolled courses fetch karein (using student's object ID)
        enrolled_courses = list(courses_collection.find({'enrolled_students': student_id}))
        
        for course in enrolled_courses:
            # Assessments metadata fetch karein
            course_assessments = list(assessments_collection.find({'course_id': course['_id']}, {'_id': 1, 'title': 1, 'total_points': 1}))
            assessment_ids = [a['_id'] for a in course_assessments]
            
            # Student submissions fetch karein
            submissions = list(submissions_collection.find({
                'student_id': student_id,
                'assessment_id': {'$in': assessment_ids}
            }))

            # Calculations
            total_earned = sum([float(s.get('grade', 0)) for s in submissions if s.get('grade') is not None])
            total_possible = sum([float(a.get('total_points', 100)) for a in course_assessments])
            
            # Progress Logic (Based on submissions count vs total assessments)
            progress = int((len(submissions) / len(course_assessments)) * 100) if course_assessments else 0

            report_details.append({
                "course_name": course.get('title', 'Unknown Sector'),
                "progress": progress,
                "earned_marks": total_earned,
                "total_marks": total_possible,
                "status": "Completed" if progress == 100 else "In Progress",
                "last_submission": submissions[-1].get('submitted_at').strftime('%Y-%m-%d') if submissions else "N/A"
            })

        # Consistent JSON return
        return jsonify({
            "name": f"{student.get('firstName', 'User')} {student.get('lastName', '')}",
            "email": student.get('email'),
            "role": student.get('role'),
            "courses": report_details 
        }), 200

    except Exception as e:
        print(f"REPORT ERROR: {str(e)}")
        return jsonify({"error": "Terminal Internal Error"}), 500

# === GRADING AND SUBMISSIONS ===

# 37. GET SUBMISSIONS FOR AN ASSESSMENT
@app.route('/api/assessments/<assessment_id>/submissions', methods=['GET'])
@token_required
def get_assessment_submissions(current_user, assessment_id):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin', 'instructor']:
        return jsonify({"error": "Permission denied"}), 403

    try:
        assessment_object_id = ObjectId(assessment_id)
        assessment = assessments_collection.find_one({'_id': assessment_object_id})
        if not assessment:
            return jsonify({"error": "Assessment not found"}), 404

        if not can_manage_course(current_user, assessment.get('course_id')):
            return jsonify({"error": "Permission denied for this course"}), 403

        submissions_db = list(submissions_collection.find({'assessment_id': assessment_object_id}))

        student_ids = [s.get('student_id') for s in submissions_db if s.get('student_id')]
        students_info = {
            str(u['_id']): f"{u.get('firstName', '')} {u.get('lastName', '')}".strip()
            for u in users_collection.find({'_id': {'$in': student_ids}}, {'firstName': 1, 'lastName': 1})
        }

        submission_list = []
        for sub in submissions_db:
            student_id_str = str(sub.get('student_id'))
            submission_list.append({
                '_id': str(sub['_id']), 
                'assessment_id': str(sub.get('assessment_id')),
                'student_id': student_id_str,
                'student_name': students_info.get(student_id_str, 'Unknown Student'),
                'submitted_at': sub.get('submitted_at').strftime('%Y-%m-%d %H:%M') if sub.get('submitted_at') else 'N/A',
                'submission_file_path': sub.get('submission_file_path'), 
                'submission_file_name': sub.get('submission_file_name'), 
                'status': sub.get('status', 'Submitted'), 
                'grade': sub.get('grade'), 
                'feedback': sub.get('feedback'), 
                'max_points': assessment.get('total_points', 100)
            })

        return jsonify(submission_list), 200

    except Exception as e:
        print(f"Error in get_assessment_submissions: {e}")
        return jsonify({"error": str(e)}), 500

# 38. GRADE A SUBMISSION
@app.route('/api/submissions/<submission_id>/grade', methods=['PUT'])
@token_required
def grade_submission(current_user, submission_id):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin', 'instructor']:
        return jsonify({"error": "Permission denied"}), 403

    data = request.get_json()
    grade = data.get('grade') 
    feedback = data.get('feedback', '') 

    try:
        if grade is not None:
             grade = float(grade) 
        else:
             grade = None 
            
    except (ValueError, TypeError):
       return jsonify({"error": "Invalid grade format. Grade must be a number or null."}), 400


    try:
        submission_object_id = ObjectId(submission_id)
        submission = submissions_collection.find_one({'_id': submission_object_id})
        if not submission:
            return jsonify({"error": "Submission not found"}), 404

        assessment = assessments_collection.find_one({'_id': submission.get('assessment_id')})
        if not assessment:
             return jsonify({"error": "Associated assessment not found"}), 404

        if not can_manage_course(current_user, assessment.get('course_id')):
            return jsonify({"error": "Permission denied for this course"}), 403

        max_points = assessment.get('total_points')
        if grade is not None and max_points is not None and grade > float(max_points):
             return jsonify({"error": f"Grade cannot exceed maximum points ({max_points})"}), 400
        if grade is not None and grade < 0:
             return jsonify({"error": "Grade cannot be negative"}), 400


        update_result = submissions_collection.update_one(
            {'_id': submission_object_id},
            {'$set': {
                'grade': grade, 
                'feedback': feedback,
                'status': 'Graded' if grade is not None else submission.get('status'), 
                'graded_at': datetime.datetime.utcnow() if grade is not None else None 
            }}
        )

        if update_result.matched_count == 0:
             return jsonify({"error": "Submission not found during update"}), 404

        return jsonify({"message": "Submission graded successfully"}), 200

    except Exception as e:
        print(f"Error in grade_submission: {e}")
        return jsonify({"error": str(e)}), 500


# ROUTE: INSTRUCTOR DOWNLOAD STUDENT SUBMISSION
@app.route('/api/submissions/<submission_id>/file', methods=['GET'])
@token_required
def download_submission_file(current_user, submission_id):
    # Added super_admin
    if current_user.get('role') not in ['admin', 'super_admin', 'instructor']:
        return jsonify({"error": "Permission denied"}), 403

    try:
        submission = submissions_collection.find_one({'_id': ObjectId(submission_id)})
        if not submission:
            return jsonify({"error": "Submission not found"}), 404

        assessment = assessments_collection.find_one({'_id': submission['assessment_id']})
        if not can_manage_course(current_user, assessment.get('course_id')):
             return jsonify({"error": "Permission denied for this course"}), 403

        file_path = submission.get('submission_file_path') 
        file_name = submission.get('submission_file_name', 'submission_file') 

        if not file_path or not os.path.exists(file_path):
            return jsonify({"error": "File not found on server"}), 404
            
        directory = os.path.dirname(file_path)
        filename_on_server = os.path.basename(file_path)
        
        return send_from_directory(directory, filename_on_server, as_attachment=True, download_name=file_name)
        
    except Exception as e:
        print(f"Error downloading submission file: {e}")
        return jsonify({"error": str(e)}), 500
    
# === VALIDATION & APPROVAL ROUTES ===

# A. Submit Verification Details (Fully Updated for Extended Profile)
@app.route('/api/submit-verification', methods=['POST'])
def submit_verification():
    # 1. Get Email (Primary Key)
    email = request.form.get('email')
    if not email:
        return jsonify({"error": "Email is required"}), 400

    # 2. Collect All Text Data
    details = {
        # Personal
        'firstName': request.form.get('firstName'),
        'lastName': request.form.get('lastName'),
        'fatherName': request.form.get('fatherName'),
        'cnicNumber': request.form.get('cnicNumber'),
        'nationality': request.form.get('nationality'),
        'domicile': request.form.get('domicile'),
        
        # Contact
        'phone': request.form.get('phone'),
        'emergencyContact': request.form.get('emergencyContact'),
        'guardianContact': request.form.get('guardianContact'),
        'currentAddress': request.form.get('currentAddress'),
        'permanentAddress': request.form.get('permanentAddress'),
        
        # Role Specific
        'qualification': request.form.get('qualification'),
        'experience': request.form.get('experience'),
        'subject': request.form.get('subject'),
        'adminCode': request.form.get('adminCode'),
        
        'submitted_at': datetime.datetime.utcnow()
    }

    # 3. Handle File Uploads (Instructor Only)
    files_to_save = ['passportPhoto', 'cnicFront', 'cnicBack', 'degreeDocument']
    
    for file_key in files_to_save:
        if file_key in request.files:
            file = request.files[file_key]
            if file and file.filename != '':
                # Safe Filename Generation
                safe_email = email.replace('@', '_').replace('.', '_')
                original_name = secure_filename(file.filename)
                # Format: email_filetype_originalName
                new_filename = f"{safe_email}_{file_key}_{original_name}"
                
                # Save to Physical Folder
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
                file.save(file_path)
                
                # Save Filename to DB
                details[f'{file_key}_path'] = new_filename

    try:
        # 4. Update Database
        result = users_collection.update_one(
            {'email': email},
            {'$set': {
                'verification_data': details, 
                'status': 'pending',
                # Optional: Update main names if user corrected them here
                'firstName': request.form.get('firstName') or 'User',
                'lastName': request.form.get('lastName') or ''
            }}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"message": "Verification profile submitted successfully"}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500


# B. Get Pending Users (For AdminApprovals)
@app.route('/api/admin/pending-users', methods=['GET'])
def get_pending_users():
    try:
        pending_users_db = list(users_collection.find({'status': 'pending'}))
        
        pending_users = []
        for user in pending_users_db:
            pending_users.append({
                '_id': str(user['_id']),
                'name': f"{user.get('firstName', '')} {user.get('lastName', '')}",
                'email': user.get('email'),
                'role': user.get('role'),
                'verification_data': user.get('verification_data', {})
            })
            
        return jsonify(pending_users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# C. Approve or Reject User
@app.route('/api/admin/action-user', methods=['POST'])
def action_user():
    data = request.get_json()
    user_id = data.get('user_id')
    action = data.get('action') 

    if not user_id or not action:
        return jsonify({"error": "Missing user_id or action"}), 400

    try:
        if action == 'Approve':
            users_collection.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': {'status': 'active'}}
            )
            return jsonify({"message": "User approved successfully"}), 200
            
        elif action == 'Reject':
            users_collection.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': {'status': 'rejected'}}
            )
            return jsonify({"message": "User rejected"}), 200
            
        else:
            return jsonify({"error": "Invalid action"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# --- ROUTE TO VIEW UPLOADED DOCUMENTS ---
@app.route('/api/uploads/<filename>', methods=['GET'])
def get_uploaded_file(filename):
    # Security: Sirf uploads folder se files serve karein
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
# === KNOWLEDGE HUB (Dev.to - Extended Limit) ===
@app.route('/api/news', methods=['GET'])
def get_education_news():
    articles_list = []
    
    # Hum in categories se data mangwayenge
    tags = ['beginners', 'career', 'productivity', 'learning', 'webdev'] 
    
    print("Fetching Articles from Dev.to...")
    
    try:
        for tag in tags:
            # --- CHANGE: Limit barha kar 30 kar di hai ---
            # Ab har tag se 30 articles ayenge (Total 150 tak ho sakte hain)
            url = f"https://dev.to/api/articles?tag={tag}&per_page=30"
            
            response = requests.get(url, timeout=10)
            data = response.json()
            
            if response.status_code == 200:
                for article in data:
                    # Sirf wahi articles lo jinme cover image ho
                    if article.get('cover_image'):
                        articles_list.append({
                            "id": article['id'],
                            "category": f"#{tag.upper()}", 
                            "title": article['title'],
                            "description": article['description'],
                            "urlToImage": article['cover_image'], 
                            "publishedAt": article['published_at'],
                            "author": article['user']['name'],
                            "readTime": f"{article['reading_time_minutes']} min read",
                            "url": article['url']
                        })
    except Exception as e:
        print(f"Error fetching from Dev.to: {e}")

    # Data ko mix karo taake har baar naya feel aye
    random.shuffle(articles_list)

    # Agar data mil gaya to return karo (Poori List)
    if len(articles_list) > 0:
        return jsonify(articles_list), 200

    # === BACKUP DATA (Agar internet na ho) ===
    print("Using Backup Data...")
    backup_articles = [
        {
            "id": 1,
            "category": "🧠 STUDY HACKS",
            "title": "The Pomodoro Technique: Mastering Focus",
            "description": "Learn how breaking your study sessions into 25-minute chunks can drastically improve your focus.",
            "urlToImage": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "publishedAt": datetime.datetime.now().strftime("%Y-%m-%d"),
            "author": "Dr. Barbara Oakley",
            "readTime": "5 min read",
            "url": "https://todoist.com/productivity-methods/pomodoro-technique"
        },
        # ... (Mazeed backup articles agar aap chahein to add kar sakte hain)
    ]
    
    return jsonify(backup_articles), 200

@app.route('/api/ask-ai', methods=['POST'])
def ask_ai():
    data = request.json
    user_message = data.get('message')
    
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

    if not user_message:
        return jsonify({"reply": "Please ask something!"}), 400

    try:
        # --- NEW SYNTAX START ---
        # 1. Client Initialize karein
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        # 2. Chat Session Create karein (History ke sath)
        # Note: 'gemini-flash-latest' ki jagah specific version 'gemini-1.5-flash' use karna zyada safe hai
        chat = client.chats.create(
            model="gemini-1.5-flash-latest",
            history=[
                {"role": "user", "parts": [{"text": "You are a helpful AI Tutor for OLMS. Keep answers short and clear."}]},
                {"role": "model", "parts": [{"text": "Understood!"}]},
            ]
        )
        
        # 3. Message Send karein
        response = chat.send_message(user_message)
        
        # 4. Response Clean karein
        clean_reply = response.text.replace("*", "").replace("#", "")
        return jsonify({"reply": clean_reply}), 200
        # --- NEW SYNTAX END ---

    except Exception as e:
        print(f"❌ AI ERROR: {e}")
        # Error detail frontend pe bhejne se debug asaan hoga (development ke liye)
        return jsonify({"reply": f"System Error: {str(e)}"}), 500
    # --- Helper Function: Generate unique Meeting ID ---
def generate_meeting_id():
    # Generates a code like "928-443-121"
    return ''.join(random.choices(string.digits, k=9))

# ==========================================
#      VIDEO CONFERENCING ROUTES (FIXED)
# ==========================================

@app.route('/api/meetings', methods=['GET'])
def get_meetings():
    if meetings_collection is None:
        return jsonify({"error": "Database not connected"}), 500
    meetings = []
    try:
        # Sort by newest created first
        for doc in meetings_collection.find().sort("created_at", -1):
            doc['_id'] = str(doc['_id'])
            meetings.append(doc)
        return jsonify(meetings), 200
    except Exception as e:
        print("Error fetching meetings:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/api/meetings/create', methods=['POST'])
def create_meeting():
    # 1. Check DB Connection
    if meetings_collection is None:
        print("❌ Error: meetings_collection is None")
        return jsonify({"error": "Database not connected. Check Python terminal."}), 500

    try:
        print("📩 Receiving Meeting Request...")
        data = request.json
        
        # 2. Validate Data
        new_meeting = {
            "title": data.get("title"),
            "course": data.get("course"),
            "date": data.get("date"),
            "time": data.get("time"),
            "link": data.get("link"),
            "host_role": data.get("role"),
            "created_at": datetime.datetime.utcnow()
        }
        
        # 3. Insert
        meetings_collection.insert_one(new_meeting)
        print("✅ Meeting Saved Successfully!")
        return jsonify({"message": "Meeting scheduled successfully!"}), 201
        
    except Exception as e:
        # 4. PRINT ACTUAL ERROR TO TERMINAL
        print("❌ CRITICAL ERROR in create_meeting:")
        traceback.print_exc() 
        return jsonify({"error": str(e)}), 500

@app.route('/api/meetings/delete/<id>', methods=['DELETE'])
def delete_meeting(id):
    if meetings_collection is None:
        return jsonify({"error": "Database not connected"}), 500
    try:
        result = meetings_collection.delete_one({"_id": ObjectId(id)})
        if result.deleted_count > 0:
            return jsonify({"message": "Meeting deleted successfully"}), 200
        else:
            return jsonify({"error": "Meeting not found"}), 404
    except Exception as e:
        return jsonify({"error": "Invalid ID"}), 400
# ==========================================
#           ANNOUNCEMENT ROUTES
# ==========================================

# 1. GET ALL ANNOUNCEMENTS
@app.route('/api/announcements', methods=['GET'])
# @token_required  <-- Agar aap chahein to ise uncomment kar dein
def get_announcements():
    # Note: Agar token_required use nahi kar rahy to 'current_user' argument hata dein
    try:
        # Sort: Newest first (-1)
        announcements_cursor = db.announcements.find().sort("date", -1)
        
        announcements = []
        for a in announcements_cursor:
            announcements.append({
                "id": str(a["_id"]),
                "title": a["title"],
                "body": a["body"],
                "date": a["date"],
                "pinned": a.get("pinned", False),
                "author": a.get("author_name", "Admin")
            })
            
        return jsonify(announcements), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 2. CREATE ANNOUNCEMENT
@app.route('/api/announcements', methods=['POST'])
# @token_required
def create_announcement():
    # Note: Token logic ke baghair hum seedha save kar rahy hain
    data = request.get_json()
    if not data or not data.get('title') or not data.get('body'):
        return jsonify({"error": "Title and body are required"}), 400

    try:
        new_announcement = {
            "title": data["title"],
            "body": data["body"],
            "pinned": data.get("pinned", False),
            "date": datetime.datetime.now().strftime("%Y-%m-%d"),
            "author_name": "Instructor", # Token ho to current_user ka naam lein
            "created_at": datetime.datetime.utcnow()
        }
        
        db.announcements.insert_one(new_announcement)
        return jsonify({"message": "Announcement posted successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 3. DELETE ANNOUNCEMENT
@app.route('/api/announcements/<announcement_id>', methods=['DELETE'])
def delete_announcement(announcement_id):
    try:
        db.announcements.delete_one({"_id": ObjectId(announcement_id)})
        return jsonify({"message": "Announcement deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 4. EDIT ANNOUNCEMENT
@app.route('/api/announcements/<announcement_id>', methods=['PUT'])
def update_announcement(announcement_id):
    data = request.get_json()
    try:
        update_fields = {
            "title": data["title"],
            "body": data["body"],
            "pinned": data.get("pinned", False)
        }
        
        db.announcements.update_one(
            {"_id": ObjectId(announcement_id)}, 
            {"$set": update_fields}
        )
        return jsonify({"message": "Announcement updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/send-otp', methods=['POST'])
def send_otp():
    try:
        data = request.json
        email = data.get('email').lower().strip()
        if not email: return jsonify({"error": "Email is required"}), 400

        existing_user = users_collection.find_one({"email": email})
        if existing_user and existing_user.get('password'):
            return jsonify({"error": "ALREADY REGISTERED!"}), 400

        # 6-digit OTP generate karein
        otp = str(random.randint(100000, 999999))
        
        # DB mein OTP save karein (expiring logic ke liye timestamp bhi dal sakte hain)
        users_collection.update_one(
            {"email": email},
            {"$set": {"temp_otp": otp, "email": email}},
            upsert=True
        )

        # Email send karein
        msg = Message('OLMS HUB - Verification Code', sender=app.config['MAIL_USERNAME'], recipients=[email])
        msg.body = f"Your verification code is: {otp}\n\nThis code is valid for 10 minutes."
        mail.send(msg)
        
        return jsonify({"message": "OTP sent successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.json
        email = data.get('email').lower().strip()
        user_otp = data.get('otp')

        user = users_collection.find_one({"email": email})
        
        if user and user.get('temp_otp') == user_otp:
            # OTP verify ho gaya
            users_collection.update_one({"email": email}, {"$unset": {"temp_otp": 1}}) # OTP delete kar dein
            return jsonify({"message": "Verified"}), 200
        else:
            return jsonify({"error": "Invalid OTP code"}), 400
    except:
        return jsonify({"error": "Verification failed"}), 400

@app.route('/api/check-link-status/<email>', methods=['GET'])
def check_link_status(email):
    user = users_collection.find_one({"email": email.lower().strip()})
    if user and user.get('link_clicked') == True:
        return jsonify({"status": "verified"}), 200
    return jsonify({"status": "waiting"}), 200
    # --- STEP 4: APPROVAL LOGIC ---
@app.route('/api/approve-user', methods=['POST'])
def approve_user():
    data = request.json
    email = data.get('email')
    
    # 1. Update Status in MongoDB
    users_collection.update_one({"email": email}, {"$set": {"status": "active"}})
    
    # 2. Send Notification Email
    msg = Message('OLMS HUB - Account Approved!', 
                  sender=app.config['MAIL_USERNAME'], 
                  recipients=[email])
    msg.body = "Congratulations! Your account has been verified. You can now access your dashboard."
    
    # Optional: HTML Email template for a beautiful 3D look in inbox
    msg.html = "<div style='background:#0B1120; color:white; padding:40px; text-align:center; border-radius:20px;'>" \
               "<h1 style='color:#10B981;'>Access Granted!</h1>" \
               "<p>Your identity has been verified by the OLMS Security Node.</p>" \
               "<a href='http://localhost:5173/auth' style='background:#10B981; color:black; padding:10px 20px; text-decoration:none; border-radius:10px;'>Login Now</a>" \
               "</div>"
    
    mail.send(msg)
    return jsonify({"message": "User approved and notified"}), 200



if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
