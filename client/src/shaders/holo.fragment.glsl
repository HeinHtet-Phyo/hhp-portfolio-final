varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;

uniform vec3 uColor;       // base holo color (white/silver)
uniform vec3 uRimColor;    // rim glow color
uniform float uRimPower;   // fresnel exponent
uniform float uRimStrength;
uniform float uOpacity;
uniform float uGlowPulse;  // 0..1 animated pulse
uniform vec3 uLightDir;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewDir);

  // Fresnel rim — bright at silhouette edges
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), uRimPower);

  // Multi-directional lighting so ALL faces are lit
  float diffTop    = max(dot(N, normalize(vec3(0.5, 1.0, 0.8))), 0.0) * 0.5;
  float diffFront  = max(dot(N, normalize(vec3(0.0, 0.0, 1.0))), 0.0) * 0.4;
  float diffBottom = max(dot(N, normalize(vec3(0.0, -1.0, 0.3))), 0.0) * 0.35;
  float diffLeft   = max(dot(N, normalize(vec3(-1.0, 0.2, 0.3))), 0.0) * 0.25;

  // Strong ambient so no face is ever black
  float ambient = 0.35;

  // Specular
  vec3 H = normalize(normalize(uLightDir) + V);
  float spec = pow(max(dot(N, H), 0.0), 40.0) * 0.35;

  // Total lighting
  float lighting = ambient + diffTop + diffFront + diffBottom + diffLeft + spec;

  // Base color — always visible
  vec3 baseColor = uColor * lighting;

  // Rim glow on top
  vec3 rimGlow = uRimColor * fresnel * uRimStrength * (0.85 + uGlowPulse * 0.15);

  vec3 finalColor = baseColor + rimGlow;

  // Opacity: solid enough to see the full brain shape
  float alpha = uOpacity + fresnel * 0.4;
  alpha = clamp(alpha, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, alpha);
}
