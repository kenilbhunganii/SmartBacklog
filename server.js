const express = require("express");
const cors = require("cors");
const fs = require("fs");

require("dotenv").config();

let OpenAI;
try {
  OpenAI = require("openai");
} catch (e) {
  console.log("OpenAI package not found");
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const FILE = "tickets.json";

// -------------------------------
// Ticket Storage Functions
// -------------------------------

function readTickets() {
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, "[]");
  }

  const data = fs.readFileSync(FILE);
  return JSON.parse(data);
}

function saveTickets(tickets) {
  fs.writeFileSync(FILE, JSON.stringify(tickets, null, 2));
}

// -------------------------------
// Ticket APIs
// -------------------------------

app.get("/tickets", (req, res) => {
  res.json(readTickets());
});

app.post("/tickets", (req, res) => {
  const tickets = readTickets();

  const ticket = {
    id: Date.now(),
    title: req.body.title,
    status: "todo"
  };

  tickets.push(ticket);
  saveTickets(tickets);

  res.json(ticket);
});

app.put("/tickets/:id", (req, res) => {
  const tickets = readTickets();
  const id = parseInt(req.params.id);

  const updated = tickets.map(t => {
    if (t.id === id) {
      t.status = req.body.status;
    }
    return t;
  });

  saveTickets(updated);
  res.json({ message: "Updated" });
});

app.delete("/tickets/:id", (req, res) => {
  const tickets = readTickets();

  const filtered = tickets.filter(
    t => t.id !== parseInt(req.params.id)
  );

  saveTickets(filtered);
  res.json({ message: "Deleted" });
});

// -------------------------------
// AI API (Real Integration)
// -------------------------------

app.post("/ai", async (req, res) => {
  const title = req.body.title;

  console.log("AI request received for:", title);

  // Fallback if API key missing
  if (!process.env.OPENAI_API_KEY || !OpenAI) {
    console.log("Using fallback AI response");

    return res.json({
      acceptanceCriteria: [
        "User can create task",
        "Task is saved successfully",
        "Error message on failure"
      ],
      storyPoints: 3,
      priority: "Normal"
    });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an Agile Scrum assistant. Return ONLY valid JSON with fields: acceptanceCriteria (array), storyPoints (number), priority (string)."
        },
        {
          role: "user",
          content: `Analyze this task and return JSON:
Task: ${title}`
        }
      ],
      temperature: 0.7
    });

    const text = response.choices[0].message.content;

    console.log("AI raw response:", text);

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.log("JSON parse failed, returning raw text");

      return res.json({
        acceptanceCriteria: [text],
        storyPoints: 3,
        priority: "Normal"
      });
    }

    res.json(parsed);

  } catch (error) {
    console.log("AI ERROR:", error.message);

    res.json({
      message: "AI error",
      error: error.message
    });
  }
});

// -------------------------------
// Server Start
// -------------------------------

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
