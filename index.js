require('dotenv').config();
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fqpbo6u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server
      await client.connect();

    const productCollection = client.db('apparelsDB').collection('product');
    const moderatorCollection = client.db('apparelsDB').collection('moderators');

    // API endpoint to add a product
    app.post('/api/products', async (req, res) => {
      try {
        const { name, image, price } = req.body;
        if (!name || !image || price == null) {
          return res.status(400).json({ error: 'All fields (name, image, price) are required' });
        }
        const product = { name, image, price, createdAt: new Date() };
        const result = await productCollection.insertOne(product);
        res.status(201).json({ message: 'Product added successfully', product: { _id: result.insertedId, ...product } });
      } catch (error) {
        console.error('Error adding product:', error.message, error.stack);
        res.status(500).json({ error: `Failed to add product: ${error.message}` });
      }
    });

    // API endpoint to get all products
    app.get('/api/products', async (req, res) => {
      try {
        const cursor = productCollection.find();
        const products = await cursor.toArray();
        res.status(200).json(products);
      } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
      }
    });

    // API endpoint to update a product
    app.put('/api/products/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { name, image, price } = req.body;
        if (!name || !image || price == null) {
          return res.status(400).json({ error: 'All fields (name, image, price) are required' });
        }
        const updatedProduct = { name, image, price, updatedAt: new Date() };
        const result = await productCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedProduct }
        );
        if (result.matchedCount === 0) {
          return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json({ message: 'Product updated successfully', product: { _id: id, ...updatedProduct } });
      } catch (error) {
        console.error('Error updating product:', error.message, error.stack);
        res.status(500).json({ error: `Failed to update product: ${error.message}` });
      }
    });

    // API endpoint to delete a product
    app.delete('/api/products/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const result = await productCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
      } catch (error) {
        console.error('Error deleting product:', error.message, error.stack);
        res.status(500).json({ error: `Failed to delete product: ${error.message}` });
      }
    });

    // API endpoint to add a moderator
    app.post('/api/moderators', async (req, res) => {
      try {
        const { uid, displayName, email, role, image } = req.body;
        if (!uid || !displayName || !email || !role) {
          return res.status(400).json({ error: 'UID, displayName, email, and role are required' });
        }
        if (!['admin', 'moderator'].includes(role)) {
          return res.status(400).json({ error: 'Role must be either "admin" or "moderator"' });
        }
        const existingModerator = await moderatorCollection.findOne({ uid });
        if (existingModerator) {
          return res.status(400).json({ error: 'Moderator with this UID already exists' });
        }
        const moderator = { uid, displayName, email, role, image, createdAt: new Date() };
        const result = await moderatorCollection.insertOne(moderator);
        res.status(201).json({ message: 'Moderator added successfully', moderator: { _id: result.insertedId, ...moderator } });
      } catch (error) {
        console.error('Error adding moderator:', error.message, error.stack);
        res.status(500).json({ error: `Failed to add moderator: ${error.message}` });
      }
    });

    // API endpoint to get all moderators
app.get('/api/moderators', async (req, res) => {
    try {
      const { uid } = req.query;
      let query = {};
      if (uid) {
        query = { uid };
      }
      const cursor = moderatorCollection.find(query);
      const moderators = await cursor.toArray();
      res.status(200).json(moderators);
    } catch (error) {
      console.error('Error fetching moderators:', error);
      res.status(500).json({ error: 'Failed to fetch moderators' });
    }
  });

    // API endpoint to update a moderator
    app.put('/api/moderators/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { uid, displayName, email, role, image } = req.body;
        if (!uid || !displayName || !email || !role) {
          return res.status(400).json({ error: 'UID, displayName, email, and role are required' });
        }
        if (!['admin', 'moderator'].includes(role)) {
          return res.status(400).json({ error: 'Role must be either "admin" or "moderator"' });
        }
        const updatedModerator = { uid, displayName, email, role, image, updatedAt: new Date() };
        const result = await moderatorCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedModerator }
        );
        if (result.matchedCount === 0) {
          return res.status(404).json({ error: 'Moderator not found' });
        }
        res.status(200).json({ message: 'Moderator updated successfully', moderator: { _id: id, ...updatedModerator } });
      } catch (error) {
        console.error('Error updating moderator:', error.message, error.stack);
        res.status(500).json({ error: `Failed to update moderator: ${error.message}` });
      }
    });

    // API endpoint to delete a moderator
    app.delete('/api/moderators/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const result = await moderatorCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Moderator not found' });
        }
        res.status(200).json({ message: 'Moderator deleted successfully' });
      } catch (error) {
        console.error('Error deleting moderator:', error.message, error.stack);
        res.status(500).json({ error: `Failed to delete moderator: ${error.message}` });
      }
    });

    // API endpoint to get the user's role
    app.get('/api/user/role', async (req, res) => {
        try {
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }
    
        // In a production environment, you should verify the token using Firebase Admin SDK
        const decodedToken = { uid: req.query.uid }; 
        if (!req.query.uid) {
            return res.status(400).json({ error: 'UID is required' });
        }
    
        // Fetch the user's role from MongoDB
        const moderatorCollection = client.db('apparelsDB').collection('moderators');
        const userDoc = await moderatorCollection.findOne({ uid: req.query.uid });
        if (!userDoc) {
            return res.status(404).json({ error: 'User not found in database' });
        }
    
        res.status(200).json({ role: userDoc.role });
        } catch (error) {
        console.error('Error fetching user role:', error);
        res.status(500).json({ error: 'Failed to fetch user role' });
        }
    });

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });

  } catch (error) {
    console.error('Error in run:', error);
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Backend Running');
});

app.listen(port, () => {

});