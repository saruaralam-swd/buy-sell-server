const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('colors')
require('dotenv').config();
const jwt = require('jsonwebtoken');

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
run().catch(error => { console.log(error.name.bgRed, error.message.bold) })

// --------------------------- collection --------------------------->
const usersCollection = client.db('usedProductResale').collection('users');
const categoriesCollection = client.db('usedProductResale').collection('categories');
const productsCollection = client.db('usedProductResale').collection('products');
const ordersCollection = client.db('usedProductResale').collection('orders');

app.get('/jwt', async (req, res) => {
  const email = req.query.email;
  const query = { email: email };
  const user = await usersCollection.findOne(query);

  if (user) {
    const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '20d' });
    return res.send({ accessToken: token });
  }

  res.status(403).send({ accessToken: '' });
});


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
app.post('/users', async (req, res) => { // store user info in Data base
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

app.get('/category/:id', async (req, res) => {
  const id = req.params.id;
  const query = { categoryId: id, }
  const result = await productsCollection.find(query).toArray();
  res.send(result);
});

// ---------------------> products
app.post('/product', async (req, res) => {
  const data = req.body;
  const result = await productsCollection.insertOne(data);
  res.send(result);
});


app.put('/products/:id', async (req, res) => { // for advertise 
  const id = req.params.id;
  const filter = { _id: ObjectId(id) }
  const options = { upsert: true };

  const updateDoc = {
    $set: {
      advertise: true
    },
  };

  const result = await productsCollection.updateOne(filter, updateDoc, options)
  res.send(result)
});


app.get('/products', async (req, res) => {
  const query = {};
  const result = await productsCollection.find(query).toArray();
  res.send(result);
});


app.get('/advertisement', async (req, res) => {
  const query = { advertise: true, available: true }
  const result = await productsCollection.find(query).toArray();
  res.send(result);
});

// ---------------------> orders
// when order success, product available: false
app.get('/orders', async (req, res) => {
  const email = req.query.email;
  const query = { email };
  const result = await ordersCollection.find(query).toArray();
  res.send(result);
});


app.put('/available/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: ObjectId(id) };
  const options = { upsert: true };
  const updateDoc = {
    $set: {
      available: false
    }
  }
  const result = await productsCollection.updateOne(filter, updateDoc, options);
  res.send(result);
});


app.post('/order', async (req, res) => {
  const order = req.body;
  const result = await ordersCollection.insertOne(order);
  res.send(result);
});

app.get('/myBuyers', verifyJwt, async (req, res) => {
  // const email = req.query.email;
  // const filter = { email };
  // const user = await usersCollection.findOne(filter);

  // if (user?.role !== "seller") {
  //   return res.status(403).send({ message: 'forbidden access' })
  // }

  // const query = { sellerEmail: email };
  
  const query = {};
  const result = await ordersCollection.find(query).toArray();
  res.send(result)
});





// <------------------->
app.get('/', (req, res) => {
  res.send('Used Product server is running')
});


app.listen(port, () => {
  console.log(`server running on the port ${port}`.cyan)
});



    // // temporary to update price field on appointment option
    // app.get('/addPrice', async (req, res) => {
    //   const filter = {};
    //   const options = { upsert: true };
    //   const updateDoc = {
    //     $set: {
    //       price: 99,
    //     }
    //   }
    //   const result = await allServicesCollection.updateMany(filter, updateDoc, options);
    //   res.send(result)
    // });