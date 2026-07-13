varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;

uniform vec3 uColor;       // base holo color (white/silver)
uniform vec3 uRimColor;    // rim glow color
uniform float uRimPower;   // fresnel exponent (higher = tighter rim)
uniform float uRimStrength;
uniform float uOpacity;
uniform float uGlowPulse;  // 0..1 animated pulse

// Key light direction (top-right)
uniform vec3 uLightDir;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewDir);

  // Fresnel rim — bright at silhouette edges
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), uRimPower);

  // Diffuse lighting from key light
  float diff = max(dot(N, normalize(uLightDir)), 0.0);
  // Specular highlight
  vec3 H = normalize(normalize(uLightDir) + V);
  float spec = pow(max(dot(N, H), 0.0), 64.0);

  // Base color: dark interior, bright on lit faces
  vec3 baseColor = uColor * (0.08 + diff * 0.55 + spec * 0.5);

  // Rim glow
  vec3 rimGlow = uRimColor * fresnel * uRimStrength * (0.85 + uGlowPulse * 0.15);

  // Combine
  vec3 finalColor = baseColor + rimGlow;

  // Opacity: more transparent in center, more opaque at rim
  float alpha = uOpacity + fresnel * 0.35;
  alpha = clamp(alpha, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, alpha);
}
