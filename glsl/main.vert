precision mediump float;
attribute vec2 aPosition;
uniform vec2 uResolution;
varying vec2 vUV;
void main(){
  float aspect=uResolution.x/uResolution.y;
  vec2 pos=aPosition;
  pos.y*=aspect;
  gl_Position=vec4(pos,0.0,1.0);
  vUV=pos*0.5+0.5;
}
