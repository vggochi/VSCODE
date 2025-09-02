// Importa o módulo 'fs' (File System) do Node.js para interagir com o sistema de arquivos.
const fs = require('fs');
// Importa o módulo 'path' do Node.js para trabalhar com caminhos de arquivos e diretórios.
const path = require('path');

// Constrói o caminho absoluto para o arquivo JSON que serve como nosso "banco de dados".
const dataPath = path.join(__dirname, '../data/products.json');

// A classe 'Product' encapsula toda a lógica de manipulação dos dados de produtos.
// Isso é conhecido como um "Model", que representa a estrutura dos dados e as operações sobre eles.
class Product {

  /**
   * Busca todos os produtos, aplicando filtros, ordenação e paginação.
   * @param {object} options - Opções para filtrar, ordenar e paginar os resultados.
   * @param {string} options.categoria - Filtra produtos por uma categoria específica.
   * @param {string} options.search - Filtra produtos por um termo de busca no nome ou descrição.
   * @param {number} options.page - O número da página para a paginação.
   * @param {number} options.limit - O número de itens por página.
   * @returns {object} - Um objeto contendo os dados dos produtos, total de itens e informações de paginação.
   */
  static getAll(options = {}) {
    try {
      // Lê o arquivo de produtos de forma síncrona.
      const data = fs.readFileSync(dataPath, 'utf8');
      // Converte o conteúdo JSON do arquivo para um array de objetos JavaScript.
      let products = JSON.parse(data);
      
      // --- Aplica filtros ---
      if (options.categoria) {
        // Filtra o array de produtos, mantendo apenas aqueles cuja categoria corresponde à opção fornecida.
        products = products.filter(p => 
          p.categoria.toLowerCase().includes(options.categoria.toLowerCase())
        );
      }
      
      if (options.search) {
        // Filtra o array de produtos, mantendo aqueles cujo nome ou descrição contém o termo de busca.
        products = products.filter(p => 
          p.nome.toLowerCase().includes(options.search.toLowerCase()) ||
          (p.descricao && p.descricao.toLowerCase().includes(options.search.toLowerCase()))
        );
      }
      
      // --- Ordena os produtos ---
      // Ordena por data de criação, colocando os mais recentes primeiro.
      products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // --- Aplica paginação ---
      const page = options.page || 1; // Página padrão é 1.
      const limit = options.limit || 10; // Limite padrão de 10 itens por página.
      const startIndex = (page - 1) * limit; // Calcula o índice inicial.
      const endIndex = startIndex + limit; // Calcula o índice final.
      
      // Retorna um objeto estruturado com os dados paginados e metadados.
      return {
        data: products.slice(startIndex, endIndex), // 'slice' extrai a porção do array para a página atual.
        total: products.length, // O número total de produtos (antes da paginação).
        page,
        limit
      };
    } catch (error) {
      // Se houver um erro (ex: o arquivo não existe), retorna uma estrutura de dados vazia.
      return { data: [], total: 0, page: 1, limit: 10 };
    }
  }

  /**
   * Busca todos os produtos do arquivo JSON sem aplicar filtros, ordenação ou paginação.
   * Este método é usado internamente por outras funções que precisam de todos os dados.
   * @returns {Array} - Um array de todos os produtos.
   */
  static getAllRaw() {
    try {
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // Se o arquivo não existir ou houver um erro de leitura, retorna um array vazio.
      return [];
    }
  }

  /**
   * Salva um array de produtos no arquivo JSON.
   * @param {Array} products - O array de produtos a ser salvo.
   */
  static saveAll(products) {
    // Obtém o diretório onde o arquivo de dados deve ser salvo.
    const dir = path.dirname(dataPath);
    // Verifica se o diretório existe, e se não, o cria recursivamente.
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Escreve o array de produtos no arquivo JSON.
    // JSON.stringify converte o objeto JavaScript para uma string JSON.
    // 'null, 2' formata o JSON com indentação de 2 espaços para melhor legibilidade.
    fs.writeFileSync(dataPath, JSON.stringify(products, null, 2));
  }

  /**
   * Cria um novo produto e o salva no arquivo.
   * @param {object} productData - Os dados do novo produto.
   * @returns {object} - O objeto do novo produto criado, incluindo id e timestamps.
   */
  static create(productData) {
    // Obtém a lista completa de produtos.
    const products = this.getAllRaw();
    // Cria um novo objeto de produto com um ID único e timestamps.
    const newProduct = {
      id: Date.now().toString(), // Usa o timestamp atual como um ID simples e único.
      ...productData, // Copia todas as propriedades de productData para o novo objeto.
      createdAt: new Date().toISOString(), // Define a data de criação.
      updatedAt: new Date().toISOString()  // Define a data de atualização.
    };
    
    // Adiciona o novo produto ao array.
    products.push(newProduct);
    // Salva o array atualizado de volta no arquivo.
    this.saveAll(products);
    
    // Retorna o produto recém-criado.
    return newProduct;
  }

  /**
   * Busca um produto específico pelo seu ID.
   * @param {string} id - O ID do produto a ser encontrado.
   * @returns {object|undefined} - O objeto do produto se encontrado, ou undefined se não.
   */
  static getById(id) {
    const products = this.getAllRaw();
    // Usa o método 'find' para procurar o produto com o ID correspondente.
    return products.find(product => product.id === id);
  }

  /**
   * Atualiza um produto existente pelo seu ID.
   * @param {string} id - O ID do produto a ser atualizado.
   * @param {object} updateData - Os novos dados para atualizar o produto.
   * @returns {object|null} - O objeto do produto atualizado, ou null se o produto não for encontrado.
   */
  static updateById(id, updateData) {
    const products = this.getAllRaw();
    // Encontra o índice do produto no array.
    const index = products.findIndex(product => product.id === id);
    
    // Se o produto não for encontrado, findIndex retorna -1.
    if (index === -1) {
      return null;
    }
    
    // Mescla o produto existente com os novos dados.
    products[index] = {
      ...products[index], // Mantém os dados antigos.
      ...updateData,      // Sobrescreve com os novos dados.
      updatedAt: new Date().toISOString() // Atualiza o timestamp de atualização.
    };
    
    // Salva a lista de produtos atualizada.
    this.saveAll(products);
    // Retorna o produto atualizado.
    return products[index];
  }

  /**
   * Deleta um produto pelo seu ID.
   * @param {string} id - O ID do produto a ser deletado.
   * @returns {boolean} - Retorna true se o produto foi deletado, false caso contrário.
   */
  static deleteById(id) {
    const products = this.getAllRaw();
    const index = products.findIndex(product => product.id === id);
    
    if (index === -1) {
      return false; // Produto não encontrado.
    }
    
    // Remove 1 elemento do array a partir do índice encontrado.
    products.splice(index, 1);
    // Salva a lista de produtos modificada.
    this.saveAll(products);
    
    return true; // Sucesso.
  }

  /**
   * Valida se uma URL de imagem é válida.
   * @param {string} url - A URL a ser validada.
   * @returns {boolean} - Retorna true se a URL for válida, false caso contrário.
   */
  static validateImageUrl(url) {
    // Permite que a URL seja vazia (campo opcional).
    if (!url) return true; 
    
    // Expressão regular para validar a estrutura geral de uma URL.
    const urlPattern = /^(https?:\/\/)([\w.-]+)\.([a-z]{2,})(\S*)?$/i;
    // Expressão regular para verificar se a URL termina com uma extensão de imagem comum.
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    
    // A URL é válida se passar em ambos os testes.
    return urlPattern.test(url) && imageExtensions.test(url);
  }
}

// Exporta a classe Product para que ela possa ser usada em outros arquivos (como nos controllers de rota).
module.exports = Product;
