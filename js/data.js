/**
 * Dados Iniciais e Configurações Padrão da JeL Doces
 */

const INITIAL_DATA = {
  settings: {
    storeName: "J&L Brigadeiros",
    slogan: "Doces artesanais feitos com carinho para momentos inesquecíveis",
    whatsappNumber: "5511999999999", // Número para receber pedidos
    pixKey: "jl.brigadeiros@exemplo.com",
    pixKeyType: "E-mail",
    pixReceiver: "J&L Brigadeiros Artesanais",
    defaultDeliveryFee: 10.00,
    minAdvanceDays: 2, // Mínimo de 2 dias de antecedência para encomendas
    adminPin: "1234", // PIN de acesso ao painel
    currency: "BRL"
  },
  
  categories: [
    { id: "all", name: "Todos os Doces", icon: "sparkles" },
    { id: "tradicional", name: "Tradicionais", icon: "cake" },
    { id: "especial", name: "Especiais", icon: "star" },
    { id: "tematico", name: "Temáticos", icon: "party-popper" },
    { id: "carimbo", name: "Carimbados", icon: "stamp" }
  ],

  products: [
    {
      id: "prod-1",
      name: "Brigadeiro Tradicional",
      category: "tradicional",
      description: "Brigadeiros tradicionais irresistíveis. Sabores disponíveis: Chocolate, Morango, Cajuzinho, Coco e Ninho.",
      image: "img/brigadeiro_tradicional.jpg",
      icon: "🍫",
      badge: "Mais Vendido",
      pricing: {
        50: 80.00,
        100: 140.00
      },
      hasFlavors: true,
      maxFlavors: 1,
      availableFlavors: [
        "Chocolate",
        "Morango",
        "Cajuzinho",
        "Coco",
        "Ninho"
      ],
      hasCustomTheme: false,
      hasStamp: false,
      active: true
    },
    {
      id: "prod-2",
      name: "Brigadeiro Especial (2 Sabores)",
      category: "especial",
      description: "Brigadeiros gourmet especiais (escolha até 2 sabores). Sabores disponíveis: Prestígio, Coco queimado, Amendoim Crocante, Amendoim com Chocolate, Casadinho e Sensação.",
      image: "img/brigadeiro_especial.jpg",
      icon: "✨",
      badge: "Gourmet",
      pricing: {
        50: 90.00,
        100: 170.00
      },
      hasFlavors: true,
      maxFlavors: 2,
      availableFlavors: [
        "Prestígio",
        "Coco queimado",
        "Amendoim Crocante",
        "Amendoim com Chocolate",
        "Casadinho",
        "Sensação"
      ],
      hasCustomTheme: false,
      hasStamp: false,
      active: true
    },
    {
      id: "prod-3",
      name: "Brigadeiros Temáticos para Festas",
      category: "tematico",
      description: "Doces decorados no tema da sua comemoração. Forminhas especiais, confeitos e paleta de cores personalizada para aniversários, batizados e eventos.",
      image: "img/brigadeiro_tematico.jpg",
      icon: "🎉",
      badge: "Festas & Eventos",
      pricing: {
        50: 120.00,
        100: 230.00
      },
      hasFlavors: true,
      maxFlavors: 2,
      availableFlavors: [
        "Tradicional ao Leite",
        "Chocolate Branco Colorido",
        "Ninho",
        "Beijinho",
        "Bicho de Pé"
      ],
      hasCustomTheme: true,
      themePlaceholders: "Ex: Safari, Princesas, Fundo do Mar, Casamento, 15 anos, Cores Dourado e Rosa",
      hasStamp: false,
      active: true
    },
    {
      id: "prod-4",
      name: "Doces Personalizados no Carimbo",
      category: "carimbo",
      description: "Doces artesanais carimbados com palavras de afeto, iniciais, idades ou desenhos delicados. Um toque de sofisticação e exclusividade.",
      image: "img/doces_carimbo.jpg",
      icon: "🏷️",
      badge: "Personalizado",
      pricing: {
        50: 100.00,
        100: 180.00
      },
      hasFlavors: true,
      maxFlavors: 2,
      availableFlavors: [
        "Ninho Puro",
        "Tradicional ao Leite",
        "Doce de Leite com Canela",
        "Chocolate 50% Cacau"
      ],
      hasCustomTheme: false,
      hasStamp: true,
      availableStamps: [
        "Com Amor ❤️",
        "Parabéns 🎉",
        "Gratidão ✨",
        "Felicidades 🥂",
        "Iniciais Personalizadas (especificar nas observações)",
        "Idade / Números (especificar nas observações)",
        "Coração Delicado 💖"
      ],
      active: true
    }
  ],

  sampleOrders: [
    {
      id: "JEL-8941",
      customerName: "Camila Rodrigues",
      customerPhone: "11987654321",
      deliveryType: "delivery", // 'delivery' | 'pickup'
      deliveryAddress: "Rua das Flores, 142 - Apto 32, Bairro Jardim",
      eventDate: "2026-08-26",
      eventTime: "15:00",
      items: [
        {
          productId: "prod-2",
          productName: "Brigadeiro Especial (2 Sabores)",
          quantity: 100,
          unitPrice: 170.00,
          flavors: ["Ninho com Nutella", "Pistache Gourmet"],
          stamp: null,
          customTheme: null,
          itemNotes: "Entregar em caixas separadas se possível"
        },
        {
          productId: "prod-4",
          productName: "Doces Personalizados no Carimbo",
          quantity: 50,
          unitPrice: 100.00,
          flavors: ["Ninho Puro"],
          stamp: "Com Amor ❤️",
          customTheme: null,
          itemNotes: "Carimbo bem nítido"
        }
      ],
      subtotal: 270.00,
      deliveryFee: 10.00,
      total: 280.00,
      paymentMethod: "pix",
      paymentStatus: "pago", // 'pendente' | 'pago'
      status: "producao", // 'pendente' | 'confirmado' | 'producao' | 'pronto' | 'finalizado' | 'cancelado'
      notes: "Aniversário surpresa",
      createdAt: "2026-08-22T10:30:00"
    },
    {
      id: "JEL-7215",
      customerName: "Marcos Vinicius",
      customerPhone: "11977778888",
      deliveryType: "pickup",
      deliveryAddress: "",
      eventDate: "2026-08-25",
      eventTime: "11:00",
      items: [
        {
          productId: "prod-1",
          productName: "Brigadeiro Tradicional",
          quantity: 100,
          unitPrice: 140.00,
          flavors: ["Tradicional ao Leite"],
          stamp: null,
          customTheme: null,
          itemNotes: ""
        }
      ],
      subtotal: 140.00,
      deliveryFee: 0.00,
      total: 140.00,
      paymentMethod: "cartao",
      paymentStatus: "pendente",
      status: "confirmado",
      notes: "Retirada às 11h pontualmente",
      createdAt: "2026-08-22T14:15:00"
    },
    {
      id: "JEL-6320",
      customerName: "Juliana Mendes",
      customerPhone: "11991234567",
      deliveryType: "delivery",
      deliveryAddress: "Av. Paulista, 1000 - Bela Vista",
      eventDate: "2026-08-28",
      eventTime: "18:00",
      items: [
        {
          productId: "prod-3",
          productName: "Brigadeiros Temáticos para Festas",
          quantity: 100,
          unitPrice: 230.00,
          flavors: ["Chocolate Branco Colorido", "Ninho"],
          stamp: null,
          customTheme: "Festa Infantil Bosque Encantado (tons verde menta e rosa bebê)",
          itemNotes: "Forminhas verdes e rosas intercaladas"
        }
      ],
      subtotal: 230.00,
      deliveryFee: 15.00,
      total: 245.00,
      paymentMethod: "pix",
      paymentStatus: "pago",
      status: "pendente",
      notes: "Deixar na portaria caso não atenda",
      createdAt: "2026-08-22T16:00:00"
    }
  ]
};
