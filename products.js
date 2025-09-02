const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// Middleware para validar dados do produto
const validateProduct = (req, res, next) => {
  const { nome, preco } = req.body;
  
  if (!nome || nome.trim().length === 0) {
    return res.status(400).json({ error: 'Nome do produto é obrigatório' });
  }
  
  if (!preco || isNaN(parseFloat(preco)) || parseFloat(preco) <= 0) {
    return res.status(400).json({ error: 'Preço deve ser um número válido maior que zero' });
  }
  
  next();
};

// GET - Listar todos os produtos com paginação e filtros
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 10, categoria, search } = req.query;
    const products = Product.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      categoria,
      search
    });
    
    res.json({
      data: products.data,
      pagination: {
        current_page: products.page,
        per_page: products.limit,
        total: products.total,
        total_pages: Math.ceil(products.total / products.limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Criar novo produto
router.post('/', validateProduct, (req, res) => {
  try {
    const { nome, preco, descricao, categoria, imagem } = req.body;
    
    const newProduct = Product.create({
      nome: nome.trim(),
      preco: parseFloat(preco),
      descricao: descricao ? descricao.trim() : '',
      categoria: categoria || 'Geral',
      imagem: imagem || ''
    });

    res.status(201).json({
      message: 'Produto criado com sucesso',
      data: newProduct
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET - Buscar produto por ID
router.get('/:id', (req, res) => {
  try {
    const product = Product.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json({ data: product });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT - Atualizar produto
router.put('/:id', validateProduct, (req, res) => {
  try {
    const { nome, preco, descricao, categoria, imagem } = req.body;
    
    const updatedProduct = Product.updateById(req.params.id, {
      nome: nome.trim(),
      preco: parseFloat(preco),
      descricao: descricao ? descricao.trim() : '',
      categoria: categoria || 'Geral',
      imagem: imagem || ''
    });
    
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json({
      message: 'Produto atualizado com sucesso',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE - Deletar produto
router.delete('/:id', (req, res) => {
  try {
    const deleted = Product.deleteById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;