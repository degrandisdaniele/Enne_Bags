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
        alert(`${productDetails.nome} (${color || 'colore non specificato'}) è stato aggiunto al carrello!`);
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


    // --- Funzioni Utilità Wishlist ---
    const getWishlist = () => {
        const wishlist = localStorage.getItem('wishlistItems');
        return wishlist ? JSON.parse(wishlist) : [];
    };

    const saveWishlist = (wishlist) => {
        localStorage.setItem('wishlistItems', JSON.stringify(wishlist.map(id => parseInt(id, 10)))); // Salva sempre come numeri
    };

    const isProductInWishlist = (productId) => {
        const id = parseInt(productId, 10);
        return getWishlist().includes(id);
    };

    const addToWishlistStorage = (productId) => {
        const id = parseInt(productId, 10);
        let wishlist = getWishlist();
        if (!wishlist.includes(id)) {
            wishlist.push(id);
            saveWishlist(wishlist);
        }
        updateWishlistHeaderIcon();
    };

    const removeFromWishlistStorage = (productId) => {
        const id = parseInt(productId, 10);
        let wishlist = getWishlist();
        wishlist = wishlist.filter(itemId => itemId !== id);
        saveWishlist(wishlist);
        updateWishlistHeaderIcon();
    };

    const updateWishlistButtonState = (productId, buttonElement) => {
        if (!buttonElement) return;
        const inWishlist = isProductInWishlist(productId);
        // Per ora, cambiamo solo un testo o un attributo. In futuro si potrebbe cambiare l'SVG.
        if (inWishlist) {
            buttonElement.classList.add('in-wishlist'); // Aggiungi una classe per styling
            buttonElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256"><path d="M128,216S28,160,28,92A52,52,0,0,1,80,40a52,52,0,0,1,48,48A52,52,0,0,1,176,40a52,52,0,0,1,52,52C228,160,128,216,128,216Z"></path></svg>'; // Cuore pieno
        } else {
            buttonElement.classList.remove('in-wishlist');
            buttonElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256"><path d="M178,32c-20.65,0-38.73,8.88-50,23.89C116.73,40.88,98.65,32,78,32A62.07,62.07,0,0,0,16,94c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,220.66,240,164,240,94A62.07,62.07,0,0,0,178,32ZM128,206.8C109.74,196.16,32,147.69,32,94A46.06,46.06,0,0,1,78,48c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,147.61,146.24,196.15,128,206.8Z"></path></svg>'; // Cuore vuoto
        }
    };

    const toggleWishlist = (productId, buttonElement) => {
        const id = parseInt(productId, 10);
        if (isProductInWishlist(id)) {
            removeFromWishlistStorage(id);
        } else {
            addToWishlistStorage(id);
        }
        if (buttonElement) { // Potrebbe non esserci se chiamato solo per aggiornare il count header
           updateWishlistButtonState(id, buttonElement);
        }
    };

    const updateWishlistHeaderIcon = () => {
        const wishlistCountElement = document.getElementById('wishlist-count');
        if (wishlistCountElement) {
            wishlistCountElement.textContent = getWishlist().length;
        }
    };

    const addWishlistEventListeners = () => {
        document.querySelectorAll('.wishlist-btn').forEach(button => {
            // Rimuovi vecchi listener per evitare duplicazioni se questa funzione viene chiamata più volte
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);

            newButton.addEventListener('click', function(e) {
                e.preventDefault(); // Previeni navigazione se il pulsante è dentro un <a>
                e.stopPropagation();
                const productId = this.dataset.productId;
                toggleWishlist(productId, this);
            });
            // Imposta stato iniziale
            updateWishlistButtonState(newButton.dataset.productId, newButton);
        });
    };


    // --- Logica specifica per le Pagine ---

    let allProductsGlobal = []; // Per memorizzare tutti i prodotti per filtri e ricerca

    // Funzione per renderizzare i prodotti nella griglia
    const renderProducts = (productsToRender) => {
        const productGrid = document.getElementById('product-grid');
        if (!productGrid) return;
        productGrid.innerHTML = ''; // Pulisci la griglia prima di aggiungere nuovi prodotti

        if (productsToRender.length === 0) {
            productGrid.innerHTML = '<p class="col-span-full text-center">Nessun prodotto trovato.</p>';
            return;
        }

        productsToRender.forEach(product => {
            const productCard = `
                <div class="product-card border rounded-lg p-4 shadow hover:shadow-lg transition-shadow">
                    <a href="prodotto.html?id=${product.id}" class="block">
                        <img src="${product.immagine_principale}" alt="${product.nome}" class="w-full h-48 object-cover mb-2 rounded">
                        <h3 class="text-lg font-semibold text-gray-800">${product.nome}</h3>
                        <p class="text-gray-600">€${product.prezzo.toFixed(2)}</p>
                    </a>
                    <button class="wishlist-btn absolute top-2 right-2 p-1 bg-white bg-opacity-50 rounded-full hover:bg-opacity-75 focus:outline-none" data-product-id="${product.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256"><path d="M178,32c-20.65,0-38.73,8.88-50,23.89C116.73,40.88,98.65,32,78,32A62.07,62.07,0,0,0,16,94c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,220.66,240,164,240,94A62.07,62.07,0,0,0,178,32ZM128,206.8C109.74,196.16,32,147.69,32,94A46.06,46.06,0,0,1,78,48c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,147.61,146.24,196.15,128,206.8Z"></path></svg>
                    </button>
                </div>
            `;
            productGrid.innerHTML += productCard;
        });
        addWishlistEventListeners(); // Aggiungi listener ai nuovi pulsanti cuore
    };

    // Logica per la pagina Collezioni (collezioni.html)
    if (document.getElementById('product-grid')) { // Identificatore della griglia prodotti
        console.log("Pagina Collezioni rilevata.");

        fetch('/api/products')
            .then(response => response.json())
            .then(products => {
                allProductsGlobal = products; // Salva i prodotti globalmente
                renderProducts(allProductsGlobal); // Renderizza tutti i prodotti inizialmente
                console.log("Prodotti ricevuti e renderizzati:", products);
            })
            .catch(error => console.error('Errore nel caricamento prodotti per la pagina collezioni:', error));

        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase().trim();
                applyFiltersAndSearch();
            });
        }

        // Logica Filtri
        const filterCheckboxes = document.querySelectorAll('input[type="checkbox"][data-filter-group]');
        filterCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                applyFiltersAndSearch();
            });
        });

        const applyFiltersAndSearch = () => {
            // 1. Ottieni il termine di ricerca
            const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";

            // 2. Ottieni i filtri attivi
            const activeFilters = {
                tipo: [],
                materiale: [],
                colore: []
            };
            filterCheckboxes.forEach(cb => {
                if (cb.checked) {
                    const group = cb.dataset.filterGroup;
                    if (activeFilters[group]) {
                        activeFilters[group].push(cb.value);
                    }
                }
            });

            console.log("Termine Ricerca:", searchTerm);
            console.log("Filtri Attivi:", activeFilters);

            // 3. Filtra i prodotti
            let productsToDisplay = allProductsGlobal;

            // Applica ricerca
            if (searchTerm) {
                productsToDisplay = productsToDisplay.filter(product => {
                    return product.nome.toLowerCase().includes(searchTerm) ||
                           (product.descrizione && product.descrizione.toLowerCase().includes(searchTerm));
                });
            }

            // Applica filtri per gruppo
            Object.keys(activeFilters).forEach(groupKey => {
                if (activeFilters[groupKey].length > 0) {
                    productsToDisplay = productsToDisplay.filter(product => {
                        // I prodotti in products.json hanno 'tipo', 'materiale', e 'colori_disponibili' (array)
                        if (groupKey === 'colore') { // 'colori_disponibili' è un array
                            return product.colori_disponibili && product.colori_disponibili.some(col => activeFilters[groupKey].includes(col));
                        } else { // 'tipo' e 'materiale' sono stringhe singole
                            return product[groupKey] && activeFilters[groupKey].includes(product[groupKey]);
                        }
                    });
                }
            });

            console.log("Prodotti da visualizzare:", productsToDisplay.length);
            renderProducts(productsToDisplay);
        };
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
                            <div class="flex items-center gap-4 mt-4">
                                <button id="add-to-cart-btn" data-product-id="${product.id}" class="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors">Aggiungi al Carrello</button>
                                <button class="wishlist-btn p-2 border rounded-full hover:bg-gray-100 focus:outline-none" data-product-id="${product.id}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256"><path d="M178,32c-20.65,0-38.73,8.88-50,23.89C116.73,40.88,98.65,32,78,32A62.07,62.07,0,0,0,16,94c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,220.66,240,164,240,94A62.07,62.07,0,0,0,178,32ZM128,206.8C109.74,196.16,32,147.69,32,94A46.06,46.06,0,0,1,78,48c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,147.61,146.24,196.15,128,206.8Z"></path></svg>
                                </button>
                            </div>
                        `;

                        // Listener per Aggiungi al Carrello
                        document.getElementById('add-to-cart-btn').addEventListener('click', function() {
                            const selectedColor = document.getElementById('color-select').value;
                            // Passiamo 'allProducts' ad addToCart in modo che possa trovare i dettagli del prodotto
                            addToCart(product.id, 1, selectedColor, allProducts);
                        });

                        // Listener e stato iniziale per il pulsante Wishlist sulla pagina prodotto
                        const productPageWishlistBtn = container.querySelector('.wishlist-btn');
                        if (productPageWishlistBtn) {
                            updateWishlistButtonState(product.id, productPageWishlistBtn); // Stato iniziale
                            productPageWishlistBtn.addEventListener('click', function(e) {
                                e.preventDefault();
                                toggleWishlist(product.id, this);
                            });
                        }

                        // Aggiorna il breadcrumb con il nome del prodotto
                        const breadcrumbProductName = document.getElementById('breadcrumb-product-name');
                        if (breadcrumbProductName) {
                            breadcrumbProductName.textContent = product.nome;
                        }
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
                if(cartTotalElement) cartTotalElement.textContent = '€0.00'; // Mantenere simbolo valuta se necessario
                const cartSubtotalElement = document.getElementById('cart-subtotal');
                if(cartSubtotalElement) cartSubtotalElement.textContent = '€0.00';
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

                    const cartSubtotalElement = document.getElementById('cart-subtotal');
                    if(cartSubtotalElement) cartSubtotalElement.textContent = `€${total.toFixed(2)}`;
                    if(cartTotalElement) cartTotalElement.textContent = `€${total.toFixed(2)}`; // Assumendo che tasse e spedizione siano 0 per ora
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
                if (orderSummaryContainer) orderSummaryContainer.innerHTML = '<p>Il tuo carrello è vuoto. Impossibile procedere al pagamento.</p>';
                 // Potrebbe essere utile disabilitare il form se il carrello è vuoto
                if(checkoutForm) checkoutForm.style.display = 'none';
                return;
            } else {
                 if(checkoutForm) checkoutForm.style.display = ''; // Assicura che il form sia visibile se il carrello non è vuoto
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
            // Mappatura dei nomi dei campi per i messaggi di errore
            const fieldNames = {
                nome: "Nome",
                cognome: "Cognome",
                email: "Email",
                indirizzo: "Indirizzo",
                citta: "Città",
                cap: "CAP"
            };

            for (const key in formData) {
                if (!formData[key] && fieldNames[key]) { // Controlla solo i campi mappati
                    isValid = false;
                    alert(`Il campo "${fieldNames[key]}" è obbligatorio.`);
                    break;
                }
            }

            if (isValid && formData.email && !/\S+@\S+\.\S+/.test(formData.email)) { // Regex migliorata per email
                isValid = false;
                alert("Inserisci un indirizzo email valido.");
            }

            if (isValid) {
                const cart = getCart();
                if (cart.length === 0) {
                    alert("Il carrello è vuoto. Aggiungi prodotti prima di procedere al pagamento.");
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
                        alert(data.message || "Grazie per il tuo ordine!"); // Il messaggio di successo viene dal backend
                        saveCart([]); // Svuota il carrello
                        updateCartIcon();
                        // Reindirizza a una pagina di conferma o pulisci il form
                        checkoutForm.reset();
                        displayOrderSummary(); // Aggiorna il riepilogo (dovrebbe mostrare carrello vuoto)
                        // window.location.href = '/pagina-conferma-ordine.html'; // Esempio di reindirizzamento
                    } else {
                        alert(`Errore durante il pagamento: ${data.error || 'Si è verificato un problema.'}`);
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
    // Chiamata iniziale per aggiornare l'icona della wishlist nell'header (se presente su tutte le pagine)
    updateWishlistHeaderIcon();
});
