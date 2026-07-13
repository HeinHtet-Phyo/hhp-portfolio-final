varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;

uniform vec3 uColor;
uniform float uGlowPulse;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewDir);

  // Inverted fresnel for inner glow (bright in center when seen from outside)
  float fresnel = pow(1.0 - max(dot(-N, V), 0.0), 2.0);
  float innerGlow = 1.0 - fresnel;

  float alpha = innerGlow * (0.18 + uGlowPulse * 0.08);
  vec3 color = uColor * (0.7 + uGlowPulse * 0.3);

  gl_FragColor = vec4(color, alpha);
}
