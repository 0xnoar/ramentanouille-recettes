document.addEventListener("DOMContentLoaded", () => {
    const quantites = document.querySelectorAll(".quantite");
    const panierListe = document.getElementById("liste-panier");
    const livraisonSelect = document.getElementById("livraison");
    const adresseInput = document.getElementById("adresse");
    const formCommande = document.getElementById("form-commande");

    quantites.forEach(input => {
        input.addEventListener("input", mettreAJourPanier);
    });

    livraisonSelect.addEventListener("change", () => {
        adresseInput.style.display = livraisonSelect.value === "livraison" ? "block" : "none";
    });

    formCommande.addEventListener("submit", (e) => {
        e.preventDefault();
        envoyerCommande();
    });

    function mettreAJourPanier() {
        panierListe.innerHTML = "";
        quantites.forEach(input => {
            if (input.value > 0) {
                const nomPlat = input.closest(".recette").dataset.nom;
                const li = document.createElement("li");
                li.textContent = `${nomPlat} x${input.value}`;
                panierListe.appendChild(li);
            }
        });
    }

    function envoyerCommande() {
        const nom = document.getElementById("nom").value;
        const telephone = document.getElementById("telephone").value;
        const email = document.getElementById("email").value;
        const dateLivraison = document.getElementById("date-livraison").value;
        const heureLivraison = document.getElementById("heure-livraison").value;
        const livraison = livraisonSelect.value;
        const adresse = adresseInput.value;
        
        let commande = "Commande:\n";
        document.querySelectorAll("#liste-panier li").forEach(item => {
            commande += `- ${item.textContent}\n`;
        });
        
        commande += `\nInformations Client:\nNom: ${nom}\nTéléphone: ${telephone}\nEmail: ${email}\nDate: ${dateLivraison}\nHeure: ${heureLivraison}\nMode: ${livraison}`;
        if (livraison === "livraison") {
            commande += `\nAdresse: ${adresse}`;
        }
        
        console.log("Envoi de la commande:", commande);
        alert("Commande envoyée avec succès !");
    }
});
