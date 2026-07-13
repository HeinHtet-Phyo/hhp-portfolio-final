varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;

uniform vec3 uColor;
uniform float uGlowPulse;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewDir);

  // Inner glow — visible from all angles
  float fresnel = pow(1.0 - max(dot(-N, V), 0.0), 1.5);
  float innerGlow = 1.0 - fresnel;

  // Strong base alpha so the full brain shape is always visible
  float alpha = 0.18 + innerGlow * (0.28 + uGlowPulse * 0.12);
  vec3 color = uColor * (0.85 + uGlowPulse * 0.15);

  gl_FragColor = vec4(color, alpha);
}
