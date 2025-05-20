// Initialize Pyodide
let pyodide;
let pyodideReady = false;

async function initializePyodide() {
    try {
        // Show loading state
        document.querySelectorAll('.output').forEach(el => {
            el.textContent = "Loading Python interpreter...";
        });

        pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/"
        });
        
        // Set up console output redirection
        pyodide.setStdout({ batched: (text) => {
            const activeOutput = document.querySelector('section.active .output');
            if (activeOutput) {
                activeOutput.textContent += text;
            }
        }});
        
        pyodideReady = true;
        console.log("Pyodide loaded successfully");
        
        // Initialize default examples
        initializeExamples();
    } catch (error) {
        console.error("Error loading Pyodide:", error);
        document.querySelectorAll('.output').forEach(el => {
            el.textContent = `Error loading Python interpreter: ${error.message}`;
        });
    }
}

// Call the initialization when the page loads
initializePyodide();

function initializeExamples() {
    if (!pyodideReady) return;
    
    // Initialize ACE editors
    const editors = {};
    document.querySelectorAll('.code-editor').forEach(editorEl => {
        const editorId = editorEl.id;
        editors[editorId] = ace.edit(editorId);
        editors[editorId].setTheme("ace/theme/chrome");
        editors[editorId].session.setMode("ace/mode/python");
        editors[editorId].setOptions({
            fontSize: "14px",
            showPrintMargin: false
        });
    });

    // Navigation
    document.querySelectorAll('.sidebar li').forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            
            // Update active nav item
            document.querySelectorAll('.sidebar li').forEach(li => {
                li.classList.remove('active');
            });
            this.classList.add('active');
            
            // Show corresponding section
            document.querySelectorAll('main section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(sectionId).classList.add('active');
            
            // Redraw flowcharts when needed
            if (sectionId === 'simple-if') {
                drawSimpleIfFlowchart();
            } else if (sectionId === 'if-else') {
                drawIfElseFlowchart();
            } else if (sectionId === 'elif') {
                drawElifFlowchart();
            }
        });
    });

    // Initialize default section
    updateIfElse();
    updateElif();
    updateNested();
    updateOperators();
    updateLogical();
    updateDictionary();
    drawSimpleIfFlowchart();
    drawIfElseFlowchart();
    drawElifFlowchart();
}

// Pyodide-based runCode function
async function runCode(editorId, outputId) {
    if (!pyodideReady) {
        document.getElementById(outputId).textContent = "Python interpreter still loading...";
        return;
    }

    const code = ace.edit(editorId).getValue();
    const outputEl = document.getElementById(outputId);
    outputEl.textContent = ""; // Clear previous output
    
    try {
        await pyodide.loadPackagesFromImports(code);
        await pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
`);
        await pyodide.runPythonAsync(code);
        const output = await pyodide.runPythonAsync("sys.stdout.getvalue()");
        outputEl.textContent = output;
    } catch (error) {
        outputEl.textContent = `Error: ${error.message}`;
    }
}

// Example update functions
function updateIfElse() {
    const temp = document.getElementById('temp-input').value;
    const editor = ace.edit('editor-if-else');
    editor.setValue(`temperature = ${temp}

if temperature > 20:
    print("It's warm outside")
    print("Wear light clothes")
else:
    print("It's cool outside")
    print("Consider wearing a jacket")

print("Enjoy your day!")`, -1);
    runCode('editor-if-else', 'output-if-else');
}

function updateElif() {
    const score = document.getElementById('score-input').value;
    const editor = ace.edit('editor-elif');
    editor.setValue(`score = ${score}

if score >= 90:
    print("Grade: A")
elif score >= 80:
    print("Grade: B")
elif score >= 70:
    print("Grade: C")
elif score >= 60:
    print("Grade: D")
else:
    print("Grade: F")`, -1);
    runCode('editor-elif', 'output-elif');
}

function updateNested() {
    const isWeekend = document.getElementById('weekend-check').checked ? 'True' : 'False';
    const weather = document.getElementById('weather-select').value;
    const editor = ace.edit('editor-nested');
    editor.setValue(`is_weekend = ${isWeekend}
weather = "${weather}"

if is_weekend:
    if weather == "sunny":
        print("Go to the beach")
        print("Don't forget sunscreen!")
    else:
        print("Watch a movie at home")
        print("Make some popcorn")
else:
    if weather == "sunny":
        print("Go to work but enjoy the weather during breaks")
    else:
        print("Go to work and stay cozy inside")`, -1);
    runCode('editor-nested', 'output-nested');
}

function updateOperators() {
    const a = document.getElementById('a-input').value;
    const b = document.getElementById('b-input').value;
    const output = document.getElementById('output-operators');
    
    const comparisons = [
        `${a} == ${b}: ${a == b}`,
        `${a} != ${b}: ${a != b}`,
        `${a} > ${b}: ${a > b}`,
        `${a} < ${b}: ${a < b}`,
        `${a} >= ${b}: ${a >= b}`,
        `${a} <= ${b}: ${a <= b}`
    ];
    
    output.textContent = comparisons.join('\n');
}

function updateLogical() {
    const age = document.getElementById('logic-age').value;
    const income = document.getElementById('logic-income').value;
    const hasLicense = document.getElementById('logic-license').checked;
    const output = document.getElementById('output-logical');
    
    const results = [];
    
    // AND example
    if (age >= 21 && income >= 40000) {
        results.push(`AND (age >= 21 and income >= 40000): Eligible for premium credit card`);
    } else {
        results.push(`AND (age >= 21 and income >= 40000): Not eligible`);
    }
    
    // OR example
    if (hasLicense || age >= 18) {
        results.push(`OR (hasLicense or age >= 18): Can rent some vehicles`);
    } else {
        results.push(`OR (hasLicense or age >= 18): Cannot rent`);
    }
    
    // NOT example
    if (!hasLicense) {
        results.push(`NOT (not hasLicense): Cannot drive legally`);
    } else {
        results.push(`NOT (not hasLicense): Can drive legally`);
    }
    
    output.textContent = results.join('\n');
}

function updateDictionary() {
    const op = document.getElementById('dict-op').value;
    const x = document.getElementById('dict-x').value;
    const y = document.getElementById('dict-y').value;
    const editor = ace.edit('editor-dict');
    editor.setValue(`def calculate_add(x, y):
    return x + y

def calculate_subtract(x, y):
    return x - y

def calculate_multiply(x, y):
    return x * y

operations = {
    'add': calculate_add,
    'subtract': calculate_subtract,
    'multiply': calculate_multiply
}

operation = '${op}'
x, y = ${x}, ${y}

result = operations.get(operation, lambda x,y: "Unknown operation")(x, y)
print(f"Result: {result}")`, -1);
    runCode('editor-dict', 'output-dict');
}

// Flowchart functions (keep these the same)
function drawSimpleIfFlowchart() {
    const diagram = flowchart.parse(`
        st=>start: Start
        cond=>condition: Condition
        true=>operation: Code Block
        after=>operation: Continue
        e=>end: End

        st->cond
        cond(yes)->true->after
        cond(no)->after
        after->e
    `);
    diagram.drawSVG('flow-simple-if', {
        'x': 0,
        'y': 0,
        'line-width': 2,
        'line-length': 50,
        'text-margin': 10,
        'font-size': 14,
        'font-color': 'black',
        'line-color': '#001f3f',
        'element-color': '#001f3f',
        'fill': '#f8f9fa',
        'yes-text': 'True',
        'no-text': 'False',
        'arrow-end': 'block',
        'scale': 1
    });
}

function drawIfElseFlowchart() {
    const diagram = flowchart.parse(`
        st=>start: Start
        cond=>condition: Condition
        true=>operation: If Block
        false=>operation: Else Block
        after=>operation: Continue
        e=>end: End

        st->cond
        cond(yes)->true->after
        cond(no)->false->after
        after->e
    `);
    diagram.drawSVG('flow-if-else', {
        'x': 0,
        'y': 0,
        'line-width': 2,
        'line-length': 50,
        'text-margin': 10,
        'font-size': 14,
        'font-color': 'black',
        'line-color': '#001f3f',
        'element-color': '#001f3f',
        'fill': '#f8f9fa',
        'yes-text': 'True',
        'no-text': 'False',
        'arrow-end': 'block',
        'scale': 1
    });
}

function drawElifFlowchart() {
    const diagram = flowchart.parse(`
        st=>start: Start
        cond1=>condition: Condition 1
        cond2=>condition: Condition 2
        cond3=>condition: Condition 3
        true1=>operation: Block 1
        true2=>operation: Block 2
        true3=>operation: Block 3
        false=>operation: Else Block
        after=>operation: Continue
        e=>end: End

        st->cond1
        cond1(yes)->true1->after
        cond1(no)->cond2
        cond2(yes)->true2->after
        cond2(no)->cond3
        cond3(yes)->true3->after
        cond3(no)->false->after
        after->e
    `);
    diagram.drawSVG('flow-elif', {
        'x': 0,
        'y': 0,
        'line-width': 2,
        'line-length': 50,
        'text-margin': 10,
        'font-size': 12,
        'font-color': 'black',
        'line-color': '#001f3f',
        'element-color': '#001f3f',
        'fill': '#f8f9fa',
        'yes-text': 'True',
        'no-text': 'False',
        'arrow-end': 'block',
        'scale': 1
    });
}