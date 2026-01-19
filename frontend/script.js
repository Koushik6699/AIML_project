/**
 * PathFinder | Multi-Model ML Integration with Gemini AI Roadmap
 */

const ALL_SUBJECTS = [
    "DSA", "ML", "DL", "Linear Algebra", "DBMS", "DS", "OOP", 
    "Stats", "C", "C++", "Java", "Python", "SQL", "Node.js", 
    "AIML Basics", "AIML Advanced", "HTML", "CSS"
];

const ML_FEATURES = ["DSA", "ML", "DBMS", "Python", "Stats"];
let selectedSubjects = [];

function init() {
    const grid = document.getElementById('subject-grid');
    if (!grid) return;
    grid.innerHTML = "";
    ALL_SUBJECTS.forEach(sub => {
        grid.innerHTML += `
            <label class="chip">
                <input type="checkbox" class="sub-check" value="${sub}" onchange="updateSelectionCount()">
                <span>${sub}</span>
            </label>
        `;
    });
}

function updateSelectionCount() {
    selectedSubjects = [...document.querySelectorAll('.sub-check:checked')].map(el => el.value);
}

function goToStep2() {
    if (selectedSubjects.length === 0) {
        alert("Please select at least one subject to proceed.");
        return;
    }
    const container = document.getElementById('marks-container');
    container.innerHTML = "";
    selectedSubjects.forEach(sub => {
        container.innerHTML += `
            <div class="mark-input-group">
                <label>${sub}</label>
                <input type="number" class="mark-val" data-sub="${sub}" placeholder="0-100" min="0" max="100">
            </div>
        `;
    });
    document.getElementById('step-1').style.display = 'none';
    document.getElementById('step-2').style.display = 'block';
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function backToStep1() {
    document.getElementById('step-2').style.display = 'none';
    document.getElementById('step-1').style.display = 'block';
}

async function calculateJobProbability() {
    const marksData = {};
    document.querySelectorAll('.mark-val').forEach(input => {
        marksData[input.dataset.sub] = parseInt(input.value) || 0;
    });

    const featureVector = ML_FEATURES.map(feat => marksData[feat] || 0);
    const container = document.getElementById("resultsContainer");
    container.innerHTML = `<div class="loader">Analyzing Profile...</div>`;
    
    document.getElementById('assessment').style.display = 'none';
    document.getElementById('resultsPage').style.display = 'block';

    try {
        const response = await fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                marks: featureVector,
                all_marks: marksData 
            })
        });

        const results = await response.json();
        container.innerHTML = ""; 

        results.forEach((item, index) => {
            const cardId = `roadmap-${index}`;
            container.innerHTML += `
                <div class="career-card" style="margin-bottom: 20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h4 style="color:var(--muted); text-transform:uppercase; font-size:0.7rem; letter-spacing:1px; margin-bottom:5px;">Career Path</h4>
                            <h3 style="margin:0;">${item.role}</h3>
                        </div>
                        <div style="text-align:right;">
                            <h4 style="color:var(--muted); text-transform:uppercase; font-size:0.7rem; letter-spacing:1px; margin-bottom:5px;">Probability</h4>
                            <span style="font-size:1.5rem; font-weight:800; color:var(--primary);">${item.prob}%</span>
                        </div>
                    </div>
                    <p style="font-size:0.8rem; color:var(--muted); margin: 10px 0;">${item.algo}</p>
                    <div class="prob-bar-bg">
                        <div class="prob-bar-fill" style="width: ${item.prob}%"></div>
                    </div>
                    <button class="btn-ai-roadmap" id="btn-${cardId}" onclick="generateRoadmap('${item.role}', ${item.prob}, '${cardId}')">
                        ✨ AI Roadmap
                    </button>
                    <div id="${cardId}" class="ai-roadmap-box" style="display:none;"></div>
                </div>
            `;
        });
    } catch (error) {
        container.innerHTML = `<div class="career-card"><h3>Error: Backend Connection Failed</h3></div>`;
    }
}

async function generateRoadmap(role, prob, containerId) {
    const roadmapBox = document.getElementById(containerId);
    const btn = document.getElementById(`btn-${containerId}`);
    
    // Construct the automatic prompt
    const prompt = `My subjects are ${selectedSubjects.join(", ")} and the job role I got is ${role} with a ${prob}% probability percentage. Give me a short roadmap of what I have to do to improve this and get the job. Format with clear headings like 'Roadmap' and 'Projects to Build' 3 points each, using bullet points. Keep it very short and high quality.`;

    roadmapBox.style.display = "block";
    roadmapBox.innerHTML = `<div class="spinner"></div> Generating your smart guide...`;
    btn.disabled = true;

    try {
        const response = await fetch('http://10.22.86.9:5000/chat', { // Assuming this is your Gemini route
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                role: role, 
                probability: prob,
                prompt: prompt // Sending the specific constructed prompt
            })
        });

        const data = await response.json();
        
        // Simple Markdown-to-HTML formatting for the AI response
        let formattedText = data.advice
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\* /g, '• ')
            .replace(/\n/g, '<br>');
        
        roadmapBox.innerHTML = `<div class="roadmap-content">${formattedText}</div>`;
    } catch (error) {
        roadmapBox.innerHTML = `<span style="color:red;">Failed to connect to Gemini API.</span>`;
    } finally {
        btn.disabled = false;
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

init();