import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Empty } from './components/Bits'
import { ShopLayout } from './components/ShopLayout'
import { CartProvider } from './context/CartContext'
import { btn } from './lib/ui'
import Cart from './pages/shop/Cart'
import Checkout from './pages/shop/Checkout'
import Confirmation from './pages/shop/Confirmation'
import Home from './pages/shop/Home'
import ProductDetail from './pages/shop/ProductDetail'
import Products from './pages/shop/Products'

export default function App() {
  return (
    <BrowserRouter>
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
          {/* Admin routes are added in Part 2b */}
        </Routes>
      </CartProvider>
    </BrowserRouter>
  )
}