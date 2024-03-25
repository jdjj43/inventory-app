const Category = require("../models/category");
const Item = require("../models/item");
const { body, validationResult } = require("express-validator");

const asyncHandler = require("express-async-handler");

exports.categories_list = asyncHandler(async (req, res, next) => {
  const allCategories = await Category.find({}, "name")
    .sort({ name: 1 })
    .exec();

  res.render("category", { title: "Categories", categories: allCategories });
});

exports.category_detail = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id).exec();

  res.render("category_detail", {
    title: `Category Details: ${category.name}`,
    category: category,
  });
});

exports.category_create_get = (req, res, next) => {
  res.render("category_form", { title: "Create Category" });
};

exports.category_create_post = [
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("description", "Description must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const category = new Category({
      name: req.body.name,
      description: req.body.description,
    });

    if (!errors.isEmpty()) {
      res.render("category_form", {
        title: "Create Category",
        category: category,
      });
    } else {
      await category.save();
      res.redirect(category.url);
    }
  }),
];

exports.category_delete_get = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id).exec();
  const itemsInCategory = await Item.find({ categories: req.params.id }, "name").exec();
  console.log(itemsInCategory);

  if (category === null) {
    res.redirect("/category");
  }

  res.render("category_delete", {
    title: `Delete Category: ${category.name}`,
    category: category,
    items: itemsInCategory,
  });
});

exports.category_delete_post = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id).exec();
  const itemsInCategory = await Item.find({ category: req.params.id }, "name").exec();

  if( categoryInItem > 0 ) {
    res.render("category_delete", {
      title: `Delete Category: ${category.name}`,
      category: category,
      items: itemsInCategory,
    })
    return;
  } else {
    await Category.findByIdAndDelete(req.body.categoryid);
    res.redirect("/category");
  }
});

exports.category_update_get = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id).exec();

  if (category === null) {
    res.redirect("/category");
  }

  res.render("category_form", {
    title: `Update Category: ${category.name}`,
    category: category,
  });
});

exports.category_update_post = [
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("description", "Description must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const category = new Category({
      name: req.body.name,
      description: req.body.description,
      _id: req.params.id
    })

    if (!errors.isEmpty()) {
      res.render("category_form", {
        title: `Update Category: ${category.name}`,
        category: category,
      });
      return;
    } else {
      const updatedCategory = await Category.findByIdAndUpdate(req.params.id, category, {});

      res.redirect(updatedCategory.url);
    }
  }),
];
