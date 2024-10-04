
varying vec2 vMYUv;

uniform vec2 uvOffset;

void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    vMYUv = uv + uvOffset;
}