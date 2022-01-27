const express = require('express');
const {User} = require("../../model");
const router = express.Router();
const {authenticate, upload} = require("../../middlewares");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require('jimp');

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

