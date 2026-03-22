import { useMemo } from "react";
import * as THREE from "three";
import { useShedTexturesContext } from "../../../context/ShedTextureContext";

const EAVE_OVERHANG = 2;
const SIDE_OVERHANG = 2;
const RAFTER_SPACING = 24;
const RAFTER_W = 2;
const RAFTER_T = 3;
const ROOF_THICKNESS = 5;
const Z_FIGHT_EPSILON = 0.15;
const END_CLEARANCE = 0.15;

/**
 * Build pent roof slab geometry from the four corner heights (profile-driven).
 * Wall corner heights define the roof BEARING (underside); thickness builds upward.
 * No rotation: the quad is in world space so slope direction is correct for all four directions.
 * Returns a BufferGeometry for the roof slab (bottom on wall tops + top + 4 sides).
 */
function buildPentRoofSlabGeometry(floorWidth, floorDepth, cornerHeights, roofThickness = ROOF_THICKNESS) {
  const halfW = floorWidth / 2 + SIDE_OVERHANG;
  const halfD = floorDepth / 2 + EAVE_OVERHANG;

  const b0 = new THREE.Vector3(-halfW, cornerHeights.frontLeft ?? 70, -halfD);
  const b1 = new THREE.Vector3(halfW, cornerHeights.frontRight ?? 70, -halfD);
  const b2 = new THREE.Vector3(halfW, cornerHeights.backRight ?? 70, halfD);
  const b3 = new THREE.Vector3(-halfW, cornerHeights.backLeft ?? 70, halfD);

  const e1 = new THREE.Vector3().subVectors(b1, b0);
  const e2 = new THREE.Vector3().subVectors(b3, b0);
  const normal = new THREE.Vector3().crossVectors(e1, e2).normalize();
  const offset = normal.clone().multiplyScalar(roofThickness);

  const t0 = b0.clone().add(offset);
  const t1 = b1.clone().add(offset);
  const t2 = b2.clone().add(offset);
  const t3 = b3.clone().add(offset);

  const positions = new Float32Array([
    b0.x, b0.y, b0.z, b1.x, b1.y, b1.z, b2.x, b2.y, b2.z, b3.x, b3.y, b3.z,
    t0.x, t0.y, t0.z, t1.x, t1.y, t1.z, t2.x, t2.y, t2.z, t3.x, t3.y, t3.z,
  ]);
  const indices = new Uint16Array([
    0, 2, 1, 0, 3, 2,
    4, 5, 6, 4, 6, 7,
    0, 1, 5, 0, 5, 4,
    1, 2, 6, 1, 6, 5,
    2, 3, 7, 2, 7, 6,
    3, 0, 4, 3, 4, 7,
  ]);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));
  geom.computeVertexNormals();
  return geom;
}

/**
 * Pent roof built from wall profile corner heights. No rotated box:
 * the slab is a quad with vertices at the four shed corners (plus overhang)
 * at their respective heights, so slope direction is correct for all four directions.
 */
const PentRoof = ({ width: floorWidth, depth: floorDepth, opacity = 1, showFraming = false, slopeDirection = "front_to_back", wallProfiles }) => {
  const { roofFelt } = useShedTexturesContext();

  const cornerHeights = wallProfiles?.cornerHeights ?? {
    frontLeft: 70,
    frontRight: 70,
    backLeft: 70,
    backRight: 70,
  };

  const roofGeometry = useMemo(
    () => buildPentRoofSlabGeometry(floorWidth, floorDepth, cornerHeights, ROOF_THICKNESS),
    [floorWidth, floorDepth, cornerHeights.frontLeft, cornerHeights.frontRight, cornerHeights.backLeft, cornerHeights.backRight]
  );

  const roofMat = useMemo(() => {
    const transparent = opacity < 1;
    const roofColor = "#2a2a2e";
    const matProps = {
      color: roofColor,
      roughness: 0.99,
      metalness: 0,
      transparent,
      opacity,
      depthWrite: !transparent,
    };
    if (!roofFelt) return <meshStandardMaterial {...matProps} />;
    const tex = roofFelt.clone();
    const spanX = floorWidth + SIDE_OVERHANG * 2;
    const spanZ = floorDepth + EAVE_OVERHANG * 2;
    tex.repeat.set(spanX / 24, spanZ / 24);
    return <meshStandardMaterial {...matProps} map={tex} />;
  }, [roofFelt, floorWidth, floorDepth, opacity]);

  const WARM_CEDAR = "#e0b890";
  const rafterMat = <meshStandardMaterial color={WARM_CEDAR} roughness={0.75} metalness={0.02} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} />;

  const halfW = floorWidth / 2 + SIDE_OVERHANG;
  const halfD = floorDepth / 2 + EAVE_OVERHANG;

  return (
    <group>
      <mesh geometry={roofGeometry} castShadow receiveShadow>
        {roofMat}
      </mesh>

      {showFraming && (() => {
        const b0 = new THREE.Vector3(-halfW, cornerHeights.frontLeft ?? 70, -halfD);
        const b1 = new THREE.Vector3(halfW, cornerHeights.frontRight ?? 70, -halfD);
        const b3 = new THREE.Vector3(-halfW, cornerHeights.backLeft ?? 70, halfD);
        const e1 = new THREE.Vector3().subVectors(b1, b0);
        const e2 = new THREE.Vector3().subVectors(b3, b0);
        const normal = new THREE.Vector3().crossVectors(e1, e2).normalize();
        const numRafters = Math.floor((floorWidth + SIDE_OVERHANG * 2) / RAFTER_SPACING) + 1;
        const rafters = [];
        for (let i = 0; i < numRafters; i++) {
          const x = -halfW + (i / Math.max(1, numRafters - 1)) * (2 * halfW);
          const t = (x + halfW) / (2 * halfW);
          const yFront = (cornerHeights.frontLeft ?? 70) + t * ((cornerHeights.frontRight ?? 70) - (cornerHeights.frontLeft ?? 70));
          const yBack = (cornerHeights.backLeft ?? 70) + t * ((cornerHeights.backRight ?? 70) - (cornerHeights.backLeft ?? 70));
          const yBearing = (yFront + yBack) / 2;
          const len = Math.sqrt((2 * halfD) ** 2 + (yBack - yFront) ** 2) - 2 * END_CLEARANCE;
          const angle = Math.atan2(yBack - yFront, 2 * halfD);
          const belowBearing = normal.clone().multiplyScalar(RAFTER_W / 2 + Z_FIGHT_EPSILON);
          const pos = new THREE.Vector3(x, yBearing, 0).sub(belowBearing);
          rafters.push(
            <mesh key={i} position={[pos.x, pos.y, pos.z]} rotation={[-angle, 0, Math.PI]} castShadow>
              <boxGeometry args={[RAFTER_T, RAFTER_W, len]} />
              {rafterMat}
            </mesh>
          );
        }
        return rafters;
      })()}
    </group>
  );
};

export default PentRoof;
