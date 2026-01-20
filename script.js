document.addEventListener('DOMContentLoaded', () => {
    const addProductForm = document.getElementById('add-product-form');
    const productNameInput = document.getElementById('product-name');
    const productIngredientsInput = document.getElementById('product-ingredients');
    const productScoreInput = document.getElementById('product-score');
    const productTableBody = document.querySelector('#product-table tbody');
    const ingredientTableBody = document.querySelector('#ingredient-table tbody');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file');

    let products = [];
    let history = [];
    let future = [];

    // Undo/Redo Logic
    function pushToHistory() {
        history.push(JSON.parse(JSON.stringify(products)));
        future = []; // Clear future on new action
    }

    function undo() {
        if (history.length === 0) return;
        
        future.push(JSON.parse(JSON.stringify(products)));
        products = history.pop();
        
        saveData();
        renderProducts();
        analyzeIngredients();
    }

    function redo() {
        if (future.length === 0) return;

        history.push(JSON.parse(JSON.stringify(products)));
        products = future.pop();

        saveData();
        renderProducts();
        analyzeIngredients();
    }

    document.addEventListener('keydown', (e) => {
        // Controleer of de gebruiker niet in een input veld typt (behalve als het een command is)
        // Maar undo/redo wil je vaak ook tijdens typen als je per ongeluk iets weghaalt, 
        // hoewel browser native undo dat vaak al doet voor tekstvelden.
        // Voor deze app gaat het om product-lijst wijzigingen.
        
        // Ctrl+Z (Undo)
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
        
        // Ctrl+Y of Ctrl+Shift+Z (Redo)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z' || e.key === 'Z'))) {
            e.preventDefault();
            redo();
        }
    });

    exportBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(products, null, 2);
        const dataBlob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'psoriasis_products.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    importBtn.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedProducts = JSON.parse(e.target.result);
                // Basic validation
                if (Array.isArray(importedProducts)) {
                    pushToHistory(); // Save state before import
                    products = importedProducts;
                    saveData();
                    renderProducts();
                    analyzeIngredients();
                    alert('Data succesvol geïmporteerd!');
                } else {
                    alert('Ongeldig bestandsformaat.');
                }
            } catch (error) {
                alert('Fout bij het lezen van het bestand.');
                console.error("Error parsing JSON:", error);
            }
        };
        reader.readAsText(file);
        // Reset file input to allow re-importing the same file
        importFileInput.value = '';
    });

    function saveData() {
        localStorage.setItem('products', JSON.stringify(products));
    }

    function loadData() {
        const savedProducts = localStorage.getItem('products');
        if (savedProducts) {
            products = JSON.parse(savedProducts);
        }
    }

    addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = productNameInput.value;
        const ingredients = productIngredientsInput.value;
        const score = parseFloat(productScoreInput.value);

        if (name && ingredients && !isNaN(score)) {
            pushToHistory(); // Save state before add
            const product = {
                id: Date.now(), // Simple unique ID
                name,
                ingredients: ingredients.split(',').map(i => i.trim().toLowerCase()),
                score
            };
            products.push(product);
            saveData();
            addProductForm.reset();
            renderProducts();
            analyzeIngredients();
        }
    });

    productTableBody.addEventListener('click', (e) => {
        // Handle Delete
        if (e.target.classList.contains('delete-btn')) {
            pushToHistory(); // Save state before delete
            const productId = parseInt(e.target.dataset.id);
            products = products.filter(p => p.id !== productId);
            saveData();
            renderProducts();
            analyzeIngredients();
            return;
        }

        // Handle Edit
        const cell = e.target.closest('td.editable');
        if (cell && !cell.querySelector('input')) {
            makeEditable(cell);
        }
    });

    function makeEditable(cell) {
        const id = parseInt(cell.dataset.id);
        const field = cell.dataset.field;
        const originalText = cell.innerText;

        const input = document.createElement('input');
        input.type = field === 'score' ? 'number' : 'text';
        input.value = originalText;
        if (field === 'score') {
            input.step = '0.1';
            input.min = '0';
            input.max = '10';
        }

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit(id, field, input.value);
            } else if (e.key === 'Escape') {
                cell.innerHTML = originalText;
            }
        });

        input.addEventListener('blur', () => {
            cell.innerHTML = originalText;
        });

        cell.innerHTML = '';
        cell.appendChild(input);
        input.focus();
    }

    function saveEdit(id, field, value) {
        const product = products.find(p => p.id === id);
        if (!product) return;

        // Check if value actually changed to avoid unnecessary history entries
        let changed = false;
        if (field === 'ingredients') {
             const newIngredients = value.split(',').map(i => i.trim().toLowerCase()).filter(i => i);
             if (JSON.stringify(newIngredients) !== JSON.stringify(product.ingredients)) {
                 changed = true;
             }
        } else if (field === 'score') {
            if (product.score !== parseFloat(value)) changed = true;
        } else {
            if (product[field] !== value) changed = true;
        }

        if (!changed) return;

        pushToHistory(); // Save state before edit

        if (field === 'ingredients') {
            product.ingredients = value.split(',').map(i => i.trim().toLowerCase()).filter(i => i);
        } else if (field === 'score') {
            product.score = parseFloat(value);
        } else {
            product[field] = value;
        }

        saveData();
        renderProducts();
        analyzeIngredients();
    }

    function init() {
        loadData();
        renderProducts();
        analyzeIngredients();
    }

    function renderProducts() {
        productTableBody.innerHTML = '';
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="editable" data-id="${product.id}" data-field="name">${product.name}</td>
                <td class="editable" data-id="${product.id}" data-field="ingredients">${product.ingredients.join(', ')}</td>
                <td class="editable" data-id="${product.id}" data-field="score">${product.score}</td>
                <td><button class="delete-btn" data-id="${product.id}">Verwijder</button></td>
            `;
            productTableBody.appendChild(row);
        });
    }

    function analyzeIngredients() {
        // Sort products by score descending (highest score first)
        const sortedProducts = [...products].sort((a, b) => b.score - a.score);
        
        const ingredientScores = {};

        sortedProducts.forEach(product => {
            product.ingredients.forEach(ingredient => {
                // Only assign a score if the ingredient hasn't been seen yet.
                // Since we iterate from best to worst product, the first time we see
                // an ingredient, it is associated with the highest scoring product it belongs to.
                if (!Object.prototype.hasOwnProperty.call(ingredientScores, ingredient)) {
                    ingredientScores[ingredient] = product.score;
                }
            });
        });

        const ingredientAnalysis = Object.keys(ingredientScores).map(ingredient => {
            return {
                name: ingredient,
                score: ingredientScores[ingredient]
            };
        });

        // Sort ingredients by score descending for display
        ingredientAnalysis.sort((a, b) => b.score - a.score);

        renderIngredientAnalysis(ingredientAnalysis);
    }

    function renderIngredientAnalysis(analysis) {
        ingredientTableBody.innerHTML = '';
        analysis.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.score.toFixed(2)}</td>
            `;
            ingredientTableBody.appendChild(row);
        });
    }

    init();
});
