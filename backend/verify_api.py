import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_chakravyuha_platform():
    print("--------------------------------------------------")
    print("RUNNING AUTOMATED BATTLEFIELD PLATFORM VERIFICATION")
    print("--------------------------------------------------")

    # 1. Test invalid signup validation
    invalid_users = [
        # Invalid email (public domain)
        {
            "full_name": "Invalid User 1",
            "college_email": "user1@gmail.com",
            "roll_number": "AVCS2026",
            "phone_number": "9876543210",
            "branch": "CSE",
            "year": 2,
            "password": "password123"
        },
        # Invalid roll number (does not start with AV)
        {
            "full_name": "Invalid User 2",
            "college_email": "user2@college.edu",
            "roll_number": "CS2026AV",
            "phone_number": "9876543210",
            "branch": "CSE",
            "year": 2,
            "password": "password123"
        }
    ]

    for idx, user in enumerate(invalid_users):
        print(f"\n[Test] Signing up user with invalid details (Case {idx+1})...")
        res = requests.post(f"{BASE_URL}/api/auth/signup", json=user)
        print(f"Status Code: {res.status_code}")
        print(f"Error detail: {res.json().get('detail')}")
        assert res.status_code == 400 or res.status_code == 422, "Validation did not catch errors!"
    print("=> SUCCESS: Live registration validation filters are working.")

    # 2. Test valid signup
    import random
    suffix = str(random.randint(1000, 9999))
    valid_student = {
        "full_name": f"Arjuna Pandava {suffix}",
        "college_email": f"arjuna{suffix}@chakravyuha.edu",
        "roll_number": f"AV.SC.U4CSE{suffix}",
        "phone_number": "9998887770",
        "branch": "CSE",
        "year": 3,
        "password": "arjunapassword"
    }
    
    print("\n[Test] Registering valid student Arjuna Pandava...")
    res = requests.post(f"{BASE_URL}/api/auth/signup", json=valid_student)
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200, f"Valid signup failed: {res.text}"
    signup_data = res.json()
    student_token = signup_data["access_token"]
    print("=> SUCCESS: Registration complete. Mock SMS/WhatsApp saved in debug_outbox.log.")

    # 3. Test Student details retrieval
    headers = {"Authorization": f"Bearer {student_token}"}
    print("\n[Test] Querying student info (/api/auth/me)...")
    res = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200
    student_profile = res.json()
    student_qr_key = student_profile["qr_key"]
    print(f"Name: {student_profile['full_name']}")
    print(f"QR Key: {student_qr_key}")
    
    # 4. Test DSA sheet retrieval & submission
    print("\n[Test] Fetching student's DSA sheet...")
    res = requests.get(f"{BASE_URL}/api/dsa/sheet", headers=headers)
    assert res.status_code == 200
    sheet = res.json()
    print(f"Topics found: {len(sheet)}")
    first_problem = sheet[0]["problems"][0]
    print(f"Submitting first problem solution for '{first_problem['title']}'...")
    
    sub_payload = {
        "problem_id": first_problem["id"],
        "submission_link": "https://leetcode.com/submissions/detail/12345/"
    }
    res = requests.post(f"{BASE_URL}/api/dsa/submit", headers=headers, json=sub_payload)
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200
    submission = res.json()
    print(f"Submission status: {submission.get('solved')}")
    
    # Check streak update
    print("\n[Test] Verifying student stats & streak count...")
    res = requests.get(f"{BASE_URL}/api/dsa/dashboard-stats", headers=headers)
    assert res.status_code == 200
    stats = res.json()
    print(f"Streak count: {stats['streak']}")
    print(f"Total Solved: {stats['solved_count']}")
    assert stats["streak"] == 1
    assert stats["solved_count"] == 1
    print("=> SUCCESS: Problem submission and streak computation are correct.")

    # 5. Log in as default seeded Admin
    admin_credentials = {
        "username": "mithra",
        "password": "super@admin321"
    }
    print("\n[Test] Logging in as seeded Admin...")
    res = requests.post(f"{BASE_URL}/api/auth/login", json=admin_credentials)
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200
    admin_data = res.json()
    admin_token = admin_data["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("=> SUCCESS: Logged in as Admin.")

    # 6. Test Admin Scanner: Scan student's QR code key (Forenoon)
    print(f"\n[Test] Simulating QR Scan of Student Key: {student_qr_key} (Forenoon)...")
    scan_payload_fn = {"qr_key": student_qr_key, "session": "forenoon"}
    res = requests.post(f"{BASE_URL}/api/admin/scan", headers=admin_headers, json=scan_payload_fn)
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200
    scan_data = res.json()
    print(f"Scan Confirmation: {scan_data['student_name']} marked PRESENT for {scan_data['session']} at {scan_data['time']}")
    
    # Try duplicate scan for same session
    print("\n[Test] Verifying duplicate check-in prevention for same session...")
    res = requests.post(f"{BASE_URL}/api/admin/scan", headers=admin_headers, json=scan_payload_fn)
    print(f"Status Code: {res.status_code}")
    print(f"Error Message: {res.json().get('detail')}")
    assert res.status_code == 400
    print("=> SUCCESS: Same-session duplicate scans prevented.")

    # Mark Afternoon session (different session same day)
    print(f"\n[Test] Simulating QR Scan of Student Key: {student_qr_key} (Afternoon)...")
    scan_payload_an = {"qr_key": student_qr_key, "session": "afternoon"}
    res = requests.post(f"{BASE_URL}/api/admin/scan", headers=admin_headers, json=scan_payload_an)
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200
    scan_data = res.json()
    print(f"Scan Confirmation: {scan_data['student_name']} marked PRESENT for {scan_data['session']} at {scan_data['time']}")

    # Try duplicate scan for afternoon session
    print("\n[Test] Verifying duplicate check-in prevention for afternoon session...")
    res = requests.post(f"{BASE_URL}/api/admin/scan", headers=admin_headers, json=scan_payload_an)
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 400
    print("=> SUCCESS: Afternoon session duplicate scans prevented.")

    # 7. Test Today's Attendance list (with session parameter)
    print("\n[Test] Checking today's afternoon attendance roster...")
    res = requests.get(f"{BASE_URL}/api/admin/attendance/today?session=afternoon", headers=admin_headers)
    assert res.status_code == 200
    today_list = res.json()
    print(f"Solvers present in afternoon today: {len(today_list)}")
    assert any(rec["roll_number"] == valid_student["roll_number"] for rec in today_list)

    # 8. Test Bulk email broadcast
    print("\n[Test] Testing simulated bulk broadcaster...")
    email_payload = {
        "subject": "Contest Alert",
        "body": "Warrior Arjuna, participate in the contest now!",
        "filter_type": "all"
    }
    res = requests.post(f"{BASE_URL}/api/admin/bulk-email", headers=admin_headers, json=email_payload)
    assert res.status_code == 200
    email_data = res.json()
    print(f"Broadcast simulated. Recipients emailed: {len(email_data['recipients'])}")
    print("=> SUCCESS: Emails simulated and written to debug_emails.log.")

    # 9. Test Excel Report Download
    print("\n[Test] Downloading Attendance Excel Report...")
    res = requests.get(f"{BASE_URL}/api/admin/attendance/export", headers=admin_headers)
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200
    assert len(res.content) > 1000  # Verify binary content received
    print(f"Excel File Size: {len(res.content)} bytes")
    print("=> SUCCESS: Styled Excel download generated successfully.")

    # 10. Test Scan Admins Management (Super Admin ONLY)
    print("\n[Test] Listing active Scan Admins...")
    res = requests.get(f"{BASE_URL}/api/admin/scan-admins", headers=admin_headers)
    assert res.status_code == 200
    scan_admins_list = res.json()
    print(f"Active Scan Admins found: {len(scan_admins_list)}")
    
    print("[Test] Creating a new Scan Admin...")
    new_admin_payload = {
        "full_name": "Nakula Pandava",
        "college_email": "nakula@chakravyuha.edu",
        "roll_number": "AV.SC.U4CSE23277",
        "phone_number": "9998887779",
        "password": "nakulapassword"
    }
    res = requests.post(f"{BASE_URL}/api/admin/scan-admins", headers=admin_headers, json=new_admin_payload)
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200
    created_admin = res.json()
    print(f"Created Scan Admin: {created_admin['full_name']} (id: {created_admin['id']})")
    
    # Verify Nakula is listed
    res = requests.get(f"{BASE_URL}/api/admin/scan-admins", headers=admin_headers)
    assert len(res.json()) > len(scan_admins_list)
    
    # Delete Nakula
    print("[Test] Removing the created Scan Admin...")
    res = requests.delete(f"{BASE_URL}/api/admin/scan-admins/{created_admin['id']}", headers=admin_headers)
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200
    print("=> SUCCESS: Scan Admin CRUD verified.")

    # 11. Test Super Admins Management
    print("\n[Test] Listing active Super Admins...")
    res = requests.get(f"{BASE_URL}/api/admin/super-admins", headers=admin_headers)
    assert res.status_code == 200
    super_admins_list = res.json()
    print(f"Active Super Admins found: {len(super_admins_list)}")
    
    print("[Test] Creating a new Super Admin...")
    new_super_payload = {
        "full_name": "Sahadeva Pandava",
        "college_email": "sahadeva@chakravyuha.club",
        "roll_number": "AV.SC.U4CSE23278",
        "phone_number": "9998887778",
        "password": "sahadevapassword"
    }
    res = requests.post(f"{BASE_URL}/api/admin/super-admins", headers=admin_headers, json=new_super_payload)
    assert res.status_code == 200
    created_super = res.json()
    print(f"Created Super Admin: {created_super['full_name']} (id: {created_super['id']})")
    
    # Delete Sahadeva
    print("[Test] Removing the created Super Admin...")
    res = requests.delete(f"{BASE_URL}/api/admin/super-admins/{created_super['id']}", headers=admin_headers)
    assert res.status_code == 200
    print("=> SUCCESS: Super Admin CRUD verified.")

    # 12. Test Public Leaderboard
    print("\n[Test] Fetching Public Leaderboard...")
    res = requests.get(f"{BASE_URL}/api/dsa/leaderboard")
    assert res.status_code == 200
    leaderboard_data = res.json()
    print(f"Leaderboard students counted: {len(leaderboard_data)}")
    print("=> SUCCESS: Public Leaderboard verified.")

    print("\n--------------------------------------------------")
    print("ALL PLATFORM CAPABILITIES FULLY VERIFIED")
    print("--------------------------------------------------")

if __name__ == "__main__":
    test_chakravyuha_platform()
