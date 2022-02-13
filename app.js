const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const date = require(__dirname + '/date.js');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


mongoose.connect("<CONNECTION STRING HERE>");

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

let day = date.getDate();

app.get('/', (req, res) => {
  Item.find({}, (err, foundItems) => {
    if (err) {
      console.log(err);
    } else if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added the default items to DB");
        }
      });
      res.redirect("/");
    } else {
      res.render('list', { listTitle: day, newListItems: foundItems });
    }
  });

});

app.get('/favicon.ico', (req, res) => { });

app.get("/about", function (req, res) {
  List.distinct('name', (err, result) => {
    res.render("about", { itemList: result });
  })
});

app.post("/about/delete", function (req, res) {
  const deleteListName = req.body.aboutDelete;
  List.deleteMany({ name: deleteListName }, (err, result) => {
    if (!err) {
      console.log("Successfully deleted " + result.name + " List.");
      res.redirect("/about");
    }
  })
})


app.get('/:customListName', (req, res) => {
  const customListName = req.params.customListName;

  List.findOne({ name: _.capitalize(customListName) }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: _.capitalize(customListName),
          items: defaultItems
        });
        list.save();
        res.redirect("/" + _.capitalize(customListName));
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    }
  });
});

app.post('/', (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item(
    {
      name: itemName
    }
  );

  if (listName === day) {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    });
  }
});

app.post('/delete', (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === day) {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted the checked item!");
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, (err, foundList) => {
      if (!err) {
        res.redirect('/' + listName);
      }
    });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, () => {
  console.log("Server running on port 3000!");
});