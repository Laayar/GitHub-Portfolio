import streamlit as st

st.title("Data Entry Form")

st.header("User Information")
# User Info
title = st.selectbox("Title", ["", "Mr", "Ms.", "Dr."])
first_name = st.text_input("First Name")
last_name = st.text_input("Last Name")
age = st.number_input("Age", min_value=18, max_value=100)
nationality = st.selectbox("Nationality", [
    "American", "British", "Canadian", "Chinese", "French", "German", "Indian", "Italian",
    "Japanese", "Mexican", "Moroccan", "Nigerian", "Russian", "South African", "Spanish",
    "Turkish", "Australian", "Brazilian", "Egyptian", "Greek", "Indonesian", "Pakistani",
    "Polish", "Portuguese", "Saudi", "Swedish", "Swiss", "Thai", "Ukrainian", "Vietnamese"
])

st.header("Course Information")
# Courses Info
registration_status = st.checkbox("Currently Registered")
num_courses = st.number_input("# Completed Courses", min_value=0, max_value=100)
num_semesters = st.number_input("# Semesters", min_value=0, max_value=12)

st.header("Terms & Conditions")
accept_terms = st.checkbox("I accept the terms and conditions.")

# Submit Button
if st.button("Submit"):
    if not accept_terms:
        st.error("Please accept the terms and conditions before submitting.")
    elif not first_name.strip() or not last_name.strip() or not title.strip() or not nationality.strip():
        st.error("Please fill in all required fields.")
    else:
        st.success("Data submitted successfully!")
        st.write("**Title:**", title)
        st.write("**First name:**", first_name)
        st.write("**Last name:**", last_name)
        st.write("**Age:**", age)
        st.write("**Nationality:**", nationality)
        st.write("**Registration status:**", "Registered" if registration_status else "Not registered")
        st.write("# Courses:", num_courses)
        st.write("# Semesters:", num_semesters)
