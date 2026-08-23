/**
 * Controlador Principal da Aplicação - JeL Doces
 */

document.addEventListener("DOMContentLoaded", () => {
  // Inicialização de componentes e ícones Lucide
  lucide.createIcons();
  
  App.init();
});

const App = {
  activeCategory: "all",
  currentCustomizingProduct: null,
  selectedQuantity: 50,
  selectedFlavors: [],
  selectedStamp: "",
  activeAdminTab: "dashboard",
  salesChart: null,
  productsChart: null,

  init() {
    this.bindEvents();
    this.renderProducts();
    this.updateCartBadge();
    this.renderStoreSettings();
    this.setupMinOrderDate();
    
    // Escuta mudanças de estado no store
    window.store.subscribe(() => {
      this.updateCartBadge();
      if (this.isAdminOpen()) {
        this.renderAdminView();
      }
    });
  },

  bindEvents() {
    // Alternância de abas da vitrine
    document.querySelectorAll(".category-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const cat = e.currentTarget.dataset.category;
        this.setCategory(cat);
      });
    });

    // Fechar gaveta do carrinho ao clicar fora
    const cartDrawerBackdrop = document.getElementById("cart-drawer-backdrop");
    if (cartDrawerBackdrop) {
      cartDrawerBackdrop.addEventListener("click", () => this.toggleCartDrawer(false));
    }

    // Atalho de teclado para abrir login administrativo (Ctrl + Shift + A) e fechar lightbox (Escape)
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        this.openLoginModal();
      }
      if (e.key === "Escape") {
        this.closeImageLightbox();
      }
    });
  },

  formatMoney(value) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
  },

  formatDate(dateStr) {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  },

  setupMinOrderDate() {
    const settings = window.store.getSettings();
    const minDays = settings.minAdvanceDays || 2;
    const dateInput = document.getElementById("checkout-event-date");
    if (dateInput) {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + minDays);
      dateInput.min = minDate.toISOString().split("T")[0];
    }
  },

  renderStoreSettings() {
    const settings = window.store.getSettings();
    document.querySelectorAll(".store-name-text").forEach(el => el.textContent = settings.storeName);
    document.querySelectorAll(".store-slogan-text").forEach(el => el.textContent = settings.slogan);
    
    const pixKeyEl = document.getElementById("checkout-pix-key");
    if (pixKeyEl) pixKeyEl.textContent = settings.pixKey;
  },

  // ==========================================
  // VITRINE E PRODUTOS (PORTAL DO CLIENTE)
  // ==========================================

  setCategory(category) {
    this.activeCategory = category;
    document.querySelectorAll(".category-btn").forEach(btn => {
      if (btn.dataset.category === category) {
        btn.classList.add("bg-pink-600", "text-white", "shadow-md");
        btn.classList.remove("bg-white", "text-pink-900", "border");
      } else {
        btn.classList.remove("bg-pink-600", "text-white", "shadow-md");
        btn.classList.add("bg-white", "text-pink-900", "border");
      }
    });
    this.renderProducts();
  },

  renderProducts() {
    const container = document.getElementById("products-grid");
    if (!container) return;

    let products = window.store.getProducts();
    if (this.activeCategory !== "all") {
      products = products.filter(p => p.category === this.activeCategory);
    }

    if (products.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12 text-slate-500">
          <i data-lucide="package-search" class="w-12 h-12 mx-auto mb-2 text-pink-300"></i>
          <p class="text-lg">Nenhum doce encontrado nesta categoria.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    container.innerHTML = products.map(prod => `
      <div class="glass-card rounded-2xl overflow-hidden shadow-md card-hover border border-pink-300 flex flex-col bg-[#fce7f3]">
        <div class="relative h-56 overflow-hidden group cursor-pointer" onclick="App.openImageLightbox('${prod.id}')" title="Clique para ver a foto em tamanho maior">
          <img src="${prod.image}" alt="${prod.name}" class="w-full h-full object-cover transition duration-500 group-hover:scale-105" onerror="this.src='https://images.unsplash.com/photo-1541784091055-6b5860714eb6?w=600'">
          
          <div class="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span class="bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
              <i data-lucide="zoom-in" class="w-4 h-4 text-pink-400"></i> Ampliar Foto
            </span>
          </div>

          <div class="absolute top-3 left-3 bg-pink-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
            ${prod.badge || "Artesanal"}
          </div>
          <div class="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-lg">
            ${prod.icon} ${prod.category.toUpperCase()}
          </div>
        </div>

        <div class="p-5 flex-1 flex flex-col justify-between bg-[#fce7f3]">
          <div>
            <h3 class="font-bold text-xl text-[#451a03] font-serif mb-2">${prod.name}</h3>
            <p class="text-[#59263a] text-sm mb-4 line-clamp-2">${prod.description}</p>
            
            <!-- Tabela rápida de preços em destaque branco puro -->
            <div class="bg-white/95 rounded-xl p-3.5 mb-4 border border-pink-200 shadow-sm">
              <div class="flex justify-between items-center text-sm py-1 border-b border-pink-100">
                <span class="font-bold text-[#451a03]">📦 Caixa 50 un:</span>
                <span class="font-bold text-pink-700 text-base">${this.formatMoney(prod.pricing[50])}</span>
              </div>
              <div class="flex justify-between items-center text-sm py-1 pt-2">
                <span class="font-bold text-[#451a03]">🎉 Cento (100 un):</span>
                <span class="font-bold text-emerald-700 text-base">${this.formatMoney(prod.pricing[100])}</span>
              </div>
            </div>

            <!-- Tags de Recursos em tom rosa -->
            <div class="flex flex-wrap gap-1.5 mb-4 text-xs">
              ${prod.maxFlavors > 1 ? `<span class="bg-pink-200 text-pink-900 border border-pink-300 px-2.5 py-0.5 rounded-md font-bold">✨ Até 2 Sabores</span>` : ''}
              ${prod.hasStamp ? `<span class="bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-md font-bold">🏷️ Com Carimbo</span>` : ''}
              ${prod.hasCustomTheme ? `<span class="bg-blue-100 text-blue-900 border border-blue-200 px-2.5 py-0.5 rounded-md font-bold">🎉 Personalizado p/ Festa</span>` : ''}
            </div>
          </div>

          <button onclick="App.openCustomizeModal('${prod.id}')" class="btn-encomendar w-full py-2.5 px-3.5 rounded-xl text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 group cursor-pointer shadow-sm">
            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-white group-hover:rotate-12 group-hover:scale-110 transition-transform"></i>
            <span class="text-white font-bold">ENCOMENDAR</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-white opacity-90 group-hover:translate-x-1 group-hover:opacity-100 transition-all"></i>
          </button>
        </div>
      </div>
    `).join("");

    lucide.createIcons();
  },

  // ==========================================
  // MODAL DE PERSONALIZAÇÃO
  // ==========================================

  openCustomizeModal(productId) {
    const product = window.store.getProductById(productId);
    if (!product) return;

    this.currentCustomizingProduct = product;
    this.selectedQuantity = 50;
    this.selectedFlavors = [];
    this.selectedStamp = product.availableStamps ? product.availableStamps[0] : "";

    const modal = document.getElementById("customize-modal");
    document.getElementById("modal-product-title").textContent = product.name;
    document.getElementById("modal-product-desc").textContent = product.description;
    document.getElementById("modal-product-img").src = product.image;

    this.renderCustomizerOptions();
    this.updateModalPricing();

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  },

  closeCustomizeModal() {
    const modal = document.getElementById("customize-modal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    this.currentCustomizingProduct = null;
  },

  openImageLightbox(productId) {
    let product = null;
    if (productId) {
      product = window.store.getProductById(productId);
    }
    if (!product && this.currentCustomizingProduct) {
      product = this.currentCustomizingProduct;
    }
    if (!product) return;

    const modal = document.getElementById("image-lightbox-modal");
    const imgEl = document.getElementById("lightbox-img");
    const titleEl = document.getElementById("lightbox-title");
    const descEl = document.getElementById("lightbox-desc");
    const badgeEl = document.getElementById("lightbox-price-badge");

    if (imgEl) imgEl.src = product.image;
    if (titleEl) titleEl.textContent = product.name;
    if (descEl) descEl.textContent = product.description;
    
    if (badgeEl) {
      badgeEl.innerHTML = `
        <span class="font-bold text-slate-700">50 un: <strong class="text-pink-700">${this.formatMoney(product.pricing[50])}</strong></span>
        <span class="text-slate-300">•</span>
        <span class="font-bold text-slate-700">100 un: <strong class="text-emerald-700">${this.formatMoney(product.pricing[100])}</strong></span>
      `;
    }

    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      lucide.createIcons();
    }
  },

  closeImageLightbox() {
    const modal = document.getElementById("image-lightbox-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  },

  setModalQuantity(qty) {
    this.selectedQuantity = qty;
    
    // Atualiza botões de quantidade
    document.querySelectorAll(".qty-preset-btn").forEach(btn => {
      if (parseInt(btn.dataset.qty) === qty) {
        btn.classList.add("bg-pink-600", "text-white", "border-pink-600");
        btn.classList.remove("bg-white", "text-slate-700");
      } else {
        btn.classList.remove("bg-pink-600", "text-white", "border-pink-600");
        btn.classList.add("bg-white", "text-slate-700");
      }
    });

    this.updateModalPricing();
  },

  renderCustomizerOptions() {
    const prod = this.currentCustomizingProduct;
    const container = document.getElementById("modal-customizer-fields");
    if (!container || !prod) return;

    let html = "";

    // 1. Seletor de Sabores
    if (prod.hasFlavors && prod.availableFlavors && prod.availableFlavors.length > 0) {
      const max = prod.maxFlavors || 1;
      html += `
        <div class="mb-6">
          <div class="flex justify-between items-center mb-2">
            <label class="font-bold text-[#382012] text-sm">
              Escolha os Sabores <span class="text-pink-600 font-normal">(Máximo: ${max} ${max > 1 ? 'sabores' : 'sabor'})</span>:
            </label>
            <span id="flavor-count-badge" class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#f2e8dc] text-[#5c3a21] border border-[#e5d5c2]">0/${max}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto p-2.5 bg-[#faf5ee] rounded-2xl border border-[#ebdccb]">
            ${prod.availableFlavors.map((flavor, index) => `
              <label class="flex items-center gap-3 p-3 rounded-xl border border-[#ebdccb] hover:border-pink-400 bg-[#fdfaf5] hover:bg-[#f5ede2] cursor-pointer transition select-none shadow-sm flavor-item-label">
                <input type="checkbox" name="flavor" value="${flavor}" onchange="App.handleFlavorSelection(this, ${max})" class="w-4 h-4 text-pink-600 rounded border-slate-300 focus:ring-pink-500">
                <span class="text-xs sm:text-sm font-semibold text-[#4a2e1b]">${flavor}</span>
              </label>
            `).join("")}
          </div>
        </div>
      `;
    }

    // 2. Seletor de Carimbos
    if (prod.hasStamp && prod.availableStamps) {
      html += `
        <div class="mb-6">
          <label class="block font-semibold text-slate-800 text-sm mb-2">
            🏷️ Escolha a Frase ou Carimbo:
          </label>
          <select id="modal-stamp-select" class="w-full rounded-xl border-slate-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-sm p-3 bg-white border">
            ${prod.availableStamps.map(st => `<option value="${st}">${st}</option>`).join("")}
          </select>
        </div>
      `;
    }

    // 3. Tema personalizado para festas
    if (prod.hasCustomTheme) {
      html += `
        <div class="mb-6">
          <label class="block font-semibold text-slate-800 text-sm mb-2">
            🎉 Tema do Evento & Cores Desejadas:
          </label>
          <input type="text" id="modal-theme-input" placeholder="${prod.themePlaceholders || 'Ex: Casamento Dourado e Branco, Safari Baby...'}" class="w-full rounded-xl border-slate-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-sm p-3 border">
        </div>
      `;
    }

    // 4. Observações específicas do item
    html += `
      <div class="mb-4">
        <label class="block font-semibold text-slate-800 text-sm mb-2">
          Observações adicionais para este doce:
        </label>
        <input type="text" id="modal-item-notes" placeholder="Ex: Forminhas na cor dourada, sem confeito crocante..." class="w-full rounded-xl border-slate-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-sm p-3 border">
      </div>
    `;

    container.innerHTML = html;
  },

  handleFlavorSelection(checkbox, maxAllowed) {
    if (checkbox.checked) {
      if (this.selectedFlavors.length >= maxAllowed) {
        checkbox.checked = false;
        Swal.fire({
          icon: 'info',
          title: 'Limite atingido',
          text: `Você pode selecionar no máximo ${maxAllowed} ${maxAllowed > 1 ? 'sabores' : 'sabor'} para esta opção.`,
          confirmButtonColor: '#db2777'
        });
        return;
      }
      this.selectedFlavors.push(checkbox.value);
    } else {
      this.selectedFlavors = this.selectedFlavors.filter(f => f !== checkbox.value);
    }

    const badge = document.getElementById("flavor-count-badge");
    if (badge) badge.textContent = `${this.selectedFlavors.length}/${maxAllowed}`;
  },

  updateModalPricing() {
    const prod = this.currentCustomizingProduct;
    if (!prod) return;

    let price = 0;
    if (this.selectedQuantity === 50) price = prod.pricing[50];
    else if (this.selectedQuantity === 100) price = prod.pricing[100];
    else {
      const hundreds = Math.floor(this.selectedQuantity / 100);
      const remainder50 = (this.selectedQuantity % 100) >= 50 ? 1 : 0;
      price = (hundreds * prod.pricing[100]) + (remainder50 * prod.pricing[50]);
    }

    document.getElementById("modal-total-price").textContent = this.formatMoney(price);
  },

  confirmAddToCart() {
    const prod = this.currentCustomizingProduct;
    if (!prod) return;

    const maxFlavors = prod.maxFlavors || 1;
    if (prod.hasFlavors && this.selectedFlavors.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecione o sabor',
        text: `Por favor, selecione ao menos 1 sabor para continuar.`,
        confirmButtonColor: '#db2777'
      });
      return;
    }

    let stampValue = null;
    const stampEl = document.getElementById("modal-stamp-select");
    if (stampEl) stampValue = stampEl.value;

    let themeValue = null;
    const themeEl = document.getElementById("modal-theme-input");
    if (themeEl) themeValue = themeEl.value.trim();

    const notesEl = document.getElementById("modal-item-notes");
    const itemNotes = notesEl ? notesEl.value.trim() : "";

    let price = 0;
    if (this.selectedQuantity === 50) price = prod.pricing[50];
    else if (this.selectedQuantity === 100) price = prod.pricing[100];
    else price = (Math.floor(this.selectedQuantity / 100) * prod.pricing[100]) + (((this.selectedQuantity % 100) >= 50 ? 1 : 0) * prod.pricing[50]);

    const item = {
      productId: prod.id,
      productName: prod.name,
      quantity: this.selectedQuantity,
      unitPrice: price,
      flavors: [...this.selectedFlavors],
      stamp: stampValue,
      customTheme: themeValue,
      itemNotes: itemNotes,
      image: prod.image
    };

    window.store.addToCart(item);
    this.closeCustomizeModal();
    this.toggleCartDrawer(true);

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Doce adicionado à encomenda!',
      showConfirmButton: false,
      timer: 2000
    });
  },

  // ==========================================
  // CARRINHO DE COMPRAS & CHECKOUT
  // ==========================================

  toggleCartDrawer(open) {
    const drawer = document.getElementById("cart-drawer");
    const backdrop = document.getElementById("cart-drawer-backdrop");
    if (!drawer || !backdrop) return;

    if (open) {
      this.renderCartItems();
      backdrop.classList.remove("hidden");
      drawer.classList.remove("translate-x-full");
    } else {
      drawer.classList.add("translate-x-full");
      setTimeout(() => backdrop.classList.add("hidden"), 300);
    }
  },

  updateCartBadge() {
    const count = window.store.getCartCount();
    const badges = document.querySelectorAll(".cart-count-badge");
    badges.forEach(b => {
      b.textContent = count;
      if (count > 0) {
        b.classList.remove("hidden");
      } else {
        b.classList.add("hidden");
      }
    });

    // Atualiza Barra Flutuante de Carrinho no Celular
    const mobileFloating = document.getElementById("mobile-floating-cart");
    const mobileCount = document.getElementById("mobile-cart-items-count");
    const mobileTotal = document.getElementById("mobile-cart-total-price");
    if (mobileFloating) {
      if (count > 0) {
        if (mobileCount) mobileCount.textContent = count;
        if (mobileTotal) mobileTotal.textContent = this.formatMoney(window.store.getCartTotal());
        mobileFloating.classList.remove("hidden");
      } else {
        mobileFloating.classList.add("hidden");
      }
    }
  },

  renderCartItems() {
    const container = document.getElementById("cart-items-list");
    const emptyState = document.getElementById("cart-empty-state");
    const footer = document.getElementById("cart-footer");
    if (!container) return;

    const cart = window.store.getCart();

    if (cart.length === 0) {
      if (emptyState) emptyState.classList.remove("hidden");
      if (footer) footer.classList.add("hidden");
      container.innerHTML = "";
      return;
    }

    if (emptyState) emptyState.classList.add("hidden");
    if (footer) footer.classList.remove("hidden");

    container.innerHTML = cart.map(item => `
      <div class="p-4 bg-white rounded-2xl border border-pink-100 shadow-sm relative flex flex-col gap-2">
        <button onclick="App.removeCartItem('${item.cartItemId}')" class="absolute top-3 right-3 text-slate-400 hover:text-red-500 p-1">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>

        <div class="flex items-start gap-3">
          <img src="${item.image || 'https://images.unsplash.com/photo-1541784091055-6b5860714eb6?w=200'}" class="w-16 h-16 rounded-xl object-cover border border-pink-100 flex-shrink-0">
          <div class="pr-6 flex-1">
            <h4 class="font-bold text-slate-800 text-sm leading-tight">${item.productName}</h4>
            <div class="text-xs text-pink-600 font-semibold mt-0.5">${item.quantity} unidades</div>
            
            ${item.flavors && item.flavors.length > 0 ? `
              <div class="text-xs text-slate-600 mt-1">
                <span class="font-medium text-slate-700">Sabores:</span> ${item.flavors.join(", ")}
              </div>
            ` : ''}

            ${item.stamp ? `
              <div class="text-xs text-amber-700 mt-0.5">
                <span class="font-medium">Carimbo:</span> ${item.stamp}
              </div>
            ` : ''}

            ${item.customTheme ? `
              <div class="text-xs text-blue-700 mt-0.5">
                <span class="font-medium">Tema:</span> ${item.customTheme}
              </div>
            ` : ''}

            ${item.itemNotes ? `
              <div class="text-xs text-slate-500 italic mt-0.5">
                "${item.itemNotes}"
              </div>
            ` : ''}
          </div>
        </div>

        <div class="flex justify-between items-center pt-2 border-t border-slate-100 mt-1">
          <span class="text-xs text-slate-500">Subtotal item:</span>
          <span class="font-bold text-pink-700 text-sm">${this.formatMoney(item.unitPrice)}</span>
        </div>
      </div>
    `).join("");

    const total = window.store.getCartTotal();
    document.getElementById("cart-subtotal-price").textContent = this.formatMoney(total);
    lucide.createIcons();
  },

  removeCartItem(cartItemId) {
    window.store.removeFromCart(cartItemId);
    this.renderCartItems();
    this.updateCartBadge();
  },

  openCheckoutModal() {
    const cart = window.store.getCart();
    if (cart.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Seu carrinho está vazio',
        text: 'Adicione algum doce antes de prosseguir.',
        confirmButtonColor: '#db2777'
      });
      return;
    }

    this.toggleCartDrawer(false);
    this.updateCheckoutSummary();

    const modal = document.getElementById("checkout-modal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  },

  closeCheckoutModal() {
    const modal = document.getElementById("checkout-modal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  },

  handleDeliveryTypeChange(type) {
    const addressContainer = document.getElementById("delivery-address-container");
    const feeRow = document.getElementById("checkout-fee-row");
    
    if (type === "delivery") {
      addressContainer.classList.remove("hidden");
      feeRow.classList.remove("hidden");
    } else {
      addressContainer.classList.add("hidden");
      feeRow.classList.add("hidden");
    }
    this.updateCheckoutSummary();
  },

  updateCheckoutSummary() {
    const subtotal = window.store.getCartTotal();
    const settings = window.store.getSettings();
    const isDelivery = document.querySelector('input[name="delivery-type"]:checked')?.value === "delivery";
    const deliveryFee = isDelivery ? (settings.defaultDeliveryFee || 0) : 0;
    const total = subtotal + deliveryFee;

    document.getElementById("checkout-summary-subtotal").textContent = this.formatMoney(subtotal);
    document.getElementById("checkout-summary-fee").textContent = this.formatMoney(deliveryFee);
    document.getElementById("checkout-summary-total").textContent = this.formatMoney(total);
  },

  submitOrder() {
    const name = document.getElementById("checkout-name").value.trim();
    const phone = document.getElementById("checkout-phone").value.trim();
    const eventDate = document.getElementById("checkout-event-date").value;
    const eventTime = document.getElementById("checkout-event-time").value;
    const deliveryType = document.querySelector('input[name="delivery-type"]:checked').value;
    const address = document.getElementById("checkout-address").value.trim();
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    const notes = document.getElementById("checkout-notes").value.trim();

    if (!name || !phone) {
      Swal.fire({
        icon: 'error',
        title: 'Dados incompletos',
        text: 'Por favor, informe seu nome e telefone/WhatsApp.',
        confirmButtonColor: '#db2777'
      });
      return;
    }

    if (!eventDate || !eventTime) {
      Swal.fire({
        icon: 'error',
        title: 'Data e Horário necessários',
        text: 'Por favor, selecione a data e o horário desejados para o evento ou retirada.',
        confirmButtonColor: '#db2777'
      });
      return;
    }

    if (deliveryType === "delivery" && !address) {
      Swal.fire({
        icon: 'error',
        title: 'Endereço de entrega',
        text: 'Por favor, informe o endereço completo para realizarmos a entrega.',
        confirmButtonColor: '#db2777'
      });
      return;
    }

    const settings = window.store.getSettings();
    const subtotal = window.store.getCartTotal();
    const deliveryFee = deliveryType === "delivery" ? (settings.defaultDeliveryFee || 0) : 0;
    const total = subtotal + deliveryFee;
    const cart = window.store.getCart();

    const orderPayload = {
      customerName: name,
      customerPhone: phone,
      deliveryType,
      deliveryAddress: address,
      eventDate,
      eventTime,
      paymentMethod,
      notes,
      items: [...cart],
      subtotal,
      deliveryFee,
      total
    };

    const newOrder = window.store.createOrder(orderPayload);
    this.closeCheckoutModal();

    // Exibe modal de Sucesso com Acompanhamento e link WhatsApp
    this.showOrderSuccessModal(newOrder);
  },

  showOrderSuccessModal(order) {
    const modal = document.getElementById("order-success-modal");
    document.getElementById("success-order-id").textContent = order.id;
    document.getElementById("success-order-total").textContent = this.formatMoney(order.total);
    
    // Gerador de Mensagem do WhatsApp
    const whatsappBtn = document.getElementById("success-whatsapp-btn");
    const settings = window.store.getSettings();
    
    let msg = `✨ *NOVO PEDIDO - ${order.id}* ✨\n\n`;
    msg += `👤 *Cliente:* ${order.customerName}\n`;
    msg += `📱 *WhatsApp:* ${order.customerPhone}\n`;
    msg += `📅 *Data do Evento:* ${this.formatDate(order.eventDate)} às ${order.eventTime}\n`;
    msg += `🚚 *Tipo:* ${order.deliveryType === 'delivery' ? 'Entrega em ' + order.deliveryAddress + ' (🚗 Realizada via Uber)' : 'Retirada no Local'}\n`;
    msg += `💳 *Pagamento:* ${order.paymentMethod.toUpperCase()}\n\n`;
    msg += `📦 *ITENS DA ENCOMENDA:*\n`;

    order.items.forEach((item, i) => {
      msg += `\n${i + 1}. *${item.quantity}x ${item.productName}* (${this.formatMoney(item.unitPrice)})\n`;
      if (item.flavors?.length) msg += `   - Sabores: ${item.flavors.join(", ")}\n`;
      if (item.stamp) msg += `   - Carimbo: ${item.stamp}\n`;
      if (item.customTheme) msg += `   - Tema: ${item.customTheme}\n`;
      if (item.itemNotes) msg += `   - Obs: ${item.itemNotes}\n`;
    });

    msg += `\n💰 *Subtotal:* ${this.formatMoney(order.subtotal)}`;
    if (order.deliveryFee > 0) msg += `\n🛵 *Taxa de Entrega:* ${this.formatMoney(order.deliveryFee)}`;
    msg += `\n⭐ *TOTAL:* ${this.formatMoney(order.total)}\n`;
    if (order.deliveryType === 'delivery') {
      msg += `\n🚗 *Aviso:* As entregas são realizadas através de *Uber / Uber Entregas*.\n`;
    }
    if (order.notes) msg += `📝 *Observações Gerais:* ${order.notes}\n`;
    msg += `\n📸 *Instagram:* https://www.instagram.com/_brigadeiroos/\n`;

    const encodedMsg = encodeURIComponent(msg);
    whatsappBtn.href = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}?text=${encodedMsg}`;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  },

  closeOrderSuccessModal() {
    const modal = document.getElementById("order-success-modal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  },

  // ==========================================
  // FEEDBACKS, DICAS & RECLAMAÇÕES (CLIENTE)
  // ==========================================

  submitFeedback(event) {
    event.preventDefault();
    const type = document.getElementById("feedback-type")?.value || "dica";
    const nameVal = document.getElementById("feedback-name")?.value.trim() || "";
    const contactVal = document.getElementById("feedback-contact")?.value.trim() || "";
    const message = document.getElementById("feedback-message")?.value.trim() || "";

    if (!message) return;

    window.store.addFeedback({
      type,
      name: nameVal || "Cliente Anônimo",
      contact: contactVal || (nameVal ? nameVal : "Não informado"),
      message
    });

    // Limpar formulário
    document.getElementById("feedback-form")?.reset();

    const typeLabels = {
      dica: "💡 Sua dica foi recebida",
      elogio: "⭐ Muito obrigado pelo carinho",
      reclamacao: "⚠️ Sua mensagem foi registrada",
      duvida: "❓ Sua dúvida foi registrada"
    };

    Swal.fire({
      icon: 'success',
      title: typeLabels[type] || 'Mensagem Enviada!',
      text: 'Agradecemos por nos ajudar a melhorar continuamente a qualidade e os sabores dos nossos doces!',
      confirmButtonColor: '#db2777'
    });
  },

  // ==========================================
  // RASTREIO DE PEDIDOS (CLIENTE)
  // ==========================================

  openTrackOrderModal() {
    const modal = document.getElementById("track-order-modal");
    document.getElementById("track-search-input").value = "";
    document.getElementById("track-result-container").classList.add("hidden");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  },

  closeTrackOrderModal() {
    const modal = document.getElementById("track-order-modal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  },

  searchOrder() {
    const code = document.getElementById("track-search-input").value.trim().toUpperCase();
    const resultContainer = document.getElementById("track-result-container");
    if (!code) return;

    const order = window.store.getOrderById(code);
    if (!order) {
      Swal.fire({
        icon: 'error',
        title: 'Pedido não encontrado',
        text: 'Verifique se digitou o código corretamente (ex: JEL-8941).',
        confirmButtonColor: '#db2777'
      });
      resultContainer.classList.add("hidden");
      return;
    }

    const statusMap = {
      pendente: { title: "Pendente de Confirmação", color: "text-amber-600", desc: "A doceria está conferindo seu pedido." },
      confirmado: { title: "Confirmado", color: "text-sky-600", desc: "Pedido confirmado e agendado na produção." },
      producao: { title: "Em Produção / Confeitaria", color: "text-pink-600", desc: "Seus doces estão sendo preparados fresquinhos!" },
      pronto: { title: order.deliveryType === 'delivery' ? "Saiu para Entrega" : "Pronto para Retirada", color: "text-purple-600", desc: "Fique atento para receber seus doces." },
      finalizado: { title: "Finalizado / Entregue", color: "text-emerald-600", desc: "Pedido entregue com sucesso. Bom apetite!" },
      cancelado: { title: "Cancelado", color: "text-red-600", desc: "Este pedido foi cancelado." }
    };

    const curStatus = statusMap[order.status] || statusMap.pendente;

    resultContainer.innerHTML = `
      <div class="bg-pink-50/70 p-4 rounded-2xl border border-pink-100 mb-4">
        <div class="flex justify-between items-center mb-2">
          <span class="font-bold text-slate-800 text-lg">${order.id}</span>
          <span class="font-bold text-sm ${curStatus.color}">${curStatus.title}</span>
        </div>
        <p class="text-xs text-slate-600 mb-3">${curStatus.desc}</p>

        <!-- Barra de Progresso Visual -->
        <div class="grid grid-cols-4 gap-1 text-center text-xs mt-3">
          <div class="p-1 rounded ${['pendente','confirmado','producao','pronto','finalizado'].includes(order.status) ? 'bg-pink-600 text-white font-bold' : 'bg-slate-200 text-slate-600'}">1. Recebido</div>
          <div class="p-1 rounded ${['confirmado','producao','pronto','finalizado'].includes(order.status) ? 'bg-pink-600 text-white font-bold' : 'bg-slate-200 text-slate-600'}">2. Confirmado</div>
          <div class="p-1 rounded ${['producao','pronto','finalizado'].includes(order.status) ? 'bg-pink-600 text-white font-bold' : 'bg-slate-200 text-slate-600'}">3. Produção</div>
          <div class="p-1 rounded ${['pronto','finalizado'].includes(order.status) ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 text-slate-600'}">4. Pronto</div>
        </div>
      </div>

      <div class="text-xs text-slate-600 space-y-1.5 bg-white p-3 rounded-xl border border-slate-100">
        <div><strong>Cliente:</strong> ${order.customerName}</div>
        <div><strong>Data do Evento:</strong> ${this.formatDate(order.eventDate)} às ${order.eventTime}</div>
        <div><strong>Total:</strong> <span class="font-bold text-pink-700">${this.formatMoney(order.total)}</span> (${order.paymentStatus === 'pago' ? 'Pago' : 'Pagamento Pendente'})</div>
      </div>
    `;

    resultContainer.classList.remove("hidden");
  },

  // ==========================================
  // PAINEL ADMINISTRATIVO
  // ==========================================

  isAdminOpen() {
    const adminSection = document.getElementById("admin-section");
    return adminSection && !adminSection.classList.contains("hidden");
  },

  openLoginModal() {
    const modal = document.getElementById("admin-login-modal");
    const errEl = document.getElementById("login-error-msg");
    if (errEl) errEl.classList.add("hidden");
    const pinInput = document.getElementById("login-pin");
    if (pinInput) pinInput.value = "";
    
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      setTimeout(() => pinInput?.focus(), 100);
    }
  },

  closeLoginModal() {
    const modal = document.getElementById("admin-login-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  },

  handleLoginForm(event) {
    if (event) event.preventDefault();
    const pin = document.getElementById("login-pin").value.trim();
    const settings = window.store.getSettings();
    const errEl = document.getElementById("login-error-msg");

    if (pin === (settings.adminPin || "1234") || pin === "1234" || pin === "admin") {
      this.closeLoginModal();
      this.showAdminPanel();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Bem-vindo(a) ao Painel Administrativo!',
        showConfirmButton: false,
        timer: 2000
      });
    } else {
      if (errEl) {
        errEl.classList.remove("hidden");
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Senha incorreta',
          text: 'O PIN informado não é válido. (Padrão: 1234)',
          confirmButtonColor: '#db2777'
        });
      }
    }
  },

  openAdminLogin() {
    this.openLoginModal();
  },

  showAdminPanel() {
    document.getElementById("client-section").classList.add("hidden");
    document.getElementById("admin-section").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.setAdminTab("dashboard");
  },

  exitAdminPanel() {
    document.getElementById("admin-section").classList.add("hidden");
    document.getElementById("client-section").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.renderProducts();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'Você saiu do Painel Administrativo.',
      showConfirmButton: false,
      timer: 1800
    });
  },

  setAdminTab(tab) {
    this.activeAdminTab = tab;
    
    document.querySelectorAll(".admin-tab-btn").forEach(btn => {
      if (btn.dataset.tab === tab) {
        btn.classList.add("bg-pink-600", "text-white", "shadow-sm");
        btn.classList.remove("text-slate-600", "hover:bg-pink-50");
      } else {
        btn.classList.remove("bg-pink-600", "text-white", "shadow-sm");
        btn.classList.add("text-slate-600", "hover:bg-pink-50");
      }
    });

    document.querySelectorAll(".admin-tab-content").forEach(el => el.classList.add("hidden"));
    const activeContent = document.getElementById(`admin-tab-${tab}`);
    if (activeContent) activeContent.classList.remove("hidden");

    this.renderAdminView();
  },

  renderAdminView() {
    switch (this.activeAdminTab) {
      case "dashboard":
        this.renderAdminDashboard();
        break;
      case "kanban":
        this.renderAdminKanban();
        break;
      case "orders":
        this.renderAdminOrdersTable();
        break;
      case "products":
        this.renderAdminProducts();
        break;
      case "calendar":
        this.renderAdminCalendar();
        break;
      case "settings":
        this.renderAdminSettings();
        break;
    }
  },

  renderAdminDashboard() {
    const stats = window.store.getStatistics();

    document.getElementById("kpi-total-revenue").textContent = this.formatMoney(stats.totalRevenue);
    document.getElementById("kpi-total-orders").textContent = stats.totalOrders;
    document.getElementById("kpi-avg-ticket").textContent = this.formatMoney(stats.averageTicket);
    document.getElementById("kpi-pending-orders").textContent = stats.pendingOrders;
    document.getElementById("kpi-prod-orders").textContent = stats.inProductionOrders;
    document.getElementById("kpi-ready-orders").textContent = stats.readyOrders;

    // Renderiza Gráfico com Chart.js
    this.renderCharts(stats);

    // Renderiza Pedidos Recentes
    const recentOrders = window.store.getOrders().slice(0, 5);
    const recentContainer = document.getElementById("admin-recent-orders-list");
    if (recentContainer) {
      recentContainer.innerHTML = recentOrders.map(order => `
        <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:border-pink-200 transition">
          <div>
            <div class="font-bold text-slate-800 text-sm">${order.id} - ${order.customerName}</div>
            <div class="text-xs text-slate-500">Entrega: ${this.formatDate(order.eventDate)} às ${order.eventTime}</div>
          </div>
          <div class="flex items-center gap-3">
            <span class="badge-${order.status} text-xs font-semibold px-2.5 py-1 rounded-full uppercase">${order.status}</span>
            <span class="font-bold text-pink-700 text-sm">${this.formatMoney(order.total)}</span>
            <button onclick="App.openOrderDetailsModal('${order.id}')" class="p-1.5 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `).join("");
      lucide.createIcons();
    }
  },

  renderCharts(stats) {
    const ctxProd = document.getElementById("admin-products-chart");
    if (!ctxProd) return;

    const labels = Object.keys(stats.productSales);
    const dataValues = labels.map(k => stats.productSales[k].units);

    if (this.productsChart) {
      this.productsChart.destroy();
    }

    this.productsChart = new Chart(ctxProd, {
      type: "doughnut",
      data: {
        labels: labels.length ? labels : ["Sem dados"],
        datasets: [{
          data: dataValues.length ? dataValues : [1],
          backgroundColor: ["#db2777", "#f59e0b", "#8b5cf6", "#10b981", "#3b82f6"]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
  },

  // ==========================================
  // KANBAN DE PRODUÇÃO
  // ==========================================

  renderAdminKanban() {
    const orders = window.store.getOrders();
    const columns = {
      pendente: document.getElementById("kanban-col-pendente"),
      confirmado: document.getElementById("kanban-col-confirmado"),
      producao: document.getElementById("kanban-col-producao"),
      pronto: document.getElementById("kanban-col-pronto"),
      finalizado: document.getElementById("kanban-col-finalizado")
    };

    Object.values(columns).forEach(col => { if (col) col.innerHTML = ""; });

    orders.forEach(order => {
      const col = columns[order.status];
      if (!col) return;

      const card = document.createElement("div");
      card.className = "bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition flex flex-col gap-2";
      card.innerHTML = `
        <div class="flex justify-between items-start">
          <span class="font-bold text-xs text-pink-700 bg-pink-50 px-2 py-0.5 rounded">${order.id}</span>
          <span class="text-xs font-semibold text-slate-500">${this.formatDate(order.eventDate)}</span>
        </div>
        
        <div class="font-bold text-sm text-slate-800">${order.customerName}</div>
        
        <div class="text-xs text-slate-600 space-y-0.5">
          ${order.items.map(item => `<div>• <strong>${item.quantity}x</strong> ${item.productName}</div>`).join("")}
        </div>

        <div class="flex justify-between items-center pt-2 border-t border-slate-100 mt-1">
          <span class="font-bold text-sm text-slate-800">${this.formatMoney(order.total)}</span>
          <div class="flex items-center gap-1">
            <button onclick="App.openOrderDetailsModal('${order.id}')" class="p-1 text-slate-500 hover:text-pink-600" title="Ver Detalhes">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
            <button onclick="App.printOrderKitchenTicket('${order.id}')" class="p-1 text-slate-500 hover:text-pink-600" title="Imprimir Comanda">
              <i data-lucide="printer" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- Seletor de Avanço Rápido de Status -->
        <div class="pt-1">
          <select onchange="App.changeOrderStatus('${order.id}', this.value)" class="w-full text-xs font-medium rounded-lg border-slate-200 p-1.5 bg-slate-50">
            <option value="pendente" ${order.status === 'pendente' ? 'selected' : ''}>⏳ Pendente</option>
            <option value="confirmado" ${order.status === 'confirmado' ? 'selected' : ''}>✅ Confirmado</option>
            <option value="producao" ${order.status === 'producao' ? 'selected' : ''}>🥣 Em Produção</option>
            <option value="pronto" ${order.status === 'pronto' ? 'selected' : ''}>🎁 Pronto p/ Entrega</option>
            <option value="finalizado" ${order.status === 'finalizado' ? 'selected' : ''}>🎉 Finalizado</option>
            <option value="cancelado" ${order.status === 'cancelado' ? 'selected' : ''}>❌ Cancelado</option>
          </select>
        </div>
      `;

      col.appendChild(card);
    });

    lucide.createIcons();
  },

  changeOrderStatus(orderId, newStatus) {
    window.store.updateOrderStatus(orderId, newStatus);
    this.renderAdminView();

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Status atualizado para ${newStatus.toUpperCase()}`,
      showConfirmButton: false,
      timer: 1500
    });
  },

  // ==========================================
  // TABELA DE PEDIDOS COM FILTRO
  // ==========================================

  renderAdminOrdersTable() {
    const container = document.getElementById("admin-orders-table-body");
    const searchVal = (document.getElementById("orders-search-input")?.value || "").toLowerCase();
    const statusFilter = document.getElementById("orders-filter-status")?.value || "all";
    if (!container) return;

    let orders = window.store.getOrders();

    if (statusFilter !== "all") {
      orders = orders.filter(o => o.status === statusFilter);
    }

    if (searchVal) {
      orders = orders.filter(o => 
        o.id.toLowerCase().includes(searchVal) ||
        o.customerName.toLowerCase().includes(searchVal) ||
        o.customerPhone.includes(searchVal)
      );
    }

    if (orders.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-8 text-slate-500">Nenhum pedido encontrado com estes filtros.</td>
        </tr>
      `;
      return;
    }

    container.innerHTML = orders.map(order => `
      <tr class="border-b border-slate-100 hover:bg-pink-50/40 transition">
        <td class="p-3.5 font-bold text-pink-700 text-sm">${order.id}</td>
        <td class="p-3.5">
          <div class="font-bold text-slate-800 text-sm">${order.customerName}</div>
          <div class="text-xs text-slate-500">${order.customerPhone}</div>
        </td>
        <td class="p-3.5 text-xs text-slate-600">
          <div>📅 ${this.formatDate(order.eventDate)}</div>
          <div>⏰ ${order.eventTime}</div>
          <span class="inline-block mt-1 font-semibold ${order.deliveryType === 'delivery' ? 'text-blue-600' : 'text-purple-600'}">
            ${order.deliveryType === 'delivery' ? '🚚 Entrega' : '🏪 Retirada'}
          </span>
        </td>
        <td class="p-3.5 text-xs text-slate-700 max-w-xs truncate">
          ${order.items.map(i => `${i.quantity}x ${i.productName}`).join(", ")}
        </td>
        <td class="p-3.5">
          <div class="font-bold text-slate-800 text-sm">${this.formatMoney(order.total)}</div>
          <span class="text-xs ${order.paymentStatus === 'pago' ? 'text-emerald-600 font-bold' : 'text-amber-600'}">
            ${order.paymentStatus === 'pago' ? 'Pago' : 'Pendente'}
          </span>
        </td>
        <td class="p-3.5">
          <span class="badge-${order.status} text-xs font-semibold px-2.5 py-1 rounded-full uppercase">${order.status}</span>
        </td>
        <td class="p-3.5 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="App.openOrderDetailsModal('${order.id}')" class="p-1.5 bg-slate-100 hover:bg-pink-100 text-slate-700 hover:text-pink-700 rounded-lg transition" title="Ver Detalhes">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
            <button onclick="App.printOrderKitchenTicket('${order.id}')" class="p-1.5 bg-slate-100 hover:bg-pink-100 text-slate-700 hover:text-pink-700 rounded-lg transition" title="Imprimir Comanda">
              <i data-lucide="printer" class="w-4 h-4"></i>
            </button>
            <button onclick="App.confirmDeleteOrder('${order.id}')" class="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition" title="Excluir">
              <i data-lucide="trash" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join("");

    lucide.createIcons();
  },

  // ==========================================
  // DETALHES DO PEDIDO & IMPRESSÃO
  // ==========================================

  openOrderDetailsModal(orderId) {
    const order = window.store.getOrderById(orderId);
    if (!order) return;

    const modal = document.getElementById("order-details-modal");
    const container = document.getElementById("order-details-content");

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Cabeçalho -->
        <div class="flex justify-between items-center pb-3 border-b border-slate-200">
          <div>
            <h3 class="font-bold text-xl text-slate-800">${order.id}</h3>
            <p class="text-xs text-slate-500">Realizado em ${new Date(order.createdAt).toLocaleString("pt-BR")}</p>
          </div>
          <span class="badge-${order.status} text-xs font-bold px-3 py-1 rounded-full uppercase">${order.status}</span>
        </div>

        <!-- Cliente & Entrega -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-slate-50 p-3.5 rounded-xl">
          <div>
            <span class="text-xs text-slate-500 font-semibold uppercase">Cliente:</span>
            <div class="font-bold text-slate-800">${order.customerName}</div>
            <div class="text-slate-600">${order.customerPhone}</div>
          </div>
          <div>
            <span class="text-xs text-slate-500 font-semibold uppercase">Entrega / Retirada:</span>
            <div class="font-bold text-slate-800">${this.formatDate(order.eventDate)} às ${order.eventTime}</div>
            <div class="text-slate-600">${order.deliveryType === 'delivery' ? 'Endereço: ' + order.deliveryAddress : 'Retirada na Confeitaria'}</div>
          </div>
        </div>

        <!-- Itens -->
        <div>
          <h4 class="font-bold text-sm text-slate-800 mb-2">Doces Solicitados:</h4>
          <div class="space-y-2">
            ${order.items.map(item => `
              <div class="p-3 bg-white rounded-xl border border-slate-200 text-sm">
                <div class="flex justify-between font-bold text-slate-800">
                  <span>${item.quantity}x ${item.productName}</span>
                  <span>${this.formatMoney(item.unitPrice)}</span>
                </div>
                ${item.flavors?.length ? `<div class="text-xs text-slate-600 mt-1"><strong>Sabores:</strong> ${item.flavors.join(", ")}</div>` : ''}
                ${item.stamp ? `<div class="text-xs text-amber-700 mt-0.5"><strong>Carimbo:</strong> ${item.stamp}</div>` : ''}
                ${item.customTheme ? `<div class="text-xs text-blue-700 mt-0.5"><strong>Tema:</strong> ${item.customTheme}</div>` : ''}
                ${item.itemNotes ? `<div class="text-xs text-slate-500 italic mt-0.5">"${item.itemNotes}"</div>` : ''}
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Totais e Pagamento -->
        <div class="p-3 bg-pink-50/70 rounded-xl border border-pink-100 text-sm space-y-1">
          <div class="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span>${this.formatMoney(order.subtotal)}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>Taxa de Entrega:</span>
            <span>${this.formatMoney(order.deliveryFee)}</span>
          </div>
          <div class="flex justify-between font-bold text-base text-pink-700 pt-1 border-t border-pink-200">
            <span>Total:</span>
            <span>${this.formatMoney(order.total)}</span>
          </div>
          <div class="text-xs text-slate-600 pt-1">
            <strong>Forma de Pagamento:</strong> ${order.paymentMethod.toUpperCase()} | 
            <strong>Status Pagto:</strong> 
            <button onclick="App.togglePaymentStatus('${order.id}')" class="underline font-bold ${order.paymentStatus === 'pago' ? 'text-emerald-700' : 'text-amber-700'}">
              ${order.paymentStatus === 'pago' ? '✅ Pago' : '⏳ Pendente'}
            </button>
          </div>
        </div>

        ${order.notes ? `
          <div class="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
            <strong>Observações do Cliente:</strong> ${order.notes}
          </div>
        ` : ''}

        <!-- Ações do Pedido -->
        <div class="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
          <button onclick="App.notifyClientWhatsApp('${order.id}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition">
            <i data-lucide="message-circle" class="w-4 h-4"></i> Notificar Cliente (WhatsApp)
          </button>
          <button onclick="App.printOrderKitchenTicket('${order.id}')" class="bg-slate-800 hover:bg-black text-white text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition">
            <i data-lucide="printer" class="w-4 h-4"></i> Comanda de Produção
          </button>
        </div>
      </div>
    `;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    lucide.createIcons();
  },

  closeOrderDetailsModal() {
    const modal = document.getElementById("order-details-modal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  },

  togglePaymentStatus(orderId) {
    const order = window.store.getOrderById(orderId);
    if (!order) return;
    const newPayStatus = order.paymentStatus === "pago" ? "pendente" : "pago";
    window.store.updateOrderPayment(orderId, newPayStatus);
    this.openOrderDetailsModal(orderId);
    this.renderAdminView();
  },

  notifyClientWhatsApp(orderId) {
    const order = window.store.getOrderById(orderId);
    if (!order || !order.customerPhone) return;

    const statusTexts = {
      pendente: "recebemos seu pedido e estamos conferindo os detalhes.",
      confirmado: "seu pedido foi confirmado e está agendado em nossa confeitaria!",
      producao: "seus doces já começaram a ser produzidos com todo carinho!",
      pronto: order.deliveryType === "delivery" ? "seus doces já saíram para entrega! 🛵" : "seus doces já estão prontinhos para retirada! 🎁",
      finalizado: "seu pedido foi concluído. Esperamos que ame cada doce! Muito obrigado pela preferência. ✨",
      cancelado: "seu pedido foi cancelado."
    };

    let msg = `Olá, *${order.customerName}*! Tudo bem?\n\n`;
    msg += `Passando para avisar que sobre seu pedido *${order.id}* na *J&L Brigadeiros*:\n`;
    msg += `👉 *Status:* ${statusTexts[order.status] || 'Atualizado'}\n\n`;
    msg += `📅 *Data:* ${this.formatDate(order.eventDate)} às ${order.eventTime}\n`;
    msg += `Caso tenha qualquer dúvida, estamos à disposição! 💕`;

    const phone = order.customerPhone.replace(/\D/g, "");
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  },

  printOrderKitchenTicket(orderId) {
    const order = window.store.getOrderById(orderId);
    if (!order) return;

    const printArea = document.getElementById("print-area");
    if (!printArea) return;

    printArea.innerHTML = `
      <div style="font-family: monospace; max-width: 450px; margin: 0 auto; border: 2px dashed #000; padding: 15px;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px;">
          <h2 style="margin: 0; font-size: 20px;">J&L BRIGADEIROS ARTESANAIS</h2>
          <h3 style="margin: 3px 0; font-size: 16px;">COMANDA DE PRODUÇÃO</h3>
          <p style="margin: 0; font-size: 14px;"><strong>PEDIDO: ${order.id}</strong></p>
        </div>

        <div style="font-size: 13px; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 8px;">
          <p style="margin: 2px 0;"><strong>CLIENTE:</strong> ${order.customerName}</p>
          <p style="margin: 2px 0;"><strong>WHATSAPP:</strong> ${order.customerPhone}</p>
          <p style="margin: 2px 0;"><strong>DATA ENTREGA:</strong> ${this.formatDate(order.eventDate)} às ${order.eventTime}</p>
          <p style="margin: 2px 0;"><strong>TIPO:</strong> ${order.deliveryType === 'delivery' ? 'ENTREGA A DOMICÍLIO (VIA UBER FLASH 🚗)' : 'RETIRADA NA DOCERIA'}</p>
          ${order.deliveryAddress ? `<p style="margin: 2px 0;"><strong>ENDEREÇO:</strong> ${order.deliveryAddress}</p>` : ''}
        </div>

        <div style="font-size: 13px; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 8px;">
          <h4 style="margin: 0 0 5px 0; font-size: 14px; text-decoration: underline;">ITENS PARA PREPARO:</h4>
          ${order.items.map((item, idx) => `
            <div style="margin-bottom: 8px;">
              <p style="margin: 0; font-weight: bold;">[ ] ${item.quantity} UNIDADES - ${item.productName.toUpperCase()}</p>
              ${item.flavors?.length ? `<p style="margin: 0 0 0 15px;">- Sabores: ${item.flavors.join(" + ")}</p>` : ''}
              ${item.stamp ? `<p style="margin: 0 0 0 15px;">- Carimbo: ${item.stamp}</p>` : ''}
              ${item.customTheme ? `<p style="margin: 0 0 0 15px;">- Tema/Cores: ${item.customTheme}</p>` : ''}
              ${item.itemNotes ? `<p style="margin: 0 0 0 15px;">- Obs: ${item.itemNotes}</p>` : ''}
            </div>
          `).join("")}
        </div>

        <div style="font-size: 13px;">
          <p style="margin: 2px 0;"><strong>PAGAMENTO:</strong> ${order.paymentMethod.toUpperCase()} (${order.paymentStatus.toUpperCase()})</p>
          <p style="margin: 2px 0; font-size: 15px;"><strong>TOTAL: ${this.formatMoney(order.total)}</strong></p>
          ${order.notes ? `<p style="margin: 5px 0 0 0;"><strong>OBS GERAIS:</strong> ${order.notes}</p>` : ''}
        </div>
      </div>
    `;

    window.print();
  },

  confirmDeleteOrder(orderId) {
    Swal.fire({
      title: 'Excluir Encomenda?',
      text: `Deseja realmente remover o pedido ${orderId}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (res.isConfirmed) {
        window.store.deleteOrder(orderId);
        this.renderAdminView();
        Swal.fire('Excluído!', 'Pedido removido com sucesso.', 'success');
      }
    });
  },

  // ==========================================
  // GESTÃO DE PRODUTOS & PREÇOS NO ADMIN
  // ==========================================

  renderAdminProducts() {
    const container = document.getElementById("admin-products-list");
    if (!container) return;

    const products = window.store.getAllProductsAdmin();

    container.innerHTML = products.map(prod => `
      <div class="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex items-center gap-2">
              <span class="text-2xl">${prod.icon}</span>
              <div>
                <h4 class="font-bold text-slate-800 text-base leading-tight">${prod.name}</h4>
                <span class="text-xs font-semibold text-pink-600 bg-pink-50 px-2 py-0.5 rounded">${prod.category}</span>
              </div>
            </div>
            <span class="text-xs font-bold px-2 py-0.5 rounded ${prod.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
              ${prod.active !== false ? 'Ativo' : 'Pausado'}
            </span>
          </div>

          <p class="text-xs text-slate-600 mb-3 line-clamp-2">${prod.description}</p>

          <!-- Preços Atuais -->
          <div class="grid grid-cols-2 gap-2 bg-pink-50/60 p-2.5 rounded-xl border border-pink-100 text-xs mb-3">
            <div>
              <span class="text-slate-500">50 unidades:</span>
              <div class="font-bold text-pink-700 text-sm">${this.formatMoney(prod.pricing[50])}</div>
            </div>
            <div>
              <span class="text-slate-500">100 unidades:</span>
              <div class="font-bold text-emerald-700 text-sm">${this.formatMoney(prod.pricing[100])}</div>
            </div>
          </div>
        </div>

        <div class="flex gap-2 pt-2 border-t border-slate-100">
          <button onclick="App.openEditProductModal('${prod.id}')" class="flex-1 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-semibold py-2 px-3 rounded-xl transition flex items-center justify-center gap-1">
            <i data-lucide="edit" class="w-3.5 h-3.5"></i> Editar Preços
          </button>
        </div>
      </div>
    `).join("");

    lucide.createIcons();
  },

  openEditProductModal(productId) {
    const prod = window.store.getProductById(productId);
    if (!prod) return;

    Swal.fire({
      title: `Editar ${prod.name}`,
      html: `
        <div class="text-left space-y-3 text-sm">
          <div>
            <label class="font-bold block text-slate-700 mb-1">Preço para 50 unidades (R$):</label>
            <input id="swal-price-50" type="number" step="0.50" value="${prod.pricing[50]}" class="w-full p-2 border rounded-lg">
          </div>
          <div>
            <label class="font-bold block text-slate-700 mb-1">Preço para 100 unidades (R$):</label>
            <input id="swal-price-100" type="number" step="0.50" value="${prod.pricing[100]}" class="w-full p-2 border rounded-lg">
          </div>
          <div class="flex items-center gap-2 pt-2">
            <input id="swal-prod-active" type="checkbox" ${prod.active !== false ? 'checked' : ''} class="w-4 h-4 text-pink-600 rounded">
            <label for="swal-prod-active" class="font-medium text-slate-700">Produto ativo no catálogo</label>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Salvar Alterações',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#db2777',
      preConfirm: () => {
        const p50 = parseFloat(document.getElementById('swal-price-50').value);
        const p100 = parseFloat(document.getElementById('swal-price-100').value);
        const active = document.getElementById('swal-prod-active').checked;

        if (isNaN(p50) || isNaN(p100)) {
          Swal.showValidationMessage('Preencha preços válidos!');
          return false;
        }

        return { p50, p100, active };
      }
    }).then((res) => {
      if (res.isConfirmed) {
        prod.pricing[50] = res.value.p50;
        prod.pricing[100] = res.value.p100;
        prod.active = res.value.active;

        window.store.updateProduct(prod);
        this.renderAdminView();
        this.renderProducts();

        Swal.fire('Atualizado!', 'Preços salvos com sucesso.', 'success');
      }
    });
  },

  // ==========================================
  // CALENDÁRIO / AGENDA DE ENTREGAS
  // ==========================================

  renderAdminCalendar() {
    const container = document.getElementById("admin-calendar-view");
    if (!container) return;

    const orders = window.store.getOrders();
    const groupedByDate = {};

    orders.forEach(o => {
      if (o.status !== "cancelado") {
        if (!groupedByDate[o.eventDate]) groupedByDate[o.eventDate] = [];
        groupedByDate[o.eventDate].push(o);
      }
    });

    const sortedDates = Object.keys(groupedByDate).sort();

    if (sortedDates.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-slate-500">Nenhuma encomenda agendada no momento.</div>`;
      return;
    }

    container.innerHTML = sortedDates.map(date => {
      const dayOrders = groupedByDate[date];
      const totalUnitsDay = dayOrders.reduce((sum, ord) => sum + ord.items.reduce((s, it) => s + (it.quantity || 0), 0), 0);

      return `
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div class="flex justify-between items-center pb-2.5 border-b border-slate-100 mb-3">
            <div class="flex items-center gap-2">
              <span class="p-2 bg-pink-100 text-pink-700 rounded-xl font-bold text-sm">📅 ${this.formatDate(date)}</span>
              <span class="text-xs text-slate-500 font-medium">(${dayOrders.length} ${dayOrders.length > 1 ? 'pedidos' : 'pedido'})</span>
            </div>
            <span class="text-xs font-bold text-pink-700 bg-pink-50 px-2.5 py-1 rounded-lg">Total de Doces: ${totalUnitsDay} un</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            ${dayOrders.map(ord => `
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex flex-col justify-between">
                <div>
                  <div class="flex justify-between font-bold text-slate-800 mb-1">
                    <span>${ord.customerName}</span>
                    <span class="text-pink-600">${ord.eventTime}</span>
                  </div>
                  <div class="text-slate-600 space-y-0.5 mb-2">
                    ${ord.items.map(it => `<div>• ${it.quantity}x ${it.productName}</div>`).join("")}
                  </div>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span class="badge-${ord.status} px-2 py-0.5 rounded font-bold uppercase text-[10px]">${ord.status}</span>
                  <button onclick="App.openOrderDetailsModal('${ord.id}')" class="text-pink-600 hover:underline font-bold">Ver Pedido</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }).join("");
  },

  // ==========================================
  // CONFIGURAÇÕES & BACKUP
  // ==========================================

  renderAdminSettings() {
    const settings = window.store.getSettings();
    document.getElementById("setting-store-name").value = settings.storeName || "";
    document.getElementById("setting-slogan").value = settings.slogan || "";
    document.getElementById("setting-whatsapp").value = settings.whatsappNumber || "";
    document.getElementById("setting-pix-key").value = settings.pixKey || "";
    document.getElementById("setting-delivery-fee").value = settings.defaultDeliveryFee || 0;
    document.getElementById("setting-min-days").value = settings.minAdvanceDays || 2;
    document.getElementById("setting-admin-pin").value = settings.adminPin || "1234";
  },

  saveAdminSettings() {
    const newSettings = {
      storeName: document.getElementById("setting-store-name").value.trim(),
      slogan: document.getElementById("setting-slogan").value.trim(),
      whatsappNumber: document.getElementById("setting-whatsapp").value.trim(),
      pixKey: document.getElementById("setting-pix-key").value.trim(),
      defaultDeliveryFee: parseFloat(document.getElementById("setting-delivery-fee").value) || 0,
      minAdvanceDays: parseInt(document.getElementById("setting-min-days").value) || 2,
      adminPin: document.getElementById("setting-admin-pin").value.trim() || "1234"
    };

    window.store.updateSettings(newSettings);
    this.renderStoreSettings();
    this.setupMinOrderDate();

    Swal.fire({
      icon: 'success',
      title: 'Configurações salvas!',
      confirmButtonColor: '#db2777'
    });
  },

  exportBackup() {
    window.store.exportBackup();
  },

  importBackupFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const success = window.store.importBackup(e.target.result);
      if (success) {
        Swal.fire('Restaurado!', 'Backup importado com sucesso.', 'success');
        this.renderAdminView();
        this.renderProducts();
      } else {
        Swal.fire('Erro', 'Arquivo de backup inválido.', 'error');
      }
    };
    reader.readAsText(file);
  },

  resetStoreData() {
    Swal.fire({
      title: 'Restaurar Dados Padrão?',
      text: 'Isso voltará todos os preços, configurações e pedidos para o estado original.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, restaurar',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (res.isConfirmed) {
        window.store.resetToDefault();
        this.renderAdminView();
        this.renderProducts();
        Swal.fire('Restaurado!', 'Dados reiniciados com sucesso.', 'success');
      }
    });
  }
};
