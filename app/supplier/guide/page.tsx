export default function SupplierGuidePage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Supplier Onboarding Guide</h1>
      
      <div className="prose prose-indigo max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Apply to Become a Supplier</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to the registration page and select <strong>"Supplier"</strong> as your account type.</li>
            <li>Fill in your business name, address, and contact details.</li>
            <li>Submit the application. Our team will review it within 1–2 business days.</li>
            <li>Once approved, you'll receive a magic link email to log in without a password.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Logging In</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Use the <strong>magic link</strong> sent to your email. Click the link and you'll be automatically logged in.</li>
            <li>If you lose the link, request a new one from the login page.</li>
            <li>You'll be directed to your <strong>Supplier Portal</strong> dashboard.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Adding Products</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>From the sidebar, click <strong>Products</strong>.</li>
            <li>Click <strong>+ Add Product</strong>.</li>
            <li>Fill in:
              <ul className="list-disc list-inside ml-6 mt-1">
                <li><strong>Title</strong>: Name of the product.</li>
                <li><strong>Description</strong>: Details about the product.</li>
                <li><strong>Wholesale Price</strong>: The price we pay you (your cost).</li>
                <li><strong>Stock Quantity</strong>: How many units you have available.</li>
                <li><strong>Shipping Flat Fee</strong> (optional): A fixed shipping charge per order.</li>
                <li><strong>Images</strong>: Upload up to 5 high‑quality images.</li>
              </ul>
            </li>
            <li>Submit the product for review. Our admin team will approve it before it appears on the store.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Managing Orders</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>When a customer places an order containing your products and payment is confirmed, you'll see it in <strong>Orders</strong>.</li>
            <li>Click <strong>Mark as Shipped</strong> once you've dispatched the item.</li>
            <li>Enter the <strong>Carrier</strong> (e.g., UPS, FedEx) and <strong>Tracking Number</strong>.</li>
            <li>The customer will automatically see the tracking information on their order status page.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Earnings & Payouts</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>You earn the <strong>wholesale price</strong> for each item sold.</li>
            <li>Our platform adds a commission (visible to customers as the retail price).</li>
            <li>Every Monday, we generate a payout report. You'll receive your total owed amount via your chosen payment method (PayPal, Venmo, or bank transfer).</li>
            <li>You can view your sales history in the <strong>Earnings</strong> section.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Tips for Success</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Keep your inventory quantities accurate to avoid overselling.</li>
            <li>Ship orders promptly—ideally within 2 business days.</li>
            <li>Provide clear, attractive product images and descriptions.</li>
            <li>Respond quickly to any admin inquiries about your products.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Need Help?</h2>
          <p>Contact our support team at <strong>support@marketplace.test</strong>.</p>
          <p className="mt-4 text-gray-600 italic">Thank you for partnering with us!</p>
        </section>
      </div>
    </div>
  );
}