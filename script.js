// Configuration
const SHEET_ID = '1iFMNwxAiURSFHR3w622PfIJh4FxSWQSrVjNsKZj29J0';
const SHEET_NAME = 'listedesrecettes';
const API_KEY = 'AIzaSyAwbiwOApYCVJoQMDIvsY2SwqT39nAMLgk';

let allRecipes = [];

async function loadRecipes() {
    try {
        const response = await fetch('/.netlify/functions/getrecipes');
        const data = await response.json();
        
        if (data.values?.length > 0) {
            allRecipes = convertSheetsDataToRecipes(data.values);
            displayRecipes(allRecipes);
            updateRecipeCounter(allRecipes.length);
        }
    } catch (error) {
        console.error('Erreur :', error);
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

// ... reste de votre code ...

// Fonction de filtrage des recettes
function filterRecipes() {
    const selectedFilters = {
        regime: Array.from(document.querySelectorAll('input[name="regime"]:checked')).map(cb => cb.value),
        portion: Array.from(document.querySelectorAll('input[name="portion"]:checked')).map(cb => cb.value),
        type: Array.from(document.querySelectorAll('input[name="type"]:checked')).map(cb => cb.value)
    };

    if (selectedFilters.regime.includes("Sans restriction")) {
        return allRecipes; // Afficher toutes les recettes
    }

    return allRecipes.filter(recipe => {
        const recipeRegime = recipe['Régime alimentaire'].split(',').map(r => r.trim());
        const allowedCombinations = ["Sans gluten", "Végétarisme", "Véganisme"];
        const isAllowedCombination = recipeRegime.every(r => allowedCombinations.includes(r));

        const regimeMatch = selectedFilters.regime.length === 0 ||
            (isAllowedCombination && selectedFilters.regime.every(r => recipeRegime.includes(r))) ||
            (!isAllowedCombination && selectedFilters.regime.length === 1 && recipeRegime.includes(selectedFilters.regime[0]));

        const portionMatch = selectedFilters.portion.length === 0 || selectedFilters.portion.includes(recipe['Type de portion']);
        const typeMatch = selectedFilters.type.length === 0 || selectedFilters.type.includes(recipe['Type de plat']);

        return regimeMatch && portionMatch && typeMatch;
    });
}

function createRecipeCard(recipe) {
    let thumbnailUrl = recipe['Photo de la recette'] || '';
    let fullImageUrl = thumbnailUrl;
    
    // Extraire l'ID et créer les URLs
    if (thumbnailUrl) {
        let fileId;
        if (thumbnailUrl.includes('/file/d/')) {
            fileId = thumbnailUrl.split('/file/d/')[1].split('/')[0];
        } else if (thumbnailUrl.includes('id=')) {
            fileId = thumbnailUrl.split('id=')[1];
        }
        
        if (fileId) {
            thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w300`; // Miniature
            fullImageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1080`; // Grande image
        }
    } else {
        thumbnailUrl = 'placeholder.jpg';
        fullImageUrl = 'placeholder.jpg';
    }
    
    const card = document.createElement('div');
    card.classList.add('recipe-card');

    const content = `
        <div class="recipe-image-container">
            <img class="recipe-image" 
                 src="${thumbnailUrl}" 
                 alt="${recipe['Titre de la recette']}"
                 data-full-image="${fullImageUrl}"
                 onerror="this.src='placeholder.jpg'"
                 onclick="showFullImage(this)">
        </div>
        <div class="recipe-content">
            <h3 class="recipe-title">${recipe['Titre de la recette']}</h3>
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

// Ajoutez ou mettez à jour la fonction showFullImage
function showFullImage(imgElement) {
    const fullImageUrl = imgElement.getAttribute('data-full-image');
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    
    modal.innerHTML = `
        <div class="loader"></div>
        <img src="${fullImageUrl}" class="modal-content">
    `;
    
    const modalImg = modal.querySelector('.modal-content');
    const loader = modal.querySelector('.loader');
    
    modalImg.onload = () => {
        loader.style.display = 'none';
    };
    
    modal.onclick = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };
    
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('active'));
}
// Ajoutez cette nouvelle fonction
function showFullImage(imgElement) {
    const fullImageUrl = imgElement.getAttribute('data-full-image');
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <img src="${fullImageUrl}" class="modal-content">
        <div class="loader"></div>
    `;
    
    const img = modal.querySelector('img');
    img.onload = () => {
        modal.querySelector('.loader').style.display = 'none';
    };
    
    modal.onclick = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}
// Ajoutez ces fonctions à la fin du fichier script.js
function showImage(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `<img src="${imageUrl}" class="modal-content">`;
    
    modal.onclick = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
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