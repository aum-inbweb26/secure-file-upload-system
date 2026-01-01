# Postman Security Testing Guide (AV-Safe)

This guide uses **harmless text files** to test the security logic. These files will **not** trigger Windows Defender because they do not contain actual executable code, but they **will** correctly test the file upload restrictions (extensions, double-extensions, and magic bytes).

## Setup
1. Open **Postman**.
2. Create a POST request to: `http://localhost:3000/upload`
3. Select **Body** -> **form-data**.
4. Key: `file` (File type).

Use the files generated in the `safe_payloads/` folder.

---

## 1. Test: Double Extension (The "Hiding" Attack)
*Verifies that `file.php.pdf` is rejected.*

*   **File:** `safe_payloads/test_double.php.pdf`
*   **Content:** Plain text (Safe).
*   **Expected Status:** `400 Bad Request`
*   **Expected Error:** `"Potential double extension attack detected..."`

---

## 2. Test: Bad Extension (The "Direct" Attack)
*Verifies that `.php` files are rejected based on extension.*

*   **File:** `safe_payloads/test_blocked.php` 
*   **Content:** Plain text (Safe).
*   **Expected Status:** `400 Bad Request`
*   **Expected Error:** `"One or more files has an invalid extension..."`

---

## 3. Test: Magic Byte Spoofing (The "Fake ID" Attack)
*Verifies that a text file renamed to `.pdf` is bested by deep inspection.*

*   **File:** `safe_payloads/test_fake.pdf`
*   **Content:** Plain text (Safe).
*   **Expected Status:** `400 Bad Request`
*   **Expected Error:** `"Security validation failed: Magic-byte check failed..."`

---

## 4. Test: Valid PDF (Success Case)
*Verifies that a real PDF is accepted.*

*   **File:** `safe_payloads/valid_doc.pdf`
*   **Content:** Minimal valid PDF structure.
*   **Expected Status:** `200 OK`
*   **Expected Body:** JSON with `filename` and `detectedType: "application/pdf"`.
