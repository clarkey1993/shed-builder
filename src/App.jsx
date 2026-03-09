import { Canvas } from "@react-three/fiber";
import { OrbitControls, Plane } from "@react-three/drei";
import Shed from "./components/shed/Shed";
import Sidebar from "./components/ui/Sidebar";
import { useState } from "react";
import Background from "./components/shed/Background";
import Dimensions from "./components/shed/Dimensions";
import QuoteForm from "./components/ui/QuoteForm";

function App() {
  const [imageUrl, setImageUrl] = useState(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  return (
    <div className="w-full h-screen grid grid-cols-[24rem_1fr]">
      <Sidebar
        onImageUpload={setImageUrl}
        onGetQuote={() => setShowQuoteForm(true)}
      />
      <Canvas
        camera={{ position: [8, 4, 12], fov: 60 }}
        className={imageUrl ? "bg-transparent" : "bg-gray-200"}
        shadows
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 20, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <Shed />
        <Dimensions />
        <Plane args={[100, 100]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <meshStandardMaterial
            color="#8f9779"
            transparent
            opacity={imageUrl ? 0 : 1}
          />
        </Plane>
        {imageUrl && <Background imageUrl={imageUrl} />}
        <OrbitControls makeDefault />
      </Canvas>
      {showQuoteForm && <QuoteForm onClose={() => setShowQuoteForm(false)} />}
    </div>
  );
}

export default App;
