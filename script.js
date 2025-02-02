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
        recipe.quantity = 0;
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
            <div class="quantity-control">
                <button class="quantity-btn minus">-</button>
                <input type="number" min="0" value="${recipe.quantity}" class="quantity-input">
                <button class="quantity-btn plus">+</button>
                <span class="price">${parseFloat(recipe['Prix']).toFixed(2)} €</span>
            </div>
        </div>
`;

    card.innerHTML = content;

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
        const recipeRegimes = recipe['Régime alimentaire'].split(',').map(r => r.trim());
        
        // Gestion des régimes alimentaires
        let regimeMatch = selectedFilters.regime.length === 0;

        if (!regimeMatch) {
            // Si "Sans restriction" est sélectionné
            if (selectedFilters.regime.includes('Sans restriction')) {
                regimeMatch = true;
            } else {
                // Gérer les autres filtres
                selectedFilters.regime.forEach(filter => {
                    switch (filter) {
                        case 'Véganisme':
                            // Véganisme : uniquement les recettes véganes
                            if (recipeRegimes.includes('Véganisme')) {
                                regimeMatch = true;
                            }
                            break;
                        case 'Végétarisme':
                            // Végétarisme : recettes végétariennes ET véganes
                            if (recipeRegimes.includes('Végétarisme') || recipeRegimes.includes('Véganisme')) {
                                regimeMatch = true;
                            }
                            break;
                        case 'Sans gluten':
                            // Sans gluten peut être combiné avec les autres filtres
                            if (!regimeMatch) {
                                regimeMatch = recipeRegimes.includes('Sans gluten');
                            } else {
                                regimeMatch = regimeMatch && recipeRegimes.includes('Sans gluten');
                            }
                            break;
                    }
                });
            }
        }

        // Autres filtres inchangés
        const portionMatch = selectedFilters.portion.length === 0 || 
            selectedFilters.portion.includes(recipe['Type de portion']);
        const typeMatch = selectedFilters.type.length === 0 || 
            selectedFilters.type.includes(recipe['Type de plat']);
        const spicyMatch = selectedFilters.spicy.length === 0 || 
            selectedFilters.spicy.includes(recipe['Niveau de piment']);

        return regimeMatch && portionMatch && typeMatch && spicyMatch;
    });
}

function displayRecipes(recipes) {
    const container = document.getElementById('recipes-container');
    container.innerHTML = '';
    recipes.forEach(recipe => container.appendChild(createRecipeCard(recipe)));
    updateRecipeCounter(recipes.length);
}

function updateRecipeCounter(count) {
    document.querySelector('#recipe-counter span').textContent = count;
}

function updateCart() {
    const cartCount = document.querySelector('.cart-count');
    const total = allRecipes.reduce((sum, recipe) => sum + recipe.quantity, 0);
    cartCount.textContent = total;
    
    const cartItems = document.getElementById('cart-items');
    // Calculer le total des prix
    const totalPrice = allRecipes
        .filter(recipe => recipe.quantity > 0)
        .reduce((sum, recipe) => sum + (parseFloat(recipe['Prix']) * recipe.quantity), 0);
    
    // Mettre à jour le contenu du panier
    cartItems.innerHTML = `
        ${allRecipes
            .filter(recipe => recipe.quantity > 0)
            .map(recipe => `
                <div class="cart-item">
                    <div>
                        <div class="cart-item-title">${recipe['Titre de la recette']}</div>
                        <div class="cart-item-details">
                            Quantité: ${recipe.quantity} × ${parseFloat(recipe['Prix']).toFixed(2)} €
                        </div>
                        <div class="cart-item-subtotal">
                            Sous-total: ${(recipe.quantity * parseFloat(recipe['Prix'])).toFixed(2)} €
                        </div>
                    </div>
                </div>
            `).join('')}
        <div class="cart-total">
            Total: ${totalPrice.toFixed(2)} €
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    loadRecipes();
    
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const filteredRecipes = filterRecipes();
            displayRecipes(filteredRecipes);
        });
    });

    const cartToggle = document.getElementById('cartToggle');
    const cart = document.getElementById('cart');
    if (cartToggle && cart) {
        cartToggle.addEventListener('click', () => {
            cart.classList.toggle('open');
        });
    }

    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const formData = new FormData(event.target);
            
            // Formatage des items pour le template avec les prix
            const items = allRecipes
                .filter(recipe => recipe.quantity > 0)
                .map(recipe => {
                    const price = parseFloat(recipe['Prix']);
                    const subtotal = price * recipe.quantity;
                    return {
                        title: recipe['Titre de la recette'],
                        quantity: recipe.quantity,
                        price: price.toFixed(2),
                        subtotal: subtotal.toFixed(2)
                    };
                });
        
            // Calcul du total
            const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.subtotal)), 0);
        
            const orderDetails = {
                customerName: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                deliveryType: formData.get('delivery-type') === 'pickup' ? 'À venir chercher' : 'Livraison',
                deliveryAddress: formData.get('delivery-address') || 'Pas de livraison',
                deliveryDate: formData.get('delivery-date'),
                deliveryTime: formData.get('delivery-time'),
                paymentType: formData.get('payment-type') === 'card' ? 'Carte bancaire' : 'Espèces',
                items: items,
                totalPrice: totalPrice.toFixed(2),
                items_list: items.map(item => 
                    `${item.title} x${item.quantity} (${item.price} € l'unité) = ${item.subtotal} €`
                ).join('\n')
            };
        
            emailjs.send('service_hdwid4k', 'template_k2nup5c', {
                to_name: "Ramen Ta Nouille",
                from_name: orderDetails.customerName,
                message: `
                Détails de la commande
                -------------------
                
                Informations client :
                - Nom : ${orderDetails.customerName}
                - Téléphone : ${orderDetails.phone}
                - Email : ${orderDetails.email}
                
                Livraison :
                - Type : ${orderDetails.deliveryType}
                ${orderDetails.deliveryType === 'Livraison' ? `- Adresse : ${orderDetails.deliveryAddress}` : ''}
                - Date : ${new Date(orderDetails.deliveryDate).toLocaleDateString('fr-FR')}
                - Heure : ${orderDetails.deliveryTime}
                
                Paiement :
                - Mode de paiement : ${orderDetails.paymentType}
                
                Articles commandés :
                -------------------
                ${orderDetails.items_list}
                
                TOTAL : ${orderDetails.totalPrice} €
                `
            })
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