precision mediump float;
uniform float uTime;
uniform vec3 uBaseColor;
varying vec2 vUV;
void main(){
  vec3 baseColor = uBaseColor;
  vec3 lightColor1 = mix(uBaseColor, vec3(1.0), 0.40);
  vec3 lightColor2 = mix(uBaseColor, vec3(1.0), 0.70);
  vec3 darkColor = uBaseColor * 0.80;
  vec3 shadowColor = mix(uBaseColor, vec3(0.0), 0.20);

  vec2 colorPoint1 = vec2(0.5 + 0.35 * sin(uTime * 0.50), 0.5 + 0.35 * cos(uTime * 0.40));
  vec2 colorPoint2 = vec2(0.5 + 0.35 * cos(uTime * 0.30), 0.5 + 0.35 * sin(uTime * 0.60));
  vec2 colorPoint3 = vec2(0.5 + 0.25 * sin(uTime * 0.80), 0.5 + 0.25 * cos(uTime * 0.70));
  vec2 colorPoint4 = vec2(0.5 + 0.30 * sin(uTime * 0.40), 0.5 + 0.20 * cos(uTime * 0.90));
  vec2 colorPoint5 = vec2(0.5 + 0.20 * cos(uTime * 0.60), 0.5 + 0.30 * sin(uTime * 0.50));

  float distanceToPoint1 = distance(vUV, colorPoint1);
  float distanceToPoint2 = distance(vUV, colorPoint2);
  float distanceToPoint3 = distance(vUV, colorPoint3);
  float distanceToPoint4 = distance(vUV, colorPoint4);
  float distanceToPoint5 = distance(vUV, colorPoint5);

  float weight1 = 1.0 / (distanceToPoint1 * 2.5 + 0.7);
  float weight2 = 1.0 / (distanceToPoint2 * 2.5 + 0.7);
  float weight3 = 1.0 / (distanceToPoint3 * 2.5 + 0.7);
  float weight4 = 1.0 / (distanceToPoint4 * 2.5 + 0.7);
  float weight5 = 1.0 / (distanceToPoint5 * 2.5 + 0.7);

  vec3 color = (baseColor * weight1 + lightColor1 * weight2 + lightColor2 * weight3 + darkColor * weight4 + shadowColor * weight5) / (weight1 + weight2 + weight3 + weight4 + weight5);

  vec2 specularCenter = vec2(0.5 + 0.4 * sin(uTime * 0.7), 0.5 + 0.4 * cos(uTime * 0.6));
  float specularHighlight = exp(-6.0 * pow(distance(vUV, specularCenter), 2.0));
  color += vec3(1.0) * specularHighlight * 0.3;

  // Add spherical shading
  float distanceFromCenter = distance(vUV, vec2(0.5));
  if (distanceFromCenter > 0.5) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float surfaceHeight = sqrt(1.0 - distanceFromCenter * distanceFromCenter * 4.0);
  vec3 surfaceNormal = normalize(vec3((vUV.x - 0.5) * 2.0, (vUV.y - 0.5) * 2.0, surfaceHeight));
  vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
  float diffuseLighting = max(dot(surfaceNormal, lightDirection), 0.0);
  color *= diffuseLighting * 0.7 + 0.3; // diffuse with ambient

  // Add animated mesh gradient effect
  float meshHorizontal = 0.5 + 0.5 * sin(vUV.x * 15.0 + uTime * 0.3);
  float meshVertical = 0.5 + 0.5 * sin(vUV.y * 15.0 + uTime * 0.5);
  float meshFactor = (meshHorizontal + meshVertical) * 0.5;
  color *= 0.7 + 0.3 * meshFactor;

  gl_FragColor = vec4(color, 1.0);
}
