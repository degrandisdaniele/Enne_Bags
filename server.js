const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware per il parsing del corpo delle richieste JSON
app.use(express.json());
// Middleware per il parsing di dati URL-encoded (per i form HTML)
app.use(express.urlencoded({ extended: true }));

// Serve file statici dalla directory 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Serve file statici dalla directory 'images' sotto il percorso '/images'
app.use('/images', express.static(path.join(__dirname, 'images')));

// Endpoint API per ottenere tutti i prodotti
app.get('/api/products', (req, res) => {
  fs.readFile(path.join(__dirname, 'data', 'products.json'), 'utf8', (err, data) => {
    if (err) {
      console.error("Errore durante la lettura di products.json:", err);
      return res.status(500).json({ error: "Errore interno del server." });
    }
    try {
      const products = JSON.parse(data);
      res.json(products);
    } catch (parseErr) {
      console.error("Errore durante il parsing di products.json:", parseErr);
      return res.status(500).json({ error: "Errore interno del server (parsing fallito)." });
    }
  });
});

// Endpoint API per il checkout
app.post('/api/checkout', (req, res) => {
  const { cart, formData } = req.body;

  // Validazione di base (semplice controllo che i dati esistano)
  if (!cart || !formData) {
    return res.status(400).json({ error: "Dati mancanti per il checkout." });
  }

  // Ulteriore validazione per i campi del form (esempio)
  if (!formData.nome || !formData.indirizzo || !formData.email) {
    return res.status(400).json({ error: "Campi del modulo mancanti o non validi." });
  }

  console.log("Nuovo ordine ricevuto:");
  console.log("Dati del Carrello:", cart);
  console.log("Dati del Modulo:", formData);

  // Simula il salvataggio dell'ordine (es. in un file orders.json)
  const orderData = {
    timestamp: new Date().toISOString(),
    cart: cart,
    customer: formData
  };

  // Per ora, stampiamo solo sulla console. In futuro, potremmo salvare in un file.
  // fs.appendFile(path.join(__dirname, 'data', 'orders.json'), JSON.stringify(orderData) + '\\n', err => {
  //   if (err) {
  //     console.error("Errore durante il salvataggio dell'ordine:", err);
  //     // Non bloccare la risposta al cliente per questo errore di logging
  //   }
  // });

  res.json({ success: true, message: "Ordine ricevuto con successo!", orderDetails: orderData });
});


// Avvio del server
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
  console.log(`Visita http://localhost:${PORT} per vedere il sito.`);
});
