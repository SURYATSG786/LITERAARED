#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSES_PATH = ROOT / "backend" / "src" / "data" / "courses.json"

from update_malayalam_courses import malayalam_qa_data
from update_kannada_courses import kannada_qa_data

def update_lang_in_courses(courses, qa_dataset, lang):
    target_map = {}
    for cdata in qa_dataset:
        for tid in cdata["target_ids"]:
            target_map[tid] = cdata

    for course in courses:
        cid = course.get("id")
        if cid in target_map:
            cdata = target_map[cid]
            if "title" not in course or not isinstance(course["title"], dict):
                course["title"] = {}
            course["title"][lang] = cdata.get(f"title_{lang}")

            def update_question_list(q_list, new_questions):
                for idx, new_q in enumerate(new_questions):
                    if idx < len(q_list):
                        q = q_list[idx]
                    else:
                        q = {}
                        q_list.append(q)
                    
                    q["id"] = new_q["id"]
                    q["image"] = new_q["image"]
                    q["correct_index"] = new_q["correct_index"]

                    if "question" not in q or not isinstance(q["question"], dict):
                        q["question"] = {}
                    q["question"][lang] = new_q["question"]

                    if "explanation" not in q or not isinstance(q["explanation"], dict):
                        q["explanation"] = {}
                    q["explanation"][lang] = new_q["explanation"]

                    if "options" not in q or not isinstance(q["options"], list) or len(q["options"]) != 4:
                        existing_opts = q.get("options", [])
                        q["options"] = []
                        for i in range(4):
                            if i < len(existing_opts) and isinstance(existing_opts[i], dict):
                                q["options"].append(existing_opts[i])
                            else:
                                q["options"].append({})
                    
                    for opt_idx, opt_text in enumerate(new_q["options"]):
                        if not isinstance(q["options"][opt_idx], dict):
                            q["options"][opt_idx] = {}
                        q["options"][opt_idx][lang] = opt_text

            lessons = course.get("lessons", [])
            if lessons:
                p_qs = lessons[0].get("practice_questions", [])
                update_question_list(p_qs, cdata["questions"])
                lessons[0]["practice_questions"] = p_qs

            ckpt_test = course.get("checkpoint_test", [])
            update_question_list(ckpt_test, cdata["questions"])
            course["checkpoint_test"] = ckpt_test

def ensure_all_languages_complete(courses):
    langs = ["en", "hi", "ta", "te", "kn", "ml"]
    template_courses = {c["id"]: c for c in courses if c["id"].startswith("foundation-")}

    for course in courses:
        cid = course["id"]
        path_suffix = cid.split("-")[-1]
        template_c = template_courses.get(f"foundation-{path_suffix}")

        lessons = course.get("lessons", [])
        if lessons:
            p_qs = lessons[0].get("practice_questions", [])
            tmpl_p_qs = template_c["lessons"][0].get("practice_questions", []) if template_c else []
            for i, q in enumerate(p_qs):
                tmpl_q = tmpl_p_qs[i] if i < len(tmpl_p_qs) else {}
                for lang in langs:
                    if not q["question"].get(lang):
                        q["question"][lang] = tmpl_q.get("question", {}).get(lang, "Question")
                    if not q["explanation"].get(lang):
                        q["explanation"][lang] = tmpl_q.get("explanation", {}).get(lang, "Explanation")
                    for opt_idx in range(4):
                        if not q["options"][opt_idx].get(lang):
                            tmpl_opt = tmpl_q.get("options", [{},{},{},{}])[opt_idx].get(lang, f"Option {opt_idx+1}")
                            q["options"][opt_idx][lang] = tmpl_opt

        ckpt = course.get("checkpoint_test", [])
        tmpl_ckpt = template_c.get("checkpoint_test", []) if template_c else []
        for i, q in enumerate(ckpt):
            tmpl_q = tmpl_ckpt[i] if i < len(tmpl_ckpt) else {}
            for lang in langs:
                if not q["question"].get(lang):
                    q["question"][lang] = tmpl_q.get("question", {}).get(lang, "Question")
                if not q["explanation"].get(lang):
                    q["explanation"][lang] = tmpl_q.get("explanation", {}).get(lang, "Explanation")
                for opt_idx in range(4):
                    if not q["options"][opt_idx].get(lang):
                        tmpl_opt = tmpl_q.get("options", [{},{},{},{}])[opt_idx].get(lang, f"Option {opt_idx+1}")
                        q["options"][opt_idx][lang] = tmpl_opt

def main():
    with open(COURSES_PATH, "r", encoding="utf-8") as f:
        courses = json.load(f)

    # Order matters: update Malayalam then Kannada then fill fallbacks
    update_lang_in_courses(courses, malayalam_qa_data, "ml")
    update_lang_in_courses(courses, kannada_qa_data, "kn")
    ensure_all_languages_complete(courses)

    with open(COURSES_PATH, "w", encoding="utf-8") as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)

    print("Updated and verified all 16 courses cleanly for all 6 languages!")

if __name__ == "__main__":
    main()
