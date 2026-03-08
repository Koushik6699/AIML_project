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
const BACKEND_BASE_URL = "http://127.0.0.1:5000";


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
    if (target) {
        target.style.display = 'block';
    }

    document.querySelectorAll('.sidebar-nav li').forEach(li => {
        li.classList.remove('active');
    });
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

    const prompt = `
I am a ${currentBranch} student.
My mastered subjects are ${selectedSubjects.join(", ")}.
I have a ${prob}% probability for the role of ${role}.
Provide a high-impact roadmap with 3 specific technical skills to learn and 3 project ideas, keep very short points and short answer.
`;

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
    const name = document.getElementById('userName').value;
    const dob = document.getElementById('userDOB').value;
    const course = document.getElementById('userCourse').value;

    if (!name || !dob || !course) {
        alert("Please fill all details");
        return;
    }

    // Prepare Score Evaluation
    let score = window.userScore;
    let evaluation = "";
    if (score < 10) evaluation = "Needs Improvement: Focus on core fundamentals.";
    else if (score < 15) evaluation = "Good: You have a solid grasp of concepts.";
    else if (score < 18) evaluation = "Very Good: You are competitive for this role.";
    else evaluation = "Excellent: You are industry-ready!";

    const roadmapContent = document.getElementById(window.currentReportCardId).innerHTML;

    // Build PDF Content
    const element = document.getElementById('pdf-template');
    element.style.display = "block";
    element.innerHTML = `
        <h1 style="color:#4f46e5; font-family:sans-serif;">PathFinder AI Career Report</h1>
        <hr>
        <p><strong>Name:</strong> ${name} | <strong>DOB:</strong> ${dob}</p>
        <p><strong>Course:</strong> ${course}</p>
        <hr>
        <h2 style="font-family:sans-serif;">Target Role: ${window.currentReportRole}</h2>
        <div style="background:#f3f4f6; padding: 15px; border-radius:10px;">
            <h3 style="font-family:sans-serif;">Technical Assignment Score: ${score}/20</h3>
            <p><strong>Evaluation:</strong> ${evaluation}</p>
        </div>
        <h3 style="font-family:sans-serif;">AI Career Roadmap</h3>
        <div>${roadmapContent}</div>
        <footer style="margin-top:50px; font-size:10px; color:#666;">Generated by PathFinder AI — 2026</footer>
    `;

    // Convert to PDF
    const opt = {
        margin: 0.5,
        filename: `${name}_PathFinder_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
        element.style.display = "none";
        closeReportForm();
    });
}

function closeAllModals() {
    document.getElementById('interviewModal').style.display = 'none';
    document.getElementById('assignmentModal').style.display = 'none';
    document.getElementById('reportFormModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
    synth.cancel(); // Stop AI speaking if modal closes
}