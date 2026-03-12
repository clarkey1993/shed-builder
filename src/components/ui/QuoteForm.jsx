import { useConfigurator } from "../../context/ConfiguratorContext";

export default function QuoteForm({ onClose }) {
  const { size, roofStyle, windows } = useConfigurator();

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    console.log("Quote:", { email, size: `${size.width}x${size.depth}`, roofStyle, windows });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Get a Quote</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter your email to receive a quote for your custom shed.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#2A7F7F]/30 focus:border-[#2A7F7F] outline-none transition-all"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Send Quote
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
