# LiteraAI — start here (every new ZIP has a unique folder name)

## 1) Unzip the NEW package only
Do not reuse an old folder. Example:

```bash
cd ~/Downloads
unzip -o SURYA-literacy-courses-v5-authfix-20260802-1201.zip
cd SURYA-literacy-courses-v5-authfix-20260802-1201
```

## 2) Start backend (terminal 1) — keep this open
```bash
cd backend
cp -n .env.example .env
npm install
npm run dev
```
You must see: `LiteraAI API listening on http://localhost:5000`

Check: open http://localhost:5000/api/health — should show `"status":"ok"`.

## 3) Start frontend (terminal 2)
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## 4) Register / Login
- Registration is saved in `backend/data/literaai-store.json`
- Every registration and login attempt is recorded there
- If you see a red “Backend is not running” banner, terminal 1 is not running

## Password rule
At least 8 characters, with at least one letter and one number (example: `Password1`).
