import type { RequestHandler } from 'express';
import { prisma } from '../db/prisma.js';

const getAllTodos: RequestHandler = async (req, res) => {
  const todos = await prisma.todo.findMany();
  res.json({ todos });
};

const createTodo: RequestHandler = async (req, res) => {
  const { title } = req.body;
  const todo = await prisma.todo.create({ data: { title } });
  res.status(201).json({ todo });
};

const updateTodo: RequestHandler = async (req, res) => {};

const deleteTodo: RequestHandler = async (req, res) => {};

export const todoController = {
  getAllTodos,
  createTodo,
  updateTodo,
  deleteTodo
};
