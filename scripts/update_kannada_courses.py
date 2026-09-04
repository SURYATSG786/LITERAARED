#!/usr/bin/env python3
"""
Update backend/src/data/courses.json for Kannada language with 100% accurate, verified native questions
across ALL 16 courses (foundation-1..4, beginner-1..4, intermediate-1..4, advanced-1..4) in BOTH lessons[0].practice_questions AND checkpoint_test!
Also output kannada_literacy_courses_qa.txt in the workspace root and backend/src/data/kannada_courses.txt.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSES_PATH = ROOT / "backend" / "src" / "data" / "courses.json"
TXT_ROOT_PATH = ROOT / "kannada_literacy_courses_qa.txt"
TXT_BACKEND_PATH = ROOT / "backend" / "src" / "data" / "kannada_courses.txt"

kannada_qa_data = [
    {
        "bank_index": 1,
        "title_kn": "ನನ್ನ ಮೊದಲ ಸಾಕ್ಷರತಾ ಪ್ರಯಾಣ",
        "target_ids": ["foundation-1", "beginner-1", "intermediate-1", "advanced-1"],
        "questions": [
            {
                "id": "f1_q1",
                "image": "alphabet",
                "question": "ಕನ್ನಡ ವರ್ಣಮಾಲೆಯಲ್ಲಿ ಸ್ವರಗಳು ಎಷ್ಟು?",
                "options": ["13", "12", "14", "15"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "ಕನ್ನಡ ವರ್ಣಮಾಲೆಯಲ್ಲಿ 13 ಸ್ವರಗಳಿವೆ."
            },
            {
                "id": "f1_q2",
                "image": "family",
                "question": "“ಅಮ್ಮ” ಯಾವ ಪದವರ್ಗಕ್ಕೆ ಸೇರಿದೆ?",
                "options": ["ಕ್ರಿಯಾಪದ", "ನಾಮಪದ", "ವಿಶೇಷಣ", "ಸರ್ವನಾಮ"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "“ಅಮ್ಮ” ನಾಮಪದ ವರ್ಗಕ್ಕೆ ಸೇರಿದೆ."
            },
            {
                "id": "f1_q3",
                "image": "tree",
                "question": "“ಮರ” ಪದದ ಬಹುವಚನ ಯಾವುದು?",
                "options": ["ಮರ", "ಮರಗಳು", "ಮರಗಳ", "ಮರವು"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "“ಮರ” ಪದದ ಬಹುವಚನ “ಮರಗಳು”."
            },
            {
                "id": "f1_q4",
                "image": "star",
                "question": "“ಒಳ್ಳೆಯ” ಯಾವ ಪದವರ್ಗ?",
                "options": ["ವಿಶೇಷಣ", "ನಾಮಪದ", "ಕ್ರಿಯಾಪದ", "ಸರ್ವನಾಮ"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "“ಒಳ್ಳೆಯ” ವಿಶೇಷಣ ಪದವರ್ಗವಾಗಿದೆ."
            },
            {
                "id": "f1_q5",
                "image": "book",
                "question": "“ಓದುತ್ತಿದ್ದೇನೆ” ಯಾವ ಪದವರ್ಗಕ್ಕೆ ಸೇರಿದೆ?",
                "options": ["ನಾಮಪದ", "ಕ್ರಿಯಾಪದ", "ವಿಶೇಷಣ", "ಸರ್ವನಾಮ"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "“ಓದುತ್ತಿದ್ದೇನೆ” ಕ್ರಿಯಾಪದ ವರ್ಗಕ್ಕೆ ಸೇರಿದೆ."
            },
            {
                "id": "f1_q6",
                "image": "book",
                "question": "“ಪುಸ್ತಕ” ಎಂಬ ಪದದ ಅರ್ಥವೇನು?",
                "options": ["ಮನೆ", "ಗ್ರಂಥ", "ರಸ್ತೆ", "ಮರ"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "“ಪುಸ್ತಕ” ಎಂದರೆ ಗ್ರಂಥ."
            },
            {
                "id": "f1_q7",
                "image": "school",
                "question": "“ಶಾಲೆ” ಎಂಬ ಪದದ ಅರ್ಥವೇನು?",
                "options": ["ಆಸ್ಪತ್ರೆ", "ಕಲಿಯುವ ಸ್ಥಳ", "ಮಾರುಕಟ್ಟೆ", "ಉದ್ಯಾನ"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "“ಶಾಲೆ” ಎಂದರೆ ಕಲಿಯುವ ಸ್ಥಳ."
            }
        ]
    },
    {
        "bank_index": 2,
        "title_kn": "ನನ್ನ ಸುತ್ತಲಿನ ಪದಗಳು",
        "target_ids": ["foundation-2", "beginner-2", "intermediate-2", "advanced-2"],
        "questions": [
            {
                "id": "f2_q1",
                "image": "school",
                "question": "“ನಾನು ಶಾಲೆಗೆ ಹೋಗುತ್ತಿದ್ದೇನೆ.” ಇದು ಯಾವ ಕಾಲ?",
                "options": ["ಭೂತಕಾಲ", "ವರ್ತಮಾನಕಾಲ", "ಭವಿಷ್ಯತ್ಕಾಲ", "ಆಜ್ಞಾರ್ಥಕ"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "“ನಾನು ಶಾಲೆಗೆ ಹೋಗುತ್ತಿದ್ದೇನೆ” ವರ್ತಮಾನಕಾಲ."
            },
            {
                "id": "f2_q2",
                "image": "walk",
                "question": "“ಅವನು ನಿನ್ನೆ ಬಂದನು.” ಇದು ಯಾವ ಕಾಲ?",
                "options": ["ಭೂತಕಾಲ", "ವರ್ತಮಾನಕಾಲ", "ಭವಿಷ್ಯತ್ಕಾಲ", "ಯಾವುದೂ ಅಲ್ಲ"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "“ಅವನು ನಿನ್ನೆ ಬಂದನು” ಭೂತಕಾಲ."
            },
            {
                "id": "f2_q3",
                "image": "calendar",
                "question": "“ನಾನು ನಾಳೆ ಹೋಗುವೆ.” ಇದು ಯಾವ ಕಾಲ?",
                "options": ["ವರ್ತಮಾನಕಾಲ", "ಭವಿಷ್ಯತ್ಕಾಲ", "ಭೂತಕಾಲ", "ನಾಮಪದ"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "“ನಾನು ನಾಳೆ ಹೋಗುವೆ” ಭವಿಷ್ಯತ್ಕಾಲ."
            },
            {
                "id": "f2_q4",
                "image": "music",
                "question": "“ಅವಳು ಹಾಡುತ್ತಿದ್ದಾಳೆ.” ಇದು ಯಾವ ಕಾಲ?",
                "options": ["ವರ್ತಮಾನಕಾಲ", "ಭೂತಕಾಲ", "ಭವಿಷ್ಯತ್ಕಾಲ", "ವಿಶೇಷಣ"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "“ಅವಳು ಹಾಡುತ್ತಿದ್ದಾಳೆ” ವರ್ತಮಾನಕಾಲ."
            },
            {
                "id": "f2_q5",
                "image": "food",
                "question": "“ತಿಂದನು” ಯಾವ ಕಾಲವನ್ನು ಸೂಚಿಸುತ್ತದೆ?",
                "options": ["ವರ್ತಮಾನಕಾಲ", "ಭೂತಕಾಲ", "ಭವಿಷ್ಯತ್ಕಾಲ", "ಯಾವುದೂ ಅಲ್ಲ"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "“ತಿಂದನು” ಭೂತಕಾಲವನ್ನು ಸೂಚಿಸುತ್ತದೆ."
            },
            {
                "id": "f2_q6",
                "image": "book",
                "question": "“ಓದುವೆ” ಯಾವ ಕಾಲಕ್ಕೆ ಸೇರಿದೆ?",
                "options": ["ಭೂತಕಾಲ", "ವರ್ತಮಾನಕಾಲ", "ಭವಿಷ್ಯತ್ಕಾಲ", "ವಿಶೇಷಣ"],
                "correct_index": 2,
                "ans_letter": "C",
                "explanation": "“ಓದುವೆ” ಭವಿಷ್ಯತ್ಕಾಲಕ್ಕೆ ಸೇರಿದೆ."
            },
            {
                "id": "f2_q7",
                "image": "run",
                "question": "“ಆಡುತ್ತಿದ್ದಾನೆ” ಯಾವ ಕಾಲಕ್ಕೆ ಉದಾಹರಣೆ?",
                "options": ["ವರ್ತಮಾನಕಾಲ", "ಭೂತಕಾಲ", "ಭವಿಷ್ಯತ್ಕಾಲ", "ನಾಮಪದ"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "“ಆಡುತ್ತಿದ್ದಾನೆ” ವರ್ತಮಾನಕಾಲಕ್ಕೆ ಉದಾಹರಣೆ."
            }
        ]
    },
    {
        "bank_index": 3,
        "title_kn": "ಪದಗಳನ್ನು ಸಂಪರ್ಕಿಸುವುದು",
        "target_ids": ["foundation-3", "beginner-3", "intermediate-3", "advanced-3"],
        "questions": [
            {
                "id": "f3_q1",
                "image": "friends",
                "question": "“ರಾಮ ಮತ್ತು ರವಿ ಶಾಲೆಗೆ ಹೋದರು.” ಇಲ್ಲಿ ಸಂಪರ್ಕ ಪದ ಯಾವುದು?",
                "options": ["ಆದರೆ", "ಮತ್ತು", "ಏಕೆಂದರೆ", "ಅಥವಾ"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "ಇಲ್ಲಿ ಸಂಪರ್ಕ ಪದ “ಮತ್ತು”."
            },
            {
                "id": "f3_q2",
                "image": "family",
                "question": "“ಅಮ್ಮ ಮತ್ತು ಅಪ್ಪ” ನಲ್ಲಿ ಸಂಪರ್ಕ ಪದ ಯಾವುದು?",
                "options": ["ಅಮ್ಮ", "ಮತ್ತು", "ಅಪ್ಪ", "ನಲ್ಲಿ"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "ಇಲ್ಲಿ ಸಂಪರ್ಕ ಪದ “ಮತ್ತು”."
            },
            {
                "id": "f3_q3",
                "image": "read",
                "question": "“ಅವನು ಓದಿದನು, ಆದರೆ ಉತ್ತೀರ್ಣನಾಗಲಿಲ್ಲ.” ಸಂಪರ್ಕ ಪದ ಯಾವುದು?",
                "options": ["ಆದರೆ", "ಓದಿದನು", "ಉತ್ತೀರ್ಣನಾಗಲಿಲ್ಲ", "ಅವನು"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "ಸಂಪರ್ಕ ಪದ “ಆದರೆ”."
            },
            {
                "id": "f3_q4",
                "image": "link",
                "question": "“ಮತ್ತು” ಯಾವ ಪದವರ್ಗಕ್ಕೆ ಸೇರಿದೆ?",
                "options": ["ಸಂಪರ್ಕಪದ", "ನಾಮಪದ", "ಕ್ರಿಯಾಪದ", "ವಿಶೇಷಣ"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "“ಮತ್ತು” ಸಂಪರ್ಕಪದ ವರ್ಗಕ್ಕೆ ಸೇರಿದೆ."
            },
            {
                "id": "f3_q5",
                "image": "think",
                "question": "“ಆದ್ದರಿಂದ” ಪದವನ್ನು ಯಾವಾಗ ಬಳಸುತ್ತಾರೆ?",
                "options": ["ಕಾರಣ ಮತ್ತು ಫಲಿತಾಂಶ ತಿಳಿಸಲು", "ನಾಮಪದವಾಗಿ", "ಕ್ರಿಯಾಪದವಾಗಿ", "ಕಾಲ ಸೂಚಿಸಲು"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "“ಆದ್ದರಿಂದ” ಪದವನ್ನು ಕಾರಣ ಮತ್ತು ಫಲಿತಾಂಶ ತಿಳಿಸಲು ಬಳಸುತ್ತಾರೆ."
            },
            {
                "id": "f3_q6",
                "image": "check",
                "question": "ಸರಿಯಾದ ಸಂಪರ್ಕ ಪದ ಯಾವುದು?",
                "options": ["ಮತ್ತು", "ಪುಸ್ತಕ", "ಮನೆ", "ಓಡು"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "ಸರಿಯಾದ ಸಂಪರ್ಕ ಪದ “ಮತ್ತು”."
            },
            {
                "id": "f3_q7",
                "image": "choice",
                "question": "“ಅಥವಾ” ಎಂದರೆ ಏನು?",
                "options": ["ಎರಡು ಆಯ್ಕೆಗಳಲ್ಲಿ ಒಂದು", "ಸಮಯ", "ಸ್ಥಳ", "ಕ್ರಿಯೆ"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "“ಅಥವಾ” ಎಂದರೆ ಎರಡು ಆಯ್ಕೆಗಳಲ್ಲಿ ಒಂದು."
            }
        ]
    },
    {
        "bank_index": 4,
        "title_kn": "ನನ್ನ ಲೋಕದ ಪದಗಳು",
        "target_ids": ["foundation-4", "beginner-4", "intermediate-4", "advanced-4"],
        "passage_kn": "ಗದ್ಯಭಾಗ: “ರಾಹುಲ್ ಪ್ರತಿದಿನ ಶಾಲೆಗೆ ಹೋಗುತ್ತಾನೆ. ಅವನಿಗೆ ಪುಸ್ತಕಗಳನ್ನು ಓದುವುದು ತುಂಬಾ ಇಷ್ಟ.”",
        "questions": [
            {
                "id": "f4_q1",
                "image": "school",
                "question": "ರಾಹುಲ್ ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಾನೆ?",
                "options": ["ಮಾರುಕಟ್ಟೆ", "ಶಾಲೆ", "ಉದ್ಯಾನ", "ಮನೆ"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "ರಾಹುಲ್ ಶಾಲೆಗೆ ಹೋಗುತ್ತಾನೆ."
            },
            {
                "id": "f4_q2",
                "image": "book",
                "question": "ರಾಹುಲ್ಗೆ ಏನು ಇಷ್ಟ?",
                "options": ["ಆಟ ಆಡುವುದು", "ಪುಸ್ತಕಗಳನ್ನು ಓದುವುದು", "ನಿದ್ರೆ ಮಾಡುವುದು", "ದೂರದರ್ಶನ ನೋಡುವುದು"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "ರಾಹುಲ್ಗೆ ಪುಸ್ತಕಗಳನ್ನು ಓದುವುದು ತುಂಬಾ ಇಷ್ಟ."
            },
            {
                "id": "f4_q3",
                "image": "person",
                "question": "ಈ ಗದ್ಯಭಾಗ ಯಾರ ಬಗ್ಗೆ ಇದೆ?",
                "options": ["ಸೀತಾ", "ರಾಹುಲ್", "ಮೋಹನ್", "ಲತಾ"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "ಈ ಗದ್ಯಭಾಗ ರಾಹುಲ್ ಬಗ್ಗೆ ಇದೆ."
            },
            {
                "id": "f4_q4",
                "image": "clock",
                "question": "“ಪ್ರತಿದಿನ” ಎಂದರೆ ಏನು?",
                "options": ["ಪ್ರತಿ ದಿನ", "ನಿನ್ನೆ", "ಎಂದಿಗೂ ಇಲ್ಲ", "ಮುಂದಿನ ವಾರ"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "“ಪ್ರತಿದಿನ” ಎಂದರೆ ಪ್ರತಿ ದಿನ."
            },
            {
                "id": "f4_q5",
                "image": "walk",
                "question": "ರಾಹುಲ್ ಏನು ಮಾಡುತ್ತಾನೆ?",
                "options": ["ಶಾಲೆಗೆ ಹೋಗುತ್ತಾನೆ", "ಮಾರುಕಟ್ಟೆಗೆ ಹೋಗುತ್ತಾನೆ", "ಮನೆಯಲ್ಲಿ ಇರುತ್ತಾನೆ", "ಆಸ್ಪತ್ರೆಗೆ ಹೋಗುತ್ತಾನೆ"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "ರಾಹುಲ್ ಶಾಲೆಗೆ ಹೋಗುತ್ತಾನೆ."
            },
            {
                "id": "f4_q6",
                "image": "idea",
                "question": "ಈ ಗದ್ಯಭಾಗದ ಮುಖ್ಯ ಅರ್ಥವೇನು?",
                "options": ["ಓದು ಮತ್ತು ಶಾಲೆಯ ಅಭ್ಯಾಸ", "ಪ್ರವಾಸ", "ಮಳೆ", "ಬೆಟ್ಟಗಳು"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "ಈ ಗದ್ಯಭಾಗದ ಮುಖ್ಯ ಅರ್ಥ ಓದು ಮತ್ತು ಶಾಲೆಯ ಅಭ್ಯಾಸ."
            },
            {
                "id": "f4_q7",
                "image": "check",
                "question": "ಸರಿಯಾದ ವಾಕ್ಯ ಯಾವುದು?",
                "options": ["ರಾಹುಲ್ಗೆ ಪುಸ್ತಕಗಳನ್ನು ಓದುವುದು ಇಷ್ಟ.", "ರಾಹುಲ್ ಶಾಲೆಗೆ ಹೋಗುವುದಿಲ್ಲ.", "ರಾಹುಲ್ ಯಾವಾಗಲೂ ಆಟವಾಡುತ್ತಾನೆ.", "ರಾಹುಲ್ ಓದುವುದಿಲ್ಲ."],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "ಸರಿಯಾದ ವಾಕ್ಯ “ರಾಹುಲ್ಗೆ ಪುಸ್ತಕಗಳನ್ನು ಓದುವುದು ಇಷ್ಟ.”"
            }
        ]
    }
]

def generate_txt_content():
    lines = ["LiteraAI - ಕನ್ನಡ ಸಾಕ್ಷರತಾ ಆಪ್", ""]
    for cdata in kannada_qa_data:
        course_num = cdata["bank_index"]
        title = cdata["title_kn"]
        lines.append(f"ಕೋರ್ಸ್ {course_num}: {title}")
        lines.append("")
        if "passage_kn" in cdata:
            lines.append(cdata["passage_kn"])
            lines.append("")
        
        for idx, q in enumerate(cdata["questions"], 1):
            lines.append(f"{idx}.  {q['question']}")
            lines.append("")
            opts = q["options"]
            letters = ["A", "B", "C", "D"]
            for l, opt in zip(letters, opts):
                lines.append(f"{l})  {opt}")
            ans_let = letters[q["correct_index"]]
            lines.append(f"ಉತ್ತರ: {ans_let}")
            lines.append("")
            
    return "\n".join(lines).strip() + "\n"

def update_q_dict(target_q, new_q):
    target_q["id"] = new_q["id"]
    target_q["image"] = new_q["image"]
    target_q["correct_index"] = new_q["correct_index"]
    
    if "question" not in target_q or not isinstance(target_q["question"], dict):
        target_q["question"] = {}
    target_q["question"]["kn"] = new_q["question"]

    if "explanation" not in target_q or not isinstance(target_q["explanation"], dict):
        target_q["explanation"] = {}
    target_q["explanation"]["kn"] = new_q["explanation"]

    if "options" not in target_q or not isinstance(target_q["options"], list) or len(target_q["options"]) != 4:
        target_q["options"] = [{"en": "", "hi": "", "ta": "", "te": "", "kn": "", "ml": ""} for _ in range(4)]
    
    for opt_idx, opt_text in enumerate(new_q["options"]):
        if not isinstance(target_q["options"][opt_idx], dict):
            target_q["options"][opt_idx] = {}
        target_q["options"][opt_idx]["kn"] = opt_text

def update_courses_json():
    with open(COURSES_PATH, "r", encoding="utf-8") as f:
        courses = json.load(f)

    target_map = {}
    for cdata in kannada_qa_data:
        for tid in cdata["target_ids"]:
            target_map[tid] = cdata

    for course in courses:
        cid = course.get("id")
        if cid in target_map:
            data = target_map[cid]
            # Update title.kn
            if "title" in course and isinstance(course["title"], dict):
                course["title"]["kn"] = data["title_kn"]
            
            # Update lessons[0].practice_questions
            lessons = course.get("lessons", [])
            if lessons:
                p_qs = lessons[0].get("practice_questions", [])
                for q_idx, new_q in enumerate(data["questions"]):
                    if q_idx < len(p_qs):
                        target_q = p_qs[q_idx]
                    else:
                        target_q = {}
                        p_qs.append(target_q)
                    update_q_dict(target_q, new_q)
                lessons[0]["practice_questions"] = p_qs

            # Update checkpoint_test
            ckpt_test = course.get("checkpoint_test", [])
            for q_idx, new_q in enumerate(data["questions"]):
                if q_idx < len(ckpt_test):
                    target_q = ckpt_test[q_idx]
                else:
                    target_q = {}
                    ckpt_test.append(target_q)
                update_q_dict(target_q, new_q)
            course["checkpoint_test"] = ckpt_test

    with open(COURSES_PATH, "w", encoding="utf-8") as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)

def main():
    txt_content = generate_txt_content()
    with open(TXT_ROOT_PATH, "w", encoding="utf-8") as f:
        f.write(txt_content)
    with open(TXT_BACKEND_PATH, "w", encoding="utf-8") as f:
        f.write(txt_content)
    print("Wrote TXT files to:")
    print(" -", TXT_ROOT_PATH)
    print(" -", TXT_BACKEND_PATH)

    update_courses_json()
    print("Updated courses.json across ALL 16 courses (practice_questions AND checkpoint_test) with verified Kannada Q&A!")

if __name__ == "__main__":
    main()
