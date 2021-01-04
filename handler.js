'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const { v4: uuidv4 } = require('uuid');



const Table = process.env.MOVIES_TABLE;
// Create a response
function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
  };
}
function sortByDate(a, b) {
  if (a.createdAt > b.createdAt) {
    return -1;
  } else return 1;
}
// Create a movie
module.exports.createMovie = (event, context, callback) => {
  console.log(event.body);
  const reqBody = JSON.parse(event.body);
  console.log(reqBody);

  if (
    !reqBody.title ||
    reqBody.title.trim() === '' ||
    !reqBody.image1 ||
    reqBody.image1.trim() === ''
  ) {
    return callback(
      null,
      response(400, {
        error: 'Movie must have a title and image1 and they must not be empty'
      })
    );
  }

  const movie = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    title: reqBody.title,
    image1: reqBody.image1,
    image2: reqBody.image2,
    movieId: reqBody.movieId,
    rating: reqBody.rating,
    genre: reqBody.genre,
    userReview: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur"
  };

  return db
    .put({
      TableName: Table,
      Item: movie
    })
    .promise()
    .then(() => {
      callback(null, response(201, movie));
    })
    .catch((err) => response(null, response(err.statusCode, err)));
};

  
// Get all 
module.exports.getAllMovies = (event, context, callback) => {
  return db
    .scan({
      TableName: Table
    })
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items.sort(sortByDate)));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};

// Get a single movie
module.exports.getMovie = (event, context, callback) => {
  const id = event.pathParameters.id;

  const params = {
    Key: {
      id: id
    },
    TableName: Table
  };

  return db
    .get(params)
    .promise()
    .then((res) => {
      if (res.Item) callback(null, response(200, res.Item));
      else callback(null, response(404, { error: 'Movie not found' }));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Update a movie
module.exports.updateMovie = (event, context, callback) => {
  const id = event.pathParameters.id;
  const reqBody = JSON.parse(event.body);
  const { image1, title } = reqBody;

  const params = {
    Key: {
      id: id
    },
    TableName: Table,
    ConditionExpression: 'attribute_exists(id)',
    UpdateExpression: 'SET title = :title, image1 = :image1',
    ExpressionAttributeValues: {
      ':title': title,
      ':image1': image1
    },
    ReturnValues: 'ALL_NEW'
  };
  console.log('Updating');

  return db
    .update(params)
    .promise()
    .then((res) => {
      console.log(res);
      callback(null, response(200, res.Attributes));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};
// Delete a movie
module.exports.deleteMovie = (event, context, callback) => {
  const id = event.pathParameters.id;
  const params = {
    Key: {
      id: id
    },
    TableName: Table
  };
  return db
    .delete(params)
    .promise()
    .then(() =>
      callback(null, response(200, { message: 'Movie deleted successfully' }))
    )
    .catch((err) => callback(null, response(err.statusCode, err)));
};