import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import Shed from "./components/shed/Shed";
import Sidebar from "./components/ui/Sidebar";
import { useState } from "react";
import Background from "./components/shed/Background";
import Dimensions from "./components/shed/Dimensions";
import QuoteForm from "./components/ui/QuoteForm";
import StudioFloor from "./components/shed/StudioFloor";
import StudioBackdrop from "./components/shed/StudioBackdrop";
import SceneEffects from "./components/shed/SceneEffects";
import CameraController from "./components/shed/CameraController";
import DebugDimensionLabels from "./components/shed/DebugDimensionLabels";
import { ShedTextureProvider } from "./context/ShedTextureContext";
import DebugToggle from "./components/ui/DebugToggle";

const CAMERA_POSITION = [12, 1.2, 12];

function App() {
  const [imageUrl, setImageUrl] = useState(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <header className="flex-shrink-0 h-14 px-6 flex items-center border-b border-gray-100 bg-white">
        <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Shed Configurator</h1>
      </header>

      <main className="flex-1 flex min-h-0">
        <Sidebar onImageUpload={setImageUrl} onGetQuote={() => setShowQuoteForm(true)} />

        <div className="flex-1 min-w-0 flex items-center justify-center p-6 lg:p-10">
          <div
            className="w-full h-full max-h-[calc(100vh-7rem)] rounded-2xl overflow-hidden bg-[#F5F5F5]"
            style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}
          >
            <Canvas
              camera={{ position: CAMERA_POSITION, fov: 45 }}
              className={`w-full h-full ${imageUrl ? "bg-transparent" : ""}`}
              style={{ background: imageUrl ? "transparent" : "#EBE8E0" }}
              shadows
            >
              <ShedTextureProvider>
                <color attach="background" args={["#EBE8E0"]} />
                <Environment preset="sunset" background={false} />
                <ambientLight intensity={0.12} />
                <directionalLight
                  position={[15, 20, 10]}
                  intensity={1.4}
                  castShadow
                  shadow-mapSize-width={2048}
                  shadow-mapSize-height={2048}
                  shadow-camera-far={50}
                  shadow-camera-left={-15}
                  shadow-camera-right={15}
                  shadow-camera-top={15}
                  shadow-camera-bottom={-15}
                  shadow-bias={-0.0002}
                />
                <StudioBackdrop hideForBackground={!!imageUrl} />
                <Shed />
                <Dimensions />
                <DebugDimensionLabels />
                <StudioFloor hideForBackground={!!imageUrl} />
                <ContactShadows
                  position={[0, -0.01, 0]}
                  opacity={0.25}
                  scale={25}
                  blur={3}
                  far={8}
                  color="#1a1a1a"
                />
                {imageUrl && <Background imageUrl={imageUrl} />}
                {!imageUrl && <SceneEffects />}
              </ShedTextureProvider>
              <CameraController />
            </Canvas>
          </div>
        </div>
      </main>

      <footer className="flex-shrink-0 h-9 px-6 flex items-center justify-center gap-6 border-t border-gray-100 bg-white text-xs text-gray-500">
        <span>Drag to rotate · Scroll to zoom</span>
        <DebugToggle />
      </footer>

      {showQuoteForm && <QuoteForm onClose={() => setShowQuoteForm(false)} />}
    </div>
  );
}

export default App;
