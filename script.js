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
        recipe.quantity = 0; // Ajout de la propriété quantité
        return recipe;
    });
}

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
            <div class="quantity-control">
                <button class="quantity-btn minus">-</button>
                <input type="number" min="0" value="${recipe.quantity}" class="quantity-input">
                <button class="quantity-btn plus">+</button>
            </div>
        </div>
    `;

    card.innerHTML = content;

    // Ajout des gestionnaires d'événements pour la quantité
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

// Fonction de filtrage des recettes
function filterRecipes() {
    const selectedFilters = {
        regime: Array.from(document.querySelectorAll('input[name="regime"]:checked')).map(cb => cb.value),
        portion: Array.from(document.querySelectorAll('input[name="portion"]:checked')).map(cb => cb.value),
        type: Array.from(document.querySelectorAll('input[name="type"]:checked')).map(cb => cb.value),
        spicy: Array.from(document.querySelectorAll('input[name="spicy"]:checked')).map(cb => cb.value)
    };

    return allRecipes.filter(recipe => {
        // Si aucun filtre de régime n'est sélectionné, montrer toutes les recettes
        if (selectedFilters.regime.length === 0) {
            return true;
        }

        const recipeRegimes = recipe['Régime alimentaire'].split(',').map(r => r.trim());

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
            displayRecipes(filterRecipes());
        });

        cartItem.appendChild(itemInfo);
        cartItem.appendChild(removeButton);
        cartItems.appendChild(cartItem);
    });

    const orderForm = document.getElementById('order-form');
    orderForm.classList.toggle('hidden', selectedRecipes.length === 0);
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadRecipes();
    
    // Gestion des filtres
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            displayRecipes(filterRecipes());
        });
    });

    // Gestion du panier
    const cartToggle = document.getElementById('cartToggle');
    const cart = document.getElementById('cart');
    if (cartToggle && cart) {
        cartToggle.addEventListener('click', () => {
            cart.classList.toggle('open');
        });
    }

    // Gestion du formulaire de commande
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const formData = new FormData(event.target);
            
            const itemsList = allRecipes
                .filter(recipe => recipe.quantity > 0)
                .map(recipe => ({
                    title: recipe['Titre de la recette'],
                    quantity: recipe.quantity
                }));

            const orderDetails = {
                customerName: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                deliveryType: formData.get('delivery-type') === 'pickup' ? 'À venir chercher' : 'Livraison',
                deliveryAddress: formData.get('delivery-address'),
                deliveryDate: new Date(formData.get('delivery-date')).toLocaleDateString('fr-FR'),
                deliveryTime: formData.get('delivery-time'),
                items_str: itemsList.map(item => `${item.title}: ${item.quantity}`).join('\n'),
                items: itemsList
            };

            emailjs.send('service_hdwid4k', 'template_k2nup5c', orderDetails)
                .then(response => {
                    console.log('Commande envoyée', response.status, response.text);
                    alert('Votre commande a été envoyée avec succès !');
                    event.target.reset();
                    allRecipes.forEach(recipe => recipe.quantity = 0);
                    updateCart();
                    displayRecipes(filterRecipes());
                })
                .catch(error => {
                    console.error('Erreur:', error);
                    alert('Une erreur est survenue, veuillez réessayer.');
                });
        });
    }

    // Gestion du type de livraison
    const deliveryInputs = document.querySelectorAll('input[name="delivery-type"]');
    if (deliveryInputs.length > 0) {
        deliveryInputs.forEach(input => {
            input.addEventListener('change', (event) => {
                const deliveryAddress = document.querySelector('textarea[name="delivery-address"]');
                if (deliveryAddress) {
                    deliveryAddress.classList.toggle('hidden', event.target.value === 'pickup');
                    deliveryAddress.required = event.target.value === 'delivery';
                }
            });
        });
    }
});