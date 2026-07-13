declare module "three-instanced-uniforms-mesh" {
  import * as THREE from "three";

  export class InstancedUniformsMesh extends THREE.InstancedMesh {
    constructor(geometry: THREE.BufferGeometry, material: THREE.Material, count: number);
    setUniformAt(
      name: string,
      index: number,
      value: number | THREE.Vector2 | THREE.Vector3 | THREE.Vector4 | THREE.Color | number[] | THREE.Matrix3 | THREE.Matrix4 | THREE.Quaternion
    ): void;
    unsetUniform(name: string): void;
  }

  export function createInstancedUniformsDerivedMaterial(baseMaterial: THREE.Material): THREE.Material;
}
