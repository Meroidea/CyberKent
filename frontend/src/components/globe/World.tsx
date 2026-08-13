import { useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, Color, Fog, MeshPhongMaterial, Scene } from "three";
import ThreeGlobe from "three-globe";
import countries from "@/data/countries.json";
import { SCAN_ARCS, type Arc, type GlobePalette } from "@/components/globe/globeData";

const RING_PROPAGATION_SPEED = 3;
const ARC_DASH_ANIMATE_TIME = 1400;

/** Endpoints deduplicated to one marker each, so overlapping arcs share a dot. */
function markerPoints(arcs: Arc[], palette: GlobePalette) {
  const seen = new Map<string, { lat: number; lng: number; color: string }>();

  for (const arc of arcs) {
    for (const end of [
      { lat: arc.startLat, lng: arc.startLng },
      { lat: arc.endLat, lng: arc.endLng },
    ]) {
      const key = `${end.lat.toFixed(3)},${end.lng.toFixed(3)}`;
      if (!seen.has(key)) {
        seen.set(key, { ...end, color: arc.color });
      }
    }
  }

  return [...seen.values()].map((point) => ({ ...point, color: point.color || palette.arcColors[0] }));
}

interface GlobeProps {
  palette: GlobePalette;
  /** Scanning runs the arcs and rings hot; idle is slow and ambient. */
  scanning: boolean;
  autoRotateSpeed: number;
}

/**
 * `three-globe` is an imperative Object3D, so it is constructed once and handed
 * to R3F as a `<primitive>`. Going through `extend()` would buy nothing here
 * and costs a global JSX augmentation.
 */
function Globe({ palette, scanning, autoRotateSpeed }: GlobeProps) {
  const [globe] = useState(() => new ThreeGlobe());
  const arcs = useMemo(() => SCAN_ARCS(palette), [palette]);
  const points = useMemo(() => markerPoints(arcs, palette), [arcs, palette]);

  // Static geometry: built once per palette, never per frame.
  useEffect(() => {
    const material = globe.globeMaterial() as MeshPhongMaterial;
    material.color = new Color(palette.globeColor);
    material.emissive = new Color(palette.emissive);
    material.emissiveIntensity = palette.emissiveIntensity;
    material.shininess = palette.shininess;

    globe
      .hexPolygonsData((countries as { features: object[] }).features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.72)
      .hexPolygonColor(() => palette.hexPolygonColor)
      .showAtmosphere(true)
      .atmosphereColor(palette.atmosphereColor)
      .atmosphereAltitude(palette.atmosphereAltitude);
  }, [globe, palette]);

  // Arcs, markers and rings — restarted when the scan state flips.
  useEffect(() => {
    globe
      .arcsData(arcs)
      .arcStartLat((d) => (d as Arc).startLat)
      .arcStartLng((d) => (d as Arc).startLng)
      .arcEndLat((d) => (d as Arc).endLat)
      .arcEndLng((d) => (d as Arc).endLng)
      .arcColor((d: object) => (d as Arc).color)
      .arcAltitude((d) => (d as Arc).arcAlt)
      .arcStroke(scanning ? 0.55 : 0.32)
      .arcDashLength(scanning ? 0.85 : 0.55)
      .arcDashInitialGap((d) => (d as Arc).order)
      .arcDashGap(scanning ? 6 : 14)
      .arcDashAnimateTime(scanning ? ARC_DASH_ANIMATE_TIME * 0.55 : ARC_DASH_ANIMATE_TIME)
      .arcsTransitionDuration(0);

    globe
      .pointsData(points)
      .pointColor((d) => (d as { color: string }).color)
      .pointsMerge(true)
      .pointAltitude(0)
      .pointRadius(scanning ? 0.3 : 0.22);

    globe
      .ringColor(() => palette.arcColors[0])
      .ringMaxRadius(scanning ? 4 : 2.6)
      .ringPropagationSpeed(RING_PROPAGATION_SPEED)
      .ringRepeatPeriod((ARC_DASH_ANIMATE_TIME * (scanning ? 0.55 : 1)) / 3);
  }, [globe, arcs, points, palette, scanning]);

  /*
   * Rings are pulsed on an interval rather than bound to the full point set:
   * `three-globe` restarts every ring whenever `ringsData` changes identity, so
   * feeding it a rotating subset is what makes the pulses look scattered.
   */
  useEffect(() => {
    const period = scanning ? 900 : 2200;
    const pulse = () => {
      const count = scanning ? 5 : 2;
      const picked = [...points].sort(() => Math.random() - 0.5).slice(0, count);
      globe.ringsData(picked);
    };

    pulse();
    const timer = window.setInterval(pulse, period);
    return () => window.clearInterval(timer);
  }, [globe, points, scanning]);

  useFrame((_, delta) => {
    globe.rotation.y += autoRotateSpeed * delta;
  });

  return <primitive object={globe} />;
}

/**
 * A soft radial falloff, painted once into a texture.
 *
 * This is the ground shadow, and it is drawn rather than cast. A real shadow
 * map needs a receiver plane, and a plane with `alpha: true` behind it shows
 * its own rectangular edges through the blur pass — the artefact is worse than
 * the physics is worth on a sphere that never moves relative to its light.
 */
function shadowTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");

  if (context) {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.55)");
    gradient.addColorStop(0.75, "rgba(255,255,255,0.14)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }

  return new CanvasTexture(canvas);
}

/**
 * The shadow disc.
 *
 * Camera-facing and squashed, not laid flat on a ground plane. The camera sits
 * level with the equator, so a horizontal plane is seen edge-on: it projects to
 * a full-width band with a hard horizon line instead of a pool of shade. An
 * upright ellipse under the sphere gives the same read from this one fixed
 * viewpoint and cannot degenerate.
 */
function GroundShadow({ color, opacity }: { color: string; opacity: number }) {
  const texture = useMemo(shadowTexture, []);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0, -116, -10]} scale={[1, 0.26, 1]} renderOrder={-1}>
      <planeGeometry args={[330, 330]} />
      <meshBasicMaterial
        map={texture}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * Depth fog only. The camera's aspect is left alone — R3F keeps it in sync
 * with the canvas, and overriding it is what squashes the sphere into an
 * ellipse the moment the container is not square.
 */
function SceneRig({ fogColor }: { fogColor: string }) {
  const { scene } = useThree();

  useEffect(() => {
    (scene as Scene).fog = new Fog(fogColor, 400, 2000);
    return () => {
      (scene as Scene).fog = null;
    };
  }, [scene, fogColor]);

  return null;
}

export interface WorldProps {
  palette: GlobePalette;
  scanning?: boolean;
  /** Radians per second. */
  autoRotateSpeed?: number;
  className?: string;
}

export function World({ palette, scanning = false, autoRotateSpeed = 0.09, className }: WorldProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 330], fov: 50, near: 100, far: 1800 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        /* Capped: the globe is ambient, and a 3-DPR canvas is a phone heater. */
        dpr={[1, 1.75]}
      >
        <SceneRig fogColor={palette.globeColor} />

        {/*
         * A three-point rig rather than flat lighting. The key carves the
         * terminator that makes a sphere read as a sphere, the fill keeps the
         * dark side from clipping to black, and the rim traces the far edge so
         * the silhouette separates from the page behind it.
         */}
        <ambientLight color={palette.ambientLight} intensity={palette.ambientIntensity} />
        <directionalLight
          color={palette.keyLight}
          position={[-260, 220, 320]}
          intensity={palette.keyIntensity * (scanning ? 1.15 : 1)}
        />
        <directionalLight color={palette.fillLight} position={[300, -80, 180]} intensity={palette.fillIntensity} />
        <pointLight
          color={palette.rimLight}
          position={[180, 140, -320]}
          intensity={palette.rimIntensity * (scanning ? 1.35 : 1)}
          distance={1400}
        />

        <Globe palette={palette} scanning={scanning} autoRotateSpeed={autoRotateSpeed} />

        {/*
         * Ground shadow. The sphere casts nothing on its own — there is no
         * floor in the scene — so this is the only cue that puts it *above*
         * something rather than pasted onto the page.
         */}
        <GroundShadow color={palette.shadowColor} opacity={palette.shadowOpacity} />
      </Canvas>
    </div>
  );
}

export default World;
