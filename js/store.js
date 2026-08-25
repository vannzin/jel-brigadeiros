/**
 * Gerenciamento de Estado e Armazenamento (Local Database)
 */

class Store {
  constructor() {
    this.STORAGE_KEY = "jel_doces_store_v1";
    this.listeners = [];
    this.cart = [];
    this.init();
  }

  init() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
      this.save();
    } else {
      try {
        this.data = JSON.parse(stored);
        // Garantir integridade de campos se vier de versão anterior
        if (!this.data.settings) this.data.settings = INITIAL_DATA.settings;
        if (this.data.settings.storeName === "JeL Doces & Confeitaria" || !this.data.settings.storeName) {
          this.data.settings.storeName = "J&L Brigadeiros";
        }
        if (!this.data.settings.whatsappNumber || this.data.settings.whatsappNumber === "5511999999999") {
          this.data.settings.whatsappNumber = "5531992535455";
        }
        if (!this.data.settings.pixKey || this.data.settings.pixKey === "jl.brigadeiros@exemplo.com") {
          this.data.settings.pixKey = "31992535455";
          this.data.settings.pixKeyType = "Celular / WhatsApp";
        }
        if (!this.data.settings.instagramUrl) {
          this.data.settings.instagramUrl = "https://www.instagram.com/_brigadeiroos/";
          this.data.settings.instagramHandle = "@_brigadeiroos";
        }
        if (!this.data.products) this.data.products = INITIAL_DATA.products;
        // Atualizar imagens dos produtos para fotos locais
        const prod1 = (this.data.products || []).find(p => p.id === "prod-1");
        if (prod1) {
          prod1.image = "img/brigadeiro_tradicional.jpg";
          prod1.description = INITIAL_DATA.products.find(p => p.id === "prod-1").description;
          prod1.maxFlavors = INITIAL_DATA.products.find(p => p.id === "prod-1").maxFlavors;
          prod1.maxFlavorsByQty = INITIAL_DATA.products.find(p => p.id === "prod-1").maxFlavorsByQty;
          prod1.availableFlavors = INITIAL_DATA.products.find(p => p.id === "prod-1").availableFlavors;
        }
        const prod2 = (this.data.products || []).find(p => p.id === "prod-2");
        if (prod2) {
          prod2.name = INITIAL_DATA.products.find(p => p.id === "prod-2").name;
          prod2.image = "img/brigadeiro_especial.jpg";
          prod2.description = INITIAL_DATA.products.find(p => p.id === "prod-2").description;
          prod2.badge = INITIAL_DATA.products.find(p => p.id === "prod-2").badge;
          prod2.availableFlavors = INITIAL_DATA.products.find(p => p.id === "prod-2").availableFlavors;
        }
        const prod3 = (this.data.products || []).find(p => p.id === "prod-3");
        if (prod3) {
          if (!prod3.image || prod3.image.includes("unsplash")) prod3.image = "img/brigadeiro_tematico.jpg";
          prod3.description = INITIAL_DATA.products.find(p => p.id === "prod-3").description;
          prod3.maxFlavors = INITIAL_DATA.products.find(p => p.id === "prod-3").maxFlavors;
          prod3.availableFlavors = INITIAL_DATA.products.find(p => p.id === "prod-3").availableFlavors;
        }
        const prod4 = (this.data.products || []).find(p => p.id === "prod-4");
        if (prod4) {
          if (!prod4.image || prod4.image.includes("unsplash")) prod4.image = "img/doces_carimbo.jpg";
          prod4.description = INITIAL_DATA.products.find(p => p.id === "prod-4").description;
          prod4.availableFlavors = INITIAL_DATA.products.find(p => p.id === "prod-4").availableFlavors;
          prod4.hasStamp = false;
          prod4.availableStamps = [];
        }
        if (!this.data.sampleOrders && !this.data.orders) this.data.orders = INITIAL_DATA.sampleOrders;
        if (!this.data.orders) this.data.orders = this.data.sampleOrders || [];
      } catch (e) {
        console.error("Erro ao carregar dados locais, reiniciando:", e);
        this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
        this.save();
      }
    }

    // Carregar carrinho temporário da sessão
    const savedCart = sessionStorage.getItem("jel_cart");
    if (savedCart) {
      try {
        this.cart = JSON.parse(savedCart);
      } catch (e) {
        this.cart = [];
      }
    }
  }

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    this.notify();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb(this.data));
  }

  // --- MÉTODOS DE PRODUTOS ---
  getProducts() {
    return this.data.products.filter(p => p.active !== false);
  }

  getAllProductsAdmin() {
    return this.data.products;
  }

  getProductById(id) {
    return this.data.products.find(p => p.id === id);
  }

  updateProduct(product) {
    const index = this.data.products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      this.data.products[index] = { ...this.data.products[index], ...product };
      this.save();
      return true;
    }
    return false;
  }

  addProduct(product) {
    const newProduct = {
      ...product,
      id: "prod-" + Date.now(),
      active: true
    };
    this.data.products.push(newProduct);
    this.save();
    return newProduct;
  }

  deleteProduct(productId) {
    this.data.products = this.data.products.filter(p => p.id !== productId);
    this.save();
  }

  // --- MÉTODOS DE PEDIDOS (ENCOMENDAS) ---
  getOrders() {
    return (this.data.orders || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getOrderById(orderId) {
    return (this.data.orders || []).find(o => o.id === orderId);
  }

  createOrder(orderData) {
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const newOrder = {
      id: `JEL-${randomCode}`,
      status: "pendente",
      paymentStatus: "pendente",
      createdAt: new Date().toISOString(),
      ...orderData
    };

    if (!this.data.orders) this.data.orders = [];
    this.data.orders.unshift(newOrder);
    this.save();
    
    // Limpa o carrinho após fechar pedido
    this.clearCart();
    return newOrder;
  }

  updateOrderStatus(orderId, newStatus) {
    const order = this.getOrderById(orderId);
    if (order) {
      order.status = newStatus;
      this.save();
      return true;
    }
    return false;
  }

  updateOrderPayment(orderId, paymentStatus) {
    const order = this.getOrderById(orderId);
    if (order) {
      order.paymentStatus = paymentStatus;
      this.save();
      return true;
    }
    return false;
  }

  updateOrderUberTracking(orderId, uberTrackingUrl) {
    const order = this.getOrderById(orderId);
    if (order) {
      order.uberTrackingUrl = uberTrackingUrl ? uberTrackingUrl.trim() : null;
      this.save();
      this.notify();
      return true;
    }
    return false;
  }

  deleteOrder(orderId) {
    this.data.orders = (this.data.orders || []).filter(o => o.id !== orderId);
    this.save();
  }

  // --- MÉTODOS DE CARRINHO ---
  getCart() {
    return this.cart;
  }

  addToCart(item) {
    // Cada item no carrinho pode ter sabores ou notas personalizadas únicas
    const cartItemId = "cart-item-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
    this.cart.push({
      cartItemId,
      ...item
    });
    this.saveCart();
    return this.cart;
  }

  removeFromCart(cartItemId) {
    this.cart = this.cart.filter(item => item.cartItemId !== cartItemId);
    this.saveCart();
    return this.cart;
  }

  updateCartItemQty(cartItemId, newQty) {
    const item = this.cart.find(i => i.cartItemId === cartItemId);
    if (item) {
      item.quantity = newQty;
      // Recalcula o preço proporcional de 50/100
      const product = this.getProductById(item.productId);
      if (product) {
        if (newQty === 50) item.unitPrice = product.pricing[50];
        else if (newQty === 100) item.unitPrice = product.pricing[100];
        else {
          // múltiplos
          const hundreds = Math.floor(newQty / 100);
          const remainder50 = (newQty % 100) >= 50 ? 1 : 0;
          item.unitPrice = (hundreds * product.pricing[100]) + (remainder50 * product.pricing[50]);
        }
      }
      this.saveCart();
    }
    return this.cart;
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
  }

  saveCart() {
    sessionStorage.setItem("jel_cart", JSON.stringify(this.cart));
  }

  getCartTotal() {
    return this.cart.reduce((sum, item) => sum + (item.unitPrice || 0), 0);
  }

  getCartCount() {
    return this.cart.length;
  }

  // --- CONFIGURAÇÕES DA LOJA ---
  getSettings() {
    return this.data.settings || INITIAL_DATA.settings;
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
  }

  // --- ESTATÍSTICAS PARA O PAINEL ADMINISTRATIVO ---
  getStatistics() {
    const orders = this.data.orders || [];
    const validOrders = orders.filter(o => o.status !== "cancelado");

    const totalOrders = orders.length;
    const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const averageTicket = validOrders.length > 0 ? (totalRevenue / validOrders.length) : 0;

    const pendingOrders = orders.filter(o => o.status === "pendente").length;
    const inProductionOrders = orders.filter(o => o.status === "producao").length;
    const readyOrders = orders.filter(o => o.status === "pronto").length;
    const completedOrders = orders.filter(o => o.status === "finalizado").length;

    // Vendas por produto
    const productSales = {};
    orders.forEach(order => {
      if (order.status !== "cancelado") {
        (order.items || []).forEach(item => {
          if (!productSales[item.productName]) {
            productSales[item.productName] = { units: 0, revenue: 0 };
          }
          productSales[item.productName].units += item.quantity || 0;
          productSales[item.productName].revenue += item.unitPrice || 0;
        });
      }
    });

    return {
      totalOrders,
      totalRevenue,
      averageTicket,
      pendingOrders,
      inProductionOrders,
      readyOrders,
      completedOrders,
      productSales
    };
  }

  // --- FEEDBACKS, DICAS E RECLAMAÇÕES ---
  getFeedbacks() {
    return this.data.feedbacks || [];
  }

  addFeedback(feedback) {
    if (!this.data.feedbacks) this.data.feedbacks = [];
    const newFeedback = {
      id: "FB-" + Math.floor(1000 + Math.random() * 9000),
      createdAt: new Date().toISOString(),
      ...feedback
    };
    this.data.feedbacks.unshift(newFeedback);
    this.save();
    this.notify();
    return newFeedback;
  }

  deleteFeedback(id) {
    if (!this.data.feedbacks) return;
    this.data.feedbacks = this.data.feedbacks.filter(f => f.id !== id);
    this.save();
    this.notify();
  }

  // --- BACKUP E RESTAURAÇÃO ---
  exportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.data, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `backup_jel_doces_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importBackup(jsonData) {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.products && parsed.settings) {
        this.data = parsed;
        this.save();
        return true;
      }
    } catch (e) {
      console.error("Erro na importação:", e);
    }
    return false;
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.save();
    this.clearCart();
  }
}

// Instância global para acesso facilitado
window.store = new Store();
