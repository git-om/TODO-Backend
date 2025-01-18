const { error } = require('console');
const prisma = require('../prisma/prisma');
const bcrypt = require('bcrypt');
const { userInfo } = require('os');
const { __TypeKind } = require('graphql');
const jwt = require('jsonwebtoken');
const secret = "This is secret key"

const resolvers = {
  Query: {
    getUsers: async () => prisma.user.findMany({ include: { todos: true } }),
    getUser: async (_,__, { userId }) =>{
      if (!userId) {
        throw new Error("Unauthorized access. Please log in.");
      }
      return prisma.user.findUnique({ where: { id: userId }, include: { todos: true } })
    },
      
  },
  Mutation: {
    createUser: async (_, { name, email, password }) => prisma.user.create({ data: { name, email, password } }),
    addTodo: async (_, { userId, task }) => prisma.todo.create({ data: { task, user: { connect: { id: userId } } } }),

    markTodo: async (_, { todoId }) => {
      const todo = await prisma.todo.findUnique({
        where: { id: todoId },
      });
    
      if (!todo) {
        throw new Error("Todo not found");
      }
    
      return prisma.todo.update({
        where: { id: todoId },
        data: { isDone: !todo.isDone }, // Toggle isDone
      });
    },
    
    signUpUser: async (_, { name, email, password }) => {
      // Check if the user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
    
      if (existingUser) {
        throw new Error("User already exists");
      }
    
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10); // Use a higher salt rounds value (e.g., 10) for better security
    
      // Create a new user
      const newUser = await prisma.user.create({
        data: { name, email, password: hashedPassword },
      });

      const token = jwt.sign({userId: newUser.id}, secret);
      return {token};
        },

    signInUser: async (_, { email, password } ) =>{
      const user = await prisma.user.findUnique({ where: { email } });
      if(!user){
        throw new Error("User not exist!");
      }
      if(!bcrypt.compareSync(password, user.password)){
        throw new Error("Password Incorrect");
      }
      const token = jwt.sign({userId: user.id}, secret);
      return {token};
    },
    
    createTodo: async (_, { task }, { userId }) => {
      if (!userId) {
        throw new Error("Unauthorized access. Please log in.");
      }
      const todo = await prisma.todo.create({
        data: {
          task,
          user: { connect: { id: userId } },
        },
      });
      return "Todo saved successfully!";
    },

    deleteTodo: async(_, { id })=>{
      const deleted = await prisma.todo.delete({where:{id}});
      return "todo deleted";
    },

    deleteUsersTodos: async(_,__)=>{
      await prisma.todo.deleteMany({});
    // Delete all users
    const deletedUsers = await prisma.user.deleteMany({});
    return "deleted"
    },
    
    
  },
  User: {
    todos: async (parent) => prisma.todo.findMany({ where: { userId: parent.id } }),
  },
  Todo: {
    user: async (parent) => prisma.user.findUnique({ where: { id: parent.userId } }),
  },
};

module.exports = resolvers;
