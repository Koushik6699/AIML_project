// ===================== FORCE HIDE MODALS ON LOAD =====================

document.addEventListener("DOMContentLoaded", () => {
    const interview = document.getElementById("interviewModal");
    const assignment = document.getElementById("assignmentModal");
    const report = document.getElementById("reportFormModal");
    const overlay = document.getElementById("modalOverlay");

    if (interview) interview.style.display = "none";
    if (assignment) assignment.style.display = "none";
    if (report) report.style.display = "none";
    if (overlay) overlay.style.display = "none";
});
// Change this when deploying
const BACKEND_BASE_URL = "https://aiml-project-ascp.onrender.com";


// ===================== SUBJECT DATABASE =====================

const BRANCH_DATA = {
    "CSE": [
        "DSA", "ML", "DL", "DBMS", "DS", "OOP", "Stats", "C", "C++",
        "Java", "Python", "SQL", "Node.js", "AIML Advanced", "HTML",
        "CSS", "Cloud Computing", "Cyber Security"
    ],
    "ECE": [
        "VLSI Design", "Embedded Systems", "Signal Processing",
        "Microprocessors", "Digital Electronics", "Control Systems",
        "Circuit Theory", "IoT", "Antenna Theory", "Communication Systems",
        "Analog Circuits", "Fiber Optics"
    ],
    "MECH": [
        "Thermodynamics", "Fluid Mechanics", "CAD/CAM", "Robotics",
        "Heat Transfer", "Manufacturing Process", "Mechatronics",
        "Automobile Engineering", "Solid Mechanics", "Industrial Engineering",
        "Refrigeration", "Kinematics"
    ]
};

// ML features expected by backend (ORDER MATTERS)
const ML_FEATURES = ["DSA", "ML", "DBMS", "Python", "Stats"];

let currentBranch = "";
let selectedSubjects = [];

// ===================== NAVIGATION =====================

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
    });
    const target = document.getElementById(sectionId);
    if (target) target.style.display = 'block';
}

function setActiveNav(el) {
    document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
    if (el) el.classList.add('active');
}

function startAssessment() {
    showSection('assessment');
    goToStep(1);
}

function goToStep(stepNum) {
    const steps = ['step-1', 'step-2', 'step-3'];

    steps.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const current = document.getElementById(`step-${stepNum}`);
    if (current) current.style.display = 'block';

    document.querySelectorAll('.step').forEach((s, idx) => {
        if (idx + 1 <= stepNum) s.classList.add('active');
        else s.classList.remove('active');
    });
}

// ===================== STEP 1: BRANCH =====================

function selectBranch(branch) {
    currentBranch = branch;
    document.getElementById('selected-branch-label').innerText = `Branch: ${branch}`;

    const grid = document.getElementById('subject-grid');
    grid.innerHTML = "";

    BRANCH_DATA[branch].forEach(sub => {
        grid.innerHTML += `
            <label class="chip">
                <input type="checkbox" class="sub-check" value="${sub}" onchange="updateSelection()">
                <span>${sub}</span>
            </label>
        `;
    });

    selectedSubjects = [];
    goToStep(2);
}

function updateSelection() {
    selectedSubjects = [...document.querySelectorAll('.sub-check:checked')]
        .map(el => el.value);
}

// ===================== STEP 2: SUBJECTS =====================

function prevStep(step) {
    goToStep(step);
}

function goToStep3() {
    if (selectedSubjects.length === 0) {
        alert("Please select at least one subject.");
        return;
    }

    const container = document.getElementById('marks-container');
    container.innerHTML = "";

    selectedSubjects.forEach(sub => {
        container.innerHTML += `
            <div class="mark-input-group">
                <label>${sub}</label>
                <input 
                    type="number" 
                    class="mark-val" 
                    data-sub="${sub}" 
                    placeholder="0" 
                    min="0" 
                    max="100"
                >
            </div>
        `;
    });

    goToStep(3);
}

// ===================== STEP 3: BACKEND CALL =====================

async function calculateJobProbability() {
    const marksData = {};

    document.querySelectorAll('.mark-val').forEach(input => {
        marksData[input.dataset.sub] = parseInt(input.value) || 0;
    });

    // Build feature vector in correct ML order
    const featureVector = ML_FEATURES.map(feat => marksData[feat] || 0);

    const container = document.getElementById("resultsContainer");
    container.innerHTML = `
        <div class="loader">
            <div class="spinner"></div> 
            Analyzing ${currentBranch} Profile...
        </div>
    `;

    showSection('resultsPage');

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                branch: currentBranch,
                marks: featureVector,
                all_marks: marksData
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Backend error: ${text}`);
        }

        const results = await response.json();

        if (!Array.isArray(results)) {
            throw new Error("Invalid response format from backend");
        }

        container.innerHTML = "";

        if (results.length === 0) {
            container.innerHTML = `
                <div class="career-card">
                    <h3>No strong matches found</h3>
                    <p>Try improving your core subjects.</p>
                </div>
            `;
            return;
        }

        results.forEach((item, index) => {
            const cardId = `roadmap-${index}`;

            container.innerHTML += `
                <div class="career-card">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h4 style="color:var(--text-muted); text-transform:uppercase; font-size:0.68rem; letter-spacing:1.2px; margin-bottom:5px; font-weight:700;">
                                Target Role
                            </h4>
                            <h3 style="margin:0; font-family:'Syne',sans-serif; font-size:1.4rem; font-weight:800;">${item.role}</h3>
                        </div>
                        <div style="text-align:right;">
                            <h4 style="color:var(--text-muted); text-transform:uppercase; font-size:0.68rem; letter-spacing:1.2px; margin-bottom:5px; font-weight:700;">
                                Match Score
                            </h4>
                            <span style="font-size:2rem; font-weight:800; font-family:'Syne',sans-serif; background:var(--gradient-hero); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">
                                ${item.prob}%
                            </span>
                        </div>
                    </div>

                    <div class="prob-bar-bg">
                        <div class="prob-bar-fill" style="width: ${item.prob}%"></div>
                    </div>

                    <div class="action-btns">
                        <button 
                            class="btn-ai-roadmap" 
                            id="btn-${cardId}" 
                            onclick="generateRoadmap('${item.role}', ${item.prob}, '${cardId}')">
                            ✨ Roadmap
                        </button>

                        <button 
                            class="btn-interview" 
                            onclick="startInterview('${item.role}')">
                            🎙️ Interview
                        </button>

                        <button 
                            class="btn-assignment" 
                            onclick="openAssignmentModal('${item.role}')">
                            📝 Assignment
                        </button>

                        <button 
                            class="btn-report" 
                            onclick="checkReportReady('${item.role}', '${cardId}')">
                            📋 Generate Report
                        </button>
                    </div>  

                    <div id="${cardId}" class="ai-roadmap-box" style="display:none;"></div>
                </div>
            `;
        });

    } catch (error) {
        console.error("Prediction error:", error);

        container.innerHTML = `
            <div class="career-card">
                <h3>Backend Error</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// ===================== GEMINI ROADMAP =====================

async function generateRoadmap(role, prob, containerId) {
    const roadmapBox = document.getElementById(containerId);
    const btn = document.getElementById(`btn-${containerId}`);

    const prompt = `I am a ${currentBranch} student. Subjects: ${selectedSubjects.join(", ")}. Match: ${prob}% for ${role}. Give a COMPACT roadmap in this exact format (max 150 words total, one line per point):

**Skills to Learn** (pick 3 most critical):
• Skill — why

**Projects to Build** (3 ideas):
• Project name — one sentence

**Quick Tips** (2 tips max):
• tip

No long paragraphs.`;

    roadmapBox.style.display = "block";
    roadmapBox.innerHTML = `<div class="loader"><div class="spinner"></div> Mapping your path...</div>`;
    btn.disabled = true;

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt, role: role })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`AI backend error: ${text}`);
        }

        const data = await response.json();

        if (!data.advice) {
            throw new Error("Invalid AI response");
        }

        let formattedText = data.advice
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\* /g, '• ')
            .replace(/\n/g, '<br>');

        roadmapBox.innerHTML = `
            <div class="roadmap-content">
                ${formattedText}
            </div>
        `;

    } catch (error) {
        console.error("Roadmap error:", error);
        roadmapBox.innerHTML = `
            <span style="color:var(--danger);">
                Failed to load roadmap: ${error.message}
            </span>
        `;
    } finally {
        btn.disabled = false;
    }
}

// ===================== THEME =====================

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('themeBtn');

    btn.innerHTML = document.body.classList.contains('dark-mode')
        ? '<i class="fa-solid fa-sun"></i> Light Mode'
        : '<i class="fa-solid fa-moon"></i> Dark Mode';
}

// ===================== VOICE & INTERVIEW SYSTEM =====================

// Global Variables (checking window to prevent redeclaration errors)
if (window.interviewRole === undefined) { window.interviewRole = ""; }
if (window.isRecording === undefined) { window.isRecording = false; }
if (window.questionCount === undefined) { window.questionCount = 0; }

var recognition;
var synth = window.speechSynthesis;
const INTERVIEW_LIMIT = 5; // The interview will end after 5 questions

// 1. Initialize Speech-to-Text (User Voice -> Text)
if ('webkitSpeechRecognition' in window || 'speechRecognition' in window) {
    const SpeechRecognition = window.webkitSpeechRecognition || window.speechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false; 
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const inputField = document.getElementById('userInterviewInput');
        if(inputField) {
            inputField.value = transcript;
            stopMicUI();
            sendInterviewAnswer(); 
        }
    };
    recognition.onend = () => stopMicUI();
}

// 2. Microphone UI Controls
function toggleMic() {
    if (!recognition) return alert("Browser doesn't support speech recognition. Use Chrome.");
    const micBtn = document.getElementById('micBtn');
    if (!window.isRecording) {
        synth.cancel(); 
        recognition.start();
        if(micBtn) {
            micBtn.classList.add('mic-active');
            micBtn.innerHTML = "🛑"; 
        }
        window.isRecording = true;
    } else {
        recognition.stop();
        stopMicUI();
    }
}

function stopMicUI() {
    const micBtn = document.getElementById('micBtn');
    if(micBtn) {
        micBtn.classList.remove('mic-active');
        micBtn.innerHTML = "🎤";
    }
    window.isRecording = false;
}

// 3. AI Voice with CLEANING (No "Hash" or "Stars") and Lyrics
function speakWithLyrics(text, containerElement) {
    // This removes symbols like #, *, _, - so the AI doesn't read them out loud
    const cleanText = text
        .replace(/[#*_-]/g, "") 
        .replace(/\s+/g, " ")   
        .trim();

    const words = cleanText.split(" ");
    containerElement.innerHTML = ""; 

    words.forEach((word, i) => {
        const span = document.createElement("span");
        span.innerText = word + " ";
        span.id = `word-${i}`;
        containerElement.appendChild(span);
    });

    const utterance = new SpeechSynthesisUtterance(cleanText);
    let wordIndex = 0;

    utterance.onboundary = (event) => {
        if (event.name === 'word') {
            containerElement.querySelectorAll('.speaking-word').forEach(el => el.classList.remove('speaking-word'));
            const currentWordSpan = containerElement.querySelector(`#word-${wordIndex}`);
            if (currentWordSpan) {
                currentWordSpan.classList.add('speaking-word');
                wordIndex++;
            }
        }
    };
    synth.speak(utterance);
}

// 4. Interview Navigation
function startInterview(role) {
    window.interviewRole = role;
    window.questionCount = 0; 
    document.getElementById('interviewRoleTitle').innerText = role;
    document.getElementById('interviewModal').style.display = 'flex';
    document.getElementById('modalOverlay').style.display = 'block';
    document.getElementById('interviewChat').innerHTML = `<div class="ai-msg">Ready for your ${role} interview? We will have ${INTERVIEW_LIMIT} questions. Click "Start".</div>`;
    document.getElementById('startInterviewBtn').style.display = 'block';
}

function closeInterview() {
    synth.cancel();
    if(recognition) recognition.stop();
    document.getElementById('interviewModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

async function initiateInterview() {
    document.getElementById('startInterviewBtn').style.display = 'none';
    document.getElementById('userInterviewInput').disabled = false;
    document.getElementById('sendInterviewBtn').disabled = false;
    document.getElementById('micBtn').disabled = false;

    window.questionCount = 1;

    // Optimized prompt for Alex (The AI Recruiter)
    const initialPrompt = `You are "Alex", a senior technical recruiter. 
    Role: Interviewing a ${currentBranch} student for the position of ${window.interviewRole}.
    
    CRITICAL RULES:
    1. Introduction: Briefly introduce yourself as Alex. Do NOT use placeholders like [Your Name].
    2. Length: Keep every response under 50 words. No long theories or big explanations.
    3. Evaluation: If the user answers, give a one-sentence critique (e.g., "Correct, but mention complexity" or "That's right"). 
    4. Task: Ask question 1 of ${INTERVIEW_LIMIT} now.
    
    Start the interview now.`;
    
    await sendToAI(initialPrompt);
}

async function sendInterviewAnswer() {
    const input = document.getElementById('userInterviewInput');
    const answer = input.value;
    if(!answer) return;

    const chatBody = document.getElementById('interviewChat');
    const userDiv = document.createElement('div');
    userDiv.className = 'user-msg';
    userDiv.innerText = answer;
    chatBody.appendChild(userDiv);
    
    input.value = "";
    chatBody.scrollTop = chatBody.scrollHeight;

    window.questionCount++;

    let prompt = "";
    if (window.questionCount <= INTERVIEW_LIMIT) {
        prompt = `Candidate said: "${answer}". keep a small evaluate (as small as possible, (explain main fault only)) and ask question ${window.questionCount} of ${INTERVIEW_LIMIT} for ${window.interviewRole}.`;
    } else {
        prompt = `Candidate said: "${answer}". Last question done. Provide a score/feedback out of 10 and end with 'The interview is now complete.'`;
        document.getElementById('userInterviewInput').disabled = true;
        document.getElementById('micBtn').disabled = true;
        document.getElementById('sendInterviewBtn').disabled = true;
    }
    
    await sendToAI(prompt);
}

async function sendToAI(promptText) {
    const chatBody = document.getElementById('interviewChat');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'ai-msg';
    msgDiv.innerText = "...";
    chatBody.appendChild(msgDiv);

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptText, role: window.interviewRole })
        });
        const data = await response.json();
        
        msgDiv.innerText = ""; // Clear the "..."
        speakWithLyrics(data.advice, msgDiv); 
    } catch (e) {
        msgDiv.innerText = "Error connecting to AI.";
    }
}

// ===================== ASSIGNMENT / QUIZ SYSTEM =====================

let currentQuizRole = "";
let quizQuestions = [];
let currentQuestionIndex = 0;
let userScore = 0;

function openAssignmentModal(role) {
    currentQuizRole = role;
    document.getElementById('quizRoleTitle').innerText = `📝 ${role} — Technical Challenge`;
    document.getElementById('assignmentModal').style.display = 'flex';
    document.getElementById('modalOverlay').style.display = 'block';
    
    // Reset Quiz State
    document.getElementById('quizContainer').innerHTML = `
        <div class="quiz-intro">
            <i class="fa-solid fa-file-lines dept-icon" style="font-size:44px; color: var(--primary);"></i>
            <h3>Ready for the ${role} Technical Challenge?</h3>
            <p>20 Multiple Choice Questions to test your expertise.</p>
            <button class="btn-primary" onclick="generateAssignment()">Start Assignment</button>
        </div>
    `;
    document.getElementById('quizProgressBar').style.width = "0%";
    document.getElementById('questionCountLabel').innerText = "";
}

function closeAssignment() {
    document.getElementById('assignmentModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

if (window.quizQuestions === undefined) { window.quizQuestions = []; }
if (window.currentQuestionIndex === undefined) { window.currentQuestionIndex = 0; }
if (window.userScore === undefined) { window.userScore = 0; }

async function generateAssignment() {
    const container = document.getElementById('quizContainer');
    const footer = document.getElementById('quizFooter');
    
    container.innerHTML = `<div class="loader"><div class="spinner"></div> Generating 20 technical questions for ${currentQuizRole}...</div>`;
    footer.style.display = "none";

    const prompt = `Generate exactly 20 multiple-choice questions for a technical assessment for the role of ${currentQuizRole}. 
    Format the response as a valid JSON array of objects. Each object must have:
    "question": "the question text",
    "options": ["A", "B", "C", "D"],
    "answer": index_of_correct_option (0-3).
    Return ONLY the raw JSON array. Do not include any conversational text or explanations.`;

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt, role: currentQuizRole })
        });
        const data = await response.json();
        
        // STRENGTHENED CLEANER: Finds the first '[' and last ']' to extract ONLY the array
        const rawAdvice = data.advice;
        const startIndex = rawAdvice.indexOf('[');
        const endIndex = rawAdvice.lastIndexOf(']') + 1;
        
        if (startIndex === -1 || endIndex === 0) {
            throw new Error("AI did not return a valid JSON array.");
        }

        const cleanJson = rawAdvice.substring(startIndex, endIndex);
        window.quizQuestions = JSON.parse(cleanJson);
        
        window.currentQuestionIndex = 0;
        window.userScore = 0;
        footer.style.display = "flex";
        displayQuestion();
        
    } catch (e) {
        console.error("Quiz Generation Error:", e);
        container.innerHTML = `<p style="color:var(--danger); margin-bottom:12px;">Error: AI returned invalid data. Please try again.</p>
        <button class="btn-primary" onclick="generateAssignment()">Retry</button>`;
    }
}

function displayQuestion() {
    const container = document.getElementById('quizContainer');
    const questionData = window.quizQuestions[window.currentQuestionIndex];
    
    const progress = ((window.currentQuestionIndex + 1) / window.quizQuestions.length) * 100;
    document.getElementById('quizProgressBar').style.width = `${progress}%`;
    document.getElementById('questionCountLabel').innerText = `Question ${window.currentQuestionIndex + 1} of ${window.quizQuestions.length}`;

    container.innerHTML = `
        <div class="question-box">
            <h3>${questionData.question}</h3>
            <div style="display:flex; flex-direction:column; gap:8px;">
                ${questionData.options.map((opt, i) => `
                    <button class="option-card" onclick="checkAnswer(${i})">
                        ${opt}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

function checkAnswer(selectedIndex) {
    const correctAnswer = window.quizQuestions[window.currentQuestionIndex].answer;
    if (selectedIndex === correctAnswer) {
        window.userScore++;
    }

    window.currentQuestionIndex++;
    if (window.currentQuestionIndex < window.quizQuestions.length) {
        displayQuestion();
    } else {
        showQuizResults();
    }
}

function showQuizResults() {
    const container = document.getElementById('quizContainer');
    const footer = document.getElementById('quizFooter');
    footer.style.display = "none";

    const percentage = (window.userScore / window.quizQuestions.length) * 100;
    let feedback = percentage >= 80 ? "🏆 Excellent! You are industry-ready." : 
                   percentage >= 50 ? "👍 Good job! Keep practicing." : 
                   "📘 Review the roadmap to improve.";

    container.innerHTML = `
        <div class="quiz-results">
            <i class="fa-solid fa-trophy" style="font-size:48px; color:#f59e0b;"></i>
            <h2>Assignment Complete!</h2>
            <div style="font-size:3rem; font-weight:800; font-family:'Syne',sans-serif; background:var(--gradient-hero); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin:16px 0;">
                ${window.userScore} / ${window.quizQuestions.length}
            </div>
            <p>${feedback}</p>
            <button class="btn-primary" onclick="closeAssignment()">Finish</button>
        </div>
    `;
}

// ===================== REPORT SYSTEM =====================

function checkReportReady(role, cardId) {
    // Check Roadmap completion
    const roadmapDone =
        document.getElementById(cardId) &&
        document.getElementById(cardId).innerText.trim().length > 30;

    // Check Assignment completion (20 questions attempted)
    const assignmentDone =
        window.quizQuestions &&
        window.quizQuestions.length === 20 &&
        window.currentQuestionIndex >= 20;

    if (!roadmapDone || !assignmentDone) {
        alert("⚠️ Please complete the Roadmap and Assignment to generate the report.");
        return;
    }

    // Interview is OPTIONAL
    window.currentReportRole = role;
    window.currentReportCardId = cardId;

    document.getElementById('reportFormModal').style.display = 'flex';
    document.getElementById('modalOverlay').style.display = 'block';
}

function closeReportForm() {
    document.getElementById('reportFormModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

function processReportPDF() {
    const name   = document.getElementById('userName').value.trim();
    const dob    = document.getElementById('userDOB').value.trim();
    const course = document.getElementById('userCourse').value.trim();

    if (!name || !dob || !course) { alert("Please fill all details"); return; }

    const score  = window.userScore || 0;
    const role   = window.currentReportRole || "Unknown";
    const branch = currentBranch || "N/A";
    const subjects = selectedSubjects.length > 0 ? selectedSubjects.join(", ") : "N/A";

    let evaluation = "";
    if (score < 10)      evaluation = "Needs Improvement - Focus on core fundamentals.";
    else if (score < 15) evaluation = "Good - Solid grasp of concepts.";
    else if (score < 18) evaluation = "Very Good - Competitive for this role.";
    else                 evaluation = "Excellent - Industry-ready!";

    const roadmapEl  = document.getElementById(window.currentReportCardId);
    const roadmapRaw = roadmapEl ? roadmapEl.innerText.trim() : "No roadmap generated.";

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });

    const pageW    = doc.internal.pageSize.getWidth();
    const pageH    = doc.internal.pageSize.getHeight();
    const margin   = 48;
    const contentW = pageW - margin * 2;
    let y = 0;

    function checkPage(needed) {
        if (y + (needed || 20) > pageH - 50) { doc.addPage(); y = margin; }
    }

    // HEADER BAR
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageW, 68, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("PathFinder AI", margin, 28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Career Assessment Report", margin, 46);
    const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    doc.text(dateStr, pageW - margin, 46, { align: "right" });

    y = 90;

    // STUDENT PROFILE BOX
    doc.setFillColor(238, 242, 255);
    doc.roundedRect(margin, y, contentW, 88, 6, 6, "F");
    doc.setFillColor(99, 102, 241);
    doc.rect(margin, y, 4, 88, "F");

    doc.setTextColor(107, 114, 128);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("STUDENT PROFILE", margin + 14, y + 17);

    doc.setFontSize(10.5);
    doc.setTextColor(31, 41, 55);

    doc.setFont("helvetica", "bold"); doc.text("Name:", margin + 14, y + 34);
    doc.setFont("helvetica", "normal"); doc.text(name, margin + 52, y + 34);

    doc.setFont("helvetica", "bold"); doc.text("DOB:", margin + 200, y + 34);
    doc.setFont("helvetica", "normal"); doc.text(dob, margin + 228, y + 34);

    doc.setFont("helvetica", "bold"); doc.text("Course:", margin + 14, y + 52);
    doc.setFont("helvetica", "normal"); doc.text(course, margin + 58, y + 52);

    doc.setFont("helvetica", "bold"); doc.text("Branch:", margin + 200, y + 52);
    doc.setFont("helvetica", "normal"); doc.text(branch, margin + 242, y + 52);

    doc.setFont("helvetica", "bold"); doc.text("Subjects:", margin + 14, y + 70);
    doc.setFont("helvetica", "normal");
    const subLine = doc.splitTextToSize(subjects, contentW - 80)[0];
    doc.text(subLine, margin + 64, y + 70);

    y += 104;

    // TARGET ROLE BOX
    checkPage(60);
    doc.setFillColor(224, 231, 255);
    doc.roundedRect(margin, y, contentW, 50, 6, 6, "F");
    doc.setFillColor(99, 102, 241);
    doc.rect(margin, y, 4, 50, "F");
    doc.setTextColor(107, 114, 128);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("TARGET ROLE", margin + 14, y + 16);
    doc.setTextColor(67, 56, 202);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text(role, margin + 14, y + 37);

    y += 66;

    // ASSIGNMENT SCORE BOX
    checkPage(90);
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(margin, y, contentW, 78, 6, 6, "F");
    doc.setFillColor(16, 185, 129);
    doc.rect(margin, y, 4, 78, "F");
    doc.setTextColor(107, 114, 128);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("TECHNICAL ASSIGNMENT RESULT", margin + 14, y + 16);

    doc.setTextColor(5, 150, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.text(String(score), margin + 14, y + 52);
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(13);
    doc.text("/ 20", margin + 48, y + 52);

    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(evaluation, margin + 95, y + 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text("Score based on technical MCQ assignment", margin + 95, y + 52);

    // Score bar
    const bX = margin + 95, bY = y + 60, bW = contentW - 106, bH = 7;
    doc.setFillColor(209, 250, 229);
    doc.roundedRect(bX, bY, bW, bH, 3, 3, "F");
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(bX, bY, bW * (score / 20), bH, 3, 3, "F");

    y += 94;

    // ROADMAP SECTION
    checkPage(30);
    doc.setTextColor(107, 114, 128);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("AI CAREER ROADMAP", margin, y + 14);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 18, margin + contentW, y + 18);
    y += 30;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);

    const roadmapLines = doc.splitTextToSize(roadmapRaw, contentW - 10);
    roadmapLines.forEach(function(line) {
        checkPage(16);
        const trimmed = line.trim();
        if (trimmed === "") { y += 5; return; }
        if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
            doc.setTextColor(79, 70, 229);
            doc.text("->", margin, y);
            doc.setTextColor(55, 65, 81);
            doc.text(trimmed.replace(/^[•\-\*]\s*/, ""), margin + 18, y);
        } else if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !/\d/.test(trimmed)) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(79, 70, 229);
            doc.text(line, margin, y);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(55, 65, 81);
        } else {
            doc.text(line, margin, y);
        }
        y += 16;
    });

    // FOOTER on all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(249, 250, 251);
        doc.rect(0, pageH - 30, pageW, 30, "F");
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.5);
        doc.line(0, pageH - 30, pageW, pageH - 30);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text("(c) 2026 PathFinder AI - Confidential, for personal use only", margin, pageH - 12);
        doc.text("Page " + i + " of " + totalPages, pageW - margin, pageH - 12, { align: "right" });
    }

    doc.save(name.replace(/\s+/g, "_") + "_PathFinder_Report.pdf");
    closeReportForm();
}
function closeAllModals() {
    document.getElementById('interviewModal').style.display = 'none';
    document.getElementById('assignmentModal').style.display = 'none';
    document.getElementById('reportFormModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
    synth.cancel(); // Stop AI speaking if modal closes
}

// =====================================================================
// PHASE 2 — CAREER ROADMAP PLANNER
// =====================================================================

// -------- CAREER DATABASE (from careers.json) --------
const CAREER_DATA = [
    {
        id: "software_dev",
        title: "Software Developer",
        icon: "💻",
        description: "Building core systems and applications using logic and high-level languages.",
        branches: ["CSE"],
        subject_weights: [
            { name: "DSA", weight: 10 }, { name: "OOP", weight: 9 },
            { name: "C++", weight: 8 }, { name: "Java", weight: 8 }, { name: "SQL", weight: 6 }
        ]
    },
    {
        id: "ml_engineer",
        title: "Machine Learning Engineer",
        icon: "🤖",
        description: "Training intelligent models and working with complex data patterns.",
        branches: ["CSE"],
        subject_weights: [
            { name: "ML", weight: 10 }, { name: "AIML Advanced", weight: 10 },
            { name: "Python", weight: 9 }, { name: "Stats", weight: 8 }, { name: "DL", weight: 9 }
        ]
    },
    {
        id: "vlsi_engineer",
        title: "VLSI Design Engineer",
        icon: "🔬",
        description: "Designing and testing integrated circuits and semiconductor devices.",
        branches: ["ECE"],
        subject_weights: [
            { name: "VLSI Design", weight: 10 }, { name: "Digital Electronics", weight: 9 },
            { name: "Circuit Theory", weight: 8 }, { name: "Microprocessors", weight: 7 }, { name: "Analog Circuits", weight: 8 }
        ]
    },
    {
        id: "embedded_sys",
        title: "Embedded Systems Developer",
        icon: "⚙️",
        description: "Combining hardware and software for specialized control systems.",
        branches: ["ECE", "MECH"],
        subject_weights: [
            { name: "Embedded Systems", weight: 10 }, { name: "C", weight: 9 },
            { name: "Microprocessors", weight: 9 }, { name: "IoT", weight: 8 }, { name: "Control Systems", weight: 7 }
        ]
    },
    {
        id: "robotics_specialist",
        title: "Robotics & Automation Engineer",
        icon: "🦾",
        description: "Creating autonomous systems using mechanical design and AI controllers.",
        branches: ["MECH", "ECE"],
        subject_weights: [
            { name: "Robotics", weight: 10 }, { name: "Mechatronics", weight: 10 },
            { name: "Control Systems", weight: 8 }, { name: "Python", weight: 7 }, { name: "CAD/CAM", weight: 6 }
        ]
    },
    {
        id: "iot_architect",
        title: "IoT Solutions Architect",
        icon: "📡",
        description: "Designing networks of connected devices and sensors.",
        branches: ["ECE", "CSE"],
        subject_weights: [
            { name: "IoT", weight: 10 }, { name: "Communication Systems", weight: 9 },
            { name: "Cloud Computing", weight: 8 }, { name: "Cyber Security", weight: 7 }, { name: "Signal Processing", weight: 7 }
        ]
    },
    {
        id: "thermal_engineer",
        title: "Thermal Systems Designer",
        icon: "🌡️",
        description: "Analyzing heat transfer and energy conversion in mechanical systems.",
        branches: ["MECH"],
        subject_weights: [
            { name: "Thermodynamics", weight: 10 }, { name: "Heat Transfer", weight: 10 },
            { name: "Fluid Mechanics", weight: 9 }, { name: "Refrigeration", weight: 8 }, { name: "Automobile Engineering", weight: 6 }
        ]
    },
    {
        id: "manufacturing_lead",
        title: "Manufacturing & Operations Manager",
        icon: "🏭",
        description: "Optimizing industrial production processes and workflows.",
        branches: ["MECH"],
        subject_weights: [
            { name: "Manufacturing Process", weight: 10 }, { name: "Industrial Engineering", weight: 9 },
            { name: "CAD/CAM", weight: 8 }, { name: "Solid Mechanics", weight: 7 }, { name: "Kinematics", weight: 6 }
        ]
    },
    {
        id: "ev_specialist",
        title: "Electric Vehicle Engineer",
        icon: "⚡",
        description: "Developing powertrain and battery systems for modern transport.",
        branches: ["MECH", "ECE"],
        subject_weights: [
            { name: "Automobile Engineering", weight: 10 }, { name: "Analog Circuits", weight: 8 },
            { name: "Thermodynamics", weight: 8 }, { name: "Control Systems", weight: 9 }, { name: "Embedded Systems", weight: 7 }
        ]
    }
];

// Phase 2 state
let p2Branch = "";
let p2SelectedJob = null;
let p2SelectedTime = "";
let p2CurrentSkills = [];

// -------- NAVIGATION --------
function startPhase2() {
    showSection('phase2');
    p2GoToStep(1);
}

function p2GoToStep(stepNum) {
    [1, 2, 3, 4].forEach(n => {
        const el = document.getElementById(`p2-step-${n}`);
        if (el) el.style.display = 'none';
        const dot = document.getElementById(`p2-dot-${n}`);
        if (dot) {
            if (n <= stepNum) dot.classList.add('active');
            else dot.classList.remove('active');
        }
    });
    const current = document.getElementById(`p2-step-${stepNum}`);
    if (current) current.style.display = 'block';
}

// -------- STEP 1: BRANCH --------
function p2SelectBranch(branch) {
    p2Branch = branch;

    document.getElementById('p2-branch-label').innerText = `Branch: ${branch}`;
    document.getElementById('p2-skills-branch-label').innerText = `Branch: ${branch}`;

    // Filter careers by branch
    const filtered = CAREER_DATA.filter(c => c.branches.includes(branch));
    const grid = document.getElementById('p2-job-grid');
    grid.innerHTML = "";

    filtered.forEach(career => {
        grid.innerHTML += `
            <div class="job-card" id="jobcard-${career.id}" onclick="p2SelectJob('${career.id}')">
                <span class="job-card-icon">${career.icon}</span>
                <h4>${career.title}</h4>
                <p>${career.description}</p>
            </div>
        `;
    });

    p2SelectedJob = null;
    p2GoToStep(2);
}

// -------- STEP 2: JOB SELECTION --------
function p2SelectJob(jobId) {
    // Deselect all
    document.querySelectorAll('.job-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(`jobcard-${jobId}`).classList.add('selected');
    p2SelectedJob = CAREER_DATA.find(c => c.id === jobId);

    // Show selected pill on next step
    setTimeout(() => {
        const pill = document.getElementById('p2-selected-job-display');
        if (pill) pill.innerHTML = `${p2SelectedJob.icon} ${p2SelectedJob.title}`;
        p2GoToStep(3);
    }, 200);
}

// -------- STEP 3: TIMELINE --------
function p2SelectTime(time, el) {
    document.querySelectorAll('.timeline-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    p2SelectedTime = time;

    // Load skills grid for Step 4
    const grid = document.getElementById('p2-skills-grid');
    grid.innerHTML = "";
    BRANCH_DATA[p2Branch].forEach(sub => {
        grid.innerHTML += `
            <label class="chip">
                <input type="checkbox" class="p2-skill-check" value="${sub}" onchange="updateP2Skills()">
                <span>${sub}</span>
            </label>
        `;
    });
    p2CurrentSkills = [];

    setTimeout(() => p2GoToStep(4), 200);
}

function updateP2Skills() {
    p2CurrentSkills = [...document.querySelectorAll('.p2-skill-check:checked')].map(el => el.value);
}

// -------- STEP 4: GENERATE ROADMAP --------
async function generateCareerRoadmap() {
    if (!p2SelectedJob) { alert("Please select a dream role."); return; }
    if (!p2SelectedTime) { alert("Please select your timeline."); return; }

    // Figure out what skills they need but don't have
    const requiredSkills = p2SelectedJob.subject_weights.map(s => s.name);
    const missingSkills = requiredSkills.filter(s => !p2CurrentSkills.includes(s));
    const hasSkills = requiredSkills.filter(s => p2CurrentSkills.includes(s));

    // Show results section immediately with loader
    showSection('phase2Results');
    document.getElementById('p2ResultTitle').innerText = `Roadmap → ${p2SelectedJob.title}`;
    document.getElementById('p2ResultSubtitle').innerText = `Personalised ${p2SelectedTime} plan for a ${p2Branch} student.`;

    // Summary strip
    document.getElementById('p2SummaryStrip').innerHTML = `
        <div class="summary-chip"><i class="fa-solid fa-user-graduate"></i> ${p2Branch} Branch</div>
        <div class="summary-chip"><i class="fa-solid fa-bullseye"></i> ${p2SelectedJob.title}</div>
        <div class="summary-chip"><i class="fa-solid fa-clock"></i> ${p2SelectedTime}</div>
        <div class="summary-chip"><i class="fa-solid fa-circle-check"></i> ${hasSkills.length} skills known</div>
        <div class="summary-chip"><i class="fa-solid fa-fire"></i> ${missingSkills.length} skills to build</div>
    `;

    const content = document.getElementById('p2RoadmapContent');
    content.innerHTML = `<div class="loader"><div class="spinner"></div> Building your personalised roadmap with AI...</div>`;

    const prompt = `
You are a senior career counsellor. Create a detailed, actionable, month-by-month career roadmap.

Student Profile:
- Branch: ${p2Branch}
- Dream Role: ${p2SelectedJob.title} (${p2SelectedJob.description})
- Time Available: ${p2SelectedTime}
- Skills Already Known: ${p2CurrentSkills.length > 0 ? p2CurrentSkills.join(", ") : "None yet"}
- Skills to Develop: ${missingSkills.join(", ")}
- Key skills needed for this role: ${requiredSkills.join(", ")}

Your response MUST follow this EXACT structure:

**SKILLS TO DEVELOP**
List the specific technical skills this student must learn, marking which ones they already have vs need to learn.

**MONTH-BY-MONTH ROADMAP**
Break down the ${p2SelectedTime} into months (e.g. Month 1, Month 2, etc.). For each month write:
- Focus: [main topic/skill for that month]
- Learn: [specific courses, concepts, or tools to study]
- Build: [one mini project or practical task to do]

**PROJECTS TO BUILD**
List 3-5 projects (with names and short descriptions) that will make their portfolio strong for ${p2SelectedJob.title}.

**FINAL MILESTONE**
A short summary of what they should be able to achieve by the end of the timeline.

Keep responses concise and action-oriented. No fluff.
`;

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt, role: p2SelectedJob.title })
        });

        if (!response.ok) throw new Error(`Backend error: ${response.status}`);

        const data = await response.json();
        if (!data.advice) throw new Error("Empty AI response");

        // Format the roadmap nicely
        content.innerHTML = formatRoadmapHTML(data.advice, hasSkills, missingSkills);

    } catch (error) {
        console.error("Roadmap error:", error);
        content.innerHTML = `
            <div style="color:var(--danger); padding:20px;">
                <strong>Error:</strong> ${error.message}
                <br><br>
                <button class="btn-primary" onclick="generateCareerRoadmap()">Retry</button>
            </div>
        `;
    }
}

// -------- FORMAT ROADMAP HTML --------
function formatRoadmapHTML(raw, hasSkills, missingSkills) {
    let html = raw
        // Section titles
        .replace(/\*\*SKILLS TO DEVELOP\*\*/gi, `<div class="roadmap-section-title"><i class="fa-solid fa-dumbbell"></i> Skills to Develop</div>`)
        .replace(/\*\*MONTH-BY-MONTH ROADMAP\*\*/gi, `<div class="roadmap-section-title"><i class="fa-solid fa-calendar-days"></i> Month-by-Month Roadmap</div>`)
        .replace(/\*\*PROJECTS TO BUILD\*\*/gi, `<div class="roadmap-section-title"><i class="fa-solid fa-hammer"></i> Projects to Build</div>`)
        .replace(/\*\*FINAL MILESTONE\*\*/gi, `<div class="roadmap-section-title"><i class="fa-solid fa-flag-checkered"></i> Final Milestone</div>`)

        // Month headings
        .replace(/\*\*Month (\d+)[:\-]?\*\*/gi, (_, n) =>
            `<div class="month-block"><div class="month-label">📅 Month ${n}</div>`)

        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

        // Bullet points
        .replace(/^\* (.+)$/gm, '<div style="padding:3px 0 3px 14px; border-left:2px solid var(--border);">• $1</div>')
        .replace(/^- (.+)$/gm, '<div style="padding:3px 0 3px 14px; border-left:2px solid var(--border);">• $1</div>')

        // Line breaks
        .replace(/\n\n/g, '</div><br>')
        .replace(/\n/g, '<br>');

    // Known skills chips
    if (hasSkills.length > 0) {
        const chipsHTML = hasSkills.map(s => `<span class="skill-chip">${s} ✓</span>`).join('');
        const newChipsHTML = missingSkills.map(s => `<span class="skill-chip new">${s} ← learn</span>`).join('');
        html = `
            <div style="margin-bottom:20px;">
                <div style="font-size:0.78rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">You already know</div>
                <div class="skill-chips-row">${chipsHTML}</div>
                <div style="font-size:0.78rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin:12px 0 8px;">Skills to build</div>
                <div class="skill-chips-row">${newChipsHTML}</div>
            </div>
            <hr style="border:none; border-top:1px solid var(--border); margin:20px 0;">
        ` + html;
    }

    return html;
}