// Configuration
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
            displayRecipes(filterRecipes());
            updateRecipeCounter(allRecipes.length);
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Fonction pour transformer les données en objets recettes
function convertSheetsDataToRecipes(values) {
    const headers = values[0].map(header => header.trim());
    return values.slice(1).map(row => {
        const recipe = {};
        headers.forEach((header, index) => {
            recipe[header] = row[index] ? row[index].trim() : '';
        });
        return recipe;
    });
}

// Fonction pour créer une carte de recette
function createRecipeCard(recipe) {
    let imageUrl = recipe['Photo de la recette'];
    
    if (imageUrl && imageUrl.includes('drive.google.com')) {
        const fileId = imageUrl.includes('id=') 
            ? imageUrl.split('id=')[1]
            : imageUrl.split('/d/')[1]?.split('/')[0];
            
        if (fileId) {
            imageUrl = `https://drive.google.com/thumbnail?id=${fileId}`;
        }
    }

    const card = document.createElement('div');
    card.classList.add('recipe-card');

    const content = `
    <div class="recipe-image-container">
        <img class="recipe-image" src="${imageUrl}" alt="${recipe['Titre de la recette']}">
    </div>
    <div class="recipe-content">
        <div class="recipe-header">
            <h3 class="recipe-title">${recipe['Titre de la recette']}</h3>
            <div class="spicy-level">${recipe['Niveau de piment'] || 'Non pimenté'}</div>
        </div>
        <div class="recipe-tags">
            <span class="tag">${recipe['Régime alimentaire']}</span>
            <span class="tag">${recipe['Type de portion']}</span>
            <span class="tag">${recipe['Type de plat']}</span>
        </div>
            <div class="recipe-ingredients">
                <h4>Ingrédients :</h4>
                <p>${recipe['Liste des ingrédients']}</p>
            </div>
            <div class="recipe-instructions">
                <h4>Instructions :</h4>
                <p>${recipe['La cheffe vous conseille']}</p>
            </div>
        </div>
    `;

    card.innerHTML = content;
    return card;
}

// Dans la fonction filterRecipes
function filterRecipes() {
    const selectedFilters = {
        regime: Array.from(document.querySelectorAll('input[name="regime"]:checked')).map(cb => cb.value),
        portion: Array.from(document.querySelectorAll('input[name="portion"]:checked')).map(cb => cb.value),
        type: Array.from(document.querySelectorAll('input[name="type"]:checked')).map(cb => cb.value),
        spicy: Array.from(document.querySelectorAll('input[name="spicy"]:checked')).map(cb => cb.value)
    };

    console.log('Filtres sélectionnés:', selectedFilters);

    return allRecipes.filter(recipe => {
        // Si aucun filtre de régime n'est sélectionné, montrer toutes les recettes
        if (selectedFilters.regime.length === 0) {
            return true;
        }

        const recipeRegimes = recipe['Régime alimentaire'].split(',').map(r => r.trim());
        console.log('Régimes de la recette:', recipeRegimes);

        let regimeMatch = false;

        // Traitement des régimes alimentaires
        if (selectedFilters.regime.includes('Sans restriction')) {
            regimeMatch = true;
        } else {
            // Vérifier le véganisme (uniquement recettes véganes)
            if (selectedFilters.regime.includes('Véganisme')) {
                regimeMatch = recipeRegimes.includes('Véganisme');
            }
            // Vérifier le végétarisme (inclut recettes véganes ET végétariennes)
            else if (selectedFilters.regime.includes('Végétarisme')) {
                regimeMatch = recipeRegimes.includes('Végétarisme') || recipeRegimes.includes('Véganisme');
            }
            
            // Vérifier sans gluten (peut être combiné avec végétarisme ou véganisme)
            if (selectedFilters.regime.includes('Sans gluten')) {
                if (regimeMatch) {
                    regimeMatch = recipeRegimes.includes('Sans gluten');
                } else {
                    regimeMatch = recipeRegimes.includes('Sans gluten');
                }
            }
        }

        // Autres filtres
        const portionMatch = selectedFilters.portion.length === 0 || 
            selectedFilters.portion.includes(recipe['Type de portion']);
        const typeMatch = selectedFilters.type.length === 0 || 
            selectedFilters.type.includes(recipe['Type de plat']);
        const spicyMatch = selectedFilters.spicy.length === 0 || 
            selectedFilters.spicy.includes(recipe['Niveau de piment']);

        return regimeMatch && portionMatch && typeMatch && spicyMatch;
    });
}

// Fonction pour afficher les recettes
function displayRecipes(recipes) {
    const container = document.getElementById('recipes-container');
    container.innerHTML = '';

    recipes.forEach(recipe => {
        const card = createRecipeCard(recipe);
        container.appendChild(card);
    });
    updateRecipeCounter(recipes.length);
}

// Fonction pour mettre à jour le compteur
function updateRecipeCounter(count) {
    document.querySelector('#recipe-counter span').textContent = count;
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadRecipes();
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            displayRecipes(filterRecipes());
        });
    });
});