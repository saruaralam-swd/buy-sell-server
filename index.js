const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('colors')
require('dotenv').config();

const cors = require('cors');

// middleware
app.use(cors())
app.use(express.json());

const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0269g6x.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
  try {
    await client.connect();
    console.log('DB connection'.yellow.italic)
  }
  finally {

  }
}
run().catch(error => { console.log(error.name, error.message) })

// --------------------------- collection --------------------------->
const categoriesCollection = client.db('usedProductResale').collection('categories');
const productsByCategoryNameCollection = client.db('usedProductResale').collection('productsByCategoryName');

app.get('/categories', async (req, res) => {
  const query = {};
  const result = await categoriesCollection.find(query).toArray();
  res.send(result)
});


app.get('/categories/:id', async (req, res) => {
  const id = req.params.id;
  const query = { categoryId: id };
  const result = await productsByCategoryNameCollection.find(query).toArray();
  res.send(result)
});







app.get('/', (req, res) => {
  res.send('Used Product server is running')
});

app.listen(port, () => {
  console.log(`server running on the port ${port}`.cyan)
});

module.exports.app;