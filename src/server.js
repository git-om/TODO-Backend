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
    // Extract the Authorization header
    const authorization = req.headers.authorization;

    if (authorization) {
      try {
        // Verify the token and extract the payload
        const token = authorization.replace("Bearer ", ""); // Remove "Bearer " prefix if present
        const decodedToken = jwt.verify(token, secret);

        // If valid, return the user ID in the context
        return { userId: decodedToken.userId };
      } catch (error) {
        console.error("Invalid token:", error.message);

        // Throw an authentication error for invalid tokens
        throw new Error("Authentication failed: Invalid or expired token.");
      }
    }

    // If no Authorization header, return empty context (or handle accordingly)
    console.warn("No Authorization header provided.");
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
