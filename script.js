document.addEventListener('DOMContentLoaded', () => {
    const addProductForm = document.getElementById('add-product-form');
    const productNameInput = document.getElementById('product-name');
    const productIngredientsInput = document.getElementById('product-ingredients');
    const productScoreInput = document.getElementById('product-score');
    const productTableBody = document.querySelector('#product-table tbody');
    const ingredientTableBody = document.querySelector('#ingredient-table tbody');

    let products = [];

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
        if (e.target.classList.contains('delete-btn')) {
            const productId = parseInt(e.target.dataset.id);
            products = products.filter(p => p.id !== productId);
            saveData();
            renderProducts();
            analyzeIngredients();
        }
    });

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
                <td>${product.name}</td>
                <td>${product.ingredients.join(', ')}</td>
                <td>${product.score}</td>
                <td><button class="delete-btn" data-id="${product.id}">Verwijder</button></td>
            `;
            productTableBody.appendChild(row);
        });
    }

    function analyzeIngredients() {
        const ingredientScores = {};
        const ingredientCounts = {};

        products.forEach(product => {
            product.ingredients.forEach(ingredient => {
                if (!ingredientScores[ingredient]) {
                    ingredientScores[ingredient] = 0;
                    ingredientCounts[ingredient] = 0;
                }
                ingredientScores[ingredient] += product.score;
                ingredientCounts[ingredient]++;
            });
        });

        const ingredientAverages = Object.keys(ingredientScores).map(ingredient => {
            return {
                name: ingredient,
                averageScore: ingredientScores[ingredient] / ingredientCounts[ingredient]
            };
        });

        ingredientAverages.sort((a, b) => b.averageScore - a.averageScore);

        renderIngredientAnalysis(ingredientAverages);
    }

    function renderIngredientAnalysis(analysis) {
        ingredientTableBody.innerHTML = '';
        analysis.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.averageScore.toFixed(2)}</td>
            `;
            ingredientTableBody.appendChild(row);
        });
    }

    init();
});
