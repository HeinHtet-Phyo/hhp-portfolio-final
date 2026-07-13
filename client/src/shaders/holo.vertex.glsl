varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;

  vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
  vNormal = worldNormal;

  vec3 cameraWorldPos = (inverse(viewMatrix) * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vViewDir = normalize(cameraWorldPos - worldPos.xyz);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
