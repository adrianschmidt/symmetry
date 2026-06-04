export interface Vec2 { x: number; y: number; }

export type MotifKind =
  | "triangle" | "square" | "pentagon" | "hexagon" | "petal" | "diamond";

export const MOTIF_KINDS: MotifKind[] =
  ["triangle", "square", "pentagon", "hexagon", "petal", "diamond"];

/** Symmetry-independent appearance of a motif, shared by every instance in a layer. */
export interface MotifAttributes {
  kind: MotifKind;
  hue: number;        // 0..360
  spin: number;       // radians, the motif's own rotation on top of its outward orientation
  scale: number;      // multiplier, ~0.5..1.5
  mirrored: boolean;  // chirality flip authored into the motif
}

export type GroupType = "cyclic" | "dihedral"; // C_n (rotation) | D_n (rotation + mirror)

/** One concentric ring: a motif repeated `count` times around the shared center. */
export interface Layer {
  radius: number;     // distance of motif centers from the pattern center
  count: number;      // n: orbit size (number of repetitions)
  group: GroupType;
  phase: number;      // starting angular offset, radians
  motif: MotifAttributes;
}

export interface Pattern {
  center: Vec2;
  radius: number;     // overall pattern radius (largest layer radius + margin)
  layers: Layer[];
}

/** A concrete placed motif. `attributes` may be canonical or corrupted. */
export interface Instance {
  layerIndex: number;
  index: number;          // 0..count-1 within the layer
  position: Vec2;
  baseAngle: number;      // angular position around the center, radians
  mirroredBySym: boolean; // dihedral groups mirror alternate instances
  attributes: MotifAttributes;
}

export type Axis = "hue" | "spin" | "scale" | "kind" | "mirrored";

export const ALL_AXES: Axis[] = ["hue", "spin", "scale", "kind", "mirrored"];

/** Records a corrupted instance and the canonical attributes that repair it. */
export interface Defect {
  layerIndex: number;
  index: number;
  axes: Axis[];
  canonical: MotifAttributes;
}

export interface GenConfig {
  layerCount: [number, number];   // inclusive range
  countChoices: number[];         // allowed n values per layer
  scale: [number, number];        // motif scale range
  kinds: MotifKind[];             // allowed shapes
  dihedralChance: number;         // 0..1 probability a layer is dihedral
}

export interface CorruptConfig {
  defectCount: [number, number];  // inclusive range
  axesPerDefect: [number, number];// inclusive range
  hueDelta: [number, number];     // min..max degrees of hue perturbation
  spinDelta: [number, number];    // min..max radians of spin perturbation
  scaleDelta: [number, number];   // min..max additive scale perturbation
}
