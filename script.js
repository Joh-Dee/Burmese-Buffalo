const gridElement = document.getElementById('slotGrid');

// Function to build empty Neon cells
function buildNeonGrid() {
    gridElement.innerHTML = '';
    for (let i = 0; i < 20; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        gridElement.appendChild(cell);
    }
}

// Initial load - just show the empty neon boxes
buildNeonGrid();
