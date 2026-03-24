const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const FILE = "tickets.json";

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

// Get all tickets
app.get("/tickets", (req, res) => {
  res.json(readTickets());
});

// Add ticket
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

// Update ticket status
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

// Delete ticket
app.delete("/tickets/:id", (req, res) => {
  const tickets = readTickets();

  const filtered = tickets.filter(
    t => t.id !== parseInt(req.params.id)
  );

  saveTickets(filtered);
  res.json({ message: "Deleted" });
});

// AI endpoint
app.post("/ai", (req, res) => {
  res.json({
    criteria: [
      "User enters valid data",
      "Error message on failure",
      "Success message displayed"
    ],
    storyPoints: 3,
    priority: "Normal"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});