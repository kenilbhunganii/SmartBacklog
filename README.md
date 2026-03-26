# SmartBacklog

> A professional Kanban board with drag & drop and AI task analysis — built with Node.js, Express, and vanilla JavaScript.

---

## What It Does

SmartBacklog lets you manage tasks visually across three columns: **To Do**, **In Progress**, and **Done**. Tasks move in one direction only — forward — keeping the workflow clean. An optional AI layer auto-generates acceptance criteria, story points, and priority for any task you describe.

---

## Quick Start

```bash
git clone <your-repo-url>
cd SmartBacklog
npm install
npm start
```

Open → **http://localhost:3000**

---

## AI Setup (Optional)

Create a `.env` file in the project root:

```
OPENAI_API_KEY=your_api_key_here
```

Without a key, the **AI Suggest** button returns a structured mock response — the rest of the board works fully regardless.

---

## Features

| Feature | Description |
|---|---|
| **Add Task** | Type and press Enter or click Add Task |
| **Forward-only buttons** | To Do → Progress, Progress → Done. No going back via buttons. |
| **Drag & Drop** | Drag any card to any column using the ⠿ handle |
| **Delete** | Remove any task permanently with ✕ |
| **Live Stats Bar** | Animated task counts + completion percentage |
| **AI Suggest** | Auto-generates acceptance criteria, story points, and priority |
| **Persistent Storage** | All tasks saved to `tickets.json` — survives server restarts |
| **Toast Notifications** | Confirms every add, move, and delete action |

---

## Project Structure

```
SmartBacklog/
├── server.js          # Express server + REST API + AI endpoint
├── tickets.json       # Persistent task storage (auto-created)
├── package.json       # Project metadata and dependencies
├── .env               # Your API key (never commit this)
├── .env.example       # Template for .env setup
├── .gitignore
├── README.md
└── public/
    ├── index.html     # Application shell
    ├── style.css      # Black & white design system (DM Sans)
    └── script.js      # Board logic, drag & drop, API calls
```

---

## REST API

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/tickets` | — | Get all tickets |
| `POST` | `/tickets` | `{ title }` | Create a new ticket (status: todo) |
| `PUT` | `/tickets/:id` | `{ status }` | Move ticket to a new status |
| `DELETE` | `/tickets/:id` | — | Delete a ticket |
| `POST` | `/ai` | `{ title }` | Get AI analysis for a task |

**Valid status values:** `todo` · `progress` · `done`

---

## Dependencies

```json
{
  "express":  "^4.18.2",
  "cors":     "^2.8.5",
  "dotenv":   "^16.4.5",
  "openai":   "^4.0.0"
}
```

---

## Design

- **Font:** DM Sans (UI) + DM Mono (labels, IDs, code)
- **Colors:** Strict black `#000000` and white `#FFFFFF` palette
- **Cards:** Brutalist hover lift — hard shadow, no blur
- **No frameworks:** Zero React, Vue, or Angular — plain HTML/CSS/JS

---

## Known Limitations

- Single-user — no authentication or multi-user sync
- Flat-file storage — not suitable for high-concurrency environments
- No task editing — delete and re-add to change a title
- No within-column reordering

---

## License

ISC · Kenil Bhungani