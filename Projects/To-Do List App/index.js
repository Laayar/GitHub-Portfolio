const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");

addBtn.onclick = () => {
  const inputValue = taskInput.value.trim();
  if(!inputValue){
    alert("Please enter a task!")
    return
  }

  const li = document.createElement("li");

  // task text
  const taskText = document.createElement("span");
  taskText.textContent = inputValue;
  taskText.className = "task-text";
  li.appendChild(taskText);

  // delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "🗑 Delete";
  deleteBtn.className = "delete-btn";
  deleteBtn.onclick = () => deleteTask(li);
  li.appendChild(deleteBtn);

  // modify button
  const modifyBtn = document.createElement("button");
  modifyBtn.textContent = "✏️ Edit";
  modifyBtn.className = "modify-btn";
  modifyBtn.onclick = () => modifyTask(taskText);
  li.appendChild(modifyBtn);

  taskList.appendChild(li);
  taskInput.value = "";
}

function deleteTask(li){
  const verification = prompt("Warning: Are you sure that you want to delete the task? (yes/no)","yes")
  if(verification && verification.toLowerCase() === "yes"){
    li.remove();
  }
}

function modifyTask(taskText){
  const newTask = prompt("Edit Item", taskText.textContent)
  if(newTask !== null && newTask.trim()){
    taskText.textContent = newTask.trim();
  }
  taskInput.value = "";
}

taskList.addEventListener("click", function(e){
    if(e.target.tagName === "LI"){
        e.target.classList.toggle("checked");
    }
}, false);


