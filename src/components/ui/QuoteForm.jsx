import { useConfigurator } from "../../context/ConfiguratorContext";

const QuoteForm = ({ onClose }) => {
  const { size, roofStyle, windows } = useConfigurator();

  const handleSubmit = (event) => {
    event.preventDefault();
    const email = event.target.email.value;
    console.log("Quote Request:");
    console.log("Email:", email);
    console.log("Size:", `${size.width}x${size.depth}`);
    console.log("Roof Style:", roofStyle);
    console.log("Windows:", windows);
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Get a Quote</h2>
        <p className="mb-4">
          Enter your email to receive a quote for your custom shed configuration.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Send Quote
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuoteForm;
