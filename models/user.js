/** User class for message.ly */

const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");


/** User of the site. */

class User {
  constructor({username, password, first_name, last_name, phone, join_at, last_login_at}) {
    this.username = username;
    this.password = password;
    this.first_name = first_name;
    this.last_name = last_name;
    this.phone = phone;
    this.join_at = join_at;
    this.last_login_at = last_login_at;
    // this.fullName = this.getFullName();
  }

  // getFullName = ()  => {
  //   return `${this.first_name} ${this.last_name}`
  // }

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
             VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
             RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );
    return result.rows[0];
   }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    const result = await db.query(
      `SELECT password FROM users WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];

    if(user) return await bcrypt.compare(password, user.password)
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const result = await db.query(`UPDATE users SET last_login_at=current_timestamp WHERE username=$2`,
    [username])
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const results = await db.query(
      `SELECT username, 
         first_name,  
         last_name, 
         phone
       FROM users`
    );
    return results.rows.map(c => new User(c));
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(
      `SELECT 
         username, 
         first_name,  
         last_name, 
         phone,
         join_at,
         last_login_at
        FROM users WHERE username = $1`,
      [username]
    );

    const user = results.rows[0];

    if (user === undefined) {
      const err = new Error(`No such user: ${id}`);
      err.status = 404;
      throw err;
    }

    return new User(user);
   }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    const result = await db.query(
      `SELECT m.id,
              m.to_username AS username,
              t.first_name AS first_name,
              t.last_name AS last_name,
              t.phone AS phone,
              m.body,
              m.sent_at,
              m.read_at
        FROM messages AS m
          JOIN users AS t ON m.to_username = username
        WHERE m.from_username = $1`,
      [username]);
    
  let messages = result.rows.map(m => ({
    id: m.id,
    to_user: {
      username: m.username, 
      first_name: m.first_name, 
      last_name: m.last_name, 
      phone: m.phone},
    body: m.body,
    sent_at: m.sent_at,
    read_at: m.read_at
    }));
  
  if (!messages) {
    throw new ExpressError(`No messages from user: ${username}`, 404);
  }
  return messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    const result = await db.query(
      `SELECT m.id,
              m.from_username AS username,
              f.first_name AS first_name,
              f.last_name AS last_name,
              f.phone AS phone,
              m.body,
              m.sent_at,
              m.read_at
        FROM messages AS m
          JOIN users AS f ON m.from_username = username
        WHERE m.to_username = $1`,
      [username]);

      let messages = result.rows.map(m => ({
        id: m.id,
        from_user: {
          username: m.username, 
          first_name: m.first_name, 
          last_name: m.last_name, 
          phone: m.phone},
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at
        }));

  if (!messages) {
    throw new ExpressError(`No messages from user: ${username}`, 404);
  }
  return messages;
  }
}


module.exports = User;