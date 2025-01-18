const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const resolvers = require('./graphql/resolvers');
const fs = require('fs');
const path = require('path');
const jwt = require("jsonwebtoken"); 
const secret = "This is secret key"


// Read GraphQL schema
const typeDefs = fs.readFileSync(path.join(__dirname, 'graphql/schema.graphql'), 'utf8');

// Create executable schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Initialize Apollo Server
const server = new ApolloServer({
  schema,
  context: ({ req }) => {
    const authorization = req.headers.authorization; // Correctly access the authorization header

    if (authorization) {
      try {
        const { userId } = jwt.verify(authorization, secret);
        return { userId };
      } catch (error) {
        console.error("Invalid token:", error.message);
        throw new Error("Authentication failed: Invalid token.");
      }
    }

    // Optionally return default context if no authorization is provided
    return {};
  },
});

// Initialize Express
const app = express();

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });

  const PORT = 4000;
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();
