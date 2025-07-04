// public/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM completamente caricato e analizzato. app.js in esecuzione.");

    // Funzioni Utilità Carrello
    const getCart = () => {
        const cart = localStorage.getItem('shoppingCart');
        return cart ? JSON.parse(cart) : [];
    };

    const saveCart = (cart) => {
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
    };

    const addToCart = (productId, quantity = 1, color = null, allProducts = []) => {
        let cart = getCart();
        const existingProductIndex = cart.findIndex(item => item.id === productId && item.color === color);
        const productDetails = getProductDetails(productId, allProducts);

        if (!productDetails) {
            console.error("Prodotto non trovato:", productId);
            return; // Non aggiungere al carrello se il prodotto non esiste
        }

        if (existingProductIndex > -1) {
            cart[existingProductIndex].quantity += quantity;
        } else {
            cart.push({
                id: productId,
                name: productDetails.nome, // Aggiungiamo nome e prezzo per comodità nel carrello
                price: productDetails.prezzo,
                image: productDetails.immagine_principale,
                quantity,
                color
            });
        }
        saveCart(cart);
        updateCartIcon();
        console.log("Prodotto aggiunto/aggiornato nel carrello:", { productId, quantity, color });
        alert(`${productDetails.nome} (${color || 'colore non specificato'}) aggiunto al carrello!`);
    };

    const updateCartIcon = () => {
        const cart = getCart();
        const cartItemCountElement = document.getElementById('cart-item-count');
        if (cartItemCountElement) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartItemCountElement.textContent = totalItems;
            console.log("Icona carrello aggiornata:", totalItems);
        } else {
            // console.warn("Elemento 'cart-item-count' non trovato. Impossibile aggiornare l'icona.");
        }
    };

    // Funzione helper per trovare i dettagli di un prodotto (da un array di prodotti)
    const getProductDetails = (productId, allProducts) => {
        // Assicurati che productId sia un numero se gli ID nei prodotti sono numeri
        const idToCompare = parseInt(productId, 10);
        return allProducts.find(p => p.id === idToCompare);
    };


    // --- Logica specifica per le Pagine ---

    // Logica per la pagina Collezioni (collezioni.html)
    if (document.getElementById('product-grid')) { // Identificatore della griglia prodotti
        console.log("Pagina Collezioni rilevata.");
        fetch('/api/products')
            .then(response => response.json())
            .then(products => {
                console.log("Prodotti ricevuti:", products);
                const productGrid = document.getElementById('product-grid');
                if (productGrid) {
                    products.forEach(product => {
                        const productCard = `
                            <div class="product-card">
                                <a href="prodotto.html?id=${product.id}">
                                    <img src="${product.immagine_principale}" alt="${product.nome}" style="width:100%; max-width:300px; height:auto;">
                                    <h3>${product.nome}</h3>
                                    <p>€${product.prezzo.toFixed(2)}</p>
                                </a>
                                <!-- Potremmo aggiungere un pulsante "Aggiungi al carrello rapido" qui in futuro -->
                            </div>
                        `;
                        productGrid.innerHTML += productCard;
                    });
                }
            })
            .catch(error => console.error('Errore nel caricamento prodotti per la pagina collezioni:', error));
    }

    // Logica per la Pagina Prodotto (prodotto.html)
    if (document.getElementById('product-details-container')) { // Identificatore del contenitore dettagli prodotto
        console.log("Pagina Prodotto rilevata.");
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');

        if (productId) {
            fetch('/api/products') // Prende tutti i prodotti, poi filtra
                .then(response => response.json())
                .then(allProducts => {
                    const product = getProductDetails(productId, allProducts);
                    console.log("Dettagli prodotto:", product);
                    if (product) {
                        const container = document.getElementById('product-details-container');
                        container.innerHTML = `
                            <h1>${product.nome}</h1>
                            <img src="${product.immagine_principale}" alt="${product.nome}" style="width:100%; max-width:400px;">
                            <p>${product.descrizione}</p>
                            <p>Prezzo: €${product.prezzo.toFixed(2)}</p>
                            <div class="product-gallery">
                                ${product.immagini_galleria.map(img => `<img src="${img}" alt="Dettaglio ${product.nome}" style="width:100px; margin:5px;">`).join('')}
                            </div>
                            <div class="product-options">
                                <label for="color-select">Colore:</label>
                                <select id="color-select">
                                    ${product.colori_disponibili.map(color => `<option value="${color}">${color}</option>`).join('')}
                                </select>
                                <!-- Aggiungere input quantità se necessario -->
                            </div>
                            <button id="add-to-cart-btn" data-product-id="${product.id}">Aggiungi al Carrello</button>
                        `;

                        document.getElementById('add-to-cart-btn').addEventListener('click', function() {
                            const selectedColor = document.getElementById('color-select').value;
                            // Passiamo 'allProducts' ad addToCart in modo che possa trovare i dettagli del prodotto
                            addToCart(product.id, 1, selectedColor, allProducts);
                        });
                    } else {
                        document.getElementById('product-details-container').innerHTML = '<p>Prodotto non trovato.</p>';
                    }
                })
                .catch(error => {
                    console.error('Errore nel caricamento dei dettagli del prodotto:', error);
                    document.getElementById('product-details-container').innerHTML = '<p>Errore nel caricamento del prodotto.</p>';
                });
        } else {
            document.getElementById('product-details-container').innerHTML = '<p>Nessun prodotto specificato.</p>';
        }
    }

    // Logica per la Pagina Carrello (carrello.html)
    if (document.getElementById('cart-items-container')) {
        console.log("Pagina Carrello rilevata.");
        const cartItemsContainer = document.getElementById('cart-items-container');
        const cartTotalElement = document.getElementById('cart-total');
        let allProductsCache = []; // Cache per i dettagli dei prodotti

        const renderCart = () => {
            const cart = getCart();
            cartItemsContainer.innerHTML = ''; // Pulisci il contenitore
            let total = 0;

            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<p>Il tuo carrello è vuoto.</p>';
                if(cartTotalElement) cartTotalElement.textContent = '€0.00';
                updateCartIcon(); // Assicura che l'icona sia 0
                return;
            }

            // Ottieni tutti i prodotti una volta per evitare chiamate multiple dentro al loop
            fetch('/api/products')
                .then(response => response.json())
                .then(fetchedProducts => {
                    allProductsCache = fetchedProducts; // Salva nella cache
                    cart.forEach(item => {
                        // Non è più necessario cercare i dettagli qui se li abbiamo salvati in addToCart
                        // const productDetails = getProductDetails(item.id, allProductsCache);
                        // Invece usiamo quelli salvati, o li recuperiamo se mancano
                        const displayItem = { ...item }; // Copia item per non modificare l'originale nel carrello
                        if (!displayItem.name || !displayItem.price || !displayItem.image) {
                             // Se mancano dettagli (es. carrello da sessione precedente), li recuperiamo
                            const productDetailsServer = getProductDetails(item.id, allProductsCache);
                            if (productDetailsServer) {
                                displayItem.name = productDetailsServer.nome;
                                displayItem.price = productDetailsServer.prezzo;
                                displayItem.image = productDetailsServer.immagine_principale;
                            }
                        }

                        const itemTotal = displayItem.price * item.quantity;
                        total += itemTotal;

                        const cartItemElement = document.createElement('div');
                        cartItemElement.classList.add('cart-item');
                        cartItemElement.innerHTML = `
                            <img src="${displayItem.image}" alt="${displayItem.name}" style="width:80px; height:auto; margin-right:10px;">
                            <div>
                                <h4>${displayItem.name}</h4>
                                <p>Colore: ${item.color || 'N/D'}</p>
                                <p>Prezzo unitario: €${displayItem.price.toFixed(2)}</p>
                                <p>Quantità:
                                    <input type="number" value="${item.quantity}" min="1" class="item-quantity" data-product-id="${item.id}" data-color="${item.color}">
                                </p>
                                <p>Subtotale: €${itemTotal.toFixed(2)}</p>
                                <button class="remove-item-btn" data-product-id="${item.id}" data-color="${item.color}">Rimuovi</button>
                            </div>
                        `;
                        cartItemsContainer.appendChild(cartItemElement);
                    });

                    if(cartTotalElement) cartTotalElement.textContent = `€${total.toFixed(2)}`;
                    addCartEventListeners(); // Aggiungi event listener dopo aver creato gli elementi
                    updateCartIcon();
                })
                .catch(error => {
                    console.error("Errore nel caricare i dettagli dei prodotti per il carrello:", error);
                    cartItemsContainer.innerHTML = "<p>Errore nel caricamento dei dati del carrello.</p>";
                });
        };

        const addCartEventListeners = () => {
            document.querySelectorAll('.item-quantity').forEach(input => {
                input.addEventListener('change', (e) => {
                    const productId = e.target.dataset.productId;
                    const color = e.target.dataset.color;
                    const newQuantity = parseInt(e.target.value, 10);
                    updateQuantityInCart(productId, color, newQuantity);
                });
            });

            document.querySelectorAll('.remove-item-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const productId = e.target.dataset.productId;
                    const color = e.target.dataset.color;
                    removeFromCart(productId, color);
                });
            });
        };

        const updateQuantityInCart = (productId, color, newQuantity) => {
            let cart = getCart();
            const itemIndex = cart.findIndex(item => item.id.toString() === productId && item.color === color);
            if (itemIndex > -1 && newQuantity > 0) {
                cart[itemIndex].quantity = newQuantity;
            } else if (itemIndex > -1 && newQuantity <= 0) {
                cart.splice(itemIndex, 1); // Rimuovi se la quantità è 0 o meno
            }
            saveCart(cart);
            renderCart(); // Rirenderizza il carrello
        };

        const removeFromCart = (productId, color) => {
            let cart = getCart();
            cart = cart.filter(item => !(item.id.toString() === productId && item.color === color));
            saveCart(cart);
            renderCart(); // Rirenderizza il carrello
        };

        renderCart(); // Chiamata iniziale per visualizzare il carrello
    }


    // Logica per la Pagina Checkout (checkout.html)
    if (document.getElementById('checkout-form')) {
        console.log("Pagina Checkout rilevata.");
        const checkoutForm = document.getElementById('checkout-form');
        const orderSummaryContainer = document.getElementById('order-summary'); // Assumiamo esista questo ID
        let allProductsCacheCheckout = [];

        const displayOrderSummary = () => {
            const cart = getCart();
            if (orderSummaryContainer) orderSummaryContainer.innerHTML = '';
            let total = 0;

            if (cart.length === 0) {
                if (orderSummaryContainer) orderSummaryContainer.innerHTML = '<p>Il tuo carrello è vuoto. Impossibile procedere al checkout.</p>';
                 // Potrebbe essere utile disabilitare il form se il carrello è vuoto
                if(checkoutForm) checkoutForm.style.display = 'none';
                return;
            }

            fetch('/api/products')
                .then(response => response.json())
                .then(fetchedProducts => {
                    allProductsCacheCheckout = fetchedProducts;
                    const summaryUl = document.createElement('ul');
                    cart.forEach(item => {
                        const displayItem = { ...item };
                        if (!displayItem.name || !displayItem.price) {
                            const productDetailsServer = getProductDetails(item.id, allProductsCacheCheckout);
                            if (productDetailsServer) {
                                displayItem.name = productDetailsServer.nome;
                                displayItem.price = productDetailsServer.prezzo;
                            }
                        }
                        const itemTotal = displayItem.price * item.quantity;
                        total += itemTotal;
                        const listItem = document.createElement('li');
                        listItem.textContent = `${displayItem.name} (Colore: ${item.color || 'N/D'}) x ${item.quantity} - €${itemTotal.toFixed(2)}`;
                        summaryUl.appendChild(listItem);
                    });
                    if (orderSummaryContainer) {
                        orderSummaryContainer.appendChild(summaryUl);
                        const totalElement = document.createElement('p');
                        totalElement.innerHTML = `<strong>Totale Ordine: €${total.toFixed(2)}</strong>`;
                        orderSummaryContainer.appendChild(totalElement);
                    }
                })
                .catch(error => {
                     console.error("Errore nel caricare i dettagli dei prodotti per il riepilogo ordine:", error);
                     if(orderSummaryContainer) orderSummaryContainer.innerHTML = "<p>Errore nel caricamento del riepilogo ordine.</p>";
                });
        };

        displayOrderSummary(); // Mostra il riepilogo al caricamento della pagina

        checkoutForm.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log("Submit del modulo di checkout.");

            const formData = {
                nome: document.getElementById('nome').value,
                cognome: document.getElementById('cognome').value,
                email: document.getElementById('email').value,
                indirizzo: document.getElementById('indirizzo').value,
                citta: document.getElementById('citta').value,
                cap: document.getElementById('cap').value,
                // Aggiungere altri campi se necessario
            };

            // Validazione semplice
            let isValid = true;
            for (const key in formData) {
                if (!formData[key]) {
                    isValid = false;
                    alert(`Il campo ${key} è obbligatorio.`);
                    break;
                }
            }
            // Validazione email semplice
            if (isValid && formData.email && !formData.email.includes('@')) {
                isValid = false;
                alert("Inserisci un indirizzo email valido.");
            }

            if (isValid) {
                const cart = getCart();
                if (cart.length === 0) {
                    alert("Il carrello è vuoto. Aggiungi prodotti prima di procedere.");
                    return;
                }

                const dataToSend = {
                    cart: cart,
                    formData: formData
                };

                console.log("Dati inviati al backend:", dataToSend);

                fetch('/api/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dataToSend),
                })
                .then(response => response.json())
                .then(data => {
                    console.log("Risposta dal backend:", data);
                    if (data.success) {
                        alert(data.message || "Grazie per il tuo ordine!");
                        saveCart([]); // Svuota il carrello
                        updateCartIcon();
                        // Reindirizza a una pagina di conferma o pulisci il form
                        checkoutForm.reset();
                        displayOrderSummary(); // Aggiorna il riepilogo (dovrebbe mostrare carrello vuoto)
                        // window.location.href = '/conferma-ordine.html'; // Esempio di reindirizzamento
                    } else {
                        alert(`Errore durante il checkout: ${data.error || 'Si è verificato un problema.'}`);
                    }
                })
                .catch((error) => {
                    console.error('Errore:', error);
                    alert('Si è verificato un errore durante l\'invio dell\'ordine.');
                });
            }
        });
    }

    // Chiamata iniziale per aggiornare l'icona del carrello al caricamento di qualsiasi pagina
    updateCartIcon();
});
