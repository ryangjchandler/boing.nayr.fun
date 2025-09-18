precision mediump float;
uniform float uTime;
uniform vec3 uBaseColor;
varying vec2 vUV;
void main(){
  vec3 c0=uBaseColor;
  vec3 c1=mix(uBaseColor,vec3(1.0),0.40);
  vec3 c2=mix(uBaseColor,vec3(1.0),0.70);
  vec3 c3=uBaseColor*0.80;
  vec3 c4=mix(uBaseColor,vec3(0.0),0.20);

  vec2 p1=vec2(0.5+0.35*sin(uTime*0.50),0.5+0.35*cos(uTime*0.40));
  vec2 p2=vec2(0.5+0.35*cos(uTime*0.30),0.5+0.35*sin(uTime*0.60));
  vec2 p3=vec2(0.5+0.25*sin(uTime*0.80),0.5+0.25*cos(uTime*0.70));
  vec2 p4=vec2(0.5+0.30*sin(uTime*0.40),0.5+0.20*cos(uTime*0.90));
  vec2 p5=vec2(0.5+0.20*cos(uTime*0.60),0.5+0.30*sin(uTime*0.50));

  float d1=distance(vUV,p1);
  float d2=distance(vUV,p2);
  float d3=distance(vUV,p3);
  float d4=distance(vUV,p4);
  float d5=distance(vUV,p5);

  float w1=1.0/(d1*2.5+0.7);
  float w2=1.0/(d2*2.5+0.7);
  float w3=1.0/(d3*2.5+0.7);
  float w4=1.0/(d4*2.5+0.7);
  float w5=1.0/(d5*2.5+0.7);

  vec3 color=(c0*w1+c1*w2+c2*w3+c3*w4+c4*w5)/(w1+w2+w3+w4+w5);

  vec2 shineCenter=vec2(0.5+0.4*sin(uTime*0.7),0.5+0.4*cos(uTime*0.6));
  float shine=exp(-6.0*pow(distance(vUV,shineCenter),2.0));
  color+=vec3(1.0)*shine*0.3;

  gl_FragColor=vec4(color,1.0);
}
