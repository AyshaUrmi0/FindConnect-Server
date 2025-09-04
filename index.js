
const jwt = require('jsonwebtoken');
const express = require("express");
const cookieParser = require("cookie-parser");

const cors = require("cors");
const app=express();
const port=process.env.PORT||3000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config();
const { ObjectId } = require('mongodb');

app.use(cors({
  origin: ['http://localhost:5173',
    'https://findconnect-45273.web.app',
    'https://findconnect-45273.firebaseapp.com',
  ], 
  credentials: true
}));
app.use(express.json());


const bodyParser = require('body-parser');

app.use(cookieParser());

app.use(bodyParser.json());

const verifyToken=(req,res,next)=>{
  const token = req.cookies?.token;
  console.log('Token verified:',token);

  if(!token){
    return res.status(401).send('Access Denied');
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send('Invalid Token');
    }
    req.user = decoded;

    next();
  });
 

}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sth4y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;



const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
   
  




//jwt
          app.post('/jwt', (req, res) => {
            const user = req.body;
          const token = jwt.sign(user, process.env.JWT_SECRET,{expiresIn: '10h'});
          res.cookie('token', token, { 
            httpOnly: true,
            secure:process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        }).send({ success: true });
          });


          app.post('/logout', (req, res) => {
            res.clearCookie('token',{
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            })
            .send({ success: true });
          });


//all lost item data

    const lostItemCollection=client.db("allItems").collection("Items");

    app.get("/items",async(req,res)=>{
        const cursor=lostItemCollection.find({}).sort({date:-1}).limit(6);
        const lostItems=await cursor.toArray();
        res.send(lostItems);
        
    })

    
    const allItemCollection=client.db("allItems").collection("Items");
    app.get("/allItems",async(req,res)=>{
        const cursor=allItemCollection.find({});
        const allItems=await cursor.toArray();
        res.send(allItems);
        
    })

    app.get('/items/:id',async(req,res)=>{
        const id=req.params.id;
        const query={_id:new ObjectId(id)};
        const result=await lostItemCollection.findOne(query);
        res.send(result);
    })



     const recoveredItemsCollection=client.db("allItems").collection("allRecoveredItems");
     app.post('/recoveredItems', async (req, res) => {
        try {
            const recoveryData = req.body;
            //console.log("Received Data:", recoveryData); 
            const result = await recoveredItemsCollection.insertOne(recoveryData);
            //console.log("Insert Result:", result);
            res.status(201).send(result); 
        } catch (error) {
            console.error("Error inserting recovered item:", error);
            res.status(500).send({ message: "Internal Server Error", error });
        }
    });


    
      app.put('/recoveredItems/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const updateDoc = { $set: { status: "recovered" } };
        const result = await lostItemCollection.updateOne(query, updateDoc);
        res.send(result);
      });
      app.get('/recoveredItems', async (req, res) => {
        const email = req.query.email;
        const query = { "email": email };
        const recoveredItems = await recoveredItemsCollection.find(query).toArray();
        res.send(recoveredItems);
      });

     
      
      app.patch('/status/:id', async (req, res) => {
        const id = req.params.id;
        console.log(id)
        const query = { _id: new ObjectId(id) };
        const updateDoc = { $set: { status: 'recovered' } };
        const result = await allItemCollection.updateOne(query, updateDoc);
        res.send(result);
      });  
      
      const addedItemsCollection = client.db('allItems').collection('addedItems');
      const updateCollection=client.db('allItems').collection('Items');
    

      // POST endpoint for form submission
      app.post('/addedItems', async (req, res) => {
      
        const itemData = req.body;
        //console.log(itemData);
          
      
          const result = await updateCollection.insertOne(itemData);
          const result1 = await addedItemsCollection.insertOne(itemData);
          
         // console.log('Inserted Item:', result);
          res.status(201).send(result);




      });
      
      
      
      app.get('/addedItems',verifyToken, async (req, res) => {
        const email = req.query.email;
        const query = { "contactInfo.email": email };

         console.log(req.cookies?.token);
//         console.log("Query Email:", req.query.email);
// console.log("Decoded User Email:", req.user.email);

       if (req.user.email !== req.query.email) {
  return res.status(403).send('forbidden');
}
        const addedItems = await addedItemsCollection.find(query).toArray();
        res.send(addedItems);
      });






      app.get('/addedItems/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
      
        const addedItem = await addedItemsCollection.findOne(query);
        res.send(addedItem);
      });

      app.put('/addedItems/:id', async (req, res) => {
        const id = req.params.id; 
        const updatedItem = req.body; 
    
        const query = { _id: new ObjectId(id) }; 
        const updateDoc = {
            $set: {
                postType: updatedItem.postType, 
                title: updatedItem.title,       
                description: updatedItem.description, 
                category: updatedItem.category,  
                location: updatedItem.location, 
                date: new Date(updatedItem.date), 
            },
        };
    
        try {
            const result = await addedItemsCollection.updateOne(query, updateDoc);
    
            if (result.modifiedCount === 1) {
                res.status(200).send({ message: 'Item updated successfully!' });
            } else if (result.matchedCount === 1) {
                res.status(200).send({ message: 'No changes were made to the item.' });
            } else {
                res.status(404).send({ error: 'Item not found.' });
            }
        } catch (error) {
            console.error('Failed to update the item:', error);
            res.status(500).send({ error: 'Internal server error.' });
        }
    });
    
    

      app.delete('/addedItems/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await addedItemsCollection.deleteOne(query);
        res.send(result);
      });

app.get('/statistics', async (req, res) => {
  try {
    const totalItems = await allItemCollection.countDocuments();
    const lostItems = await allItemCollection.countDocuments({ status: 'notFound' });
    const foundItems = await allItemCollection.countDocuments({ status: 'found' });
    const recoveredItems = await recoveredItemsCollection.countDocuments();
    
    res.json({
      totalItems,
      lostItems,
      foundItems,
      recoveredItems,
      recoveryRate: totalItems > 0 ? Math.round((recoveredItems / totalItems) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

     

  } finally {
    // Ensures that the client will close when you finish/error
   // await client.close();
  }
}
run().catch(console.dir);




















app.get("/",(req,res)=>{
    res.send("Server is running..........");
});
app.listen(port,()=>{    
    console.log(`Server is running on port ${port}`);
});
