// ----- CONFIG -----
const SYMBOLS = [
    { id: 'buffalo', label: '', color: 'buffalo', value: 10 },
    { id: 'lion', label: '', color: 'lion', value: 8 },
    { id: 'elephant', label: '', color: 'elephant', value: 7 },
    { id: 'deer', label: '', color: 'deer', value: 5 },
    { id: 'zebra', label: '', color: 'zebra', value: 4 },
    { id: 'A', label: 'A', color: 'card', value: 3 },
    { id: 'K', label: 'K', color: 'card', value: 3 },
    { id: 'Q', label: 'Q', color: 'card', value: 2 },
    { id: 'J', label: 'J', color: 'card', value: 2 },
    { id: '10', label: '10', color: 'card', value: 1 },
];

const REELS = 5;
const ROWS = 4;
let grid = [];
let credit = 1000;
const BET = 10;
let isSpinning = false;

const gridElement = document.getElementById('slotGrid');
const creditDisplay = document.getElementById('creditDisplay');
const winDisplay = document.getElementById('winDisplay');
const spinBtn = document.getElementById('spinBtn');

// ----- HELPERS -----
function randomSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function generateGrid() {
    grid = [];
    for (let col = 0; col < REELS; col++) {
        let reel = [];
        for (let row = 0; row < ROWS; row++) {
            reel.push(randomSymbol());
        }
        grid.push(reel);
    }
}

function renderGrid(highlighted = []) {
    gridElement.innerHTML = '';
    // Render column by column
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < REELS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const sym = grid[col][row];
            cell.textContent = sym.label;
            cell.classList.add(sym.color);
            if (highlighted.some(h => h.col === col && h.row === row)) {
                cell.classList.add('highlight');
            }
            gridElement.appendChild(cell);
        }
    }
}

// ----- WIN LOGIC (1024 Ways) -----
function calculateWin() {
    let totalWin = 0;
    let highlighted = [];

    for (let sym of SYMBOLS) {
        let count = 0;
        let positions = [];
        let found = false;
        for (let col = 0; col < REELS; col++) {
            let foundInThisReel = false;
            let rowPos = [];
            for (let row = 0; row < ROWS; row++) {
                if (grid[col][row].id === sym.id) {
                    foundInThisReel = true;
                    rowPos.push({ col, row });
                }
            }
            if (foundInThisReel) {
                count++;
                positions.push(...rowPos);
                found = true;
            } else {
                break;
            }
        }

        if (count >= 2) {
            let points = count * count * sym.value;
            totalWin += points;
            highlighted.push(...positions);
        }
    }

    return { totalWin, highlighted };
}

// ----- SPIN -----
function spin() {
    if (isSpinning) return;
    if (credit < BET) {
        alert('Credit မလုံလောက်ပါ!');
        return;
    }

    isSpinning = true;
    spinBtn.disabled = true;
    credit -= BET;
    creditDisplay.textContent = credit;
    winDisplay.textContent = '0';

    // Simple animation: clear and re-render 3 times quickly
    let spinCount = 0;
    const spinInterval = setInterval(() => {
        generateGrid();
        renderGrid([]);
        spinCount++;
        if (spinCount >= 3) {
            clearInterval(spinInterval);
            // Final result
            const result = calculateWin();
            renderGrid(result.highlighted);
            if (result.totalWin > 0) {
                credit += result.totalWin;
                creditDisplay.textContent = credit;
                winDisplay.textContent = result.totalWin;
            } else {
                winDisplay.textContent = '0';
            }
            isSpinning = false;
            spinBtn.disabled = false;
        }
    }, 150);
}

// ----- INIT -----
generateGrid();
renderGrid([]);
spinBtn.addEventListener('click', spin);
