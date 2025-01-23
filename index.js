const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt=require('jsonwebtoken')

const app = express();
const port = 4000;

// Middleware
app.use(express.json());
app.use(cors());





// MongoDB Connection
mongoose.connect('mongodb+srv://2100031449cseh:koushik@cluster0.33q8e.mongodb.net/Ecommerce')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Image Storage
const storage = multer.diskStorage({
  destination: './upload/images',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// Image Upload Endpoint
app.post('/upload', upload.single('product'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const imageUrl = `http://localhost:${port}/images/${req.file.filename}`;
  res.json({ success: 1, image_url: imageUrl });
});

// Product Schema
const productSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: { type: Number, required: true },
  old_price: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true }
});
const Product = mongoose.model('Product', productSchema);

// Add Product Endpoint
app.post('/addproduct', async (req, res) => {
  try {
    const { name, image, category, new_price, old_price } = req.body;

    if (!name || !image || !category || !new_price || !old_price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const lastProduct = await Product.findOne().sort({ id: -1 }).lean();
    const newId = lastProduct ? lastProduct.id + 1 : 1;

    const product = new Product({
      id: newId,
      name,
      image,
      category,
      new_price,
      old_price
    });

    await product.save();
    res.status(201).json({ success: true, message: 'Product added successfully' });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/removeproduct',async (req,res)=>{
  await Product.findOneAndDelete({id:req.body.id});
  console.log("Removed")
  res.json({
    success :true,
    name:req.body.name
  })
})


app.get('/allproducts',async(req,res)=>
{
  let products=  await Product.find({});
  console.log("All Products Fetched");
  res.send(products)

})

// Schema creating for user model
const Users=mongoose.model('Users',{
  name:{
    type:String,
  },
  email:
  {
    type:String,
    unique:true,    
  },
  password:
  {
    type:String,
  },
  cartData:
  {
    type:Object,
  },
  date:
  {
    type:Date,
    default:Date.now,
  }
})


//Creating Endpoint for registering the user

app.post('/signup',async(req,res)=>
{
  let check=await Users.findOne({email:req.body.email});
  if (check) 
  {
    return res.status(400).json({success:false,errors:"existing user found with same email address "})
  }
  let cart={};
  for (let i = 0; i < 300; i++) {
    cart[i]=0;
  }
  const user =new Users({
    name:req.body.username,
    email:req.body.email,
    password:req.body.password,
    cartData:cart
  })

  await user.save();

  const data ={
    user:{
      id:user.id
    }
  }

 
  const token = jwt.sign(data,'secret_ecom');
  res.json({success:true,token});

})

//creating  endpoint for users login
app.post('/login',async (req,res)=>{
  let user=await Users.findOne({email:req.body.email});
  if(user){
    const passCompare=req.body.password ===user.password;
    if(passCompare)
    {
      const data={
        user:{
          id:user.id
        }
      }
      const token =jwt.sign(data,'secret_ecom');
      res.json({success:true,token});
    }
    else{
      res.json({success:false,errors:"Wrong password"});
    }
  }
  else{
    res.json({success:false,errors:"Wrong E-mail Id"})
  }
})



// Start Server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});