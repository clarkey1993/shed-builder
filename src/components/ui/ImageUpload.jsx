export default function ImageUpload({ onImageUpload }) {
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => onImageUpload(ev.target?.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <h4 className="section-heading">Garden Preview</h4>
      <label
        htmlFor="dropzone-file"
        className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all"
      >
        <div className="flex flex-col items-center justify-center py-4">
          <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-600"><span className="font-medium">Upload</span> garden image</p>
          <p className="text-xs text-gray-500 mt-0.5">PNG, JPG</p>
        </div>
        <input id="dropzone-file" type="file" className="hidden" onChange={handleChange} accept="image/*" />
      </label>
    </div>
  );
}
