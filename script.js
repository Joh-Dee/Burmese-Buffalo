const IMAGE_MAP = {
    'buffalo': 'buffalo.png', 'lion': 'lion.png', 'elephant': 'elephant.png',
    'deer': 'deer.png', 'zebra': 'zebra.png', 'A': 'a.png', 'K': 'k.png',
    'Q': 'q.png', 'J': 'j.png', '10': '10.png'
};

const SYMBOLS = [
    { id: 'buffalo', value: 10 }, { id: 'lion', value: 8 },
    { id: 'elephant', value: 7 }, { id: 'deer', value: 5 },
    { id: 'zebra', value: 4 }, { id: 'A', value: 3 },
    { id: 'K', value: 3 }, { id: 'Q', value: 2 },
    { id: 'J', value: 2 }, { id: '10', value: 1 },
];

const REELS = 5, ROWS = 4;
const TALL_ROWS = 15;
const DELAY_BETWEEN_REELS = 400; // ms

let grid = []; // Final Result (4 rows)
let credit = 2000, isSpinning = false;
const BET = 10;
const gridElement = document.getElementById('slotGrid');
const creditDisplay = document.getElementById('creditDisplay');
const winDisplay = document.getElementById('winDisplay');
const spinBtn = document.getElementById('spinBtn');

function randomSymbol() { return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]; }

// ----- 1. ကြိုတွက်ထားတဲ့ Final Grid (ကျလာမယ့် Result) -----
function generateGrid() {
    grid = [];
    for (let col = 0; col < REELS; col++) {
        let reel = [];
        for (let row = 0; row < ROWS; row++) reel.push(randomSymbol());
        grid.push(reel);
    }
}

// ----- 2. Final Result အတိုင်း ပြသမယ့် Render -----
function renderGrid(highlighted = []) {
    gridElement.innerHTML = '';
    for (let col = 0; col < REELS; col++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'reel-column';
        colDiv.style.transition = 'none'; 
        for (let row = 0; row < ROWS; row++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const sym = grid[col][row];
            cell.style.backgroundImage = `url('images/${IMAGE_MAP[sym.id]}')`;
            if (highlighted.some(h => h.col === col && h.row === row)) cell.classList.add('highlight');
            colDiv.appendChild(cell);
        }
        gridElement.appendChild(colDiv);
    }
}

// ----- WIN LOGIC -----
function calculateWin() {
    let totalWin = 0, highlighted = [];
    for (let sym of SYMBOLS) {
        let count = 0, positions = [];
        for (let col = 0; col < REELS; col++) {
            let found = false, rowPos = [];
            for (let row = 0; row < ROWS; row++) {
                if (grid[col][row].id === sym.id) { found = true; rowPos.push({ col, row }); }
            }
            if (found) { count++; positions.push(...rowPos); } else break;
        }
        if (count >= 2) {
            totalWin += count * count * sym.value;
            highlighted.push(...positions);
        }
    }
    return { totalWin, highlighted };
}

// ----- 3. အစစ်အမှန် Slot လိုမျိုး ကြိုတွက်ပြီး ကျစေမယ့် Animation -----
function spin() {
    if (isSpinning || credit < BET) { 
        if(credit < BET) alert('Credit မလုံလောက်ပါ!'); 
        return; 
    }
    
    isSpinning = true; spinBtn.disabled = true;
    credit -= BET; creditDisplay.textContent = credit; winDisplay.textContent = '0';

    // STEP 1: ကြိုတွက်ထားတဲ့ Final Result ကို ရယူပါ
    generateGrid();

    // STEP 2: Reel Animation အတွက် 15 Symbol ကို တည်ဆောက်ပါ
    gridElement.innerHTML = '';
    
    // ရပ်တဲ့အခါ ပေါ်မယ့် Symbol တွေကို သေချာ ထည့်သွင်းဖို့ stopIndices ကို သိမ်းထားပါမယ်
    let finalStopIndices = [];

    for (let col = 0; col < REELS; col++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'reel-column';
        colDiv.style.transition = 'none'; // Initial setup, no transition
        
        let tallSymbols = [];

        // 1 Reel အပေါ်ပိုင်း (Buffer) - ကျပန်း Symbol များ
        for (let i = 0; i < 11; i++) { // 15 - 4 = 11 slots above
            tallSymbols.push(randomSymbol());
        }
        // 2 အောက်ဆုံး 4 ခု - Final Grid ထဲက Symbol များ (Result)
        for (let row = 0; row < ROWS; row++) {
            tallSymbols.push(grid[col][row]);
        }

        // 3 Offset တွက်ခြင်း - ရပ်တဲ့အခါ အောက်ဆုံး 4 ခု ပေါ်လာအောင်
        // 11 slots above -> 11 * 25% = 275% up. 
        // ဒါပေမယ့် Reel ကို Smooth ဖြစ်အောင် နည်းနည်း ပိုတင်ပြီး ကျစေမယ်
        const stopIdx = Math.floor(Math.random() * 2) + 10; // 10 or 11 (Just above the 4 result slots)
        finalStopIndices.push(stopIdx);

        // 4 Column ထဲကို Symbol တွေ ထည့်ပါ
        tallSymbols.forEach(sym => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.backgroundImage = `url('images/${IMAGE_MAP[sym.id]}')`;
            colDiv.appendChild(cell);
        });

        // 5 Initial Transform: Move UP by (stopIdx * 25%)
        const offsetPercent = - (stopIdx * 25);
        colDiv.style.transform = `translateY(${offsetPercent}%)`; 

        gridElement.appendChild(colDiv);
    }

    // Force browser reflow
    gridElement.offsetHeight;

    // STEP 3: Staggered Animation (Reel 1 to Reel 5)
    let currentReel = 0;
    const columns = gridElement.querySelectorAll('.reel-column');
    
    const animInterval = setInterval(() => {
        const col = columns[currentReel];
        // Smooth transition နဲ့ အောက်ကို ကျစေမယ်
        col.style.transition = `transform 0.7s cubic-bezier(0.15, 0.9, 0.3, 1)`;
        col.style.transform = `translateY(0)`;

        currentReel++;
        if (currentReel >= REELS) {
            clearInterval(animInterval);
            
            // STEP 4: Animation ပြီးသွားရင် Final Grid ကို Highlight နဲ့ ပြသမယ်
            setTimeout(() => {
                const result = calculateWin();
                renderGrid(result.highlighted);
                
                if (result.totalWin > 0) {
                    credit += result.totalWin; 
                    creditDisplay.textContent = credit; 
                    winDisplay.textContent = result.totalWin;
                }
                isSpinning = false; 
                spinBtn.disabled = false;
            }, 800);
        }
    }, DELAY_BETWEEN_REELS);
}

// Initial Load
generateGrid();
renderGrid([]);
spinBtn.addEventListener('click', spin);
