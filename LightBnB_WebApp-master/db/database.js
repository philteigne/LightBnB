const properties = require("./json/properties.json");
const users = require("./json/users.json");

/// Users

// Connect to database
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {

  return pool
    .query(
      `SELECT * FROM users
      WHERE email = $1`, [email])
    .then(result => {
      console.log(result.rows[0] || null);
      return result.rows[0] || null;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
    .query(
      `SELECT * FROM users
      WHERE id = $1`, [id])
    .then(result => {
      console.log(result.rows || null);
      return result.rows[0] || null;
    })
    .catch((err) => {
      console.log(err.message);
      return err.message;
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return pool
    .query(
      `INSERT INTO users(name, email, password)
      VALUES ($1, $2, $3)
      RETURNING *`, [user.name, user.email, user.password])
    .then(result => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
      return err.message;
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(`
      SELECT properties.*, reservations.id, reservations.start_date, avg(property_reviews.rating) as average_rating
      FROM reservations
      JOIN properties ON reservations.property_id = properties.id
      JOIN property_reviews ON properties.id = property_reviews.property_id
      WHERE reservations.guest_id = $1
      GROUP BY properties.id, reservations.id
      ORDER BY reservations.start_date
      LIMIT $2;`, [guest_id, limit])
    .then(result => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err);
      return err.message;
    });
  // return getAllProperties(null, 2);
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {

  const setQualifier = (array) => {

    if (array.length === 1) {
      return 'WHERE';
    }
    if (array.length > 1) {
      return 'AND';
    }
  };

  const queryParams = [];

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    let qualifier = setQualifier(queryParams);
    queryString += `${qualifier} city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    let qualifier = setQualifier(queryParams);
    queryString += `${qualifier} properties.owner_id = $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night * 100}`);
    let qualifier = setQualifier(queryParams);
    queryString += `${qualifier} properties.cost_per_night >= $${queryParams.length} `;
  }
  
  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night * 100}`);
    let qualifier = setQualifier(queryParams);
    queryString += `${qualifier} properties.cost_per_night <= $${queryParams.length} `;
  }

  
  queryString += `
  GROUP BY properties.id `;
  
  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length}`;
  }
  
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  console.log(queryString, queryParams);

  return pool
    .query(queryString, queryParams)
    .then(result => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
      return err.message;
    });
};


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {

  const queryParams = [];
  const queryKeys = [];

  // const queryString = `INSERT INTO properties`

  for (const key in property) {
    queryKeys.push(key);
    queryParams.push(property[key]);
  }

  const queryString = `
  INSERT INTO properties (${queryKeys.join(", ")})
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *`;

  return pool
    .query(queryString, queryParams)
    .then(result => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err);
      return err.message;
    });
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
