// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const Image = require('../models/Image');
const sharp = require('sharp');

// Get image endpoint
router.get('/get-image/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Process image
    const matches = image.data.match(/^data:(image\/\w+);base64,/);
    const contentType = matches ? matches[1] : 'image/png';
    const base64Data = image.data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Resize and optimize
    const processedImage = await sharp(buffer)
      .resize(200, 200)
      .jpeg({ quality: 80 })
      .toBuffer();

    // Set headers
    res.set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000'
    });
    
    res.send(processedImage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error retrieving image' });
  }
});

// Upload image endpoint
// routes/uploadRoutes.js
router.post('/upload-image', async (req, res) => {
    try {
      const { userId, image, oldImage } = req.body;
      
      // Delete old image if exists
      if (oldImage) {
        try {
          await Image.findByIdAndDelete(oldImage);
          console.log(`Deleted old image: ${oldImage}`);
        } catch (deleteError) {
          console.error('Error deleting old image:', deleteError);
          return res.status(500).json({ error: 'Failed to delete old image' });
        }
      }
  
      // Store new image
      const newImage = new Image({
        userId,
        data: image,
      });
      
      await newImage.save();
      
      res.json({ 
        imageId: newImage._id
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Image upload failed' });
    }
  });

module.exports = router;