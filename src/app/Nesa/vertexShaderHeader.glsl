attribute highp  float ballIndex;
attribute float ballSections;
attribute vec3 ballCenters;
varying float vBallIndex;

varying vec3 vBallCenters;

varying float zPosition;

uniform vec3 selection;
uniform float touchRadius;
uniform float touchEffect;

uniform float scroll;
uniform float ballScroll;


uniform float visibleLayer;
uniform float selectionTime;
uniform float sectionSelection[6];

uniform float waveStrength;

//float sectionSelection[6];

uniform float time;
varying vec2 vBallT;

float rand(float n)
{
    return fract(sin(n) * 43758.5453123);
    }


float noise(float p){
	float fl = floor(p);
  float fc = fract(p);
	return mix(rand(fl), rand(fl + 1.0), fc);
}



float randx(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(randx(ip),randx(ip+vec2(1.0,0.0)),u.x),
		mix(randx(ip+vec2(0.0,1.0)),randx(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}