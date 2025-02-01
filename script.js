// Configuration
const SHEET_ID = '1iFMNwxAiURSFHR3w622PfIJh4FxSWQSrVjNsKZj29J0';
const SHEET_NAME = 'listedesrecettes';
const API_KEY = 'AIzaSyAwbiwOApYCVJoQMDIvsY2SwqT39nAMLgk';

let allRecipes = [];

// Fonction pour transformer les URLs Google Drive
function getGoogleDriveImageUrl(url) {
    if (!url) return 'placeholder.jpg';
    
    if (url.includes('drive.google.com')) {
        let fileId;
        
        if (url.includes('/file/d/')) {
            fileId = url.split('/file/d/')[1].split('/')[0];
        } else if (url.includes('id=')) {
            fileId = url.split('id=')[1];
        }
        
        if (fileId) {
            return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
    }
    return url;
}

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
    return values.slice(1).map(row => {
        const recipe = {};
        headers.forEach((header, index) => {
            recipe[header] = row[index] ? row[index].trim() : '';
        });
        recipe.quantity = 0;
        return recipe;
    });
}

function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.classList.add('recipe-card');

    const imageUrl = getGoogleDriveImageUrl(recipe['Photo de la recette']);

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
            <div class="quantity-control">
                <button class="quantity-btn minus">-</button>
                <input type="number" min="0" value="${recipe.quantity}" class="quantity-input">
                <button class="quantity-btn plus">+</button>
            </div>
        </div>
    `;

    card.innerHTML = content;

    // Ajout des gestionnaires d'événements pour les boutons quantité
    const minusBtn = card.querySelector('.minus');
    const plusBtn = card.querySelector('.plus');
    const quantityInput = card.querySelector('.quantity-input');

    minusBtn.addEventListener('click', () => {
        if (recipe.quantity > 0) {
            recipe.quantity--;
            quantityInput.value = recipe.quantity;
            updateCart();
        }
    });

    plusBtn.addEventListener('click', () => {
        recipe.quantity++;
        quantityInput.value = recipe.quantity;
        updateCart();
    });

    quantityInput.addEventListener('change', () => {
        const value = parseInt(quantityInput.value) || 0;
        recipe.quantity = Math.max(0, value);
        quantityInput.value = recipe.quantity;
        updateCart();
    });

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
    updateRecipeCounter(recipes.length);
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

        const itemInfo = document.createElement('div');
        itemInfo.classList.add('cart-item-info');
        itemInfo.innerHTML = `
            <div class="cart-item-title">${recipe['Titre de la recette']}</div>
            <div class="cart-item-quantity">Quantité: ${recipe.quantity}</div>
        `;

        const removeButton = document.createElement('button');
        removeButton.classList.add('cart-item-remove');
        removeButton.innerHTML = '×';
        removeButton.addEventListener('click', () => {
            recipe.quantity = 0;
            updateCart();
            displayRecipes(allRecipes);
        });

        cartItem.appendChild(itemInfo);
        cartItem.appendChild(removeButton);
        cartItems.appendChild(cartItem);
    });

    const orderForm = document.getElementById('order-form');
    orderForm.classList.toggle('hidden', selectedRecipes.length === 0);

    // Mettre à jour le compteur du panier
    document.querySelector('.cart-count').textContent = selectedRecipes.reduce((sum, recipe) => sum + recipe.quantity, 0);
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

    // Filtrage régime alimentaire
    if (selectedFilters.regime.includes('Sans restriction')) {
        // Afficher toutes les recettes
    } else if (selectedFilters.regime.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe => {
            const recipeRegimes = recipe['Régime alimentaire'].split(',').map(r => r.trim());
            
            if (selectedFilters.regime.includes('Véganisme')) {
                return recipeRegimes.includes('Véganisme');
            }
            if (selectedFilters.regime.includes('Végétarisme')) {
                return recipeRegimes.includes('Végétarisme') || recipeRegimes.includes('Véganisme');
            }
            // Gestion du sans gluten
            if (selectedFilters.regime.includes('Sans gluten')) {
                return recipeRegimes.includes('Sans gluten');
            }
            
            return selectedFilters.regime.some(filter => recipeRegimes.includes(filter));
        });
    }

    // Autres filtres
    if (selectedFilters.portion.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe => 
            selectedFilters.portion.includes(recipe['Type de portion'])
        );
    }

    if (selectedFilters.type.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe => 
            selectedFilters.type.includes(recipe['Type de plat'])
        );
    }

    if (selectedFilters.spicy.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe => 
            selectedFilters.spicy.includes(recipe['Niveau de piment'])
        );
    }

    displayRecipes(filteredRecipes);
    updateRecipeCounter(filteredRecipes.length);
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadRecipes();
    
    // Gestionnaire pour les filtres
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', filterRecipes);
    });

    // Gestionnaire pour le toggle du panier
    document.getElementById('cartToggle').addEventListener('click', () => {
        document.getElementById('cart').classList.toggle('open');
    });

    // Gestionnaire pour le formulaire de commande
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

        emailjs.send('service_hdwid4k', 'template_k2nup5c', orderDetails)
            .then(response => {
                console.log('Commande envoyée', response.status, response.text);
                alert('Votre commande a été envoyée avec succès !');
                form.reset();
                allRecipes.forEach(recipe => recipe.quantity = 0);
                updateCart();
                displayRecipes(allRecipes);
            })
            .catch(error => {
                console.error('Erreur', error);
                alert('Une erreur est survenue, veuillez réessayer.');
            });
    });

    // Gestionnaire pour le type de livraison
    document.querySelectorAll('input[name="delivery-type"]').forEach(radio => {
        radio.addEventListener('change', (event) => {
            const deliveryAddress = document.querySelector('textarea[name="delivery-address"]');
            deliveryAddress.classList.toggle('hidden', event.target.value === 'pickup');
            deliveryAddress.required = event.target.value === 'delivery';
        });
    });
});