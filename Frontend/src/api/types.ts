export interface Category { id: string; name: string; productCount?: number }

export interface Product {
    id: string
    name: string
    categoryId: string
    categoryName: string
    description: string
    priceCents: number
    stock: number
    isActive: boolean
    imageUrl: string
    inStock: boolean
}

export type CartIssue = 'UNAVAILABLE' | 'OUT_OF_STOCK' | 'INSUFFICIENT_STOCK' | null

export interface CartLine {
    productId: string
    name: string
    imageUrl: string
    unitPriceCents: number
    stock: number
    qty: number
    lineTotalCents: number
    issue: CartIssue
}
export interface ResolvedCart { lines: CartLine[]; totalCents: number; hasIssues: boolean }

export type OrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Shipped' | 'Completed' | 'Cancelled'

export interface OrderItem { productId: string; name: string; unitPriceCents: number; qty: number; lineTotalCents: number }
export interface Order {
    orderNumber: string
    customerName: string
    email: string
    emailNormalized: string
    phone: string
    address: string
    paymentMethod: string
    notes: string
    status: OrderStatus
    items: OrderItem[]
    subtotalCents: number
    totalCents: number
    createdAt: string
    updatedAt: string
    allowedNext: OrderStatus[]
}

export interface DashboardStats {
    totalProducts: number; totalOrders: number; pendingOrders: number
    completedOrders: number; totalCustomers: number; totalSalesCents: number
}
export interface CustomerRow { name: string; email: string; phone: string; orderCount: number; completedTotalCents: number }

export interface CartChange {
    productId: string
    type: 'UNAVAILABLE' | 'OUT_OF_STOCK' | 'INSUFFICIENT_STOCK' | 'PRICE_CHANGED'
    name: string
    oldPriceCents?: number
    newPriceCents?: number
    availableStock?: number
    requestedQty?: number
}

export interface ProductInput {
    name: string; categoryId: string; description: string
    price: string; stock: number; isActive: boolean; imageUrl: string
}