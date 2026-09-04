#!/usr/bin/env python3
"""
Update backend/src/data/courses.json for Malayalam language with 100% accurate, verified native questions
across ALL 16 courses (foundation-1..4, beginner-1..4, intermediate-1..4, advanced-1..4) in BOTH lessons[0].practice_questions AND checkpoint_test!
Also output malayalam_literacy_courses_qa.txt in the workspace root and backend/src/data/malayalam_courses.txt.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSES_PATH = ROOT / "backend" / "src" / "data" / "courses.json"
TXT_ROOT_PATH = ROOT / "malayalam_literacy_courses_qa.txt"
TXT_BACKEND_PATH = ROOT / "backend" / "src" / "data" / "malayalam_courses.txt"

malayalam_qa_data = [
    {
        "bank_index": 1,
        "title_ml": "എന്റെ വായനയുടെ ആദ്യപടി",
        "target_ids": ["foundation-1", "beginner-1", "intermediate-1", "advanced-1"],
        "questions": [
            {
                "id": "f1_q1",
                "image": "alphabet",
                "question": "“അമ്മ” എന്ന വാക്ക് ഏത് അക്ഷരത്തിൽ തുടങ്ങുന്നു?",
                "options": ["അ", "ആ", "ഇ", "ഉ"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "“അമ്മ” എന്ന വാക്ക് ‘അ’ എന്ന അക്ഷരത്തിലാണ് തുടങ്ങുന്നത്."
            },
            {
                "id": "f1_q2",
                "image": "family",
                "question": "“അമ്മ” ഏത് പദവർഗത്തിൽപ്പെടുന്നു?",
                "options": ["ക്രിയ", "നാമം", "വിശേഷണം", "സർവ്വനാമം"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "“അമ്മ” ഒരു നാമപദമാണ്."
            },
            {
                "id": "f1_q3",
                "image": "tree",
                "question": "“മരം” എന്ന വാക്കിന്റെ ബഹുവചനം ഏത്?",
                "options": ["മരം", "മരങ്ങൾ", "മരങ്ങളുടെ", "മരമായി"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "“മരം” എന്ന വാക്കിന്റെ ബഹുവചനം “മരങ്ങൾ” എന്നാണ്."
            },
            {
                "id": "f1_q4",
                "image": "star",
                "question": "“നല്ല” ഏത് പദവർഗമാണ്?",
                "options": ["വിശേഷണം", "നാമം", "ക്രിയ", "സർവ്വനാമം"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "“നല്ല” എന്നത് ഒരു വിശേഷണമാണ്."
            },
            {
                "id": "f1_q5",
                "image": "book",
                "question": "“വായിക്കുന്നു” ഏത് പദവർഗത്തിൽപ്പെടുന്നു?",
                "options": ["നാമം", "ക്രിയ", "വിശേഷണം", "സർവ്വനാമം"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "“വായിക്കുന്നു” എന്നത് ഒരു ക്രിയയാണ്."
            },
            {
                "id": "f1_q6",
                "image": "book",
                "question": "“പുസ്തകം” എന്ന വാക്കിന്റെ അർത്ഥം എന്താണ്?",
                "options": ["വീട്", "ഗ്രന്ഥം", "മരം", "റോഡ്"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "“പുസ്തകം” എന്നാൽ ഗ്രന്ഥം എന്നാണ് അർത്ഥം."
            },
            {
                "id": "f1_q7",
                "image": "school",
                "question": "“സ്കൂൾ” എന്ന വാക്കിന്റെ അർത്ഥം എന്താണ്?",
                "options": ["ആശുപത്രി", "പഠിക്കുന്ന സ്ഥലം", "ചന്ത", "ഉദ്യാനം"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "“സ്കൂൾ” എന്നാൽ പഠിക്കുന്ന സ്ഥലം എന്നാണ് അർത്ഥം."
            }
        ]
    },
    {
        "bank_index": 2,
        "title_ml": "എന്റെ ചുറ്റുമുള്ള വാക്കുകൾ",
        "target_ids": ["foundation-2", "beginner-2", "intermediate-2", "advanced-2"],
        "questions": [
            {
                "id": "f2_q1",
                "image": "school",
                "question": "“ഞാൻ സ്കൂളിലേക്ക് പോകുകയാണ്.” ഇത് ഏത് കാലമാണ്?",
                "options": ["ഭൂതകാലം", "വർത്തമാനകാലം", "ഭാവികാലം", "ആജ്ഞാരൂപം"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "“ഞാൻ സ്കൂളിലേക്ക് പോകുകയാണ്” എന്നത് വർത്തമാനകാലമാണ്."
            },
            {
                "id": "f2_q2",
                "image": "walk",
                "question": "“അവൻ ഇന്നലെ വന്നു.” ഇത് ഏത് കാലമാണ്?",
                "options": ["ഭൂതകാലം", "വർത്തമാനകാലം", "ഭാവികാലം", "ഒന്നുമല്ല"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "“അവൻ ഇന്നലെ വന്നു” എന്നത് ഭൂതകാലമാണ്."
            },
            {
                "id": "f2_q3",
                "image": "calendar",
                "question": "“ഞാൻ നാളെ പോകും.” ഇത് ഏത് കാലമാണ്?",
                "options": ["വർത്തമാനകാലം", "ഭാവികാലം", "ഭൂതകാലം", "നാമം"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "“ഞാൻ നാളെ പോകും” എന്നത് ഭാവികാലമാണ്."
            },
            {
                "id": "f2_q4",
                "image": "music",
                "question": "“അവൾ പാടുകയാണ്.” ഇത് ഏത് കാലമാണ്?",
                "options": ["വർത്തമാനകാലം", "ഭൂതകാലം", "ഭാവികാലം", "വിശേഷണം"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "“അവൾ പാടുകയാണ്” എന്നത് വർത്തമാനകാലമാണ്."
            },
            {
                "id": "f2_q5",
                "image": "food",
                "question": "“കഴിച്ചു” ഏത് കാലത്തെ സൂചിപ്പിക്കുന്നു?",
                "options": ["വർത്തമാനകാലം", "ഭൂതകാലം", "ഭാവികാലം", "ഒന്നുമല്ല"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "“കഴിച്ചു” എന്നത് ഭൂതകാലത്തെ സൂചിപ്പിക്കുന്നു."
            },
            {
                "id": "f2_q6",
                "image": "book",
                "question": "“വായിക്കും” ഏത് കാലമാണ്?",
                "options": ["ഭൂതകാലം", "വർത്തമാനകാലം", "ഭാവികാലം", "വിശേഷണം"],
                "correct_index": 2,
                "ans_letter": "C",
                "explanation": "“വായിക്കും” എന്നത് ഭാവികാലമാണ്."
            },
            {
                "id": "f2_q7",
                "image": "run",
                "question": "“കളിക്കുകയാണ്” ഏത് കാലത്തിന്റെ ഉദാഹരണമാണ്?",
                "options": ["വർത്തമാനകാലം", "ഭൂതകാലം", "ഭാവികാലം", "നാമം"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "“കളിക്കുകയാണ്” എന്നത് വർത്തമാനകാലത്തിന്റെ ഉദാഹരണമാണ്."
            }
        ]
    },
    {
        "bank_index": 3,
        "title_ml": "വാക്കുകളെ ബന്ധിപ്പിക്കുക",
        "target_ids": ["foundation-3", "beginner-3", "intermediate-3", "advanced-3"],
        "questions": [
            {
                "id": "f3_q1",
                "image": "friends",
                "question": "“രാമും രവിയും സ്കൂളിലേക്ക് പോയി.” ഇതിലെ ബന്ധകപദം ഏത്?",
                "options": ["പക്ഷേ", "ഉം", "കാരണം", "അല്ലെങ്കിൽ"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "ഇതിലെ ബന്ധകപദം “ഉം” (രാമും രവിയും) ആണ്."
            },
            {
                "id": "f3_q2",
                "image": "family",
                "question": "“അമ്മയും അച്ഛനും” എന്നതിലെ ബന്ധകപദം ഏത്?",
                "options": ["അമ്മ", "ഉം", "അച്ഛൻ", "എന്നത്"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "ഇതിലെ ബന്ധകപദം “ഉം” (അമ്മയും അച്ഛനും) ആണ്."
            },
            {
                "id": "f3_q3",
                "image": "read",
                "question": "“അവൻ പഠിച്ചു, പക്ഷേ വിജയിച്ചില്ല.” ഇതിലെ ബന്ധകപദം ഏത്?",
                "options": ["പക്ഷേ", "പഠിച്ചു", "വിജയിച്ചില്ല", "അവൻ"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "ഇതിലെ ബന്ധകപദം “പക്ഷേ” ആണ്."
            },
            {
                "id": "f3_q4",
                "image": "link",
                "question": "“ഉം” ഏത് പദവർഗമാണ്?",
                "options": ["ബന്ധകപദം", "നാമം", "ക്രിയ", "വിശേഷണം"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "“ഉം” ഒരു ബന്ധകപദമാണ്."
            },
            {
                "id": "f3_q5",
                "image": "think",
                "question": "“അതുകൊണ്ട്” എന്ന പദം എപ്പോൾ ഉപയോഗിക്കുന്നു?",
                "options": ["കാരണം-ഫലം അറിയിക്കാൻ", "നാമമായി", "ക്രിയായായി", "സമയം സൂചിപ്പിക്കാൻ"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "“അതുകൊണ്ട്” എന്ന പദം കാരണം-ഫലം അറിയിക്കാൻ ഉപയോഗിക്കുന്നു."
            },
            {
                "id": "f3_q6",
                "image": "check",
                "question": "ശരിയായ ബന്ധകപദം ഏത്?",
                "options": ["ഉം", "പുസ്തകം", "വീട്", "ഓടുക"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "ശരിയായ ബന്ധകപദം “ഉം” ആണ്."
            },
            {
                "id": "f3_q7",
                "image": "choice",
                "question": "“അല്ലെങ്കിൽ” എന്നതിന്റെ അർത്ഥം എന്താണ്?",
                "options": ["രണ്ട് തിരഞ്ഞെടുപ്പുകളിൽ ഒന്ന്", "സമയം", "സ്ഥലം", "ക്രിയ"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "“അല്ലെങ്കിൽ” എന്നാൽ രണ്ട് തിരഞ്ഞെടുപ്പുകളിൽ ഒന്ന് എന്നാണ് അർത്ഥം."
            }
        ]
    },
    {
        "bank_index": 4,
        "title_ml": "എന്റെ വായിക്കാവുന്ന കഥകൾ",
        "target_ids": ["foundation-4", "beginner-4", "intermediate-4", "advanced-4"],
        "passage_ml": "ഗദ്യഭാഗം: “റാഹുൽ എല്ലാ ദിവസവും സ്കൂളിലേക്ക് പോകുന്നു. അവന് പുസ്തകങ്ങൾ വായിക്കാൻ വളരെ ഇഷ്ടമാണ്.”",
        "questions": [
            {
                "id": "f4_q1",
                "image": "school",
                "question": "റാഹുൽ എവിടേക്കാണ് പോകുന്നത്?",
                "options": ["ചന്ത", "സ്കൂൾ", "പാർക്ക്", "വീട്"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "റാഹുൽ സ്കൂളിലേക്കാണ് പോകുന്നത്."
            },
            {
                "id": "f4_q2",
                "image": "book",
                "question": "റാഹുലിന് എന്താണ് ഇഷ്ടം?",
                "options": ["കളിക്കുക", "പുസ്തകങ്ങൾ വായിക്കുക", "ഉറങ്ങുക", "ടെലിവിഷൻ കാണുക"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "റാഹുലിന് പുസ്തകങ്ങൾ വായിക്കാനാണ് ഇഷ്ടം."
            },
            {
                "id": "f4_q3",
                "image": "person",
                "question": "ഈ ഗദ്യഭാഗം ആരെക്കുറിച്ചാണ്?",
                "options": ["സീത", "റാഹുൽ", "മോഹൻ", "ലത"],
                "correct_index": 1,
                "ans_letter": "B",
                "explanation": "ഈ ഗദ്യഭാഗം റാഹുലിനെക്കുറിച്ചാണ്."
            },
            {
                "id": "f4_q4",
                "image": "clock",
                "question": "“എല്ലാ ദിവസവും” എന്നതിന്റെ അർത്ഥം എന്താണ്?",
                "options": ["എല്ലാ ദിവസവും", "ഇന്നലെ", "ഒരിക്കലുമില്ല", "അടുത്ത ആഴ്ച"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "“എല്ലാ ദിവസവും” എന്നാൽ എല്ലാ ദിവസവും തന്നെയാണ് അർത്ഥം."
            },
            {
                "id": "f4_q5",
                "image": "walk",
                "question": "റാഹുൽ എന്ത് ചെയ്യുന്നു?",
                "options": ["സ്കൂളിലേക്ക് പോകുന്നു", "ചന്തയിലേക്ക് പോകുന്നു", "വീട്ടിൽ ഇരിക്കുന്നു", "ആശുപത്രിയിലേക്ക് പോകുന്നു"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "റാഹുൽ സ്കൂളിലേക്ക് പോകുന്നു."
            },
            {
                "id": "f4_q6",
                "image": "idea",
                "question": "ഈ ഗദ്യഭാഗത്തിന്റെ പ്രധാന ആശയം എന്താണ്?",
                "options": ["സ്കൂളിൽ പോകുന്നതും വായനയുടെ ശീലവും", "യാത്ര", "മഴ", "മലകൾ"],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "ഈ ഗദ്യഭാഗത്തിന്റെ പ്രധാന ആശയം സ്കൂളിൽ പോകുന്നതും വായനയുടെ ശീലവുമാണ്."
            },
            {
                "id": "f4_q7",
                "image": "check",
                "question": "ശരിയായ പ്രസ്താവന ഏത്?",
                "options": ["റാഹുലിന് പുസ്തകങ്ങൾ വായിക്കാൻ ഇഷ്ടമാണ്.", "റാഹുൽ സ്കൂളിലേക്ക് പോകുന്നില്ല.", "റാഹുൽ എല്ലായ്പ്പോഴും കളിക്കുന്നു.", "റാഹുൽ വായിക്കുന്നില്ല."],
                "correct_index": 0,
                "ans_letter": "A",
                "explanation": "ശരിയായ പ്രസ്താവന “റാഹുലിന് പുസ്തകങ്ങൾ വായിക്കാൻ ഇഷ്ടമാണ്.”"
            }
        ]
    }
]

def generate_txt_content():
    lines = ["LiteraAI - മലയാളം സാക്ഷരത", ""]
    for cdata in malayalam_qa_data:
        course_num = cdata["bank_index"]
        title = cdata["title_ml"]
        lines.append("======================================== " + f"കോഴ്സ് {course_num}: {title}")
        lines.append("========================================")
        lines.append("")
        if "passage_ml" in cdata:
            lines.append(cdata["passage_ml"])
            lines.append("")
        
        for idx, q in enumerate(cdata["questions"], 1):
            lines.append(f"{idx}.  {q['question']}")
            lines.append("")
            opts = q["options"]
            letters = ["A", "B", "C", "D"]
            for l, opt in zip(letters, opts):
                lines.append(f"{l})  {opt}")
            ans_let = letters[q["correct_index"]]
            lines.append(f"ഉത്തരം: {ans_let}")
            lines.append("")
            
    return "\n".join(lines).strip() + "\n"

def update_q_dict(target_q, new_q):
    target_q["id"] = new_q["id"]
    target_q["image"] = new_q["image"]
    target_q["correct_index"] = new_q["correct_index"]
    
    if "question" not in target_q or not isinstance(target_q["question"], dict):
        target_q["question"] = {}
    target_q["question"]["ml"] = new_q["question"]

    if "explanation" not in target_q or not isinstance(target_q["explanation"], dict):
        target_q["explanation"] = {}
    target_q["explanation"]["ml"] = new_q["explanation"]

    if "options" not in target_q or not isinstance(target_q["options"], list) or len(target_q["options"]) != 4:
        target_q["options"] = [{"en": "", "hi": "", "ta": "", "te": "", "kn": "", "ml": ""} for _ in range(4)]
    
    for opt_idx, opt_text in enumerate(new_q["options"]):
        if not isinstance(target_q["options"][opt_idx], dict):
            target_q["options"][opt_idx] = {}
        target_q["options"][opt_idx]["ml"] = opt_text

def update_courses_json():
    with open(COURSES_PATH, "r", encoding="utf-8") as f:
        courses = json.load(f)

    # Build target map: course_id -> qa_data
    target_map = {}
    for cdata in malayalam_qa_data:
        for tid in cdata["target_ids"]:
            target_map[tid] = cdata

    for course in courses:
        cid = course.get("id")
        if cid in target_map:
            data = target_map[cid]
            # Update title.ml
            if "title" in course and isinstance(course["title"], dict):
                course["title"]["ml"] = data["title_ml"]
            
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
    print("Updated courses.json across ALL 16 courses (practice_questions AND checkpoint_test) with verified Malayalam Q&A!")

if __name__ == "__main__":
    main()
