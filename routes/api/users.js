const express = require('express');
const {User} = require("../../model");
const router = express.Router();
const {authenticate, upload} = require("../../middlewares");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require('jimp');
const {NotFound, BadRequest} = require("http-errors");
const {sendEmail} = require("../../sendgrid/helpers");

const {SITE_NAME} = process.env;



const avatarsDir = path.join(__dirname, "../../", "public", "avatars");

router.get("/current", authenticate, async(req, res) => {
    const {email, subscription} = req.user;
    res.json({
        email,
        subscription
    })
});

router.get("/logout", authenticate, async(req, res) => {
    const {_id} = req.user; 
    await User.findByIdAndUpdate(_id, {token: null});
    res.status(204).send();
});

// верификация эл почты
router.get("/verify/:verificationToken", async(req, res, next) => {
  try {
    const {verificationToken} = req.params;
    const user = await User.findOne({verificationToken});
    if(!user){
      throw new NotFound("User not found");
    }
    await User.findByIdAndUpdate(user._id, {verificationToken: null, verify: true});
    res.json({
      message: "Verification successful",
    })
  } catch (error) {
      next(error);
  }
})

// повторная отправка письма с просьбой подтвердить эмеил 
router.post("/verify", async(req, res, next) => {
  try {
    const {email} = req.body;
    if(!email){
      throw new BadRequest("missing required field email");
    }
    const user = await User.findOne({email}); 
    if(!user){
      throw new NotFound("User not found");
    }
    if(user.verify){
      throw new BadRequest("Verification has already been passes")
    } 
    const {verificationToken} = user; 

    const data = {
      to: email,
      subject: "Подтверждение email",
      html: `<a target="_blank" href="${SITE_NAME}/users/verify/${verificationToken}">Confirm your email</a>`,
  }
    await sendEmail(data);
    res.json({message: "Verification email sent"}); 


  } catch (error) {
    next(error);
  }
})


router.patch("/avatars", authenticate, upload.single("avatar"), async(req, res) => {
  const {path: tempUpload, filename} = req.file;
  const [extension] = filename.split(".").reverse();
  const newFleName = `${req.user._id}.${extension}`;  // создаем имя загружаемого аватара, ид пользователя + расширение файла 
  const fileUpload = path.join(avatarsDir, newFleName); 
  await fs.rename(tempUpload, fileUpload); // перемещаем аватар с папки темповой в паблик
  const avatarURL = path.join("avatars", newFleName);

  try {
    const avatarReSize = await Jimp.read(fileUpload);
    avatarReSize.resize(250, 250);
    avatarReSize.write(fileUpload);
  } catch (error) {
    console.log(error);
  }

  await User.findByIdAndUpdate(req.user._id, {avatarURL}, {new: true}); 
  res.json({avatarURL})
})

module.exports = router;

