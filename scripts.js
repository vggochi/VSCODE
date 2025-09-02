// Configurações da API
        const API_BASE_URL = 'http://localhost:3000/api';

        // Elementos do DOM
        const productForm = document.getElementById('productForm');
        const productsGrid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        const productsLoading = document.getElementById('productsLoading');
        const refreshButton = document.getElementById('refreshProducts');
        const clearButton = document.getElementById('clearForm');
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const submitText = document.getElementById('submitText');

        // Função para mostrar toast
        function showToast(message, type = 'success') {
            const toastEl = document.getElementById('toast');
            toastMessage.textContent = message;
            
            // Remover classes de cor anteriores
            toastEl.firstElementChild.classList.remove('bg-green-500', 'bg-red-500', 'bg-yellow-500');
            
            // Adicionar cor baseada no tipo
            if (type === 'error') {
                toastEl.firstElementChild.classList.add('bg-red-500');
            } else if (type === 'warning') {
                toastEl.firstElementChild.classList.add('bg-yellow-500');
            } else {
                toastEl.firstElementChild.classList.add('bg-green-500');
            }
            
            toastEl.classList.remove('hidden');
            
            setTimeout(() => {
                toastEl.classList.add('hidden');
            }, 3000);
        }

        // Função para processar URL de imagem do Google Drive
        function processImageUrl(url) {
            if (!url) return '';

            if (url.includes('drive.google.com')) {
                let fileId = null;
                
                // Formato 1: /file/d/ID/view
                let match = url.match(/file\/d\/([a-zA-Z0-9_-]+)/);
                if (match) {
                    fileId = match[1];
                }
                
                // Formato 2: id=ID (parâmetros)
                if (!fileId) {
                    match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                    if (match) {
                        fileId = match[1];
                    }
                }
                
                if (fileId) {
                    // Retorna a URL no formato do googleusercontent
                    return `https://lh3.googleusercontent.com/d/${fileId}`;
                }
            }
            
            return url;
        }

        // Função para criar card de produto
        function createProductCard(product) {
            const imageUrl = processImageUrl(product.imagem);
            const imageElement = imageUrl ? 
                `<img 
                    src="${imageUrl}" 
                    alt="${product.nome}" 
                    class="w-full h-48 product-image"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
                >` : '';
            
            const imagePlaceholder = `
                <div class="w-full h-48 image-placeholder" style="display:${imageUrl ? 'none' : 'flex'}">
                    📦
                </div>`;
            
            return `
                <div class="bg-white rounded-lg shadow-md overflow-hidden card-hover">
                    <div class="relative">
                        ${imageElement}
                        ${imagePlaceholder}
                        <div class="absolute top-2 right-2">
                            <span class="bg-white bg-opacity-90 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">
                                ${product.categoria}
                            </span>
                        </div>
                    </div>
                    
                    <div class="p-4">
                        <div class="mb-3">
                            <h3 class="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
                                ${product.nome}
                            </h3>
                            <div class="text-2xl font-bold text-green-600">
                                R$ ${parseFloat(product.preco).toFixed(2).replace('.', ',')}
                            </div>
                        </div>
                        
                        ${product.descricao ? `
                            <p class="text-gray-600 text-sm mb-4 line-clamp-3">
                                ${product.descricao}
                            </p>
                        ` : ''}
                        
                        <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                            <small class="text-gray-500">
                                ${new Date(product.createdAt).toLocaleDateString('pt-BR')}
                            </small>
                            <div class="flex gap-2">
                                <button 
                                    onclick="editProduct('${product.id}')"
                                    class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition duration-200"
                                    title="Editar produto"
                                >
                                    ✏️
                                </button>
                                <button 
                                    onclick="deleteProduct('${product.id}')"
                                    class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition duration-200"
                                    title="Excluir produto"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Função para carregar produtos
        async function loadProducts() {
            try {
                productsLoading.classList.remove('hidden');
                emptyState.classList.add('hidden');
                
                const response = await fetch(`${API_BASE_URL}/products`);
                
                if (!response.ok) {
                    throw new Error('Erro ao carregar produtos');
                }
                
                const result = await response.json();
                const products = result.data || result; // Suporta tanto formato novo quanto antigo
                
                productsGrid.innerHTML = '';
                
                if (products.length === 0) {
                    emptyState.classList.remove('hidden');
                } else {
                    products.forEach(product => {
                        productsGrid.innerHTML += createProductCard(product);
                    });
                }
                
            } catch (error) {
                console.error('Erro ao carregar produtos:', error);
                showToast('Erro ao carregar produtos. Verifique se o servidor está rodando.', 'error');
                emptyState.classList.remove('hidden');
            } finally {
                productsLoading.classList.add('hidden');
            }
        }

        // Função para validar URL da imagem
        function validateImageUrl(url) {
            if (!url) return true; // URL vazia é permitida
            
            // Adapta a validação para aceitar URLs do Google Drive
            if (url.includes('drive.google.com')) {
                return true;
            }

            const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
            return urlPattern.test(url);
        }
        
        // Função para cadastrar produto
        async function createProduct(productData) {
            try {
                // Validar URL da imagem
                if (productData.imagem && !validateImageUrl(productData.imagem)) {
                    showToast('URL da imagem inválida. Use formatos JPG, PNG, GIF, WebP ou SVG.', 'error');
                    return;
                }
                
                loadingSpinner.classList.add('show');
                submitText.textContent = 'Cadastrando...';
                
                const response = await fetch(`${API_BASE_URL}/products`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(productData)
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Erro ao cadastrar produto');
                }
                
                const result = await response.json();
                showToast(result.message || 'Produto cadastrado com sucesso!');
                productForm.reset();
                loadProducts(); // Recarregar a lista
                
            } catch (error) {
                console.error('Erro ao cadastrar produto:', error);
                showToast(error.message || 'Erro ao cadastrar produto. Verifique se o servidor está rodando.', 'error');
            } finally {
                loadingSpinner.classList.remove('show');
                submitText.textContent = 'Cadastrar Produto';
            }
        }

        // Função para editar produto
        async function editProduct(productId) {
            try {
                const response = await fetch(`${API_BASE_URL}/products/${productId}`);
                if (!response.ok) throw new Error('Produto não encontrado');
                
                const result = await response.json();
                const product = result.data || result;
                
                // Preencher formulário com dados do produto
                document.getElementById('nome').value = product.nome;
                document.getElementById('preco').value = product.preco;
                document.getElementById('categoria').value = product.categoria;
                document.getElementById('imagem').value = product.imagem ? processImageUrl(product.imagem) : '';
                document.getElementById('descricao').value = product.descricao || '';
                
                // Mudar texto do botão para indicar edição
                submitText.textContent = 'Atualizar Produto';
                productForm.dataset.editing = productId;
                
                // Scroll para o formulário
                document.querySelector('.bg-white.rounded-lg.shadow-lg').scrollIntoView({ 
                    behavior: 'smooth' 
                });
                
            } catch (error) {
                console.error('Erro ao carregar produto para edição:', error);
                showToast('Erro ao carregar produto para edição', 'error');
            }
        }
        
        // Função para excluir produto
        async function deleteProduct(productId) {
            if (!confirm('Tem certeza que deseja excluir este produto?')) {
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Erro ao excluir produto');
                }
                
                const result = await response.json();
                showToast(result.message || 'Produto excluído com sucesso!');
                loadProducts(); // Recarregar a lista
                
            } catch (error) {
                console.error('Erro ao excluir produto:', error);
                showToast(error.message || 'Erro ao excluir produto', 'error');
            }
        }

        // Event listeners
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(productForm);
            const productData = {
                nome: formData.get('nome'),
                preco: parseFloat(formData.get('preco')),
                descricao: formData.get('descricao'),
                categoria: formData.get('categoria'),
                imagem: formData.get('imagem')
            };
            
            const isEditing = productForm.dataset.editing;
            
            if (isEditing) {
                // Atualizar produto existente
                try {
                    // Validar URL da imagem
                    if (productData.imagem && !validateImageUrl(productData.imagem)) {
                        showToast('URL da imagem inválida. Use formatos JPG, PNG, GIF, WebP ou SVG.', 'error');
                        return;
                    }
                    
                    loadingSpinner.classList.add('show');
                    submitText.textContent = 'Atualizando...';
                    
                    const response = await fetch(`${API_BASE_URL}/products/${isEditing}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(productData)
                    });
                    
                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'Erro ao atualizar produto');
                    }
                    
                    const result = await response.json();
                    showToast(result.message || 'Produto atualizado com sucesso!');
                    productForm.reset();
                    delete productForm.dataset.editing;
                    submitText.textContent = 'Cadastrar Produto';
                    loadProducts();
                    
                } catch (error) {
                    console.error('Erro ao atualizar produto:', error);
                    showToast(error.message || 'Erro ao atualizar produto', 'error');
                } finally {
                    loadingSpinner.classList.remove('show');
                    if (productForm.dataset.editing) {
                        submitText.textContent = 'Atualizar Produto';
                    } else {
                        submitText.textContent = 'Cadastrar Produto';
                    }
                }
            } else {
                // Criar novo produto
                await createProduct(productData);
            }
        });

        clearButton.addEventListener('click', () => {
            productForm.reset();
            delete productForm.dataset.editing;
            submitText.textContent = 'Cadastrar Produto';
        });

        refreshButton.addEventListener('click', loadProducts);

        // Carregar produtos ao inicializar a página
        document.addEventListener('DOMContentLoaded', loadProducts);

        // Tornar funções globais para usar nos cards
        window.deleteProduct = deleteProduct;
        window.editProduct = editProduct;