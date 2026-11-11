import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { RequireAdmin } from './components/AdminLayout'
import { Empty } from './components/Bits'
import { ShopLayout } from './components/ShopLayout'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { btn } from './lib/ui'
import Categories from './pages/admin/Categories'
import Customers from './pages/admin/Customers'
import Dashboard from './pages/admin/Dashboard'
import Login from './pages/admin/Login'
import OrderDetail from './pages/admin/OrderDetail'
import Orders from './pages/admin/Orders'
import ProductForm from './pages/admin/ProductForm'
import AdminProducts from './pages/admin/Products'
import Cart from './pages/shop/Cart'
import Checkout from './pages/shop/Checkout'
import Confirmation from './pages/shop/Confirmation'
import Home from './pages/shop/Home'
import ProductDetail from './pages/shop/ProductDetail'
import Products from './pages/shop/Products'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<ShopLayout />}>
              <Route index element={<Home />} />
              <Route path="products" element={<Products />} />
              <Route path="products/:id" element={<ProductDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="order-confirmation" element={<Confirmation />} />
              <Route path="*" element={<Empty title="Page not found"><Link className={btn()} to="/">Go home</Link></Empty>} />
            </Route>

            <Route path="admin/login" element={<Login />} />
            <Route path="admin" element={<RequireAdmin />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id" element={<ProductForm />} />
              <Route path="categories" element={<Categories />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:orderNumber" element={<OrderDetail />} />
              <Route path="customers" element={<Customers />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}