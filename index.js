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

// middleware
function verifyJwt(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).send({ message: 'unauthorized user', statusCode: 401 });
  }

  const token = header.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
    if (error) {
      return res.status(403).send({ message: 'forbidden access', statusCode: 403 })
    }

    req.decoded = decoded;
    next()
  })
};


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
const usersCollection = client.db('usedProductResale').collection('users');
const categoriesCollection = client.db('usedProductResale').collection('categories');
const productsCollection = client.db('usedProductResale').collection('products');

const verifyAdmin = async (req, res, next) => {
  const decodedEmail = req.decoded.email;
  const query = { email: decodedEmail }
  const user = await usersCollection.findOne(query);

  if (user?.role !== 'admin') {
    return res.status(403).send({ acknowledgement: false })
  }

  next();
};

const verifySeller = async (req, res, next) => {
  const decodedEmail = req.decoded.email;
  const query = { email: decodedEmail }
  const user = await usersCollection.findOne(query);

  if (user?.role !== 'seller') {
    return res.status(403).send({ acknowledgement: false })
  }

  next();
};

const verifyBearer = async (req, res, next) => {
  const decodedEmail = req.decoded.email;
  const query = { email: decodedEmail }
  const user = await usersCollection.findOne(query);

  if (user?.role !== 'bearer') {
    return res.status(403).send({ acknowledgement: false })
  }

  next();
};

// ---------------------> users
app.post('/users', async (req, res) => {
  const user = req.body;
  const result = await usersCollection.insertOne(user);
  res.send(result);
});


// ---------------------> categories
app.get('/categories', async (req, res) => {
  const query = {};
  const result = await categoriesCollection.find(query).toArray();
  res.send(result)
});


// ---------------------> products
app.post('/product', async (req, res) => {
  const data = req.body;
  const result = await productsCollection.insertOne(data);
  res.send(result);
});

app.get('/products', async (req, res) => {
  const query = {};
  const result = await productsCollection.find(query).toArray();
  res.send(result);
});


app.get('/', (req, res) => {
  res.send('Used Product server is running')
});

app.listen(port, () => {
  console.log(`server running on the port ${port}`.cyan)
});