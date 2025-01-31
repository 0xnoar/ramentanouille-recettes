const SHEET_ID = '1iFMNwxAiURSFHR3w622PfIJh4FxSWQSrVjNsKZj29J0';
const SHEET_NAME = 'listedesrecettes';
const API_KEY = 'AIzaSyAwbiwOApYCVJoQMDIvsY2SwqT39nAMLgk';

let allRecipes = [];

// Fonction pour charger les recettes depuis Google Sheets
async function loadRecipes() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
    console.log('URL de requête:', url);
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Données reçues:', data);

        if (data.values && data.values.length > 0) {
            allRecipes = convertSheetsDataToRecipes(data.values);
            console.log('Recettes converties:', allRecipes); // Pour déboguer
            displayRecipes(allRecipes);
            updateRecipeCounter(allRecipes.length);
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Fonction pour transformer les données en objets recettes
function convertSheetsDataToRecipes(values) {
    const headers = values[0].map(header => header.trim());
    console.log('En-têtes trouvés:', headers); // Pour déboguer

    return values.slice(1).map(row => {
        const recipe = {};
        headers.forEach((header, index) => {
            recipe[header] = row[index] ? row[index].trim() : '';
        });
        console.log('Recette créée:', recipe); // Pour déboguer
        return recipe;
    });
}

function createRecipeCard(recipe) {
    let imageUrl = recipe['Photo de la recette'];
    console.log('URL image originale:', imageUrl); // Pour déboguer
    
    if (imageUrl && imageUrl.includes('drive.google.com')) {
        const fileId = imageUrl.split('/').pop().split('=').pop();
        imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    console.log('URL image transformée:', imageUrl); // Pour déboguer

    const card = document.createElement('div');
    card.classList.add('recipe-card');

    const content = `
        <div class="recipe-image-container">
            <img class="recipe-image" 
                 src="${imageUrl}" 
                 alt="${recipe['Titre de la recette']}"
                 onerror="this.src='placeholder.jpg'">
        </div>
        <div class="recipe-content">
            <h3 class="recipe-title">${recipe['Titre de la recette'] || 'Sans titre'}</h3>
            <div class="recipe-tags">
                <span class="tag">${recipe['Régime alimentaire'] || ''}</span>
                <span class="tag">${recipe['Type de portion'] || ''}</span>
                <span class="tag">${recipe['Type de plat'] || ''}</span>
            </div>
            <div class="recipe-ingredients">
                <h4>Ingrédients :</h4>
                <p>${recipe['Liste des ingrédients'] || ''}</p>
            </div>
            <div class="recipe-instructions">
                <h4>Instructions :</h4>
                <p>${recipe['La cheffe vous conseille'] || ''}</p>
            </div>
        </div>
    `;

    card.innerHTML = content;
    return card;
}

// Fonction pour afficher les recettes
function displayRecipes(recipes) {
    const container = document.getElementById('recipes-container');
    container.innerHTML = '';

    recipes.forEach(recipe => {
        const card = createRecipeCard(recipe);
        container.appendChild(card);
    });
}

// Fonction pour mettre à jour le compteur
function updateRecipeCounter(count) {
    document.querySelector('#recipe-counter span').textContent = count;
}

// Modifions aussi la fonction de filtrage
function filterRecipes() {
    const selectedFilters = {
        regime: Array.from(document.querySelectorAll('input[name="regime"]:checked')).map(cb => cb.value),
        portion: Array.from(document.querySelectorAll('input[name="portion"]:checked')).map(cb => cb.value),
        type: Array.from(document.querySelectorAll('input[name="type"]:checked')).map(cb => cb.value)
    };

    let filteredRecipes = [...allRecipes];

    if (selectedFilters.regime.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe => 
            selectedFilters.regime.includes(recipe['Régime alimentaire']?.trim())
        );
    }

    if (selectedFilters.portion.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe => 
            selectedFilters.portion.includes(recipe['Type de portion']?.trim())
        );
    }

    if (selectedFilters.type.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe => 
            selectedFilters.type.includes(recipe['Type de plat']?.trim())
        );
    }

    displayRecipes(filteredRecipes);
    updateRecipeCounter(filteredRecipes.length);
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadRecipes();
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', filterRecipes);
    });
});