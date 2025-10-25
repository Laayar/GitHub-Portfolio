import tkinter
from tkinter import ttk, messagebox

def enter_data():
    if accept_var.get() != "Accepted":
        messagebox.showerror("Error", "Please read and check the registration before submitting.")
        return

    # Strip and validate required fields
    fname = first_name_entry.get().strip()
    lname = last_name_entry.get().strip()
    title = title_combobox.get().strip()
    age = age_spinbox.get().strip()
    nationality = nationality_combobox.get().strip()

    if not fname or not lname or not title or not nationality:
        messagebox.showerror("Error", "Please fill in all required fields.")
        return

    try:
        int(age)
    except ValueError:
        messagebox.showerror("Error", "Please enter a valid age.")
        return

    # Courses info
    registration_status = reg_status_var.get()
    numcourses = numcourses_spinbox.get().strip()
    numsemestre = numsemestre_spinbox.get().strip()

    print("Title:", title, "First name:", fname, "Last name:", lname)
    print("Age:", age, "Nationality:", nationality)
    print("# Courses:", numcourses, "# Semesters:", numsemestre)
    print("Registration status:", registration_status)
    print("-----------------------------------------------------")

def toggle_submit():
    if accept_var.get() == "Accepted":
        submit_button.config(state="normal")
    else:
        submit_button.config(state="disabled")

# Window setup
window = tkinter.Tk()
window.title("Data Entry Form")

frame = tkinter.Frame(window)
frame.pack()

# User Info Frame
user_info_frame = tkinter.LabelFrame(frame, text="User Information")
user_info_frame.grid(row=0, column=0, padx=20, pady=10)

first_name_label = tkinter.Label(user_info_frame, text='First Name')
first_name_label.grid(row=0, column=0)
last_name_label = tkinter.Label(user_info_frame, text="Last Name")
last_name_label.grid(row=0, column=1)

first_name_entry = tkinter.Entry(user_info_frame)
first_name_entry.grid(row=1, column=0)
last_name_entry = tkinter.Entry(user_info_frame)
last_name_entry.grid(row=1, column=1)

title_label = tkinter.Label(user_info_frame, text="Title")
title_combobox = ttk.Combobox(user_info_frame, values=["", "Mr", "Ms.", "Dr."])
title_label.grid(row=0, column=2)
title_combobox.grid(row=1, column=2)

age_label = tkinter.Label(user_info_frame, text="Age")
age_spinbox = tkinter.Spinbox(user_info_frame, from_=18, to=100)
age_label.grid(row=2, column=0)
age_spinbox.grid(row=3, column=0)

nationality_label = tkinter.Label(user_info_frame, text="Nationality")
nationality_combobox = ttk.Combobox(user_info_frame, values=[
    "American", "British", "Canadian", "Chinese", "French", "German", "Indian", "Italian",
    "Japanese", "Mexican", "Moroccan", "Nigerian", "Russian", "South African", "Spanish",
    "Turkish", "Australian", "Brazilian", "Egyptian", "Greek", "Indonesian", "Pakistani",
    "Polish", "Portuguese", "Saudi", "Swedish", "Swiss", "Thai", "Ukrainian", "Vietnamese"])
nationality_label.grid(row=2, column=1)
nationality_combobox.grid(row=3, column=1)

for widget in user_info_frame.winfo_children():
    widget.grid_configure(padx=10, pady=5)

# Courses Frame
courses_frame = tkinter.LabelFrame(frame, text="Course Information")
courses_frame.grid(row=1, column=0, sticky="news", padx=20, pady=10)

reg_status_var = tkinter.StringVar(value="Not registered")
registered_label = tkinter.Label(courses_frame, text="Registration Status")
registerred_check = tkinter.Checkbutton(courses_frame, text="Currently Registered",
                                        variable=reg_status_var, onvalue="Registered", offvalue="Not registered")
registered_label.grid(row=0, column=0)
registerred_check.grid(row=1, column=0)

numcourses_label = tkinter.Label(courses_frame, text="# Completed Courses")
numcourses_spinbox = tkinter.Spinbox(courses_frame, from_=0, to=100)
numcourses_label.grid(row=0, column=1)
numcourses_spinbox.grid(row=1, column=1)

numsemestre_label = tkinter.Label(courses_frame, text="# Semesters")
numsemestre_spinbox = tkinter.Spinbox(courses_frame, from_=0, to=12)
numsemestre_label.grid(row=0, column=2)
numsemestre_spinbox.grid(row=1, column=2)

for widget in courses_frame.winfo_children():
    widget.grid_configure(padx=10, pady=5)

# Terms & Conditions
terms_frame = tkinter.LabelFrame(frame, text="Terms & Conditions")
terms_frame.grid(row=2, column=0, sticky='news', padx=20, pady=10)

accept_var = tkinter.StringVar(value="Not Accepted")
terms_check = tkinter.Checkbutton(terms_frame, text="I accept the terms and conditions.",
                                  variable=accept_var, onvalue="Accepted", offvalue="Not accepted",
                                  command=toggle_submit)
terms_check.grid(row=0, column=0)

# Submit Button
submit_button = tkinter.Button(frame, text="Submit", command=enter_data, state="disabled")
submit_button.grid(row=3, column=0, sticky='news', padx=20, pady=10)

window.mainloop()
