// auth/signup.js

// ✅ use shared Supabase client
const sb = window.sb;

// DOM elements
let signupForm;
let signupButton;
let authMessage;

// 🔔 Show message
function showMessage(message, isError = true) {
    if (!authMessage) return;

    authMessage.textContent = message;
    authMessage.className = isError
        ? "text-red-500 text-sm text-center mb-4 h-5"
        : "text-green-500 text-sm text-center mb-4 h-5";
}

// ⏳ Button loading state
function setLoading(button, isLoading) {
    if (!button) return;

    const btnText = button.querySelector(".btn-text");
    const loader = button.querySelector("span:last-child");

    if (isLoading) {
        button.disabled = true;
        if (btnText) btnText.classList.add("hidden");
        if (loader) loader.classList.remove("hidden");
    } else {
        button.disabled = false;
        if (btnText) btnText.classList.remove("hidden");
        if (loader) loader.classList.add("hidden");
    }
}

// 🟢 Load colleges dynamically from the 'colleges' table
async function loadColleges() {
    const select = document.getElementById("signup-college");

    try {
        const { data: colleges, error } = await sb
            .from('colleges')
            .select('name')
            .order('name', { ascending: true });

        if (error) {
            console.error("Error loading colleges:", error);
            select.innerHTML = '<option value="" disabled selected>Failed to load. Please try again.</option>';
            return;
        }

        // Clear existing placeholder
        select.innerHTML = '<option value="" disabled selected>Select your College</option>';
        
        // Populate from DB
        colleges.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.name;
            opt.textContent = c.name;
            select.appendChild(opt);
        });

        // Re-add the "Other" option at the end
        const otherOpt = document.createElement("option");
        otherOpt.value = "Other";
        otherOpt.textContent = "Other (Not Listed)";
        select.appendChild(otherOpt);

    } catch (err) {
        console.error("Critical error fetching colleges:", err);
    }
}

// 🔐 HANDLE SIGNUP
async function handleSignup(event) {
    event.preventDefault();

    let collegeName = document.getElementById("signup-college").value;
    const otherCollegeInput = document.getElementById("signup-college-other");

    // 🟢 Capture custom college name and upload to database
    if (collegeName === "Other") {
        collegeName = otherCollegeInput.value.trim();
        
        // Insert the new college into the colleges table so it's available for future users
        if(collegeName) {
            const { error: collegeError } = await sb
                .from('colleges')
                .upsert({ name: collegeName }, { onConflict: 'name' }); 
                
            if (collegeError) {
                console.error("Error adding new college to database:", collegeError);
            }
        }
    } else if (collegeName) {
        collegeName = collegeName.trim();
    }

    const fullName = document.getElementById("signup-fullname").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const studentId = document.getElementById("signup-studentid").value.trim();
    const course = document.getElementById("signup-course").value.trim();
    const mobile = document.getElementById("signup-mobile").value.trim();
    const gender = document.getElementById("signup-gender").value;

    if (!collegeName || !fullName || !email || !password || !studentId || !course || !mobile || !gender) {
        showMessage("Please fill all the fields.");
        return;
    }

    setLoading(signupButton, true);
    showMessage("", false);

    try {
        // 🔥 1. Sign up the user in Supabase Auth
        const { data: authData, error: authError } = await sb.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,
                    college_name: collegeName,
                    student_id: studentId,
                    course: course,
                    mobile: mobile,
                    gender: gender
                }
            }
        });

        if (authError) {
            console.error("Signup error:", authError);
            showMessage(authError.message || "Failed to create account.");
            return;
        }

        const user = authData?.user;
        
        if (user) {
            // ✅ Account successfully created
            showMessage("Account created! Please check your email to confirm your account.", false);
            
            // Clear the form
            signupForm.reset();
            document.getElementById('other-college-container').classList.add('hidden');
        } else {
             showMessage("Something went wrong during signup.");
        }

    } catch (err) {
        console.error("Signup process error:", err);
        showMessage("An unexpected error occurred.");
    } finally {
        setLoading(signupButton, false);
    }
}

// 🔁 Check existing session
async function checkUserSession() {
    try {
        const { data } = await sb.auth.getSession();

        if (data?.session) {
            // already logged in → skip signup page
            window.location.href = "/EcoCampus/";
        }
    } catch (err) {
        console.error("Session check error:", err);
    }
}

// 🚀 INIT
document.addEventListener("DOMContentLoaded", () => {
    signupForm = document.getElementById("signup-form");
    signupButton = document.getElementById("signup-button");
    authMessage = document.getElementById("auth-message");

    if (!signupForm) {
        console.error("Signup form not found!");
        return;
    }

    // Load the dropdown list
    loadColleges();

    signupForm.addEventListener("submit", handleSignup);

    // check if already logged in
    checkUserSession();
});
