const Category = require("../models/category");
const Item = require("../models/item");
const { body, validationResult } = require("express-validator");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const streamifier = require("streamifier");
const asyncHandler = require("express-async-handler");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage({});
const upload = multer({ storage: storage });

exports.index = asyncHandler(async (req, res, next) => {
  const allItems = await Item.find({}, "").sort({ name: 1 }).exec();

  res.render("item_index", {
    title: "Shop",
    items: allItems,
  });
});

exports.item_create_get = asyncHandler(async (req, res, next) => {
  const allCategories = await Category.find({}, "name")
    .sort({ name: 1 })
    .exec();

  res.render("item_form", {
    title: "Create Item",
    categories: allCategories,
    errors: {},
    item: {},
    passwordIsRequired: false,
  });
});

exports.item_create_post = [
  upload.single("image"),
  body("name", "Item Name must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("description", "Item Description must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("categories.*").escape(),
  body("price", "Price must be specified")
    .trim()
    .isNumeric()
    .isLength({ min: 1 })
    .escape(),
  body("number", "Stock Number is required.").trim().isNumeric().escape(),
  asyncHandler(async (req, res, next) => {
    if (!Array.isArray(req.body.categories)) {
      req.body.categories =
        typeof req.body.categories === "undefined" ? [] : [req.body.categories];
    }
    const errors = validationResult(req);

    try {
      let imageUrl = "";

      if (req.file) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "items" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
        imageUrl = result.secure_url;
      }

      const item = new Item({
        name: req.body.name,
        description: req.body.description,
        categories: req.body.categories,
        price: req.body.price,
        number: req.body.number,
        imageUrl: imageUrl,
      });

      if (!errors.isEmpty()) {
        const allCategories = await Category.find({}, "name")
          .sort({ name: 1 })
          .exec();
        allCategories.forEach((category) => {
          if (item.categories.includes(category._id)) {
            category.checked = true;
          }
        });
        res.render("item_form", {
          title: "Create Item",
          categories: allCategories,
          item: item,
          errors: errors.array(),
        });
      } else {
        await item.save();
        res.redirect(item.url);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al subir el archivo a Cloudinary" });
    }
  }),
];

exports.item_detail = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id).populate("categories").exec();

  if (item === null) {
    const err = new Error("Item not found");
    err.status = 404;
    return next(err);
  }

  console.log(item);
  res.render("item_detail", {
    title: item.name,
    item: item,
  });
});

exports.item_delete_get = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id).exec();

  if (item === null) {
    res.redirect("/");
  }

  res.render("item_delete", {
    title: `Delete item: ${item.name}`,
    item: item,
    error: "",
    passwordIsRequired: true,
  });
});

exports.item_delete_post = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id).exec();
  if (req.body.password !== "password") {
    res.render("item_delete", {
      title: `Delete item: ${item.name}`,
      item: item,
      error: "Wrong Password",
      passwordIsRequired: true,
    });
  } else {
    await Item.findByIdAndDelete(req.body.itemid);
    res.redirect("/");
  }
});

exports.item_update_get = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id);
  const allCategories = await Category.find({}, "name")
    .sort({ name: 1 })
    .exec();

  allCategories.forEach((category) => {
    if (item.categories.includes(category._id)) category.checked = "true";
  });

  res.render("item_form", {
    title: "Create Item",
    categories: allCategories,
    item: item,
    errors: {},
    passwordIsRequired: true,
  });
});

exports.item_update_post = [
  upload.single("image"),
  body("name", "Item Name must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("description", "Item Description must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("categories.*").escape(),
  body("price", "Price must be specified")
    .trim()
    .isNumeric()
    .isLength({ min: 1 })
    .escape(),
  body("number", "Stock Number is required.")
    .trim()
    .isNumeric()
    .isLength({ min: 0 })
    .escape(),
  asyncHandler(async (req, res, next) => {
    if (req.body.password !== "password") {
      const item = await Item.findById(req.params.id);
      const allCategories = await Category.find({}, "name")
        .sort({ name: 1 })
        .exec();

      allCategories.forEach((category) => {
        if (item.categories.includes(category._id)) category.checked = "true";
      });
      res.render("item_form", {
        title: "Create Item",
        categories: allCategories,
        item: item,
        errors: [{ msg: "Wrong Password" }],
        passwordIsRequired: true,
      });
    } else {
      if (!Array.isArray(req.body.categories)) {
        req.body.categories =
          typeof req.body.categories === "undefined"
            ? []
            : [req.body.categories];
      }
      const errors = validationResult(req);

      const item = new Item({
        name: req.body.name,
        description: req.body.description,
        categories: req.body.categories,
        price: req.body.price,
        number: req.body.number,
        _id: req.params.id,
      });

      try {
        if (req.file) {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "items" }, // Puedes ajustar esta opción según tus necesidades
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );

            streamifier.createReadStream(req.file.buffer).pipe(stream);
          });
          item.imageUrl = result.secure_url; // Actualizar la URL de la imagen en Cloudinary si se proporciona una nueva imagen
        }

        if (!errors.isEmpty()) {
          const allCategories = await Category.find({}, "name")
            .sort({ name: 1 })
            .exec();

          allCategories.forEach((category) => {
            if (item.categories.includes(category._id)) {
              category.checked = true;
            }
          });

          res.render("item_form", {
            title: "Create Item",
            categories: allCategories,
            item: item,
            errors: errors.array(),
            passwordIsRequired: true,
          });
        } else {
          // Verificar si se ha cargado una nueva imagen antes de actualizar
          if (!req.file) {
            // No se cargó ninguna imagen nueva, por lo tanto, mantenemos la URL de imagen existente
            const existingItem = await Item.findById(req.params.id);
            item.imageUrl = existingItem.imageUrl;
          }

          const updatedItem = await Item.findByIdAndUpdate(
            req.params.id,
            item,
            {}
          );
          res.redirect(updatedItem.url);
        }
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ error: "Error al subir el archivo a Cloudinary" });
      }
    }
  }),
];
