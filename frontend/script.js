/**
 * PathFinder | Multi-Branch AI Integration
 */

// 1. Extended Subject Database
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

// Features the ML model expects for the generic prediction (mapping to your backend)
const ML_FEATURES = ["DSA", "ML", "DBMS", "Python", "Stats"];

let currentBranch = "";
let selectedSubjects = [];

/** --- Navigation Logic --- **/

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => sec.style.display = 'none');
    // Show target
    document.getElementById(sectionId).style.display = 'block';
    
    // Update Sidebar Active State
    document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
    // (Logic to match li to section would go here)
}

function startAssessment() {
    showSection('assessment');
    goToStep(1);
}

function goToStep(stepNum) {
    // Hide all steps
    document.getElementById('step-1').style.display = 'none';
    document.getElementById('step-2').style.display = 'none';
    document.getElementById('step-3').style.display = 'none';
    
    // Show current step
    document.getElementById(`step-${stepNum}`).style.display = 'block';
    
    // Update Stepper UI
    document.querySelectorAll('.step').forEach((s, idx) => {
        if (idx + 1 <= stepNum) s.classList.add('active');
        else s.classList.remove('active');
    });
}

/** --- Step 1: Branch Selection --- **/

function selectBranch(branch) {
    currentBranch = branch;
    document.getElementById('selected-branch-label').innerText = `Branch: ${branch}`;
    
    // Populate Subjects for this branch
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
    
    goToStep(2);
}

function updateSelection() {
    selectedSubjects = [...document.querySelectorAll('.sub-check:checked')].map(el => el.value);
}

/** --- Step 2: Subject Selection --- **/

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
                <input type="number" class="mark-val" data-sub="${sub}" placeholder="0" min="0" max="100">
            </div>
        `;
    });
    goToStep(3);
}

/** --- Step 3: Calculation & Backend Integration --- **/

async function calculateJobProbability() {
    const marksData = {};
    document.querySelectorAll('.mark-val').forEach(input => {
        marksData[input.dataset.sub] = parseInt(input.value) || 0;
    });

    // Preparing the feature vector for your existing backend ML model
    const featureVector = ML_FEATURES.map(feat => marksData[feat] || 0);
    
    const container = document.getElementById("resultsContainer");
    container.innerHTML = `<div class="loader"><div class="spinner"></div> Analyzing ${currentBranch} Profile...</div>`;
    
    showSection('resultsPage');

    try {
        const response = await fetch('https://aiml-project-swqs.onrender.com/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                branch: currentBranch,
                marks: featureVector,
                all_marks: marksData 
            })
        });

        const results = await response.json();
        container.innerHTML = ""; 

        results.forEach((item, index) => {
            const cardId = `roadmap-${index}`;
            container.innerHTML += `
                <div class="career-card">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h4 style="color:var(--text-muted); text-transform:uppercase; font-size:0.7rem; letter-spacing:1px; margin-bottom:5px;">Target Role</h4>
                            <h3 style="margin:0;">${item.role}</h3>
                        </div>
                        <div style="text-align:right;">
                            <h4 style="color:var(--text-muted); text-transform:uppercase; font-size:0.7rem; letter-spacing:1px; margin-bottom:5px;">Probability</h4>
                            <span style="font-size:1.5rem; font-weight:800; color:var(--primary);">${item.prob}%</span>
                        </div>
                    </div>
                    <div class="prob-bar-bg">
                        <div class="prob-bar-fill" style="width: ${item.prob}%"></div>
                    </div>
                    <button class="btn-ai-roadmap" id="btn-${cardId}" onclick="generateRoadmap('${item.role}', ${item.prob}, '${cardId}')">
                        ✨ Generate AI Career Path
                    </button>
                    <div id="${cardId}" class="ai-roadmap-box" style="display:none;"></div>
                </div>
            `;
        });
    } catch (error) {
        container.innerHTML = `<div class="career-card"><h3>Backend Error</h3><p>Could not connect to the analysis engine.</p></div>`;
    }
}

/** --- Gemini AI Roadmap Logic --- **/

async function generateRoadmap(role, prob, containerId) {
    const roadmapBox = document.getElementById(containerId);
    const btn = document.getElementById(`btn-${containerId}`);
    
    const prompt = `I am a ${currentBranch} student. My mastered subjects are ${selectedSubjects.join(", ")}. I have a ${prob}% probability for the role of ${role}. Provide a high-impact roadmap with 3 specific technical skills to learn and 3 project ideas.`;

    roadmapBox.style.display = "block";
    roadmapBox.innerHTML = `<div class="spinner"></div> Mapping your path...`;
    btn.disabled = true;

    try {
        const response = await fetch('https://aiml-project-swqs.onrender.com/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt, role: role })
        });

        const data = await response.json();
        let formattedText = data.advice
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\* /g, '• ')
            .replace(/\n/g, '<br>');
        
        roadmapBox.innerHTML = `<div class="roadmap-content">${formattedText}</div>`;
    } catch (error) {
        roadmapBox.innerHTML = `<span style="color:red;">Failed to load roadmap.</span>`;
    } finally {
        btn.disabled = false;
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('themeBtn');
    btn.innerHTML = document.body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌙 Dark Mode';
}