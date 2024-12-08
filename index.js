const express = require('express');
const { resolve } = require('path');

const app = express();
let { sequelize } = require('./lib/index');
let { book } = require('./models/book.model');
const { user } = require('./models/user.model');
const { like } = require('./models/like.model');
let { Op } = require('@sequelize/core');

app.use(express.json());

let bookData = [
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    genre: 'Fiction',
    year: 1960,
    summary: 'A novel about the serious issues of rape and racial inequality.',
  },
  {
    title: '1984',
    author: 'George Orwell',
    genre: 'Dystopian',
    year: 1949,
    summary:
      'A novel presenting a dystopian future under a totalitarian regime.',
  },
  {
    title: 'Moby-Dick',
    author: 'Herman Melville',
    genre: 'Adventure',
    year: 1851,
    summary:
      'The narrative of the sailor Ishmael and the obsessive quest of Ahab.',
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    genre: 'Romance',
    year: 1813,
    summary:
      'A romantic novel that charts the emotional development of the protagonist Elizabeth Bennet.',
  },
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    genre: 'Fiction',
    year: 1925,
    summary: 'A novel about the American dream and the roaring twenties.',
  },
];

app.get('/seed_db', async (req, res) => {
  try {
    await sequelize.sync({ force: true });

    await book.bulkCreate(bookData);

    await user.create({
      username: 'booklover',
      email: 'booklover@gmail.com',
      password: 'password123',
    });

    res.status(200).json({ message: 'Database seeding successfull' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/books', async (req, res) => {
  try {
    let books = await book.findAll();
    res.status(200).json({ books });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    let users = await user.findAll();
    return res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/likes', async (req, res) => {
  try {
    let likes = await like.findAll();
    return res.status(200).json({ likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Function to handle the liking process
async function likeBook(data) {
  let newLike = await like.create({
    userId: data.userId,
    bookId: data.bookId,
  });

  return { message: 'Book liked successfully', newLike };
}

//Endpoint 1: Like a Book
app.get('/users/:id/like', async (req, res) => {
  try {
    let userId = parseInt(req.params.id);
    let bookId = parseInt(req.query.bookId);
    let response = await likeBook({ userId, bookId });

    return res.status(200).json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Function to handle the disliking process
async function dislikeBook(data) {
  let count = await like.destroy({
    where: {
      userId: data.userId,
      bookId: data.bookId,
    },
  });

  if (count === 0) return {};

  return { message: 'Book disliked successfully' };
}

//Endpoint 2: Dislike a Book
app.get('/users/:id/dislike', async (req, res) => {
  try {
    let userId = parseInt(req.params.id);
    let bookId = parseInt(req.query.bookId);
    let response = await dislikeBook({ userId, bookId });

    if (!response.message)
      return res
        .status(404)
        .json({ message: 'This book is not in your liked list' });

    return res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Function to handle fetching liked books
async function getAllLikedBooks(userId) {
  let bookIds = await like.findAll({
    where: {
      userId: userId,
    },
    attributes: ['bookId'],
  });

  let bookRecords = [];

  for (let i = 0; i < bookIds.length; i++) {
    bookRecords.push(bookIds[i].bookId);
  }

  let likedBooks = await book.findAll({
    where: { id: { [Op.in]: bookRecords } },
  });

  return { likedBooks };
}

//Endpoint 3: Get All Liked Books
app.get('/users/:id/liked', async (req, res) => {
  try {
    let userId = parseInt(req.params.id);
    let response = await getAllLikedBooks(userId);

    return res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
