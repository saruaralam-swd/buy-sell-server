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

// middleware (verify jwt)
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


const verifyAdmin = async (req, res, next) => {
  const decodedEmail = req.decoded.email;
  const email = req.query.email;
  if (decodedEmail !== email) {
    return res.status(403).send({ message: 'forbidden access' })
  }

  const query = { email };
  const user = await usersCollection.findOne(query);
  if (user?.role !== "admin") {
    return res.status(403).send({ message: 'forbidden access' })
  }

  next();
};

const verifySeller = async (req, res, next) => {
  const decodedEmail = req.decoded.email;
  const email = req.query.email;

  if (decodedEmail !== email) {
    return res.status(403).send({ message: 'forbidden access' })
  }

  const query = { email };
  const user = await usersCollection.findOne(query);
  if (user?.role !== "seller") {
    return res.status(403).send({ message: 'forbidden access' })
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

// # users
app.post('/users', async (req, res) => { // store user info in Data base
  const user = req.body;
  const result = await usersCollection.insertOne(user);
  res.send(result);
});

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



// categories
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


// -------> products
app.post('/product', verifyJwt, verifySeller, async (req, res) => {
  const data = req.body;
  const result = await productsCollection.insertOne(data);
  res.send(result);
});


app.get('/myProducts', verifyJwt, verifySeller, async (req, res) => {
  const email = req.query.email;
  const query = { sellerEmail: email };
  const result = await productsCollection.find(query).toArray();
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


app.delete('/product/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: ObjectId(id) };
  const result = await productsCollection.deleteOne(query);
  res.send(result);
});



app.get('/advertisement', async (req, res) => {
  const query = { advertise: true, }
  const result = await productsCollection.find(query).toArray();
  res.send(result);
});


app.get('/myBuyers', verifyJwt, verifySeller, async (req, res) => {
  const email = req.query.email;
  const query = { sellerEmail: email };
  const result = await ordersCollection.find(query).toArray();
  res.send(result)
});





// -------> orders
// when order success, product available: false
app.post('/order', async (req, res) => {
  const order = req.body;
  const result = await ordersCollection.insertOne(order);
  res.send(result);
});

app.get('/orders', verifyJwt, async (req, res) => {
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




// ---------------------> for admin
app.get('/allBuyers', verifyJwt, verifyAdmin, async (req, res) => {
  const query = {};
  const result = await ordersCollection.find(query).project({ email: 1 }).toArray();
  res.send(result)
});

app.get('/allSellers', verifyJwt, verifyAdmin, async (req, res) => {
  const query = {};
  const result = await productsCollection.find(query).project({ sellerEmail: 1, sellerName: 1, verify: 1, }).toArray();
  res.send(result);
});


// ----> check user role <----
app.get('/user/admin/:email', async (req, res) => { // check user is admin
  const email = req.params.email;
  const query = { email }
  const user = await usersCollection.findOne(query);
  res.send({ isAdmin: user?.role === 'admin' })
});

app.get('/user/seller/:email', async (req, res) => { // check user is seller
  const email = req.params.email;
  const query = { email }
  const user = await usersCollection.findOne(query);
  res.send({ isSeller: user?.role === 'seller' })
});

app.get('/user/buyer/:email', async (req, res) => { // check user is buyer
  const email = req.params.email;
  const query = { email }
  const user = await usersCollection.findOne(query);
  res.send({ isBuyer: user?.role === 'bearer' })
});



app.get('/', (req, res) => {
  res.send('Used Product server is running')
});


app.listen(port, () => {
  console.log(`server running on the port ${port}`.cyan)
});


/**
 * user
 *  category
 * allCategory + category/id (display all products)

 * product

 * order
 * product order

 * check user role
 * admin > all buyer + all seller + reported product
 * seller > myProducts + addProduct + myBuyers
 * buyer > myOrder + wishlist
*/

// app.get('/addPrice', async (req, res) => {
//   const filter = {};
//   const options = { upsert: true };
//   const updateDoc = {
//     $set: {
//       available: true
//     }
//   }
//   const result = await productsCollection.updateMany(filter, updateDoc, options);
//   res.send(result)
// });
