// API Configuration\par
let API_KEY = localStorage.getItem('gemini_api_key') || '';\par
const API_TYPE = 'gemini'; // Using Gemini as requested\par
\par
// Check for API key on page load\par
window.addEventListener('load', () => \{\par
    if (!API_KEY) \{\par
        document.getElementById('apiKeyModal').style.display = 'flex';\par
    \}\par
    loadFromLocalStorage();\par
\});\par
\par
// Save API key function\par
function saveAPIKey() \{\par
    const apiKey = document.getElementById('apiKeyInput').value;\par
    if (apiKey) \{\par
        API_KEY = apiKey;\par
        localStorage.setItem('gemini_api_key', apiKey);\par
        document.getElementById('apiKeyModal').style.display = 'none';\par
    \} else \{\par
        alert('Please enter your API key');\par
    \}\par
\}\par
\par
// Save/Load functionality using localStorage\par
function saveToLocalStorage() \{\par
    const formData = \{\par
        fullName: document.getElementById('fullName').value,\par
        email: document.getElementById('email').value,\par
        phone: document.getElementById('phone').value,\par
        location: document.getElementById('location').value,\par
        targetRole: document.getElementById('targetRole').value,\par
        skills: document.getElementById('skills').value,\par
        experience: document.getElementById('experience').value,\par
        education: document.getElementById('education').value, // NEW\par
        jobDescription: document.getElementById('jobDescription').value,\par
        template: document.getElementById('template').value\par
    \};\par
    localStorage.setItem('resumeData', JSON.stringify(formData));\par
\}\par
\par
function loadFromLocalStorage() \{\par
    const saved = localStorage.getItem('resumeData');\par
    if (saved) \{\par
        const formData = JSON.parse(saved);\par
        Object.keys(formData).forEach(key => \{\par
            const element = document.getElementById(key);\par
            if (element) \{\par
                element.value = formData[key];\par
            \}\par
        \});\par
    \}\par
\}\par
\par
// Save data whenever user types\par
document.querySelectorAll('input, textarea, select').forEach(element => \{\par
    element.addEventListener('input', saveToLocalStorage);\par
\});\par
\par
// Handle form submission\par
document.getElementById('resumeForm').addEventListener('submit', async (e) => \{\par
    e.preventDefault();\par
\par
    // Check API key\par
    if (!API_KEY) \{\par
        document.getElementById('apiKeyModal').style.display = 'flex';\par
        return;\par
    \}\par
\par
    // Show loading\par
    document.getElementById('loadingOverlay').classList.remove('hidden');\par
\par
    // Get form data\par
    const formData = \{\par
        fullName: document.getElementById('fullName').value,\par
        email: document.getElementById('email').value,\par
        phone: document.getElementById('phone').value,\par
        location: document.getElementById('location').value,\par
        targetRole: document.getElementById('targetRole').value,\par
        skills: document.getElementById('skills').value,\par
        experience: document.getElementById('experience').value,\par
        education: document.getElementById('education').value, // NEW\par
        jobDescription: document.getElementById('jobDescription').value,\par
        template: document.getElementById('template').value\par
    \};\par
\par
    try \{\par
        // Generate AI content\par
        const aiContent = await generateAIContent(formData);\par
\par
        // Calculate ATS score\par
        const atsScore = calculateATSScore(formData, aiContent);\par
        displayATSScore(atsScore);\par
\par
        // Display resume\par
        displayResume(formData, aiContent);\par
\par
        // Show download buttons\par
        document.getElementById('downloadButtons').classList.remove('hidden');\par
\par
    \} catch (error) \{\par
        console.error('Error:', error);\par
        alert('Error generating resume. Please check your API key and try again.');\par
    \} finally \{\par
        // Hide loading\par
        document.getElementById('loadingOverlay').classList.add('hidden');\par
    \}\par
\});\par
\par
// Generate AI content based on user input\par
async function generateAIContent(formData) \{\par
    const prompt = `\par
    Create a professional resume content for a $\{formData.targetRole\} position.\par
\par
    User Information:\par
    - Name: $\{formData.fullName\}\par
    - Current experience: $\{formData.experience\}\par
    - Education: $\{formData.education\}\par
    - Skills: $\{formData.skills\}\par
    $\{formData.jobDescription ? `- Target job description: $\{formData.jobDescription\}` : ''\}\par
\par
    Please generate:\par
    1. A professional summary (2-3 sentences)\par
    2. 3-5 bullet points for the experience section that:\par
       - Start with action verbs\par
       - Include quantifiable achievements where possible\par
       - Align with the target role\par
       - Use ATS-friendly keywords\par
    3. Enhanced education description if needed\par
    4. A list of relevant keywords for the skills section\par
\par
    Format the response as JSON with the following structure:\par
    \{\par
        "summary": "professional summary here",\par
        "experienceBullets": ["bullet 1", "bullet 2", "bullet 3"],\par
        "educationEnhancement": "any suggestions to improve education section",\par
        "keywords": ["keyword1", "keyword2", "keyword3"]\par
    \}\par
    `;\par
\par
    return await callGeminiAPI(prompt);\par
\}\par
\par
// Gemini API call\par
async function callGeminiAPI(prompt) \{\par
    try \{\par
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$\{API_KEY\}`, \{\par
            method: 'POST',\par
            headers: \{\par
                'Content-Type': 'application/json',\par
            \},\par
            body: JSON.stringify(\{\par
                contents: [\{\par
                    parts: [\{\par
                        text: prompt\par
                    \}]\par
                \}]\par
            \})\par
        \});\par
\par
        if (!response.ok) \{\par
            throw new Error('API call failed');\par
        \}\par
\par
        const data = await response.json();\par
        const content = data.candidates[0].content.parts[0].text;\par
\par
        // Parse JSON from response\par
        try \{\par
            return JSON.parse(content);\par
        \} catch (e) \{\par
            // Fallback if JSON parsing fails\par
            return \{\par
                summary: "Experienced professional seeking new opportunities in " + formData.targetRole,\par
                experienceBullets: [\par
                    "Developed and maintained applications using modern technologies",\par
                    "Collaborated with cross-functional teams to deliver projects on time",\par
                    "Improved processes and efficiency through innovative solutions"\par
                ],\par
                educationEnhancement: "",\par
                keywords: formData.skills.split(',').map(s => s.trim())\par
            \};\par
        \}\par
    \} catch (error) \{\par
        console.error('Gemini API Error:', error);\par
        throw error;\par
    \}\par
\}\par
\par
// Display resume with selected template (UPDATED WITH EDUCATION)\par
function displayResume(formData, aiContent) \{\par
    const preview = document.getElementById('resumePreview');\par
    const templateClass = `template-$\{formData.template\}`;\par
\par
    // Build resume HTML based on template\par
    const resumeHTML = `\par
        <div class="resume-content $\{templateClass\}">\par
            <h1>$\{formData.fullName\}</h1>\par
            <div class="contact-info">\par
                $\{formData.email\} $\{formData.phone ? '| ' + formData.phone : ''\} $\{formData.location ? '| ' + formData.location : ''\}\par
            </div>\par
\par
            <h2>Professional Summary</h2>\par
            <p>$\{aiContent.summary\}</p>\par
\par
            <h2>Experience</h2>\par
            <ul>\par
                $\{aiContent.experienceBullets.map(bullet => `<li>$\{bullet\}</li>`).join('')\}\par
            </ul>\par
\par
            $\{formData.education ? `\par
            <h2>Education</h2>\par
            <div class="education-section">\par
                $\{formData.education.split('\\n').map(line => `<p>$\{line\}</p>`).join('')\}\par
                $\{aiContent.educationEnhancement ? `<p><em>$\{aiContent.educationEnhancement\}</em></p>` : ''\}\par
            </div>\par
            ` : ''\}\par
\par
            <h2>Skills</h2>\par
            <div class="skills-list">\par
                $\{[...formData.skills.split(',').map(s => s.trim()), ...aiContent.keywords]\par
                    .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates\par
                    .map(skill => `<span class="skill-tag">$\{skill\}</span>`)\par
                    .join('')\}\par
            </div>\par
        </div>\par
    `;\par
\par
    preview.innerHTML = resumeHTML;\par
\par
    // Store for download functions\par
    window.currentResume = \{\par
        formData: formData,\par
        aiContent: aiContent,\par
        html: resumeHTML\par
    \};\par
\}\par
\par
// Update download functions to include education\par
function downloadTXT() \{\par
    const resume = window.currentResume;\par
\par
    const text = `\par
$\{resume.formData.fullName\}\par
$\{resume.formData.email\} | $\{resume.formData.phone || ''\} | $\{resume.formData.location || ''\}\par
\par
PROFESSIONAL SUMMARY\par
$\{resume.aiContent.summary\}\par
\par
EXPERIENCE\par
$\{resume.aiContent.experienceBullets.map(bullet => `\f1\bullet  $\{bullet\}`).join('\\n')\}\par
\par
$\{resume.formData.education ? `EDUCATION\par
$\{resume.formData.education\}` : ''\}\par
\par
SKILLS\par
$\{[...resume.formData.skills.split(',').map(s => s.trim()), ...resume.aiContent.keywords].join(', ')\}\par
`;\par
\par
    const blob = new Blob([text], \{ type: 'text/plain' \});\par
    const url = window.URL.createObjectURL(blob);\par
    const a = document.createElement('a');\par
    a.href = url;\par
    a.download = `$\{resume.formData.fullName.replace(' ', '_')\}_Resume.txt`;\par
    a.click();\par
\}\par
\par
// Calculate ATS compatibility score (keeping existing function)\par
function calculateATSScore(formData, aiContent) \{\par
    let score = 0;\par
    const feedback = [];\par
\par
    // Check for contact information (20 points)\par
    if (formData.email) score += 10;\par
    if (formData.phone) score += 10;\par
\par
    // Check for keywords from job description (40 points)\par
    if (formData.jobDescription) \{\par
        const jobKeywords = extractKeywords(formData.jobDescription);\par
        const resumeText = `$\{formData.skills\} $\{formData.experience\} $\{formData.education\} $\{aiContent.summary\} $\{aiContent.experienceBullets.join(' ')\}`.toLowerCase();\par
\par
        let keywordMatches = 0;\par
        jobKeywords.forEach(keyword => \{\par
            if (resumeText.includes(keyword.toLowerCase())) \{\par
                keywordMatches++;\par
            \}\par
        \});\par
\par
        const keywordScore = Math.min(40, (keywordMatches / jobKeywords.length) * 50);\par
        score += keywordScore;\par
\par
        if (keywordScore < 20) \{\par
            feedback.push("\f2\u9888?\u-497?\f1  \f0 Add more keywords from the job description");\par
        \}\par
    \} else \{\par
        score += 20; // Partial credit if no job description provided\par
        feedback.push("\f3\u-10179?\u-9055?\f1  \f0 Add a job description for better optimization");\par
    \}\par
\par
    // Check for action verbs (20 points)\par
    const actionVerbs = ['achieved', 'developed', 'managed', 'led', 'improved', 'created', 'implemented'];\par
    const hasActionVerbs = aiContent.experienceBullets.some(bullet => \par
        actionVerbs.some(verb => bullet.toLowerCase().includes(verb))\par
    );\par
    if (hasActionVerbs) \{\par
        score += 20;\par
    \} else \{\par
        feedback.push("\f2\u9888?\u-497?\f1  \f0 Use more action verbs in your experience");\par
    \}\par
\par
    // Check for quantifiable results (20 points)\par
    const hasNumbers = aiContent.experienceBullets.some(bullet => /\\d/.test(bullet));\par
    if (hasNumbers) \{\par
        score += 20;\par
        feedback.push("\f4\u9989?\f1  \f0 Good use of quantifiable results!");\par
    \} else \{\par
        feedback.push("\f3\u-10179?\u-9055?\f1  \f0 Add numbers and metrics to your achievements");\par
    \}\par
\par
    return \{\par
        score: Math.min(100, score),\par
        feedback: feedback\par
    \};\par
\}\par
\par
// Extract keywords from text\par
function extractKeywords(text) \{\par
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'a', 'an'];\par
    const words = text.toLowerCase().split(/\\W+/);\par
    const keywords = words.filter(word => \par
        word.length > 3 && \par
        !commonWords.includes(word) &&\par
        isNaN(word)\par
    );\par
\par
    const frequency = \{\};\par
    keywords.forEach(word => \{\par
        frequency[word] = (frequency[word] || 0) + 1;\par
    \});\par
\par
    return Object.keys(frequency)\par
        .sort((a, b) => frequency[b] - frequency[a])\par
        .slice(0, 10);\par
\}\par
\par
// Display ATS score\par
function displayATSScore(atsResult) \{\par
    const scoreSection = document.getElementById('atsScore');\par
    const scoreFill = document.getElementById('scoreFill');\par
    const scoreValue = document.getElementById('scoreValue');\par
    const feedback = document.getElementById('atsFeedback');\par
\par
    scoreSection.classList.remove('hidden');\par
\par
    setTimeout(() => \{\par
        scoreFill.style.width = atsResult.score + '%';\par
        scoreValue.textContent = atsResult.score;\par
\par
        if (atsResult.score >= 80) \{\par
            scoreFill.style.backgroundColor = '#10b981';\par
        \} else if (atsResult.score >= 60) \{\par
            scoreFill.style.backgroundColor = '#f59e0b';\par
        \} else \{\par
            scoreFill.style.backgroundColor = '#ef4444';\par
        \}\par
    \}, 100);\par
\par
    feedback.innerHTML = '<strong>ATS Optimization Tips:</strong><br>' + \par
        atsResult.feedback.map(tip => `<div style="margin-top: 0.5rem;">$\{tip\}</div>`).join('');\par
\}\par
\par
// Download PDF and DOCX functions remain the same but include education...\par
function downloadPDF() \{\par
    const \{ jsPDF \} = window.jspdf;\par
    const doc = new jsPDF();\par
    const resume = window.currentResume;\par
\par
    let yPosition = 20;\par
\par
    // Name\par
    doc.setFontSize(20);\par
    doc.text(resume.formData.fullName, 20, yPosition);\par
    yPosition += 10;\par
\par
    // Contact\par
    doc.setFontSize(10);\par
    doc.text(`$\{resume.formData.email\} | $\{resume.formData.phone || ''\} | $\{resume.formData.location || ''\}`, 20, yPosition);\par
    yPosition += 15;\par
\par
    // Summary\par
    doc.setFontSize(14);\par
    doc.text('Professional Summary', 20, yPosition);\par
    yPosition += 10;\par
    doc.setFontSize(10);\par
    const summaryLines = doc.splitTextToSize(resume.aiContent.summary, 170);\par
    doc.text(summaryLines, 20, yPosition);\par
    yPosition += summaryLines.length * 5 + 10;\par
\par
    // Experience\par
    doc.setFontSize(14);\par
    doc.text('Experience', 20, yPosition);\par
    yPosition += 10;\par
    doc.setFontSize(10);\par
    resume.aiContent.experienceBullets.forEach(bullet => \{\par
        const bulletLines = doc.splitTextToSize(`\f1\bullet  $\{bullet\}`, 170);\par
        doc.text(bulletLines, 20, yPosition);\par
        yPosition += bulletLines.length * 5 + 3;\par
    \});\par
    yPosition += 10;\par
\par
    // Education\par
    if (resume.formData.education) \{\par
        doc.setFontSize(14);\par
        doc.text('Education', 20, yPosition);\par
        yPosition += 10;\par
        doc.setFontSize(10);\par
        const eduLines = doc.splitTextToSize(resume.formData.education, 170);\par
        doc.text(eduLines, 20, yPosition);\par
        yPosition += eduLines.length * 5 + 10;\par
    \}\par
\par
    // Skills\par
    doc.setFontSize(14);\par
    doc.text('Skills', 20, yPosition);\par
    yPosition += 10;\par
    doc.setFontSize(10);\par
    const skills = [...resume.formData.skills.split(',').map(s => s.trim()), ...resume.aiContent.keywords];\par
    const skillsText = skills.filter((v, i, a) => a.indexOf(v) === i).join(', ');\par
    const skillLines = doc.splitTextToSize(skillsText, 170);\par
    doc.text(skillLines, 20, yPosition);\par
\par
    doc.save(`$\{resume.formData.fullName.replace(' ', '_')\}_Resume.pdf`);\par
\}\par
\par
function downloadDOCX() \{\par
    const \{ Document, Packer, Paragraph, TextRun, HeadingLevel \} = docx;\par
    const resume = window.currentResume;\par
\par
    const children = [\par
        new Paragraph(\{\par
            text: resume.formData.fullName,\par
            heading: HeadingLevel.HEADING_1,\par
        \}),\par
        new Paragraph(\{\par
            text: `$\{resume.formData.email\} | $\{resume.formData.phone || ''\} | $\{resume.formData.location || ''\}`,\par
        \}),\par
        new Paragraph(\{\par
            text: "Professional Summary",\par
            heading: HeadingLevel.HEADING_2,\par
        \}),\par
        new Paragraph(\{\par
            text: resume.aiContent.summary,\par
        \}),\par
        new Paragraph(\{\par
            text: "Experience",\par
            heading: HeadingLevel.HEADING_2,\par
        \}),\par
        ...resume.aiContent.experienceBullets.map(bullet => \par
            new Paragraph(\{\par
                text: bullet,\par
                bullet: \{\par
                    level: 0\par
                \}\par
            \})\par
        ),\par
    ];\par
\par
    // Add education if present\par
    if (resume.formData.education) \{\par
        children.push(\par
            new Paragraph(\{\par
                text: "Education",\par
                heading: HeadingLevel.HEADING_2,\par
            \}),\par
            new Paragraph(\{\par
                text: resume.formData.education,\par
            \})\par
        );\par
    \}\par
\par
    // Add skills\par
    children.push(\par
        new Paragraph(\{\par
            text: "Skills",\par
            heading: HeadingLevel.HEADING_2,\par
        \}),\par
        new Paragraph(\{\par
            text: [...resume.formData.skills.split(',').map(s => s.trim()), ...resume.aiContent.keywords]\par
                .filter((v, i, a) => a.indexOf(v) === i)\par
                .join(', '),\par
        \})\par
    );\par
\par
    const doc = new Document(\{\par
        sections: [\{\par
            properties: \{\},\par
            children: children,\par
        \}],\par
    \});\par
\par
    Packer.toBlob(doc).then(blob => \{\par
        const url = window.URL.createObjectURL(blob);\par
        const a = document.createElement('a');\par
        a.href = url;\par
        a.download = `$\{resume.formData.fullName.replace(' ', '_')\}_Resume.docx`;\par
        a.click();\par
    \});\par
\}\f0\par
}
 