/**
 * PathFinder | Multi-Branch AI Integration
 */

// ===================== CONFIG =====================

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
                            <h4 style="color:var(--text-muted); text-transform:uppercase; font-size:0.7rem; letter-spacing:1px; margin-bottom:5px;">
                                Target Role
                            </h4>
                            <h3 style="margin:0;">${item.role}</h3>
                        </div>
                        <div style="text-align:right;">
                            <h4 style="color:var(--text-muted); text-transform:uppercase; font-size:0.7rem; letter-spacing:1px; margin-bottom:5px;">
                                Probability
                            </h4>
                            <span style="font-size:1.5rem; font-weight:800; color:var(--primary);">
                                ${item.prob}%
                            </span>
                        </div>
                    </div>

                    <div class="prob-bar-bg">
                        <div class="prob-bar-fill" style="width: ${item.prob}%"></div>
                    </div>

                    <button 
                        class="btn-ai-roadmap" 
                        id="btn-${cardId}" 
                        onclick="generateRoadmap('${item.role}', ${item.prob}, '${cardId}')">
                        ✨ Generate AI Career Path
                    </button>

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
    roadmapBox.innerHTML = `<div class="spinner"></div> Mapping your path...`;
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
            <span style="color:red;">
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
        ? '☀️ Light Mode'
        : '🌙 Dark Mode';
}
