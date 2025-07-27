# Replicax - A lightweight, zero dependices, middleware, auto-reload support,  HTTP server framework


![Node.js Version](https://img.shields.io/badge/Node.js-18+-green.svg)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
## Installation 
```bash
npm i replicax --save
```

## 📚 Table of Contents

1. [🚀 Usage](#-usage)
2. [🔄 Auto Reload](#-auto-reload)
3. [📡 HTTP Methods](#-http-methods)
4. [🔑 Middleware](#-middleware)
5. [🔒 Ready for Production (HTTPS)](#-ready-for-production-https)
6. [🐞 Issues](#-issues)
7. [🤝 Author](#-author)
---


## 1 🚀 Usage <a name="-usage"></a>

```javascript
const { replicax } = require('replicax');
const app = replicax();

// Simple GET route
app.get('/', (req, res) => {
  res.json({ message: 'Hello from Replicax!' });
});

// Route with parameters
app.get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```
---
## 2 🔄 Auto Reload <a name="-auto-reload"></a>
```json
// package.json
"scripts": {
    "start": "replicax index.js"
  },
```
#### [`/lib/watch.js`](./lib/watch.js) - File watcher that automatically restarts your server when `index.js` files change of your main project,  with debouncing to avoid rapid restarts, ignores _node_modules_
---
## 3 📡 HTTP Methods <a name="-http-methods"></a>

### GET
```javascript
app.get('/users', (req, res) => {
  res.json({ users: getAllUsers() });
});
```
---
### POST
```javascript
app.post('/users', async (req, res) => {
  const newUser = createUser(req.body);
  res.status(201).json(newUser);
});
```
---
### PUT
```javascript
app.put('/users/:id', (req, res) => {
  updateUser(req.params.id, req.body);
  res.json({ success: true });
});
```

### PATCH
```javascript
app.patch('/users/:id', (req, res) => {
  partiallyUpdateUser(req.params.id, req.body);
  res.json({ updated: true });
});
```
---
### DELETE
```javascript
app.delete('/users/:id', (req, res) => {
  deleteUser(req.params.id);
  res.status(204).end();
});
```
### Route Chaining
```javascript
app.route('/articles/:id')
  .get((req, res) => res.json(getArticle(req.params.id)))
  .put((req, res) => res.json(updateArticle(req.params.id, req.body)))
  .delete((req, res) => res.status(204).end());
```
---
### 4 🔑 Middleware <a name="-middleware"></a>
```javascript
// Authentication middleware
app.use('/admin', (req, res, next) => {
  if (req.headers.authorization === 'secret') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});
```
### custom
```js
// define middleware
const authMiddleware = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// use any where or a particular route
app.get('/protected', authMiddleware, (req, res) => {
  res.json({ data: 'Secret data' });
});
```
---

### 5 🔒 Ready for Production (HTTPS) <a name="-ready-for-production-https"></a>

```js
const fs = require('fs');
const { replicax } = require('replicax');

const app = replicax();

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

app.listen(443, () => {
  console.log('HTTPS server running');
}, { https: true, httpsOptions: options });
```
---
# 🤝 Author <a name="-author"></a>

## GitHub: [@w3cdpass](https://github.com/w3cdpass)

## email : [kupasva663@gmail.com](mailto:kupasva663@gmail.com)