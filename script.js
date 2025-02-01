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
        recipe.quantity = 0; // Ajouter la propriété quantité
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

    const quantityControl = document.createElement('div');
    quantityControl.classList.add('quantity-control');

    const minusButton = document.createElement('button');
    minusButton.textContent = '-';
    minusButton.addEventListener('click', () => {
        if (recipe.quantity > 0) {
            recipe.quantity--;
            quantityInput.value = recipe.quantity;
            updateCart();
        }
    });

    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.min = '0';
    quantityInput.value = '0';
    quantityInput.addEventListener('input', () => {
        recipe.quantity = parseInt(quantityInput.value);
        updateCart();
    });

    const plusButton = document.createElement('button');
    plusButton.textContent = '+';
    plusButton.addEventListener('click', () => {
        recipe.quantity++;
        quantityInput.value = recipe.quantity;
        updateCart();
    });

    quantityControl.appendChild(minusButton);
    quantityControl.appendChild(quantityInput);
    quantityControl.appendChild(plusButton);

    const recipeContent = card.querySelector('.recipe-content');
    recipeContent.appendChild(quantityControl);

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

// Fonction pour mettre à jour le panier
function updateCart() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';

    const selectedRecipes = allRecipes.filter(recipe => recipe.quantity > 0);

    selectedRecipes.forEach(recipe => {
        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');

        const title = document.createElement('span');
        title.textContent = `${recipe['Titre de la recette']} x${recipe.quantity}`;

        const removeButton = document.createElement('button');
        removeButton.textContent = 'X';
        removeButton.addEventListener('click', () => {
            recipe.quantity = 0;
            updateCart();
            displayRecipes(allRecipes);
        });

        cartItem.appendChild(title);
        cartItem.appendChild(removeButton);

        cartItems.appendChild(cartItem);
    });

    const orderForm = document.getElementById('order-form');
    if (selectedRecipes.length > 0) {
        orderForm.classList.remove('hidden');
    } else {
        orderForm.classList.add('hidden');
    }
}

// Fonction de filtrage des recettes
function filterRecipes() {
    const selectedFilters = {
        regime: Array.from(document.querySelectorAll('input[name="regime"]:checked')).map(cb => cb.value),
        portion: Array.from(document.querySelectorAll('input[name="portion"]:checked')).map(cb => cb.value),
        type: Array.from(document.querySelectorAll('input[name="type"]:checked')).map(cb => cb.value),
        spicy: Array.from(document.querySelectorAll('input[name="spicy"]:checked')).map(cb => cb.value)
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

    if (selectedFilters.spicy.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe => 
            selectedFilters.spicy.includes(recipe['Niveau de piquant']?.trim())
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

    document.getElementById('order-form').addEventListener('submit', (event) => {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        const orderDetails = {
            customerName: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            deliveryType: formData.get('delivery-type'),
            deliveryAddress: formData.get('delivery-address'),
            deliveryDate: formData.get('delivery-date'),
            deliveryTime: formData.get('delivery-time'),
            items: allRecipes.filter(recipe => recipe.quantity > 0).map(recipe => ({
                title: recipe['Titre de la recette'],
                quantity: recipe.quantity
            }))
        };

        console.log(orderDetails); // Pour les tests, à retirer en production

        emailjs.send('service_hdwid4k', 'template_k2nup5c', orderDetails)
            .then(function(response) {
                console.log('Commande envoyée', response.status, response.text);
                alert('Votre commande a été envoyée avec succès !');
                form.reset();
                allRecipes.forEach(recipe => recipe.quantity = 0);
                updateCart();
                displayRecipes(allRecipes);
            }, function(error) {
                console.log('Erreur', error);
                alert('Une erreur est survenue, veuillez réessayer.');
            });
    });

    document.querySelector('input[name="delivery-type"]').addEventListener('change', (event) => {
        const deliveryAddress = document.querySelector('textarea[name="delivery-address"]');
        if (event.target.value === 'delivery') {
            deliveryAddress.classList.remove('hidden');
            deliveryAddress.required = true;
        } else {
            deliveryAddress.classList.add('hidden');
            deliveryAddress.required = false;
        }
    });
});