async function loadTickets() {

    const res = await fetch("/tickets");
    const tickets = await res.json();

    document.getElementById("todo").innerHTML = "";
    document.getElementById("progress").innerHTML = "";
    document.getElementById("done").innerHTML = "";

    tickets.forEach(ticket => {

        const div = document.createElement("div");
        div.className = "ticket";

        div.innerHTML = `
        <b>${ticket.title}</b>
        <br>
        <button onclick="move(${ticket.id}, 'todo')">To Do</button>
        <button onclick="move(${ticket.id}, 'progress')">Progress</button>
        <button onclick="move(${ticket.id}, 'done')">Done</button>
        <button onclick="deleteTicket(${ticket.id})">Delete</button>
        `;

        document.getElementById(ticket.status).appendChild(div);

    });
}

async function addTicket() {

    const title = document.getElementById("title").value;

    await fetch("/tickets", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title
        })
    });

    loadTickets();
}

async function move(id, status) {

    await fetch("/tickets/" + id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            status
        })
    });

    loadTickets();
}

async function deleteTicket(id) {

    await fetch("/tickets/" + id, {
        method: "DELETE"
    });

    loadTickets();
}

async function generateAI() {

    const title = document.getElementById("title").value;

    const res = await fetch("/ai", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title
        })
    });

    const data = await res.json();

    alert(JSON.stringify(data, null, 2));
}

loadTickets();