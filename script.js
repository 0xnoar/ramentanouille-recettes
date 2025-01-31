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
            console.log('Recettes converties:', allRecipes);
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
    console.log('En-têtes trouvés:', headers);

    return values.slice(1).map(row => {
        const recipe = {};
        headers.forEach((header, index) => {
            recipe[header] = row[index] ? row[index].trim() : '';
        });
        console.log('Recette créée:', recipe);
        return recipe;
    });
}

// ✅ Fonction pour convertir les liens Google Drive en affichage direct
function convertGoogleDriveUrl(driveUrl) {
    if (!driveUrl || driveUrl.trim() === "") return 'placeholder.jpg';

    let fileId = '';

    if (driveUrl.includes('open?id=')) {
        fileId = driveUrl.split('open?id=')[1];
    } else if (driveUrl.includes('/file/d/')) {
        fileId = driveUrl.split('/file/d/')[1]?.split('/')[0];
    } else if (driveUrl.includes('id=')) {
        fileId = driveUrl.split('id=')[1]?.split('&')[0];
    }

    // Utilisation de lh3.googleusercontent.com
    return fileId ? `https://lh3.googleusercontent.com/d/${fileId}=w1000` : 'placeholder.jpg';
}


// Fonction pour créer une carte de recette
function createRecipeCard(recipe) {
    let imageUrl = convertGoogleDriveUrl(recipe['Photo de la recette']);
    console.log('Lien converti de l’image:', imageUrl);

    const card = document.createElement('div');
    card.classList.add('recipe-card');

    const imgElement = document.createElement('img');
    imgElement.classList.add('recipe-image');
    imgElement.src = imageUrl;
    imgElement.alt = recipe['Titre de la recette'] || 'Sans titre';

    // Gestion des erreurs de chargement
    imgElement.onerror = function () {
        console.error("Erreur de chargement de l'image :", imageUrl);
        this.src = 'placeholder.jpg';
    };

    card.innerHTML = `
        <div class="recipe-image-container">
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

    // Ajout de l'image à la carte
    card.querySelector('.recipe-image-container').appendChild(imgElement);

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

// ✅ Fonction pour filtrer les recettes selon les critères
function filterRecipes() {
    const selectedFilters = {
        regime: Array.from(document.querySelectorAll('input[name="regime"]:checked')).map(cb => cb.value),
        portion: Array.from(document.querySelectorAll('input[name="portion"]:checked')).map(cb => cb.value),
        type: Array.from(document.querySelectorAll('input[name="type"]:checked')).map(cb => cb.value)
    };

    let filteredRecipes = [...allRecipes];

    // Si "Sans restriction" est coché, on affiche tout
    if (selectedFilters.regime.includes("Sans restriction")) {
        displayRecipes(allRecipes);
        updateRecipeCounter(allRecipes.length);
        return;
    }

    filteredRecipes = filteredRecipes.filter(recipe => {
        const recipeRegime = recipe['Régime alimentaire']?.split(',').map(r => r.trim()) || [];

        // Autoriser uniquement "Sans gluten" avec "Végétarien" et "Végan"
        const allowedCombinations = ["Sans gluten", "Végétarisme", "Véganisme"];
        const isAllowedCombination = recipeRegime.every(r => allowedCombinations.includes(r));

        const regimeMatch = selectedFilters.regime.length === 0 ||
            (isAllowedCombination && selectedFilters.regime.every(r => recipeRegime.includes(r))) ||
            (!isAllowedCombination && selectedFilters.regime.length === 1 && recipeRegime.includes(selectedFilters.regime[0]));

        const portionMatch = selectedFilters.portion.length === 0 || selectedFilters.portion.includes(recipe['Type de portion']);
        const typeMatch = selectedFilters.type.length === 0 || selectedFilters.type.includes(recipe['Type de plat']);

        return regimeMatch && portionMatch && typeMatch;
    });

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
