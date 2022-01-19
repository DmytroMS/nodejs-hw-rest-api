const express = require("express");
const router = express.Router(); // создаем страницу записной книжки
const {Contact} = require("../../model");
const {validationSchema} = require("../../validation");
const {authenticate} = require("../../middlewares");


// Получаем список контактов
router.get("/", authenticate, async (req, res, next) => {
  try {
    const {page = 1, limit} = req.query;
    const skip = (page - 1) * limit;
    const {_id} = req.user; 
    const allContacts = await Contact.find({owner: _id}, '' , {skip, limit: +limit});
    res.json(allContacts);
  } catch (error) {
    next(error)   
  }
});

// Поиск контакта по ИД
router.get("/:id", async (req, res, next) => {
  const { id } = req.params; // в params содержится переменная id
  try {
    const contact = await Contact.findById(id);  // Contact.findOne({_id: contactId})
    if (!contact) {
      const error = new Error("Not Found");
      error.status = 404;
      throw error;
    }
    res.json(contact);
  } catch (error) {
    if(error.message.includes("Cast to ObjectId failed")){
      error.status = 404;
    }
    next(error);
  }
});


// Добавление в список контактов

router.post("/", authenticate, async (req,res,next) => {
  // console.log("req.user", req.user);
  try {
    const {error} = validationSchema.validate(req.body);
    if(error){
      res.status(400).json({message: "missing required name field"});
      throw error;
    }
    const {_id} = req.user; 
    const newContact = await Contact.create({...req.body, owner: _id});
    res.status(201).json(newContact);   // req.body показывает объект для записи 
  } catch (error) {
    if(error.message.includes("validation failed")){
      error.status = 400;
    }
    next(error);
  }}
)

// Обновление контакта 

router.put("/:contactId", async(req, res, next) => {
  try {
    const {error} = validationSchema.validate(req.body);
    if(error){
      res.status(400).json({message: "missing required name field"});
      throw error;}

      const {contactId} = req.params;
      const updateContact = await Contact.findByIdAndUpdate(contactId, req.body, {
        new: true});

      if (!updateContact) {
        const error = new Error("Not Found");
        error.status = 404;
        throw error;}
        res.json(updateContact);

  } catch (error) {
    if(error.message.includes("validation failed")){
      error.status = 400;
    }
    next(error);
  }}
)

router.delete("/:id", async(req, res, next) => {
  try {
    const {id} = req.params;

    const contactToBeDeleted = await Contact.findById(id);
    if(!contactToBeDeleted){
      const error = new Error("Contact has not been Found");
      error.status = 404;
      throw error;
    }
    
    await Contact.findByIdAndRemove(id);
     res.json({message: "contact deleted"})

  } catch (error) {
    next(error);
  }
});

router.patch("/:id/favorite", async(req, res, next) => {
  const {id} = req.params;
  const {favorite} = req.body;
  const {error} = validationSchema.validate(req.body);
  try {
    
    if(error){
      res.status(400).json({message: "missing required name field"});
   }
      const updateContact = await Contact.findByIdAndUpdate(id, {favorite}, {
        new: true});

      if (!updateContact) {
        const error = new Error("Not Found");
        error.status = 404;
        throw error;}
        res.json(updateContact);

  } catch (error) {
    if(error.message.includes("validation failed")){
      error.status = 400;
    }
    next(error);
  }
})

module.exports = router;


