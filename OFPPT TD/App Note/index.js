
let data = [];


function loadNotes() {
  const notes = localStorage.getItem("notes");
  return notes ? JSON.parse(notes) : [];
}

function saveNotes() {
  localStorage.setItem("notes", JSON.stringify(data));
}


function updateNoteCounts() {
  const allBtn = document.querySelector(".btn-gray span");
  const doneBtn = document.querySelector(".btn-green span");
  const pendingBtn = document.querySelector(".btn-yellow span");
  allBtn.textContent = data.length;
  doneBtn.textContent = data.filter(n => n.status === "done").length;
  pendingBtn.textContent = data.filter(n => n.status === "pending").length;
}

const showFormBtn = document.querySelector("#showFormBtn");
const overlay = document.querySelector(".overlay");
const addNoteForm = document.querySelector(".form");

console.log(showFormBtn);


showFormBtn.addEventListener("click", () => {
  console.log("clicked");
  overlay.classList.add("showOverlay");
  addNoteForm.style.bottom = "0%";
});



function hideForm() {
  overlay.classList.remove("showOverlay");
  addNoteForm.style.bottom = "-100%";
}
overlay.onclick = hideForm;

function addNote(text) {
  if (!text.trim()) return false;
  const newNote = {
    text: text,
    status: "pending",
    createDate: new Date().toISOString(),
  };
  data.push(newNote);
  saveNotes();
  updateNoteCounts();
  return true;
}

const addNoteBtn = document.querySelector("#addNoteBtn");
const textarea = document.querySelector("textarea");

addNoteBtn.addEventListener("click", () => {
  const text = textarea.value;
  const result = addNote(text);
  if (result) {
    afficherNotes(data);
    hideForm();
    textarea.value = "";
  }
});

window.addEventListener("DOMContentLoaded", () => {
  data = loadNotes();
  afficherNotes(data);
  updateNoteCounts();
});


const searchInput = document.querySelector(".search_input");
if (searchInput) {
  searchInput.addEventListener("input", function() {
    const query = this.value.trim().toLowerCase();
    if (!query) {
      afficherNotes(data);
    } else {
      const filtered = data.filter(note => note.text.toLowerCase().includes(query));
      afficherNotes(filtered);
    }
  });
}
const notesContainer = document.querySelector(".notes-container");
function afficherNotes(notes) {
  notesContainer.innerHTML = "";
  notes.forEach((note, idx) => {
    const noteDiv = document.createElement("div");
    noteDiv.className = `note ${note.status === "pending" ? "note-pending" : "note-done"}`;
    const p = document.createElement("p");
    p.textContent = note.text;
    const btn = document.createElement("button");
    btn.title = note.status === "pending" ? "Mark as done" : "Done";
    btn.disabled = note.status === "done";
    const span = document.createElement("span");
    span.textContent = note.createDate;
    noteDiv.appendChild(p);
    noteDiv.appendChild(btn);
    noteDiv.appendChild(span);
    btn.onclick = function(e) {
      if (note.status === "pending") {
        data[idx].status = "done";
        saveNotes();
        afficherNotes(data);
      }
    };
    notesContainer.appendChild(noteDiv);
  });
  updateNoteCounts();
}
