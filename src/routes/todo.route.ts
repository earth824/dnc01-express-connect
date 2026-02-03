import express from 'express';
import { todoController } from '../controllers/todo.controller.js';

export const todoRouter = express.Router();

todoRouter.get('/', todoController.getAllTodos);
todoRouter.post('/', todoController.createTodo);
todoRouter.put('/:id', todoController.updateTodo);
todoRouter.delete('/:id', todoController.deleteTodo);
